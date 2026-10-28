// Add event plan popup: one event form. A private plan or, for approved society leaders, a society event.
// Both can carry a photo and show up in the Calendar. Leaders also get an Edit events tab (edit or delete the events
// they posted) and a Cover photo tab (cover image and hashtags).
(function () {
  const p = createPopup({ id: 'event-plan-popup', title: 'Add event', navHref: '/?event-plan', hash: 'event-plan' });
  p.results.innerHTML =
    '<div class="account guest-gate" hidden>' +
      '<p>' + t('Log in to add event plans. Guests can browse everything but cannot save.') + '</p>' +
      '<button class="form-submit" type="button">' + t('Log in or sign up') + '</button></div>' +
    '<div class="chips mode-tabs" role="group" hidden>' +
      '<button type="button" class="chip active" data-mode="event">' + t('Add event') + '</button>' +
      '<button type="button" class="chip" data-mode="manage">' + t('Edit events') + '</button>' +
      '<button type="button" class="chip" data-mode="cover">' + t('Cover photo') + '</button></div>' +
    '<form class="event-form" hidden>' +
      '<label class="ev-target" hidden>' + t('Add for') + '<select name="target"></select></label>' +
      '<label>' + t('Event name') + '<input name="name" required maxlength="80"></label>' +
      '<label>' + t('Category') + '<select name="category">' +
        ['Social', 'Academic', 'Career', 'Community'].map((c) => `<option value="${c}">${t(c)}</option>`).join('') + '</select></label>' +
      '<label>' + t('Date') + '<input name="date" type="date" required></label>' +
      '<label>' + t('Time') + '<input name="time" type="time" value="12:00"></label>' +
      '<label>' + t('Building') + '<input name="building" list="event-buildings" placeholder="' + t('e.g. 1CC') + '"></label>' +
      '<datalist id="event-buildings"></datalist>' +
      '<label>' + t('Description') + '<textarea name="description" rows="3" maxlength="200"></textarea></label>' +
      '<img class="cover-preview" alt="" hidden>' +
      '<label class="ev-remove-photo" hidden><input type="checkbox" name="removeImage"> ' + t('Remove current photo') + '</label>' +
      '<label>' + t('Event photo (optional; JPEG, PNG or WebP, up to 5 MB)') + '<input name="photo" type="file" accept="image/jpeg,image/png,image/webp"></label>' +
      '<button class="form-submit" type="submit">' + t('Add event') + '</button>' +
      '<button class="auth-guest" type="button" data-cancel hidden>' + t('Cancel') + '</button>' +
      '<p class="form-msg" aria-live="polite" hidden></p>' +
    '</form>' +
    '<section class="manage-section" hidden>' +
      '<ul class="card-list"></ul><p class="empty-msg" role="status" hidden>' + t('Your society has not posted any events yet.') + '</p>' +
    '</section>' +
    '<section class="event-form cover-section" hidden>' +
      '<h3>' + t('Society cover photo') + '</h3>' +
      '<label class="cover-society">' + t('Society') + '<select name="society"></select></label>' +
      '<img class="cover-preview" alt="" hidden>' +
      '<label>' + t('Choose image (JPEG, PNG or WebP, up to 5 MB)') + '<input name="cover" type="file" accept="image/jpeg,image/png,image/webp"></label>' +
      '<button class="auth-guest" type="button" data-remove-cover hidden>' + t('Remove') + '</button>' +
      '<p class="form-msg" aria-live="polite" hidden></p>' +
      '<label>' + t('Hashtags (up to 5, e.g. social games)') + '<input name="hashtags" maxlength="120" autocomplete="off"></label>' +
      '<button class="form-submit" type="button" data-save-tags>' + t('Save hashtags') + '</button>' +
      '<p class="form-msg tags-msg" aria-live="polite" hidden></p>' +
    '</section>';
  const form = p.results.querySelector('form');
  const msg = form.querySelector('.form-msg');
  const gate = p.results.querySelector('.guest-gate');
  const tabs = p.results.querySelector('.mode-tabs');
  const targetSelect = form.elements.target;
  const preview = form.querySelector('.cover-preview');
  const removeRow = form.querySelector('.ev-remove-photo');
  const cancelBtn = form.querySelector('[data-cancel]');
  const submitBtn = form.querySelector('.form-submit');
  let editing = null; // the society event being edited, or null when adding a new one
  let mode = 'event';

  const cover = p.results.querySelector('.cover-section');
  const coverSelect = cover.querySelector('select');
  const coverImg = cover.querySelector('.cover-preview');
  const coverFile = cover.querySelector('input[type="file"]');
  const coverRemove = cover.querySelector('[data-remove-cover]');
  const coverMsg = cover.querySelector('.form-msg');
  const tagsInput = cover.querySelector('input[name="hashtags"]');
  const tagsMsg = cover.querySelector('.tags-msg');
  let coverUrls = {};
  let societyTags = {};

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
  function showTags() {
    tagsInput.value = (societyTags[coverSelect.value] || []).map((h) => '#' + h).join(' ');
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
    try {
      const all = await auth.listSocieties();
      societyTags = {};
      all.forEach((x) => { societyTags[x.id] = x.hashtags || []; });
    } catch (err) { console.error(err); }
    showTags();
  }
  coverSelect.addEventListener('change', () => { coverMsg.hidden = true; tagsMsg.hidden = true; showCover(); showTags(); });
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

  // Edit events tab: the events posted by the leader's societies, with Edit and Delete.
  const manage = p.results.querySelector('.manage-section');
  const manageList = manage.querySelector('.card-list');
  const manageEmpty = manage.querySelector('.empty-msg');
  let manageEvents = [];
  async function renderManage() {
    const mine = auth.user ? auth.approvedSocieties.map((s) => s.id) : [];
    if (!mine.length) return;
    manageEmpty.textContent = t('Your society has not posted any events yet.');
    try {
      manageEvents = (await auth.listEvents()).filter((ev) => mine.includes(ev.societyId)).map((ev) => ({ ...ev, canEdit: true }));
    } catch (err) { console.error(err); manageEvents = []; manageEmpty.textContent = t('Could not save.'); manageEmpty.hidden = false; manageList.innerHTML = ''; return; }
    manageList.innerHTML = manageEvents.map(eventCard).join('');
    manageEmpty.hidden = manageEvents.length > 0;
  }
  manageList.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-edit], [data-delete]');
    if (!btn) return;
    const ev = manageEvents[[...manageList.children].indexOf(btn.closest('.card'))];
    if (!ev) return;
    if (btn.hasAttribute('data-edit')) { window.editSocietyEvent(ev); return; }
    if (!await choose(t('Delete this event?'), [{ label: t('Delete'), value: true, danger: true }])) return;
    const { error } = await auth.deleteEvent(ev.id);
    if (error) { console.error(error); await choose(t('Could not save.'), [], t('Close')); return; }
    location.href = '/?event-plan'; // reload the page and reopen this popup
  });
  window.addEventListener('events-changed', renderManage);

  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (!b) return;
    mode = b.dataset.mode;
    renderGate();
  });

  function renderGate() {
    const mine = auth.user ? auth.approvedSocieties : [];
    if (!mine.length) mode = 'event';
    gate.hidden = !!auth.user;
    tabs.hidden = !mine.length;
    tabs.querySelectorAll('.chip').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
    form.hidden = !auth.user || mode !== 'event';
    cover.hidden = !mine.length || mode !== 'cover';
    manage.hidden = !mine.length || mode !== 'manage';
    if (mode === 'manage') renderManage();
    const keep = targetSelect.value;
    targetSelect.innerHTML = (editing ? '' : `<option value="me">${t('Just me (private)')}</option>`) +
      mine.map((s) => `<option value="${s.id}">${esc(s.name || '')}</option>`).join('');
    if (keep) targetSelect.value = keep;
    targetSelect.closest('label').hidden = !mine.length || !!editing;
    renderCover();
  }
  gate.querySelector('button').addEventListener('click', () => { location.href = '/login.html'; });
  auth.onChange(renderGate);
  auth.ready.then(renderGate);

  api('/map').then((data) => {
    form.querySelector('datalist').innerHTML =
      data.features.map((f) => `<option value="${esc(f.properties.name)}">`).join('');
  }).catch(console.error);

  function resetForm() {
    editing = null;
    form.reset();
    preview.hidden = true;
    removeRow.hidden = true;
    cancelBtn.hidden = true;
    submitBtn.textContent = t('Add event');
    renderGate();
  }
  cancelBtn.addEventListener('click', () => { resetForm(); msg.hidden = true; });

  // Used by the Calendar's Edit button on a society event.
  window.editSocietyEvent = (ev) => {
    editing = ev;
    mode = 'event';
    renderGate();
    targetSelect.value = ev.societyId;
    form.elements.name.value = ev.name;
    form.elements.category.value = ev.category;
    form.elements.date.value = ev.date;
    form.elements.time.value = ev.timeValue;
    form.elements.building.value = ev.building === 'TBC' ? '' : ev.building;
    form.elements.description.value = ev.description;
    preview.hidden = !ev.imageUrl;
    if (ev.imageUrl) { preview.src = ev.imageUrl; preview.alt = ev.name; }
    removeRow.hidden = !ev.imageUrl;
    cancelBtn.hidden = false;
    submitBtn.textContent = t('Save event');
    msg.hidden = true;
    p.setOpen(true);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!auth.requireLogin('Log in to add event plans')) return;
    const f = new FormData(form);
    const target = editing ? String(editing.societyId) : targetSelect.value;
    const fields = {
      name: f.get('name').trim(),
      category: f.get('category'),
      date: f.get('date'),
      time: f.get('time'),
      building: f.get('building').trim(),
      description: f.get('description').trim(),
    };
    const photo = form.elements.photo.files[0];
    submitBtn.disabled = true; // stops a double tap saving the event twice
    let error;
    try {
      ({ error } = target === 'me'
        ? await auth.savePlan(fields, photo)
        : await auth.saveEvent({ ...fields, id: editing ? editing.id : undefined, societyId: Number(target), removeImage: f.get('removeImage') === 'on' }, photo));
    } catch (err) { error = err; }
    submitBtn.disabled = false;
    msg.classList.toggle('error', !!error);
    if (error) {
      console.error(error);
      msg.textContent = error.userMessage ? t(error.userMessage) : t('Could not save.');
    } else {
      const wasEditing = !!editing;
      window.dispatchEvent(new Event('events-changed'));
      resetForm();
      msg.textContent = wasEditing ? t('Saved.') : t('Added! Find it in Calendar.');
    }
    msg.hidden = false;
    msg.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); // the form is long; keep the result in view
  });
})();
