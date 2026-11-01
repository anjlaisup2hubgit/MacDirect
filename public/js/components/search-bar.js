// Floating search + mcqAI bar. Call initSearchBar(features, onSelect, onAsk) once pins are loaded.
// Typing lists matching buildings plus an "Ask mcqAI" row; optional onAsk(text) returns the answer text to show.
// Societies and food outlets add themselves here as { name, building, kind } so the bar finds them too.
window.searchExtras = [];

// A query word matches a name word when it is the same, a prefix, or a short typo.
// Numbers have to match exactly, so 12 does not count as 14.
function searchWords(s) {
  return String(s).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
}
function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const next = a[i - 1] === b[j - 1] ? row[j - 1] : 1 + Math.min(row[j - 1], row[j], prev);
      row[j - 1] = prev;
      prev = next;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}
function wordMatches(q, n) {
  if (q === n) return true;
  if (/^\d+$/.test(q) || /^\d+$/.test(n)) return false;
  if (q.length >= 3 && (n.startsWith(q) || q.startsWith(n))) return true;
  const limit = Math.min(3, Math.max(1, Math.floor(Math.max(q.length, n.length) / 3)));
  if (Math.abs(q.length - n.length) > limit) return false;
  return editDistance(q, n) <= limit;
}
// Extra words in the real name are fine: "12 christopher avenue" still reaches
// "14 Sir Christopher Ondaatje Avenue". At least half the typed words must match.
function fuzzyScore(query, name) {
  const qs = searchWords(query);
  const ns = searchWords(name);
  if (!qs.length || !ns.length) return 0;
  let matched = 0;
  for (const q of qs) if (ns.some((n) => wordMatches(q, n))) matched += 1;
  const score = matched / qs.length;
  const long = qs.filter((q) => !/^\d+$/.test(q) && q.length >= 4);
  const longMatched = long.filter((q) => ns.some((n) => wordMatches(q, n))).length;
  if (long.length && longMatched === 0) return 0;
  if (score < 0.5) return 0;
  if (qs.length === 1 && !/^\d+$/.test(qs[0]) && qs[0].length < 3) return 0;
  return score;
}
function numberGap(query, name) {
  const qn = searchWords(query).filter((w) => /^\d+$/.test(w)).map(Number);
  const nn = searchWords(name).filter((w) => /^\d+$/.test(w)).map(Number);
  if (!qn.length || !nn.length) return 100;
  let best = 100;
  for (const q of qn) for (const n of nn) best = Math.min(best, Math.abs(q - n));
  return best;
}
function fuzzyRank(query, items, nameOf) {
  return items
    .map((item) => ({ item, score: fuzzyScore(query, nameOf(item)) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || numberGap(query, nameOf(a.item)) - numberGap(query, nameOf(b.item)) || nameOf(a.item).localeCompare(nameOf(b.item)))
    .map((x) => x.item);
}

function initSearchBar(features, onSelect, onAsk) {
  const mount = document.getElementById('search-bar-mount');
  mount.innerHTML =
    '<div class="search-bar">' +
    '<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="#1A1220" stroke-width="1.6"/><path d="M15 15l9 9" stroke="#1A1220" stroke-width="1.8" stroke-linecap="round"/></svg>' +
    '<input type="search" placeholder="' + t('Search buildings, societies, restaurants or ask mcqAI') + '" aria-label="' + t('Search campus or ask mcqAI') + '" autocomplete="off">' +
    '</div><ul class="search-results"></ul><div class="mcqai-panel" hidden></div>';

  const input = mount.querySelector('input');
  const list = mount.querySelector('.search-results');
  const panel = mount.querySelector('.mcqai-panel');
  let active = -1;

  const showPanel = (text) => { panel.textContent = text; panel.hidden = false; };
  const setActive = (i) => {
    const items = list.children;
    if (active >= 0 && items[active]) items[active].classList.remove('active');
    active = i;
    if (active >= 0 && items[active]) items[active].classList.add('active');
  };
  const addRow = (text, className, onPick) => {
    const li = document.createElement('li');
    li.textContent = text;
    if (className) li.className = className;
    li.addEventListener('click', onPick);
    list.appendChild(li);
  };
  const ask = (q) => {
    list.innerHTML = '';
    if (onAsk) Promise.resolve(onAsk(q)).then((answer) => answer && showPanel(answer));
  };

  input.addEventListener('input', () => {
    const q = input.value.trim();
    list.innerHTML = '';
    active = -1;
    if (!q) return;
    fuzzyRank(q, features, (f) => f.properties.name)
      .filter((f, i, all) => all.findIndex((x) => x.properties.name === f.properties.name) === i)
      .slice(0, 8)
      .forEach((f) => {
        addRow(f.properties.name, '', () => {
          list.innerHTML = '';
          panel.hidden = true;
          input.value = f.properties.name;
          onSelect(f);
        });
      });
    fuzzyRank(q, window.searchExtras, (x) => x.name)
      .slice(0, 6)
      .forEach((x) => {
        addRow(x.name + ' \u00b7 ' + t(x.kind), '', () => {
          list.innerHTML = '';
          panel.hidden = true;
          input.value = x.name;
          if (window.focusBuildingByName) window.focusBuildingByName(x.building, x.name);
        });
      });
    addRow(t('Ask mcqAI') + ': ' + q, 'ask-ai', () => ask(q));
  });

  input.addEventListener('keydown', (e) => {
    const n = list.children.length;
    if (!n) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((active + 1) % n); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((active - 1 + n) % n); }
    else if (e.key === 'Enter') { e.preventDefault(); list.children[active >= 0 ? active : n - 1].click(); }
  });

}
