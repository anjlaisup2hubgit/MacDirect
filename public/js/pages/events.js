// What's Happening popup over the map: a month calendar of society events.
// Pressing a day lists its events; pressing an event shows its building on the map.
// Events added through the Add event plan popup are kept in localStorage.
(function () {
  const STORE = 'plannedEvents';
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const planned = () => { try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch (e) { return []; } };

  const p = createPopup({ id: 'events-popup', title: "What's Happening", navHref: '/?events', hash: 'events' });
  p.results.innerHTML =
    '<div class="leader-panel" hidden>' +
      '<button type="button" class="form-submit post-toggle">Post event</button>' +
      '<form class="event-form" hidden>' +
        '<label>Society<select name="society"></select></label>' +
        '<label>Event name<input name="name" required maxlength="80"></label>' +
        '<label>Category<select name="category">' +
          ['Social', 'Academic', 'Career', 'Community'].map((c) => `<option>${c}</option>`).join('') + '</select></label>' +
        '<label>Date<input name="date" type="date" required></label>' +
        '<label>Time<input name="time" type="time" value="12:00"></label>' +
        '<label>Building<input name="building" placeholder="e.g. 1CC"></label>' +
        '<label>Description<textarea name="description" rows="3" maxlength="200"></textarea></label>' +
        '<button class="form-submit" type="submit">Save event</button>' +
        '<p class="form-msg" hidden></p>' +
      '</form>' +
    '</div>' +
    '<div class="chips cal-tabs" role="tablist">' +
      '<button type="button" class="chip active" data-view="cal">Month</button>' +
      '<button type="button" class="chip" data-view="list">Day</button>' +
    '</div>' +
    '<div class="cal-view">' +
    '<div class="cal-nav">' +
      '<button type="button" class="cal-prev" aria-label="Previous month">&lsaquo;</button>' +
      '<strong class="cal-title"></strong>' +
      '<button type="button" class="cal-next" aria-label="Next month">&rsaquo;</button>' +
    '</div>' +
    '<div class="cal-grid"></div>' +
    '<h2 class="cal-day-title"></h2>' +
    '<ul class="card-list"></ul><p class="empty-msg" hidden></p>' +
    '</div>' +
    '<div class="agenda-view" hidden></div>';
  const calView = p.results.querySelector('.cal-view');
  const agendaEl = p.results.querySelector('.agenda-view');
  const tabsEl = p.results.querySelector('.cal-tabs');
  let agendaEvents = [];
  const titleEl = p.results.querySelector('.cal-title');
  const gridEl = p.results.querySelector('.cal-grid');
  const dayTitleEl = p.results.querySelector('.cal-day-title');
  const listEl = p.results.querySelector('.card-list');
  const emptyEl = p.results.querySelector('.empty-msg');

  const today = new Date();
  let month = new Date(today.getFullYear(), today.getMonth(), 1);
  let selected = iso(today);
  let base = [];
  let dayEvents = [];

  const canEdit = (e) => !!e.societyId && auth.approvedSocieties.some((s) => s.id === e.societyId);

  const byDate = () => {
    const map = {};
    base.concat(planned()).forEach((e) => { (map[e.date] = map[e.date] || []).push(e); });
    return map;
  };

  function render() {
    const events = byDate();
    titleEl.textContent = month.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
    const lead = (month.getDay() + 6) % 7; // week starts Monday
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    let html = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<span class="cal-dow">${d}</span>`).join('');
    html += '<span></span>'.repeat(lead);
    for (let d = 1; d <= days; d++) {
      const key = iso(new Date(month.getFullYear(), month.getMonth(), d));
      const cls = 'cal-day' + (key === selected ? ' selected' : '') + (key === iso(today) ? ' today' : '') + (events[key] ? ' has-events' : '');
      html += `<button type="button" class="${cls}" data-date="${key}">${d}</button>`;
    }
    gridEl.innerHTML = html;

    dayEvents = events[selected] || [];
    dayTitleEl.textContent = formatDate(selected);
    listEl.innerHTML = dayEvents.map((e) => eventCard(e, canEdit(e))).join('');
    emptyEl.textContent = 'No events on this day.';
    emptyEl.hidden = dayEvents.length > 0;

    agendaEvents = [];
    let agenda = '';
    Object.keys(events).sort().forEach((key) => {
      agenda += `<h2 class="cal-day-title">${esc(formatDate(key))}</h2><ul class="card-list">` +
        events[key].map((e) => { agendaEvents.push(e); return eventCard(e, canEdit(e)); }).join('') + '</ul>';
    });
    agendaEl.innerHTML = agenda || '<p class="empty-msg">No events found.</p>';
  }

  tabsEl.addEventListener('click', (e) => {
    const tab = e.target.closest('.chip');
    if (!tab) return;
    tabsEl.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === tab));
    calView.hidden = tab.dataset.view !== 'cal';
    agendaEl.hidden = tab.dataset.view !== 'list';
  });
  agendaEl.addEventListener('click', (e) => {
    const el = e.target.closest('.card');
    if (!el) return;
    const ev = agendaEvents[[...agendaEl.querySelectorAll('.card')].indexOf(el)];
    if (!ev) return;
    if (cardAction(e, ev)) return;
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
  listEl.addEventListener('click', (e) => {
    const el = e.target.closest('.card');
    if (!el) return;
    const ev = dayEvents[[...listEl.children].indexOf(el)];
    if (!ev) return;
    if (cardAction(e, ev)) return;
    p.setOpen(false);
    if (window.focusBuildingByName) window.focusBuildingByName(ev.building, ev.name);
  });
  listEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('card')) e.target.click();
  });

  // Leaders: post, edit and delete events for their approved societies.
  const panel = p.results.querySelector('.leader-panel');
  const form = panel.querySelector('form');
  const formMsg = form.querySelector('.form-msg');
  let editingId = null;

  function showMsg(text, isError) {
    formMsg.textContent = text;
    formMsg.classList.toggle('error', !!isError);
    formMsg.hidden = false;
  }
  function renderPanel() {
    const societies = auth.approvedSocieties;
    panel.hidden = societies.length === 0;
    form.elements.society.innerHTML = societies.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
  }
  function openForm(ev) {
    editingId = ev ? ev.id : null;
    form.reset();
    formMsg.hidden = true;
    if (ev) {
      form.elements.society.value = ev.societyId;
      form.elements.name.value = ev.name;
      form.elements.category.value = ev.category;
      form.elements.date.value = ev.date;
      form.elements.time.value = ev.timeValue;
      form.elements.building.value = ev.building === 'TBC' ? '' : ev.building;
      form.elements.description.value = ev.description;
    }
    form.hidden = false;
    form.scrollIntoView({ block: 'nearest' });
  }
  async function reload() {
    base = await auth.listEvents();
    render();
  }
  // Handles Edit/Delete on a card; returns true when the press was one of those buttons.
  function cardAction(e, ev) {
    if (e.target.closest('[data-edit]')) { openForm(ev); return true; }
    if (e.target.closest('[data-delete]')) {
      if (confirm(`Delete "${ev.name}"?`)) {
        auth.deleteEvent(ev.id).then(({ error }) => { if (error) alert('Could not delete the event.'); else reload(); });
      }
      return true;
    }
    return false;
  }

  panel.querySelector('.post-toggle').addEventListener('click', () => (form.hidden ? openForm(null) : (form.hidden = true)));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const { error } = await auth.saveEvent({
      id: editingId,
      societyId: Number(f.get('society')),
      name: f.get('name').trim(),
      category: f.get('category'),
      date: f.get('date'),
      time: f.get('time'),
      building: f.get('building').trim(),
      description: f.get('description').trim(),
    });
    if (error) { console.error(error); showMsg('Could not save the event.', true); return; }
    form.hidden = true;
    editingId = null;
    await reload();
  });

  window.addEventListener('events-changed', render);
  auth.onChange(() => { renderPanel(); render(); });
  render();
  auth.ready.then(() => {
    renderPanel();
    // Supabase is the source of events; the JSON file is only a fallback when it is not configured.
    return auth.configured ? auth.listEvents() : api('/events');
  }).then((data) => { base = data; render(); })
    .catch((err) => { console.error(err); emptyEl.textContent = 'Could not load events.'; emptyEl.hidden = false; });
})();
