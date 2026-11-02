// Supabase session, profile and guest mode. Load after the supabase-js script.
// The map and the other pages open without an account. Sign-in is only for actions that save data.
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
    state.leaderError = !!l.error;
    if (!l.error) state.leaderships = l.data || [];
  }

  async function clearMyPlans() {
    const { data: old } = await state.sb.from('event_plans').select('image_path').eq('user_id', state.user.id);
    const { error } = await state.sb.from('event_plans').delete().eq('user_id', state.user.id);
    const paths = (old || []).map((r) => r.image_path).filter(Boolean);
    if (!error && paths.length) await state.sb.storage.from('society-images').remove(paths);
    return { error };
  }

  async function refresh(session) {
    // A failed leader query keeps the last answer for the same user, so the Event button does not vanish.
    const sameUser = !!(state.user && session && state.user.id === session.user.id);
    state.user = session ? session.user : null;
    state.profile = null;
    state.leaderError = false;
    if (!sameUser) state.leaderships = [];
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

  const ready = init();

  return {
    ready,
    get configured() { return !!state.sb; },
    get user() { return state.user; },
    get profile() { return state.profile; },
    get leaderships() { return state.leaderships; },
    get leaderError() { return state.leaderError; },
    get isGuest() { return !state.user; },
    onChange(cb) { listeners.push(cb); },

    async signUp({ email, password, displayName, societyId }) {
      const { data, error } = await state.sb.auth.signUp({
        email, password,
        options: { data: { display_name: displayName, leader_society_id: societyId || null, consent_at: new Date().toISOString() } },
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
    async changePassword(newPassword) {
      const { error } = await state.sb.auth.updateUser({ password: newPassword });
      return { error };
    },
    // Everything stored about the logged-in user, for the privacy section and "Download my data".
    async exportMyData() {
      const id = state.user.id;
      const [follows, plans, leaders] = await Promise.all([
        state.sb.from('follows').select('created_at, societies(name)').eq('user_id', id),
        state.sb.from('event_plans').select('*').eq('user_id', id),
        state.sb.from('society_leaders').select('status, created_at, societies(name)').eq('user_id', id),
      ]);
      const failed = follows.error || plans.error || leaders.error;
      if (failed) throw failed;
      return {
        account: {
          email: state.user.email,
          display_name: state.profile && state.profile.display_name,
          role: state.profile && state.profile.role,
          signed_up: state.user.created_at,
          consent_at: state.user.user_metadata && state.user.user_metadata.consent_at,
        },
        followed_societies: follows.data,
        event_plans: plans.data,
        leader_requests: leaders.data,
      };
    },
    // Contact the developers. Guests may send too (user_id stays empty); `replyEmail` is optional.
    async sendFeedback({ kind, message, replyEmail }) {
      const { error } = await state.sb.from('feedback').insert({
        user_id: state.user ? state.user.id : null, kind, message, reply_email: replyEmail || null,
      });
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
    async unfollowMany(societyIds) {
      const { error } = await state.sb.from('follows').delete().eq('user_id', state.user.id).in('society_id', societyIds);
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
    // Admin only (row-level security returns nothing for anyone else): newest feedback first.
    async listFeedback() {
      const cols = 'id, kind, message, reply_email, created_at, profiles(display_name)';
      const q = (c) => state.sb.from('feedback').select(c).order('created_at', { ascending: false }).limit(100);
      let { data, error } = await q(cols + ', resolved_at');
      if (error) ({ data, error } = await q(cols)); // resolved_at column not added yet
      if (error) throw error;
      return data;
    },
    // Admin only: mark a message done, or reopen it.
    async setFeedbackDone(id, done) {
      const { data, error } = await state.sb.from('feedback')
        .update({ resolved_at: done ? new Date().toISOString() : null }).eq('id', id).select('id');
      return { error: error || (data && data.length ? null : new Error('Could not save.')) };
    },
    // Admin only: status is 'approved' or 'rejected'.
    async setLeaderStatus(id, status) {
      return state.sb.from('society_leaders').update({ status }).eq('id', id);
    },
    // Campus codes such as 12WW are the street abbreviation. Show the full address instead.
  // Macquarie's own signage uses "12 Wally's Walk", with a building name in brackets when it has one.
  fullBuildingName(name) {
    const street = {
      GR: 'Gymnasium Road', HA: 'Hadenfeld Avenue', SCO: 'Sir Christopher Ondaatje Avenue',
      WW: "Wally's Walk", MW: 'Macquarie Walk', SW: 'Second Way', ARPD: 'Research Park Drive',
      RPD: 'Research Park Drive', ER: 'Eastern Road', FW: 'First Walk', UA: 'University Avenue',
      CC: 'Central Courtyard', IR: 'Innovation Road', TP: 'Technology Place', SR: 'Science Road',
      TR: 'Talavera Road', LR: 'Link Road',
    };
    const proper = {
      '10GR': 'Macquarie University Sport and Aquatic Centre', '12WW': 'Mitchell Building',
      '14FW': 'Macquarie University Special Education Centre', '16MW': 'Waranara Library',
      '16UA': 'Australian Hearing Hub', '16WW': 'Lincoln Building',
      '17WW': 'Michael Kirby Law Building', '18WW': 'Service Connect',
      '1WW': 'Ainsworth Building', '21WW': 'Macquarie Theatre', '23WW': 'Price Theatre',
      '27WW': 'Lotus Theatre', '8HA': 'Macquarie University Incubator', '8LR': 'Banksia Cottage',
    };
    const coded = name && name.match(/^(\d+)([A-Z]+)(?: \((.+)\))?$/);
    if (!coded || !street[coded[2]]) return name;
    const title = proper[coded[1] + coded[2]] || coded[3] || '';
    return title ? `${coded[1]} ${street[coded[2]]} (${title})` : `${coded[1]} ${street[coded[2]]}`;
  },
  // Events in the shape the UI uses; `time` is display text, `timeValue` is HH:MM for forms.
    async listEvents() {
      const cols = 'id, society_id, title, category, event_date, event_time, building, description';
      const order = (q) => q.order('event_date').order('event_time');
      let { data, error } = await order(state.sb.from('events').select(cols + ', image_path, eco_tags'));
      if (error) ({ data, error } = await order(state.sb.from('events').select(cols + ', image_path'))); // eco_tags column not added yet
      if (error) ({ data, error } = await order(state.sb.from('events').select(cols))); // image_path column not added yet
      if (error) throw error;
      return data.map((e) => {
        const [h, m] = e.event_time ? e.event_time.split(':').map(Number) : [null, null];
        return {
          id: e.id, societyId: e.society_id, name: e.title, category: e.category, date: e.event_date,
          timeValue: e.event_time ? e.event_time.slice(0, 5) : '',
          time: h === null ? '' : `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`,
          building: this.fullBuildingName(e.building) || 'TBC', description: e.description,
          imageUrl: e.image_path ? posterUrl(e.image_path) : '', ecoTags: e.eco_tags || [],
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
      if (ev.ecoTags) row.eco_tags = ev.ecoTags;
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
          timeValue: e.plan_time ? e.plan_time.slice(0, 5) : '',
          time: h === null ? '' : `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`,
          building: this.fullBuildingName(e.building) || 'TBC', description: e.description,
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
      return clearMyPlans();
    },
    // Removes the account (plans and photos first, then the delete_my_account database function) and signs out.
    async deleteAccount() {
      const c = await clearMyPlans();
      if (c.error) return { error: c.error };
      const { error } = await state.sb.rpc('delete_my_account');
      if (error) return { error };
      setGuest(false);
      try { await state.sb.auth.signOut(); } catch (e) { /* session already gone */ }
      return { error: null };
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
      let local = [];
      try { local = await api('/societies'); } catch (e) { local = []; }
      let remote = [];
      if (state.sb) {
        const cols = 'id, name, category, description, building, contact, website';
        let { data, error } = await state.sb.from('societies').select(cols + ', hashtags').order('name');
        if (error) ({ data } = await state.sb.from('societies').select(cols).order('name')); // hashtags column not added yet
        remote = data || [];
      }
      if (!local.length) return remote.map((s) => ({ ...s, building: this.fullBuildingName(s.building) }));
      const byName = new Map(remote.map((s) => [s.name, s]));
      return local.map((s) => {
        const row = byName.get(s.name);
        const building = this.fullBuildingName(s.building);
        if (!row) return { ...s, building };
        return {
          ...s,
          id: row.id,
          building,
          hashtags: row.hashtags && row.hashtags.length ? row.hashtags : s.hashtags,
        };
      });
    },
    // Logged in users ask to lead a society. It starts pending until an admin approves it.
    // On error, error.userMessage is an English i18n key.
    async requestLeadership(societyId) {
      const { error } = await state.sb.from('society_leaders').insert({ user_id: state.user.id, society_id: societyId, status: 'pending' });
      if (error && error.code === '23505') {
        // A rejected request can be sent again; a pending or approved one cannot.
        const again = await state.sb.from('society_leaders').update({ status: 'pending' })
          .eq('user_id', state.user.id).eq('society_id', societyId).eq('status', 'rejected').select('id');
        if (!again.error && again.data && again.data.length) {
          await loadUserData();
          listeners.forEach((cb) => cb());
          return { error: null };
        }
      }
      if (error) {
        console.error(error);
        const key = error.code === '23505' ? 'You already asked to lead this society.' : 'Could not save.';
        return { error: Object.assign(new Error(key), { userMessage: key }) };
      }
      await loadUserData();
      listeners.forEach((cb) => cb());
      return { error: null };
    },
    // Society transparency: { societyId: [display names] } of approved leaders. Returns {} until the SQL function exists.
    async listPublicLeaders() {
      if (!state.sb) return {};
      const { data, error } = await state.sb.rpc('public_society_leaders');
      if (error) { console.error(error); return {}; }
      const map = {};
      (data || []).forEach((r) => { (map[r.society_id] = map[r.society_id] || []).push(r.display_name); });
      return map;
    },
    // `tags` is an array of clean tags (see parseHashtags). Leaders may change only this column.
    async updateSocietyHashtags(societyId, tags) {
      const { data, error } = await state.sb.from('societies').update({ hashtags: tags }).eq('id', societyId).select('id');
      return { error: error || (data && data.length ? null : new Error('Could not save.')) };
    },
  };
})();
