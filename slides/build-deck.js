// Builds MacDirect-5-min-talk.pptx.
// Run from a folder that has pptxgenjs installed: node build-deck.js <slides folder> <pptx skill folder>
const path = require('path');
const pptxgen = require('pptxgenjs');
const dir = process.argv[2];
const { applyTheme } = require(path.join(process.argv[3], 'scripts/apply_theme.js'));
const f = (n) => path.join(dir, n);

// Tokens from the :root block of public/css/style.css
const INK = '1A1220', PAPER = 'FFF4EE', WASH = 'F6E9FF', PINK = 'E23E7A';
const HEAD = 'Fraunces', BODY = 'Plus Jakarta Sans';
const THEME = { name: 'MacDirect', headFontFace: HEAD, bodyFontFace: BODY,
  colors: { dk1: INK, lt1: 'FFFFFF', dk2: '3B1A6E', lt2: PAPER, accent1: PINK, accent2: '7EC8FF', accent3: '6B21A8', accent4: WASH, accent5: '3B1A6E', accent6: '8B0000', hlink: '3B1A6E', folHlink: '6B21A8' } };

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
pres.theme = { headFontFace: HEAD, bodyFontFace: BODY };
pres.title = 'MacDirect: a campus map for new Macquarie students';
pres.author = 'MacDirect (iMCQ)';

const title = (color, o = {}) => ({ type: 'title', options: { name: 'title', x: 0.6, y: 0.45, w: 12.1, h: 1.0, fontFace: HEAD, fontSize: 38, bold: true, color, margin: 0, valign: 'top', ...o } });
pres.defineSlideMaster({ title: 'LIGHT', background: { color: PAPER }, objects: [{ placeholder: { options: title(INK).options, text: '' } }] });
pres.defineSlideMaster({ title: 'DARK', background: { color: INK }, objects: [{ placeholder: { options: title(PAPER, { y: 1.0, w: 7.6, h: 3.8, fontSize: 42 }).options, text: '' } }] });
pres.defineSlideMaster({ title: 'LIGHT NARROW', background: { color: PAPER }, objects: [{ placeholder: { options: title(INK, { w: 8.0 }).options, text: '' } }] });

const R = pres.ShapeType.roundRect;
const box = (s, name, shape, o) => s.addShape(shape, { objectName: name, line: { type: 'none' }, ...o });
const text = (s, name, t, o) => s.addText(t, { objectName: name, isTextBox: true, margin: 0, fontFace: BODY, fontSize: 24, color: INK, valign: 'top', ...o });
const bullets = (items) => items.map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1, paraSpaceAfter: 14 } }));

// ---- 1 Hook
{
  const s = pres.addSlide({ masterName: 'DARK' });
  s.addText('How can a new student with a disability find a society, then get to its events?', { placeholder: 'title' });
  text(s, 'Subtitle', 'MacDirect: a campus map that shows access details, not just buildings', { x: 0.6, y: 5.2, w: 7.6, h: 1.2, fontSize: 28, color: WASH });
  box(s, 'Phone frame', R, { x: 9.15, y: 0.45, w: 3.21, h: 6.6, rectRadius: 0.35, fill: { color: PINK } });
  s.addImage({ path: f('a-map.png'), x: 9.3, y: 0.6, w: 2.91, h: 6.3, altText: 'MacDirect map of Macquarie University on a phone' });
  s.addNotes("TIME 0:00 to 0:30 (about 60 words)\n\nImagine it is your first week at Macquarie, and you use a wheelchair or find stairs hard. Societies are a great way to make friends. But before you go, you need to know: can I get into the building, is there a lift, is there an accessible toilet, and does the walk have stairs? Today I will show how MacDirect helps with those questions.");
}

