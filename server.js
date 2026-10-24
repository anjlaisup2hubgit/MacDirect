const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Named point features only: these become the map pins.
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'map.geojson'), 'utf8'));
const pins = {
  type: 'FeatureCollection',
  features: raw.features
    .filter((f) => f.geometry.type === 'Point' && f.properties.name)
    .map((f) => ({
      type: 'Feature',
      id: f.id,
      geometry: f.geometry,
      properties: {
        name: f.properties.name,
        category: f.properties.amenity || f.properties.shop || f.properties.tourism || null,
      },
    })),
};

app.get('/api/map', (req, res) => res.json(pins));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log(`MCQ iMap running at http://localhost:${PORT}`));
