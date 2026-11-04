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
  let activity = null; // newest event post per society; null until loaded
  let followerCounts = {};
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

  // Manage my societies opens its own page; guests are asked to log in first.
  const mBtn = document.createElement('button');
  mBtn.type = 'button';
  mBtn.className = 'category-card category-wide';
  mBtn.innerHTML = '<span class="category-copy"><span class="category-title"></span><span class="category-blurb"></span><span class="category-more"></span></span>';
  mBtn.querySelector('.category-title').textContent = t('Manage my societies');
  mBtn.querySelector('.category-blurb').textContent = t('See the societies you follow and unfollow several at once.');
  mBtn.querySelector('.category-more').textContent = t('Find out more') + ' ›';
  mBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!auth.requireLogin('Log in to manage your societies')) return;
    location.href = '/manage-societies.html';
  });
  grid.append(mBtn);

  // Interest quiz: tick what you are into and see matching societies.
  const qBtn = document.createElement('button');
  qBtn.type = 'button';
  qBtn.className = 'category-card category-wide';
  qBtn.innerHTML = '<span class="category-copy"><span class="category-title"></span><span class="category-blurb"></span><span class="category-more"></span></span>';
  qBtn.querySelector('.category-title').textContent = t('Find societies for me');
  qBtn.querySelector('.category-blurb').textContent = t('Tick what you are into and see matching societies.');
  qBtn.querySelector('.category-more').textContent = t('Find out more') + ' ›';
  qBtn.addEventListener('click', (e) => { e.stopPropagation(); openQuiz(); });
  grid.append(qBtn);

  // A small in-page dialog listing societies, each with a Follow button (shared by the quiz and Similar societies).
  function showMatches(heading, list) {
    const d = document.createElement('dialog');
    d.className = 'login-prompt';
    d.innerHTML = `<p><strong>${esc(heading)}</strong></p>` +
      (list.length ? '<ul class="match-list">' + list.map((s) => `<li data-id="${s.id}"><span>${esc(s.name)}<small>${esc(s.category)}</small></span>` +
        `<button type="button" class="follow-btn${follows.has(s.id) ? ' following' : ''}" data-follow>${t(follows.has(s.id) ? 'Following' : 'Follow')}</button></li>`).join('') + '</ul>'
        : `<p>${t('No matches yet.')}</p>`) +
      `<div><button class="auth-guest" type="button" data-close>${t('Close')}</button></div>`;
    d.addEventListener('click', async (e) => {
      if (e.target.dataset.close !== undefined) { d.remove(); return; }
      const btn = e.target.closest('[data-follow]');
      if (!btn) return;
      if (!auth.requireLogin('Log in to follow societies')) return;
      const s = societies.find((x) => String(x.id) === btn.closest('li').dataset.id);
      const on = !follows.has(s.id);
      const { error } = await auth.setFollow(s.id, on);
      if (error) { console.error(error); return; }
      on ? follows.add(s.id) : follows.delete(s.id);
      btn.textContent = t(on ? 'Following' : 'Follow');
      btn.classList.toggle('following', on);
      window.dispatchEvent(new Event('events-changed'));
      render();
    });
    d.addEventListener('cancel', () => d.remove());
    document.body.appendChild(d);
    d.showModal();
  }

  function openQuiz() {
    const d = document.createElement('dialog');
    d.className = 'login-prompt';
    d.innerHTML = `<p><strong>${t('What are you into?')}</strong></p><div class="quiz-options">` +
      CATEGORIES.map((c) => `<button type="button" class="quiz-choice" data-cat="${esc(c.name)}" aria-pressed="false">${esc(t(c.name))}</button>`).join('') + '</div>' +
      '<hr class="quiz-rule">' +
      `<div><button class="form-submit quiz-go" type="button" data-go>${t('Show societies')}</button>` +
      `<button class="auth-guest" type="button" data-close>${t('Cancel')}</button></div>`;
    d.addEventListener('click', (e) => {
      const choice = e.target.closest('.quiz-choice');
      if (choice) {
        choice.setAttribute('aria-pressed', choice.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        return;
      }
      if (e.target.dataset.close !== undefined) d.remove();
      if (e.target.dataset.go === undefined) return;
      const picked = [...d.querySelectorAll('.quiz-choice[aria-pressed="true"]')].map((b) => b.dataset.cat);
      d.remove();
      const matches = societies.filter((s) => picked.includes(s.category) && typeof s.id === 'number')
        .sort((a, b) => (followerCounts[b.id] || 0) - (followerCounts[a.id] || 0) || a.name.localeCompare(b.name)).slice(0, 8);
      showMatches(t('Societies you might like'), picked.length ? matches : []);
    });
    d.addEventListener('cancel', () => d.remove());
    document.body.appendChild(d);
    d.showModal();
  }

  // Similar societies: shared hashtags count most, then the same category.
  function similarTo(s) {
    const mine = hashtagsOf(s);
    return societies.filter((x) => x.id !== s.id && typeof x.id === 'number')
      .map((x) => ({ x, score: hashtagsOf(x).filter((h) => mine.includes(h)).length * 3 + (x.category === s.category ? 1 : 0) }))
      .filter((r) => r.score > 0).sort((a, b) => b.score - a.score || a.x.name.localeCompare(b.x.name)).slice(0, 6).map((r) => r.x);
  }

  // Logged in users ask to lead a society here; guests are asked to log in first.
  const reqBtn = document.createElement('button');
  reqBtn.type = 'button';
  reqBtn.className = 'follow-btn request-lead';
  reqBtn.textContent = t('Request to lead a society');
  grid.append(reqBtn);
  mBtn.hidden = reqBtn.hidden = true;
  auth.ready.then(() => { mBtn.hidden = reqBtn.hidden = !auth.user; });

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
    listEl.innerHTML = shown.map((s) => societyCard(s, follows.has(s.id), images[s.id], activity && (activity[s.id] || null), followerCounts[s.id])).join('');
    emptyEl.hidden = shown.length > 0;
  }

  function showOnMap(building, label) {
    const q = new URLSearchParams({ building: building || '', label: label || building || '' });
    location.href = '/?' + q.toString();
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
  // Short welcome line after following, so the student knows where the events will appear.
  const followNote = document.createElement('p');
  followNote.className = 'empty-msg';
  followNote.setAttribute('role', 'status');
  followNote.hidden = true;
  listEl.before(followNote);
  let followTimer = 0;
  function flashFollow(name) {
    followNote.textContent = `${t('Following')} ${name}. ${t('Its events now show in your Calendar.')}`;
    followNote.hidden = false;
    clearTimeout(followTimer);
    followTimer = setTimeout(() => { followNote.hidden = true; }, 5000);
  }
  listEl.addEventListener('click', async (e) => {
    const card = e.target.closest('.card');
    if (!card || card.classList.contains('card-info')) return;
    const menuBtn = e.target.closest('[data-menu]');
    if (menuBtn) { toggleCardMenu(menuBtn); return; }
    const s = societies.find((x) => String(x.id) === card.dataset.id);
    if (!s) return;
    if (e.target.closest('[data-join]')) {
      closeCardMenus();
      const site = /^https?:\/\//i.test(s.website || '') ? s.website : '';
      if (site) window.open(site, '_blank', 'noopener');
      else if (s.contact) location.href = 'mailto:' + s.contact;
      return;
    }
    if (e.target.closest('[data-similar]')) { closeCardMenus(); showMatches(`${t('Similar to')} ${s.name}`, similarTo(s)); return; }
    if (e.target.closest('[data-follow]')) {
      if (!auth.requireLogin('Log in to follow societies')) return;
      const on = !follows.has(s.id);
      const { error } = await auth.setFollow(s.id, on);
      if (error) { console.error(error); return; }
      on ? follows.add(s.id) : follows.delete(s.id);
      followerCounts[s.id] = Math.max(0, (followerCounts[s.id] || 0) + (on ? 1 : -1));
      window.dispatchEvent(new Event('events-changed'));
      render();
      if (on) flashFollow(s.name);
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

  Promise.all([auth.ready.then(() => auth.listSocieties()), auth.ready.then(() => auth.myFollows()), auth.ready.then(() => auth.listSocietyImages()), auth.ready.then(() => auth.listPublicLeaders()), auth.ready.then(() => auth.societyActivity()), auth.ready.then(() => auth.societyFollowerCounts())]).then(([data, ids, imgs, people, last, counts]) => {
    activity = last;
    followerCounts = counts;
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
