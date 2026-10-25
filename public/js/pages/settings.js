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
})();
