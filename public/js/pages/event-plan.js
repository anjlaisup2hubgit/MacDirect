// Add event plan popup: saves a private plan to Supabase so it shows up in the Calendar.
(function () {
  const p = createPopup({ id: 'event-plan-popup', title: 'Add Event Plan', navHref: '/?event-plan', hash: 'event-plan' });
  p.results.innerHTML =
    '<div class="account guest-gate" hidden>' +
      '<p>' + t('Log in to add event plans. Guests can browse everything but cannot save.') + '</p>' +
      '<button class="form-submit" type="button">' + t('Log in or sign up') + '</button></div>' +
    '<div class="chips mode-tabs" role="group" hidden>' +
      '<button type="button" class="chip active" data-mode="plan">' + t('My plan') + '</button>' +
      '<button type="button" class="chip" data-mode="event">' + t('Society event') + '</button>' +
      '<button type="button" class="chip" data-mode="cover">' + t('Cover photo') + '</button></div>' +
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
    '<form class="event-form society-event-form" hidden>' +
      '<label class="ev-society">' + t('Society') + '<select name="society"></select></label>' +
      '<label>' + t('Event name') + '<input name="name" required maxlength="80"></label>' +
      '<label>' + t('Category') + '<select name="category">' +
        ['Social', 'Academic', 'Career', 'Community'].map((c) => `<option value="${c}">${t(c)}</option>`).join('') + '</select></label>' +
      '<label>' + t('Date') + '<input name="date" type="date" required></label>' +
      '<label>' + t('Time') + '<input name="time" type="time" value="12:00"></label>' +
      '<label>' + t('Building') + '<input name="building" list="event-buildings" placeholder="' + t('e.g. 1CC') + '"></label>' +
      '<label>' + t('Description') + '<textarea name="description" rows="3" maxlength="200"></textarea></label>' +
      '<img class="cover-preview" alt="" hidden>' +
      '<label class="ev-remove-poster" hidden><input type="checkbox" name="removeImage"> ' + t('Remove current poster') + '</label>' +
      '<label>' + t('Event poster (optional; JPEG, PNG or WebP, up to 5 MB)') + '<input name="poster" type="file" accept="image/jpeg,image/png,image/webp"></label>' +
      '<button class="form-submit" type="submit">' + t('Save event') + '</button>' +
      '<button class="auth-guest" type="button" data-cancel hidden>' + t('Cancel') + '</button>' +
      '<p class="form-msg" hidden></p>' +
    '</form>' +
    '<section class="event-form cover-section" hidden>' +
      '<h3>' + t('Society cover photo') + '</h3>' +
      '<label class="cover-society">' + t('Society') + '<select name="society"></select></label>' +
      '<img class="cover-preview" alt="" hidden>' +
      '<label>' + t('Choose image (JPEG, PNG or WebP, up to 5 MB)') + '<input name="cover" type="file" accept="image/jpeg,image/png,image/webp"></label>' +
      '<button class="auth-guest" type="button" data-remove-cover hidden>' + t('Remove') + '</button>' +
      '<p class="form-msg" hidden></p>' +
      '<label>' + t('Hashtags (up to 5, e.g. social games)') + '<input name="hashtags" maxlength="120" autocomplete="off"></label>' +
      '<button class="form-submit" type="button" data-save-tags>' + t('Save hashtags') + '</button>' +
      '<p class="form-msg tags-msg" hidden></p>' +
    '</section>';
  const form = p.results.querySelector('form');
  const msg = form.querySelector('.form-msg');
  const gate = p.results.querySelector('.guest-gate');
  const tabs = p.results.querySelector('.mode-tabs');
  const evForm = p.results.querySelector('.society-event-form');
  const evMsg = evForm.querySelector('.form-msg');
  const evSociety = evForm.elements.society;
  const evPreview = evForm.querySelector('.cover-preview');
  const evRemoveRow = evForm.querySelector('.ev-remove-poster');
  const evCancel = evForm.querySelector('[data-cancel]');
  let editing = null; // the society event being edited, or null when posting a new one
  let mode = 'plan';

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

  const tagsInput = cover.querySelector('input[name="hashtags"]');
  const tagsMsg = cover.querySelector('.tags-msg');
  let societyTags = {};
  function showTags() {
    tagsInput.value = (societyTags[coverSelect.value] || []).map((h) => '#' + h).join(' ');
  }
  coverSelect.addEventListener('change', showTags);
  cover.querySelector('[data-save-tags]').addEventListener('click', async () => {
    const tags = parseHashtags(tagsInput.value);
    const { error } = await auth.updateSocietyHashtags(Number(coverSelect.value), tags);
    tagsMsg.classList.toggle('error', !!error);
    tagsMsg.textContent = error ? t('Could not save.') : t('Saved.');
    tagsMsg.hidden = false;
    if (error) { console.error(error); return; }
    societyTags[coverSelect.value] = tags;
    showTags();
    window.dispatchEvent(new Event('society-images-changed')); // Societies popup reloads its list
  });

  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (!b) return;
    mode = b.dataset.mode;
    renderGate();
  });

  function renderGate() {
    const mine = auth.user ? auth.approvedSocieties : [];
    if (!mine.length) mode = 'plan';
    gate.hidden = !!auth.user;
    tabs.hidden = !mine.length;
    tabs.querySelectorAll('.chip').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
    form.hidden = !auth.user || mode !== 'plan';
    evForm.hidden = !mine.length || mode !== 'event';
    cover.hidden = !mine.length || mode !== 'cover';
    if (mine.length) {
      const keep = evSociety.value;
      evSociety.innerHTML = mine.map((s) => `<option value="${s.id}">${esc(s.name || '')}</option>`).join('');
      if (keep) evSociety.value = keep;
      evForm.querySelector('.ev-society').hidden = mine.length < 2;
      auth.listSocieties().then((all) => {
        societyTags = {};
        all.forEach((x) => { societyTags[x.id] = x.hashtags || []; });
        showTags();
      }).catch(console.error);
    }
    renderCover();
  }

  // Society events: post a new one, or edit one from the Calendar (window.editSocietyEvent).
  function resetEventForm() {
    editing = null;
    evForm.reset();
    evPreview.hidden = true;
    evRemoveRow.hidden = true;
    evCancel.hidden = true;
  }
  evCancel.addEventListener('click', () => { resetEventForm(); evMsg.hidden = true; });
  window.editSocietyEvent = (ev) => {
    resetEventForm();
    editing = ev;
    evSociety.value = ev.societyId;
    evForm.elements.name.value = ev.name;
    evForm.elements.category.value = ev.category;
    evForm.elements.date.value = ev.date;
    evForm.elements.time.value = ev.timeValue;
    evForm.elements.building.value = ev.building === 'TBC' ? '' : ev.building;
    evForm.elements.description.value = ev.description;
    evPreview.hidden = !ev.imageUrl;
    if (ev.imageUrl) { evPreview.src = ev.imageUrl; evPreview.alt = ev.name; }
    evRemoveRow.hidden = !ev.imageUrl;
    evCancel.hidden = false;
    evMsg.hidden = true;
    mode = 'event';
    renderGate();
    p.setOpen(true);
  };
  evForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(evForm);
    const submit = evForm.querySelector('.form-submit');
    submit.disabled = true; // stops a double tap posting the event twice
    let error;
    try {
      ({ error } = await auth.saveEvent({
        id: editing ? editing.id : undefined,
        societyId: Number(f.get('society')),
        name: f.get('name').trim(),
        category: f.get('category'),
        date: f.get('date'),
        time: f.get('time'),
        building: f.get('building').trim(),
        description: f.get('description').trim(),
        removeImage: f.get('removeImage') === 'on',
      }, evForm.elements.poster.files[0]));
    } catch (err) { error = err; }
    submit.disabled = false;
    evMsg.classList.toggle('error', !!error);
    if (error) {
      console.error(error);
      evMsg.textContent = error.userMessage ? t(error.userMessage) : t('Could not save.');
    } else {
      resetEventForm();
      window.dispatchEvent(new Event('events-changed'));
      evMsg.textContent = t('Saved.');
    }
    evMsg.hidden = false;
  });
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
