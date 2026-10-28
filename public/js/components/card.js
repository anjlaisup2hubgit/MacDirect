function esc(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

// Hashtags of a society or food outlet; the category stands in until some are set.
function hashtagsOf(item) {
  const tags = item.hashtags && item.hashtags.length ? item.hashtags : [item.category];
  return tags.map((h) => String(h).toLowerCase().replace(/[^a-z0-9]+/g, '')).filter(Boolean);
}

// Turns typed text such as "#social, Board Games" into clean tags (at most 5, 24 characters each).
function parseHashtags(text) {
  const tags = text.split(/[\s,]+/).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24)).filter(Boolean);
  return [...new Set(tags)].slice(0, 5);
}

function hashtagLine(item) {
  return `<p class="hashtags">${hashtagsOf(item).map((h) => '#' + esc(h)).join(' ')}</p>`;
}

// Fallback banner when there is no photo: one of five soft patterns, chosen from the name so a card keeps its colour.
function coverDiv(name) {
  let sum = 0;
  for (const ch of String(name)) sum += ch.charCodeAt(0);
  return `<div class="society-cover cover-v${sum % 5}"></div>`;
}

// Three-dot menu at the bottom right of a card; the items are [data attribute, label] pairs.
function cardMenu(items) {
  return `<div class="card-menu-wrap"><button type="button" class="card-menu" data-menu aria-haspopup="menu" aria-expanded="false" aria-label="${t('More actions')}">` +
    '<svg width="4" height="16" viewBox="0 0 4 16" aria-hidden="true"><circle cx="2" cy="2" r="2" fill="currentColor"/><circle cx="2" cy="8" r="2" fill="currentColor"/><circle cx="2" cy="14" r="2" fill="currentColor"/></svg></button>' +
    '<ul class="card-menu-list" role="menu" hidden>' +
    items.map(([attr, label]) => `<li role="none"><button type="button" role="menuitem" ${attr}>${t(label)}</button></li>`).join('') + '</ul></div>';
}

function closeCardMenus() {
  document.querySelectorAll('.card-menu-list:not([hidden])').forEach((m) => {
    m.hidden = true;
    m.previousElementSibling.setAttribute('aria-expanded', 'false');
  });
}

function toggleCardMenu(btn) {
  const list = btn.nextElementSibling;
  const open = list.hidden;
  closeCardMenus();
  list.hidden = !open;
  btn.setAttribute('aria-expanded', String(open));
}

document.addEventListener('click', (e) => { if (!e.target.closest('.card-menu-wrap')) closeCardMenus(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCardMenus(); });

function societyCard(s, following, imageUrl) {
  return `<li class="card card-society" data-id="${s.id}" tabindex="0">` +
    (imageUrl ? `<img class="society-cover" src="${esc(imageUrl)}" alt="${esc(s.name)}" loading="lazy">` : coverDiv(s.name)) +
    `<div class="card-body"><h2 title="${esc(s.name)}">${esc(s.name)}</h2>` +
    `<p>${esc(s.description)}</p>` +
    hashtagLine(s) +
    `<div class="card-foot"><button type="button" class="follow-btn${following ? ' following' : ''}" data-follow>${t(following ? 'Following' : 'Follow')}</button>` +
    cardMenu([['data-map', 'Show on map']]) + '</div></div></li>';
}

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Opening hours as { Mon: '...', ... }. Keys of the data may be days or ranges ("Mon-Fri").
function hoursByDay(hours) {
  const out = {};
  Object.entries(hours || {}).forEach(([k, v]) => {
    const [a, b] = k.split('-');
    if (WEEK.indexOf(a) < 0 || WEEK.indexOf(b || a) < 0) return;
    for (let d = WEEK.indexOf(a); d <= WEEK.indexOf(b || a); d++) out[WEEK[d]] = v;
  });
  return out;
}

function foodCard(f) {
  const days = hoursByDay(f.hours);
  const todayKey = WEEK[(new Date().getDay() + 6) % 7];
  const label = (v) => (v === 'Closed' ? t('Closed') : esc(v));
  return `<li class="card card-society" data-id="${f.id}" tabindex="0">` +
    (f.image ? `<img class="society-cover" src="${esc(f.image)}" alt="${esc(f.name)}" loading="lazy">` : coverDiv(f.name)) +
    `<div class="card-body"><h2 title="${esc(f.name)}">${esc(f.name)}</h2>` +
    `<p>${esc(f.description)}</p>` +
    `<p>${esc(f.building)} &middot; ${t('Today')}: ${label(days[todayKey] || 'Closed')}</p>` +
    `<details class="hours"><summary>${t('Opening hours')}</summary><ul>` +
      WEEK.map((d) => `<li><span>${t(d)}</span><span>${label(days[d] || 'Closed')}</span></li>`).join('') + '</ul></details>' +
    hashtagLine(f) + '<div class="card-foot">' + cardMenu([['data-map', 'Show on map']]) + '</div></div></li>';
}

function formatDate(iso) {
  return new Date(iso + 'T00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function taskCard(t) {
  return `<li class="card${t.done ? ' card-done' : ''}" data-id="${t.id}" tabindex="0">` +
    `<span class="card-tag">${esc(t.category)}</span>` +
    `<h2>${t.done ? '&#10003; ' : ''}${esc(t.name)}</h2>` +
    `<p>Due ${esc(formatDate(t.due))}</p></li>`;
}

// Start and end of an event as floating local times (YYYYMMDDTHHMMSS), 1 hour long. Times like "12:00pm" or "14:30"
// are read; if the time cannot be read the event is all-day ({ allDay: true } with YYYYMMDD dates, end exclusive).
function calendarTimes(ev) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ev.date || '');
  if (!d) return null;
  const m = /^\s*(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)?\s*$/i.exec(ev.time || '');
  let h = m ? Number(m[1]) : -1;
  const min = m && m[2] ? Number(m[2]) : 0;
  if (m && m[3]) { if (h < 1 || h > 12) h = -1; else h = (h % 12) + (m[3].toLowerCase() === 'pm' ? 12 : 0); }
  const p2 = (n) => String(n).padStart(2, '0');
  const fmt = (ms, withTime) => { const x = new Date(ms); // UTC arithmetic only, so daylight saving cannot shift it
    return `${x.getUTCFullYear()}${p2(x.getUTCMonth() + 1)}${p2(x.getUTCDate())}` + (withTime ? `T${p2(x.getUTCHours())}${p2(x.getUTCMinutes())}00` : ''); };
  if (h < 0 || h > 23 || min > 59) {
    const day = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]));
    return { allDay: true, start: fmt(day), end: fmt(day + 86400000) };
  }
  const start = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), h, min);
  return { allDay: false, start: fmt(start, true), end: fmt(start + 3600000, true) };
}

