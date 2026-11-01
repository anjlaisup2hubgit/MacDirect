import fs from 'fs';
import * as nc from '@napi-rs/canvas';
globalThis.DOMMatrix = nc.DOMMatrix; globalThis.Path2D = nc.Path2D; globalThis.ImageData = nc.ImageData;
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.js';
class Factory { create(w, h) { const canvas = nc.createCanvas(w, h); return { canvas, context: canvas.getContext('2d') }; } reset(c, w, h) { c.canvas.width = w; c.canvas.height = h; } destroy(c) { c.canvas.width = 0; c.canvas.height = 0; } }
const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync('acc.pdf')), useSystemFonts: true, canvasFactory: new Factory() }).promise;
const page = await doc.getPage(1);
const S = +process.argv[2] || 6;
const vp = page.getViewport({ scale: S });
const canvas = nc.createCanvas(Math.round(vp.width), Math.round(vp.height));
const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
const t0 = Date.now();
await page.render({ canvasContext: ctx, viewport: vp, canvasFactory: new Factory() }).promise;
fs.writeFileSync('page.png', canvas.toBuffer('image/png'));
console.log('rendered', canvas.width, 'x', canvas.height, 'in', Date.now() - t0, 'ms');
