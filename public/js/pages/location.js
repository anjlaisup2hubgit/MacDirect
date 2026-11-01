// One page for every building. The map stays visible across the top.
(function () {
  const params = new URLSearchParams(location.search);
  const sheet = document.getElementById('location-sheet');

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function missing() {
    sheet.innerHTML =
      '<div class="location-head"><a class="popup-close" href="/" aria-label="Map">&larr;</a></div>' +
      `<p class="empty-msg">${t('Location not found.')}</p>`;
  }

  api('/map').then(async (data) => {
    const id = params.get('id');
    const name = params.get('building');
    const feature = id
      ? data.features.find((f) => String(f.id) === id)
      : data.features.find((f) => f.properties.name === name);
    if (!feature) { missing(); return; }

    const p = feature.properties;
    document.title = p.name + ' · iMCQ';

    const preview = L.map('location-map', {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(preview);
    const layer = L.geoJSON(feature, {
      style: { color: '#1d6fe8', weight: 1.5, fill: true, fillColor: '#1d6fe8', fillOpacity: 0.2 },
    }).addTo(preview);
    const bounds = layer.getBounds();
    // Same opening frame as the home map, then glide into the building.
    const campus = [-33.7744188, 151.1144426];
    const station = [-33.777161, 151.118078];
    const openCenter = [
      campus[0] + (station[0] - campus[0]) * 0.7 + 0.0011,
      campus[1] + (station[1] - campus[1]) * 0.7,
    ];
    preview.setView(openCenter, 16, { animate: false });
    preview.whenReady(() => {
      preview.invalidateSize();
      preview.flyToBounds(bounds, { padding: [48, 48], maxZoom: 18, duration: 1.15 });
    });
    const c = bounds.getCenter();
    const label = params.get('label');

    sheet.innerHTML =
      '<div class="location-head">' +
        '<a class="popup-close" href="/" aria-label="Map">&larr;</a>' +
        `<h1>${esc(p.name)}</h1>` +
      '</div>' +
      `<p class="location-address">${p.address ? esc(p.address) + ' · ' : ''}` +
        `<a href="https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}" target="_blank" rel="noopener">${t('Google Maps')}</a></p>` +
      (label ? `<p><strong>${esc(label)}</strong> ${t('meets here.')}</p>` : '') +
      `<a class="follow-btn directions-btn" href="/?directions=${encodeURIComponent(feature.id)}">${t('Directions')}</a>` +
      `<div class="building-panel-image">${t('No photo available')}</div>` +
      (p.description ? `<p>${esc(p.description)}</p>` : '') +
      (p.website ? `<p><a href="${esc(p.website)}" target="_blank" rel="noopener">${t('Website')}</a></p>` : '') +
      `<h2>${t('Societies held here')}</h2>` +
      '<div class="location-societies"></div>';

    auth.ready.then(() => auth.listSocieties()).then((societies) => {
      const here = (societies || []).filter((s) => s.building === p.name);
      const slot = sheet.querySelector('.location-societies');
      if (!slot) return;
      slot.innerHTML = here.length
        ? '<ul class="building-panel-societies">' +
          here.map((s) => `<li><strong>${esc(s.name)}</strong><span>${esc(s.category)}</span></li>`).join('') +
          '</ul>'
        : `<p>${t('No societies listed here.')}</p>`;
    }).catch((err) => console.error(err));
  }).catch((err) => {
    console.error(err);
    missing();
  });
})();
