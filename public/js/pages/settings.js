// User settings popup: display name (logged-in users, saved to profiles), language, calendar view and log out.
(function () {
  const p = createPopup({ id: 'settings-popup', title: 'Settings', navHref: '/settings.html' });
  p.results.innerHTML =
    '<div class="account"></div>' +
    '<div class="chips mode-tabs" role="group">' +
      `<button type="button" class="chip active" data-tab="general">${t('General')}</button>` +
      `<button type="button" class="chip" data-tab="name">${t('Username')}</button>` +
      `<button type="button" class="chip" data-tab="data">${t('Data')}</button>` +
      `<button type="button" class="chip" data-tab="contact">${t('Contact')}</button></div>` +
    '<div class="tab-panel" data-panel="general">' +
    '<form class="event-form">' +
      `<label>${t('Language')}<select name="lang">` +
        Object.entries(I18N_LANGS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('') + '</select></label>' +
      `<label class="view-field" hidden>${t('Calendar view')}<select name="view">` +
        `<option value="cal">${t('Month')}</option><option value="list">${t('Day')}</option></select></label>` +
      `<label class="weekstart-field" hidden>${t('Week starts on')}<select name="weekstart">` +
        `<option value="mon">${t('Monday')}</option><option value="sun">${t('Sunday')}</option></select></label>` +
      `<label class="check-field"><input type="checkbox" name="contrast"> ${t('High contrast')}</label>` +
      '<p class="form-msg" aria-live="polite" hidden></p>' +
    '</form>' +
    '</div>' +
    '<div class="tab-panel" data-panel="name" hidden>' +
    '<form class="event-form name-form" novalidate>' +
      `<label>${t('Display name')}<input name="name" maxlength="40" autocomplete="off"></label>` +
      '<p class="form-msg" aria-live="polite" hidden></p>' +
    '</form>' +
    '<form class="event-form pw-form" id="pw-form" novalidate>' +
      `<label>${t('New password')}<input type="password" name="newPassword" minlength="6" autocomplete="new-password" required></label>` +
      `<label>${t('Confirm new password')}<input type="password" name="confirmPassword" minlength="6" autocomplete="new-password" required></label>` +
      '<p class="form-msg" aria-live="polite" hidden></p>' +
    '</form>' +
    '<div class="card-actions account-actions">' +
    `<button class="follow-btn pw-btn" type="submit" form="pw-form" hidden>${t('Change password')}</button></div>` +
    '</div>' +
    '<section class="admin-requests" hidden>' +
      `<h3>${t('Leader requests')}</h3><ul class="card-list"></ul>` +
      `<p class="empty-msg" role="status" hidden>${t('No pending requests.')}</p></section>` +
    '<section class="admin-feedback" hidden>' +
      `<h3>${t('Feedback')}</h3><ul class="card-list"></ul>` +
      `<p class="empty-msg" role="status" hidden>${t('No feedback yet.')}</p></section>` +
    '<div class="tab-panel" data-panel="data" hidden>' +
    '<section class="privacy-box">' +
      `<h3>${t('Your data')}</h3>` +
      `<p class="privacy-guest">${t('You are browsing as a guest. iMCQ stores only your language choice and your guest choice in this browser. We do not store your location.')}</p>` +
      '<ul class="privacy-list" hidden></ul>' +
      '<p class="form-msg" aria-live="polite" hidden></p>' +
    '</section>' +
    '<div class="card-actions account-actions">' +
    `<button class="follow-btn" type="button" data-act="download-data" hidden>${t('Download my data')}</button>` +
    `<button class="follow-btn delete-btn" type="button" data-act="delete-account" hidden>${t('Delete account')}</button></div>` +
    '</div>' +
    '<div class="tab-panel" data-panel="contact" hidden>' +
    '<section class="contact-box">' +
      `<h3>${t('Contact the developers')}</h3>` +
      `<p>${t('Found a problem, a wrong result or something unfair? Tell us.')}</p>` +
      '<form class="event-form contact-form" novalidate>' +
        `<label>${t('What is this about?')}<select name="kind">` +
          `<option value="problem">${t('Something is broken')}</option><option value="unfair">${t('A wrong or unfair result')}</option>` +
          `<option value="privacy">${t('A privacy concern')}</option><option value="idea">${t('An idea')}</option>` +
          `<option value="other">${t('Something else')}</option></select></label>` +
        `<label>${t('Your message')}<textarea name="message" maxlength="1000" required></textarea></label>` +
        `<label>${t('Email for a reply (optional)')}<input type="email" name="email" maxlength="254" autocomplete="email"></label>` +
        `<button class="form-submit" type="submit">${t('Send')}</button>` +
        '<p class="form-msg" aria-live="polite" hidden></p>' +
      '</form>' +
    '</section>' +
    '</div>' +
    `<p class="help-link"><a href="https://students.mq.edu.au/support/personal/wellbeing" target="_blank" rel="noopener">${t('Need help?')}</a></p>` +
    '<div class="card-actions account-actions">' +
    `<button class="form-submit logout-btn" type="button" data-act="logout" hidden>${t('Log out')}</button></div>`;
  const form = p.results.querySelector('form');
  const msg = form.querySelector('.form-msg');
  const nameForm = p.results.querySelector('.name-form');
  const nameMsg = nameForm.querySelector('.form-msg');
  const tabs = p.results.querySelector('.mode-tabs');
  const panels = p.results.querySelectorAll('.tab-panel');
  const logoutBtn = p.results.querySelector('.logout-btn');
  const deleteBtn = p.results.querySelector('.delete-btn');
  const viewField = form.querySelector('.view-field');
  const weekField = form.querySelector('.weekstart-field');
  form.elements.lang.value = i18nLang();
  form.elements.contrast.checked = document.documentElement.dataset.contrast === 'high';
  try { form.elements.weekstart.value = localStorage.getItem('imcq-week-start') === 'sun' ? 'sun' : 'mon'; } catch (err) { /* storage blocked: keep Monday */ }
  try { form.elements.view.value = localStorage.getItem('imcq-cal-view') === 'list' ? 'list' : 'cal'; } catch (err) { /* storage blocked: keep Month */ }

  function flash(text, isError) {
    msg.textContent = text;
    msg.classList.toggle('error', !!isError);
    msg.hidden = false;
  }

  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('change', async (e) => {
    if (e.target.name === 'lang') {
      setLang(e.target.value);
      location.href = '/settings.html'; // reload so the page is rebuilt in the new language
    } else if (e.target.name === 'view') {
      try {
        localStorage.setItem('imcq-cal-view', e.target.value);
        flash(t('Saved.'));
        window.dispatchEvent(new Event('events-changed')); // Calendar switches to the chosen view
      } catch (err) { console.error(err); flash(t('Could not save.'), true); }
    } else if (e.target.name === 'contrast') {
      setContrast(e.target.checked);
      flash(t('Saved.'));
    } else if (e.target.name === 'weekstart') {
      try {
        localStorage.setItem('imcq-week-start', e.target.value);
        flash(t('Saved.'));
        window.dispatchEvent(new Event('events-changed')); // Calendar redraws with the chosen first day
      } catch (err) { console.error(err); flash(t('Could not save.'), true); }
    }
  });

  nameForm.addEventListener('submit', (e) => e.preventDefault());
  nameForm.addEventListener('change', async (e) => {
    const { error } = await auth.updateDisplayName(e.target.value.trim());
    nameMsg.classList.toggle('error', !!error);
    if (error) console.error(error);
    nameMsg.textContent = error ? t('Could not save.') : t('Saved.');
    nameMsg.hidden = false;
  });

  // Tabs: General, Username, Data and Contact; guests only see General and Data.
  let tab = 'general';
  function showTab() {
    if (!auth.user && (tab === 'name' || tab === 'contact')) tab = 'general';
    tabs.querySelectorAll('.chip').forEach((b) => {
      b.hidden = !auth.user && (b.dataset.tab === 'name' || b.dataset.tab === 'contact');
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    panels.forEach((el) => { el.hidden = el.dataset.panel !== tab; });
  }
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    tab = b.dataset.tab;
    showTab();
  });

  const pwForm = p.results.querySelector('.pw-form');
  const pwMsg = pwForm.querySelector('.form-msg');
  const pwSubmit = p.results.querySelector('.pw-btn');
  function pwFlash(text, isError) {
    pwMsg.textContent = text;
    pwMsg.classList.toggle('error', !!isError);
    pwMsg.hidden = false;
  }
  pwForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = pwForm.elements.newPassword.value;
    if (pw.length < 6) return pwFlash(t('Password must be at least 6 characters.'), true);
    if (pw !== pwForm.elements.confirmPassword.value) return pwFlash(t('Passwords do not match.'), true);
    pwSubmit.disabled = true;
    pwSubmit.textContent = t('Please wait...');
    const { error } = await auth.changePassword(pw);
    pwSubmit.disabled = false;
    pwSubmit.textContent = t('Change password');
    if (error) { console.error(error); pwFlash(t('Could not save.'), true); return; }
    pwForm.reset();
    pwFlash(t('Password changed.'));
  });

  // Account block: who is signed in, or a prompt to log in when browsing as a guest.
  const account = p.results.querySelector('.account');
  function roleLine() {
    if (auth.profile && auth.profile.role === 'admin') return t('Admin');
    const l = auth.leaderships[0];
    if (!l) return t('Student');
    const name = l.societies ? l.societies.name : t('a society');
    if (l.status === 'approved') return `${t('Leader of')} ${name}`;
    if (l.status === 'pending') return `${t('Leader request pending for')} ${name}`;
    return `${t('Leader request declined for')} ${name}`;
  }
  function renderAccount() {
    logoutBtn.hidden = !auth.user;
    deleteBtn.hidden = !auth.user;
    viewField.hidden = !auth.user;
    weekField.hidden = !auth.user;
    pwSubmit.hidden = !auth.user;
    renderPrivacy();
    showTab();
    if (auth.user) {
      nameForm.elements.name.value = (auth.profile && auth.profile.display_name) || '';
      const name = (auth.profile && auth.profile.display_name) || t('Signed in');
      account.innerHTML =
        `<p><strong>${esc(name)}</strong><br>${esc(auth.user.email)}</p><p>${esc(roleLine())}</p>`;
    } else {
      account.innerHTML =
        '<p>' + t('You are browsing as a guest. Following societies, the calendar and the event plan need an account.') + '</p>' +
        '<button class="form-submit" type="button" data-act="login">' + t('Log in or sign up') + '</button>';
    }
  }
  p.results.addEventListener('click', async (e) => {
    const act = e.target.dataset.act;
    if (act === 'login') location.href = '/login.html';
    if (act === 'logout') { await auth.signOut(); location.href = '/'; }
    if (act === 'delete-account') confirmDelete();
    if (act === 'download-data') downloadData();
  });

  // Privacy: list what is stored about the signed-in user and let them download it as JSON.
  const privacyBox = p.results.querySelector('.privacy-box');
  const privacyGuest = privacyBox.querySelector('.privacy-guest');
  const privacyList = privacyBox.querySelector('.privacy-list');
  const privacyMsg = privacyBox.querySelector('.form-msg');
  const downloadBtn = p.results.querySelector('[data-act="download-data"]');
  async function renderPrivacy() {
    privacyGuest.hidden = !!auth.user;
    privacyList.hidden = !auth.user;
    downloadBtn.hidden = !auth.user;
    if (!auth.user) return;
    const rows = [[t('Email'), auth.user.email], [t('Display name'), (auth.profile && auth.profile.display_name) || '-']];
    try {
      const d = await auth.exportMyData();
      rows.push([t('Societies you follow'), d.followed_societies.length], [t('Event plans'), d.event_plans.length],
        [t('Leader requests'), d.leader_requests.length]);
    } catch (err) { console.error(err); }
    rows.push([t('Location'), t('Not stored')]);
    privacyList.innerHTML = rows.map(([k, v]) => `<li>${esc(k)}: ${esc(String(v))}</li>`).join('');
  }
  async function downloadData() {
    downloadBtn.disabled = true;
    try {
      const data = await auth.exportMyData();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      a.download = 'imcq-my-data.json';
      a.click();
      URL.revokeObjectURL(a.href);
      privacyMsg.classList.remove('error');
      privacyMsg.textContent = t('Your data was downloaded.');
    } catch (err) {
      console.error(err);
      privacyMsg.classList.add('error');
      privacyMsg.textContent = t('Could not save.');
    }
    privacyMsg.hidden = false;
    downloadBtn.disabled = false;
  }

  // Contact the developers: open to guests too.
  const contactForm = p.results.querySelector('.contact-form');
  const contactMsg = contactForm.querySelector('.form-msg');
  const contactSubmit = contactForm.querySelector('.form-submit');
  function contactFlash(text, isError) {
    contactMsg.textContent = text;
    contactMsg.classList.toggle('error', !!isError);
    contactMsg.hidden = false;
  }
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = contactForm.elements.message.value.trim();
    const replyEmail = contactForm.elements.email.value.trim();
    if (!message) return contactFlash(t('Please write a message.'), true);
    if (replyEmail && !contactForm.elements.email.checkValidity()) return contactFlash(t('Enter a valid email.'), true);
    contactSubmit.disabled = true;
    contactSubmit.textContent = t('Please wait...');
    let error = null;
    try { ({ error } = await auth.sendFeedback({ kind: contactForm.elements.kind.value, message, replyEmail })); } catch (err) { error = err; }
    contactSubmit.disabled = false;
    contactSubmit.textContent = t('Send');
    if (error) { console.error(error); return contactFlash(t('Could not send. Please try again.'), true); }
    contactForm.reset();
    contactFlash(t('Thank you. Your message was sent.'));
  });

  // Deleting the account: the user must type DELETE (the word stays in English in every language).
  function confirmDelete() {
    const d = document.createElement('dialog');
    d.className = 'login-prompt';
    d.innerHTML = `<p>${t('Your follows, event plans and leader requests will be removed. Society events you posted stay. This cannot be undone.')}</p>` +
      `<p>${t('Type DELETE (in capital letters, in English) to confirm.')}</p>` +
      '<input name="confirm" autocomplete="off" autocapitalize="off" spellcheck="false">' +
      '<p class="form-msg error" aria-live="polite" hidden></p><div>' +
      '<div class="card-actions account-actions">' +
    `<button class="form-submit delete-btn" type="button" data-yes disabled>${t('Delete my account')}</button>` +
      `<button class="auth-guest" type="button" data-no>${t('Cancel')}</button></div>`;
    const input = d.querySelector('input');
    const yes = d.querySelector('[data-yes]');
    const dMsg = d.querySelector('.form-msg');
    input.addEventListener('input', () => { yes.disabled = input.value !== 'DELETE'; });
    d.addEventListener('close', () => d.remove());
    d.addEventListener('click', async (ev) => {
      if (ev.target.dataset.no !== undefined) d.close();
      if (ev.target.dataset.yes === undefined) return;
      yes.disabled = true;
      yes.textContent = t('Please wait...');
      const { error } = await auth.deleteAccount();
      if (!error) { location.href = '/'; return; }
      console.error(error);
      dMsg.textContent = String(error.message || '').includes('only admin')
        ? t('You are the only admin, so you cannot delete your account.') : t('Could not save.');
      dMsg.hidden = false;
      yes.textContent = t('Delete my account');
      yes.disabled = input.value !== 'DELETE';
    });
    document.body.appendChild(d);
    d.showModal();
  }

  // Admins approve or reject society leader requests here (replaces editing society_leaders in the dashboard).
  const adminBox = p.results.querySelector('.admin-requests');
  const reqList = adminBox.querySelector('.card-list');
  const reqEmpty = adminBox.querySelector('.empty-msg');
  let requests = [];
  async function renderRequests() {
    const isAdmin = !!(auth.profile && auth.profile.role === 'admin');
    adminBox.hidden = !isAdmin;
    if (!isAdmin) return;
    try { requests = await auth.listLeaderRequests(); } catch (err) { console.error(err); return; }
    reqList.innerHTML = requests.map((r) =>
      `<li class="card" data-id="${r.id}"><h2>${esc((r.profiles && r.profiles.display_name) || t('Student'))}</h2>` +
      `<p>${esc(t('Leader of'))} ${esc((r.societies && r.societies.name) || '')}</p>` +
      `<div class="card-actions"><button type="button" class="follow-btn" data-approve>${t('Approve')}</button>` +
      `<button type="button" class="follow-btn" data-reject>${t('Reject')}</button></div></li>`).join('');
    reqEmpty.hidden = requests.length > 0;
  }
  reqList.addEventListener('click', async (e) => {
    const approve = e.target.closest('[data-approve]');
    const reject = e.target.closest('[data-reject]');
    if (!approve && !reject) return;
    const { error } = await auth.setLeaderStatus(Number(e.target.closest('.card').dataset.id), approve ? 'approved' : 'rejected');
    if (error) { console.error(error); flash(t('Could not save.'), true); return; }
    renderRequests();
  });
  // Admins read the messages sent through Contact the developers (newest first, last 100).
  const feedbackBox = p.results.querySelector('.admin-feedback');
  const feedbackList = feedbackBox.querySelector('.card-list');
  const feedbackEmpty = feedbackBox.querySelector('.empty-msg');
  const KIND_LABELS = { problem: 'Something is broken', unfair: 'A wrong or unfair result', privacy: 'A privacy concern', idea: 'An idea', other: 'Something else' };
  async function renderFeedback() {
    const isAdmin = !!(auth.profile && auth.profile.role === 'admin');
    feedbackBox.hidden = !isAdmin;
    if (!isAdmin) return;
    let rows;
    try { rows = await auth.listFeedback(); } catch (err) { console.error(err); return; }
    rows = [...rows.filter((r) => !r.resolved_at), ...rows.filter((r) => r.resolved_at)]; // open ones first
    feedbackList.innerHTML = rows.map((r) =>
      `<li class="card${r.resolved_at ? ' feedback-done' : ''}" data-id="${r.id}" data-done="${r.resolved_at ? 1 : 0}"><h2>${esc(t(KIND_LABELS[r.kind] || 'Something else'))}${r.resolved_at ? ' · ' + esc(t('Done')) : ''}</h2>` +
      `<p class="feedback-text">${esc(r.message)}</p>` +
      `<p>${esc(new Date(r.created_at).toLocaleDateString('en-AU'))} · ${esc((r.profiles && r.profiles.display_name) || t('Guest'))}` +
      `${r.reply_email ? ' · ' + esc(r.reply_email) : ''}</p>` +
      `<div class="card-actions"><button type="button" class="follow-btn" data-toggle>${t(r.resolved_at ? 'Reopen' : 'Mark as done')}</button></div></li>`).join('');
    feedbackEmpty.hidden = rows.length > 0;
  }
  feedbackList.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-toggle]');
    if (!btn) return;
    const card = btn.closest('.card');
    btn.disabled = true;
    const { error } = await auth.setFeedbackDone(Number(card.dataset.id), card.dataset.done !== '1');
    if (error) { console.error(error); btn.disabled = false; flash(t('Could not save.'), true); return; }
    renderFeedback();
  });
  auth.onChange(renderFeedback);
  auth.ready.then(renderFeedback);
  auth.onChange(renderRequests);
  auth.ready.then(renderRequests);
  auth.onChange(renderAccount);
  auth.ready.then(renderAccount);
})();
