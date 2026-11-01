(function () {
  const pages = { tasks: '/settings.html', events: '/calendar.html', 'event-plan': '/event-plan.html', food: '/food.html', societies: '/societies.html' };
  const old = new URLSearchParams(location.search);
  for (const key of Object.keys(pages)) {
    if (old.has(key)) { location.replace(pages[key]); return; }
  }
  if (old.get('building') && !old.get('directions')) {
    const q = new URLSearchParams({ building: old.get('building') });
    if (old.get('label')) q.set('label', old.get('label'));
    location.replace('/location.html?' + q.toString());
  }
})();

// Back from the directions screen always loads the plain map. The entry under
// the path is this same document with the address changed to /, so a
// location.replace('/') is ignored and the next Back would open Societies,
// Food, or a building page.
(function () {
  const asked = new URLSearchParams(location.search).get('directions');
  if (!asked) return;
  const here = location.pathname + location.search;
  if (!(history.state && history.state.directionsBack)) {
    history.replaceState({ directionsHome: true }, '', '/');
    history.pushState({ directionsBack: true }, '', here);
  }
  window.addEventListener('popstate', () => {
    if (location.pathname === '/' && !new URLSearchParams(location.search).get('directions')) location.reload();
    else location.replace('/');
  });
})();

const CAMPUS_CENTER = [-33.7744188, 151.1144426]; // Wally's Walk / Sir Christopher Ondaatje Ave T-junction
// Campus-side exit of Macquarie University station (OSM subway entrance 951237975).
// Every walking route starts here.
const STATION_EXIT = [-33.777161, 151.118078];

const CAMPUS_RADIUS_M = 500;

// Open 70% of the way from the middle of campus toward the station, then nudge
// north so the frame sits a little higher and more of the walk ahead is visible.
const OPEN_TOWARD_STATION = 0.7;
const OPEN_NUDGE_NORTH = 0.0011;
const OPEN_CENTER = [
  CAMPUS_CENTER[0] + (STATION_EXIT[0] - CAMPUS_CENTER[0]) * OPEN_TOWARD_STATION + OPEN_NUDGE_NORTH,
  CAMPUS_CENTER[1] + (STATION_EXIT[1] - CAMPUS_CENTER[1]) * OPEN_TOWARD_STATION,
];

const map = L.map('map', { zoomControl: false, minZoom: 15 }).setView(OPEN_CENTER, 17);
window.addEventListener('resize', () => map.invalidateSize());

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

const stationIcon = L.divIcon({
  className: 'station-start',
  html: '<i></i><span>' + t('Station') + '</span>',
  iconSize: [88, 28],
  iconAnchor: [7, 21],
});
const station = L.marker(STATION_EXIT, {
  icon: stationIcon,
  interactive: false,
  keyboard: false,
  zIndexOffset: 800,
}).addTo(map);

const panel = document.createElement('aside');
panel.className = 'building-panel';
panel.setAttribute('aria-live', 'polite');
document.body.appendChild(panel);

const outlineStyle = { color: '#1d6fe8', weight: 2, fill: true, fillColor: '#1d6fe8', fillOpacity: 0.15 };
const idleStyle = { color: '#1d6fe8', weight: 0, fill: true, fillColor: '#000', fillOpacity: 0 };

const layers = new Map();
let selected = null;

function stepText(step) {
  const place = step.name ? ' ' + step.name : '';
  let text;
  if (step.kind === 'head') text = t('Head ' + step.direction) + (step.name ? ' ' + t('on') + place : '');
  else if (step.kind === 'left') text = t('Turn left') + (step.name ? ' ' + t('onto') + place : '');
  else if (step.kind === 'right') text = t('Turn right') + (step.name ? ' ' + t('onto') + place : '');
  else if (step.kind === 'uturn') text = t('Make a U-turn') + (step.name ? ' ' + t('onto') + place : '');
  else if (step.kind === 'arrive') text = t('Arrive at') + place;
  else text = t('Continue') + (step.name ? ' ' + t('on') + place : '');
  if (step.steps) text += ' · ' + t('stairs');
  return text;
}

