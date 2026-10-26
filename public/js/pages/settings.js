// User settings popup: display name (logged-in users, saved to profiles) and language.
(function () {
  const p = createPopup({ id: 'settings-popup', title: 'User Settings', navHref: '/?tasks', hash: 'tasks' });
  p.results.innerHTML =
    '<div class="account"></div>' +
    '<form class="event-form">' +
      `<label class="name-field" hidden>${t('Display name')}<input name="name" maxlength="40" autocomplete="off"></label>` +
      `<label>${t('Language')}<select name="lang">` +
        Object.entries(I18N_LANGS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('') + '</select></label>' +
      '<p class="form-msg" hidden></p>' +
    '</form>' +
    '<div class="my-data" hidden>' +
      `<h3>${t('Followed societies')}</h3><div class="follow-list"></div>` +
      `<button class="auth-guest" type="button" data-act="clear-plans">${t('Clear my event plans')}</button>` +
    '</div>';
  const form = p.results.querySelector('form');
  const msg = form.querySelector('.form-msg');
  const nameField = form.querySelector('.name-field');
  form.elements.lang.value = i18nLang();

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
    nameField.hidden = !auth.user;
    if (auth.user) {
      form.elements.name.value = (auth.profile && auth.profile.display_name) || '';
      const name = (auth.profile && auth.profile.display_name) || t('Signed in');
      account.innerHTML =
        `<p><strong>${esc(name)}</strong><br>${esc(auth.user.email)}</p><p>${esc(roleLine())}</p>` +
        '<button class="form-submit" type="button" data-act="logout">' + t('Log out') + '</button>';
    } else {
      account.innerHTML =
        '<p>' + t('You are browsing as a guest. Following societies and the event plan need an account.') + '</p>' +
        '<button class="form-submit" type="button" data-act="login">' + t('Log in or sign up') + '</button>';
    }
  }
  account.addEventListener('click', async (e) => {
    const act = e.target.dataset.act;
    if (act === 'login') location.href = '/login.html';
    if (act === 'logout') { await auth.signOut(); location.href = '/login.html'; }
  });

  // Followed societies and clearing plans: logged-in users only.
  const myData = p.results.querySelector('.my-data');
  const followList = myData.querySelector('.follow-list');
  async function renderFollows() {
    const [ids, societies] = await Promise.all([auth.myFollows(), auth.listSocieties()]);
    const followed = societies.filter((s) => ids.includes(s.id));
    followList.innerHTML = followed.length
      ? followed.map((s) => `<div class="follow-row"><span>${esc(s.name)}</span>` +
          `<button class="auth-guest" type="button" data-unfollow="${s.id}">${t('Unfollow')}</button></div>`).join('')
      : '<p>' + t('You are not following any societies.') + '</p>';
  }
  followList.addEventListener('click', async (e) => {
    const id = e.target.dataset.unfollow;
    if (!id) return;
    const { error } = await auth.setFollow(Number(id), false);
    if (error) { console.error(error); flash(t('Could not save.'), true); return; }
    flash(t('Saved.'));
    renderFollows();
  });
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
      window.dispatchEvent(new Event('events-changed')); // What's Happening reloads its plans
    });
    document.body.appendChild(d);
    d.showModal();
  });
  function renderMyData() {
    myData.hidden = !auth.user;
    if (auth.user) renderFollows();
  }
  auth.onChange(renderMyData);
  auth.ready.then(renderMyData);
  auth.onChange(renderAccount);
  auth.ready.then(renderAccount);
})();
