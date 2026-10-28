// Floating search + mcqAI bar. Call initSearchBar(features, onSelect, onAsk) once pins are loaded.
// Typing lists matching buildings plus an "Ask mcqAI" row; optional onAsk(text) returns the answer text to show.
function initSearchBar(features, onSelect, onAsk) {
  const mount = document.getElementById('search-bar-mount');
  mount.innerHTML =
    '<div class="search-bar">' +
    '<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="#373A36" stroke-width="1.6"/><path d="M15 15l9 9" stroke="#373A36" stroke-width="1.8" stroke-linecap="round"/></svg>' +
    '<input type="search" placeholder="' + t('Search buildings or ask mcqAI') + '" aria-label="' + t('Search campus or ask mcqAI') + '" autocomplete="off">' +
    '<button class="mcqai-info" type="button" aria-label="' + t('About mcqAI') + '">' +
    '<svg viewBox="0 0 40 40" width="28" height="28"><circle cx="20" cy="20" r="17" fill="#fff" stroke="#373A36" stroke-width="1.8"/><circle cx="20" cy="11" r="2.2" fill="#373A36"/><path d="M20 17v14M16 17h4M16 31h8" stroke="#373A36" stroke-width="2" fill="none"/></svg>' +
    '</button></div><ul class="search-results"></ul><div class="mcqai-panel" hidden></div>';

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
    features
      .filter((f) => f.properties.name.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 8)
      .forEach((f) => {
        addRow(f.properties.name, '', () => {
          list.innerHTML = '';
          panel.hidden = true;
          input.value = f.properties.name;
          onSelect(f);
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

  mount.querySelector('.mcqai-info').addEventListener('click', () => {
    if (panel.hidden) showPanel(t('mcqAI is your campus assistant. Search for a building, or type a question and choose "Ask mcqAI".'));
    else panel.hidden = true;
  });
}
