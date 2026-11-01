// Load .env (Node 20.6+); silently skip if the file is missing.
try { process.loadEnvFile(); } catch (err) { /* no .env */ }

const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
// Security headers. The CSP lists every outside host the pages use; inline styles stay allowed (Leaflet and the cards set them).
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com', 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.tile.openstreetmap.org', 'https://tile.openstreetmap.org', 'https://*.supabase.co'],
      connectSrc: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: null,
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 120 }));
const PORT = process.env.PORT || 3000;

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// Builds a short blurb from whatever OSM tags a building has.
function describe(p) {
  if (p.description) return p.description;
  const kind = p.amenity === 'parking' ? 'car park' : p.building === 'yes' ? 'building' : `${p.building} building`;
  let text = `${cap(kind)} on the Macquarie University campus`;
  if (p.building === 'university') text = 'University building on the Macquarie University campus';
  const dept = p.faculty || p.department;
  if (dept) text += `, home to ${cap(dept)}`;
  text += '.';
  if (p['building:levels']) text += ` ${p['building:levels']} levels.`;
  if (p.opening_hours) text += ` Open ${p.opening_hours}.`;
  return text;
}

// Named building footprints: clicking one on the map outlines it and opens its info panel.
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'map.geojson'), 'utf8'));
// Lifts, accessible toilets and so on per building, read off Macquarie's Accessibility Map (see tools/trace-lit-paths).
const accessibility = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'accessibility.json'), 'utf8'));
// Drinking fountains and Tap It refill towers, read off Macquarie's Drinking Water Map (see tools/trace-lit-paths).
const drinkPoints = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'drinking-water.json'), 'utf8'));

// Metres from each kind of drink point to the closest corner of a building outline (flat-earth maths is fine on one campus).
function nearestDrink(geometry) {
  const rings = geometry.type === 'Polygon' ? [geometry.coordinates[0]] : geometry.coordinates.map((poly) => poly[0]);
  const best = {};
  drinkPoints.forEach((d, index) => {
    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        const dx = (lng - d.lng) * 111320 * Math.cos((lat * Math.PI) / 180);
        const dy = (lat - d.lat) * 110540;
        const metres = Math.round(Math.hypot(dx, dy));
        if (!best[d.kind] || metres < best[d.kind].metres) best[d.kind] = { index, metres, near: d.near, floors: d.floors || null };
      }
    }
  });
  return best;
}

const buildings = {
  type: 'FeatureCollection',
  features: raw.features
    .filter((f) => f.properties.building && f.properties.name && /Polygon$/.test(f.geometry.type))
    .map((f) => {
      const p = f.properties;
      const address = [p['addr:housenumber'], p['addr:street']].filter(Boolean).join(' ');
      return {
        type: 'Feature',
        id: f.id,
        geometry: f.geometry,
        properties: {
          name: p.name,
          address: address || null,
          website: p.website || null,
          description: describe(p),
          accessibility: accessibility[f.id] || null,
          drink: nearestDrink(f.geometry),
        },
      };
    }),
};

const { buildGraph, routeTo, routeBetween } = require('./routes/walk');
const graph = buildGraph(raw);
if (buildings.features[0]) routeTo(graph, buildings.features[0]);

app.get('/api/map', (req, res) => res.json(buildings));
app.get('/api/drink', (req, res) => res.json(drinkPoints));
app.get('/api/route', (req, res) => {
  const feature = buildings.features.find((f) => String(f.id) === req.query.id);
  if (!feature) return res.status(404).json({ error: 'unknown building' });
  const water = req.query.water === undefined ? null : drinkPoints[Number(req.query.water)];
  if (req.query.water !== undefined && !water) return res.status(404).json({ error: 'unknown drink point' });
  const route = water
    ? routeBetween(graph, feature, { lat: water.lat, lng: water.lng, label: '' }, req.query.night === '1')
    : routeTo(graph, feature, req.query.night === '1');
  if (!route) return res.status(404).json({ error: 'no route' });
  res.json(route);
});
// Walk from the user's position to a drink point. POST so the position stays out of URLs and logs; nothing is stored.
app.post('/api/route-from', express.json({ limit: '1kb' }), (req, res) => {
  const { lat, lng, water, night } = req.body || {};
  const spot = drinkPoints[Number(water)];
  if (!spot) return res.status(404).json({ error: 'unknown drink point' });
  if (![lat, lng].every(Number.isFinite) || lat < -33.79 || lat > -33.76 || lng < 151.09 || lng > 151.13) {
    return res.status(422).json({ error: 'outside campus' });
  }
  const route = routeBetween(graph, { lat, lng }, { lat: spot.lat, lng: spot.lng, label: '' }, night === true);
  if (!route) return res.status(404).json({ error: 'no route' });
  res.json(route);
});
// Public Supabase settings for the browser; the secret key is never sent.
app.get('/api/config', (req, res) => res.json({
  supabaseUrl: process.env.SUPABASE_URL || null,
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || null,
}));
app.use('/api/food', require('./routes/food'));
app.get('/api/societies', (req, res) => {
  const file = path.join(__dirname, 'data', 'societies.json');
  res.json(JSON.parse(fs.readFileSync(file, 'utf8')));
});
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log(`iMCQ running at http://localhost:${PORT}`));
