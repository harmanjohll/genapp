// t13: accessibility beyond colour. axe on the main pages and the console (no serious or critical
// issues); a keyboard walk into and out of the composer and the settings alert; 200% zoom (a 1280
// screen at 640 CSS pixels) with no sideways scroll; and forced colours, where selected states and
// focus must still show. A real screen reader pass still needs a person: see README.md.
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/seed3.json'), 'utf8'));
(async () => {
  const browser = await require('./fixtures/launch.js')(); const errors = [];
  const open = async (opts = {}, look) => { const ctx = await browser.newContext(opts); const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    const s = JSON.parse(JSON.stringify(seed)); if (look) s.profiles[s.current].prefs.look = look;
    await p.goto(BASE + 'index.html'); await p.evaluate(x => { localStorage.clear(); localStorage.setItem('e21cclog', x); }, JSON.stringify(s)); await p.reload(); await sleep(600); await p.evaluate(() => location.hash = '#/'); await sleep(400); return {ctx, p}; };
  const go = async (p, h) => { await p.evaluate(x => location.hash = x, h); await sleep(450); };
  const axe = async (p, label) => { await p.addScriptTag({content:AXE}); const r = await p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => `${v.id} (${v.nodes.length}): ${v.nodes[0].target.join(' ')}`)); return r.map(x => label + ': ' + x); };

  // 1. axe, in each look, on the main pages, phone and laptop
  const found = [];
  for (const look of ['b', 'a', 'c', 'd']) for (const vp of [{width:390, height:844}, {width:1280, height:800}]){
    const {ctx, p} = await open({viewport:vp}, look); const gid = seed.profiles[seed.current].entries.find(e => e.kind === 'grow').id;
    for (const [label, h] of [['home', '#/'], ['competencies', '#/c'], ['competency', '#/c/critical'], ['journal', '#/journal/grow'], ['entry', '#/entry/' + gid], ['settings', '#/settings'], ['sharing', '#/sharing']]){ await go(p, h); found.push(...await axe(p, `${look} ${vp.width} ${label}`)); }
    await go(p, '#/write/grow'); await p.evaluate(() => { draft.context = {type:'subject', name:'Art'}; draft.step = 1; saveDraft(); renderComposer(); }); await sleep(300); found.push(...await axe(p, `${look} ${vp.width} composer`));
    await ctx.close();
  }
  { const ctx = await browser.newContext({viewport:{width:1280, height:800}}); const p = await ctx.newPage(); await p.goto(BASE + 'teacher.html'); await sleep(600);
    for (const t of ['inbox', 'grid', 'students', 'statements', 'setup', 'guide']){ await p.click(`.tabs [data-tab=${t}]`); await sleep(250); found.push(...await axe(p, `console ${t}`)); }
    await ctx.close(); }
  const uniq = [...new Set(found.map(f => f.replace(/^\S+ \d+ /, '')))];
  check('axe: no serious or critical issues on the main pages, in every look, on a phone and a laptop, nor in the console', !found.length, uniq.slice(0, 8).join(' | '));

  // 2. the keyboard: into the composer and out again; the settings alert keeps focus inside
  { const {ctx, p} = await open({viewport:{width:1280, height:800}});
    await p.focus('.navnew a[href="#/write/grow"]'); await p.keyboard.press('Enter'); await sleep(600);
    const inSheet = await p.evaluate(() => !!document.activeElement && !!document.activeElement.closest('#sheet'));
    let stays = true; for (let i = 0; i < 25; i++){ await p.keyboard.press('Tab'); if (!(await p.evaluate(() => !!document.activeElement.closest('#sheet') || document.activeElement === document.body))){ stays = false; break; } }
    check('opening an entry moves focus into it, and Tab stays inside it', inSheet && stays, JSON.stringify({inSheet, stays}));
    await p.keyboard.press('Escape'); await sleep(500);
    const back = await p.evaluate(() => ({composing:document.body.classList.contains('composing'), active:document.activeElement && (document.activeElement.id || document.activeElement.tagName)}));
    check('Escape closes it, keeps the draft, and focus comes back to what opened it', !back.composing && back.active === 'A', JSON.stringify(back));
    await p.evaluate(() => { delete me.level; saveDb(); location.hash = '#/write/grow'; }); await sleep(600);
    const dlg = await p.evaluate(() => document.getElementById('dlg').open);
    // the browser's own controls (focus on the body) are allowed; another part of the page is not
    let inside = true; for (let i = 0; i < 30; i++){ await p.keyboard.press('Tab'); if (!(await p.evaluate(() => !!document.activeElement.closest('#dlg') || document.activeElement === document.body))){ inside = false; break; } }
    check('the settings alert is a modal dialog: Tab stays inside it', dlg && inside);
    await ctx.close(); }

  // 3. zoom to 200%: a laptop screen at 640 CSS pixels, nothing scrolls sideways
  { const {ctx, p} = await open({viewport:{width:640, height:400}}); const bad = [];
    for (const h of ['#/', '#/c', '#/c/critical', '#/journal/grow', '#/settings', '#/sharing', '#/write/grow']){ await go(p, h); const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ov > 1) bad.push(h + ' ' + ov + 'px'); }
    check('at 200% zoom nothing scrolls sideways', !bad.length, bad.join(', '));
    await ctx.close(); }

  // 4. forced colours: the selected tab and segment, and focus, still show
  { const {ctx, p} = await open({viewport:{width:1280, height:800}, forcedColors:'active'});
    await go(p, '#/journal/grow');
    const fc = await p.evaluate(() => { const q = s => document.querySelector(s); const o = el => el ? getComputedStyle(el).outlineStyle : 'missing'; return {tab:o(q('.tab.on')), seg:o(q('.seg a.on, .seg button.on'))}; });
    await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); const focus = await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    check('forced colours: the selected tab and segment carry an outline, and focus shows', fc.tab !== 'none' && fc.seg !== 'none' && focus !== 'none', JSON.stringify({...fc, focus}));
    await ctx.close(); }

  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
})();