function esc(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

let societies = [];
auth.ready.then(() => auth.listSocieties()).then((data) => {
  societies = data;
  window.searchExtras.push(...data.map((s) => ({ name: s.name, building: s.building, kind: 'Society' })));
}).catch(console.error);
api('/food').then((data) => {
  window.searchExtras.push(...data.map((f) => ({ name: f.name, building: f.building, kind: 'Restaurant' })));
}).catch(console.error);

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
        `<a href="https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}" target="_blank" rel="noopener">${t('Google Maps')}</a></p>` +
      (label ? `<p><strong>${esc(label)}</strong> ${t('meets here.')}</p>` : '') +
    '</div>' +
    '<div class="building-panel-body">' +
      `<div class="building-panel-image">${t('No photo available')}</div>` +
      `<p>${esc(p.description)}</p>` +
      (p.website ? `<a href="${esc(p.website)}" target="_blank" rel="noopener">${t('Website')}</a>` : '') +
      `<h3>${t('Societies held here')}</h3>` +
      (here.length
        ? '<ul class="building-panel-societies">' +
          here.map((s) => `<li><strong>${esc(s.name)}</strong><span>${esc(s.category)}</span></li>`).join('') + '</ul>'
        : `<p>${t('No societies listed here.')}</p>`) +
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

window.clearBuildingSelection = clearSelection; // called when a nav popup opens

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
        location.href = '/location.html?id=' + encodeURIComponent(f.id);
      });
    },
  }).addTo(map);

  const openLocation = (f) => {
    location.href = '/location.html?id=' + encodeURIComponent(f.id);
  };
  initSearchBar(data.features, openLocation);

  window.focusBuildingByName = (name, label) => {
    const q = new URLSearchParams({ building: name });
    if (label) q.set('label', label);
    location.href = '/location.html?' + q.toString();
  };

  const askedRoute = new URLSearchParams(location.search).get('directions');
  if (askedRoute) {
    const feature = data.features.find((f) => String(f.id) === askedRoute);
    const layer = feature && layers.get(feature.id);
    if (layer) {
      layer.setStyle(outlineStyle);
      layer.bringToFront();
      api('/route?id=' + encodeURIComponent(feature.id)).then((route) => {
        const routeLine = { lineCap: 'round', lineJoin: 'round', opacity: 1 };
        const casing = L.polyline(route.coordinates, { ...routeLine, color: '#174EA6', weight: 3.5 }).addTo(map);
        const line = L.polyline(route.coordinates, { ...routeLine, color: '#4285F4', weight: 2.5 }).addTo(map);
        casing.bringToFront();
        line.bringToFront();
        map.fitBounds(line.getBounds(), { paddingTopLeft: [28, 88], paddingBottomRight: [28, 160] });
        const minutes = Math.max(1, Math.round(route.metres / 83.3));
        const card = document.createElement('div');
        card.className = 'route-card';
        const note = document.createElement('p');
        note.className = 'route-note';
        note.textContent = route.metres + ' m · ' + t('approx.') + ' ' + minutes + ' ' + t('min walk')
          + (route.steps ? '. ' + t('This route includes stairs.') : '');
        card.appendChild(note);
        const steps = route.instructions || [];
        if (steps[0]) {
          const first = document.createElement('button');
          first.type = 'button';
          first.className = 'route-first';
          first.innerHTML = '<span>' + esc(stepText(steps[0])) + '</span>' + (steps[0].metres ? '<b>' + steps[0].metres + ' m</b>' : '');
          const list = document.createElement('ol');
          list.className = 'route-steps';
          list.hidden = true;
          list.innerHTML = steps.slice(1).map((s) =>
            '<li><span>' + esc(stepText(s)) + '</span>' + (s.metres ? '<b>' + s.metres + ' m</b>' : '') + '</li>').join('');
          if (steps.length > 1) {
            first.setAttribute('aria-expanded', 'false');
            first.addEventListener('click', () => {
              list.hidden = !list.hidden;
              first.setAttribute('aria-expanded', String(!list.hidden));
              card.classList.toggle('open', !list.hidden);
            });
          }
          card.appendChild(first);
          card.appendChild(list);
        }
        document.body.appendChild(card);
      }).catch(() => {
        const note = document.createElement('p');
        note.className = 'route-note';
        note.textContent = t('No walking route from the station.');
        document.body.appendChild(note);
      });
    }
  }
}).catch((err) => console.error(err));
