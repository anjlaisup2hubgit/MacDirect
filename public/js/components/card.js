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

function societyCard(s, following, imageUrl) {
  return `<li class="card card-society" data-id="${s.id}" tabindex="0">` +
    (imageUrl ? `<img class="society-cover" src="${esc(imageUrl)}" alt="${esc(s.name)}" loading="lazy">` : '<div class="society-cover"></div>') +
    `<div class="card-body"><h2>${esc(s.name)}</h2>` +
    `<p>${esc(s.description)}</p>` +
    hashtagLine(s) +
    `<button type="button" class="follow-btn${following ? ' following' : ''}" data-follow>${t(following ? 'Following' : 'Follow')}</button></div></li>`;
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
    (f.image ? `<img class="society-cover" src="${esc(f.image)}" alt="${esc(f.name)}" loading="lazy">` : '<div class="society-cover"></div>') +
    `<div class="card-body"><h2>${esc(f.name)}</h2>` +
    `<p>${esc(f.description)}</p>` +
    `<p>${esc(f.building)} &middot; ${t('Today')}: ${label(days[todayKey] || 'Closed')}</p>` +
    `<details class="hours"><summary>${t('Opening hours')}</summary><ul>` +
      WEEK.map((d) => `<li><span>${t(d)}</span><span>${label(days[d] || 'Closed')}</span></li>`).join('') + '</ul></details>' +
    hashtagLine(f) + '</div></li>';
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

function eventCard(e) {
  return `<li class="card card-society" data-id="${e.id}" tabindex="0">` +
    (e.imageUrl ? `<img class="society-cover event-poster" src="${esc(e.imageUrl)}" alt="${esc(e.name)}" loading="lazy">` : '<div class="society-cover"></div>') +
    `<div class="card-body"><span class="card-tag">${esc(e.category)}</span>` +
    `<h2>${esc(e.name)}</h2>` +
    `<p>${esc(formatDate(e.date))} &middot; ${esc(e.time)} &middot; ${esc(e.building)}</p>` +
    `<p>${esc(e.description)}</p>` +
    (e.mine ? `<button type="button" class="follow-btn" data-remove>${t('Remove')}</button>` : '') +
    (e.canEdit ? `<div class="card-actions"><button type="button" class="follow-btn" data-edit>${t('Edit')}</button>` +
      `<button type="button" class="follow-btn" data-delete>${t('Delete')}</button></div>` : '') + '</div></li>';
}
