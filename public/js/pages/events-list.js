// Public events list. The create form stays on event-plan.html and is only for approved leaders.
(function () {
  const listEl = document.querySelector('#events-board .card-list');
  const emptyEl = document.querySelector('#events-board .empty-msg');
  const searchEl = document.querySelector('#events-board .page-search');
  const createBtn = document.getElementById('create-event');
  const noteEl = document.getElementById('create-note');
  let events = [];

  function splitDescription(text) {
    const clean = String(text || '').trim();
    const cut = clean.search(/[.!?](\s|$)/);
    if (!clean || cut === -1) return { intro: clean, further: '' };
    return { intro: clean.slice(0, cut + 1).trim(), further: clean.slice(cut + 1).trim() };
  }

  function box(label, text) {
    const section = document.createElement('div');
    section.className = 'event-box';
    const name = document.createElement('p');
    name.className = 'event-box-label';
    name.textContent = label;
    const copy = document.createElement('p');
    copy.textContent = text;
    section.append(name, copy);
    return section;
  }

  function row(e) {
    const li = document.createElement('li');
    li.className = 'card card-society';
    li.tabIndex = 0;
    li.setAttribute('aria-expanded', 'false');
    const body = document.createElement('div');
    body.className = 'card-body';
    const society = document.createElement('span');
    society.className = 'card-tag';
    society.textContent = e.society || e.category;
    const title = document.createElement('h2');
    title.textContent = e.name;
    const when = formatDate(e.date) + (e.time ? ' · ' + e.time : '');
    const place = e.building && e.building !== 'TBC' ? e.building : 'Location to be confirmed';
    const parts = splitDescription(e.description);
    const preview = document.createElement('ul');
    preview.className = 'event-preview';
    [when, place, parts.intro].filter(Boolean).forEach((line) => {
      const item = document.createElement('li');
      item.textContent = line;
      preview.append(item);
    });
    const full = document.createElement('div');
    full.className = 'event-details';
    full.hidden = true;
    const meet = e.meetingNote ? place + '. ' + e.meetingNote : place;
    full.append(box('Date and time', when));
    full.append(box('Location', meet));
    if (e.description) full.append(box('Description', e.description));
    // Campus buildings start with a street number. A city address has no map pin.
    if (/^\d+\s/.test(e.building || '')) {
      const actions = document.createElement('div');
      actions.className = 'card-actions';
      const walk = document.createElement('a');
      walk.className = 'follow-btn';
      walk.href = '/?building=' + encodeURIComponent(e.building);
      walk.textContent = 'Show on map';
      actions.append(walk);
      full.append(actions);
    }
    const more = document.createElement('p');
    more.className = 'event-more';
    more.textContent = 'Full details';
    body.append(society, title, preview, full, more);
    li.append(body);
    li.insertAdjacentHTML('afterbegin', coverDiv(e.name));
    function toggle() {
      const open = full.hidden;
      full.hidden = !open;
      preview.hidden = open;
      more.textContent = open ? 'Hide details' : 'Full details';
      li.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    li.addEventListener('click', (ev) => {
      if (ev.target.closest('a')) return;
      toggle();
    });
    li.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      ev.preventDefault();
      toggle();
    });
    return li;
  }

  function render() {
    const q = searchEl.value.trim().toLowerCase();
    const shown = events.filter((e) => {
      if (e.cancelled) return false;
      if (!q) return true;
      const hay = [e.name, e.society, e.building, e.description, e.meetingNote, e.date, formatDate(e.date), e.time].join(' ').toLowerCase();
      return hay.includes(q);
    });
    listEl.replaceChildren(...shown.map(row));
    emptyEl.hidden = shown.length > 0;
    emptyEl.textContent = events.length ? 'No events found.' : 'No events yet.';
  }

  async function load() {
    try {
      if (!auth.configured) throw new Error('no database');
      const [rows, societies, samples] = await Promise.all([
        auth.listEvents(),
        auth.listSocieties(),
        api('/events').catch(() => []),
      ]);
      const names = new Map(societies.map((s) => [s.id, s.name]));
      events = rows
        .map((e) => ({ ...e, society: names.get(e.societyId) || e.society || '' }))
        .concat(Array.isArray(samples) ? samples : [])
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || (Number(b.id) || 0) - (Number(a.id) || 0));
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