// ---- 2 Solution
{
  const s = pres.addSlide({ masterName: 'LIGHT' });
  s.addText('Societies and access details on one map', { placeholder: 'title' });
  const tiles = [['129', 'societies'], ['34 of 63', 'buildings show lifts and accessible toilets'], ['Stairs', 'warned about on the walking route']];
  tiles.forEach(([n, l], i) => {
    const x = 0.6 + i * 4.115;
    box(s, `Tile ${i + 1}`, R, { x, y: 1.9, w: 3.9, h: 3.15, rectRadius: 0.3, fill: { color: WASH } });
    text(s, `Number ${i + 1}`, n, { x: x + 0.25, y: 2.15, w: 3.4, h: 1.2, fontFace: HEAD, fontSize: 54, bold: true, color: PINK });
    text(s, `Label ${i + 1}`, l, { x: x + 0.25, y: 3.5, w: 3.4, h: 1.35 });
  });
  box(s, 'Summary pill', R, { x: 0.6, y: 5.45, w: 12.13, h: 1.4, rectRadius: 0.7, fill: { color: INK } });
  text(s, 'Summary', 'Browse as a guest, check the building and the route, then go.', { x: 1.1, y: 5.6, w: 11.1, h: 1.1, fontSize: 26, color: PAPER, valign: 'middle' });
  s.addNotes("TIME 0:30 to 1:15 (about 75 words)\n\nMacDirect is a mobile map of the Macquarie campus. It lists 129 societies and 63 named buildings. For 34 of those buildings it shows how many lifts and accessible toilets there are, read from Macquarie's own Accessibility Map. The other 29 say Not confirmed, which does not mean there is no lift. When you ask for directions, the route card tells you if the walk includes stairs. You can browse all of this as a guest, with no account.");
}

// ---- 3 Demo
{
  const s = pres.addSlide({ masterName: 'LIGHT NARROW' });
  s.addText("Priya's first week", { placeholder: 'title' });
  text(s, 'Disclaimer', 'Priya is a made-up example who needs step-free access. Clip recorded on the live site.', { x: 0.6, y: 1.35, w: 8.0, h: 0.9 });
  const steps = ['Finds the Law Society in Societies', 'Show on map: it meets in the Michael Kirby Law Building', 'Panel shows 1 lift and 1 accessible toilet', 'Directions: 562 m, with a warning: this route includes stairs'];
  steps.forEach((t, i) => {
    const y = 2.55 + i * 1.0;
    box(s, `Step dot ${i + 1}`, pres.ShapeType.ellipse, { x: 0.6, y, w: 0.65, h: 0.65, fill: { color: PINK } });
    text(s, `Step number ${i + 1}`, String(i + 1), { x: 0.6, y, w: 0.65, h: 0.65, align: 'center', valign: 'middle', bold: true });
    text(s, `Step ${i + 1}`, t, { x: 1.5, y: y - 0.05, w: 7.1, h: 0.95, valign: 'middle' });
  });
  box(s, 'Phone frame', R, { x: 9.35, y: 0.45, w: 3.3, h: 6.75, rectRadius: 0.35, fill: { color: INK } });
  s.addMedia({ type: 'video', path: f('demo.mp4'), cover: 'data:image/jpeg;base64,' + require('fs').readFileSync(f('route-frame.jpg')).toString('base64'), x: 9.51, y: 0.6, w: 2.98, h: 6.45 });
  s.addNotes("TIME 1:15 to 3:15 (about 195 words). Play the clip. If the video will not play, open demo-fallback.gif from the same folder.\n\nThis is Priya. She is an example student, not a real participant, and she needs step-free access. She finds the Law Society in the Societies list and taps Show on map. The map moves to the Michael Kirby Law Building, and the panel says the Law Society meets here.\n\nShe scrolls the panel to Accessibility. It shows one lift and one accessible toilet. That is useful, but the data is read from a PDF map, so positions are approximate and she should check on site.\n\nNow she taps Directions. The route is 562 metres, about seven minutes from the station. The card says: this route includes stairs.\n\nThis is the honest part. MacDirect warns about stairs, but it does not yet choose a step-free route for her. Five of the 63 routes from the station include stairs. So today Priya gets a warning and the lift information, not a guaranteed step-free path. A step-free option is my first target.\n\nI did not show the mcqAI search, because it is only a stub.");
}

