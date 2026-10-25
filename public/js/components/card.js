function esc(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

function societyCard(s) {
  return `<li class="card" data-id="${s.id}" tabindex="0">` +
    `<span class="card-tag">${esc(s.category)}</span>` +
    `<h2>${esc(s.name)}</h2>` +
    `<p>${esc(s.description)}</p></li>`;
}

function foodCard(f) {
  return `<li class="card" data-id="${f.id}" tabindex="0">` +
    `<span class="card-tag">${esc(f.category)}</span>` +
    `<h2>${esc(f.name)}</h2>` +
    `<p>${esc(f.description)}</p>` +
    `<p>${esc(f.building)} &middot; ${esc(f.hours)}</p></li>`;
}
