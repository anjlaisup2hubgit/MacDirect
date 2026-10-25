// What's Happening popup over the map: a month calendar of society events.
// Pressing a day lists its events; pressing an event shows its building on the map.
// Events added through the Add event plan popup are kept in localStorage.
(function () {
  const STORE = 'plannedEvents';
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const planned = () => { try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch (e) { return []; } };

  const p = createPopup({ id: 'events-popup', title: "What's Happening", navHref: '/?events', hash: 'events' });
  p.results.innerHTML =
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
    listEl.innerHTML = dayEvents.map(eventCard).join('');
    emptyEl.textContent = 'No events on this day.';
    emptyEl.hidden = dayEvents.length > 0;

    agendaEvents = [];
    let agenda = '';
    Object.keys(events).sort().forEach((key) => {
      agenda += `<h2 class="cal-day-title">${esc(formatDate(key))}</h2><ul class="card-list">` +
        events[key].map((e) => { agendaEvents.push(e); return eventCard(e); }).join('') + '</ul>';
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
    p.setOpen(false);
    if (window.focusBuildingByName) window.focusBuildingByName(ev.building, ev.name);
  });
  listEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('card')) e.target.click();
  });

  window.addEventListener('events-changed', render);
  render();
  api('/events').then((data) => { base = data; render(); })
    .catch((err) => { console.error(err); emptyEl.textContent = 'Could not load events.'; emptyEl.hidden = false; });
})();
