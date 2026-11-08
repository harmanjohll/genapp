// t27: one Log again (Version 4). A log and a console saved by Version 3 open with nothing lost; the one time fresh
// start never clears a pilot log; the test version's log is offered once and brought across with nothing doubled; an
// empty console takes over the test version's; e21cclog/next/ forwards and its offline copy removes itself; the
// Version 3 archive shows the log, saves nothing, keeps no offline copy, and its console forwards.
const fs = require('fs'); const path = require('path');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const ROOT = BASE.replace(/e21cclog\/$/, '');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const V3 = fs.readFileSync(path.join(__dirname, 'fixtures/v3-store.json'), 'utf8'); const V3P = (d => d.profiles[d.current])(JSON.parse(V3));
const V3C = fs.readFileSync(path.join(__dirname, 'fixtures/v3-console.json'), 'utf8');
const ITEM = (key, sk) => Object.assign(clone(Object.values(JSON.parse(V3C).items)[0]), {key, sk, received:Date.now()});
const clone = x => JSON.parse(JSON.stringify(x));
(async () => {
  const browser = await launch(); const errors = [];
  const watch = p => { p.on('pageerror', e => errors.push(p.url() + ' ' + e.message)); return p; };
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const toasts = p => p.evaluate(() => { window.__toasts = []; const t = toast; toast = (m, ...a) => { window.__toasts.push(m); return t(m, ...a); }; });
  const landed = async (p, from) => { const seen = []; const h = f => { if (f === p.mainFrame()) seen.push(f.url()); }; p.on('framenavigated', h); await p.goto(ROOT + from); await sleep(500); p.off('framenavigated', h); return seen; };
  const seedAt = async (ctx, kv) => { const p = watch(await ctx.newPage()); await p.goto(BASE + 'school/beatty.json'); await p.evaluate(o => { for (const [k, v] of Object.entries(o)) if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }, kv); return p; };

  // 1. a log saved by Version 3 opens in Version 4 with nothing lost
  { const ctx = await browser.newContext({viewport:{width:390, height:844}}); const p = await seedAt(ctx, {'e21cclog':V3});
    await p.goto(BASE + 'index.html#/'); await sleep(1200);
    const r = await p.evaluate(() => ({label:APP_VERSION.label, n:me.entries.length, ids:me.entries.map(e => e.id).sort().join(), draft:(me.drafts.grow || {}).answers, notes:(me.entries.find(e => (e.notes || []).length) || {notes:[]}).notes.length, done:Object.keys(me.done || {}).length, email:me.email, carry:!!document.querySelector('#main .carrycard'), from:!!document.querySelector('#main .fromcard'), test:!!document.querySelector('.fromtest')}));
    check('Version 4 opens a Version 3 log: every entry, the unfinished entry, the teacher’s note, the plan ticked, the email', r.label === 'Version 4' && r.n === V3P.entries.length && r.ids === V3P.entries.map(e => e.id).sort().join() && r.draft && r.draft.g1 === V3P.drafts.grow.answers.g1 && r.notes === 1 && r.done === 1 && r.email === V3P.email, JSON.stringify(r));
    check('Home shows Carry on and From your teachers for it, and no test version card', r.carry && r.from && !r.test, JSON.stringify(r));
    await p.evaluate(() => saveDb()); const kept = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); const pr = d.profiles[d.current]; return {n:pr.entries.length, draft:!!(pr.drafts || {}).grow, notes:pr.entries.reduce((a, e) => a + (e.notes || []).length, 0)}; });
    check('saved again by Version 4, the log still holds all of it', kept.n === V3P.entries.length && kept.draft && kept.notes === 1, JSON.stringify(kept));
    await ctx.close(); }

  // 2. the fresh start: a browser that had the pilot keeps its log; the test version's log is never cleared
  { const ctx = await browser.plainContext({viewport:{width:390, height:844}}); const p = await seedAt(ctx, {'e21cclog':V3, 'e21cclog.fresh':'2026-11-01'});
    await p.goto(BASE + 'index.html#/'); await sleep(1100);
    check('a browser that had the pilot keeps its log through the first Version 4 open', await p.evaluate(n => !!me && me.entries.length === n, V3P.entries.length));
    await ctx.close();
    const ctx2 = await browser.plainContext(); const q = await seedAt(ctx2, {'e21cclog.next':V3});
    await q.goto(BASE + 'index.html'); await sleep(1000);
    check('on a browser that never had the pilot, the fresh start runs and leaves the test version’s log alone', await q.evaluate(() => localStorage.getItem('e21cclog.fresh') === '2026-11-01' && !!localStorage.getItem('e21cclog.next')));
    await ctx2.close(); }

  // 3. a console saved by Version 3 asks for a PIN, and seals what it holds
  { const ctx = await browser.newContext(); const p = await seedAt(ctx, {'e21cclog.teacher':V3C, 'e21cclog.teacher.pin':null});
    await p.goto(BASE + 'teacher.html'); await sleep(2200);
    const r = await p.evaluate(async () => { await __consoleFlush(); const raw = localStorage.getItem('e21cclog.teacher') || ''; return {items:Object.keys(store.items).length, sealed:/"sealed"/.test(raw), readable:/Bedok|Wei Ling/.test(raw)}; });
    check('a Version 3 console opens with a new PIN and its shared work is sealed', r.items === 1 && r.sealed && !r.readable, JSON.stringify(r));
    await ctx.close(); }

  // 4. the test version's log: offered once, brought across with nothing doubled
  const NX = JSON.parse(V3); const NP = NX.profiles[NX.current];
  NP.entries.push(Object.assign(clone(NP.entries[0]), {id:'nx1', created:Date.now() - 864e5, updated:Date.now() - 864e5, notes:[]}));
  { const ctx = await browser.newContext({viewport:{width:390, height:844}}); const p = await seedAt(ctx, {'e21cclog':V3, 'e21cclog.next':JSON.stringify(NX)});
    await p.goto(BASE + 'index.html#/'); await sleep(1200);
    const card = await p.evaluate(() => (document.querySelector('#main .fromtest') || {}).textContent || '');
    check('Home offers the test version’s log with the same name', /From the test version/.test(card) && /Bring it across/.test(card), card.replace(/\s+/g, ' ').slice(0, 120));
    await p.screenshot({path:shots('t27-fromtest-390.png'), animations:'disabled'});
    const a1 = await axe(p); check('the card has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
    await toasts(p); await p.click('[data-fromtest]'); await sleep(700);
    const r = await p.evaluate(() => ({t:window.__toasts[0] || '', n:me.entries.length, ids:new Set(me.entries.map(e => e.id)).size, card:!!document.querySelector('.fromtest'), kept:!!localStorage.getItem('e21cclog.next')}));
    check('Bring it across adds only the entry that was missing, says so, and leaves the test version’s copy where it was', /^1 entry brought across\./.test(r.t) && r.n === V3P.entries.length + 1 && r.ids === r.n && !r.card && r.kept, JSON.stringify(r));
    await p.reload(); await sleep(1000);
    check('it is offered once: after a refresh there is no card', await p.evaluate(() => !document.querySelector('.fromtest')));
    await ctx.close(); }
  { // a log only in the test version: offered on the welcome page, and becomes a log here
    const OX = JSON.parse(V3); const OP = OX.profiles[OX.current]; OP.name = 'Sam Test'; OP.id = 'samtest'; delete OP.backup; OX.profiles = {samtest:OP}; OX.current = 'samtest';
    const ctx = await browser.newContext({viewport:{width:1280, height:900}}); const p = await seedAt(ctx, {'e21cclog':null, 'e21cclog.next':JSON.stringify(OX)});
    await p.goto(BASE + 'index.html'); await sleep(1100);
    const w = await p.evaluate(() => ({hash:location.hash, card:(document.querySelector('.fromtest') || {}).textContent || ''}));
    check('a log only in the test version is offered on the welcome page', w.hash === '#/welcome' && /Sam Test/.test(w.card), JSON.stringify({hash:w.hash}));
    await p.screenshot({path:shots('t27-welcome-1280.png'), animations:'disabled'});
    const a2 = await axe(p); check('the welcome page with the card has no serious or critical accessibility issues', !a2.length, a2.join(' | '));
    await p.click('[data-fromtest="samtest"]'); await sleep(1200);
    const r = await p.evaluate(() => ({name:me && me.name, n:me && me.entries.length, backup:!!(me && me.backup), hash:location.hash}));
    check('Bring it across opens it as a log here, with every entry, and no backup claimed', r.name === 'Sam Test' && r.n === V3P.entries.length && !r.backup && r.hash !== '#/welcome', JSON.stringify(r));
    await ctx.close(); }
  { // a log here with that name and a PIN, not open: the PIN is asked first; and Leave it
    const H = JSON.parse(V3); const ctx = await browser.newContext({viewport:{width:390, height:844}});
    const p = await seedAt(ctx, {'e21cclog':null});
    await p.goto(BASE + 'index.html'); await sleep(600);
    const pin = await p.evaluate(async pr => hashPin(pr.email || pr.id, '2468'), H.profiles[H.current]); H.profiles[H.current].pin = pin; H.current = null;
    const L = JSON.parse(V3); const LP = L.profiles[L.current]; LP.name = 'Leave Me'; LP.id = 'leaveme'; L.profiles = {leaveme:LP, [NP.id]:NP};
    await p.evaluate(([h, n]) => { localStorage.setItem('e21cclog', h); localStorage.setItem('e21cclog.next', n); }, [JSON.stringify(H), JSON.stringify(L)]);
    await p.goto('about:blank'); await p.goto(BASE + 'index.html'); await sleep(1100);
    await p.click(`[data-fromtest="${NP.id}"]`); await sleep(500);
    const o = await p.evaluate(() => ({out:(document.querySelector('#ftOut') || {}).textContent || '', pin:!!document.querySelector('#ftOut #wMergePin')}));
    check('with a log of that name here behind a PIN, it asks for that PIN before adding anything', /already has a log on this device/.test(o.out) && o.pin, JSON.stringify(o));
    await p.fill('#wMergePin', '1111'); await p.click('#wMerge'); await sleep(400);
    const wrong = await p.evaluate(() => ({msg:document.querySelector('#wMergeMsg').textContent, me:!!me}));
    await toasts(p); await p.fill('#wMergePin', '2468'); await p.click('#wMerge'); await sleep(1200);
    const right = await p.evaluate(() => ({t:window.__toasts[0] || '', n:me && me.entries.length, logs:Object.keys(db.profiles).length}));
    check('a wrong PIN adds nothing; the right one adds the missing entry to that log, with one log', /did not match/.test(wrong.msg) && !wrong.me && /^1 entry brought across\./.test(right.t) && right.n === V3P.entries.length + 1 && right.logs === 1, JSON.stringify({wrong, right}));
    await p.evaluate(() => { db.current = null; saveDb(); me = null; unlocked = false; rememberOpen(null); location.hash = '#/welcome'; }); await sleep(700);
    await p.click('[data-fromtestleave="leaveme"]'); await sleep(600);
    const left = await p.evaluate(() => ({card:!!document.querySelector('[data-fromtest="leaveme"]'), kept:!!JSON.parse(localStorage.getItem('e21cclog.next')).profiles.leaveme, logs:Object.keys(db.profiles).length}));
    check('Leave it stops the offer and keeps that log where it was', !left.card && left.kept && left.logs === 1, JSON.stringify(left));
    await ctx.close(); }

  // 5. the console: an empty one takes over the test version's, which the same PIN opens; a console in use keeps its own
  { const ctx = await browser.newContext(); const p = await seedAt(ctx, {'e21cclog.teacher':null, 'e21cclog.teacher.pin':null});
    await p.goto(BASE + 'teacher.html'); await sleep(2000);
    await p.evaluate(async it => { store.items['t|1'] = it; await save(); await __consoleFlush(); }, ITEM('t|1', 't'));
    await p.evaluate(() => { localStorage.setItem('e21cclog.next.teacher', localStorage.getItem('e21cclog.teacher')); localStorage.setItem('e21cclog.next.teacher.pin', localStorage.getItem('e21cclog.teacher.pin')); localStorage.removeItem('e21cclog.teacher'); localStorage.removeItem('e21cclog.teacher.pin'); });
    await p.goto('about:blank'); await p.goto(BASE + 'teacher.html'); await sleep(2200);
    const r = await p.evaluate(() => ({item:typeof store !== 'undefined' && !!store.items['t|1'], kept:!!localStorage.getItem('e21cclog.next.teacher')}));
    check('an empty console takes over the test version’s console, opened by the same PIN, and the old copy stays', r.item && r.kept, JSON.stringify(r));
    await p.evaluate(async it => { delete store.items['t|1']; store.items['h|1'] = it; await save(); await __consoleFlush(); }, ITEM('h|1', 'h'));
    await p.goto('about:blank'); await p.goto(BASE + 'teacher.html'); await sleep(2200);
    check('a console in use keeps its own work', await p.evaluate(() => !!store.items['h|1'] && !store.items['t|1']));
    await ctx.close(); }

  // 6. e21cclog/next/ forwards, and its offline copy removes itself
  { const ctx = await browser.newContext(); const p = watch(await ctx.newPage());
    const cases = [
      ['e21cclog/next/', /e21cclog\/index\.html$/],
      ['e21cclog/next/index.html?guest=1#/c', /e21cclog\/index\.html\?guest=1#\/c$/],
      ['e21cclog/next/index.html#/note?n=CDL1.n.x', /e21cclog\/index\.html#\/note\?n=CDL1\.n\.x$/],
      ['e21cclog/next/teacher.html#/in?p=CDL1.i.y', /e21cclog\/teacher\.html#\/in\?p=CDL1\.i\.y$/],
      ['e21cclog/next/demo/', /e21cclog\/demo\/index\.html$/],
      ['e21cclog/next/demo/student/', /e21cclog\/index\.html\?demo=student/],
      ['e21cclog/next/demo/teacher/', /e21cclog\/teacher\.html\?demo=1/]
    ];
    const got = []; for (const [from, want] of cases){ const seen = await landed(p, from); got.push([from, seen.some(u => want.test(u)), seen.slice(-2)]); }
    check('the test version’s addresses forward to the Log, with the query and the hash', got.every(([, ok]) => ok), JSON.stringify(got.filter(([, ok]) => !ok)));
    await p.goto(BASE + 'index.html'); await sleep(500);
    const sw = await p.evaluate(async () => {
      await (await caches.open('e21cclognext-2-2026-11-04')).put('/x', new Response('old'));
      const reg = await navigator.serviceWorker.register('next/sw.js', {scope:'next/'});
      for (let i = 0; i < 40; i++){ const regs = await navigator.serviceWorker.getRegistrations(); if (!regs.some(r => /\/next\/$/.test(r.scope))) break; await new Promise(r => setTimeout(r, 150)); }
      return {left:(await navigator.serviceWorker.getRegistrations()).filter(r => /\/next\/$/.test(r.scope)).length, caches:(await caches.keys()).filter(k => k.startsWith('e21cclognext-')).length};
    });
    check('the test version’s offline copy clears itself and removes itself', sw.left === 0 && sw.caches === 0, JSON.stringify(sw));
    await ctx.close(); }

  // 7. the Version 3 archive: shows the log, saves nothing, keeps no offline copy, never clears; its console forwards
  { const ctx = await browser.plainContext({viewport:{width:390, height:844}}); const p = await seedAt(ctx, {'e21cclog':V3});
    await p.goto(BASE + 'legacy/v3/index.html#/write/grow'); await sleep(1300);
    const r = await p.evaluate(() => ({banner:(document.querySelector('.legacy-banner') || {}).textContent || '', hash:location.hash, n:typeof me !== 'undefined' && me ? me.entries.length : -1, label:APP_VERSION.label}));
    check('the archive opens Version 3 on the same log, with its banner, and no writing page', /Version 3 of the E21CC Log, kept to compare with/.test(r.banner) && r.hash === '#/' && r.n === V3P.entries.length && r.label === 'Version 3', JSON.stringify(r));
    await p.screenshot({path:shots('t27-legacy-v3-390.png'), animations:'disabled'});
    const before = await p.evaluate(() => localStorage.getItem('e21cclog'));
    await p.evaluate(() => { me.name = 'Should not stick'; me.entries.pop(); saveDb(); }); await sleep(200);
    const after = await p.evaluate(() => ({same:localStorage.getItem('e21cclog'), fresh:localStorage.getItem('e21cclog.fresh')}));
    check('the archive saves nothing, and never ran a fresh start on a browser without the mark', after.same === before && after.fresh === null);
    await p.reload(); await sleep(1000);
    const regs = await p.evaluate(async () => ({regs:(await navigator.serviceWorker.getRegistrations()).length, ctl:!!navigator.serviceWorker.controller}));
    check('the archive keeps no offline copy', regs.regs === 0 && !regs.ctl, JSON.stringify(regs));
    const seen = await landed(p, 'e21cclog/legacy/v3/teacher.html#/in?p=CDL1.i.z');
    check('the archive’s console forwards to the live console, with the hash', seen.some(u => /e21cclog\/teacher\.html#\/in\?p=CDL1\.i\.z$/.test(u)), JSON.stringify(seen.slice(-2)));
    await p.goto(BASE + 'legacy/'); await sleep(300);
    const links = await p.$$eval('main a', as => as.map(a => a.getAttribute('href')));
    check('the archive page lists Version 3, 2 and 1, and a way to the Log', ['../index.html', 'v3/index.html', 'v2/index.html', 'v1/index.html'].every(h => links.includes(h)), JSON.stringify(links));
    await ctx.close(); }

  check('no page errors', !errors.length, errors.join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
