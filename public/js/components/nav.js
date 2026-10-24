(function () {
  const items = [
    { href: '/tasks.html', label: 'Your task plan', icon: '<circle cx="20" cy="20" r="18" fill="#000"/><circle cx="20" cy="15" r="6" fill="#fff"/><path d="M8 31c2-6 7-8 12-8s10 2 12 8" fill="#fff"/>' },
    { href: '/events.html', label: "What's Happening", icon: '<rect x="5" y="8" width="30" height="27" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M5 16h30M12 4v7M28 4v7" stroke="currentColor" stroke-width="2.5"/><path d="M20 19l2 4.5 5 .5-3.7 3.3 1.2 4.7-4.5-2.6-4.5 2.6 1.2-4.7L13 24l5-.5z" fill="currentColor"/>' },
    { href: '/event-plan.html', label: 'Your event plan', icon: '<rect x="7" y="7" width="22" height="30" rx="2" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M11 15h6M11 22h6M11 29h6" stroke="currentColor" stroke-width="2.5"/><circle cx="29" cy="24" r="8" fill="#fff" stroke="currentColor" stroke-width="2.5"/><circle cx="29" cy="24" r="3" fill="currentColor"/>' },
    { href: '/food.html', label: 'Food and drinks', icon: '<path d="M8 15h14l-2 20H10z" fill="currentColor"/><path d="M15 15V5l8-2" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M20 24h16c0-6-4-9-8-9s-8 3-8 9zM20 28h16v3a3 3 0 0 1-3 3h-10a3 3 0 0 1-3-3z" fill="currentColor"/>' },
    { href: '/societies.html', label: 'On-campus Societies', icon: '<circle cx="20" cy="10" r="5" fill="currentColor"/><path d="M12 36V19a8 8 0 0 1 16 0v17z" fill="currentColor"/><circle cx="8" cy="15" r="4" fill="currentColor"/><circle cx="32" cy="15" r="4" fill="currentColor"/><path d="M1 30v-8a5 5 0 0 1 8-3M39 30v-8a5 5 0 0 0-8-3" stroke="currentColor" stroke-width="3" fill="none"/>' },
  ];
  const here = location.pathname;
  const links = items.map((i) =>
    `<a href="${i.href}"${here === i.href ? ' class="active"' : ''}>` +
    `<svg viewBox="0 0 40 40" aria-hidden="true">${i.icon}</svg><span>${i.label}</span></a>`
  ).join('');
  document.getElementById('nav-mount').innerHTML = `<div class="bottom-nav">${links}</div>`;
})();
