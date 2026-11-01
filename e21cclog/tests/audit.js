// Audit crawler: visits every route at three widths and records UI/UX defects.
// node audit.js [out.md]
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = (process.env.BASE || 'http://localhost:8123/e21cclog/');
const OUT = process.argv[2] || require('./shots.js')('audit.md');
const SEED = (() => { const d = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'fixtures', process.env.SEED || 'seed3.json'), 'utf8')); const [look, theme] = (process.env.LOOK || 'b:light').split(':'); Object.assign(d.profiles[d.current].prefs, {look, theme:theme || 'light'}); return JSON.stringify(d); })();
const VIEWS_ENV = process.env.VIEWS ? process.env.VIEWS.split(',').map(v => v.split('x').map(Number)) : null;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const VIEWS_DEFAULT = [[320, 640], [390, 844], [768, 1024], [1280, 900], [1920, 1080]];

// runs inside the page: returns a list of {kind, detail}
function probe(){
  const out = []; const add = (kind, detail) => out.push({kind, detail});
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity !== 0; };
  const desc = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); const t = (el.getAttribute('aria-label') || el.textContent || el.value || el.placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 40); return s + (t ? ` "${t}"` : ''); };
  // overflow
  const ov = document.documentElement.scrollWidth - innerWidth; if (ov > 1) add('overflow', ov + 'px sideways scroll');
  // touch targets
  const inter = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], summary, label.chip, label.sw')].filter(vis);
  for (const el of inter){
    if (el.closest('[aria-hidden=true]')) continue;
    const r = el.getBoundingClientRect();
    // inline text links inside running text are exempt (WCAG 2.5.8 inline exception)
    const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && /^(P|SMALL|LI|SPAN|EM|B|STRONG|LABEL|TD)$/.test(el.parentElement.tagName);
    if (inline) continue;
    if (el.type === 'checkbox' || el.type === 'radio'){ const lab = el.closest('label'); if (lab){ const lr = lab.getBoundingClientRect(); if (lr.height >= 44 || (lr.height >= 24 && lr.width >= 44)) continue; } }
    if (el.closest('svg.wheel')) { if (r.width < 24 && r.height < 24) add('target', desc(el) + ` ${Math.round(r.width)}x${Math.round(r.height)}`); continue; }
    if (Math.round(r.height) < 44 || Math.round(r.width) < 44) add('target', desc(el) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  // labels
  for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')){
    if (!vis(el)) continue;
    const ok = el.closest('label') || (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.title;
    if (!ok) add('label', desc(el) + ' has no label');
  }
  // icon only controls
  for (const el of inter){ const txt = (el.textContent || '').trim(); if (!txt && !el.getAttribute('aria-label') && !el.title && !['INPUT','SELECT','TEXTAREA'].includes(el.tagName) && !el.querySelector('img[alt]')) add('name', desc(el) + ' has no accessible name'); }
  // headings
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis).map(h => +h.tagName[1]);
  if (!hs.includes(1)) add('heading', 'no visible h1');
  if (hs.filter(x => x === 1).length > 1) add('heading', hs.filter(x => x === 1).length + ' h1 elements');
  for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) { add('heading', `h${hs[i - 1]} then h${hs[i]}`); break; }
  // emoji as icons or text
  const ep = /\p{Extended_Pictographic}/u;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seenE = new Set();
  while (walker.nextNode()){ const n = walker.currentNode; const p = n.parentElement; if (!p || !vis(p) || p.closest('textarea,script,style')) continue; const m = n.textContent.match(/\p{Extended_Pictographic}/gu); if (m){ const k = desc(p) + ' ' + m.join(''); if (!seenE.has(k)) { seenE.add(k); add('emoji', k); } } }
  // contrast
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return {r:v[0], g:v[1], b:v[2], a:v.length > 3 ? v[3] : 1}; };
  const lum = ({r, g, b}) => { const f = x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const blend = (fg, bg) => ({r:fg.r * fg.a + bg.r * (1 - fg.a), g:fg.g * fg.a + bg.g * (1 - fg.a), b:fg.b * fg.a + bg.b * (1 - fg.a), a:1});
  const bgOf = el => { const stack = []; let e = el; while (e){ const s = getComputedStyle(e); const c = parse(s.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; } e = e.parentElement; } let base = {r:255, g:255, b:255, a:1}; for (let i = stack.length - 1; i >= 0; i--) base = blend(stack[i], base); return base; };
  const seenC = new Set();
  for (const el of document.querySelectorAll('body *')){
    if (!vis(el) || el.closest('svg') || ['SCRIPT','STYLE','OPTION'].includes(el.tagName) || el.closest('[disabled]')) continue;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1); if (!own && !['INPUT','TEXTAREA'].includes(el.tagName)) continue;
    const s = getComputedStyle(el); const fg = parse(s.color); if (!fg) continue;
    const bg = bgOf(el); const f2 = blend({...fg, a:fg.a * (+s.opacity || 1)}, bg);
    const L1 = lum(f2), L2 = lum(bg); const ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const size = parseFloat(s.fontSize); const bold = +s.fontWeight >= 700; const large = size >= 24 || (bold && size >= 18.66);
    const need = large ? 3 : 4.5;
    if (ratio < need){ const k = desc(el).slice(0, 60) + ' ' + ratio.toFixed(2); if (!seenC.has(k)) { seenC.add(k); add('contrast', `${desc(el).slice(0, 70)} ${ratio.toFixed(2)}:1 (${s.color} on rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}), ${size}px)`); } }
    if (size < 12) add('small-text', `${desc(el).slice(0, 60)} ${size}px`);
  }
  // home control
  const home = [...document.querySelectorAll('a[href="#/"], a[href="./"], a[href="index.html"], button.homebtn')].filter(vis).find(a => /home/i.test(a.textContent + (a.getAttribute('aria-label') || '')));
  if (!home && !document.querySelector('#welcome, .welcome')) add('home', 'no visible Home control');
  return out;
}

