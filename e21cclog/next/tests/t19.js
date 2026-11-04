// t19 (next, A4): the console's PIN. A first open asks for a new PIN (4 to 6 digits, typed twice); the store is
// then sealed, so nothing a student wrote is readable in the browser's storage; every open asks for the PIN, a
// wrong one says so and five pause it; ten idle minutes lock it again; a share link waits behind the PIN; a
// console from before the PIN is locked in place; Forgot PIN clears the console after a warning.
const fs = require('fs'); const path = require('path');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/next/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/seed3.json'), 'utf8')); seed.profiles[seed.current].email = 'wei_ling_tan@students.edu.sg';
(async () => {
  const browser = await launch(); const errors = [];
  const watch = p => p.on('pageerror', e => errors.push(p.url().split('#')[0] + ' ' + e.message + (process.env.STACK ? ' ' + e.stack : '')));
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  // a share link from the student, for the console to open
  const sctx = await browser.newContext(); const sp = await sctx.newPage();
  await sp.goto(BASE + 'index.html'); await sp.evaluate(s => localStorage.setItem('e21cclog.next', s), JSON.stringify(seed)); await sp.reload(); await sleep(500);
  const link = (await sp.evaluate(async () => consoleUrl() + '#/in?p=' + await packCDL('i', {v:1, from:await senderInfo(), items:me.entries.slice(0, 2).map(e => ({t:'e', e:compactEntry(e)}))}))).replace(/^.*teacher\.html/, BASE + 'teacher.html');
  await sctx.close();

  const ctx = await browser.newContext({viewport:{width:390, height:844}}); await ctx.addInitScript(() => { window.__noAutoPin = true; });
  const p = await ctx.newPage(); watch(p);
  const state = () => p.evaluate(() => ({h:(document.querySelector('#pinH') || {}).textContent || '', open:typeof store !== 'undefined', msg:(document.querySelector('#pinMsg') || {}).textContent || ''}));
  const enter = async (...pins) => { const ins = await p.$$('#pinGate input[type=password]'); for (let i = 0; i < ins.length; i++) await ins[i].fill(pins[i] || pins[0]); await p.click('#pinGate button[type=submit]'); await sleep(900); };

  // 1. a first open: set a PIN; the console stays shut until then
  await p.goto(BASE + 'teacher.html'); await sleep(600);
  const s1 = await state(); const inert = await p.evaluate(() => [...document.body.children].filter(x => x.id !== 'pinGate' && x.tagName !== 'SCRIPT').every(x => x.hasAttribute('inert')));
  check('a first open asks for a new PIN, and the console behind it cannot be reached', s1.h === 'Set a PIN for the console' && !s1.open && inert, JSON.stringify(s1));
  const a1 = await axe(p); check('the PIN screen has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await p.screenshot({path:shots('t19-set-pin.png'), animations:'disabled'});
  await enter('123'); check('a PIN must be 4 to 6 digits', /4 to 6 digits/.test((await state()).msg));
  await enter('1357', '1358'); check('the two PINs must match', /not the same/.test((await state()).msg));
  await enter('1357', '1357');
  check('a matching PIN opens the console', (await state()).open && !(await p.$('#pinGate')));

  // 2. the store is sealed: nothing a student wrote can be read in the browser's storage
  // a share link opened in a fresh load (from the open console it would only change the hash)
  await p.goto('about:blank'); await p.goto(link); await sleep(300); await enter('1357'); await sleep(600);
  const got = await p.evaluate(async () => { await __consoleFlush(); const raw = localStorage.getItem('e21cclog.next.teacher'); const lock = localStorage.getItem('e21cclog.next.teacher.pin'); return {n:Object.keys(store.items).length, sealed:JSON.parse(raw).sealed, plain:/Wei Ling|Titration|persuasive|items/i.test(raw), pin:/1357/.test(lock || '')}; });
  check('a share link waits behind the PIN, then its items arrive', got.n === 2, JSON.stringify(got));
  check('the store is sealed: no student’s name or words, and not even its shape, can be read in storage; the PIN itself is never stored', got.sealed === 'aes-gcm' && !got.plain && !got.pin, JSON.stringify(got));

  // 3. every open asks; a wrong PIN says so; the right one opens with everything there
  await p.goto(BASE + 'teacher.html'); await sleep(600);
  check('opening again asks for the PIN', (await state()).h === 'Enter your PIN' && !(await state()).open);
  await p.screenshot({path:shots('t19-ask-pin.png'), animations:'disabled'});
  const a2 = await axe(p); check('the Enter your PIN screen has no serious or critical accessibility issues', !a2.length, a2.join(' | '));
  await enter('0000'); const w = await state();
  check('a wrong PIN says it did not match, and how many tries are left', /did not match\. 4 tries left/.test(w.msg) && !w.open, w.msg);
  await enter('1357');
  check('the right PIN opens the console with its items', await p.evaluate(() => Object.keys(store.items).length) === 2);

  // 4. five wrong tries pause it
  await p.goto(BASE + 'teacher.html'); await sleep(500);
  for (let i = 0; i < 5; i++) await enter('9999');
  const pz = await p.evaluate(() => ({msg:document.querySelector('#pinMsg').textContent, off:document.querySelector('#pinGate input').disabled}));
  check('five wrong PINs pause the screen for a short while', /Too many tries\. Wait \d+ seconds/.test(pz.msg) && pz.off, JSON.stringify(pz));
  await p.evaluate(() => localStorage.setItem('e21cclog.next.teacher.pause', JSON.stringify({tries:0, until:Date.now() - 1}))); await p.reload(); await sleep(500);
  await enter('1357'); check('after the pause the right PIN opens it', (await state()).open);

  // 5. idle: ten minutes without use locks it again (a short interval here)
  await p.evaluate(() => sessionStorage.setItem('e21cclog.next.idle', '1500')); await p.reload(); await sleep(500); await enter('1357');
  check('the console is open', (await state()).open);
  await sleep(3200);
  check('after the idle time, the console locks itself and asks for the PIN again', (await state()).h === 'Enter your PIN');
  await p.evaluate(() => sessionStorage.removeItem('e21cclog.next.idle'));

  // 6. a console from before the PIN: the first PIN locks what is there
  { const c2 = await browser.newContext(); await c2.addInitScript(() => { window.__noAutoPin = true; }); const q = await c2.newPage(); watch(q);
    await q.goto(BASE + 'teacher.html'); await q.evaluate(() => { localStorage.removeItem('e21cclog.next.teacher.pin'); localStorage.setItem('e21cclog.next.teacher', JSON.stringify({items:{a:{key:'a', sk:'s', kind:'e', data:{id:'a', kind:'grow', subject:'Science', answers:{g1:'Older words'}}, received:Date.now()}}, students:{s:{name:'Old Student'}}})); }); await q.reload(); await sleep(500);
    const holds = /already holds shared work/.test(await q.textContent('#pinGate'));
    const ins = await q.$$('#pinGate input[type=password]'); for (const i of ins) await i.fill('2580'); await q.click('#pinGate button[type=submit]'); await sleep(900);
    const r = await q.evaluate(async () => { await __consoleFlush(); return {n:Object.keys(store.items).length, raw:localStorage.getItem('e21cclog.next.teacher')}; });
    check('a console that already held shared work says so, and the first PIN seals what is there', holds && r.n === 1 && !/Older words|Old Student/.test(r.raw) && /sealed/.test(r.raw), JSON.stringify({holds, n:r.n}));
    await c2.close(); }

  // 7. Forgot PIN: a clear warning, then a clean console and a new PIN
  await p.goto(BASE + 'teacher.html'); await sleep(500);
  await p.click('#pinForgot'); await sleep(200);
  check('Forgot PIN warns that a PIN cannot be recovered and clearing removes what the console holds', /cannot be recovered/.test(await p.textContent('#pinGate')) && !!(await p.$('#pinClear')));
  await p.click('#pinBack'); await sleep(200); check('Back returns to the PIN', (await state()).h === 'Enter your PIN');
  await p.click('#pinForgot'); await sleep(200); await p.click('#pinClear'); await sleep(300);
  const cl = await state(); await enter('8642', '8642');
  check('clearing leads to a new PIN, and the console opens empty', cl.h === 'Set a PIN for the console' && /cleared/.test(cl.msg) && await p.evaluate(() => Object.keys(store.items).length) === 0, JSON.stringify(cl));

  check('no page errors', !errors.length);
  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