function googleCalendarUrl(ev) {
  const c = calendarTimes(ev);
  if (!c) return '';
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(ev.name || '')}&dates=${c.start}/${c.end}` +
    `&details=${encodeURIComponent(ev.description || '')}&location=${encodeURIComponent(ev.building || '')}`;
}

function icsText(ev) {
  const c = calendarTimes(ev);
  if (!c) return '';
  const esc2 = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const when = c.allDay ? [`DTSTART;VALUE=DATE:${c.start}`, `DTEND;VALUE=DATE:${c.end}`] : [`DTSTART:${c.start}`, `DTEND:${c.end}`];
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//iMCQ//Calendar//EN', 'BEGIN:VEVENT',
    `UID:${ev.id || c.start}-${c.start}@imcq`, `DTSTAMP:${stamp}`, ...when,
    `SUMMARY:${esc2(ev.name)}`, `DESCRIPTION:${esc2(ev.description)}`, `LOCATION:${esc2(ev.building)}`,
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n') + '\r\n';
}

// Downloads the event as an .ics file named after it.
function downloadIcs(ev) {
  const text = icsText(ev);
  if (!text) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
  a.download = (String(ev.name || 'event').replace(/[^\w\- ]+/g, '').trim() || 'event') + '.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function eventCard(e) {
  return `<li class="card card-society" data-id="${e.id}" tabindex="0">` +
    (e.imageUrl ? `<img class="society-cover event-poster" src="${esc(e.imageUrl)}" alt="${esc(e.name)}" loading="lazy">` : coverDiv(e.name)) +
    `<div class="card-body"><span class="card-tag">${esc(e.category)}</span>` +
    `<h2 title="${esc(e.name)}">${esc(e.name)}</h2>` +
    `<p>${esc(formatDate(e.date))} &middot; ${esc(e.time)} &middot; ${esc(e.building)}</p>` +
    `<p>${esc(e.description)}</p>` +
    `<p class="card-actions-label">${t('Add to calendar')}</p>` +
    `<div class="card-actions" role="group" aria-label="${t('Add to calendar')}"><button type="button" class="follow-btn" data-gcal>${t('Google')}</button>` +
      `<button type="button" class="follow-btn" data-ics>${t('Apple / Outlook')}</button></div>` +
    (e.mine ? `<button type="button" class="follow-btn" data-remove>${t('Remove')}</button>` : '') +
    (e.canEdit ? `<div class="card-actions"><button type="button" class="follow-btn" data-edit>${t('Edit')}</button>` +
      `<button type="button" class="follow-btn" data-delete>${t('Delete')}</button></div>` : '') + '</div></li>';
}
