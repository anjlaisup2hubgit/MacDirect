// Societies page. The six category cards come first. A card opens that group.
(function () {
  const CATEGORIES = [
    { name: 'Hobbies', blurb: 'Clubs focused on personal hobbies and interests.' },
    { name: 'Cultural', blurb: 'Clubs that explore and represent the customs, traditions and food of various countries.' },
    { name: 'Professional and Faculty', blurb: 'Clubs centred on giving you industry-specific insights and networking opportunities.' },
    { name: 'Sports', blurb: 'Clubs that aim to keep you active and healthy.' },
    { name: 'Political and Social Justice', blurb: 'Clubs impacting the wider community through social causes and political involvement.' },
    { name: 'Religious and Spiritual', blurb: 'Clubs that connect you to students who share your faith and beliefs.' },
  ];

  const popup = document.getElementById('societies-popup');
  const title = popup.querySelector('h1');
  const close = popup.querySelector('.popup-close');
  const searchInput = popup.querySelector('.page-search');
  const sortEl = popup.querySelector('.list-sort');
  const grid = popup.querySelector('.category-grid');
  const listEl = popup.querySelector('.card-list');
  const emptyEl = popup.querySelector('.empty-msg');
  const results = popup.querySelector('.popup-results');

  let societies = [];
  let follows = new Set();
  let images = {};
  let leaders = {};
  let category = '';

  CATEGORIES.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'category-card';
    btn.dataset.category = c.name;
    const band = document.createElement('span');
    band.className = 'category-band tone-' + i;
    band.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('span');
    copy.className = 'category-copy';
    const heading = document.createElement('span');
    heading.className = 'category-title';
    heading.textContent = t(c.name);
    const blurb = document.createElement('span');
    blurb.className = 'category-blurb';
    blurb.textContent = t(c.blurb);
    const more = document.createElement('span');
    more.className = 'category-more';
    more.textContent = t('Find out more') + ' ›';
    copy.append(heading, blurb, more);
    btn.append(band, copy);
    grid.append(btn);
  });

  // Transparency entry: a wide card under the six categories
  const TRANSPARENCY = 'transparency';
  const tBtn = document.createElement('button');
  tBtn.type = 'button';
  tBtn.className = 'category-card category-wide';
  tBtn.dataset.category = TRANSPARENCY;
  tBtn.innerHTML = '<span class="category-copy"><span class="category-title"></span><span class="category-blurb"></span><span class="category-more"></span></span>';
  tBtn.querySelector('.category-title').textContent = t('Who runs each society');
  tBtn.querySelector('.category-blurb').textContent = t('See each society\'s leaders and how to contact them.');
  tBtn.querySelector('.category-more').textContent = t('Find out more') + ' ›';
  grid.append(tBtn);

  // Logged in users ask to lead a society here; guests are asked to log in first.
  const reqBtn = document.createElement('button');
  reqBtn.type = 'button';
  reqBtn.className = 'follow-btn request-lead';
  reqBtn.textContent = t('Request to lead a society');
  grid.append(reqBtn);

  function openLeaderRequest() {
    if (!auth.requireLogin('Log in to request to lead a society')) return;
    const d = document.createElement('dialog');
    d.className = 'login-prompt';
    const options = societies.filter((s) => typeof s.id === 'number').sort((a, b) => a.name.localeCompare(b.name))
      .map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join('');
    d.innerHTML = `<p>${t('An admin will approve this')}.</p>` +
      `<label>${t('Society')}<select class="leader-pick">${options}</select></label>` +
      '<p class="form-msg" role="status" hidden></p><div>' +
      `<button class="form-submit" type="button" data-send>${t('Send request')}</button>` +
      `<button class="auth-guest" type="button" data-close>${t('Cancel')}</button></div>`;
    const msg = d.querySelector('.form-msg');
    const send = d.querySelector('[data-send]');
    d.addEventListener('click', async (e) => {
      if (e.target.dataset.close !== undefined) d.remove();
      if (e.target !== send) return;
      send.disabled = true;
      const { error } = await auth.requestLeadership(Number(d.querySelector('.leader-pick').value));
      msg.textContent = error ? t(error.userMessage) : t('Request sent. An admin will review it.');
      msg.hidden = false;
      send.disabled = !error;
    });
    d.addEventListener('cancel', () => d.remove());
    document.body.appendChild(d);
    d.showModal();
  }
  reqBtn.addEventListener('click', openLeaderRequest);

  // Manage my societies: tick followed societies and unfollow them in one go (logged in only).
  const manage = document.createElement('section');
  manage.className = 'manage-societies';
  manage.hidden = true;
  grid.append(manage);
  let picked = new Set();

  function renderManage() {
    const mine = societies.filter((s) => follows.has(s.id)).sort((a, b) => a.name.localeCompare(b.name));
    manage.hidden = !auth.user;
    if (manage.hidden) return;
    picked = new Set([...picked].filter((id) => follows.has(id)));
    manage.innerHTML = `<h2>${t('Manage my societies')}</h2>` + (mine.length
      ? `<label class="manage-all"><input type="checkbox" data-all${picked.size === mine.length ? ' checked' : ''}> ${t('Select all')}</label>` +
        '<ul>' + mine.map((s) => `<li><label><input type="checkbox" data-pick="${s.id}"${picked.has(s.id) ? ' checked' : ''}> ${esc(s.name)}</label></li>`).join('') + '</ul>' +
        `<button class="follow-btn" type="button" data-unfollow${picked.size ? '' : ' disabled'}>${t('Unfollow selected')}</button>` +
        '<p class="form-msg" role="status" hidden></p>'
      : `<p class="empty-msg">${t('You are not following any societies yet.')}</p>`);
  }

  manage.addEventListener('change', (e) => {
    if (e.target.dataset.all !== undefined) {
      picked = e.target.checked ? new Set(societies.filter((s) => follows.has(s.id)).map((s) => s.id)) : new Set();
    } else if (e.target.dataset.pick) {
      const id = Number(e.target.dataset.pick);
      e.target.checked ? picked.add(id) : picked.delete(id);
    } else return;
    renderManage();
  });

  manage.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-unfollow]');
    if (!btn) return;
    btn.disabled = true;
    const ids = [...picked];
    const { error } = await auth.unfollowMany(ids);
    if (error) {
      console.error(error);
      const msg = manage.querySelector('.form-msg');
      msg.textContent = t('Could not save.');
      msg.hidden = false;
      btn.disabled = false;
      return;
    }
    ids.forEach((id) => follows.delete(id));
    picked = new Set();
    window.dispatchEvent(new Event('events-changed'));
    render();
  });

  function render() {
    const q = searchInput.value.trim().toLowerCase().replace(/^#/, '');
    const home = !category && !q;
    const people = category === TRANSPARENCY;
    grid.hidden = !home;
    listEl.hidden = home;
    sortEl.hidden = home;
    title.textContent = people ? t('Who runs each society') : category ? t(category) : t('Societies');
    close.setAttribute('aria-label', category ? t('Categories') : t('Map'));
    if (home) {
      renderManage();
      emptyEl.hidden = true;
      return;
    }
    if (people) {
      const shown = societies.filter((s) => !q || (s.name + ' ' + (leaders[s.id] || []).join(' ')).toLowerCase().includes(q));
      shown.sort((a, b) => a.name.localeCompare(b.name) * (sortEl.value === 'za' ? -1 : 1));
      listEl.innerHTML = shown.map((s) => leadersCard(s, leaders[s.id])).join('');
      emptyEl.hidden = shown.length > 0;
      return;
    }
    const shown = societies.filter((s) => {
      if (category && s.category !== category) return false;
      if (!q) return true;
      return (s.name + ' ' + s.description + ' ' + hashtagsOf(s).join(' ')).toLowerCase().includes(q);
    });
    shown.sort((a, b) => a.name.localeCompare(b.name) * (sortEl.value === 'za' ? -1 : 1));
    listEl.innerHTML = shown.map((s) => societyCard(s, follows.has(s.id), images[s.id])).join('');
    emptyEl.hidden = shown.length > 0;
  }

  function showOnMap(building, label) {
    const q = new URLSearchParams({ building: building || '', label: label || building || '' });
    location.href = '/location.html?' + q.toString();
  }

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.category-card');
    if (!card) return;
    category = card.dataset.category;
    searchInput.value = '';
    history.pushState({ societyCategory: category }, '');
    render();
    results.scrollTop = 0;
  });

  close.addEventListener('click', (e) => {
    if (category) {
      e.preventDefault();
      history.back();
      return;
    }
    if (searchInput.value.trim()) {
      e.preventDefault();
      searchInput.value = '';
      render();
    }
  });

  window.addEventListener('popstate', () => {
    category = (history.state && history.state.societyCategory) || '';
    searchInput.value = '';
    render();
    results.scrollTop = 0;
  });

  searchInput.addEventListener('input', () => {
    render();
    results.scrollTop = 0;
  });
  sortEl.addEventListener('change', render);
  listEl.addEventListener('click', async (e) => {
    const card = e.target.closest('.card');
    if (!card || card.classList.contains('card-info')) return;
    const menuBtn = e.target.closest('[data-menu]');
    if (menuBtn) { toggleCardMenu(menuBtn); return; }
    const s = societies.find((x) => String(x.id) === card.dataset.id);
    if (!s) return;
    if (e.target.closest('[data-follow]')) {
      if (!auth.requireLogin('Log in to follow societies')) return;
      const on = !follows.has(s.id);
      const { error } = await auth.setFollow(s.id, on);
      if (error) { console.error(error); return; }
      on ? follows.add(s.id) : follows.delete(s.id);
      window.dispatchEvent(new Event('events-changed'));
      render();
      return;
    }
    showOnMap(s.building, s.name);
  });
  listEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('card')) e.target.click();
  });

  window.addEventListener('society-images-changed', () => {
    auth.listSocietyImages().then((map) => { images = map; render(); }).catch(console.error);
  });

  Promise.all([auth.ready.then(() => auth.listSocieties()), auth.ready.then(() => auth.myFollows()), auth.ready.then(() => auth.listSocietyImages()), auth.ready.then(() => auth.listPublicLeaders())]).then(([data, ids, imgs, people]) => {
    societies = data;
    follows = new Set(ids);
    images = imgs;
    leaders = people;
    render();
  }).catch((err) => {
    console.error(err);
    grid.hidden = true;
    emptyEl.textContent = t('Could not load societies.');
    emptyEl.hidden = false;
  });
})();