// ---- 4 Testing
{
  const s = pres.addSlide({ masterName: 'LIGHT' });
  s.addText('How I tested, and how I used AI', { placeholder: 'title' });
  const bugs = [['Calendar buttons did nothing', '7a55ff4 · caught by me'], ['Name showed Saved but did not save', '80d0740 · caught by the AI tester'], ['Walk steps added up 34 m short', '18443f4 · caught by a script']];
  bugs.forEach(([a, b], i) => {
    const y = 1.6 + i * 1.4;
    box(s, `Bug card ${i + 1}`, R, { x: 0.6, y, w: 8.0, h: 1.25, rectRadius: 0.25, fill: { color: WASH } });
    text(s, `Bug ${i + 1}`, [{ text: a, options: { bold: true, breakLine: true } }, { text: b, options: {} }], { x: 0.9, y: y + 0.1, w: 7.4, h: 1.05, valign: 'middle' });
  });
  [['76', 'Lighthouse mobile score, one run'], ['0.35 s', '/api/map first byte, 10 requests']].forEach(([n, l], i) => {
    const y = 1.6 + i * 2.15;
    box(s, `Speed tile ${i + 1}`, R, { x: 8.9, y, w: 3.83, h: 2.0, rectRadius: 0.25, fill: { color: WASH } });
    text(s, `Speed number ${i + 1}`, n, { x: 9.15, y: y + 0.15, w: 3.4, h: 0.9, fontFace: HEAD, fontSize: 48, bold: true, color: PINK });
    text(s, `Speed label ${i + 1}`, l, { x: 9.15, y: y + 1.0, w: 3.4, h: 0.9 });
  });
  box(s, 'Honesty band', R, { x: 0.6, y: 6.1, w: 12.13, h: 1.0, rectRadius: 0.3, fill: { color: INK } });
  text(s, 'Honesty line', "I reverted the AI's colour change (85a85db). Never tested: with students who have a disability, or logged-in accounts.", { x: 0.9, y: 6.1, w: 11.5, h: 1.0, color: PAPER, valign: 'middle' });
  s.addNotes("TIME 3:15 to 4:15 (about 120 words)\n\nThis slide is an audit of how I used AI, not a claim that the app is perfect.\n\nThree real bugs. I found the Calendar bug myself, because the buttons did nothing. The AI tester agent found the display name bug: the screen said Saved when the database changed nothing. A script found that the walking steps were 34 metres short of the route total.\n\nThe AI was also wrong sometimes. It built my report around lit paths, and I told it to stop. I also reverted its colour change.\n\nFor speed, I measured one Lighthouse mobile run: performance 76, and 4.5 seconds to the largest paint. The map data call took about 0.35 seconds to the first byte.\n\nWhat I never tested: the app with students who have a disability, and logged-in accounts. I have also not checked the lift and toilet positions against the real campus.");
}

// ---- 5 Impact
{
  const s = pres.addSlide({ masterName: 'LIGHT' });
  s.addText('What exists today, and what I aim for', { placeholder: 'title' });
  box(s, 'Today card', R, { x: 0.6, y: 1.7, w: 5.9, h: 4.9, rectRadius: 0.3, fill: { color: WASH } });
  text(s, 'Today heading', 'Built and live today', { x: 0.95, y: 2.0, w: 5.2, h: 0.6, fontFace: HEAD, fontSize: 30, bold: true });
  text(s, 'Today list', bullets(['129 societies, 63 buildings', 'Lift and toilet details for 34 buildings', 'A warning when a route has stairs', 'Not yet tested with real users']), { x: 0.95, y: 2.9, w: 5.2, h: 3.4 });
  box(s, 'Targets card', R, { x: 6.83, y: 1.7, w: 5.9, h: 4.9, rectRadius: 0.3, fill: { color: INK } });
  text(s, 'Targets heading', 'Targets, not results', { x: 7.18, y: 2.0, w: 5.2, h: 0.6, fontFace: HEAD, fontSize: 30, bold: true, color: PINK });
  text(s, 'Targets list', bullets(['A step-free route option (not built yet)', 'Students with a disability try the Priya task', 'Check lift and toilet data on site']), { x: 7.18, y: 2.9, w: 5.2, h: 3.4, color: PAPER });
  s.addNotes("TIME 4:15 to 5:00 (about 95 words)\n\nWhat exists today is a working app with real counts: 129 societies, 63 buildings, lift and toilet details for 34 buildings, and a stairs warning on routes. That is not the same as proven results. Nobody has tested it with real users, so I have no user numbers.\n\nThese are targets, not results. First, build a step-free route option. Second, ask students with a disability to try the Priya task, with their consent. Third, check the lift and toilet data on site.\n\nThe question stays the same: can every new student find a society and reach its events? Thank you.");
}

(async () => {
  const out = process.argv[4] || f('MacDirect-5-min-talk.pptx');
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log('wrote', out);
})();
