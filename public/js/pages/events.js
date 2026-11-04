// Calendar page: the month is visible to everyone. Followed events and private plans load after sign-in.
// Month or Day view is chosen in User Settings (localStorage imcq-cal-view).
// Pressing a day lists its events; pressing an event shows its building on the map.
// Approved society leaders can edit and delete their society's events here (posting is in the Add event plan popup).
// Plans added through the Add event plan popup are private to the logged-in user (Supabase).
(function () {
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const p = createPopup({ id: 'events-popup', title: 'Calendar', navHref: '/calendar.html' });
  p.results.innerHTML =
    '<div class="cal-body">' +
    '<p class="empty-msg follow-hint" role="status" hidden></p>' +
    '<div class="cal-view">' +
    '<div class="cal-nav">' +
      '<button type="button" class="cal-prev" aria-label="' + t('Previous month') + '">&lsaquo;</button>' +
      '<strong class="cal-title"></strong>' +
      '<button type="button" class="cal-next" aria-label="' + t('Next month') + '">&rsaquo;</button>' +
    '</div>' +
    '<div class="cal-grid"></div>' +
    '<h2 class="cal-day-title"></h2><div class="rest-slot"></div>' +
    '<ul class="card-list"></ul><p class="empty-msg" role="status" hidden></p>' +
    '</div>' +
    '<div class="agenda-view" hidden></div>' +
    '</div>';
  const calView = p.results.querySelector('.cal-view');
  const agendaEl = p.results.querySelector('.agenda-view');
  const hintEl = p.results.querySelector('.follow-hint');
  let agendaEvents = [];
  const titleEl = p.results.querySelector('.cal-title');
  const gridEl = p.results.querySelector('.cal-grid');
  const dayTitleEl = p.results.querySelector('.cal-day-title');
  const nudgeEl = p.results.querySelector('.rest-slot');
  const listEl = p.results.querySelector('.card-list');
  const emptyEl = p.results.querySelector('.empty-msg');
  const today = new Date();
  let month = new Date(today.getFullYear(), today.getMonth(), 1);
  let selected = iso(today);
  let base = [];
  let follows = new Set();
  let plans = [];
  let dayEvents = [];

  const byDate = () => {
    const map = {};
    base.concat(plans).forEach((e) => { (map[e.date] = map[e.date] || []).push(e); });
    return map;
  };

  function render() {
    let view = 'cal';
    try { if (localStorage.getItem('imcq-cal-view') === 'list') view = 'list'; } catch (err) { /* storage blocked: Month */ }
    calView.hidden = view !== 'cal';
    agendaEl.hidden = view !== 'list';
    hintEl.textContent = t('You are not following any societies.') + ' ' + t('Follow societies to see their events here.');
    hintEl.hidden = !auth.user || follows.size > 0 || auth.approvedSocieties.length > 0 || base.length > 0;
    const leaderIds = auth.approvedSocieties.map((s) => s.id);
    base.forEach((e) => { e.canEdit = leaderIds.includes(e.societyId); });
    const events = byDate();
    titleEl.textContent = month.toLocaleDateString(I18N_LOCALES[i18nLang()], { month: 'long', year: 'numeric' });
    let sunStart = false;
    try { sunStart = localStorage.getItem('imcq-week-start') === 'sun'; } catch (err) { /* storage blocked: Monday */ }
    const lead = sunStart ? month.getDay() : (month.getDay() + 6) % 7;
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    let html = (sunStart ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map((d) => `<span class="cal-dow">${t(d)}</span>`).join('');
    html += '<span></span>'.repeat(lead);
    for (let d = 1; d <= days; d++) {
      const key = iso(new Date(month.getFullYear(), month.getMonth(), d));
      const cls = 'cal-day' + (key === selected ? ' selected' : '') + (key === iso(today) ? ' today' : '') + (events[key] ? ' has-events' : '');
      html += `<button type="button" class="${cls}" data-date="${key}">${d}</button>`;
    }
    gridEl.innerHTML = html;

    dayEvents = events[selected] || [];
    dayTitleEl.textContent = formatDate(selected);
    listEl.innerHTML = dayEvents.map((e) => eventCard(e, { calendar: true })).join('');
    nudgeEl.innerHTML = restNote(dayEvents.length);

    agendaEvents = [];
    let agenda = '';
    Object.keys(events).sort().forEach((key) => {
      const d = new Date(key + 'T00:00');
      const loc = I18N_LOCALES[i18nLang()];
      agenda += `<section class="agenda-day"><div class="agenda-rail${key === iso(today) ? ' today' : ''}"><b>${d.getDate()}</b>${esc(d.toLocaleDateString(loc, { weekday: 'short' }))}</div>` +
        `<div class="agenda-col">${restNote(events[key].length)}<ul class="card-list">` +
        events[key].map((e) => { agendaEvents.push(e); return eventCard(e); }).join('') + '</ul></div></section>';
    });
    agendaEl.innerHTML = agenda || `<p class="empty-msg">${t('No events found.')}</p>`;
  }

  // Removes one of the user's own plans when its Remove button is pressed; true if it handled the click.
  async function removePlan(e, list) {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return false;
    const ev = list[[...btn.closest('.card-list').children].indexOf(btn.closest('.card'))];
    if (ev && await choose(t('Remove this plan?'), [{ label: t('Remove'), value: true, danger: true }])) {
      const { error } = await auth.deletePlan(ev.id);
      if (error) { console.error(error); await choose(t('Could not save.'), [], t('Close')); } else loadPlans();
    }
    return true;
  }

  // Posts one of the leader's private plans to a society they lead, so its followers see it; true if it handled the click.
  async function postPlan(e, list) {
    const btn = e.target.closest('[data-post]');
    if (!btn) return false;
    const ev = list[[...btn.closest('.card-list').children].indexOf(btn.closest('.card'))];
    const mine = auth.approvedSocieties;
    if (!ev || !mine.length) return true;
    const society = mine.length > 1
      ? await choose(t('Post to which society?'), mine.map((s) => ({ label: s.name, value: s })))
      : await choose(`${t('Post to followers of')} ${mine[0].name}?`, [{ label: t('Post'), value: mine[0] }]);
    if (!society) return true;
    btn.disabled = true;
    try {
    let photo;
    if (ev.imageUrl) {
      try { const blob = await (await fetch(ev.imageUrl)).blob(); photo = new File([blob], 'photo', { type: blob.type }); } catch (err) { console.error(err); }
    }
    const { error } = await auth.saveEvent({
      societyId: society.id, name: ev.name, category: ev.category, date: ev.date, time: ev.timeValue,
      building: ev.building === 'TBC' ? '' : ev.building, description: ev.description,
    }, photo);
    if (error) { console.error(error); btn.disabled = false; await choose(t('Could not save.'), [], t('Close')); return true; }
    await auth.deletePlan(ev.id);
    window.dispatchEvent(new Event('events-changed'));
    } catch (err) { console.error(err); btn.disabled = false; await choose(t('Could not save.'), [], t('Close')); }
    return true;
  }

  // Handles the Add to calendar buttons (Google opens a new tab, Apple downloads an .ics); true if it handled the click.
  function calendarAction(e, list) {
    const btn = e.target.closest('[data-gcal], [data-ics]');
    if (!btn) return false;
    const ev = list[[...btn.closest('.card-list').children].indexOf(btn.closest('.card'))];
    if (!ev) return true;
    if (btn.hasAttribute('data-gcal')) window.open(googleCalendarUrl(ev), '_blank', 'noopener');
    else downloadIcs(ev);
    return true;
  }

  // "I'm going" on a society event: saves it, then redraws so the count and button update; true if it handled the click.
  async function goingAction(e, list) {
    const btn = e.target.closest('[data-going]');
    if (!btn) return false;
    const ev = list[[...btn.closest('.card-list').children].indexOf(btn.closest('.card'))];
    if (!ev) return true;
    btn.disabled = true;
    const on = !ev.going;
    const { error } = await auth.setGoing(ev.id, on);
    if (error) { console.error(error); btn.disabled = false; await choose(t('Could not save.'), [], t('Close')); return true; }
    ev.going = on;
    ev.goingCount = Math.max(0, (ev.goingCount || 0) + (on ? 1 : -1));
    render();
    return true;
  }

  // Share my walk home: hands a short message to the phone's share sheet; true if it handled the click.
  async function shareAction(e, list) {
    const btn = e.target.closest('[data-share]');
    if (!btn) return false;
    const ev = list[[...btn.closest('.card-list').children].indexOf(btn.closest('.card'))];
    if (!ev) return true;
    const text = `${t('I am going to')} ${ev.name} (${ev.building}, ${formatDate(ev.date)} ${ev.time}). ${t('Please check in with me when it ends.')}`;
    try { await navigator.share({ title: ev.name, text }); } catch (err) { /* cancelled or not allowed */ }
    return true;
  }

  // Cancel or restore a society event (leaders only); true if it handled the click.
  async function cancelAction(e, list) {
    const btn = e.target.closest('[data-cancel]');
    if (!btn) return false;
    const ev = list[[...btn.closest('.card-list').children].indexOf(btn.closest('.card'))];
    if (!ev || !ev.canEdit) return true;
    btn.disabled = true;
    const { error } = await auth.setEventCancelled(ev.id, !ev.cancelled);
    if (error) { console.error(error); btn.disabled = false; await choose(t('Could not save.'), [], t('Close')); return true; }
    ev.cancelled = !ev.cancelled;
    render();
    return true;
  }

  // Handles Edit and Delete on a society event card; true if it handled the click.
  async function leaderAction(e, list) {
    const btn = e.target.closest('[data-edit], [data-delete]');
    if (!btn) return false;
    const ev = list[[...btn.closest('.card-list').children].indexOf(btn.closest('.card'))];
    if (!ev || !ev.canEdit) return true;
    if (btn.hasAttribute('data-edit')) {
      try { sessionStorage.setItem('imcq-edit-event', JSON.stringify(ev)); } catch (err) { console.error(err); }
      location.href = '/event-plan.html';
      return true;
    }
    if (await choose(t('Delete this event?'), [{ label: t('Delete'), value: true, danger: true }])) {
      const { error } = await auth.deleteEvent(ev.id);
      if (error) console.error(error); else location.href = '/calendar.html';
    }
    return true;
  }

  agendaEl.addEventListener('click', async (e) => {
    if (e.target.closest('a, summary')) return; // direction links navigate and Add to calendar opens on their own
    if (calendarAction(e, agendaEvents) || await shareAction(e, agendaEvents) || await goingAction(e, agendaEvents) || await cancelAction(e, agendaEvents) || await removePlan(e, agendaEvents) || await postPlan(e, agendaEvents) || await leaderAction(e, agendaEvents)) return;
    const el = e.target.closest('.card');
    if (!el) return;
    const ev = agendaEvents[[...agendaEl.querySelectorAll('.card')].indexOf(el)];
    if (!ev) return;
    const q = new URLSearchParams({ building: ev.building || '', label: ev.name || '' });
    location.href = '/?' + q.toString();
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
    if (e.target.closest('a')) return;
    if (calendarAction(e, dayEvents) || await shareAction(e, dayEvents) || await goingAction(e, dayEvents) || await cancelAction(e, dayEvents) || await removePlan(e, dayEvents) || await postPlan(e, dayEvents) || await leaderAction(e, dayEvents)) return;
    const el = e.target.closest('.card');
    if (!el) return;
    const ev = dayEvents[[...listEl.children].indexOf(el)];
    if (!ev) return;
    const q = new URLSearchParams({ building: ev.building || '', label: ev.name || '' });
    location.href = '/?' + q.toString();
  });
  listEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('card')) e.target.click();
  });

  const loadPlans = () => auth.listMyPlans().then((data) => { plans = auth.user ? data : []; render(); }).catch(console.error);
  window.addEventListener('events-changed', () => { loadPlans(); loadEvents(); });
  auth.onChange(loadPlans);
  auth.ready.then(render);
  render();
  // The public directory (sample file plus database) is shown to everyone. Private plans stay per user.
  const loadEvents = () => auth.ready.then(async () => {
    const [samples] = await Promise.all([api('/events').catch(() => []), loadVenueAccess()]);
    let rows = [];
    let societies = [];
    let rsvps = null;
    follows = new Set();
    if (auth.configured) {
      try {
        const jobs = [auth.listEvents(), auth.listSocieties()];
        if (auth.user) jobs.push(auth.myFollows(), auth.listRsvps());
        const result = await Promise.all(jobs);
        rows = result[0] || [];
        societies = result[1] || [];
        if (auth.user) {
          follows = new Set(result[2] || []);
          rsvps = result[3];
        }
      } catch (err) {
        console.error(err);
      }
    }
    const names = new Map(societies.map((s) => [s.id, s.name]));
    let list = rows
      .map((e) => ({ ...e, society: names.get(e.societyId) || e.society || '' }))
      .concat(Array.isArray(samples) ? samples : [])
      .filter((e) => !e.cancelled);
    list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')) || (Number(b.id) || 0) - (Number(a.id) || 0));
    let keptActuarial = false;
    list = list.filter((e) => {
      if (e.society !== 'Actuarial Students Society') return true;
      if (keptActuarial) return false;
      keptActuarial = true;
      return true;
    });
    if (rsvps) list.forEach((e) => { e.going = rsvps.mine.has(e.id); e.goingCount = rsvps.counts[e.id] || 0; });
    base = list;
    await loadWalkTimes(base);
    render();
  }).catch((err) => { console.error(err); emptyEl.textContent = t('Could not load events.'); emptyEl.hidden = false; });
  // Lifts and accessible toilets per building name, for the Venue access line on event cards. Failure just hides the line.
  let venueLoaded = false;
  let venueIds = {};
  async function loadVenueAccess() {
    if (venueLoaded) return;
    try {
      const data = await fetch('/api/map').then((r) => r.json());
      window.venueAccess = {};
      venueIds = {};
      window.venueDrink = {};
      data.features.forEach((f) => {
        if (!f.properties || !f.properties.name) return;
        window.venueAccess[f.properties.name] = f.properties.accessibility || null;
        venueIds[f.properties.name] = f.id;
        const d = f.properties.drink;
        const near = d && [['tapit', 'Tap It refill tower'], ['fountain', 'Drinking fountain']].filter(([k]) => d[k]).map(([k, label]) => ({ label, metres: d[k].metres })).sort((a, b) => a.metres - b.metres)[0];
        if (near) window.venueDrink[f.properties.name] = near;
      });
      venueLoaded = true;
    } catch (err) { console.error(err); }
  }
  // Walking minutes from the station to each event's building (80 m a minute), for the Leave the station by line.
  window.venueWalk = {};
  async function loadWalkTimes(events) {
    const names = [...new Set(events.map((e) => e.building))].filter((n) => venueIds[n] !== undefined && window.venueWalk[n] === undefined);
    await Promise.all(names.map((n) => fetch('/api/route?id=' + encodeURIComponent(venueIds[n])).then((r) => (r.ok ? r.json() : null))
      .then((route) => { if (route && route.metres) window.venueWalk[n] = Math.max(1, Math.round(route.metres / 80)); }).catch(() => {})));
  }
  loadEvents();
  auth.ready.then(loadPlans);
})();
