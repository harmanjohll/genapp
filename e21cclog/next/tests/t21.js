// t21 (next, B1): resume where I left off. A new tab opens the last page, at the same place down it, if that was
// in the last 12 hours; a link to somewhere else wins; a log with a PIN goes back there after the PIN. An unfinished
// entry waits on Home as one card, Continue opens it at the same step without asking again, Not now puts it aside.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/next/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/seed3.json'), 'utf8')); const P = seed.profiles[seed.current];
P.email = 'wei_ling_tan@students.edu.sg';
(async () => {
  const browser = await launch(); const errors = [];
  const watch = p => p.on('pageerror', e => errors.push(p.url().split('#')[0] + ' ' + e.message));
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const ctx = await browser.newContext({viewport:{width:390, height:844}});
  // each new page is a new tab: its own sessionStorage, the same log
  const tab = async (hash = '') => { const p = await ctx.newPage(); watch(p); await p.goto(BASE + 'index.html' + hash); await sleep(1300); return p; };
  const look = p => p.evaluate(() => ({hash:location.hash, y:Math.round(scrollY), composing:document.body.classList.contains('composing'), card:(document.querySelector('#main .carrycard h2') || {}).textContent || ''}));
  const atHome = h => h === '' || h === '#/';
  const setResume = (p, r) => p.evaluate(r => { localStorage.setItem('e21cclog.next.resume.' + me.id, JSON.stringify(Object.assign({y:0, at:Date.now()}, r))); }, r);

  const first = await ctx.newPage(); watch(first); await first.goto(BASE + 'index.html');
  await first.evaluate(s => { localStorage.setItem('e21cclog.next', s); }, JSON.stringify(seed)); await first.goto('about:blank'); await first.goto(BASE + 'index.html#/c'); await sleep(1300);

  // 1. the last page and the place down it
  await first.evaluate(() => window.scrollTo(0, 700)); await sleep(1300);
  const kept = await first.evaluate(() => JSON.parse(localStorage.getItem('e21cclog.next.resume.' + me.id))); const inLog = await first.evaluate(() => 'resume' in JSON.parse(localStorage.getItem('e21cclog.next')).profiles[me.id]); await first.close(); await sleep(200);
  check('the log keeps the last page and how far down it was, under its own key, not in the log', kept && kept.hash === '#/c' && Math.abs(kept.y - 700) <= 5 && !inLog, JSON.stringify({kept, inLog}));
  let p = await tab(); let s = await look(p);
  check('a new tab opens that page, at the same place', s.hash === '#/c' && Math.abs(s.y - 700) <= 40, JSON.stringify(s));
  await p.evaluate(() => location.hash = '#/'); await sleep(400); await p.goto(BASE + 'index.html'); await sleep(900);
  check('within the same tab, the Log does not go back again', atHome((await look(p)).hash));
  await p.close();

  // 2. an old place, a deep link and a deleted entry
  p = await tab(); await setResume(p, {hash:'#/journal/act', at:Date.now() - 13 * 3600e3}); await p.close();
  p = await tab(); check('a place from 13 hours ago is not gone back to: Home', atHome((await look(p)).hash));
  await setResume(p, {hash:'#/journal/act'}); await p.close();
  p = await tab('#/settings'); check('a link to somewhere else wins', (await look(p)).hash === '#/settings');
  await setResume(p, {hash:'#/entry/gone'}); await p.close();
  p = await tab(); check('an entry that is no longer there is not gone back to', atHome((await look(p)).hash));
  await p.close();

  // 3. a log with a PIN goes back after the PIN
  p = await tab(); await p.evaluate(h => { me.pin = h; saveDb(); localStorage.setItem('e21cclog.next.resume.' + me.id, JSON.stringify({hash:'#/journal/act', y:0, at:Date.now()})); }, crypto.createHash('sha256').update(P.email + ':2468').digest('hex')); await p.close();
  p = await tab(); const pin = !!(await p.$('#pinForm'));
  await p.fill('#pinForm input', '2468'); await p.click('#pinForm button[type=submit]'); await sleep(1200);
  check('a log with a PIN asks first, then goes back to where the student was', pin && (await look(p)).hash === '#/journal/act', JSON.stringify(await look(p)));
  await p.evaluate(() => { me.pin = null; saveDb(); }); await p.close();

  // 4. closing mid entry: Home, one tap away, never the composer
  p = await tab(); await p.evaluate(() => location.hash = '#/journal/grow'); await sleep(400);
  await p.evaluate(() => location.hash = '#/write/grow'); await sleep(700);
  await p.evaluate(() => { draft.context = {type:'subject', name:'Geography'}; draft.topic = 'Rivers'; draft.answers.g1 = 'I mapped the meanders before I wrote.'; draft.step = 2; saveDraft(); });
  await p.close();
  p = await tab(); s = await look(p);
  const order = await p.evaluate(() => { const m = document.querySelector('#main'); const c = m.querySelector('.carrycard'), w = m.querySelector('.wheelcard'); return !!c && !!(c.compareDocumentPosition(w) & Node.DOCUMENT_POSITION_FOLLOWING) && m.firstElementChild === c; });
  const sub = await p.textContent('.carrycard .tiny').catch(() => '');
  check('reopening after closing mid entry shows Home, not the composer', atHome(s.hash) && !s.composing, JSON.stringify(s));
  check('one card at the top: Carry on with your Geography GROW, with what is done', order && s.card === 'Carry on with your Geography GROW' && /1 of \d+ questions answered/.test(sub), JSON.stringify({card:s.card, sub}));
  const nowList = await p.$$eval('.nxpart:first-of-type .nxlist>li', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  check('the same draft is not listed again in What next', !nowList.some(t => /^Finish your GROW/.test(t)), JSON.stringify(nowList));
  await p.screenshot({path:shots('t21-home-carry-390.png'), animations:'disabled'});
  const a1 = await axe(p); check('Home with the card has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await p.click('.carrycard a.btn'); await sleep(800);
  const cont = await p.evaluate(() => ({composing:document.body.classList.contains('composing'), ask:!!document.querySelector('#rContinue'), step:draft && draft.step, g1:draft && draft.answers.g1, topic:draft && draft.topic}));
  check('Continue opens the entry at the same step, with the words, without asking again', cont.composing && !cont.ask && cont.step === 2 && cont.g1 === 'I mapped the meanders before I wrote.' && cont.topic === 'Rivers', JSON.stringify(cont));
  await p.evaluate(() => location.hash = '#/'); await sleep(600);

  // 5. Not now, and back when the draft is saved again
  await p.click('#carryLater'); await sleep(400);
  const later = await p.evaluate(() => ({card:!!document.querySelector('.carrycard'), now:[...document.querySelectorAll('.nxpart:first-of-type .nxlist>li')].map(x => x.textContent.replace(/\s+/g, ' ').trim())}));
  check('Not now puts the card aside, and What next keeps a quiet line', !later.card && later.now.some(t => /^Finish your GROW entry/.test(t)), JSON.stringify(later));
  await p.reload(); await sleep(1000); check('it stays aside after a reload', !(await p.$('.carrycard')));
  await p.evaluate(() => { me.drafts.grow.saved = Date.now() + 1000; saveDb(); route(); }); await sleep(400);
  check('saving the draft again brings the card back', !!(await p.$('.carrycard')));
  await p.setViewportSize({width:1280, height:800}); await sleep(500); await p.screenshot({path:shots('t21-home-carry-1280.png'), animations:'disabled'}); await p.setViewportSize({width:390, height:844});

  // 6. no draft, no card
  await p.evaluate(() => { delete me.drafts.grow; saveDb(); route(); }); await sleep(400);
  check('without a draft there is no card', !(await p.$('.carrycard')));
  await p.close();

  check('no page errors', !errors.length);
  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
