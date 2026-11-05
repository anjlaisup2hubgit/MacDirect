// Add event plan popup: one event form. A private plan or, for approved society leaders, a society event.
// Both can carry a photo and show up in the Calendar. Leaders also get an Edit events tab (edit or delete the events
// they posted) and a Cover photo tab (cover image and hashtags).
(function () {
  const p = createPopup({ id: 'event-plan-popup', title: 'Add event', navHref: '/event-plan.html' });
  const ico = (d) => '<svg class="ev-ic" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  const chevron = ico('<path d="M6 15l6-6 6 6"/>');
  const tile = (icon, label, control, cls) =>
    '<label class="ev-tile' + (cls ? ' ' + cls : '') + '"><i>' + ico(icon) + '</i><span><small>' + t(label) + '</small>' + control + '</span></label>';
  // The photo button sits in the banner at the top; its file input belongs to the form below via form="ev-form".
  p.popup.querySelector('.popup-island').insertAdjacentHTML('beforeend',
    '<div class="hero-photo"><label class="hero-photo-btn">' +
      ico('<rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/>') +
      '<span>' + t('Add a cover photo') + '</span>' +
      '<input name="photo" type="file" form="ev-form" accept="image/jpeg,image/png,image/webp"></label>' +
      '<small>' + t('JPG, PNG or WebP, up to 5 MB') + '</small></div>');
  p.results.innerHTML =
    '<div class="account guest-gate" hidden>' +
      '<p>' + t('Log in to add event plans. Guests can browse everything but cannot save.') + '</p>' +
      '<button class="form-submit" type="button">' + t('Log in or sign up') + '</button></div>' +
    '<div class="chips mode-tabs" role="group" hidden>' +
      '<button type="button" class="chip active" data-mode="event">' + t('Add event') + '</button>' +
      '<button type="button" class="chip" data-mode="manage">' + t('Edit events') + '</button>' +
      '<button type="button" class="chip" data-mode="cover">' + t('Cover photo') + '</button></div>' +
    '<form id="ev-form" class="event-form ev-form" hidden>' +
      '<label class="ev-target" hidden><span>' + t('Posting for') + '</span><select name="target"></select></label>' +
      '<input class="ev-title" name="name" required maxlength="80" placeholder="' + t('Event name') + '" aria-label="' + t('Event name') + '">' +
      '<div><div class="ev-lab">' + t('Category') + '</div><div class="ev-seg" role="radiogroup" aria-label="' + t('Category') + '">' +
        ['Social', 'Academic', 'Career', 'Community'].map((c, i) =>
          `<label><input type="radio" name="category" value="${c}"${i ? '' : ' checked'}><span>${t(c)}</span></label>`).join('') + '</div></div>' +
      '<div><div class="ev-lab">' + t('When and where') + '</div><div class="ev-tiles">' +
        tile('<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>', 'Date', '<input name="date" type="date" required>') +
        tile('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 'Time', '<input name="time" type="time" value="12:00">') +
        tile('<path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', 'Building',
          '<input name="building" list="event-buildings" placeholder="' + t('Search, e.g. 1 Central Courtyard') + '">', 'wide') +
      '</div><datalist id="event-buildings"></datalist></div>' +
      '<details class="ev-fold" open><summary><span>' + t('Details') + '<em>' + t('optional') + '</em></span>' + chevron + '</summary>' +
        '<div class="ev-fold-body">' +
          '<textarea name="description" rows="3" maxlength="200" placeholder="' + t('What should people know?') + '" aria-label="' + t('Description') + '"></textarea>' +
          '<input name="meetingNote" maxlength="80" placeholder="' + t('Meeting spot, e.g. look for the red banner') + '" aria-label="' + t('Meeting spot (optional)') + '">' +
        '</div></details>' +
      '<details class="ev-fold" open><summary><span>' + t('Tags') + '<em class="ev-count">' + t('optional') + '</em></span>' + chevron + '</summary>' +
        '<div class="ev-fold-body ev-tags">' +
          [['cup', 'Bring your own cup'], ['plant', 'Plant-based food'], ['quiet', 'Quiet or low-sensory'], ['alcohol', 'Alcohol-free'], ['halal', 'Halal'], ['vegetarian', 'Vegetarian'], ['first', 'First-years welcome']]
            .map(([v, l]) => '<label><input type="checkbox" name="eco" value="' + v + '"><span>' + t(l) + '</span></label>').join('') +
        '</div></details>' +
      '<label class="ev-remove-photo" hidden><input type="checkbox" name="removeImage"> ' + t('Remove current photo') + '</label>' +
      '<div class="ev-cta"><button class="form-submit" type="submit">' + t('Add event') + '</button>' +
        '<button class="ev-cancel" type="button" data-cancel>' + t('Cancel') + '</button></div>' +
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
      '<details class="tag-picker"><summary></summary><div class="tag-options"></div></details>' +
      '<button class="form-submit" type="button" data-save-tags>' + t('Save hashtags') + '</button>' +
      '<p class="form-msg tags-msg" aria-live="polite" hidden></p>' +
    '</section>';
  const form = p.results.querySelector('form');
  const msg = form.querySelector('.form-msg');
  const gate = p.results.querySelector('.guest-gate');
  const tabs = p.results.querySelector('.mode-tabs');
  const targetSelect = form.elements.target;
  const hero = p.popup.querySelector('.popup-island');
  const heroPhoto = hero.querySelector('.hero-photo');
  const photoInput = hero.querySelector('input[name="photo"]');
  const ecoCount = form.querySelector('.ev-count');
  // Shows the chosen (or current) photo as the banner background.
  function setHero(url) {
    hero.style.setProperty('--hero-img', url ? 'url("' + url + '")' : 'none');
    hero.classList.toggle('has-photo', !!url);
    heroPhoto.querySelector('span').textContent = url ? t('Change photo') : t('Add a cover photo');
  }
  function updateEcoCount() {
    const n = form.querySelectorAll('input[name="eco"]:checked').length;
    ecoCount.textContent = n ? n + ' ' + t('selected') : t('optional');
  }
  form.addEventListener('change', (e) => { if (e.target.name === 'eco') updateEcoCount(); });
  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    setHero(file ? URL.createObjectURL(file) : (editing && editing.imageUrl) || null);
  });
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
  const tagPicker = cover.querySelector('.tag-picker');
  const tagOptions = tagPicker.querySelector('.tag-options');
  const tagsMsg = cover.querySelector('.tags-msg');
  const TAG_CHOICES = ['social', 'games', 'sport', 'music', 'art', 'food', 'career', 'study', 'volunteering', 'culture', 'faith', 'science', 'tech', 'wellbeing', 'outdoors', 'networking', 'mandarin', 'cantonese', 'arabic', 'hindi', 'korean', 'vietnamese', 'greek', 'italian', 'filipino', 'nepali', 'punjabi'];
  const MAX_TAGS = 5;
  function pickedTags() {
    return [...tagOptions.querySelectorAll('input:checked')].map((i) => i.value);
  }
  function updateTagPicker() {
    const picked = pickedTags();
    tagPicker.querySelector('summary').textContent = picked.length
      ? picked.map((h) => '#' + h).join(' ')
      : t('Choose hashtags (up to 5)');
    tagOptions.querySelectorAll('input:not(:checked)').forEach((i) => { i.disabled = picked.length >= MAX_TAGS; });
  }
  tagOptions.addEventListener('change', updateTagPicker);
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
    const current = societyTags[coverSelect.value] || [];
    const choices = [...new Set([...TAG_CHOICES, ...current])]; // keep tags saved earlier that are not in the list
    tagOptions.innerHTML = choices.map((h) =>
      `<label><input type="checkbox" value="${esc(h)}"${current.includes(h) ? ' checked' : ''}> #${esc(h)}</label>`).join('');
    updateTagPicker();
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
    const tags = pickedTags();
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
    location.href = '/event-plan.html';
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
    heroPhoto.hidden = form.hidden;
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
  // Only approved society leaders use this page; everyone else goes to the events list.
  let loaded = false;
  const leadersOnly = () => {
    if (auth.user && auth.approvedSocieties.length) return true;
    location.replace('/events.html');
    return false;
  };
  auth.onChange(() => { if (!loaded || leadersOnly()) renderGate(); });
  auth.ready.then(() => {
    loaded = true;
    if (!leadersOnly()) return;
    renderGate();
    // Gentle reminder when one of the leader's societies has not posted for 30 days.
    auth.societyActivity().then((last) => {
      const quiet = auth.approvedSocieties.filter((s) => !last[s.id] || Date.now() - new Date(last[s.id]).getTime() > 30 * 86400000);
      if (!quiet.length) return;
      form.insertAdjacentHTML('beforebegin', `<p class="empty-msg" role="status">${esc(quiet.map((s) => s.name).join(', '))}: ${t('has not posted an event in 30 days. Followers see a society as inactive after 90 days.')}</p>`);
    }).catch(console.error);
    let raw = null;
    try { raw = sessionStorage.getItem('macdirect-edit-event'); sessionStorage.removeItem('macdirect-edit-event'); } catch (err) { /* storage blocked */ }
    if (!raw) return;
    try { window.editSocietyEvent(JSON.parse(raw)); } catch (err) { console.error(err); }
  });

  api('/map').then((data) => {
    form.querySelector('datalist').innerHTML =
      data.features.map((f) => `<option value="${esc(f.properties.name)}">`).join('');
  }).catch(console.error);

  function resetForm() {
    editing = null;
    form.reset();
    setHero(null);
    updateEcoCount();
    removeRow.hidden = true;
    submitBtn.textContent = t('Add event');
    renderGate();
  }
  cancelBtn.addEventListener('click', () => {
    if (!editing) { location.href = '/'; return; }
    resetForm();
    msg.hidden = true;
  });

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
    form.elements.meetingNote.value = ev.meetingNote || '';
    form.querySelectorAll('input[name="eco"]').forEach((c) => { c.checked = (ev.ecoTags || []).includes(c.value); });
    updateEcoCount();
    setHero(ev.imageUrl || null);
    removeRow.hidden = !ev.imageUrl;
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
        : await auth.saveEvent({ ...fields, id: editing ? editing.id : undefined, societyId: Number(target), ecoTags: f.getAll('eco'), meetingNote: f.get('meetingNote').trim(), hadMeetingNote: !!(editing && editing.meetingNote), removeImage: f.get('removeImage') === 'on' }, photo));
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
