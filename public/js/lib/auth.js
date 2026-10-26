// Supabase session, profile and guest mode. Load after the supabase-js script.
// Pages without a session and without guest mode are sent to /login.html.
const auth = (function () {
  const GUEST_KEY = 'imcq-guest';
  const state = { sb: null, user: null, profile: null, leaderships: [] };
  const listeners = [];

  const isGuest = () => { try { return localStorage.getItem(GUEST_KEY) === '1'; } catch (err) { return false; } };
  function setGuest(on) {
    try { on ? localStorage.setItem(GUEST_KEY, '1') : localStorage.removeItem(GUEST_KEY); } catch (err) { console.error(err); }
  }

  // A leader request chosen at sign-up is kept in the user's metadata, because the
  // insert is only allowed once there is a session (e.g. after email confirmation).
  async function syncLeaderRequest() {
    const societyId = Number(state.user.user_metadata && state.user.user_metadata.leader_society_id);
    if (!societyId) return;
    const { error } = await state.sb.from('society_leaders')
      .upsert({ user_id: state.user.id, society_id: societyId, status: 'pending' }, { onConflict: 'user_id,society_id', ignoreDuplicates: true });
    if (error) console.error('Leader request failed', error);
  }

  async function loadUserData() {
    const [p, l] = await Promise.all([
      state.sb.from('profiles').select('display_name, role').eq('id', state.user.id).maybeSingle(),
      state.sb.from('society_leaders').select('society_id, status, societies(name)').eq('user_id', state.user.id),
    ]);
    state.profile = p.data || null;
    state.leaderships = l.data || [];
  }

  async function refresh(session) {
    state.user = session ? session.user : null;
    state.profile = null;
    state.leaderships = [];
    if (state.user) {
      setGuest(false);
      await syncLeaderRequest();
      await loadUserData();
    }
    listeners.forEach((cb) => cb());
  }

  async function init() {
    if (typeof supabase === 'undefined') return;
    const cfg = await fetch('/api/config').then((r) => r.json()).catch(() => ({}));
    if (!cfg.supabaseUrl || !cfg.supabaseKey) return;
    state.sb = supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
    const { data } = await state.sb.auth.getSession();
    await refresh(data.session);
    // Deferred: supabase-js calls made inside this callback can deadlock.
    state.sb.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION') setTimeout(() => refresh(session), 0);
    });
  }

  const ready = init().then(() => {
    const onLogin = location.pathname.endsWith('/login.html');
    if (state.sb && !state.user && !isGuest() && !onLogin) location.replace('/login.html');
  });

  return {
    ready,
    get configured() { return !!state.sb; },
    get user() { return state.user; },
    get profile() { return state.profile; },
    get leaderships() { return state.leaderships; },
    get isGuest() { return !state.user; },
    onChange(cb) { listeners.push(cb); },

    async signUp({ email, password, displayName, societyId }) {
      const { data, error } = await state.sb.auth.signUp({
        email, password,
        options: { data: { display_name: displayName, leader_society_id: societyId || null } },
      });
      return { error, needsConfirmation: !error && !data.session };
    },
    async signIn(email, password) {
      const { error } = await state.sb.auth.signInWithPassword({ email, password });
      return { error };
    },
    async signOut() {
      setGuest(false);
      if (state.sb) await state.sb.auth.signOut();
    },
    continueAsGuest() { setGuest(true); },
    // For actions that need an account: returns true when logged in, otherwise shows a
    // "Log in to <action>" dialog and returns false.
    requireLogin(action) {
      if (state.user) return true;
      const d = document.createElement('dialog');
      d.className = 'login-prompt';
      d.innerHTML = `<p>Log in to ${action}.</p><div>` +
        '<button class="form-submit" type="button" data-go>Log in or sign up</button>' +
        '<button class="auth-guest" type="button" data-close>Not now</button></div>';
      d.addEventListener('click', (e) => {
        if (e.target.dataset.go !== undefined) location.href = '/login.html';
        if (e.target.dataset.close !== undefined) d.close();
      });
      d.addEventListener('close', () => d.remove());
      document.body.appendChild(d);
      d.showModal();
      return false;
    },
    // Society ids the logged-in user follows (empty for guests).
    async myFollows() {
      if (!state.user) return [];
      const { data } = await state.sb.from('follows').select('society_id').eq('user_id', state.user.id);
      return (data || []).map((r) => r.society_id);
    },
    async setFollow(societyId, on) {
      const q = state.sb.from('follows');
      const { error } = on
        ? await q.insert({ user_id: state.user.id, society_id: societyId })
        : await q.delete().eq('user_id', state.user.id).eq('society_id', societyId);
      return { error };
    },
    // Societies the user may post events for.
    get approvedSocieties() {
      return state.leaderships.filter((l) => l.status === 'approved')
        .map((l) => ({ id: l.society_id, name: l.societies && l.societies.name }));
    },
    // Events in the shape the UI uses; `time` is display text, `timeValue` is HH:MM for forms.
    async listEvents() {
      const { data, error } = await state.sb.from('events')
        .select('id, society_id, title, category, event_date, event_time, building, description')
        .order('event_date').order('event_time');
      if (error) throw error;
      return data.map((e) => {
        const [h, m] = e.event_time ? e.event_time.split(':').map(Number) : [null, null];
        return {
          id: e.id, societyId: e.society_id, name: e.title, category: e.category, date: e.event_date,
          timeValue: e.event_time ? e.event_time.slice(0, 5) : '',
          time: h === null ? '' : `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`,
          building: e.building || 'TBC', description: e.description,
        };
      });
    },
    // `ev` uses the form fields; pass `id` to update an existing event.
    async saveEvent(ev) {
      const row = {
        society_id: ev.societyId, title: ev.name, category: ev.category, event_date: ev.date,
        event_time: ev.time || null, building: ev.building || null, description: ev.description,
      };
      const q = state.sb.from('events');
      const { error } = ev.id
        ? await q.update(row).eq('id', ev.id)
        : await q.insert({ ...row, created_by: state.user.id });
      return { error };
    },
    async deleteEvent(id) {
      const { error } = await state.sb.from('events').delete().eq('id', id);
      return { error };
    },
    async listSocieties() {
      if (!state.sb) return [];
      const { data } = await state.sb.from('societies').select('id, name, category, description, building, contact, website').order('name');
      return data || [];
    },
  };
})();
