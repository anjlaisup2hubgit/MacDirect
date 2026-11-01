import fs from 'fs';
const geo = JSON.parse(fs.readFileSync('C:/Users/angel/OneDrive - Macquarie University/MQBS1000/MQBS1000 AS3 social impact/iMCQ/data/map.geojson','utf8'));
const text = JSON.parse(fs.readFileSync('text.json','utf8'));
const pairs = [ // [PDF label (exact item text), geojson name substring]
  ['Lincoln Building', 'Lincoln Building'], ['Service Connect', '(Service Connect)'], ['Lotus', 'Lotus Theatre'],
  ['Cochlear', '(Cochlear)'], ['Incubator', 'Macquarie University Incubator'], ['Banksia', 'Banksia Cottage'],
  ['Hospital', '3 Technology Place'], ['Robert Menzies', 'Robert Menzies College'], ['Ainsworth', 'Ainsworth Building'],
  ['Michael Kirby', 'Michael Kirby Law'], ['Waranara', 'Waranara Library'], ['Sport &', 'Sport and Aquatic'],
  ['Australian', 'Australian Hearing Hub'], ['Student', 'Student Accommodation'], ['Price', 'Price Theatre'],
  ['Dunmore Lang', 'Dunmore Lang College'], ['The Chancellery', 'East 5 Chancellery'], ['Mercure', 'Hotel Parking'],
];
const cx = (f) => { const g = f.geometry; const ring = g.type === 'MultiPolygon' ? g.coordinates[0][0] : g.coordinates[0]; let a=0,b=0; const n=ring.length-1; for(let i=0;i<n;i++){a+=ring[i][0];b+=ring[i][1];} return [a/n,b/n]; };
const LAT0 = -33.775, K = Math.cos(LAT0*Math.PI/180);
const pts = [];
for (const [lab, sub] of pairs) {
  const t = text.find(t => t.s === lab); const f = geo.features.find(f => f.properties.name && f.properties.name.includes(sub) && /Polygon$/.test(f.geometry.type));
  if (!t || !f) { console.log('missing', lab, !!t, !!f); continue; }
  const [lng, lat] = cx(f);
  pts.push({ lab, px: t.x + t.w/2, py: t.y - t.h*0.35, X: lng*K*111320, Y: lat*111320 });
}
// least squares affine: [X,Y] = A*[px,py,1]
function solve(P) {
  const n = P.length; const M = [[0,0,0],[0,0,0],[0,0,0]], bx=[0,0,0], by=[0,0,0];
  for (const p of P) { const r=[p.px,p.py,1]; for(let i=0;i<3;i++){ for(let j=0;j<3;j++) M[i][j]+=r[i]*r[j]; bx[i]+=r[i]*p.X; by[i]+=r[i]*p.Y; } }
  const inv = (m) => { const [[a,b,c],[d,e,f],[g,h,i]] = m; const det=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g); return [[(e*i-f*h)/det,(c*h-b*i)/det,(b*f-c*e)/det],[(f*g-d*i)/det,(a*i-c*g)/det,(c*d-a*f)/det],[(d*h-e*g)/det,(b*g-a*h)/det,(a*e-b*d)/det]]; };
  const Mi = inv(M); const mv = (v) => Mi.map(r => r[0]*v[0]+r[1]*v[1]+r[2]*v[2]);
  return [mv(bx), mv(by)];
}
let P = pts.slice();
for (let it = 0; it < 6; it++) {
  const [cx_, cy_] = solve(P);
  const res = P.map(p => ({ p, e: Math.hypot(cx_[0]*p.px+cx_[1]*p.py+cx_[2]-p.X, cy_[0]*p.px+cy_[1]*p.py+cy_[2]-p.Y) }));
  res.sort((a,b)=>b.e-a.e);
  console.log('iter', it, 'n', P.length, 'rms', Math.sqrt(res.reduce((s,r)=>s+r.e*r.e,0)/res.length).toFixed(1), 'worst', res[0].p.lab, res[0].e.toFixed(1));
  if (res[0].e < 15 || P.length <= 8 || it === 5) { fs.writeFileSync('affine.json', JSON.stringify({ cx: cx_, cy: cy_, K, res: res.map(r=>[r.p.lab, +r.e.toFixed(1)]) })); console.log(res.map(r=>r.p.lab+':'+r.e.toFixed(0)).join(' ')); break; }
  P = res.slice(1).map(r=>r.p);
}
