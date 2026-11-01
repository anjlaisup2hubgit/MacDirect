// Load .env (Node 20.6+); silently skip if the file is missing.
try { process.loadEnvFile(); } catch (err) { /* no .env */ }

const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();
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
// Free drinking water points from the OSM data (the decorative fountain and the paid, seasonal one are left out).
const drinkPoints = raw.features
  .filter((f) => f.properties.amenity === 'drinking_water' && f.properties.fee !== 'yes' && f.geometry.type === 'Point')
  .map((f) => ({ lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], bottle: f.properties.bottle === 'yes' }));

// Metres from a drink point to the closest corner of a building outline (flat-earth maths is fine on one campus).
function nearestDrink(geometry) {
  const rings = geometry.type === 'Polygon' ? [geometry.coordinates[0]] : geometry.coordinates.map((poly) => poly[0]);
  let best = null;
  for (const d of drinkPoints) {
    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        const dx = (lng - d.lng) * 111320 * Math.cos((lat * Math.PI) / 180);
        const dy = (lat - d.lat) * 110540;
        const m = Math.hypot(dx, dy);
        if (!best || m < best.metres) best = { metres: Math.round(m), bottle: d.bottle };
      }
    }
  }
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

const { buildGraph, routeTo } = require('./routes/walk');
const graph = buildGraph(raw);
if (buildings.features[0]) routeTo(graph, buildings.features[0]);

app.get('/api/map', (req, res) => res.json(buildings));
app.get('/api/route', (req, res) => {
  const feature = buildings.features.find((f) => String(f.id) === req.query.id);
  if (!feature) return res.status(404).json({ error: 'unknown building' });
  const route = routeTo(graph, feature, req.query.night === '1');
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
