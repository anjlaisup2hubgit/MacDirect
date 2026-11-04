function esc(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;'); // quotes too, so it is safe inside attributes
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

// "Last event posted ..." under a society's description, so out-of-date societies are easy to spot.
// `last` is undefined while unknown, null when the society has never posted, or an ISO date.
function freshnessLine(last, followers) {
  const parts = [];
  if (last === null) parts.push(t('No events posted yet'));
  else if (last) {
    const days = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
    parts.push(`${t('Last event posted')} ${esc(formatDate(last.slice(0, 10)))}` + (days > 90 ? ` &middot; ${t('No new events in 90 days')}` : ''));
  }
  if (followers) parts.push(`${followers} ${t(followers === 1 ? 'follower' : 'followers')}`);
  return parts.length ? `<p class="society-fresh">${parts.join(' &middot; ')}</p>` : '';
}

function societyCard(s, following, imageUrl, last, followers) {
  return `<li class="card card-society" data-id="${s.id}" tabindex="0">` +
    (imageUrl ? `<img class="society-cover" src="${esc(imageUrl)}" alt="${esc(s.name)}" loading="lazy">` : coverDiv(s.name)) +
    `<div class="card-body"><h2 title="${esc(s.name)}">${esc(s.name)}</h2>` +
    `<p>${esc(s.description)}</p>` + freshnessLine(last, followers) +
    `<div class="card-foot">${hashtagLine(s)}` +
    (typeof s.id === 'number' ? `<button type="button" class="follow-btn${following ? ' following' : ''}" data-follow>${t(following ? 'Following' : 'Follow')}</button>` : '') +
    '</div>' +
    cardMenu([['data-map', 'Show on map'], ['data-join', 'How to join'], ['data-similar', 'Similar societies']]) + '</div></li>';
}

// Society transparency: who leads a society and how to contact them. `leaders` is an array of names.
function leadersCard(s, leaders) {
  const row = (label, value) => `<dt>${t(label)}</dt><dd>${value}</dd>`;
  const site = /^https?:\/\//i.test(s.website || '') ? `<a href="${esc(s.website)}" target="_blank" rel="noopener">${esc(s.website)}</a>` : '';
  return `<li class="card card-info"><h2>${esc(s.name)}</h2><dl>` +
    row('Leaders', leaders && leaders.length ? esc(leaders.join(', ')) : t('Not listed yet')) +
    (s.contact ? row('Email', `<a href="mailto:${esc(s.contact)}">${esc(s.contact)}</a>`) : '') +
    (site ? row('Website', site) : '') + '</dl></li>';
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
    hashtagLine(f) + cardMenu([['data-map', 'Show on map']]) + '</div></li>';
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
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MacDirect//Calendar//EN', 'BEGIN:VEVENT',
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

const ECO_TAGS = {
  cup: 'Bring your own cup', plant: 'Plant-based food', quiet: 'Quiet or low-sensory', alcohol: 'Alcohol-free',
  halal: 'Halal', vegetarian: 'Vegetarian', first: 'First-years welcome',
};

function ecoTagLine(e) {
  const tags = (e.ecoTags || []).filter((k) => ECO_TAGS[k]);
  return tags.length ? `<p class="eco-tags">${tags.map((k) => `<span class="eco-tag">${t(ECO_TAGS[k])}</span>`).join('')}</p>` : '';
}

// Gentle nudge for a day with many events.
function restNote(count) {
  return count >= 4
    ? `<div class="rest-nudge" role="status"><p>${t('Remember to rest')}</p>` +
      `<p>${t('Feeling overloaded? Macquarie wellbeing can help.')} ` +
      `<a href="https://students.mq.edu.au/support/personal/wellbeing" target="_blank" rel="noopener">${t('Get support')}</a></p></div>`
    : '';
}

// One line about the venue's lifts and accessible toilets, from the map data events.js loads (window.venueAccess).
function venueAccessLine(e) {
  if (!window.venueAccess || !e.building || e.building === 'TBC') return '';
  const a = window.venueAccess[e.building];
  if (a === undefined) return '';
  const parts = [];
  if (a) {
    if (a.lifts) parts.push(`${t('Lifts')}: ${a.lifts}`);
    if (a.toilets) parts.push(`${t('Accessible toilets')}: ${a.toilets}`);
  }
  return `<p class="event-access">${t('Venue access')}: ${esc(parts.length ? parts.join(' · ') : t('Not confirmed'))}</p>`;
}

// "Leave the station by ..." for a timed event, from the walk time events.js worked out (window.venueWalk, minutes).
function leaveByLine(e) {
  const mins = window.venueWalk && window.venueWalk[e.building];
  const m = /^(\d{2}):(\d{2})/.exec(e.timeValue || '');
  if (!mins || !m || e.cancelled) return '';
  const total = Number(m[1]) * 60 + Number(m[2]) - mins;
  if (total < 0) return '';
  const h = Math.floor(total / 60);
  return `<p class="event-access">${t('Leave the station by')} ${h % 12 || 12}:${String(total % 60).padStart(2, '0')}${h < 12 ? 'am' : 'pm'} (${t('about')} ${mins} ${t('min walk')})</p>`;
}

// Nearest drinking water to the venue, from the map data events.js loads (window.venueDrink).
function waterLine(e) {
  const d = window.venueDrink && window.venueDrink[e.building];
  if (!d) return '';
  const dist = d.metres < 20 ? t('Right next to this building') : `${t('About')} ${Math.round(d.metres / 10) * 10} m ${t('away')}`;
  return `<p class="event-access">${t('Nearest water')}: ${t(d.label)}, ${dist}</p>`;
}

// For events that start at 5 pm or later: the real Campus Security escort and shuttle (students.mq.edu.au safety page).
function eveningInfo(e) {
  const hour = Number((e.timeValue || '').slice(0, 2));
  if (!e.timeValue || hour < 17 || e.cancelled) return '';
  return `<p class="event-access">${t('After dark, Campus Security can walk you to the station, bus stops or car parks: +61 2 9850 7112. A free shuttle bus runs Monday to Friday, 4 pm to 12.30 am, during session.')}</p>` +
    (navigator.share ? `<div class="card-actions"><button type="button" class="follow-btn" data-share>${t('Share my walk home')}</button></div>` : '');
}

// Walk there, plus a lit route to the station for events that start at 5 pm or later.
function eventWalkLinks(e) {
  if (!e.building || e.building === 'TBC') return '';
  const base = '/?directions=' + encodeURIComponent(e.building);
  const hour = Number((e.timeValue || '').slice(0, 2));
  const evening = e.timeValue && hour >= 17;
  return `<div class="card-actions"><a class="follow-btn" href="${base}">${t('Walk there')}</a>` +
    (evening ? `<a class="follow-btn" href="${base}&lit=1">${t('Lit route to the station')}</a>` : '') + '</div>';
}

function eventBox(label, text) {
  return `<div class="event-box"><p class="event-box-label">${esc(label)}</p><p>${text}</p></div>`;
}

function eventCard(e, opts) {
  const calendar = opts && opts.calendar;
  const when = esc(formatDate(e.date)) + (e.time ? ' · ' + esc(e.time) : '');
  const place = esc(e.building || '') + (e.meetingNote ? '. ' + esc(t('Meeting spot')) + ': ' + esc(e.meetingNote) : '');
  const facts = calendar
    ? `<div class="event-details">` +
        eventBox(t('Date and time'), when) +
        eventBox(t('Location'), place) +
        (e.description ? eventBox(t('Description'), esc(e.description)) : '') +
      `</div>`
    : `<p>${when} &middot; ${esc(e.building)}</p><p>${esc(e.description)}</p>` +
      (e.meetingNote ? `<p class="event-access">${t('Meeting spot')}: ${esc(e.meetingNote)}</p>` : '');
  return `<li class="card card-society${calendar ? ' cal-event' : ''}${e.cancelled ? ' event-cancelled' : ''}" data-id="${e.id}" tabindex="0">` +
    (e.imageUrl ? `<img class="society-cover event-poster" src="${esc(e.imageUrl)}" alt="${esc(e.name)}" loading="lazy">` : coverDiv(e.name)) +
    `<div class="card-body"><span class="card-tag">${esc(e.category)}</span>` + (e.cancelled ? ` <span class="card-tag cancelled-tag">${t('Cancelled')}</span>` : '') +
    `<h2 title="${esc(e.name)}">${esc(e.name)}</h2>` +
    facts + ecoTagLine(e) +
    venueAccessLine(e) + waterLine(e) + leaveByLine(e) + eventWalkLinks(e) + eveningInfo(e) +
    (e.mine || e.cancelled ? '' : `<div class="card-actions"><button type="button" class="follow-btn" data-going aria-pressed="${e.going ? 'true' : 'false'}">${e.going ? t('Going') : t("I'm going")}</button>` +
      `<span class="event-going">${e.goingCount ? e.goingCount + ' ' + t('going') : ''}</span></div>`) +
    `<p class="card-actions-label">${t('Add to calendar')}</p>` +
    `<div class="card-actions" role="group" aria-label="${t('Add to calendar')}"><button type="button" class="follow-btn" data-gcal>${t('Google')}</button>` +
      `<button type="button" class="follow-btn" data-ics>${t('Apple / Outlook')}</button></div>` +
    (e.mine ? `<div class="card-actions"><button type="button" class="follow-btn" data-remove>${t('Remove')}</button>` +
      (auth.user && auth.approvedSocieties.length ? `<button type="button" class="follow-btn" data-post>${t('Post')}</button>` : '') + '</div>' : '') +
    (e.canEdit ? `<div class="card-actions"><button type="button" class="follow-btn" data-edit>${t('Edit')}</button>` +
      `<button type="button" class="follow-btn" data-cancel>${t(e.cancelled ? 'Restore event' : 'Cancel event')}</button>` +
      `<button type="button" class="follow-btn" data-delete>${t('Delete')}</button></div>` : '') + '</div></li>';
}

// In-page dialog (native confirm/prompt are blocked in some browsers and then do nothing).
// Resolves to the chosen button's value, or null when cancelled.
function choose(message, choices, cancelLabel) {
  return new Promise((resolve) => {
    const d = document.createElement('dialog');
    d.className = 'login-prompt';
    d.innerHTML = `<p>${esc(message)}</p><div>` +
      choices.map((c, i) => `<button class="form-submit${c.danger ? ' delete-btn' : ''}" type="button" data-pick="${i}">${esc(c.label)}</button>`).join('') +
      `<button class="auth-guest" type="button" data-close>${esc(cancelLabel || t('Cancel'))}</button></div>`;
    const done = (value) => { d.remove(); resolve(value); };
    d.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      done(btn.dataset.pick !== undefined ? choices[btn.dataset.pick].value : null);
    });
    d.addEventListener('cancel', (e) => { e.preventDefault(); done(null); });
    document.body.appendChild(d);
    d.showModal();
  });
}
