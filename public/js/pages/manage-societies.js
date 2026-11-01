// Manage my societies page. Tick followed societies and unfollow them in one go.
(function () {
  const manage = document.querySelector('.manage-societies');
  let societies = [];
  let follows = new Set();
  let picked = new Set();

  function render() {
    if (!auth.user) {
      manage.innerHTML = `<p class="empty-msg">${t('Log in to manage your societies.')}</p>`;
      return;
    }
    const mine = societies.filter((s) => follows.has(s.id)).sort((a, b) => a.name.localeCompare(b.name));
    picked = new Set([...picked].filter((id) => follows.has(id)));
    manage.innerHTML = mine.length
      ? `<label class="manage-all"><input type="checkbox" data-all${picked.size === mine.length ? ' checked' : ''}> ${t('Select all')}</label>` +
        '<ul>' + mine.map((s) => `<li><label><input type="checkbox" data-pick="${s.id}"${picked.has(s.id) ? ' checked' : ''}> ${esc(s.name)}</label></li>`).join('') + '</ul>' +
        `<button class="follow-btn" type="button" data-unfollow${picked.size ? '' : ' disabled'}>${t('Unfollow selected')}</button>` +
        '<p class="form-msg" role="status" hidden></p>'
      : `<p class="empty-msg">${t('You are not following any societies yet.')}</p>`;
  }

  manage.addEventListener('change', (e) => {
    if (e.target.dataset.all !== undefined) {
      picked = e.target.checked ? new Set(societies.filter((s) => follows.has(s.id)).map((s) => s.id)) : new Set();
    } else if (e.target.dataset.pick) {
      const id = Number(e.target.dataset.pick);
      e.target.checked ? picked.add(id) : picked.delete(id);
    } else return;
    render();
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
    render();
  });

  Promise.all([auth.ready.then(() => auth.listSocieties()), auth.ready.then(() => auth.myFollows())]).then(([data, ids]) => {
    societies = data;
    follows = new Set(ids);
    render();
  }).catch((err) => {
    console.error(err);
    manage.innerHTML = `<p class="empty-msg">${t('Could not load societies.')}</p>`;
  });
})();
