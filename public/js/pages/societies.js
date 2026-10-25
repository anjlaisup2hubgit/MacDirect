// Societies popup over the map. Pressing a society closes the popup and shows its building on the map.
(function () {
  const popup = document.getElementById('societies-popup');
  const searchInput = popup.querySelector('.page-search');
  const chipsEl = popup.querySelector('.chips');
  const listEl = popup.querySelector('.card-list');
  const emptyEl = popup.querySelector('.empty-msg');
  const navLink = document.querySelector('.bottom-nav a[href="/?societies"]');

  let societies = [];
  let category = 'All';

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const shown = societies.filter((s) =>
      (category === 'All' || s.category === category) &&
      (s.name + ' ' + s.description).toLowerCase().includes(q));
    listEl.innerHTML = shown.map(societyCard).join('');
    emptyEl.hidden = shown.length > 0;
  }

  function renderChips() {
    const cats = ['All', ...new Set(societies.map((s) => s.category))];
    chipsEl.innerHTML = cats.map((c) =>
      `<button type="button" class="chip${c === category ? ' active' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  }

  function setOpen(open) {
    popup.hidden = !open;
    if (open) document.querySelector('#food-popup .popup-close').click();
    if (navLink) navLink.classList.toggle('active', open);
  }

  window.openSocieties = () => setOpen(popup.hidden);

  searchInput.addEventListener('input', render);
  popup.querySelector('.popup-close').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  chipsEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    category = chip.dataset.cat;
    renderChips();
    render();
  });
  listEl.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const s = societies.find((x) => x.id === Number(card.dataset.id));
    setOpen(false);
    if (window.focusBuildingByName) window.focusBuildingByName(s.building, s.name);
  });
  listEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('card')) e.target.click();
  });

  api('/societies').then((data) => {
    societies = data;
    renderChips();
    render();
  }).catch((err) => {
    console.error(err);
    emptyEl.textContent = 'Could not load societies.';
    emptyEl.hidden = false;
  });

  if (new URLSearchParams(location.search).has('societies')) setOpen(true);
})();
