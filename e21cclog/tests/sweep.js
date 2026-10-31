// sweep: every look x theme x colour, at a phone and a laptop width, on the routes that carry
// colour. For each page: text contrast at rest; text contrast with :hover and with :focus-visible
// forced on every control (CDP); SVG text (wheel, rings) against what is drawn under it; the
// selected state against its surroundings (3:1); the focus ring against its surroundings (3:1);
// form field edges (3:1); meters and bars (3:1); sideways scroll.
// LOOKS=a,b THEMES=light COLOURS=navy VIEWS=390x844,1280x800 node sweep.js out.md
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const OUT = process.argv[2] || require('./shots.js')('sweep.md');
const LOOKS = (process.env.LOOKS || 'a,b,c,d').split(',');
const THEMES = (process.env.THEMES || 'light,dark').split(',');
const COLOURS = (process.env.COLOURS || 'navy,forest,plum,crimson,teal,ochre').split(',');
const VIEWS = (process.env.VIEWS || '390x844,1280x800').split(',').map(v => v.split('x').map(Number));
const seed0 = JSON.parse(fs.readFileSync(__dirname + '/fixtures/seed3.json', 'utf8'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

// installed in every page before its scripts run
function install(){
  window.__A = (() => {
    const parse = c => { if (!c) return null; const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return {r:v[0], g:v[1], b:v[2], a:v.length > 3 ? v[3] : 1}; };
    const lum = ({r, g, b}) => { const f = x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const blend = (fg, bg) => ({r:fg.r * fg.a + bg.r * (1 - fg.a), g:fg.g * fg.a + bg.g * (1 - fg.a), b:fg.b * fg.a + bg.b * (1 - fg.a), a:1});
    const ratio = (a, b) => { const L1 = lum(a), L2 = lum(b); return (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05); };
    const rgb = c => `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`;
    const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity !== 0; };
    const desc = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); const t = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28); return s + (t ? ` "${t}"` : ''); };
    // the colour behind an element: its own background, then its ancestors', blended; the page body last
    const bgOf = (el, skipSelf) => { const stack = []; let e = skipSelf ? el.parentElement : el; while (e){ const s = getComputedStyle(e); const c = parse(s.backgroundColor); if (c && c.a > 0){ stack.push(c); if (c.a >= 1) break; } e = e.parentElement; } let base = {r:255, g:255, b:255, a:1}; for (let i = stack.length - 1; i >= 0; i--) base = blend(stack[i], base); return base; };
    const opacityOf = el => { let o = 1, e = el; while (e && e !== document.documentElement){ o *= +getComputedStyle(e).opacity || 1; e = e.parentElement; } return o; };
    // text an element shows itself, with its contrast
    const textCheck = (el, tag) => {
      const out = [];
      for (const t of [el, ...el.querySelectorAll('*')]){
        if (!vis(t) || t.closest('svg') || ['SCRIPT', 'STYLE', 'OPTION'].includes(t.tagName)) continue;
        const own = [...t.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1); if (!own && !['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) continue;
        const s = getComputedStyle(t); const fg = parse(s.color); if (!fg) continue;
        const bg = bgOf(t); const f2 = blend({...fg, a:fg.a * opacityOf(t)}, bg); const r = ratio(f2, bg);
        const size = parseFloat(s.fontSize); const bold = +s.fontWeight >= 700; const large = size >= 24 || (bold && size >= 18.66);
        const need = t.closest('[disabled]') ? 0 : large ? 3 : 4.5;
        if (r < need) out.push({kind:tag, detail:`${desc(t).slice(0, 70)} ${r.toFixed(2)}:1 (${rgb(f2)} on ${rgb(bg)})`});
      }
      return out;
    };
    const interactive = () => [...document.querySelectorAll('a[href], button, summary, [role=button], label.chip, select, input:not([type=hidden]), textarea, .tab, .seg button, .seg a')].filter(el => vis(el) && !el.closest('[aria-hidden=true]') && !el.closest('svg'));
    // a filled SVG shape's colour, over what is under it
    const shapeFill = (sh, under) => { const s = getComputedStyle(sh);
      if (!s.fill || s.fill === 'none'){ const k = parse(s.stroke); if (!k || s.stroke === 'none') return {c:under, pattern:false}; const a = k.a * (+s.strokeOpacity || 1) * (+s.opacity || 1); return {c:blend({...k, a}, under), pattern:false}; } if (/url\(/.test(s.fill)) return {c:under, pattern:true}; const f = parse(s.fill); if (!f) return {c:under, pattern:false}; const a = f.a * (+s.fillOpacity || 1) * (+s.opacity || 1); return {c:blend({...f, a}, under), pattern:false}; };
    return {
      rest(){
        const out = [];
        const ov = document.documentElement.scrollWidth - innerWidth; if (ov > 1) out.push({kind:'overflow', detail:ov + 'px sideways scroll'});
        out.push(...textCheck(document.body, 'contrast'));
        // SVG text: the wheel, the core, the rings
        for (const t of document.querySelectorAll('svg text')){
          if (!vis(t)) continue; const dlg = document.querySelector('dialog[open]'); if (dlg && !dlg.contains(t)) continue; const r = t.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2;
          const stack = document.elementsFromPoint(x, y).filter(e => e instanceof SVGGeometryElement && e.ownerSVGElement === t.ownerSVGElement && e !== t);
          let under = bgOf(t.ownerSVGElement); let pattern = false;
          for (const sh of stack.reverse()){ const f = shapeFill(sh, under); under = f.c; pattern = pattern || f.pattern; }
          const fg = parse(getComputedStyle(t).fill); if (!fg) continue;
          const fsz = r.height; const bold = +getComputedStyle(t).fontWeight >= 700; const need = (fsz >= 24 || (bold && fsz >= 18.66)) ? 3 : 4.5;
          let worst = ratio(blend(fg, under), under);
          // hatching: also against the hatch line colour laid over the background
          if (pattern){ const ln = t.ownerSVGElement.querySelector('pattern line'); const lc = ln && parse(getComputedStyle(ln).stroke); if (lc){ const la = +(ln.getAttribute('stroke-opacity') || 1); worst = Math.min(worst, ratio(fg, blend({...lc, a:la}, under))); } }
          if (worst < need) out.push({kind:'svg-text', detail:`${(t.textContent || '').trim().slice(0, 24)} ${worst.toFixed(2)}:1 (${rgb(fg)} on ${rgb(under)}${pattern ? ', hatched' : ''}) in ${desc(t.ownerSVGElement).slice(0, 30)}`});
        }
        // selected states stand out from what is around them (3:1)
        for (const el of document.querySelectorAll('.on, [aria-pressed=true], [aria-current], [aria-selected=true], .sel')){
          if (!vis(el) || el.closest('svg') || el.tagName === 'I' || el.matches('.qinfo, .meter i, .depth i, .track i')) continue;
          const s = getComputedStyle(el); const around = bgOf(el, true); const cands = [];
          const bg = parse(s.backgroundColor); if (bg && bg.a > 0) cands.push(['fill', blend(bg, around)]);
          for (const side of ['Top', 'Right', 'Bottom', 'Left']) if (parseFloat(s['border' + side + 'Width']) >= 2){ const bc = parse(s['border' + side + 'Color']); if (bc) cands.push(['border', blend(bc, around)]); }
          if (s.boxShadow && s.boxShadow !== 'none'){ for (const m of s.boxShadow.matchAll(/rgba?\([^)]+\)/g)){ const c = parse(m[0]); if (c && c.a > .3) cands.push(['shadow', blend(c, around)]); } }
          if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0){ const c = parse(s.outlineColor); if (c) cands.push(['outline', blend(c, around)]); }
          // a tab may mark its state on its icon pill
          const ti = el.querySelector(':scope > .ti'); if (ti){ const ts = getComputedStyle(ti); const tb = parse(ts.backgroundColor); if (tb && tb.a > 0) cands.push(['pill', blend(tb, around)]); for (const m of String(ts.boxShadow).matchAll(/rgba?\([^)]+\)/g)){ const c = parse(m[0]); if (c && c.a > .3) cands.push(['pill edge', blend(c, around)]); } }
          // a check mark inside also tells the state
          if (el.querySelector('svg') && /check/.test(el.innerHTML)) continue;
          const best = cands.reduce((m, [k, c]) => Math.max(m, ratio(c, around)), 1);
          // a text change (weight, colour) alone is not a state; a fill, border, line or outline is
          if (best < 3) out.push({kind:'state', detail:`${desc(el).slice(0, 60)} selected marker ${best.toFixed(2)}:1 against ${rgb(around)}`});
        }
        // form fields: an edge or a fill that stands out (3:1)
        for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')){
          if (!vis(el)) continue; const s = getComputedStyle(el); const around = bgOf(el, true);
          const bc = parse(s.borderTopColor); const fill = parse(s.backgroundColor);
          const best = Math.max(bc && parseFloat(s.borderTopWidth) > 0 ? ratio(blend(bc, around), around) : 1, fill ? ratio(blend(fill, around), around) : 1);
          if (best < 3) out.push({kind:'field-edge', detail:`${desc(el).slice(0, 60)} edge ${best.toFixed(2)}:1 against ${rgb(around)}`});
        }
        // meters and progress bars: the filled part against the track and the card (3:1)
        for (const el of document.querySelectorAll('.meter i.on, .pbar i, .depth i.on, .track i.on')){
          if (!vis(el)) continue; const on = parse(getComputedStyle(el).backgroundColor); const track = bgOf(el, true); const card = bgOf(el.parentElement, true);
          if (!on) continue; const r = Math.max(ratio(blend(on, track), track), 0); const rc = ratio(blend(on, card), card);
          if (Math.min(r, rc) < 3) out.push({kind:'meter', detail:`${desc(el.parentElement).slice(0, 40)} filled ${rgb(on)}: ${r.toFixed(2)}:1 on its track ${rgb(track)}, ${rc.toFixed(2)}:1 on the card ${rgb(card)}`});
        }
        return out;
      },
      controls(){ const els = interactive(); els.forEach((e, i) => e.setAttribute('data-sw', i)); return els.length; },
      textOf(i, tag){ const el = document.querySelector(`[data-sw="${i}"]`); return el ? textCheck(el, tag) : []; },
      // a visible focus indicator: an outline, a box shadow or a border change, 3:1 against its surroundings
      focusOf(i, restShadow, restBorder){ const el = document.querySelector(`[data-sw="${i}"]`); if (!el) return [];
        const s = getComputedStyle(el); const around = bgOf(el, true); const cands = [];
        if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0){ const c = parse(s.outlineColor); if (c) cands.push(ratio(blend(c, around), around)); }
        if (s.boxShadow !== restShadow){ for (const m of String(s.boxShadow).matchAll(/rgba?\([^)]+\)/g)){ const c = parse(m[0]); if (c) cands.push(ratio(blend(c, around), around)); } }
        if (s.borderTopColor !== restBorder){ const c = parse(s.borderTopColor); if (c) cands.push(ratio(blend(c, around), around)); }
        const best = cands.length ? Math.max(...cands) : 0;
        return best < 3 ? [{kind:'focus-ring', detail:`${desc(el).slice(0, 60)} ${cands.length ? best.toFixed(2) + ':1 against ' + rgb(around) : 'no visible focus indicator'}`}] : [];
      },
      restOf(i){ const el = document.querySelector(`[data-sw="${i}"]`); if (!el) return {}; const s = getComputedStyle(el); return {shadow:s.boxShadow, border:s.borderTopColor}; }
    };
  })();
}

