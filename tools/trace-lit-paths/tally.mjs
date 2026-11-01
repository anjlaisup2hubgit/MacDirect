import fs from 'fs';
const A = JSON.parse(fs.readFileSync('assigned.json','utf8'));
const text = JSON.parse(fs.readFileSync('text.json','utf8')).filter(t => ['SL','SW','SD'].includes(t.s));
const THR = 10;
const door = (r) => { let best = null, bd = 14; for (const t of text) { const d = Math.hypot(t.x + t.w/2 - r.x, t.y - r.y); if (d < bd) { bd = d; best = t.s; } } return best; };
const out = {}; const skipped = [];
for (const r of A) {
  if (r.cls === 'parking') continue;
  if (r.dist > THR || !r.name) { skipped.push(r); continue; }
  const b = (out[r.id] ||= { name: r.name, lifts: 0, toilets: 0, sliding: 0, swing: 0, showers: 0, stairs: 0 });
  if (r.cls === 'lift') b.lifts++;
  else if (r.cls === 'stair') b.stairs++;
  else if (r.cls === 'shower') b.showers++;
  else if (r.cls === 'toilet') { b.toilets++; const d = door(r); if (d === 'SL') b.sliding++; if (d === 'SW') b.swing++; }
}
const ids = Object.keys(out);
const tot = ids.reduce((a, id) => { for (const k of ['lifts','toilets','sliding','swing','showers','stairs']) a[k] = (a[k]||0) + out[id][k]; return a; }, {});
console.log('buildings with data', ids.length, tot, 'icons not placed on a named building within', THR, 'm:', skipped.length, skipped.reduce((a,r)=>(a[r.cls]=(a[r.cls]||0)+1,a),{}));
console.log(ids.map(id => `${out[id].name.slice(0,34)}: L${out[id].lifts} T${out[id].toilets}(sl${out[id].sliding}/sw${out[id].swing}) W${out[id].showers} S${out[id].stairs}`).join('\n'));
fs.writeFileSync('accessibility.json', JSON.stringify(out));
