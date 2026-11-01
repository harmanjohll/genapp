// tsweep: the teacher console, every tab, at a phone and a laptop width, with the same checks as
// sweep.js (resting contrast, forced hover and focus, selected states, field edges, meters).
const { chromium } = require('playwright');
const fs = require('fs');
const { install, forced, note, writeReport } = require('./sweep.js');
const BASE = (process.env.BASE || 'http://localhost:8123/e21cclog/');
const OUT = process.argv[2] || require('./shots.js')('tsweep.md');
const seed = JSON.parse(fs.readFileSync(__dirname + '/fixtures/seed3.json', 'utf8')); const P = seed.profiles[seed.current];
P.email = 'wei_ling_tan@students.edu.sg'; P.prefs.look = 'b';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await require('./fixtures/launch.js')();
  // a share link from the student: entries and a domain
  const sp = await (await browser.newContext()).newPage();
  await sp.goto(BASE + 'index.html#/'); await sp.evaluate(s => localStorage.setItem('e21cclog', s), JSON.stringify(seed)); await sp.reload(); await sleep(400); await sp.evaluate(() => location.hash = '#/'); await sleep(400);
  const link = await sp.evaluate(async () => consoleUrl() + '#/in?p=' + await packCDL('i', {v:1, from:await senderInfo(), items:[...me.entries.slice(0, 4).map(e => ({t:'e', e:compactEntry(e)})), {t:'b', b:basketSnapshot('cait')}, {t:'b', b:basketSnapshot('cci')}]}));
  for (const [w, h] of [[390, 844], [1280, 800]]){
    const ctx = await browser.newContext({viewport:{width:w, height:h}}); await ctx.addInitScript(install);
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(BASE + 'teacher.html'); await page.evaluate(() => localStorage.removeItem('e21cclog.teacher'));
    await page.goto(link.replace(/^.*teacher\.html/, BASE + 'teacher.html')); await sleep(900);
    const cdp = await ctx.newCDPSession(page); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const nostyle = () => page.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});
    const run = async label => { await nostyle(); await sleep(150); note(`console ${w} ${label}`, await page.evaluate(() => window.__A.rest())); await forced(page, cdp, `console ${w} ${label}`); };
    await run('inbox, an item open');
    for (const t of ['grid', 'students', 'statements', 'setup', 'guide']){ await page.click(`.tabs [data-tab=${t}]`); await sleep(350); await run(t); }
    await page.click('.tabs [data-tab=students]'); await sleep(300); const sc = await page.$('.scard'); if (sc){ await sc.click(); await sleep(300); await run('students, one open'); }
    if (errs.length) note(`console ${w}`, errs.map(e => ({kind:'page-error', detail:e})));
    await ctx.close();
  }
  await browser.close();
  console.log('findings', writeReport(OUT, 'Teacher console sweep'), '->', OUT);
})();