const report = new Map(); // kind -> detail -> Set(where)
const note = (where, list) => { for (const {kind, detail} of list){ if (!report.has(kind)) report.set(kind, new Map()); const m = report.get(kind); if (!m.has(detail)) m.set(detail, new Set()); m.get(detail).add(where); } };

async function forced(page, cdp, where){
  const n = await page.evaluate(() => window.__A.controls());
  const {root} = await cdp.send('DOM.getDocument', {depth:0});
  for (let i = 0; i < n; i++){
    const {nodeId} = await cdp.send('DOM.querySelector', {nodeId:root.nodeId, selector:`[data-sw="${i}"]`}); if (!nodeId) continue;
    // nothing focused at rest, so the focus style is compared with the real resting style
    const rest = await page.evaluate(i => { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); return window.__A.restOf(i); }, i);
    await cdp.send('CSS.forcePseudoState', {nodeId, forcedPseudoClasses:['hover']});
    note(where + ' :hover', await page.evaluate(i => window.__A.textOf(i, 'hover-contrast'), i));
    await cdp.send('CSS.forcePseudoState', {nodeId, forcedPseudoClasses:['focus', 'focus-visible']});
    note(where + ' :focus', await page.evaluate(i => window.__A.textOf(i, 'focus-contrast'), i));
    note(where + ' :focus', await page.evaluate(([i, r]) => window.__A.focusOf(i, r.shadow, r.border), [i, rest]));
    await cdp.send('CSS.forcePseudoState', {nodeId, forcedPseudoClasses:[]});
  }
}

