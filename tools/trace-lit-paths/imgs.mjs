import fs from 'fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';
const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync('acc.pdf')), useSystemFonts: true }).promise;
const page = await doc.getPage(1);
const vp = page.getViewport({ scale: 1 });
const ops = await page.getOperatorList();
const O = pdfjs.OPS;
const mul = (a, b) => [a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1], a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3], a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5]];
let ctm = vp.transform.slice(); const stack = [];
const out = [];
for (let i = 0; i < ops.fnArray.length; i++) {
  const fn = ops.fnArray[i], a = ops.argsArray[i];
  if (fn === O.save) stack.push(ctm.slice());
  else if (fn === O.restore) ctm = stack.pop() || ctm;
  else if (fn === O.transform) ctm = mul(ctm, a);
  else if (fn === O.paintImageXObject || fn === O.paintInlineImageXObject || fn === O.paintImageMaskXObject) {
    // unit square mapped by ctm
    const x = ctm[4] + ctm[2] * 0.5 + ctm[0] * 0.5, y = ctm[5] + ctm[3] * 0.5 + ctm[1] * 0.5;
    out.push({ op: fn, id: a[0], w: a[1], h: a[2], x, y, sx: Math.hypot(ctm[0], ctm[1]), sy: Math.hypot(ctm[2], ctm[3]) });
  }
}
console.log(out.length, 'images');
const byId = {};
for (const o of out) (byId[o.id] ||= []).push(o);
console.log('distinct ids', Object.keys(byId).length);
console.log(Object.entries(byId).map(([id, l]) => `${id}: n=${l.length} ${l[0].w}x${l[0].h} size~${l[0].sx.toFixed(1)}x${l[0].sy.toFixed(1)} at (${l[0].x.toFixed(0)},${l[0].y.toFixed(0)})`).join('\n'));
fs.writeFileSync('images.json', JSON.stringify(out));
