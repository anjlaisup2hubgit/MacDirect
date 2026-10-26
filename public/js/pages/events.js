// Calendar popup over the map (logged-in users only): events of the societies you follow, plus your own plans.
// Month or Day view is chosen in User Settings (localStorage imcq-cal-view).
// Pressing a day lists its events; pressing an event shows its building on the map.
// Approved society leaders can also post, edit and delete events for their own society here.
// Plans added through the Add event plan popup are private to the logged-in user (Supabase).
(function () {
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const p = createPopup({ id: 'events-popup', title: 'Calendar', navHref: '/?events', hash: 'events' });
  const openPopup = window.popups['/?events'];
  // Guests are asked to log in instead of opening the calendar. Closing is always allowed.
  window.popups['/?events'] = () => {
    if (p.popup.hidden && !auth.user && !auth.requireLogin('Log in to view the calendar')) return;
    openPopup();
  };
  p.results.innerHTML =
    '<div class="account guest-gate" hidden>' +
      '<p>' + t('Log in to view the calendar') + '.</p>' +
      '<button class="form-submit" type="button">' + t('Log in or sign up') + '</button></div>' +
    '<div class="cal-body">' +
    '<p class="empty-msg follow-hint" hidden></p>' +
    '<button type="button" class="follow-btn post-btn" hidden>' + t('Post event') + '</button>' +
    '<form class="event-form leader-form" hidden>' +
      '<label>' + t('Society') + '<select name="society"></select></label>' +
      '<label>' + t('Event name') + '<input name="name" required maxlength="80"></label>' +
      '<label>' + t('Category') + '<select name="category">' +
        ['Social', 'Academic', 'Career', 'Community'].map((c) => `<option value="${c}">${t(c)}</option>`).join('') + '</select></label>' +
      '<label>' + t('Date') + '<input name="date" type="date" required></label>' +
      '<label>' + t('Time') + '<input name="time" type="time" value="12:00"></label>' +
      '<label>' + t('Building') + '<input name="building" list="leader-buildings" placeholder="' + t('e.g. 1CC') + '"></label>' +
      '<datalist id="leader-buildings"></datalist>' +
      '<label>' + t('Description') + '<textarea name="description" rows="3" maxlength="200"></textarea></label>' +
      '<button class="form-submit" type="submit">' + t('Save event') + '</button>' +
      '<button class="auth-guest" type="button" data-cancel>' + t('Cancel') + '</button>' +
      '<p class="form-msg" hidden></p>' +
    '</form>' +
    '<div class="cal-view">' +
    '<div class="cal-nav">' +
      '<button type="button" class="cal-prev" aria-label="' + t('Previous month') + '">&lsaquo;</button>' +
      '<strong class="cal-title"></strong>' +
      '<button type="button" class="cal-next" aria-label="' + t('Next month') + '">&rsaquo;</button>' +
    '</div>' +
    '<div class="cal-grid"></div>' +
    '<h2 class="cal-day-title"></h2>' +
    '<ul class="card-list"></ul><p class="empty-msg" hidden></p>' +
    '</div>' +
    '<div class="agenda-view" hidden></div>' +
    '</div>';
  const calView = p.results.querySelector('.cal-view');
  const agendaEl = p.results.querySelector('.agenda-view');
  const gate = p.results.querySelector('.guest-gate');
  const bodyEl = p.results.querySelector('.cal-body');
  const hintEl = p.results.querySelector('.follow-hint');
  let agendaEvents = [];
  const titleEl = p.results.querySelector('.cal-title');
  const gridEl = p.results.querySelector('.cal-grid');
  const dayTitleEl = p.results.querySelector('.cal-day-title');
  const listEl = p.results.querySelector('.card-list');
  const emptyEl = p.results.querySelector('.empty-msg');
  const postBtn = p.results.querySelector('.post-btn');
  const form = p.results.querySelector('.leader-form');
  const formMsg = form.querySelector('.form-msg');
  let editing = null; // the event being edited, or null when posting a new one

  const today = new Date();
  let month = new Date(today.getFullYear(), today.getMonth(), 1);
  let selected = iso(today);
  let base = [];
  let follows = new Set();
  let ready = false; // true once auth has loaded, so a logged-in user never sees the gate flash
  let plans = [];
  let dayEvents = [];

  const byDate = () => {
    const map = {};
    base.concat(plans).forEach((e) => { (map[e.date] = map[e.date] || []).push(e); });
    return map;
  };

  function render() {
    const guest = ready && !auth.user;
    gate.hidden = !guest;
    bodyEl.hidden = guest;
    if (guest) return;
    let view = 'cal';
    try { if (localStorage.getItem('imcq-cal-view') === 'list') view = 'list'; } catch (err) { /* storage blocked: Month */ }
    calView.hidden = view !== 'cal';
    agendaEl.hidden = view !== 'list';
    hintEl.textContent = t('You are not following any societies.') + ' ' + t('Follow societies to see their events here.');
    hintEl.hidden = follows.size > 0;
    const leaderIds = auth.approvedSocieties.map((s) => s.id);
    base.forEach((e) => { e.canEdit = leaderIds.includes(e.societyId); });
    postBtn.hidden = !leaderIds.length;
    if (!leaderIds.length) form.hidden = true;
    const events = byDate();
    titleEl.textContent = month.toLocaleDateString({ en: 'en-AU', zh: 'zh-CN', es: 'es', vi: 'vi' }[i18nLang()], { month: 'long', year: 'numeric' });
    const lead = (month.getDay() + 6) % 7; // week starts Monday
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    let html = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<span class="cal-dow">${t(d)}</span>`).join('');
    html += '<span></span>'.repeat(lead);
    for (let d = 1; d <= days; d++) {
      const key = iso(new Date(month.getFullYear(), month.getMonth(), d));
      const cls = 'cal-day' + (key === selected ? ' selected' : '') + (key === iso(today) ? ' today' : '') + (events[key] ? ' has-events' : '');
      html += `<button type="button" class="${cls}" data-date="${key}">${d}</button>`;
    }
    gridEl.innerHTML = html;

    dayEvents = events[selected] || [];
    dayTitleEl.textContent = formatDate(selected);
    listEl.innerHTML = dayEvents.map((e) => eventCard(e)).join('');
    emptyEl.textContent = t('No events on this day.');
    emptyEl.hidden = dayEvents.length > 0;

    agendaEvents = [];
    let agenda = '';
    Object.keys(events).sort().forEach((key) => {
      agenda += `<h2 class="cal-day-title">${esc(formatDate(key))}</h2><ul class="card-list">` +
        events[key].map((e) => { agendaEvents.push(e); return eventCard(e); }).join('') + '</ul>';
    });
    agendaEl.innerHTML = agenda || `<p class="empty-msg">${t('No events found.')}</p>`;
  }

  // Removes one of the user's own plans when its Remove button is pressed; true if it handled the click.
  async function removePlan(e, list) {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return false;
    const ev = list[[...btn.closest('.card-list').children].indexOf(btn.closest('.card'))];
    if (ev && confirm(t('Remove this plan?'))) {
      const { error } = await auth.deletePlan(ev.id);
      if (error) console.error(error); else loadPlans();
    }
    return true;
  }

  function openForm(ev) {
    editing = ev || null;
    const socs = auth.approvedSocieties;
    const sel = form.elements.society;
    sel.innerHTML = socs.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
    sel.closest('label').hidden = socs.length < 2;
    form.reset();
    if (ev) {
      sel.value = ev.societyId;
      form.elements.name.value = ev.name;
      form.elements.category.value = ev.category;
      form.elements.date.value = ev.date;
      form.elements.time.value = ev.timeValue;
      form.elements.building.value = ev.building === 'TBC' ? '' : ev.building;
      form.elements.description.value = ev.description;
    }
    formMsg.hidden = true;
    form.hidden = false;
    form.scrollIntoView({ block: 'nearest' });
  }

  // Handles Edit and Delete on a society event card; true if it handled the click.
  async function leaderAction(e, list) {
    const btn = e.target.closest('[data-edit], [data-delete]');
    if (!btn) return false;
    const ev = list[[...btn.closest('.card-list').children].indexOf(btn.closest('.card'))];
    if (!ev || !ev.canEdit) return true;
    if (btn.hasAttribute('data-edit')) { openForm(ev); return true; }
    if (confirm(t('Delete this event?'))) {
      const { error } = await auth.deleteEvent(ev.id);
      if (error) console.error(error); else loadEvents();
    }
    return true;
  }

  postBtn.addEventListener('click', () => openForm());
  form.querySelector('[data-cancel]').addEventListener('click', () => { form.hidden = true; });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const submit = form.querySelector('.form-submit');
    submit.disabled = true; // stops a double tap saving the event twice
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
      }));
    } catch (err) { error = err; }
    submit.disabled = false;
    if (error) {
      console.error(error);
      formMsg.textContent = t('Could not save.');
      formMsg.hidden = false;
    } else {
      form.hidden = true;
      loadEvents();
    }
  });
  api('/map').then((data) => {
    form.querySelector('datalist').innerHTML =
      data.features.map((f) => `<option value="${esc(f.properties.name)}">`).join('');
  }).catch(console.error);

  gate.querySelector('button').addEventListener('click', () => { location.href = '/login.html'; });
  agendaEl.addEventListener('click', async (e) => {
    if (await removePlan(e, agendaEvents) || await leaderAction(e, agendaEvents)) return;
    const el = e.target.closest('.card');
    if (!el) return;
    const ev = agendaEvents[[...agendaEl.querySelectorAll('.card')].indexOf(el)];
    if (!ev) return;
    p.setOpen(false);
    if (window.focusBuildingByName) window.focusBuildingByName(ev.building, ev.name);
  });
  agendaEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('card')) e.target.click();
  });

  function shiftMonth(n) {
    month = new Date(month.getFullYear(), month.getMonth() + n, 1);
    render();
  }

  p.results.querySelector('.cal-prev').addEventListener('click', () => shiftMonth(-1));
  p.results.querySelector('.cal-next').addEventListener('click', () => shiftMonth(1));
  gridEl.addEventListener('click', (e) => {
    const day = e.target.closest('.cal-day');
    if (!day) return;
    selected = day.dataset.date;
    render();
  });
  listEl.addEventListener('click', async (e) => {
    if (await removePlan(e, dayEvents) || await leaderAction(e, dayEvents)) return;
    const el = e.target.closest('.card');
    if (!el) return;
    const ev = dayEvents[[...listEl.children].indexOf(el)];
    if (!ev) return;
    p.setOpen(false);
    if (window.focusBuildingByName) window.focusBuildingByName(ev.building, ev.name);
  });
  listEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('card')) e.target.click();
  });

  const loadPlans = () => auth.listMyPlans().then((data) => { plans = auth.user ? data : []; render(); }).catch(console.error);
  window.addEventListener('events-changed', () => { loadPlans(); loadEvents(); });
  auth.onChange(loadPlans);
  auth.ready.then(() => { ready = true; render(); });
  render();
  // Only events of followed societies are shown; own plans are not filtered. Guests load nothing.
  const loadEvents = () => auth.ready.then(() => (auth.user ? Promise.all([auth.listEvents(), auth.myFollows()]) : [[], []]))
    .then(([data, ids]) => { follows = new Set(ids); base = data.filter((e) => follows.has(e.societyId)); render(); })
    .catch((err) => { console.error(err); emptyEl.textContent = t('Could not load events.'); emptyEl.hidden = false; });
  loadEvents();
  auth.ready.then(loadPlans);
})();
