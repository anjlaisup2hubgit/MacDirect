const CAMPUS_CENTER = [-33.7744188, 151.1144426]; // Wally's Walk / Sir Christopher Ondaatje Ave T-junction

const CAMPUS_RADIUS_M = 500;

const map = L.map('map', { zoomControl: false, minZoom: 15 }).setView(CAMPUS_CENTER, 17);

// Leaflet's maxBounds is rectangular, so a circular limit is enforced with a hard clamp.
function clampToCampus(center) {
  const dist = map.distance(CAMPUS_CENTER, center);
  if (dist <= CAMPUS_RADIUS_M) return center;
  const k = CAMPUS_RADIUS_M / dist;
  return L.latLng(
    CAMPUS_CENTER[0] + (center.lat - CAMPUS_CENTER[0]) * k,
    CAMPUS_CENTER[1] + (center.lng - CAMPUS_CENTER[1]) * k,
  );
}

// While dragging, clamp the pane position before it is applied so the map stops dead at the edge.
map.dragging._draggable.on('predrag', function () {
  const half = map.getSize().divideBy(2);
  const center = map.layerPointToLatLng(half.subtract(this._newPos));
  const clamped = clampToCampus(center);
  if (clamped !== center) this._newPos = half.subtract(map.latLngToLayerPoint(clamped)).round();
});

// Catch non-drag moves (zoom, keyboard, fitBounds) without animating back.
map.on('moveend', () => {
  const center = map.getCenter();
  const clamped = clampToCampus(center);
  if (clamped !== center) map.panTo(clamped, { animate: false });
});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

const panel = document.createElement('aside');
panel.className = 'building-panel';
panel.setAttribute('aria-live', 'polite');
document.body.appendChild(panel);

const outlineStyle = { color: '#1d6fe8', weight: 4, fill: true, fillColor: '#1d6fe8', fillOpacity: 0.15 };
const idleStyle = { color: '#1d6fe8', weight: 0, fill: true, fillColor: '#000', fillOpacity: 0 };

const layers = new Map();
let selected = null;

function esc(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

let societies = [];
api('/societies').then((data) => { societies = data; }).catch(console.error);

// The panel is full height and slid down so only the head (name and location) peeks above the nav.
// Dragging the head up reveals the image, description and societies; it snaps to peek or expanded.
let peekY = 0;
let expanded = false;
const panelY = () => (expanded ? 0 : peekY);

function selectBuilding(id, label) {
  if (selected) selected.setStyle(idleStyle);
  selected = layers.get(id);
  selected.setStyle(outlineStyle);
  selected.bringToFront();
  const p = selected.feature.properties;
  const c = selected.getBounds().getCenter();
  const here = societies.filter((s) => s.building === p.name);
  panel.innerHTML =
    '<div class="building-panel-head">' +
      '<div class="building-panel-handle"></div>' +
      `<h2>${esc(p.name)}</h2>` +
      `<p class="building-panel-address">${p.address ? esc(p.address) + ' &middot; ' : ''}` +
        `<a href="https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}" target="_blank" rel="noopener">Google Maps</a></p>` +
      (label ? `<p><strong>${esc(label)}</strong> meets here.</p>` : '') +
    '</div>' +
    '<div class="building-panel-body">' +
      '<div class="building-panel-image">No photo available</div>' +
      `<p>${esc(p.description)}</p>` +
      (p.website ? `<a href="${esc(p.website)}" target="_blank" rel="noopener">Website</a>` : '') +
      '<h3>Societies held here</h3>' +
      (here.length
        ? '<ul class="building-panel-societies">' +
          here.map((s) => `<li><strong>${esc(s.name)}</strong><span>${esc(s.category)}</span></li>`).join('') + '</ul>'
        : '<p>No societies listed here.</p>') +
    '</div>';
  panel.querySelector('.building-panel-body').scrollTop = 0;
  panel.classList.add('open');
  expanded = false;
  peekY = Math.max(0, panel.offsetHeight - panel.querySelector('.building-panel-head').offsetHeight);
  panel.style.transform = `translateY(${peekY}px)`;
}

function clearSelection() {
  if (selected) selected.setStyle(idleStyle);
  selected = null;
  panel.classList.remove('open');
  panel.style.transform = '';
}

let drag = null;
panel.addEventListener('pointerdown', (e) => {
  if (!e.target.closest('.building-panel-head') || e.target.closest('a')) return;
  drag = { startY: e.clientY, startPos: panelY(), moved: false };
  panel.setPointerCapture(e.pointerId);
  panel.classList.add('dragging');
});
panel.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dy = e.clientY - drag.startY;
  if (Math.abs(dy) > 4) drag.moved = true;
  panel.style.transform = `translateY(${Math.min(peekY, Math.max(0, drag.startPos + dy))}px)`;
});
function endDrag(e) {
  if (!drag) return;
  const dy = e.clientY - drag.startY;
  if (!drag.moved) expanded = !expanded; // a tap on the head toggles
  else expanded = drag.startPos + dy < peekY / 2;
  drag = null;
  panel.classList.remove('dragging');
  panel.style.transform = `translateY(${panelY()}px)`;
}
panel.addEventListener('pointerup', endDrag);
panel.addEventListener('pointercancel', endDrag);

map.on('click', clearSelection);

api('/map').then((data) => {
  L.geoJSON(data, {
    style: idleStyle,
    onEachFeature: (f, layer) => {
      layers.set(f.id, layer);
      layer.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        selectBuilding(f.id);
      });
    },
  }).addTo(map);

  const focusBuilding = (f, label) => {
    map.fitBounds(layers.get(f.id).getBounds(), { maxZoom: 18, paddingBottomRight: [0, 200] });
    selectBuilding(f.id, label);
  };
  initSearchBar(data.features, focusBuilding);

  // Used by the societies popup: show a building, noting which society meets there.
  window.focusBuildingByName = (name, label) => {
    const f = data.features.find((x) => x.properties.name === name);
    if (f) focusBuilding(f, label);
  };
}).catch((err) => console.error(err));
