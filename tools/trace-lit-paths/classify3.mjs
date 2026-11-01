import fs from 'fs';
import * as nc from '@napi-rs/canvas';
const S = 6, N = 24;
const img = await nc.loadImage('page.png');
const full = nc.createCanvas(img.width, img.height); const fg = full.getContext('2d'); fg.drawImage(img, 0, 0);
const placements = JSON.parse(fs.readFileSync('images.json','utf8'));
const groupsRaw = JSON.parse(fs.readFileSync('icons.json','utf8'));
// bbox of each group from its placements (match by proximity)
const bbox = (gx, gy) => { const ps = placements.filter(o => Math.hypot(o.x-gx, o.y-gy) < 6.5); if (!ps.length) return null; let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for (const o of ps) { x0=Math.min(x0,o.x-o.sx/2); x1=Math.max(x1,o.x+o.sx/2); y0=Math.min(y0,o.y-o.sy/2); y1=Math.max(y1,o.y+o.sy/2);} return { x0,y0,x1,y1 }; };
const feat = (b) => { const w = Math.round((b.x1-b.x0)*S), h = Math.round((b.y1-b.y0)*S); const d = fg.getImageData(Math.round(b.x0*S), Math.round(b.y0*S), w, h).data;
  const ink = new Array(N*N).fill(0), cnt = new Array(N*N).fill(0); let blue = 0, grey = 0, tot = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = (y*w+x)*4, r=d[p], g=d[p+1], bl=d[p+2]; const cell = Math.min(N-1, Math.floor(y*N/h))*N + Math.min(N-1, Math.floor(x*N/w)); cnt[cell]++; tot++;
    if (r < 90 && g < 90 && bl < 90) ink[cell]++; if (bl > r + 50 && bl > 100) blue++; if (Math.abs(r-g)<10 && Math.abs(g-bl)<10 && r>150 && r<190) grey++; }
  const v = ink.map((a,i)=>a/(cnt[i]||1)); const m = v.reduce((a,b)=>a+b,0)/v.length; const c = v.map(x=>x-m); const s = Math.sqrt(c.reduce((a,b)=>a+b*b,0))||1;
  return { ink: c.map(x=>x/s), blue: blue/tot, grey: grey/tot, aspect: (b.x1-b.x0)/(b.y1-b.y0) }; };
const cos = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
const legendPts = { toilet: [45,97], shower: [45,86], lift: [45,145], stair: [44,156] };
const LF = Object.fromEntries(Object.entries(legendPts).map(([k,[x,y]]) => [k, feat(bbox(x,y))]));
const out = groupsRaw.map((g, i) => { const b = bbox(g.x, g.y); if (!b) return { i, x: g.x, y: g.y, cls: 'unknown' }; const f = feat(b);
  const sc = Object.entries(LF).map(([k,v]) => [k, cos(f.ink, v.ink)]).sort((a,b)=>b[1]-a[1]);
  let cls = sc[0][0]; if (f.blue > 0.3) cls = 'parking'; else if (f.grey > 0.25 && cls !== 'lift') cls = 'toilet';
  return { i, x: g.x, y: g.y, cls, sim: +sc[0][1].toFixed(2), blue: +f.blue.toFixed(2), grey: +f.grey.toFixed(2), second: sc[1][0] }; });
fs.writeFileSync('icon-classes.json', JSON.stringify(out));
const cnt = {}; for (const r of out) cnt[r.cls] = (cnt[r.cls]||0)+1; console.log(cnt);
const cs = 70, cols = 14, rows = Math.ceil(out.length/cols);
const sheet = nc.createCanvas(cols*cs, rows*(cs+14)); const sg = sheet.getContext('2d'); sg.fillStyle='#fff'; sg.fillRect(0,0,sheet.width,sheet.height); sg.font='11px sans-serif'; sg.fillStyle='#000';
out.forEach((r, i) => { const cx=(i%cols)*cs, cy=Math.floor(i/cols)*(cs+14); sg.drawImage(img,(r.x-7)*S,(r.y-7)*S,14*S,14*S,cx,cy+14,cs,cs); sg.fillText(i+' '+r.cls,cx+1,cy+11); });
fs.writeFileSync('sheet2.png', sheet.toBuffer('image/png'));
