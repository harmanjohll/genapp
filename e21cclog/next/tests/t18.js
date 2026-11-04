// t18 (next, A3): share to the right teacher. An entry's own teacher comes first when sharing it, by Teams with
// the link ready; a subject teacher's new entries go in one link and only from their subject; the form teacher
// receives nothing until the student opens a section, and then everything in it.
const fs = require('fs'); const path = require('path');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/next/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/seed3.json'), 'utf8')); const P = seed.profiles[seed.current];
P.email = 'wei_ling_tan@students.edu.sg'; P.coach = {mode:'builtin'};
const T = (name, email, subjects, ccas = [], form = '') => ({name, email, subjects:subjects.map(n => ({name:n, levels:[]})), ccas, form});
seed.staff = {at:Date.now(), loaded:Date.now(), list:[T('Mr Tan', 'tan_ah_kow@moe.edu.sg', ['Mathematics']), T('Ms Lim', 'lim_mei@moe.edu.sg', ['Chemistry']), T('Mdm Siti', 'siti_r@moe.edu.sg', ['Geography']), T('Ms Goh', 'goh_siew@moe.edu.sg', ['English Language'], [], '2E1')]};
const pick = t => ({email:t, name:seed.staff.list.find(x => x.email === t).name});
P.teachers = {subjects:{Chemistry:pick('lim_mei@moe.edu.sg'), Mathematics:pick('tan_ah_kow@moe.edu.sg'), Geography:pick('siti_r@moe.edu.sg')}, ccas:{}, form:pick('goh_siew@moe.edu.sg')};
// two more Chemistry GROW entries, so three wait to be sent to Ms Lim
const chem = P.entries.find(e => e.id === 's3e0');
for (const [id, days] of [['c2', 5], ['c3', 2]]){ const e = JSON.parse(JSON.stringify(chem)); e.id = id; e.created = e.updated = Date.now() - days * 864e5; e.topic = 'Rates ' + id; delete e.sent; P.entries.push(e); }
(async () => {
  const browser = await launch(); const errors = [];
  const watch = p => p.on('pageerror', e => errors.push(p.url().split('#')[0] + ' ' + e.message));
  const ctx = await browser.newContext({viewport:{width:390, height:844}}); const p = await ctx.newPage(); watch(p);
  const go = async h => { await p.evaluate(x => location.hash = x, h); await sleep(600); };
  const linkFrom = async () => { const href = await p.$eval('#dTeams', a => a.href); const u = new URL(href); const msg = u.searchParams.get('message'); const link = msg.slice(msg.indexOf('http'));
    const got = await p.evaluate(async l => { const r = await unpackCDL(l.split('p=')[1]); return r.data.items.map(i => i.t === 'e' ? i.e.subject || (i.e.context && i.e.context.name) : 'basket:' + i.b.basket); }, link); return {users:u.searchParams.get('users'), items:got}; };
  await p.goto(BASE + 'index.html'); await p.evaluate(x => localStorage.setItem('e21cclog.next', x), JSON.stringify(seed)); await p.reload(); await sleep(800);

  // 1. Share on a Chemistry entry: Ms Lim first and chosen; Teams opens to her with the link ready
  await go('#/entry/s3e0'); await p.click('#eShare'); await sleep(400);
  const first = await p.evaluate(() => { const r = document.querySelector('#shareList .pick-row'); return {text:r.textContent, checked:r.querySelector('input').checked}; });
  check('sharing a Chemistry entry offers Ms Lim first, already chosen, as your Chemistry teacher', /Ms Lim/.test(first.text) && /Your Chemistry teacher/.test(first.text) && first.checked, JSON.stringify(first));
  await p.screenshot({path:shots('t18-share-entry.png'), animations:'disabled'});
  await p.click('#dGo'); await sleep(800);
  const one = await linkFrom();
  check('Teams opens a chat with Ms Lim, with a link holding just that entry', one.users === 'lim_mei@moe.edu.sg' && one.items.length === 1 && one.items[0] === 'Chemistry', JSON.stringify(one));
  await p.click('#dDone'); await sleep(300);
  await go('#/entry/s3e5'); await p.click('#eShare'); await sleep(400);
  check('a Maths entry offers Mr Tan first', /Mr Tan/.test(await p.textContent('#shareList .pick-row')));
  await p.click('#dClose'); await sleep(200);

  // 2. the Sharing page: nothing is on by default; Ms Lim's new entries come only from Chemistry, in one link
  await go('#/sharing');
  const before = await p.evaluate(() => adults().filter(a => a.staff).map(a => ({n:a.name, u:unsentFor(a).length, sc:scopeOf(a)})));
  check('until a section is opened, no teacher has anything waiting; subject teachers default to their subject, the form teacher to everything', before.every(x => x.u === 0) && before.find(x => x.n === 'Ms Lim').sc === 'teaches' && before.find(x => x.n === 'Ms Goh').sc === 'all', JSON.stringify(before));
  const card = n => `.adult[data-a="t:${n}"]`;
  await p.click(`${card('lim_mei@moe.edu.sg')} [data-sec=grow]`); await sleep(400);
  const lim = await p.evaluate(() => { const a = adultById('t:lim_mei@moe.edu.sg'); return unsentFor(a).map(i => i.e.subject); });
  check('with GROW open to Ms Lim, only Chemistry entries wait for her (the one already sent is not sent again)', lim.length === 2 && lim.every(s => s === 'Chemistry'), JSON.stringify(lim));
  const seg = await p.textContent(`${card('lim_mei@moe.edu.sg')} .seg`);
  check('her card offers Only Chemistry or All my entries, and says Change rather than Remove', /Only Chemistry/.test(seg) && /All my entries/.test(seg) && !!(await p.$(`${card('lim_mei@moe.edu.sg')} a[href="#/settings?s=expCard"]`)) && !(await p.$(`${card('lim_mei@moe.edu.sg')} [data-remove]`)), seg);
  await p.click(`${card('lim_mei@moe.edu.sg')} [data-send]`); await sleep(400);
  const ticks = await p.$$eval('#sendList input', l => l.length);
  await p.click('#dGo'); await sleep(800);
  const bundle = await linkFrom();
  check('Send sends Ms Lim her new Chemistry entries together, in one Teams link', ticks === 2 && bundle.users === 'lim_mei@moe.edu.sg' && bundle.items.length === 2 && bundle.items.every(s => s === 'Chemistry'), JSON.stringify({ticks, bundle}));
  await p.click('#dDone'); await sleep(400);
  check('once sent, nothing waits for Ms Lim', await p.evaluate(() => unsentFor(adultById('t:lim_mei@moe.edu.sg')).length) === 0);
  await p.click(`${card('lim_mei@moe.edu.sg')} [data-scope=all]`); await sleep(400);
  const wide = await p.evaluate(() => unsentFor(adultById('t:lim_mei@moe.edu.sg')).map(i => i.e.subject));
  check('All my entries widens what she can be sent to every GROW', wide.length > 0 && wide.some(s => s !== 'Chemistry'), JSON.stringify(wide));

  // 3. the form teacher: nothing until a section is opened, then every entry in it
  check('the form teacher has nothing waiting while no section is open', await p.evaluate(() => unsentFor(adultById('t:goh_siew@moe.edu.sg')).length) === 0);
  await p.click(`${card('goh_siew@moe.edu.sg')} [data-sec=act]`); await sleep(400);
  const goh = await p.evaluate(() => unsentFor(adultById('t:goh_siew@moe.edu.sg')).map(i => i.e.kind));
  check('with ACT open to the form teacher, every ACT entry waits for her, from any subject', goh.length === 1 && goh[0] === 'act', JSON.stringify(goh));
  await p.evaluate(() => document.querySelector('.adult[data-a="t:lim_mei@moe.edu.sg"]').scrollIntoView()); await p.screenshot({path:shots('t18-sharing.png'), animations:'disabled'});
  await p.addScriptTag({content:AXE});
  const a1 = await p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' ')));
  check('the Sharing page has no serious or critical accessibility issues', !a1.length, a1.join(' | '));

  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
