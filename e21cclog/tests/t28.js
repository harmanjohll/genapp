// t28 (V1): fewer words. Each main screen stays within a word budget at phone size; the version number shows at the
// bottom of every page, the welcome page and the console; Settings, About opens with a short signed note; on a phone,
// Settings is a list of sections, each opening on its own with a way back, while a laptop keeps the index beside one.
const fs = require('fs');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = fs.readFileSync(__dirname + '/fixtures/seed3.json', 'utf8');
const VER = fs.readFileSync(__dirname + '/../assets/core.js', 'utf8').match(/const VERSION_NO = '([^']+)'/)[1];
// the budgets: visible words in the page body at 390 by 844, with Details closed
const BUDGET = {'#/':220, '#/c':230, '#/c/critical':540, '#/settings':40, '#/settings?s=data':160, '#/settings?s=about':130, '#/sharing':70, '#/welcome':100};
(async () => {
  const browser = await launch(); const errors = [];
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const words = p => p.evaluate(() => {
    const vis = el => { const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden') return false; const det = el.closest('details:not([open])'); if (det && !el.closest('summary')) return false; return el.getClientRects().length > 0; };
    const root = document.querySelector('#main') || document.querySelector('#app'); const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n = 0;
    while (w.nextNode()){ const el = w.currentNode.parentElement; if (el && vis(el) && !el.closest('script,style,svg')) n += w.currentNode.textContent.trim().split(/\s+/).filter(Boolean).length; }
    return n;
  });
  const ctx = await browser.newContext({viewport:{width:390, height:844}}); const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
  await p.goto(BASE + 'school/beatty.json'); await p.evaluate(s => localStorage.setItem('e21cclog', s), seed);
  const counts = {};
  for (const r of Object.keys(BUDGET)){
    if (r === '#/welcome') await p.evaluate(() => localStorage.removeItem('e21cclog'));
    await p.goto('about:blank'); await p.goto(BASE + 'index.html' + r); await sleep(1000); counts[r] = await words(p);
  }
  const over = Object.entries(counts).filter(([r, n]) => n > BUDGET[r]);
  check('every main screen stays within its word budget at phone size', !over.length, JSON.stringify(counts));
  check('the welcome page shows the version', await p.evaluate(v => document.querySelector('.wcol .ver').textContent.trim() === 'E21CC Log ' + v, VER));

  // the version at the bottom of every page, and the About note
  await p.evaluate(s => localStorage.setItem('e21cclog', s), seed); await p.goto('about:blank');
  const foot = [];
  for (const r of ['#/', '#/c', '#/journal/grow', '#/settings', '#/sharing']){ await p.goto(BASE + 'index.html' + r); await sleep(700); foot.push(await p.evaluate(() => (document.querySelector('footer.footer .ver') || {}).textContent || '')); }
  check('the version shows at the bottom of every page', foot.every(t => t === 'E21CC Log ' + VER), JSON.stringify(foot));
  await p.goto(BASE + 'index.html#/settings?s=about'); await sleep(700);
  const ab = await p.evaluate(() => ({h:document.querySelector('#about h2').textContent, letter:document.querySelector('#about .letter').textContent.replace(/\s+/g, ' ').trim(), more:[...document.querySelectorAll('#about details > summary')].map(s => s.textContent)}));
  check('Settings, About opens with a short signed note, the version, and the rest under Details', /About the E21CC Log/.test(ab.h) && ab.h.includes('v' + VER) && /^Dear Beattyian,/.test(ab.letter) && /Warmly,\s*Mr Johll$/.test(ab.letter) && ab.letter.split(' ').length <= 70 && ab.more.includes('More about the Log') && ab.more.includes('What is new'), JSON.stringify(ab));
  const a1 = await axe(p); check('the About note has no serious or critical accessibility issues', !a1.length, a1.join(' | '));

  // Settings on a phone: the list, then one section with a way back
  await p.goto(BASE + 'index.html#/settings'); await sleep(700);
  const menu = await p.evaluate(() => ({links:[...document.querySelectorAll('.snav a')].filter(a => a.offsetParent).length, shown:[...document.querySelectorAll('.leaf.r > section[id]')].filter(x => !x.hidden).length}));
  check('on a phone, Settings opens as a list of sections, with none open', menu.links >= 9 && menu.shown === 0, JSON.stringify(menu));
  await p.screenshot({path:shots('t28-settings-390.png'), animations:'disabled'});
  await p.click('.snav a[href="#/settings?s=look"]'); await sleep(600);
  const one = await p.evaluate(() => ({shown:[...document.querySelectorAll('.leaf.r > section[id]')].filter(x => !x.hidden).map(x => x.id), back:!!(document.querySelector('.setback') || {}).offsetParent, list:[...document.querySelectorAll('.snav a')].filter(a => a.offsetParent).length}));
  check('a section opens on its own, with All settings to go back, and the list out of the way', one.shown.join() === 'look' && one.back && one.list === 0, JSON.stringify(one));
  await p.click('.setback'); await sleep(500);
  check('All settings goes back to the list', await p.evaluate(() => location.hash === '#/settings' && [...document.querySelectorAll('.leaf.r > section[id]')].every(x => x.hidden)));
  const a2 = await axe(p); check('the Settings list has no serious or critical accessibility issues', !a2.length, a2.join(' | '));
  // Details on Home: closed, and one tap opens it
  await p.goto(BASE + 'index.html#/'); await sleep(900);
  const det = await p.evaluate(() => { const d = document.querySelector('.nxlist details.more'); if (!d) return null; const was = d.open; d.querySelector('summary').click(); return {was, now:d.open}; });
  check('What next keeps the explanations under a closed Details that opens in one tap', det && !det.was && det.now, JSON.stringify(det));
  await ctx.close();

  // a laptop: the index beside one section, as before
  const ctxD = await browser.newContext({viewport:{width:1280, height:900}}); const d = await ctxD.newPage(); d.on('pageerror', e => errors.push(e.message));
  await d.goto(BASE + 'school/beatty.json'); await d.evaluate(s => localStorage.setItem('e21cclog', s), seed); await d.goto(BASE + 'index.html#/settings'); await sleep(900);
  const desk = await d.evaluate(() => ({links:[...document.querySelectorAll('.snav a')].filter(a => a.offsetParent).length, shown:[...document.querySelectorAll('.leaf.r > section[id]')].filter(x => !x.hidden).map(x => x.id), back:!!(document.querySelector('.setback') || {}).offsetParent}));
  check('on a laptop, Settings keeps the index beside one section, with no back link', desk.links >= 9 && desk.shown.join() === 'me' && !desk.back, JSON.stringify(desk));
  await d.goto(BASE + 'teacher.html'); await sleep(2200);
  check('the console shows the version at the bottom', await d.evaluate(v => (document.getElementById('verFoot') || {}).textContent === 'E21CC Log ' + v, VER));
  await ctxD.close();

  check('no page errors', !errors.length, errors.join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
