import fs from 'fs';
const geo = JSON.parse(fs.readFileSync('C:/Users/angel/OneDrive - Macquarie University/MQBS1000/MQBS1000 AS3 social impact/iMCQ/data/map.geojson','utf8'));
const dashRings = JSON.parse(fs.readFileSync('dashes.json','utf8'));
const { cx, cy, K } = JSON.parse(fs.readFileSync('affine2.json','utf8'));
const WALK = new Set(['footway','pedestrian','path','steps','crossing','corridor','living_street','service','unclassified','residential']);
const M = 111320, SNAP = 14, REACH = 14;
// dashes in metres; skip the legend swatch (top-left of the PDF)
const dashes = dashRings.map(r => { let a=0,b=0; const n=r.length-1; for(let i=0;i<n;i++){a+=r[i][0];b+=r[i][1];} return [a/n,b/n]; })
  .filter(([a,b]) => !(a < 140 && b < 200)).map(([a,b]) => [cx[0]*a+cx[1]*b+cx[2], cy[0]*a+cy[1]*b+cy[2]]);
const ways = [];
for (const f of geo.features) {
  if (!WALK.has(f.properties.highway) || !f.geometry) continue;
  const lines = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [];
  lines.forEach((l, li) => { const pts = l.map(c => [c[0]*K*M, c[1]*M]); const cum=[0]; for (let i=1;i<pts.length;i++) cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1])); ways.push({ raw: l, pts, cum, lit: [] }); });
}
let assigned = 0;
for (const [X, Y] of dashes) {
  let best = SNAP, bw = null, bs = 0;
  for (const w of ways) for (let i = 0; i < w.pts.length-1; i++) {
    const [ax,ay] = w.pts[i], [bx,by] = w.pts[i+1]; const dx=bx-ax, dy=by-ay, l2=dx*dx+dy*dy; let t=l2?((X-ax)*dx+(Y-ay)*dy)/l2:0; t=Math.max(0,Math.min(1,t));
    const d = Math.hypot(X-(ax+dx*t), Y-(ay+dy*t)); if (d < best) { best=d; bw=w; bs=w.cum[i]+t*Math.sqrt(l2); }
  }
  if (bw) { bw.lit.push(bs); assigned++; }
}
const segs = []; let litM = 0, totM = 0;
for (const w of ways) for (let i = 0; i < w.pts.length-1; i++) {
  const len = w.cum[i+1]-w.cum[i]; totM += len;
  const lo = w.cum[i], hi = w.cum[i+1];
  if (w.lit.some(s => s >= lo - REACH && s <= hi + REACH)) { litM += len; const a=w.raw[i], b=w.raw[i+1]; segs.push([+a[0].toFixed(5), +a[1].toFixed(5), +b[0].toFixed(5), +b[1].toFixed(5)]); }
}
console.log('dashes', dashes.length, 'assigned', assigned, 'lit segments', segs.length, 'lit', Math.round(litM), 'm of', Math.round(totM), 'm');
fs.writeFileSync('lit.json', JSON.stringify(segs));