function writeReport(out, head){
  let md = `# ${head}, ${new Date().toISOString().slice(0, 16)}\n\n`; let total = 0; let body = '';
  for (const [kind, m] of report){ body += `## ${kind} (${m.size})\n`; for (const [d, where] of m){ total++; const ws = [...where]; body += `- ${d}\n  ${ws.slice(0, 6).join(' | ')}${ws.length > 6 ? ` | and ${ws.length - 6} more` : ''}\n`; } body += '\n'; }
  fs.writeFileSync(out, md + `Total distinct findings: ${total}\n\n` + body); return total;
}
module.exports = {install, forced, note, report, writeReport};
if (require.main === module) (async () => {
  const browser = await chromium.launch();
  const started = Date.now(); let pages = 0;
  for (const look of LOOKS) for (const theme of THEMES) for (const colour of COLOURS) for (const [w, h] of VIEWS){
    const seed = JSON.parse(JSON.stringify(seed0)); const P = seed.profiles[seed.current]; Object.assign(P.prefs, {look, theme, colour}); P.drafts = {};
    const gid = P.entries.find(e => e.kind === 'grow').id;
    const ctx = await browser.newContext({viewport:{width:w, height:h}}); await ctx.addInitScript(install);
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(BASE + 'index.html#/'); await page.evaluate(s => { localStorage.clear(); localStorage.setItem('e21cclog', s); }, JSON.stringify(seed)); await page.reload(); await sleep(300);
    await page.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});
    const cdp = await ctx.newCDPSession(page); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const tag = `${look}:${theme}:${colour} ${w}`;
    const visit = async (label, fn) => {
      await fn(); await sleep(250);
      await page.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});
      note(`${tag} ${label}`, await page.evaluate(() => window.__A.rest()));
      await forced(page, cdp, `${tag} ${label}`); pages++;
    };
    const go = h => page.evaluate(x => { location.hash = x; }, h);
    const step = (kind, n, extra) => page.evaluate(([k, n, x]) => { location.hash = '#/write/' + k; setTimeout(() => { draft.context = {type:'subject', name:'Chemistry'}; draft.step = n; if (x) Object.assign(draft, x); saveDraft(); renderComposer(); }, 150); }, [kind, n, extra || null]);
    await visit('home', () => go('#/'));
    if (w < 700) await visit('home tapped', async () => { await go('#/'); await sleep(250); await page.evaluate(() => { const a = document.querySelector('.wheel a.seg[data-comp="critical"]'); a.dispatchEvent(new PointerEvent('pointerenter', {pointerType:'mouse'})); }); });
    await visit('competencies', () => go('#/c'));
    await visit('competency', () => go('#/c/critical'));
    await visit('grow journal', () => go('#/journal/grow'));
    await visit('act journal', () => go('#/journal/act?v=shelf'));
    await visit('entry', () => go('#/entry/' + gid));
    for (const sct of (w < 700 ? [''] : ['me', 'look', 'coach', 'expCard', 'groups', 'data'])) await visit('settings ' + sct, () => go('#/settings' + (sct ? '?s=' + sct : '')));
    await visit('sharing', () => go('#/sharing'));
    await visit('composer context', () => step('grow', 0));
    await visit('composer G with help', async () => { await step('grow', 1); await sleep(300); await page.evaluate(() => { const b = document.querySelector('[data-qinfo="g1"]'); if (b) b.click(); const s = document.querySelector('[data-stuck="g2"]'); if (s) s.click(); }); });
    await visit('composer W with aim', async () => { await step('grow', 4); await sleep(300); await page.evaluate(() => { const s = document.querySelector('[name=aimComp]'); if (s){ s.value = 'critical'; s.dispatchEvent(new Event('change')); } }); });
    await visit('composer claim', () => step('grow', 5, {answers:{g1:'I compared two methods because the first one failed, and I chose the faster one.'}}));
    await visit('composer read back', () => step('grow', 6, {answers:{g1:'I compared two methods because the first one failed, and I chose the faster one.'}}));
    await visit('act T', () => step('act', 3));
    await page.evaluate(() => { closeComposer(); draft = null; me.drafts = {}; saveDb(); });
    await visit('look across', () => go('#/across/cait'));
    await page.evaluate(() => { closeComposer(); draft = null; me.drafts = {}; saveDb(); });
    await visit('alert', async () => { await page.evaluate(() => { delete me.level; saveDb(); location.hash = '#/write/grow'; }); });
    await page.evaluate(() => { closeDialog(); me.level = 2; saveDb(); });
    await visit('welcome', () => go('#/welcome'));
    if (errs.length) note(tag, errs.map(e => ({kind:'page-error', detail:e})));
    await ctx.close();
    process.stdout.write(`. ${tag} (${pages} pages, ${Math.round((Date.now() - started) / 1000)}s)\n`);
  }
  await browser.close();
  let md = `# Colour and state sweep, ${new Date().toISOString().slice(0, 16)}\n\nLooks ${LOOKS.join(',')}; themes ${THEMES.join(',')}; colours ${COLOURS.join(',')}; sizes ${VIEWS.map(v => v.join('x')).join(', ')}; ${pages} pages.\n\n`;
  let total = 0;
  for (const [kind, m] of report){ md += `## ${kind} (${m.size})\n`; for (const [d, where] of m){ total++; const ws = [...where]; md += `- ${d}\n  ${ws.slice(0, 6).join(' | ')}${ws.length > 6 ? ` | and ${ws.length - 6} more` : ''}\n`; } md += '\n'; }
  md = md.replace('\n\n', `\n\nTotal distinct findings: ${total}\n\n`);
  fs.writeFileSync(OUT, md); console.log('findings', total, '->', OUT);
})();
