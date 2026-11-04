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
pres.defineSlideMaster({ title: 'DARK', background: { color: INK }, objects: [{ placeholder: { options: title(PAPER, { y: 1.0, w: 7.6, h: 3.8, fontSize: 46 }).options, text: '' } }] });
pres.defineSlideMaster({ title: 'LIGHT NARROW', background: { color: PAPER }, objects: [{ placeholder: { options: title(INK, { w: 8.0 }).options, text: '' } }] });

const R = pres.ShapeType.roundRect;
const box = (s, name, shape, o) => s.addShape(shape, { objectName: name, line: { type: 'none' }, ...o });
const text = (s, name, t, o) => s.addText(t, { objectName: name, isTextBox: true, margin: 0, fontFace: BODY, fontSize: 24, color: INK, valign: 'top', ...o });
const bullets = (items) => items.map((t, i, a) => ({ text: t, options: { bullet: true, breakLine: i < a.length - 1, paraSpaceAfter: 14 } }));

// ---- 1 Hook
{
  const s = pres.addSlide({ masterName: 'DARK' });
  s.addText('How can a new student find a society, join one, and get to its events?', { placeholder: 'title' });
  text(s, 'Subtitle', 'MacDirect: a campus map for your first week at Macquarie', { x: 0.6, y: 5.2, w: 7.6, h: 1.2, fontSize: 28, color: WASH });
  box(s, 'Phone frame', R, { x: 9.15, y: 0.45, w: 3.21, h: 6.6, rectRadius: 0.35, fill: { color: PINK } });
  s.addImage({ path: f('a-map.png'), x: 9.3, y: 0.6, w: 2.91, h: 6.3, altText: 'MacDirect map of Macquarie University on a phone' });
  s.addNotes("TIME 0:00 to 0:30 (about 55 words)\n\nImagine it is your first week at Macquarie. People tell you societies are the best way to make friends. But how do you find one, join it, and then find the room where it meets? Today I will show MacDirect, a campus map that tries to answer that for new students.");
}

// ---- 2 Solution
{
  const s = pres.addSlide({ masterName: 'LIGHT' });
  s.addText('MacDirect puts societies on the campus map', { placeholder: 'title' });
  const tiles = [['129', 'societies'], ['63', 'named buildings'], ['12', 'languages'], ['Guest', 'mode: browse with no account']];
  tiles.forEach(([n, l], i) => {
    const x = 0.6 + i * 3.093;
    box(s, `Tile ${i + 1}`, R, { x, y: 1.9, w: 2.85, h: 3.15, rectRadius: 0.3, fill: { color: WASH } });
    text(s, `Number ${i + 1}`, n, { x: x + 0.25, y: 2.15, w: 2.35, h: 1.2, fontFace: HEAD, fontSize: 54, bold: true, color: PINK });
    text(s, `Label ${i + 1}`, l, { x: x + 0.25, y: 3.5, w: 2.35, h: 1.35 });
  });
  box(s, 'Summary pill', R, { x: 0.6, y: 5.45, w: 12.13, h: 1.4, rectRadius: 0.7, fill: { color: INK } });
  text(s, 'Summary', 'Pick a society, see where it meets, then get a walking route from the station.', { x: 1.1, y: 5.6, w: 11.1, h: 1.1, fontSize: 26, color: PAPER, valign: 'middle' });
  s.addNotes("TIME 0:30 to 1:15 (about 75 words)\n\nMacDirect is a mobile map of the Macquarie campus. It lists 129 societies and 63 named buildings, and it works in 12 languages. You do not need an account. Guest mode lets you browse the map, the societies and the food. Each society can be shown on the map, and every building has a Directions button that draws a walking route from the station. All of these are real counts from the app.");
}

