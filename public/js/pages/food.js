// Restaurants page. Pressing an outlet opens its building on the map.
(function () {
  const popup = document.getElementById('food-popup');
  const searchInput = popup.querySelector('.page-search');
  const sortEl = popup.querySelector('.list-sort');
  const listEl = popup.querySelector('.card-list');
  const emptyEl = popup.querySelector('.empty-msg');

  let items = [];

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const shown = items.filter((s) =>
      (s.name + ' ' + s.description + ' ' + hashtagsOf(s).join(' ')).toLowerCase().includes(q.replace(/^#/, '')));
    shown.sort((a, b) => a.name.localeCompare(b.name) * (sortEl.value === 'za' ? -1 : 1));
    listEl.innerHTML = shown.map(foodCard).join('');
    emptyEl.hidden = shown.length > 0;
  }

  function showOnMap(building, label) {
    const q = new URLSearchParams({ building: building || '', label: label || building || '' });
    location.href = '/?' + q.toString();
  }

  searchInput.addEventListener('input', render);
  sortEl.addEventListener('change', render);
  listEl.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card || e.target.closest('.hours')) return; // opening hours just expand
    const menuBtn = e.target.closest('[data-menu]');
    if (menuBtn) { toggleCardMenu(menuBtn); return; }
    const s = items.find((x) => x.id === Number(card.dataset.id));
    showOnMap(s.building, s.name);
  });
  listEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('card')) e.target.click();
  });

  api('/food').then((data) => {
    items = data;
    render();
  }).catch((err) => {
    console.error(err);
    emptyEl.textContent = t('Could not load food outlets.');
    emptyEl.hidden = false;
  });

})();
