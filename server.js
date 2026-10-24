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
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log(`MCQ iMap running at http://localhost:${PORT}`));