// ---- 3 Demo
{
  const s = pres.addSlide({ masterName: 'LIGHT NARROW' });
  s.addText("Priya's first week", { placeholder: 'title' });
  text(s, 'Disclaimer', 'Priya is a made-up example. Clip recorded on the live site.', { x: 0.6, y: 1.35, w: 8.0, h: 0.9 });
  const steps = ['Opens MacDirect as a guest', 'Societies, Hobbies, A Cappella Society', "Show on map: it meets at 25 Wally's Walk", 'Directions: 759 m, about 9 min from the station'];
  steps.forEach((t, i) => {
    const y = 2.55 + i * 1.0;
    box(s, `Step dot ${i + 1}`, pres.ShapeType.ellipse, { x: 0.6, y, w: 0.65, h: 0.65, fill: { color: PINK } });
    text(s, `Step number ${i + 1}`, String(i + 1), { x: 0.6, y, w: 0.65, h: 0.65, align: 'center', valign: 'middle', bold: true });
    text(s, `Step ${i + 1}`, t, { x: 1.5, y: y - 0.05, w: 7.1, h: 0.95, valign: 'middle' });
  });
  box(s, 'Phone frame', R, { x: 9.35, y: 0.45, w: 3.3, h: 6.75, rectRadius: 0.35, fill: { color: INK } });
  s.addMedia({ type: 'video', path: f('demo.mp4'), cover: 'data:image/jpeg;base64,' + require('fs').readFileSync(f('route-frame.jpg')).toString('base64'), x: 9.51, y: 0.6, w: 2.98, h: 6.45 });
  s.addNotes("TIME 1:15 to 3:15 (about 215 words). Play the clip. If the video will not play, open demo-fallback.gif from the same folder.\n\nThis is Priya. She is an example student, not a real test participant. It is her first week and she wants a hobby group. She opens MacDirect as a guest, so there is no sign-up.\n\nShe taps Societies and chooses Hobbies. She sees the A Cappella Society. She opens the card menu and taps Show on map. The map moves to 25 Wally's Walk, and the panel says the society meets here.\n\nShe taps Directions. The route is 759 metres, about a nine minute walk from the station. Priya never had to type a building name or remember where anything was. The search bar can also find societies and restaurants directly, if she prefers to search. While the clip plays, I talk through each step, so nobody is watching a silent video.\n\nNotice that this whole story needs no login. Events are different. They live in the Calendar, which needs an account, and a society leader has to post them. So today I am showing how to find a society and walk to where it meets. I am not showing a real leader posting an event, because I have not tested that with a real leader account.\n\nI also did not show the mcqAI search. It is only a stub and does not answer yet.");
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
  text(s, 'Honesty line', "I reverted the AI's colour change (85a85db). Never tested: logged-in accounts and the machine-written translations.", { x: 0.9, y: 6.1, w: 11.5, h: 1.0, color: PAPER, valign: 'middle' });
  s.addNotes("TIME 3:15 to 4:15 (about 115 words)\n\nThis slide is an audit of how I used AI, not a claim that the app is perfect.\n\nThree real bugs. I found the Calendar bug myself, because the buttons did nothing. The AI tester agent found the display name bug: the screen said Saved when the database changed nothing. A script found that the walking steps were 34 metres short of the route total.\n\nThe AI was also wrong sometimes. It built my report around lit paths, and I told it to stop. I also reverted its colour change.\n\nFor speed, I measured one Lighthouse mobile run: performance 76, and 4.5 seconds to the largest paint. The map data call took about 0.35 seconds to the first byte.\n\nWhat I never tested: logged-in accounts, and the machine-written translations.");
}

// ---- 5 Impact
{
  const s = pres.addSlide({ masterName: 'LIGHT' });
  s.addText('What exists today, and what I aim for', { placeholder: 'title' });
  box(s, 'Today card', R, { x: 0.6, y: 1.7, w: 5.9, h: 4.9, rectRadius: 0.3, fill: { color: WASH } });
  text(s, 'Today heading', 'Built and live today', { x: 0.95, y: 2.0, w: 5.2, h: 0.6, fontFace: HEAD, fontSize: 30, bold: true });
  text(s, 'Today list', bullets(['129 societies', '63 buildings, 12 languages', 'Guest mode and walking routes', 'Not yet tested with real users']), { x: 0.95, y: 2.9, w: 5.2, h: 3.4 });
  box(s, 'Targets card', R, { x: 6.83, y: 1.7, w: 5.9, h: 4.9, rectRadius: 0.3, fill: { color: INK } });
  text(s, 'Targets heading', 'Targets, not results', { x: 7.18, y: 2.0, w: 5.2, h: 0.6, fontFace: HEAD, fontSize: 30, bold: true, color: PINK });
  text(s, 'Targets list', bullets(['5 first-year students try the Priya task', 'Mobile loading under 2.5 s (4.5 s in one run today)', 'Native speakers check the translations']), { x: 7.18, y: 2.9, w: 5.2, h: 3.4, color: PAPER });
  s.addNotes("TIME 4:15 to 5:00 (about 80 words)\n\nWhat exists today is a working app with real counts. That is not the same as proven results. Nobody has tested it with real users, so I have no user numbers.\n\nThese are targets, not results. First, ask five first-year students to try the Priya task. Second, bring mobile loading under two and a half seconds. Third, ask native speakers to check the translations.\n\nThe question stays the same: can a new student find a society, join it and reach its events? Thank you.");
}

(async () => {
  const out = f('MacDirect-5-min-talk.pptx');
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log('wrote', out);
})();
