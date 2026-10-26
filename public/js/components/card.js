function esc(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

function societyCard(s, following) {
  return `<li class="card" data-id="${s.id}" tabindex="0">` +
    `<span class="card-tag">${esc(s.category)}</span>` +
    `<h2>${esc(s.name)}</h2>` +
    `<p>${esc(s.description)}</p>` +
    `<button type="button" class="follow-btn${following ? ' following' : ''}" data-follow>${following ? 'Following' : 'Follow'}</button></li>`;
}

function foodCard(f) {
  return `<li class="card" data-id="${f.id}" tabindex="0">` +
    `<span class="card-tag">${esc(f.category)}</span>` +
    `<h2>${esc(f.name)}</h2>` +
    `<p>${esc(f.description)}</p>` +
    `<p>${esc(f.building)} &middot; ${esc(f.hours)}</p></li>`;
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
  return `<li class="card" data-id="${e.id}" tabindex="0">` +
    `<span class="card-tag">${esc(e.category)}</span>` +
    `<h2>${esc(e.name)}</h2>` +
    `<p>${esc(formatDate(e.date))} &middot; ${esc(e.time)} &middot; ${esc(e.building)}</p>` +
    `<p>${esc(e.description)}</p></li>`;
}
