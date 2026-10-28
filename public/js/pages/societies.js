// Societies popup over the map. Pressing a society closes the popup and shows its building on the map.
(function () {
  const popup = document.getElementById('societies-popup');
  const searchInput = popup.querySelector('.page-search');
  const sortEl = popup.querySelector('.list-sort');
  const listEl = popup.querySelector('.card-list');
  const emptyEl = popup.querySelector('.empty-msg');
  const navLink = document.querySelector('.bottom-nav a[href="/?societies"]');

  let societies = [];
  let follows = new Set();
  let images = {};

  function render() {
    const q = searchInput.value.trim().toLowerCase();
    const shown = societies.filter((s) =>
      (s.name + ' ' + s.description + ' ' + hashtagsOf(s).join(' ')).toLowerCase().includes(q.replace(/^#/, '')));
    shown.sort((a, b) => a.name.localeCompare(b.name) * (sortEl.value === 'za' ? -1 : 1));
    listEl.innerHTML = shown.map((s) => societyCard(s, follows.has(s.id), images[s.id])).join('');
    emptyEl.hidden = shown.length > 0;
  }

  function setOpen(open) {
    popup.hidden = !open;
    if (open) {
      document.querySelectorAll('.societies-popup:not(#societies-popup) .popup-close').forEach((b) => b.click());
      if (window.clearBuildingSelection) window.clearBuildingSelection();
    }
    if (navLink) {
      navLink.classList.toggle('active', open);
      if (open) navLink.setAttribute('aria-current', 'page'); else navLink.removeAttribute('aria-current');
    }
  }

  window.openSocieties = () => setOpen(popup.hidden);

  searchInput.addEventListener('input', render);
  sortEl.addEventListener('change', render);
  popup.querySelector('.popup-close').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  listEl.addEventListener('click', async (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const menuBtn = e.target.closest('[data-menu]');
    if (menuBtn) { toggleCardMenu(menuBtn); return; }
    const s = societies.find((x) => x.id === Number(card.dataset.id));
    if (e.target.closest('[data-follow]')) {
      if (!auth.requireLogin('Log in to follow societies')) return;
      const on = !follows.has(s.id);
      const { error } = await auth.setFollow(s.id, on);
      if (error) { console.error(error); return; }
      on ? follows.add(s.id) : follows.delete(s.id);
      window.dispatchEvent(new Event('events-changed')); // Calendar reloads its followed events
      render();
      return;
    }
    setOpen(false);
    if (window.focusBuildingByName) window.focusBuildingByName(s.building, s.name);
  });
  listEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('card')) e.target.click();
  });

  window.addEventListener('society-images-changed', () => {
    auth.listSocietyImages().then((map) => { images = map; render(); }).catch(console.error);
  });

  Promise.all([auth.ready.then(() => auth.listSocieties()), auth.ready.then(() => auth.myFollows()), auth.ready.then(() => auth.listSocietyImages())]).then(([data, ids, imgs]) => {
    societies = data;
    follows = new Set(ids);
    images = imgs;
    render();
  }).catch((err) => {
    console.error(err);
    emptyEl.textContent = t('Could not load societies.');
    emptyEl.hidden = false;
  });

  if (new URLSearchParams(location.search).has('societies')) {
    setOpen(true);
    history.replaceState(null, '', location.pathname);
  }
})();
