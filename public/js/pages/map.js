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

function selectBuilding(id) {
  if (selected) selected.setStyle(idleStyle);
  selected = layers.get(id);
  selected.setStyle(outlineStyle);
  selected.bringToFront();
  const p = selected.feature.properties;
  panel.innerHTML =
    '<div class="building-panel-handle"></div>' +
    '<button class="building-panel-close" aria-label="Close">&times;</button>' +
    `<h2>${esc(p.name)}</h2>` +
    (p.address ? `<p class="building-panel-address">${esc(p.address)}</p>` : '') +
    `<p>${esc(p.description)}</p>` +
    (p.website ? `<a href="${esc(p.website)}" target="_blank" rel="noopener">Website</a>` : '');
  panel.querySelector('.building-panel-close').addEventListener('click', clearSelection);
  panel.classList.add('open');
}

function clearSelection() {
  if (selected) selected.setStyle(idleStyle);
  selected = null;
  panel.classList.remove('open');
}

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

  initSearchBar(data.features, (f) => {
    map.fitBounds(layers.get(f.id).getBounds(), { maxZoom: 18, paddingBottomRight: [0, 200] });
    selectBuilding(f.id);
  });
}).catch((err) => console.error(err));
