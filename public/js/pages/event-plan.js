// Add event plan popup: saves a private plan to Supabase so it shows up in What's Happening.
(function () {
  const p = createPopup({ id: 'event-plan-popup', title: 'Add Event Plan', navHref: '/?event-plan', hash: 'event-plan' });
  p.results.innerHTML =
    '<div class="account guest-gate" hidden>' +
      '<p>' + t('Log in to add event plans. Guests can browse everything but cannot save.') + '</p>' +
      '<button class="form-submit" type="button">' + t('Log in or sign up') + '</button></div>' +
    '<form class="event-form" hidden>' +
      '<label>' + t('Event name') + '<input name="name" required maxlength="80"></label>' +
      '<label>' + t('Category') + '<select name="category">' +
        ['Social', 'Academic', 'Career', 'Community'].map((c) => `<option value="${c}">${t(c)}</option>`).join('') + '</select></label>' +
      '<label>' + t('Date') + '<input name="date" type="date" required></label>' +
      '<label>' + t('Time') + '<input name="time" type="time" value="12:00"></label>' +
      '<label>' + t('Building') + '<input name="building" list="event-buildings" placeholder="' + t('e.g. 1CC') + '"></label>' +
      '<datalist id="event-buildings"></datalist>' +
      '<label>' + t('Description') + '<textarea name="description" rows="3" maxlength="200"></textarea></label>' +
      '<button class="form-submit" type="submit">' + t('Add event') + '</button>' +
      '<p class="form-msg" hidden></p>' +
    '</form>';
  const form = p.results.querySelector('form');
  const msg = form.querySelector('.form-msg');
  const gate = p.results.querySelector('.guest-gate');

  function renderGate() {
    gate.hidden = !!auth.user;
    form.hidden = !auth.user;
  }
  gate.querySelector('button').addEventListener('click', () => { location.href = '/login.html'; });
  auth.onChange(renderGate);
  auth.ready.then(renderGate);

  api('/map').then((data) => {
    form.querySelector('datalist').innerHTML =
      data.features.map((f) => `<option value="${esc(f.properties.name)}">`).join('');
  }).catch(console.error);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth.requireLogin('Log in to add event plans')) return;
    const f = new FormData(form);
    const { error } = await auth.savePlan({
      name: f.get('name').trim(),
      category: f.get('category'),
      date: f.get('date'),
      time: f.get('time'),
      building: f.get('building').trim(),
      description: f.get('description').trim() || 'No description.',
    });
    if (error) {
      console.error(error);
      msg.textContent = t('Could not save.');
    } else {
      window.dispatchEvent(new Event('events-changed'));
      form.reset();
      msg.textContent = t("Added! Find it in What's Happening.");
    }
    msg.hidden = false;
  });
})();
