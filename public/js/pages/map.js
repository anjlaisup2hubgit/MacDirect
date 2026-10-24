const CAMPUS_CENTER = [-33.7738, 151.1127];

const map = L.map('map', { zoomControl: false }).setView(CAMPUS_CENTER, 16);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

const pinIcon = L.divIcon({
  className: 'pin-icon',
  html: '<svg width="28" height="38" viewBox="0 0 28 38"><path d="M14 0C6.3 0 0 6.2 0 13.8 0 24 14 38 14 38s14-14 14-24.2C28 6.2 21.7 0 14 0z" fill="#8B0000"/><circle cx="14" cy="14" r="5" fill="#3a0a14"/></svg>',
  iconSize: [28, 38],
  iconAnchor: [14, 38],
  popupAnchor: [0, -34],
});

const clusters = L.markerClusterGroup({
  maxClusterRadius: 50,
  showCoverageOnHover: false,
  iconCreateFunction: (c) => L.divIcon({
    className: 'cluster-icon',
    html: `<div class="cluster-badge"><span>${c.getChildCount()}</span></div>`,
    iconSize: [40, 40],
  }),
});
map.addLayer(clusters);

const markers = new Map();

api('/map').then((data) => {
  data.features.forEach((f) => {
    const [lng, lat] = f.geometry.coordinates;
    const m = L.marker([lat, lng], { icon: pinIcon }).bindPopup(f.properties.name);
    markers.set(f.id, m);
    clusters.addLayer(m);
  });

  initSearchBar(data.features, (f) => {
    const m = markers.get(f.id);
    clusters.zoomToShowLayer(m, () => m.openPopup());
  });
}).catch((err) => console.error(err));