(async () => {
  const browser = await require('./fixtures/launch.js')();
  const report = new Map(); // kind -> Map(detail -> Set(where))
  const note = (where, list) => { for (const {kind, detail} of list){ if (!report.has(kind)) report.set(kind, new Map()); const m = report.get(kind); if (!m.has(detail)) m.set(detail, new Set()); m.get(detail).add(where); } };
  const seed = JSON.parse(SEED); const prof = seed.profiles[seed.current]; const ids = prof.entries.map(e => e.id);
  for (const [w, h] of (VIEWS_ENV || VIEWS_DEFAULT)){
    const ctx = await browser.newContext({viewport:{width:w, height:h}});
    const page = await ctx.newPage(); const errs = [];
    page.on('console', m => { if (m.type() === 'error' && !/400 \(Bad Request\)/.test(m.text())) errs.push(m.text()); });
    page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    const run = async (label, fn) => { errs.length = 0; await fn(); await sleep(250); note(`${w} ${label}`, await page.evaluate(probe)); for (const e of errs) note(`${w} ${label}`, [{kind:'console', detail:e}]); };
    // fresh welcome
    await page.goto(BASE + 'index.html#/welcome'); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(300);
    // the welcome page takes the look too, when one is set before a profile exists: none is, so it shows the default
    await run('welcome', async () => {});
    // seeded
    await page.evaluate(s => localStorage.setItem('e21cclog', s), SEED); await page.goto(BASE + 'index.html#/'); await page.reload(); await sleep(400);
    const go = h => page.evaluate(x => location.hash = x, h);
    const routes = ['#/', '#/setup', '#/c', '#/c/critical', '#/c/collaboration', '#/c/selfaware', '#/journal/ask', '#/journal/grow?p=experience&v=bookmarks', '#/journal/grow?p=date&v=bookmarks', '#/journal/grow?p=competency&v=bookmarks', '#/journal/grow?p=term&v=bookmarks', '#/journal/grow?p=experience&v=shelf', '#/journal/act?p=experience&v=bookmarks', '#/journal/act?p=competency&v=shelf', '#/settings', '#/sharing', ...ids.map(i => '#/entry/' + i)];
    for (const r of routes) await run(r, () => go(r));
    // composer walk, both kinds
    for (const kind of ['grow', 'act']){
      await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); d.profiles[d.current].drafts = {}; localStorage.setItem('e21cclog', JSON.stringify(d)); });
      await page.reload(); await sleep(300); await go('#/write/' + kind); await sleep(300);
      for (let step = 0; step < 9; step++){
        await run(`#/write/${kind} step ${step}`, async () => {});
        // on the first writing step, open the help three times and audit it too
        if (step === 1){ for (let k = 0; k < 3; k++){ const sb = await page.$('[data-stuck]'); if (sb){ await sb.click(); await sleep(120); } } await run(`#/write/${kind} help`, async () => {}); const ft = await page.$('[data-ft]'); if (ft) await ft.click(); }
        if (step === 0){ const c = await page.$('.xchips .chip'); if (c) await c.click(); }
        for (const t of await page.$$('#sheet textarea')) { if (!(await t.inputValue())) await t.fill('I checked my working because the first answer looked wrong, so I tried again.'); }
        const nx = await page.$('#cNext'); if (!nx) break; await nx.click(); await sleep(200);
      }
      const c = await page.$('#cClose'); if (c) await c.click(); await sleep(200);
    }
    // teacher console
    for (const t of ['#/inbox', '#/grid', '#/students', '#/setup', '#/guide']){ await page.goto(BASE + 'teacher.html' + t); await sleep(300); await run('teacher ' + t, async () => {}); }
    await ctx.close();
  }
  await browser.close();
  let md = `# Audit, ${new Date().toISOString().slice(0, 16)}\n\n`;
  const order = ['console', 'overflow', 'home', 'contrast', 'target', 'label', 'name', 'emoji', 'heading', 'small-text'];
  let total = 0;
  for (const k of order.concat([...report.keys()].filter(k => !order.includes(k)))){ const m = report.get(k); if (!m) continue; total += m.size; md += `## ${k} (${m.size})\n`; for (const [d, wh] of m){ const list = [...wh]; md += `- ${d}  \n  ${list.slice(0, 6).join(', ')}${list.length > 6 ? ` and ${list.length - 6} more` : ''}\n`; } md += '\n'; }
  md = md.replace('\n\n', `\n\nTotal distinct findings: ${total}\n\n`);
  fs.writeFileSync(OUT, md); console.log('findings', total, '->', OUT);
  for (const k of order) if (report.get(k)) console.log(k, report.get(k).size);
})();
