// User settings popup: display name and text size, saved to localStorage.
(function () {
  const defaults = { name: '', textSize: 'normal' };
  const sizes = { small: 'Small', normal: 'Normal', large: 'Large' };

  function load() {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem('userSettings')) }; }
    catch (err) { return { ...defaults }; }
  }
  function save(s) {
    try { localStorage.setItem('userSettings', JSON.stringify(s)); } catch (err) { console.error(err); }
  }
  function applyTextSize(size) {
    Object.keys(sizes).forEach((k) => document.body.classList.toggle(`text-${k}`, k === size));
  }

  const p = createPopup({ id: 'settings-popup', title: 'User Settings', navHref: '/?tasks', hash: 'tasks' });
  p.results.innerHTML =
    '<div class="account"></div>' +
    '<form class="event-form">' +
      '<label>Display name<input name="name" maxlength="40" autocomplete="off"></label>' +
      '<label>Text size<select name="textSize">' +
        Object.entries(sizes).map(([v, l]) => `<option value="${v}">${l}</option>`).join('') + '</select></label>' +
      '<button class="form-submit" type="button">Reset to defaults</button>' +
      '<p class="form-msg" hidden></p>' +
    '</form>';
  const form = p.results.querySelector('form');
  const msg = form.querySelector('.form-msg');

  function fill(s) {
    form.elements.name.value = s.name;
    form.elements.textSize.value = s.textSize;
    applyTextSize(s.textSize);
  }

  function flash(text) { msg.textContent = text; msg.hidden = false; }

  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('change', () => {
    const s = { name: form.elements.name.value.trim(), textSize: form.elements.textSize.value };
    save(s);
    applyTextSize(s.textSize);
    flash('Saved.');
  });
  form.querySelector('.form-submit').addEventListener('click', () => {
    save(defaults);
    fill(defaults);
    flash('Settings reset.');
  });

  fill(load());

  // Account block: who is signed in, or a prompt to log in when browsing as a guest.
  const account = p.results.querySelector('.account');
  function roleLine() {
    if (auth.profile && auth.profile.role === 'admin') return 'Admin';
    const l = auth.leaderships[0];
    if (!l) return 'Student';
    const name = l.societies ? l.societies.name : 'a society';
    if (l.status === 'approved') return `Leader of ${name}`;
    if (l.status === 'pending') return `Leader request pending for ${name}`;
    return `Leader request declined for ${name}`;
  }
  function renderAccount() {
    if (auth.user) {
      const name = (auth.profile && auth.profile.display_name) || 'Signed in';
      account.innerHTML =
        `<p><strong>${esc(name)}</strong><br>${esc(auth.user.email)}</p><p>${esc(roleLine())}</p>` +
        '<button class="form-submit" type="button" data-act="logout">Log out</button>';
    } else {
      account.innerHTML =
        '<p>You are browsing as a guest. Following societies, the event plan and posting events need an account.</p>' +
        '<button class="form-submit" type="button" data-act="login">Log in or sign up</button>';
    }
  }
  account.addEventListener('click', async (e) => {
    const act = e.target.dataset.act;
    if (act === 'login') location.href = '/login.html';
    if (act === 'logout') { await auth.signOut(); location.href = '/login.html'; }
  });
  auth.onChange(renderAccount);
  auth.ready.then(renderAccount);
})();
