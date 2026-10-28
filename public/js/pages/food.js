// Food and drinks popup over the map. Pressing an outlet closes the popup and shows its building on the map.
(function () {
  const popup = document.getElementById('food-popup');
  const searchInput = popup.querySelector('.page-search');
  const sortEl = popup.querySelector('.list-sort');
  const listEl = popup.querySelector('.card-list');
  const emptyEl = popup.querySelector('.empty-msg');
  const navLink = document.querySelector('.bottom-nav a[href="/?food"]');

  let items = [];

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const shown = items.filter((s) =>
      (s.name + ' ' + s.description + ' ' + hashtagsOf(s).join(' ')).toLowerCase().includes(q.replace(/^#/, '')));
    shown.sort((a, b) => a.name.localeCompare(b.name) * (sortEl.value === 'za' ? -1 : 1));
    listEl.innerHTML = shown.map(foodCard).join('');
    emptyEl.hidden = shown.length > 0;
  }

  function setOpen(open) {
    popup.hidden = !open;
    if (open) {
      document.querySelectorAll('.societies-popup:not(#food-popup) .popup-close').forEach((b) => b.click());
      if (window.clearBuildingSelection) window.clearBuildingSelection();
    }
    if (navLink) {
      navLink.classList.toggle('active', open);
      if (open) navLink.setAttribute('aria-current', 'page'); else navLink.removeAttribute('aria-current');
    }
  }

  window.openFood = () => setOpen(popup.hidden);

  searchInput.addEventListener('input', render);
  sortEl.addEventListener('change', render);
  popup.querySelector('.popup-close').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  listEl.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card || e.target.closest('.hours')) return; // opening hours just expand
    const menuBtn = e.target.closest('[data-menu]');
    if (menuBtn) { toggleCardMenu(menuBtn); return; }
    const s = items.find((x) => x.id === Number(card.dataset.id));
    setOpen(false);
    if (window.focusBuildingByName) window.focusBuildingByName(s.building, s.name);
  });
  listEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('card')) e.target.click();
  });

  api('/food').then((data) => {
    items = data;
    window.searchExtras.push(...data.map((f) => ({ name: f.name, building: f.building, kind: 'Food' })));
    render();
  }).catch((err) => {
    console.error(err);
    emptyEl.textContent = t('Could not load food outlets.');
    emptyEl.hidden = false;
  });

  if (new URLSearchParams(location.search).has('food')) {
    setOpen(true);
    history.replaceState(null, '', location.pathname);
  }
})();
