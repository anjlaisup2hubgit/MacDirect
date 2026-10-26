// Login page: log in, sign up (optionally requesting to lead a society), or continue as a guest.
(function () {
  const form = document.getElementById('auth-form');
  const msg = form.querySelector('.form-msg');
  const submit = form.querySelector('.form-submit');
  const tabs = document.querySelectorAll('.auth-tabs .chip');
  const societySelect = form.elements.societyId;
  let mode = 'login';

  function say(text, isError) {
    msg.textContent = text;
    msg.classList.toggle('error', !!isError);
    msg.hidden = false;
  }

  function setMode(next) {
    mode = next;
    tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.mode === mode));
    form.querySelectorAll('[data-signup]').forEach((el) => { el.hidden = mode !== 'signup'; });
    submit.textContent = t(mode === 'signup' ? 'Sign up' : 'Log in');
    form.elements.password.autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
    msg.hidden = true;
  }

  function syncLeaderField() {
    form.querySelector('[data-leader]').hidden = !form.elements.isLeader.checked;
  }

  const langSelect = document.getElementById('lang-select');
  langSelect.innerHTML = Object.entries(I18N_LANGS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  langSelect.value = i18nLang();
  langSelect.addEventListener('change', () => { setLang(langSelect.value); location.reload(); }); // reload rebuilds the page text in the new language

  tabs.forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.mode)));
  form.elements.isLeader.addEventListener('change', syncLeaderField);

  document.querySelector('.auth-guest').addEventListener('click', () => {
    auth.continueAsGuest();
    location.href = '/';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth.configured) return say(t('Login is not set up yet. You can continue as a guest.'), true);
    submit.disabled = true;
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;

    if (mode === 'login') {
      const { error } = await auth.signIn(email, password);
      if (error) say(error.message, true);
      else location.href = '/';
    } else {
      const isLeader = form.elements.isLeader.checked;
      const { error, needsConfirmation } = await auth.signUp({
        email, password,
        displayName: form.elements.displayName.value.trim(),
        societyId: isLeader ? form.elements.societyId.value : null,
      });
      if (error) say(error.message, true);
      else if (needsConfirmation) say(t('Check your email to confirm your account, then log in.'));
      else location.href = '/';
    }
    submit.disabled = false;
  });

  auth.ready.then(async () => {
    if (!auth.configured) return;
    const societies = await auth.listSocieties();
    if (!societies.length) { form.elements.isLeader.closest('[data-signup]').remove(); return; }
    societySelect.innerHTML = societies.map((s) => `<option value="${s.id}">${s.name.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</option>`).join('');
  });

  setMode('login');
})();
