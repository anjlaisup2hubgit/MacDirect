import fs from 'fs';
import * as nc from '@napi-rs/canvas';
const geo = JSON.parse(fs.readFileSync('C:/Users/angel/OneDrive - Macquarie University/MQBS1000/MQBS1000 AS3 social impact/iMCQ/data/map.geojson','utf8'));
const { cx, cy, K } = JSON.parse(fs.readFileSync('affine2.json','utf8'));
const M = 111320;
const icons = JSON.parse(fs.readFileSync('icon-classes.json','utf8'));
const drop = new Set([126, 127, 144, 145, 146]); const fix = { 125: 'toilet' };
const cls = icons.filter(r => !drop.has(r.i)).map(r => ({ ...r, cls: fix[r.i] || r.cls }));
const toM = (r) => [cx[0]*r.x+cx[1]*r.y+cx[2], cy[0]*r.x+cy[1]*r.y+cy[2]];
const polys = geo.features.filter(f => f.properties.building && /Polygon$/.test(f.geometry.type)).map(f => { const g=f.geometry; const ring = (g.type==='MultiPolygon'?g.coordinates[0][0]:g.coordinates[0]).map(c=>[c[0]*K*M,c[1]*M]); return { id: f.id, name: f.properties.name || null, ring }; });
const inside = (X,Y,ring) => { let ins=false; for (let i=0,j=ring.length-1;i<ring.length;j=i++){ const [xi,yi]=ring[i],[xj,yj]=ring[j]; if((yi>Y)!==(yj>Y)&&X<(xj-xi)*(Y-yi)/(yj-yi)+xi) ins=!ins;} return ins; };
const edgeD = (X,Y,ring) => { let b=1e9; for(let i=0;i<ring.length-1;i++){const [ax,ay]=ring[i],[bx,by]=ring[i+1];const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;let t=l2?((X-ax)*dx+(Y-ay)*dy)/l2:0;t=Math.max(0,Math.min(1,t));b=Math.min(b,Math.hypot(X-ax-dx*t,Y-ay-dy*t));}return b; };
const res = cls.map(r => { const [X,Y] = toM(r); let best=null, bd=1e9; for (const p of polys) { const d = inside(X,Y,p.ring) ? 0 : edgeD(X,Y,p.ring); if (d < bd) { bd=d; best=p; } } return { ...r, X, Y, building: best, dist: +bd.toFixed(1) }; });
const hist = { in: res.filter(r=>r.dist===0).length, le10: res.filter(r=>r.dist>0&&r.dist<=10).length, le20: res.filter(r=>r.dist>10&&r.dist<=20).length, over20: res.filter(r=>r.dist>20).length };
console.log('icons', res.length, hist, 'named-building icons', res.filter(r=>r.dist<=20&&r.building.name).length);
fs.writeFileSync('assigned.json', JSON.stringify(res.map(r=>({i:r.i,cls:r.cls,x:r.x,y:r.y,X:r.X,Y:r.Y,dist:r.dist,id:r.building.id,name:r.building.name}))));
// overlay picture
const X0 = 151.105*K*M, Y0 = -33.765*M, SC = 1.6; // px per metre
const W = 1850*SC, H = 1100*SC; const c = nc.createCanvas(W, H); const g = c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,W,H);
const P = (X,Y) => [(X-X0)*SC, (Y0-Y)*SC - 480*SC];
for (const p of polys) { g.beginPath(); p.ring.forEach(([X,Y],i)=>{const [a,b]=P(X,Y); i?g.lineTo(a,b):g.moveTo(a,b);}); g.closePath(); g.fillStyle = p.name?'#ddd':'#eee'; g.fill(); g.strokeStyle='#999'; g.stroke(); }
const colour = { toilet:'#777', parking:'#1760b0', lift:'#c0392b', stair:'#e67e22', shower:'#16a085' }; const letter = { toilet:'T', parking:'P', lift:'L', stair:'S', shower:'W' };
g.font='bold 11px sans-serif'; g.textAlign='center'; g.textBaseline='middle';
for (const r of res) { const [a,b]=P(r.X,r.Y); g.fillStyle=colour[r.cls]; g.beginPath(); g.arc(a,b,7,0,7); g.fill(); g.fillStyle='#fff'; g.fillText(letter[r.cls],a,b); }
g.fillStyle='#000'; g.font='10px sans-serif'; for (const p of polys) if (p.name) { let ax=0,ay=0; p.ring.forEach(([X,Y])=>{ax+=X;ay+=Y}); ax/=p.ring.length; ay/=p.ring.length; const [a,b]=P(ax,ay); g.fillText(p.name.replace(/\(.*\)/,'').slice(0,18), a, b+12); }
fs.writeFileSync('icons-overlay.png', c.toBuffer('image/png'));
