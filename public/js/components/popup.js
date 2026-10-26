// Builds a floating-island popup over the map: a pinned header island plus a scrolling body.
// Opening one popup closes the others. Registered in window.popups so the nav link can toggle it.
function createPopup({ id, title, navHref, hash, searchPlaceholder }) {
  const popup = document.createElement('div');
  popup.id = id;
  popup.className = 'societies-popup';
  popup.hidden = true;
  popup.innerHTML =
    '<div class="popup-island">' +
      `<div class="popup-head"><h1>${esc(t(title))}</h1>` +
      `<button class="popup-close" type="button" aria-label="${esc(t('Close'))}">&times;</button></div>` +
      (searchPlaceholder
        ? `<input class="page-search" type="search" placeholder="${esc(searchPlaceholder)}" aria-label="${esc(searchPlaceholder)}" autocomplete="off">` +
          '<div class="chips" role="group" aria-label="Filter by category"></div>'
        : '') +
    '</div>' +
    '<div class="popup-results"></div>';
  document.getElementById('nav-mount').before(popup);

  const navLink = document.querySelector(`.bottom-nav a[href="${navHref}"]`);

  function setOpen(open) {
    popup.hidden = !open;
    if (open) document.querySelectorAll(`.societies-popup:not(#${id}) .popup-close`).forEach((b) => b.click());
    if (navLink) {
      navLink.classList.toggle('active', open);
      if (open) navLink.setAttribute('aria-current', 'page'); else navLink.removeAttribute('aria-current');
    }
  }

  (window.popups = window.popups || {})[navHref] = () => setOpen(popup.hidden);
  popup.querySelector('.popup-close').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  if (new URLSearchParams(location.search).has(hash)) {
    setOpen(true);
    history.replaceState(null, '', location.pathname);
  }

  return { popup, results: popup.querySelector('.popup-results'), setOpen };
}

// A searchable, category-filtered card list inside a popup.
function createListPopup({ card, text, category, onSelect, emptyText, ...popupOpts }) {
  const p = createPopup(popupOpts);
  p.results.innerHTML = '<ul class="card-list"></ul><p class="empty-msg" hidden></p>';
  const searchInput = p.popup.querySelector('.page-search');
  const chipsEl = p.popup.querySelector('.chips');
  const listEl = p.results.querySelector('.card-list');
  const emptyEl = p.results.querySelector('.empty-msg');
  let items = [];
  let selected = 'All';

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const shown = items.filter((i) => (selected === 'All' || category(i) === selected) && text(i).toLowerCase().includes(q));
    listEl.innerHTML = shown.map(card).join('');
    emptyEl.textContent = emptyText;
    emptyEl.hidden = shown.length > 0;
  }

  function renderChips() {
    const cats = ['All', ...new Set(items.map(category))];
    if (!cats.includes(selected)) selected = 'All';
    chipsEl.innerHTML = cats.map((c) =>
      `<button type="button" class="chip${c === selected ? ' active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  }

  searchInput.addEventListener('input', render);
  chipsEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    selected = chip.dataset.cat;
    renderChips();
    render();
  });
  listEl.addEventListener('click', (e) => {
    const el = e.target.closest('.card');
    if (!el) return;
    const item = items.find((i) => i.id === Number(el.dataset.id));
    if (item) onSelect(item, { render, setOpen: p.setOpen });
  });
  listEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('card')) e.target.click();
  });

  return {
    setItems(next) { items = next; renderChips(); render(); },
    setError(msg) { emptyEl.textContent = msg; emptyEl.hidden = false; },
  };
}
