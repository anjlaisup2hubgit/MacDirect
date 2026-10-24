// Floating "Where are you heading?" search. Call initSearchBar(features, onSelect) once pins are loaded.
function initSearchBar(features, onSelect) {
  const mount = document.getElementById('search-bar-mount');
  mount.innerHTML =
    '<div class="search-bar">' +
    '<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="#000" stroke-width="2.5"/><path d="M15 15l9 9" stroke="#000" stroke-width="3"/></svg>' +
    '<input type="search" placeholder="Where are you heading?" aria-label="Search campus" autocomplete="off">' +
    '</div><ul class="search-results"></ul>';

  const input = mount.querySelector('input');
  const list = mount.querySelector('.search-results');

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    if (!q) return;
    features
      .filter((f) => f.properties.name.toLowerCase().includes(q))
      .slice(0, 8)
      .forEach((f) => {
        const li = document.createElement('li');
        li.textContent = f.properties.name;
        li.addEventListener('click', () => {
          list.innerHTML = '';
          input.value = f.properties.name;
          onSelect(f);
        });
        list.appendChild(li);
      });
  });
}
