import fs from 'fs';
const geo = JSON.parse(fs.readFileSync('C:/Users/angel/OneDrive - Macquarie University/MQBS1000/MQBS1000 AS3 social impact/iMCQ/data/map.geojson','utf8'));
const yellow = JSON.parse(fs.readFileSync('dashes.json','utf8')).map(r=>[r]);
let { cx, cy, K } = JSON.parse(fs.readFileSync('affine.json','utf8'));
const WALK = new Set(['footway','pedestrian','path','steps','crossing','corridor','living_street','service','unclassified','residential']);
const segs = [];
for (const f of geo.features) {
  const hw = f.properties.highway; if (!WALK.has(hw) || !f.geometry) continue;
  const lines = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [];
  for (const l of lines) for (let i = 0; i < l.length-1; i++) segs.push([l[i][0]*K*111320, l[i][1]*111320, l[i+1][0]*K*111320, l[i+1][1]*111320]);
}
const dashes = yellow.map(s => { const p = s[0]; let a=0,b=0; const n=p.length-1; for(let i=0;i<n;i++){a+=p[i][0];b+=p[i][1];} return [a/n,b/n]; });
function near(X, Y) { let best=1e9, bx=0, by=0; for (const [ax,ay,bx_,by_] of segs) { const dx=bx_-ax, dy=by_-ay; const l2=dx*dx+dy*dy; let t=l2?((X-ax)*dx+(Y-ay)*dy)/l2:0; t=Math.max(0,Math.min(1,t)); const x=ax+dx*t, y=ay+dy*t; const d=Math.hypot(X-x,Y-y); if(d<best){best=d;bx=x;by=y;} } return {d:best,x:bx,y:by}; }
function fitAffine(P) { // P: {px,py,X,Y}
  const M=[[0,0,0],[0,0,0],[0,0,0]], bx=[0,0,0], by=[0,0,0];
  for (const p of P) { const r=[p.px,p.py,1]; for(let i=0;i<3;i++){ for(let j=0;j<3;j++) M[i][j]+=r[i]*r[j]; bx[i]+=r[i]*p.X; by[i]+=r[i]*p.Y; } }
  const [[a,b,c],[d,e,f],[g,h,i]]=M; const det=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);
  const Mi=[[(e*i-f*h)/det,(c*h-b*i)/det,(b*f-c*e)/det],[(f*g-d*i)/det,(a*i-c*g)/det,(c*d-a*f)/det],[(d*h-e*g)/det,(b*g-a*h)/det,(a*e-b*d)/det]];
  const mv=(v)=>Mi.map(r=>r[0]*v[0]+r[1]*v[1]+r[2]*v[2]); return [mv(bx), mv(by)];
}
for (const R of [40, 30, 25, 20, 15, 12, 10, 8, 8, 6]) {
  let pairs = dashes.map(([px,py]) => { const X=cx[0]*px+cx[1]*py+cx[2], Y=cy[0]*px+cy[1]*py+cy[2]; const n=near(X,Y); return {px,py,X:n.x,Y:n.y,d:n.d}; }).filter(p => p.d < R);
  pairs.sort((a,b)=>a.d-b.d); pairs = pairs.slice(0, Math.ceil(pairs.length*0.85));
  [cx, cy] = fitAffine(pairs);
  const all = dashes.map(([px,py]) => near(cx[0]*px+cx[1]*py+cx[2], cy[0]*px+cy[1]*py+cy[2]).d).sort((a,b)=>a-b);
  const q = (p) => all[Math.floor(all.length*p)].toFixed(1);
  console.log('R', R, 'used', pairs.length, 'median', q(0.5), 'p75', q(0.75), 'p90', q(0.9));
}
fs.writeFileSync('affine2.json', JSON.stringify({ cx, cy, K }));
