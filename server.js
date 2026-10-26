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
        },
      };
    }),
};

app.get('/api/map', (req, res) => res.json(buildings));
// Public Supabase settings for the browser; the secret key is never sent.
app.get('/api/config', (req, res) => res.json({
  supabaseUrl: process.env.SUPABASE_URL || null,
  supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || null,
}));
app.use('/api/societies', require('./routes/societies'));
app.use('/api/food', require('./routes/food'));
app.use('/api/events', require('./routes/events'));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log(`iMCQ running at http://localhost:${PORT}`));
