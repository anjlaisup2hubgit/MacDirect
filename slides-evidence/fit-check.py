# Approximate render of the deck in Chrome to check text fit (no PowerPoint or LibreOffice here).
# Usage: python fit-check.py deck.pptx out.html
# Each text box becomes an absolutely positioned div of the same size; the page script flags any box whose text is taller than its box.
import sys, html
from pptx import Presentation
from pptx.util import Emu
from pptx.enum.shapes import MSO_SHAPE_TYPE

INK, PAPER = '#1A1220', '#FFF4EE'
prs = Presentation(sys.argv[1])
PX = 96  # css px per inch
px = lambda e: round(Emu(e).inches * PX, 2)
slides = []
for si, s in enumerate(prs.slides, 1):
    bg = INK if s.slide_layout.name.startswith('DARK') else PAPER
    out = []
    for sh in s.shapes:
        box = f'left:{px(sh.left)}px;top:{px(sh.top)}px;width:{px(sh.width)}px;height:{px(sh.height)}px;'
        if sh.shape_type == MSO_SHAPE_TYPE.PICTURE:
            out.append(f'<img src="{html.escape(sh.image.filename or "")}" style="{box}position:absolute;background:#888" data-name="{sh.name}">' if False else f'<div style="{box}position:absolute;background:#9bb" data-name="{sh.name}"></div>')
            continue
        if sh.shape_type == MSO_SHAPE_TYPE.MEDIA or 'Media' in sh.name or 'Video' in sh.name:
            out.append(f'<div style="{box}position:absolute;background:#456" data-name="{sh.name}"></div>')
            continue
        fill = ''
        try:
            if sh.fill.type == 1:
                fill = f'background:#{sh.fill.fore_color.rgb};'
        except Exception:
            pass
        rad = 'border-radius:999px;' if 'dot' in sh.name.lower() else 'border-radius:28px;' if fill else ''
        if not sh.has_text_frame or not sh.text_frame.text.strip():
            if fill: out.append(f'<div style="{box}position:absolute;{fill}{rad}" data-name="{sh.name}"></div>')
            continue
        paras = []
        for p in sh.text_frame.paragraphs:
            runs = []
            for r in p.runs:
                f = r.font
                size = f.size.pt if f.size else (46 if (si == 1 and sh.is_placeholder) else 38)
                head = (f.name == 'Fraunces') or (f.name is None and sh.is_placeholder)
                bold = f.bold if f.bold is not None else (sh.is_placeholder)
                try:
                    col = f'#{f.color.rgb}'
                except Exception:
                    col = None
                if col is None:
                    col = PAPER if (sh.is_placeholder and bg == INK) else INK
                fam = "'Fraunces',serif" if head else "'Plus Jakarta Sans',sans-serif"
                runs.append(f'<span style="font:{"700" if bold else "500"} {size}pt {fam};color:{col}">{html.escape(r.text)}</span>')
            algn = {1: 'left', 2: 'center'}.get(p.alignment, 'left')
            bullet = '• ' if '<a:buChar' in p._p.xml else ''
            paras.append(f'<p style="margin:0 0 {14 if bullet else 0}pt;line-height:1.2;text-align:{algn}">{bullet}{"".join(runs)}</p>')
        anchor = {'middle': 'center', 'ctr': 'center'}.get(str(sh.text_frame.vertical_anchor).split('.')[-1].split(' ')[0].lower(), 'flex-start')
        out.append(f'<div class="t" style="{box}position:absolute;display:flex;flex-direction:column;justify-content:{anchor};overflow:visible;{fill}{rad}" data-name="{sh.name}"><div class="in">{"".join(paras)}</div></div>')
    slides.append(f'<section style="position:relative;width:{prs.slide_width/914400*PX}px;height:{prs.slide_height/914400*PX}px;background:{bg};margin:0 0 20px 0;overflow:hidden">{"".join(out)}</section>')
page = '''<!doctype html><meta charset=utf-8>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..800&family=Plus+Jakarta+Sans:wght@500;700&display=swap">
<body style="margin:0;background:#666">''' + ''.join(slides) + '''
<script>
document.fonts.ready.then(() => { setTimeout(() => {
  const bad = [];
  document.querySelectorAll('section').forEach((sec, i) => sec.querySelectorAll('.t').forEach((t) => {
    const inn = t.querySelector('.in'); const b = t.getBoundingClientRect(), c = inn.getBoundingClientRect();
    if (c.height > b.height + 1 || c.width > b.width + 1) bad.push(`slide ${i+1} ${t.dataset.name}: text ${Math.round(c.height)}x${Math.round(c.width)}px in box ${Math.round(b.height)}x${Math.round(b.width)}px`);
  }));
  document.title = bad.length ? 'OVERFLOW: ' + bad.join(' | ') : 'ALL FIT';
  window.__done = true;
}, 800); });
</script>'''
open(sys.argv[2], 'w', encoding='utf-8').write(page)
