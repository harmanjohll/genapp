// t20 (A5): a reply in one tap. The console offers three replies and a line of the teacher's own on each
// shared entry; Replies to send lists each student with one Send in Teams; the Inbox can show what waits for a
// reply; the student's Home puts notes from teachers first, and a link with notes on several entries opens there.
const fs = require('fs');
const { v1 } = require('./fixtures/fixture.js');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
(async () => {
  const browser = await launch(); const errors = [];
  const watch = p => p.on('pageerror', e => errors.push(p.url().split('#')[0] + ' ' + e.message));
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const ctx = await browser.newContext({viewport:{width:390, height:844}});
  await ctx.route('https://teams.microsoft.com/**', r => r.fulfill({status:200, contentType:'text/html', body:'<title>Teams</title>ok'}));

  // the student shares her three entries with the console in one link
  const stu = await ctx.newPage(); watch(stu);
  await stu.goto(BASE + 'index.html#/welcome');
  await stu.evaluate(([d, FRESH]) => { localStorage.clear(); localStorage.setItem('e21cclog.fresh', FRESH); d.current = 'p1'; localStorage.setItem('e21cclog', JSON.stringify(d)); }, [v1, launch.FRESH]);
  await stu.goto(BASE + 'index.html#/'); await stu.reload(); await sleep(900);
  const link = (await stu.evaluate(async () => consoleUrl() + '#/in?p=' + await packCDL('i', {v:1, from:await senderInfo(), items:me.entries.map(e => ({t:'e', e:compactEntry(e)}))}))).replace(/^.*teacher\.html/, BASE + 'teacher.html');

  const con = await ctx.newPage(); watch(con);
  await con.goto(link); await sleep(1600);
  const keys = await con.evaluate(() => Object.keys(store.items).sort((a, b) => store.items[a].data.created - store.items[b].data.created));
  check('the console holds the three shared entries', keys.length === 3, JSON.stringify(keys));
  const open = async key => { const isOpen = await con.evaluate(k => openKey === k, key); if (!isOpen){ await con.click(`#inboxList .item[data-key="${key}"]`); await sleep(250); } };
  const pending = () => con.$$eval('#inboxList .mnote.pending p', l => l.map(x => x.textContent));
  const card = () => con.evaluate(() => { const c = document.querySelector('#replyCard'); return {hidden:c.hidden, rows:[...c.querySelectorAll('.replylist li')].map(l => l.textContent.replace(/\s+/g, ' ').trim()), teams:(c.querySelector('[data-replysent]') || {}).href || ''}; });

  // 1. quick replies on the oldest entry (e1, Chemistry)
  await open(keys[0]);
  const chips = await con.$$eval('#inboxList .reader .qchip', l => l.map(b => b.textContent));
  check('the reader offers three replies in one tap', chips.length === 3 && chips[0] === 'Seen. Thank you for sharing this.', JSON.stringify(chips));
  const c0 = await card(); check('Replies to send stays hidden while nothing waits', c0.hidden);
  await con.click('#inboxList .reader .qchip >> nth=0'); await sleep(300);
  check('one tap readies the reply as a note on the whole entry', JSON.stringify(await pending()) === JSON.stringify(['Seen. Thank you for sharing this.']));
  check('that reply cannot be readied twice', await con.$eval('#inboxList .reader .qchip', b => b.disabled && b.getAttribute('aria-pressed') === 'true'));
  await con.fill('#inboxList .reader [data-quickown]', 'Why did the first titre run high?'); await con.press('#inboxList .reader [data-quickown]', 'Enter'); await sleep(300);
  check('a line of the teacher’s own is readied too, with Enter', (await pending()).includes('Why did the first titre run high?'));
  await con.click('#inboxList .reader .mnote.pending .x >> nth=1'); await sleep(300);
  check('a readied reply can be removed before it is sent', JSON.stringify(await pending()) === JSON.stringify(['Seen. Thank you for sharing this.']));
  const c1 = await card();
  check('Replies to send lists the student, with one reply', !c1.hidden && c1.rows.length === 1 && /^Aisha Tan\s*1 reply ·/.test(c1.rows[0]), JSON.stringify(c1.rows));

  // 2. a second reply on the newest entry (e3, Football CCA)
  await open(keys[2]); await con.click('#inboxList .reader .qchip >> nth=1'); await sleep(400);
  check('Replies to send asks for the teacher’s name while replies would be signed Your teacher', !!(await con.$('#replyCard #rName')));
  await con.fill('#rName', 'Ms Lim'); await con.press('#rName', 'Enter'); await sleep(500);
  const c2 = await card(); const t = new URL(c2.teams); const msg = t.searchParams.get('message') || ''; const noteLink = msg.slice(msg.indexOf('http'));
  check('once saved, the replies are signed with that name', /^Ms Lim left 2 notes/.test(msg) && !(await con.$('#replyCard #rName')), msg.slice(0, 40));
  check('one student, two replies, one Teams chat addressed to her', c2.rows.length === 1 && /2 replies/.test(c2.rows[0]) && t.searchParams.get('users') === 'aisha_tan@students.edu.sg' && /index\.html#\/note\?n=CDL/.test(noteLink), JSON.stringify({rows:c2.rows, users:t.searchParams.get('users')}));
  await con.screenshot({path:shots('t20-console-replies.png'), animations:'disabled'});
  const a1 = await axe(con); check('the console with quick replies and Replies to send has no serious or critical accessibility issues', !a1.length, a1.join(' | '));

  // 3. Waiting for a reply: only the entry no one has answered
  await con.selectOption('#fShow', 'wait'); await sleep(300);
  const wait = await con.$$eval('#inboxList .item', l => l.map(b => b.dataset.key));
  check('Waiting for a reply shows only the entry without a reply', JSON.stringify(wait) === JSON.stringify([keys[1]]), JSON.stringify(wait));
  await con.selectOption('#fShow', 'new'); await sleep(200);

  // 4. Send in Teams: one tap, and the replies are marked sent
  const [pop] = await Promise.all([ctx.waitForEvent('page'), con.click('#replyCard [data-replysent]')]); await sleep(500);
  check('Send in Teams opens the chat', /teams\.microsoft\.com/.test(pop.url()), pop.url().slice(0, 60)); await pop.close();
  const c3 = await card(); const left = await con.evaluate(() => Object.values(store.notes).flat().filter(n => !n.sentAt).length);
  check('after the tap the replies are marked sent and the card goes', c3.hidden && left === 0, JSON.stringify({hidden:c3.hidden, left}));

  // 5. the student: a link with notes on two entries opens Home, with From your teachers first
  await stu.goto(noteLink); await sleep(1200);
  const home = await stu.evaluate(() => { const m = document.querySelector('#main'); const f = m.querySelector('.fromcard'), w = m.querySelector('.wheelcard');
    return {hash:location.hash, card:!!f, first:!!f && !!w && !!(f.compareDocumentPosition(w) & Node.DOCUMENT_POSITION_FOLLOWING), items:f ? [...f.querySelectorAll('.fromlist > li')].map(l => l.textContent.replace(/\s+/g, ' ').trim()) : [],
      now:[...document.querySelectorAll('.nxpart:first-of-type .nxlist>li')].map(l => l.textContent.replace(/\s+/g, ' ').trim())}; });
  check('notes on two entries open Home, where From your teachers comes first', home.hash === '#/' && home.card && home.first, JSON.stringify({hash:home.hash, card:home.card, first:home.first}));
  check('each note shows who wrote it, the words and the entry', home.items.length === 2 && home.items.every(x => /^Ms Lim/.test(x)) && home.items.some(x => /Clear thinking here\. Keep going\..*Football CCA/.test(x)) && home.items.some(x => /Seen\. Thank you for sharing this\..*Chemistry/.test(x)), JSON.stringify(home.items));
  check('the note is not repeated in What next', !home.now.some(x => /’s note/.test(x)), JSON.stringify(home.now));
  await stu.screenshot({path:shots('t20-home-from-teachers.png'), animations:'disabled'});
  const a2 = await axe(stu); check('Home with From your teachers has no serious or critical accessibility issues', !a2.length, a2.join(' | '));
  await stu.click('.fromcard [data-readnote] >> nth=0'); await sleep(400);
  check('Mark as read takes a note off the card', await stu.$$eval('.fromcard .fromlist > li', l => l.length) === 1);
  await stu.click('.fromcard .fromlist a.btn'); await sleep(500);
  const ent = await stu.evaluate(() => location.hash); await stu.evaluate(() => location.hash = '#/'); await sleep(500);
  check('Open the entry goes to it, and once read the card is gone', /^#\/entry\//.test(ent) && !(await stu.$('.fromcard')), ent);

  // 6. a link with notes on one entry still opens that entry
  await open(keys[1]); await con.click('#inboxList .reader .qchip >> nth=2'); await sleep(400);
  const one = new URL((await card()).teams).searchParams.get('message'); const oneLink = one.slice(one.indexOf('http'));
  await stu.goto(oneLink); await sleep(1000);
  check('a note on one entry opens that entry', /^#\/entry\/e2/.test(await stu.evaluate(() => location.hash)), await stu.evaluate(() => location.hash));

  check('no page errors', !errors.length);
  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
