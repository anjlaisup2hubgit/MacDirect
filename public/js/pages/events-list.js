// Public events list. The create form stays on event-plan.html and is only for approved leaders.
(function () {
  const listEl = document.querySelector('#events-board .card-list');
  const emptyEl = document.querySelector('#events-board .empty-msg');
  const searchEl = document.querySelector('#events-board .page-search');
  const createBtn = document.getElementById('create-event');
  const noteEl = document.getElementById('create-note');
  let events = [];

  let shown = [];

  function render() {
    const q = searchEl.value.trim().toLowerCase();
    const leaderIds = auth.approvedSocieties.map((s) => s.id);
    shown = events.filter((e) => {
      if (e.cancelled) return false;
      if (!q) return true;
      const hay = [e.name, e.society, e.building, e.description, e.meetingNote, e.date, formatDate(e.date), e.time].join(' ').toLowerCase();
      return hay.includes(q);
    });
    shown.forEach((e) => { e.canEdit = leaderIds.includes(e.societyId); });
    listEl.innerHTML = shown.map((e) => eventCard(e)).join('');
    emptyEl.hidden = shown.length > 0;
    emptyEl.textContent = events.length ? 'No events found.' : 'No events yet.';
  }

  function cardOf(target) {
    const card = target.closest('.card');
    return card ? shown[[...listEl.children].indexOf(card)] : null;
  }

  listEl.addEventListener('click', async (ev) => {
    if (ev.target.closest('a')) return;
    const btn = ev.target.closest('button');
    if (!btn) {
      const card = ev.target.closest('.card');
      if (card) toggleEventDetails(card);
      return;
    }
    const item = cardOf(btn);
    if (!item) return;
    if (btn.hasAttribute('data-gcal')) { window.open(googleCalendarUrl(item), '_blank', 'noopener'); return; }
    if (btn.hasAttribute('data-ics')) { downloadIcs(item); return; }
    if (btn.hasAttribute('data-share')) {
      const text = 'I am going to ' + item.name + ' (' + item.building + ', ' + formatDate(item.date) + ' ' + item.time + '). Please check in with me when it ends.';
      try { await navigator.share({ title: item.name, text }); } catch (err) { /* cancelled or not allowed */ }
      return;
    }
    if (btn.hasAttribute('data-going')) {
      if (!auth.user) {
        noteEl.hidden = false;
        noteEl.textContent = 'Log in to mark that you are going.';
        return;
      }
      btn.disabled = true;
      const on = !item.going;
      const { error } = await auth.setGoing(item.id, on);
      if (error) { console.error(error); btn.disabled = false; noteEl.hidden = false; noteEl.textContent = 'Could not save.'; return; }
      item.going = on;
      item.goingCount = Math.max(0, (item.goingCount || 0) + (on ? 1 : -1));
      render();
      return;
    }
    if (btn.hasAttribute('data-edit') && item.canEdit) {
      try { sessionStorage.setItem('imcq-edit-event', JSON.stringify(item)); } catch (err) { console.error(err); }
      location.href = '/event-plan.html';
      return;
    }
    if (btn.hasAttribute('data-cancel') && item.canEdit) {
      btn.disabled = true;
      const { error } = await auth.setEventCancelled(item.id, !item.cancelled);
      if (error) { console.error(error); btn.disabled = false; noteEl.hidden = false; noteEl.textContent = 'Could not save.'; return; }
      item.cancelled = !item.cancelled;
      render();
      return;
    }
    if (btn.hasAttribute('data-delete') && item.canEdit) {
      if (!(await choose('Delete this event?', [{ label: 'Delete', value: true, danger: true }]))) return;
      const { error } = await auth.deleteEvent(item.id);
      if (error) { console.error(error); noteEl.hidden = false; noteEl.textContent = 'Could not save.'; return; }
      events = events.filter((e) => e.id !== item.id);
      render();
    }
  });

  async function load() {
    try {
      if (!auth.configured) throw new Error('no database');
      const jobs = [auth.listEvents(), auth.listSocieties(), api('/events').catch(() => [])];
      if (auth.user) jobs.push(auth.listRsvps());
      const result = await Promise.all(jobs);
      const [rows, societies, samples] = result;
      const rsvps = result[3];
      const names = new Map(societies.map((s) => [s.id, s.name]));
      events = rows
        .map((e) => ({ ...e, society: names.get(e.societyId) || e.society || '' }))
        .concat(Array.isArray(samples) ? samples : [])
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || (Number(b.id) || 0) - (Number(a.id) || 0));
      if (rsvps) events.forEach((e) => { e.going = rsvps.mine.has(e.id); e.goingCount = rsvps.counts[e.id] || 0; });
      let keptActuarial = false;
      events = events.filter((e) => {
        if (e.society !== 'Actuarial Students Society') return true;
        if (keptActuarial) return false;
        keptActuarial = true;
        return true;
      });
      render();
    } catch (err) {
      console.error(err);
      events = [];
      listEl.replaceChildren();
      emptyEl.hidden = false;
      emptyEl.textContent = 'Could not load events.';
    }
  }

  listEl.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    if (!ev.target.classList.contains('card')) return;
    ev.preventDefault();
    toggleEventDetails(ev.target);
  });
  searchEl.addEventListener('input', render);
  createBtn.addEventListener('click', () => {
    if (auth.user && auth.approvedSocieties.length) {
      location.href = '/event-plan.html';
      return;
    }
    noteEl.hidden = false;
    noteEl.textContent = auth.user
      ? 'Only society leaders and execs can create an event.'
      : 'Log in as a society leader or exec to create an event.';
  });

  auth.ready.then(load);
})();
