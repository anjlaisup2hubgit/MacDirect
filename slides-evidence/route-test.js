// Re-run of the route counts: reads the repo's own data and routes/walk.js, changes nothing.
const fs = require('fs'), path = require('path');
const root = process.argv[2];
const { buildGraph, routeTo, routeBetween, metres } = require(path.join(root, 'routes/walk.js'));
const raw = JSON.parse(fs.readFileSync(path.join(root, 'data/map.geojson'), 'utf8'));
const pts = JSON.parse(fs.readFileSync(path.join(root, 'data/drinking-water.json'), 'utf8'));
const lit = JSON.parse(fs.readFileSync(path.join(root, 'data/lit-paths.json'), 'utf8'));
const graph = buildGraph(raw);
const b = raw.features.filter((f) => f.properties.building && f.properties.name && /Polygon$/.test(f.geometry.type));
console.log('buildings', b.length, 'water points', pts.length, 'lit segments', Array.isArray(lit) ? lit.length : Object.keys(lit).length);
// 1. station -> building, day and night
let stOk = 0, differ = 0, extra = [], litDay = [], litNight = [];
for (const f of b) {
  const d = routeTo(graph, f, false), n = routeTo(graph, f, true);
  if (d && n) { stOk++; if (d.metres !== n.metres || d.litMetres !== n.litMetres) { differ++; extra.push(n.metres - d.metres); } litDay.push(d.litMetres / d.metres); litNight.push(n.litMetres / n.metres); }
}
const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
console.log('station routes ok', stOk, '/', b.length, '| night differs', differ, '| mean extra m', avg(extra).toFixed(1), 'max', Math.max(...extra));
console.log('lit share day', (100 * avg(litDay)).toFixed(0) + '%', 'night', (100 * avg(litNight)).toFixed(0) + '%');
// 2. building -> water point, day and night
let ok = 0, fail = 0, badEnd = 0, litBad = 0; const failPts = new Set();
for (const f of b) pts.forEach((p, i) => [false, true].forEach((night) => {
  const r = routeBetween(graph, f, { lat: p.lat, lng: p.lng, label: '' }, night);
  if (!r) { fail++; failPts.add(i); return; }
  ok++;
  const last = r.coordinates[r.coordinates.length - 1]; // [lat,lng]
  if (metres({ lat: last[0], lng: last[1] }, { lng: p.lng, lat: p.lat }) > 15) badEnd++;
  if (r.litMetres > r.metres) litBad++;
}));
console.log('building x point x day/night total', ok + fail, 'ok', ok, 'no route', fail, 'points with no route', [...failPts].join(','), '| ends >15 m from tap', badEnd, '| lit>total', litBad);
// weighted lit share
let td=0,ld=0,tn=0,ln=0;
for (const f of b){const d=routeTo(graph,f,false),n=routeTo(graph,f,true);td+=d.metres;ld+=d.litMetres;tn+=n.metres;ln+=n.litMetres;}
console.log('lit share weighted by metres: day', (100*ld/td).toFixed(0)+'%', 'night', (100*ln/tn).toFixed(0)+'%');
