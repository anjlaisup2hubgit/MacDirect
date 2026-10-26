// Supabase session, profile and guest mode. Load after the supabase-js script.
// Pages without a session and without guest mode are sent to /login.html.
const auth = (function () {
  const GUEST_KEY = 'imcq-guest';
  const state = { sb: null, user: null, profile: null, leaderships: [] };
  const listeners = [];

  const IMAGE_EXTS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  // English i18n key describing what is wrong with an image file, or '' when it is fine.
  const imageError = (file) => {
    if (!file || !IMAGE_EXTS[file.type]) return 'Choose a JPEG, PNG or WebP image.';
    return file.size > 5 * 1024 * 1024 ? 'The image must be 5 MB or smaller.' : '';
  };
  const posterUrl = (path) => state.sb.storage.from('society-images').getPublicUrl(path).data.publicUrl;

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
    // dialog with the given message (an English key in i18n.js) and returns false.
    requireLogin(message) {
      if (state.user) return true;
      const d = document.createElement('dialog');
      d.className = 'login-prompt';
      d.innerHTML = `<p>${t(message)}.</p><div>` +
        `<button class="form-submit" type="button" data-go>${t('Log in or sign up')}</button>` +
        `<button class="auth-guest" type="button" data-close>${t('Not now')}</button></div>`;
      d.addEventListener('click', (e) => {
        if (e.target.dataset.go !== undefined) location.href = '/login.html';
        if (e.target.dataset.close !== undefined) d.close();
      });
      d.addEventListener('close', () => d.remove());
      document.body.appendChild(d);
      d.showModal();
      return false;
    },
    async updateDisplayName(name) {
      let { data, error } = await state.sb.from('profiles').update({ display_name: name }).eq('id', state.user.id).select();
      if (!error && (!data || !data.length)) error = new Error('Could not save your display name.');
      if (!error) {
        state.profile = { ...state.profile, display_name: name };
        listeners.forEach((cb) => cb());
      }
      return { error };
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
    // Admin only (row-level security returns nothing for anyone else): pending leader requests, oldest first.
    async listLeaderRequests() {
      const { data, error } = await state.sb.from('society_leaders')
        .select('id, created_at, profiles(display_name), societies(name)').eq('status', 'pending').order('created_at');
      if (error) throw error;
      return data;
    },
    // Admin only: status is 'approved' or 'rejected'.
    async setLeaderStatus(id, status) {
      return state.sb.from('society_leaders').update({ status }).eq('id', id);
    },
    // Events in the shape the UI uses; `time` is display text, `timeValue` is HH:MM for forms.
    async listEvents() {
      const cols = 'id, society_id, title, category, event_date, event_time, building, description';
      const order = (q) => q.order('event_date').order('event_time');
      let { data, error } = await order(state.sb.from('events').select(cols + ', image_path'));
      if (error) ({ data, error } = await order(state.sb.from('events').select(cols))); // image_path column not added yet
      if (error) throw error;
      return data.map((e) => {
        const [h, m] = e.event_time ? e.event_time.split(':').map(Number) : [null, null];
        return {
          id: e.id, societyId: e.society_id, name: e.title, category: e.category, date: e.event_date,
          timeValue: e.event_time ? e.event_time.slice(0, 5) : '',
          time: h === null ? '' : `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`,
          building: e.building || 'TBC', description: e.description,
          imageUrl: e.image_path ? posterUrl(e.image_path) : '',
        };
      });
    },
    // `ev` uses the form fields; pass `id` to update an existing event.
    // `file` is an optional poster image; `ev.removeImage` drops the current one.
    async saveEvent(ev, file) {
      const row = {
        society_id: ev.societyId, title: ev.name, category: ev.category, event_date: ev.date,
        event_time: ev.time || null, building: ev.building || null, description: ev.description,
      };
      const bucket = state.sb.storage.from('society-images');
      let path = null;
      if (file) {
        const key = imageError(file);
        if (key) return { error: Object.assign(new Error(key), { userMessage: key }) };
        path = `${ev.societyId}/events/${crypto.randomUUID()}.${IMAGE_EXTS[file.type]}`;
        const up = await bucket.upload(path, file, { contentType: file.type });
        if (up.error) return { error: up.error };
        row.image_path = path;
      } else if (ev.removeImage) {
        row.image_path = null;
      }
      let old = null;
      if (ev.id && 'image_path' in row) {
        ({ data: old } = await state.sb.from('events').select('image_path').eq('id', ev.id).maybeSingle());
      }
      const q = state.sb.from('events');
      const { error } = ev.id
        ? await q.update(row).eq('id', ev.id)
        : await q.insert({ ...row, created_by: state.user.id });
      if (error) { if (path) await bucket.remove([path]); return { error }; }
      if (old && old.image_path) await bucket.remove([old.image_path]);
      return { error: null };
    },
    async deleteEvent(id) {
      const { data: old } = await state.sb.from('events').select('image_path').eq('id', id).maybeSingle();
      const { error } = await state.sb.from('events').delete().eq('id', id);
      if (!error && old && old.image_path) await state.sb.storage.from('society-images').remove([old.image_path]);
      return { error };
    },
    // The logged-in user's private plans, in the same shape as listEvents (empty for guests).
    async listMyPlans() {
      if (!state.user) return [];
      const cols = 'id, title, category, plan_date, plan_time, building, description';
      const order = (q) => q.order('plan_date').order('plan_time');
      let { data, error } = await order(state.sb.from('event_plans').select(cols + ', image_path'));
      if (error) ({ data, error } = await order(state.sb.from('event_plans').select(cols))); // image_path column not added yet
      if (error) throw error;
      return data.map((e) => {
        const [h, m] = e.plan_time ? e.plan_time.split(':').map(Number) : [null, null];
        return {
          id: e.id, mine: true, name: e.title, category: e.category, date: e.plan_date,
          time: h === null ? '' : `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`,
          building: e.building || 'TBC', description: e.description,
          imageUrl: e.image_path ? posterUrl(e.image_path) : '',
        };
      });
    },
    // `plan` uses the form fields; `time` is HH:MM or empty. `file` is an optional photo (kept under <user id>/plans/).
    async savePlan(plan, file) {
      const row = {
        user_id: state.user.id, title: plan.name, category: plan.category, plan_date: plan.date,
        plan_time: plan.time || null, building: plan.building || null, description: plan.description,
      };
      const bucket = state.sb.storage.from('society-images');
      let path = null;
      if (file) {
        const key = imageError(file);
        if (key) return { error: Object.assign(new Error(key), { userMessage: key }) };
        path = `${state.user.id}/plans/${crypto.randomUUID()}.${IMAGE_EXTS[file.type]}`;
        const up = await bucket.upload(path, file, { contentType: file.type });
        if (up.error) return { error: up.error };
        row.image_path = path;
      }
      const { error } = await state.sb.from('event_plans').insert(row);
      if (error && path) await bucket.remove([path]);
      return { error };
    },
    async deletePlan(id) {
      const { data: old } = await state.sb.from('event_plans').select('image_path').eq('id', id).maybeSingle();
      const { error } = await state.sb.from('event_plans').delete().eq('id', id);
      if (!error && old && old.image_path) await state.sb.storage.from('society-images').remove([old.image_path]);
      return { error };
    },
    // Deletes every plan of the logged-in user (row-level security limits it to their own).
    async clearPlans() {
      const { data: old } = await state.sb.from('event_plans').select('image_path').eq('user_id', state.user.id);
      const { error } = await state.sb.from('event_plans').delete().eq('user_id', state.user.id);
      const paths = (old || []).map((r) => r.image_path).filter(Boolean);
      if (!error && paths.length) await state.sb.storage.from('society-images').remove(paths);
      return { error };
    },
    // Cover images: { societyId: public URL } for every society that has one (readable by guests).
    async listSocietyImages() {
      if (!state.sb) return {};
      const { data } = await state.sb.from('society_images').select('society_id, path');
      const map = {};
      (data || []).forEach((r) => { map[r.society_id] = state.sb.storage.from('society-images').getPublicUrl(r.path).data.publicUrl; });
      return map;
    },
    // Replaces the society's cover image. On a bad file, error.userMessage is an English i18n key.
    async uploadSocietyImage(societyId, file) {
      const key = imageError(file);
      if (key) return { error: Object.assign(new Error(key), { userMessage: key }) };
      const bucket = state.sb.storage.from('society-images');
      const path = `${societyId}/${crypto.randomUUID()}.${IMAGE_EXTS[file.type]}`;
      const up = await bucket.upload(path, file, { contentType: file.type });
      if (up.error) return { error: up.error };
      const { data: old } = await state.sb.from('society_images').select('path').eq('society_id', societyId).maybeSingle();
      const { error } = await state.sb.from('society_images')
        .upsert({ society_id: societyId, path, created_by: state.user.id }, { onConflict: 'society_id' });
      if (error) { await bucket.remove([path]); return { error }; }
      if (old && old.path !== path) await bucket.remove([old.path]);
      return { error: null, url: bucket.getPublicUrl(path).data.publicUrl };
    },
    async deleteSocietyImage(societyId) {
      const { data: old } = await state.sb.from('society_images').select('path').eq('society_id', societyId).maybeSingle();
      const { error } = await state.sb.from('society_images').delete().eq('society_id', societyId);
      if (error) return { error };
      if (old) await state.sb.storage.from('society-images').remove([old.path]);
      return { error: null };
    },
    async listSocieties() {
      if (!state.sb) return [];
      const cols = 'id, name, category, description, building, contact, website';
      let { data, error } = await state.sb.from('societies').select(cols + ', hashtags').order('name');
      if (error) ({ data } = await state.sb.from('societies').select(cols).order('name')); // hashtags column not added yet
      return data || [];
    },
    // `tags` is an array of clean tags (see parseHashtags). Leaders may change only this column.
    async updateSocietyHashtags(societyId, tags) {
      const { data, error } = await state.sb.from('societies').update({ hashtags: tags }).eq('id', societyId).select('id');
      return { error: error || (data && data.length ? null : new Error('Could not save.')) };
    },
  };
})();
