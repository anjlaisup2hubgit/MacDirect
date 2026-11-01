// Reads the drinking water icons off Macquarie's Drinking Water Map (data/mq-maps/Drinking-water.pdf, Sept 2025) and
// places them with the Accessibility Map alignment (affine2.json from icp.mjs). Run ex.mjs first. Paths are the author's scratch folder. Skip the first two images (a bus icon and the metro icon) and the legend drop and pin; the Sports Fields drop has no building near it.
import fs from 'fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';
const geo = JSON.parse(fs.readFileSync('C:/Users/angel/OneDrive - Macquarie University/MQBS1000/MQBS1000 AS3 social impact/iMCQ/data/map.geojson','utf8'));
const { cx, cy, K } = JSON.parse(fs.readFileSync('affine2.json','utf8'));
const text = JSON.parse(fs.readFileSync('text_dw.json','utf8'));
const shapes = JSON.parse(fs.readFileSync('shapes.json','utf8'));
const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync('dw.pdf')), useSystemFonts: true }).promise;
const page = await doc.getPage(1); const vp = page.getViewport({ scale: 1 });
const ops = await page.getOperatorList(); const O = pdfjs.OPS;
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
let ctm=vp.transform.slice(); const st=[]; const pts=[];
for (let i=0;i<ops.fnArray.length;i++){const fn=ops.fnArray[i];
 if(fn===O.save)st.push(ctm.slice()); else if(fn===O.restore)ctm=st.pop()||ctm; else if(fn===O.transform)ctm=mul(ctm,ops.argsArray[i]);
 else if(fn===O.paintImageXObject) pts.push({kind:'fountain', px:ctm[4]+ctm[0]/2, py:ctm[5]});}
for (const sh of shapes['212,14,140']) { const p=sh.flat(); const xs=p.map(q=>q[0]), ys=p.map(q=>q[1]); pts.push({kind:'tapit', px:(Math.min(...xs)+Math.max(...xs))/2, py:Math.max(...ys)}); }
const bldg = geo.features.filter(f=>f.properties.building&&f.properties.name&&/Polygon$/.test(f.geometry.type)).map(f=>({f,ring:(f.geometry.type==='MultiPolygon'?f.geometry.coordinates[0][0]:f.geometry.coordinates[0]).map(([x,y])=>[x*K*111320,y*111320])}));
const out = [];
for (const p of pts) {
  p.X=cx[0]*p.px+cx[1]*p.py+cx[2]; p.Y=cy[0]*p.px+cy[1]*p.py+cy[2];
  p.lng=p.X/(K*111320); p.lat=p.Y/111320;
  let best=1e9,bn=null; for(const b of bldg){for(const [x,y] of b.ring){const d=Math.hypot(x-p.X,y-p.Y); if(d<best){best=d;bn=b.f.properties.name;}}}
  const fl = text.filter(t=>/^[\d,\-]+$/.test(t.s.trim())&&Math.abs(t.x+t.w/2-p.px)<14&&Math.abs(t.y-(p.py-5))<10).map(t=>t.s.trim());
  out.push({kind:p.kind,lat:+p.lat.toFixed(6),lng:+p.lng.toFixed(6),near:bn,nearM:Math.round(best),floors:fl.join(' ')});
}
fs.writeFileSync('drink-pts.json',JSON.stringify(out));
for(const o of out)console.log(o.kind,o.lat,o.lng,o.nearM+'m',o.near,'|',o.floors);
// compare with OSM
const osm=geo.features.filter(f=>f.properties.amenity==='drinking_water');
console.log('OSM->nearest fountain m:',osm.map(f=>{const [lng,lat]=f.geometry.coordinates;return Math.round(Math.min(...out.filter(o=>o.kind==='fountain').map(o=>Math.hypot((o.lng-lng)*K*111320,(o.lat-lat)*111320))))}).join(','));
