// User settings popup: display name (logged-in users, saved to profiles), language, clear plans and log out.
(function () {
  const p = createPopup({ id: 'settings-popup', title: 'User Settings', navHref: '/?tasks', hash: 'tasks' });
  p.results.innerHTML =
    '<div class="account"></div>' +
    '<form class="event-form">' +
      `<label class="name-field" hidden>${t('Display name')}<input name="name" maxlength="40" autocomplete="off"></label>` +
      `<label>${t('Language')}<select name="lang">` +
        Object.entries(I18N_LANGS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('') + '</select></label>' +
      `<label class="view-field" hidden>${t('Calendar view')}<select name="view">` +
        `<option value="cal">${t('Month')}</option><option value="list">${t('Day')}</option></select></label>` +
      '<p class="form-msg" hidden></p>' +
    '</form>' +
    '<div class="my-data" hidden>' +
      `<button class="auth-guest" type="button" data-act="clear-plans">${t('Clear my event plans')}</button>` +
    '</div>' +
    `<button class="form-submit logout-btn" type="button" data-act="logout" hidden>${t('Log out')}</button>`;
  const form = p.results.querySelector('form');
  const msg = form.querySelector('.form-msg');
  const nameField = form.querySelector('.name-field');
  const logoutBtn = p.results.querySelector('.logout-btn');
  const viewField = form.querySelector('.view-field');
  form.elements.lang.value = i18nLang();
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
      location.href = '/?tasks'; // reload so every popup is rebuilt in the new language; reopens this popup
    } else if (e.target.name === 'view') {
      try {
        localStorage.setItem('imcq-cal-view', e.target.value);
        flash(t('Saved.'));
        window.dispatchEvent(new Event('events-changed')); // Calendar switches to the chosen view
      } catch (err) { console.error(err); flash(t('Could not save.'), true); }
    } else if (e.target.name === 'name') {
      const { error } = await auth.updateDisplayName(e.target.value.trim());
      if (error) { console.error(error); flash(t('Could not save.'), true); } else flash(t('Saved.'));
    }
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
    nameField.hidden = !auth.user;
    viewField.hidden = !auth.user;
    if (auth.user) {
      form.elements.name.value = (auth.profile && auth.profile.display_name) || '';
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
    if (act === 'logout') { await auth.signOut(); location.href = '/login.html'; }
  });

  // Clearing plans: logged-in users only. Followed societies are listed in the Societies popup.
  const myData = p.results.querySelector('.my-data');
  myData.addEventListener('click', async (e) => {
    if (e.target.dataset.act !== 'clear-plans') return;
    const d = document.createElement('dialog');
    d.className = 'login-prompt';
    d.innerHTML = `<p>${t('Delete all your event plans? This cannot be undone.')}</p><div>` +
      `<button class="form-submit" type="button" data-yes>${t('Clear my event plans')}</button>` +
      `<button class="auth-guest" type="button" data-no>${t('Cancel')}</button></div>`;
    d.addEventListener('close', () => d.remove());
    d.addEventListener('click', async (ev) => {
      if (ev.target.dataset.no !== undefined) d.close();
      if (ev.target.dataset.yes === undefined) return;
      d.close();
      const { error } = await auth.clearPlans();
      if (error) { console.error(error); flash(t('Could not save.'), true); return; }
      flash(t('Saved.'));
      window.dispatchEvent(new Event('events-changed')); // Calendar reloads its plans
    });
    document.body.appendChild(d);
    d.showModal();
  });
  function renderMyData() {
    myData.hidden = !auth.user;
  }
  auth.onChange(renderMyData);
  auth.ready.then(renderMyData);
  auth.onChange(renderAccount);
  auth.ready.then(renderAccount);
})();
