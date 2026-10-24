// macqAI floating bar. The AI endpoint is not built yet; the panel is a placeholder.
(function () {
  const mount = document.getElementById('macqai-mount');
  mount.innerHTML =
    '<div class="macqai">' +
    '<input class="macqai-input" type="text" placeholder="Ask macqAI a question" aria-label="Ask macqAI a question">' +
    '<button class="macqai-info" type="button" aria-label="About macqAI">' +
    '<svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="17" fill="#fff" stroke="#000" stroke-width="3"/><circle cx="20" cy="11" r="2.5" fill="#000"/><path d="M20 17v14M16 17h4M16 31h8" stroke="#000" stroke-width="3" fill="none"/></svg>' +
    '</button></div>' +
    '<div class="macqai-panel" hidden></div>';

  const input = mount.querySelector('.macqai-input');
  const panel = mount.querySelector('.macqai-panel');
  const show = (text) => { panel.textContent = text; panel.hidden = false; };

  mount.querySelector('.macqai-info').addEventListener('click', () => {
    if (panel.hidden) show('macqAI is your campus assistant. Ask it where things are or what to do next.');
    else panel.hidden = true;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) show('macqAI is coming soon.');
  });
})();
