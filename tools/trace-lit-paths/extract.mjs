import fs from 'fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';
const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync('acc.pdf')), useSystemFonts: true }).promise;
const page = await doc.getPage(1);
const vp = page.getViewport({ scale: 1 });
const ops = await page.getOperatorList();
const O = pdfjs.OPS;
const mul = (a, b) => [
  a[0]*b[0]+a[2]*b[1], a[1]*b[0]+a[3]*b[1],
  a[0]*b[2]+a[2]*b[3], a[1]*b[2]+a[3]*b[3],
  a[0]*b[4]+a[2]*b[5]+a[4], a[1]*b[4]+a[3]*b[5]+a[5]];
// pdf.js applies the matrix as: new CTM = transform_arg x old CTM
let ctm = vp.transform.slice();
const stack = [];
let fill = '';
let path = [];
const shapes = {};
function apply(m, x, y) { return [m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]]; }
for (let i = 0; i < ops.fnArray.length; i++) {
  const fn = ops.fnArray[i], a = ops.argsArray[i];
  if (fn === O.save) stack.push(ctm.slice());
  else if (fn === O.restore) ctm = stack.pop() || ctm;
  else if (fn === O.transform) ctm = mul(ctm, a);
  else if (fn === O.setFillRGBColor) fill = a.join(',');
  else if (fn === O.constructPath) {
    const [pops, co] = a; let k = 0; let cur = null;
    for (const op of pops) {
      if (op === O.moveTo) { cur = [apply(ctm, co[k], co[k+1])]; path.push(cur); k += 2; }
      else if (op === O.lineTo) { cur.push(apply(ctm, co[k], co[k+1])); k += 2; }
      else if (op === O.curveTo) { cur.push(apply(ctm, co[k+4], co[k+5])); k += 6; }
      else if (op === O.curveTo2 || op === O.curveTo3) { cur.push(apply(ctm, co[k+2], co[k+3])); k += 4; }
      else if (op === O.rectangle) {
        const x = co[k], y = co[k+1], w = co[k+2], h = co[k+3]; k += 4;
        path.push([apply(ctm,x,y), apply(ctm,x+w,y), apply(ctm,x+w,y+h), apply(ctm,x,y+h)]);
      }
    }
  } else if (fn === O.fill || fn === O.eoFill) { (shapes[fill] ||= []).push(path); path = []; }
  else if (fn === O.endPath || fn === O.stroke || fn === O.closeStroke) path = [];
}
fs.writeFileSync('yellow.json', JSON.stringify(shapes['255,242,0']));
fs.writeFileSync('blue.json', JSON.stringify(shapes['0,111,186']));
const tc = await page.getTextContent();
const text = tc.items.filter(t => t.str.trim()).map(t => {
  const p = apply(vp.transform, t.transform[4], t.transform[5]);
  return { s: t.str, x: p[0], y: p[1], w: t.width, h: t.height };
});
fs.writeFileSync('text.json', JSON.stringify(text));
const y = shapes['255,242,0'];
const pts = y.flat(2);
console.log('yellow shapes', y.length, 'points', y.reduce((n, s) => n + s.reduce((m, p) => m + p.length, 0), 0));
console.log('text items', text.length);
console.log('sample yellow', JSON.stringify(y.slice(0, 3)).slice(0, 400));
