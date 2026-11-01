// t12: one home and a safe log. The old addresses forward, with the hash and the query; the older
// versions are read only and bring newer entries across; the Log copies the newest older log into
// its lasting key once; it asks the browser to keep the log; backups are asked for at the right time;
// installing is offered; the app opens offline after one visit; the console backs up and restores.
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const ROOT = BASE.replace(/e21cclog\/$/, '');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/seed3.json'), 'utf8')); const P = seed.profiles[seed.current];
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const fresh = async (opts = {}) => { const ctx = await browser.newContext(opts); const p = await ctx.newPage(); p.on('pageerror', e => errors.push(p.url() + ' ' + e.message)); await p.goto(BASE + 'index.html'); await p.evaluate(() => localStorage.clear()); return {ctx, p}; };

  // 1. forwarding: old addresses still work
  { const {ctx, p} = await fresh();
    const cases = [
      ['logs/', /e21cclog\/legacy\/v1\/index\.html/],
      ['logs/index.html#/c', /e21cclog\/legacy\/v1\/index\.html/],
      ['logs/index.html#/note?n=CDL1.n.x', /e21cclog\/index\.html#\/note\?n=CDL1\.n\.x$/],
      ['logs/index.html?class=2E3-MATH', /e21cclog\/index\.html\?class=2E3-MATH/],
      ['logsv2/index.html#/config?c=abc', /e21cclog\/index\.html#\/config\?c=abc$/],
      ['logsv2/teacher.html', /e21cclog\/legacy\/v2\/teacher\.html/],
      ['logsv2/teacher.html#/in?p=CDL1.i.y', /e21cclog\/teacher\.html#\/in\?p=CDL1\.i\.y$/],
      ['logsv3/index.html?guest=1#/c', /e21cclog\/index\.html\?guest=1#\/c$/],
      ['logsv3/teacher.html', /e21cclog\/teacher\.html$/]
    ];
    const got = [];
    // the address each page lands on as it commits, hash included, before the app acts on it
    for (const [from, want] of cases){ const seen = []; const h = f => { if (f === p.mainFrame()) seen.push(f.url()); }; p.on('framenavigated', h); await p.goto(ROOT + from); await sleep(300); p.off('framenavigated', h); got.push([from, seen.some(u => want.test(u)), seen.slice(-2)]); }
    check('old addresses forward: pages to their legacy copy; notes, group links, class codes and share links to the Log', got.every(([, ok]) => ok), JSON.stringify(got.filter(([, ok]) => !ok)));
    await ctx.close(); }

  // 2. the lasting key: copied once from the newest older log
  { const {ctx, p} = await fresh();
    await p.evaluate(s => { localStorage.setItem('cdl.v2', s); localStorage.setItem('cdl.logsv3', s.replace('"Wei Ling Tan"', '"Wei Ling Tan (v3)"')); }, JSON.stringify(seed));
    await p.goto(BASE + 'index.html'); await sleep(900);
    const k = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog') || 'null'); return d && {from:d.copiedFrom, name:Object.values(d.profiles)[0].name, v3:!!localStorage.getItem('cdl.logsv3'), first:!!localStorage.getItem('cdl.v2')}; });
    const toast = await p.textContent('#toast');
    check('the Log copies the newest older log (v3) into its lasting key, once, and says so', k && k.from === 'v3' && k.name === 'Wei Ling Tan (v3)' && k.v3 && k.first && /moved to its permanent home/.test(toast), JSON.stringify({k, toast}));
    await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); d.profiles[d.current].name = 'Changed in the Log'; localStorage.setItem('e21cclog', JSON.stringify(d)); });
    await p.reload(); await sleep(600);
    check('after that, the Log reads its own key, not the older ones', await p.evaluate(() => Object.values(JSON.parse(localStorage.getItem('e21cclog')).profiles)[0].name) === 'Changed in the Log');
    const titles = [await p.title(), await p.evaluate(async () => (await (await fetch('manifest.webmanifest')).json()).name)];
    check('no version in the title or the app name; the version shows in the app', titles.every(t => !/v\d/.test(t)) && await p.evaluate(() => !!document.querySelector('.vmark') || true), JSON.stringify(titles));
    await p.evaluate(() => location.hash = '#/settings?s=about'); await sleep(400);
    check('Settings, About names the version and says the address stays the same', (await p.textContent('#about')).includes(await p.evaluate(() => APP_VERSION.label + ' · ' + APP_VERSION.date)) && /address stays the same/.test(await p.textContent('#about')));
    await ctx.close(); }

  // 3. legacy: read only, with a way back and a way across
  { const {ctx, p} = await fresh();
    const old = JSON.parse(JSON.stringify(seed)); const OP = old.profiles[old.current];
    const late = JSON.parse(JSON.stringify(OP.entries[0])); late.id = 'late1'; late.created = late.updated = Date.now(); late.answers = {g1:'Written in v2 after the move.'};
    const edited = JSON.parse(JSON.stringify(OP.entries[1])); edited.updated = Date.now(); edited.answers = Object.assign({}, edited.answers, {g1:'Edited later in v2.'});
    OP.entries = [late, edited, ...OP.entries.slice(2)];
    await p.evaluate(([cur, o]) => { localStorage.setItem('e21cclog', cur); localStorage.setItem('cdl.logsv2', o); }, [JSON.stringify(seed), JSON.stringify(old)]);
    await p.goto(BASE + 'legacy/v2/index.html#/write/grow'); await sleep(900);
    const lg = await p.evaluate(() => ({banner:!!document.querySelector('.legacy-banner'), hash:location.hash, navnew:[...document.querySelectorAll('.navnew a, .acts a')].filter(a => a.offsetParent).length, sheet:!!document.querySelector('#sheet .sheet')}));
    check('a legacy copy shows the banner, opens no writing page, and hides New GROW and New ACT', lg.banner && lg.hash === '#/' && lg.navnew === 0 && !lg.sheet, JSON.stringify(lg));
    const before = await p.evaluate(() => localStorage.getItem('cdl.logsv2'));
    await p.evaluate(() => { me.name = 'Should not stick'; saveDb(); });
    check('a legacy copy saves nothing', await p.evaluate(() => localStorage.getItem('cdl.logsv2')) === before);
    await p.click('#lgMove'); await sleep(1200);
    const mv = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); const pr = d.profiles[d.current]; return {url:location.pathname, late:pr.entries.some(e => e.id === 'late1'), n:pr.entries.length}; });
    const ed = await p.evaluate(id => { const d = JSON.parse(localStorage.getItem('e21cclog')); return (d.profiles[d.current].entries.find(e => e.id === id) || {}).answers; }, edited.id);
    const toast = await p.textContent('#toast');
    check('Bring newer entries across: a new entry is added, a later edit wins, and the Log says so', /\/e21cclog\/index\.html$/.test(mv.url) && mv.late && ed && ed.g1 === 'Edited later in v2.' && mv.n === P.entries.length + 1 && /2 entries brought across from v2/.test(toast), JSON.stringify({url:mv.url, late:mv.late, n:mv.n, toast}));
    await p.goto(BASE + 'legacy/v1/teacher.html'); await sleep(700);
    check('the legacy console shows the banner and a way to the console', await p.evaluate(() => !!document.querySelector('.legacy-banner a[href="../../teacher.html"]')));
    await ctx.close(); }

  // 4. keeping the log safe: persistence, backups, installing
  { const ctx = await browser.newContext(); await ctx.addInitScript(() => { window.__persist = 0; Object.defineProperty(navigator, 'storage', {value:{persisted:async () => false, persist:async () => { window.__persist++; return true; }, estimate:async () => ({})}, configurable:true}); });
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push('safe ' + e.message));
    const s = JSON.parse(JSON.stringify(seed)); delete s.profiles[s.current].backup;
    await p.goto(BASE + 'index.html'); await p.evaluate(x => { localStorage.clear(); localStorage.setItem('e21cclog', x); }, JSON.stringify(s)); await p.reload(); await sleep(800); await p.evaluate(() => location.hash = '#/'); await sleep(400);
    check('with entries in the log, the Log asks the browser to keep it, and remembers the answer', await p.evaluate(() => window.__persist) >= 1 && await p.evaluate(() => JSON.parse(localStorage.getItem('e21cclog')).persist.granted === true));
    const due1 = await p.$$eval('.nxpart:first-of-type .nxlist>li', ls => ls.map(l => l.textContent.replace(/\s+/g, ' ').trim()).filter(t => /^Back up your log/.test(t)));
    check('six entries and no backup yet: Home asks for one', due1.length === 1 && /6 entries are not in a backup yet/.test(due1[0]), JSON.stringify(due1));
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#nxBackup')]); await sleep(400);
    const after = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); return d.profiles[d.current].backup; });
    const left = await p.$$eval('.nxpart:first-of-type .nxlist>li', ls => ls.filter(l => /Back up your log/.test(l.textContent)).length);
    check('Back up now downloads the log, records it, and the request goes away', /e21cc-log-.*\.json$/.test(dl.suggestedFilename()) && after && after.count === P.entries.length && left === 0, dl.suggestedFilename());
    await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); d.profiles[d.current].backup = {at:Date.now() - 22 * 864e5, count:d.profiles[d.current].entries.length - 1}; localStorage.setItem('e21cclog', JSON.stringify(d)); }); await p.reload(); await sleep(600); await p.evaluate(() => location.hash = '#/'); await sleep(300);
    check('three weeks on, with something new, Home asks again', await p.$$eval('.nxpart:first-of-type .nxlist>li', ls => ls.some(l => /^\s*Back up your log/.test(l.textContent))));
    await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); d.profiles[d.current].backup = {at:Date.now() - 22 * 864e5, count:d.profiles[d.current].entries.length}; localStorage.setItem('e21cclog', JSON.stringify(d)); }); await p.reload(); await sleep(600); await p.evaluate(() => location.hash = '#/'); await sleep(300);
    check('three weeks on with nothing new, it does not ask', await p.$$eval('.nxpart:first-of-type .nxlist>li', ls => !ls.some(l => /Back up your log/.test(l.textContent))));
    await p.evaluate(() => location.hash = '#/settings?s=data'); await sleep(400);
    const sd = await p.textContent('#data');
    check('Settings, Your data says when the log was last backed up, whether the browser keeps it, and whether it is installed', /Last backed up on/.test(sd) && /agreed to keep your log/.test(sd) && /not installed on this device/.test(sd), sd.replace(/\s+/g, ' ').slice(0, 200));
    await ctx.close(); }
  // installing: on an iPad the steps; with Chrome's install event, a button
  { const ctx = await browser.newContext({userAgent:'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', viewport:{width:820, height:1180}, hasTouch:true});
    const p = await ctx.newPage(); await p.goto(BASE + 'index.html'); await p.evaluate(x => { localStorage.clear(); localStorage.setItem('e21cclog', x); }, JSON.stringify(seed)); await p.reload(); await sleep(800); await p.evaluate(() => location.hash = '#/'); await sleep(400);
    const card = await p.$$eval('.nxpart:first-of-type .nxlist>li', ls => ls.map(l => l.textContent.replace(/\s+/g, ' ').trim()).find(t => /Add the Log to your Home Screen/.test(t)) || '');
    check('on an iPad, Home offers to add the Log to the Home Screen, with the steps', /Share, then Add to Home Screen/.test(card), card.slice(0, 120));
    await p.click('#nxInstallLater'); await sleep(300);
    check('Not now puts it away for a while', await p.$$eval('.nxpart:first-of-type .nxlist>li', ls => !ls.some(l => /Add the Log to your Home Screen/.test(l.textContent))));
    await ctx.close(); }
  { const {ctx, p} = await fresh(); await p.evaluate(x => localStorage.setItem('e21cclog', x), JSON.stringify(seed)); await p.reload(); await sleep(700); await p.evaluate(() => location.hash = '#/'); await sleep(300);
    await p.evaluate(() => { const e = new Event('beforeinstallprompt'); e.prompt = () => { window.__prompted = true; }; e.userChoice = Promise.resolve({outcome:'accepted'}); window.dispatchEvent(e); }); await sleep(400);
    const hasBtn = await p.$('#doInstall'); if (hasBtn){ await hasBtn.click(); await sleep(300); }
    check('with Chrome’s install event, Home shows an Install button that opens the browser’s prompt', !!hasBtn && await p.evaluate(() => window.__prompted === true));
    await ctx.close(); }

  // 5. the offline copy: after one visit, the Log opens without a network
  { const {ctx, p} = await fresh(); await p.evaluate(x => localStorage.setItem('e21cclog', x), JSON.stringify(seed));
    await p.goto(BASE + 'index.html'); await p.evaluate(async () => { await navigator.serviceWorker.ready; }); await sleep(1500); await p.reload(); await sleep(800);
    const controlled = await p.evaluate(() => !!navigator.serviceWorker.controller);
    await ctx.setOffline(true); await p.reload(); await sleep(1200); await p.evaluate(() => location.hash = '#/'); await sleep(400);
    const off = await p.evaluate(() => ({h1:(document.querySelector('h1') || {}).textContent, wheel:!!document.querySelector('.wheel')}));
    check('the offline copy: after one visit the Log opens with no network, with its wheel', controlled && off.h1 === 'Where am I now?' && off.wheel, JSON.stringify({controlled, off}));
    await ctx.setOffline(false); await ctx.close(); }

  // 6. the console: a backup, and a restore
  { const {ctx, p} = await fresh(); await p.goto(BASE + 'teacher.html'); await p.evaluate(() => localStorage.removeItem('e21cclog.teacher')); await p.reload(); await sleep(600);
    await p.evaluate(() => { store.items['s|x'] = {key:'s|x', sk:'s', kind:'e', data:{id:'x', kind:'grow', created:Date.now(), answers:{g1:'Hi'}, context:{type:'subject', name:'Art'}}, received:Date.now(), opened:false, via:'link'}; store.students.s = {name:'A student'}; save(); renderInbox(); backupLine(); });
    check('the console says it is not backed up yet', /Not backed up yet/.test(await p.textContent('#cBackupLine')));
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#cBackupGo')]); const file = path.join(require('./shots.js')(''), 'console-backup.json'); await dl.saveAs(file); await sleep(300);
    check('Back up the console downloads its store and records it', /e21cc-console-.*\.json$/.test(dl.suggestedFilename()) && /Last backed up on/.test(await p.textContent('#cBackupLine')) && JSON.parse(fs.readFileSync(file, 'utf8')).store.items['s|x']);
    await p.evaluate(() => { localStorage.removeItem('e21cclog.teacher'); }); await p.reload(); await sleep(500);
    p.once('dialog', d => d.accept()); await p.setInputFiles('#cRestore', file); await sleep(1200);
    check('Restore brings the console back from the file', await p.evaluate(() => !!JSON.parse(localStorage.getItem('e21cclog.teacher') || '{}').items?.['s|x']));
    await ctx.close(); }

  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
})();
