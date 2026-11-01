// t15: getting back in. The fresh start clears every log once, and only the Log's own keys; a log with a
// PIN stays open through a refresh in its tab; a new tab asks only for the PIN, on a welcome back card;
// refreshing again and again never makes a second log; a name already here opens that log, and a second
// log with the same name takes a deliberate step; switching logs locks the tab again.
const fs = require('fs'); const path = require('path');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = fs.readFileSync(path.join(__dirname, 'fixtures/seed3.json'), 'utf8');
(async () => {
  const browser = await launch(); const errors = [];
  const watch = p => p.on('pageerror', e => errors.push(e.message));
  const count = p => p.evaluate(() => Object.keys((JSON.parse(localStorage.getItem('e21cclog') || '{}').profiles) || {}).length);
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };

  // 1. the fresh start, once: only the Log's keys, on a browser that has not had it
  { const ctx = await browser.plainContext({viewport:{width:1280, height:900}}); const p = await ctx.newPage(); watch(p);
    await p.goto(BASE + 'school/beatty.json');
    await p.evaluate(s => { localStorage.clear(); for (const k of ['e21cclog', 'cdl.logsv3', 'cdl.logsv2', 'cdl.v2', 'logs.v1']) localStorage.setItem(k, s); for (const k of ['e21cclog.teacher', 'logs.teacher.logsv3', 'logs.teacher.v2']) localStorage.setItem(k, '{"items":{"x":{}}}'); localStorage.setItem('paths.progress', 'keep me'); }, seed);
    await p.goto(BASE + 'index.html'); await sleep(900);
    const r = await p.evaluate(() => ({left:['cdl.logsv3', 'cdl.logsv2', 'cdl.v2', 'logs.v1', 'e21cclog.teacher', 'logs.teacher.logsv3', 'logs.teacher.v2'].filter(k => localStorage.getItem(k) !== null), profiles:Object.keys((JSON.parse(localStorage.getItem('e21cclog') || '{}').profiles) || {}).length, other:localStorage.getItem('paths.progress'), mark:localStorage.getItem('e21cclog.fresh'), hash:location.hash}));
    check('the fresh start clears every log, the older copies and the console, and leaves other pages’ keys alone', !r.left.length && r.profiles === 0 && r.other === 'keep me' && r.mark === launch.FRESH && r.hash === '#/welcome', JSON.stringify(r));
    await p.fill('#newForm [name=name]', 'Ravi Kumar'); await p.click('#newForm button[type=submit]'); await sleep(500);
    await p.reload(); await sleep(700);
    check('it happens once: a log made afterwards is still there after a refresh', (await count(p)) === 1 && (await p.evaluate(() => location.hash)) !== '#/welcome');
    const t = await ctx.newPage(); await t.goto(BASE + 'teacher.html'); await sleep(600);
    await t.evaluate(() => { store.items.k = {key:'k', sk:'s', kind:'e', data:{id:'k'}, received:Date.now()}; save(); }); await t.reload(); await sleep(500);
    check('the console keeps what it saves after the fresh start', await t.evaluate(() => !!store.items.k));
    await ctx.close(); }

  // 2. a log with a PIN: a refresh keeps the student in; a new tab asks only for the PIN
  const ctx = await browser.newContext({viewport:{width:390, height:844}}); const p = await ctx.newPage(); watch(p);
  await p.goto(BASE + 'index.html'); await p.evaluate(() => localStorage.removeItem('e21cclog')); await p.reload(); await sleep(600);
  await p.fill('#newForm [name=name]', 'Wei Ling Tan'); await p.fill('#newForm [name=pin]', '1234'); await p.click('#newForm button[type=submit]'); await sleep(600);
  await p.reload(); await sleep(600);
  check('a refresh keeps the student in their log', (await p.evaluate(() => location.hash)) !== '#/welcome' && !(await p.$('#newForm')));
  for (let i = 0; i < 10; i++){ await p.reload(); await sleep(120); }
  await sleep(400);
  check('ten refreshes later there is still one log, and the student is still in', (await count(p)) === 1 && !(await p.$('#wPin')) && !(await p.$('#newForm')));
  const tab = await ctx.newPage(); watch(tab); await tab.goto(BASE + 'index.html'); await sleep(700);
  const wb = await tab.evaluate(() => ({h:(document.querySelector('#wPin h2') || {}).textContent || '', pin:!!document.querySelector('#pinForm input'), focus:document.activeElement && document.activeElement.name, form:!!document.querySelector('#newForm'), cards:document.querySelectorAll('.pcard').length}));
  check('a new tab shows "Welcome back, Wei Ling Tan" with only the PIN to type, and no new log form', wb.h === 'Welcome back, Wei Ling Tan' && wb.pin && wb.focus === 'pin' && !wb.form && !wb.cards, JSON.stringify(wb));
  await tab.screenshot({path:require('./shots.js')('t15-welcome-back.png'), animations:'disabled'});
  const a1 = await axe(tab); check('the welcome back card has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await tab.fill('#pinForm input', '9999'); await tab.click('#pinForm button'); await sleep(300);
  check('a wrong PIN says so and keeps the card', /did not match/.test(await tab.textContent('#pinMsg')) && !!(await tab.$('#wPin')));
  await tab.fill('#pinForm input', '1234'); await tab.click('#pinForm button'); await sleep(600);
  check('the right PIN opens the log', (await tab.evaluate(() => location.hash)) === '#/' && !(await tab.$('#wPin')));

  // 3. switching logs locks the tab; choosing a log shows the logs here, and starting one is a separate step
  await tab.evaluate(() => location.hash = '#/settings'); await sleep(400); await tab.click('#sOut'); await sleep(500);
  const ch = await tab.evaluate(() => ({cards:document.querySelectorAll('.pcard').length, form:!!document.querySelector('#newForm'), open:sessionStorage.getItem('e21cclog.open'), btn:(document.querySelector('#wNew') || {}).textContent || ''}));
  check('Switch to another log locks the tab and shows the logs here, with Start a new log as its own button', ch.cards === 1 && !ch.form && ch.open === null && /Start a new log/.test(ch.btn), JSON.stringify(ch));
  const a2 = await axe(tab); check('the choose your log page has no serious or critical accessibility issues', !a2.length, a2.join(' | '));

  // 4. the same name: offered the log already here; a second only by a deliberate step
  await tab.click('#wNew'); await sleep(300);
  await tab.fill('#newForm [name=name]', '  wei ling   TAN '); await tab.click('#newForm button[type=submit]'); await sleep(300);
  const same = await tab.evaluate(() => ({note:(document.querySelector('#sameBox') || {}).textContent || '', focus:document.activeElement && document.activeElement.id}));
  check('a name already here is offered back, and no second log is made', /already a log for Wei Ling Tan on this device/.test(same.note) && same.focus === 'sameOpen' && (await count(tab)) === 1, JSON.stringify(same));
  await tab.screenshot({path:require('./shots.js')('t15-same-name.png'), animations:'disabled'});
  await tab.click('#sameOpen'); await sleep(400);
  check('Open that log goes to its PIN card', (await tab.evaluate(() => (document.querySelector('#wPin h2') || {}).textContent)) === 'Welcome back, Wei Ling Tan');
  await tab.click('#wNew'); await sleep(300); await tab.fill('#newForm [name=name]', 'Wei Ling Tan'); await tab.click('#newForm button[type=submit]'); await sleep(300);
  await tab.click('#sameAnyway'); await sleep(600);
  check('This is someone else with the same name makes a second log, only on that click', (await count(tab)) === 2 && (await tab.evaluate(() => location.hash)) === '#/setup');
  await tab.evaluate(() => location.hash = '#/settings'); await sleep(400); await tab.click('#sOut'); await sleep(500);
  const lines = await tab.$$eval('.pcard small', l => l.map(x => x.textContent));
  check('two logs with one name are told apart on their cards', lines.length === 2 && lines[0] !== lines[1] && lines.every(t => /started \d+ \w+, \d+:\d\d/i.test(t)), JSON.stringify(lines));
  await tab.screenshot({path:require('./shots.js')('t15-choose.png'), animations:'disabled'});

  // 5. a log without a PIN opens straight away after a refresh, as before
  { const c = await browser.newContext(); const q = await c.newPage(); watch(q);
    await q.goto(BASE + 'index.html'); await q.evaluate(s => { const d = JSON.parse(s); localStorage.setItem('e21cclog', JSON.stringify(d)); }, seed); await q.reload(); await sleep(700);
    check('a log without a PIN opens straight away after a refresh', (await q.evaluate(() => location.hash)) === '#/' && !(await q.$('#wPin')));
    await c.close(); }

  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
})();
