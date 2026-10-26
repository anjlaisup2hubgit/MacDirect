// Add event plan popup: saves a private plan to Supabase so it shows up in the Calendar.
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
    '</form>' +
    '<section class="event-form cover-section" hidden>' +
      '<h3>' + t('Society cover photo') + '</h3>' +
      '<label class="cover-society">' + t('Society') + '<select name="society"></select></label>' +
      '<img class="cover-preview" alt="" hidden>' +
      '<label>' + t('Choose image (JPEG, PNG or WebP, up to 5 MB)') + '<input name="cover" type="file" accept="image/jpeg,image/png,image/webp"></label>' +
      '<button class="auth-guest" type="button" data-remove-cover hidden>' + t('Remove') + '</button>' +
      '<p class="form-msg" hidden></p>' +
    '</section>';
  const form = p.results.querySelector('form');
  const msg = form.querySelector('.form-msg');
  const gate = p.results.querySelector('.guest-gate');

  const cover = p.results.querySelector('.cover-section');
  const coverSelect = cover.querySelector('select');
  const coverImg = cover.querySelector('.cover-preview');
  const coverFile = cover.querySelector('input[type="file"]');
  const coverRemove = cover.querySelector('[data-remove-cover]');
  const coverMsg = cover.querySelector('.form-msg');
  let coverUrls = {};

  function flash(text, isError) {
    coverMsg.textContent = text;
    coverMsg.classList.toggle('error', !!isError);
    coverMsg.hidden = false;
  }
  function showCover() {
    const url = coverUrls[coverSelect.value];
    coverImg.hidden = !url;
    if (url) { coverImg.src = url; coverImg.alt = coverSelect.selectedOptions[0].textContent; }
    coverRemove.hidden = !url;
  }
  async function renderCover() {
    const mine = auth.user ? auth.approvedSocieties : [];
    cover.hidden = !mine.length;
    if (!mine.length) return;
    const keep = coverSelect.value;
    coverSelect.innerHTML = mine.map((s) => `<option value="${s.id}">${esc(s.name || '')}</option>`).join('');
    if (keep) coverSelect.value = keep;
    cover.querySelector('.cover-society').hidden = mine.length < 2;
    try { coverUrls = await auth.listSocietyImages(); } catch (err) { console.error(err); }
    showCover();
  }
  coverSelect.addEventListener('change', () => { coverMsg.hidden = true; showCover(); });
  coverFile.addEventListener('change', async () => {
    const file = coverFile.files[0];
    if (!file) return;
    coverFile.disabled = true;
    const { error, url } = await auth.uploadSocietyImage(Number(coverSelect.value), file);
    coverFile.disabled = false;
    coverFile.value = '';
    if (error) { console.error(error); flash(error.userMessage ? t(error.userMessage) : t('Could not save.'), true); return; }
    coverUrls[coverSelect.value] = url;
    showCover();
    window.dispatchEvent(new Event('society-images-changed'));
    flash(t('Saved.'));
  });
  coverRemove.addEventListener('click', async () => {
    const { error } = await auth.deleteSocietyImage(Number(coverSelect.value));
    if (error) { console.error(error); flash(t('Could not save.'), true); return; }
    delete coverUrls[coverSelect.value];
    showCover();
    window.dispatchEvent(new Event('society-images-changed'));
    flash(t('Saved.'));
  });

  function renderGate() {
    gate.hidden = !!auth.user;
    form.hidden = !auth.user;
    renderCover();
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
    const submit = form.querySelector('.form-submit');
    submit.disabled = true; // stops a double tap saving the plan twice
    let error;
    try {
      ({ error } = await auth.savePlan({
        name: f.get('name').trim(),
        category: f.get('category'),
        date: f.get('date'),
        time: f.get('time'),
        building: f.get('building').trim(),
        description: f.get('description').trim(),
      }));
    } catch (err) { error = err; }
    submit.disabled = false;
    if (error) {
      console.error(error);
      msg.textContent = t('Could not save.');
    } else {
      window.dispatchEvent(new Event('events-changed'));
      form.reset();
      msg.textContent = t('Added! Find it in Calendar.');
    }
    msg.hidden = false;
  });
})();
