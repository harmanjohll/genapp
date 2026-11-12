// t34 (6.0): a teacher validates every claim. A claim waits for a teacher, whatever the coach reads in the words;
// the console asks for a verdict and advice of at least ten words on each claim, with no one tap replies; the review
// travels in the note link; the student sees Affirmed or Not yet with the advice; only affirmed claims secure a
// statement; a changed sentence waits again; a note starts an ACT; the claim step nudges once; Home speaks of
// occasions, not weeks; the console's Class grid shows what the class says.
const fs = require('fs');
const { v1 } = require('./fixtures/fixture.js');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const SID = 'ct1.l1';
(async () => {
  const browser = await launch(); const errors = [];
  const watch = p => p.on('pageerror', e => errors.push(p.url().split('#')[0] + ' ' + e.message));
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const ctx = await browser.newContext({viewport:{width:1280, height:900}});
  await ctx.route('https://teams.microsoft.com/**', r => r.fulfill({status:200, contentType:'text/html', body:'<title>Teams</title>ok'}));

  // Aisha claims the same statement in Chemistry (80 days ago) and Football CCA (3 days ago)
  const stu = await ctx.newPage(); watch(stu);
  await stu.goto(BASE + 'index.html#/welcome');
  await stu.evaluate(([d, FRESH]) => { localStorage.clear(); localStorage.setItem('e21cclog.fresh', FRESH); d.current = 'p1'; localStorage.setItem('e21cclog', JSON.stringify(d)); }, [v1, launch.FRESH]);
  await stu.goto(BASE + 'index.html#/'); await stu.reload(); await sleep(900);
  await stu.evaluate(sid => { me.level = 3; me.experiences = Object.assign({subjects:[], cca:'', others:[], levels:{}}, me.experiences || {}); me.experiences.subjects = ['Chemistry', 'English Language']; me.experiences.cca = 'Football'; for (const id of ['e1', 'e3']){ const e = me.entries.find(x => x.id === id); e.links = [{sid, quote:e.answers.g1, at:e.created}]; } saveDb(); }, SID);
  const st = () => stu.evaluate(sid => { const s = statementById(sid); const x = securedOf(me.entries, s); return {state:x.state, secured:x.secured, waiting:x.waiting, notyet:x.notyet, words:me.entries.filter(e => (e.links || []).length).map(e => claimWord(e, s).word)}; }, SID);
  const s0 = await st();
  check('a claim waits for a teacher, whatever the coach reads in the words', s0.state === 'linked' && s0.waiting && !s0.secured && s0.words.every(w => w === 'Waiting for a teacher'), JSON.stringify(s0));
  await stu.goto(BASE + 'index.html#/entry/e1'); await sleep(700);
  check('the entry says its claim is waiting for a teacher', /Waiting for a teacher/.test(await stu.textContent('#e21cc')));

  // the console: a verdict and real advice on each claim, no one tap replies
  const link = (await stu.evaluate(async () => consoleUrl() + '#/in?p=' + await packCDL('i', {v:1, from:await senderInfo(), items:me.entries.map(e => ({t:'e', e:compactEntry(e)}))}))).replace(/^.*teacher\.html/, BASE + 'teacher.html');
  const con = await ctx.newPage(); watch(con);
  await con.goto(link); await sleep(1600);
  await con.evaluate(() => { store.me.name = 'Ms Lim'; store.me.role = 'Subject teacher'; save(); });
  const key = id => con.evaluate(id => Object.keys(store.items).find(k => k.endsWith('|' + id)), id);
  const open = async id => { const k = await key(id); if (!(await con.evaluate(k => openKey === k, k))){ await con.click(`#inboxList .item[data-key="${k}"]`); await sleep(300); } return k; };
  const k1 = await open('e1');
  check('no one tap replies are offered', !(await con.$('#inboxList .qchip')));
  check('the reader asks the teacher to check the claim, with the student’s sentence', /Check this claim/.test(await con.textContent('#inboxList .reader .review')) && /I checked both readings/.test(await con.textContent('#inboxList .reader .review q')));
  await con.click('#inboxList .reader [data-verdict][data-v="yes"]'); await sleep(250);
  await con.fill('#inboxList .reader [data-advice]', 'Good checking of both readings.');
  await con.dispatchEvent('#inboxList .reader [data-advice]', 'input'); await sleep(100);
  check('advice under ten words cannot be saved', await con.$eval('#inboxList .reader [data-saverev]', b => b.disabled) && /more/.test(await con.textContent('#inboxList .reader [data-wc]')));
  await con.fill('#inboxList .reader [data-advice]', 'You checked both readings and repeated the titre for a reason you could name. Next, say what the two readings told you.');
  await con.dispatchEvent('#inboxList .reader [data-advice]', 'input'); await sleep(100);
  check('advice of ten words or more can be saved', !(await con.$eval('#inboxList .reader [data-saverev]', b => b.disabled)));
  await con.click('#inboxList .reader [data-saverev]'); await sleep(400);
  const n1 = await con.evaluate(k => store.notes[k].filter(n => n.verdict), k1);
  check('the review is kept as a note on the claim, with its verdict and the sentence read', n1.length === 1 && n1[0].verdict === 'yes' && n1[0].sid === 'ct1.l1' && n1[0].anchor === 'claim:ct1.l1' && /checked both readings/.test(n1[0].quote), JSON.stringify(n1));
  const a1 = await axe(con); check('the console reader with a claim to check has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await con.screenshot({path:shots('t34-console-review.png'), animations:'disabled'});
  await open('e3');
  await con.click('#inboxList .reader [data-verdict][data-v="notyet"]'); await sleep(250);
  await con.fill('#inboxList .reader [data-advice]', 'You say the team decided together, but not how you reasoned about the switch. Tell me why you switched.');
  await con.dispatchEvent('#inboxList .reader [data-advice]', 'input'); await sleep(100);
  await con.click('#inboxList .reader [data-saverev]'); await sleep(400);
  await open('e2');
  check('an entry with no claim asks for one, and still takes a note', /No claim on this entry/.test(await con.textContent('#inboxList .reader')) && !!(await con.$('#inboxList .reader [data-note]')));
  const replies = await con.evaluate(() => { const c = document.querySelector('#replyCard'); return {hidden:c.hidden, text:c.textContent.replace(/\s+/g, ' ')}; });
  check('Replies to send counts the two reviews', !replies.hidden && /2 replies/.test(replies.text), replies.text.slice(0, 120));
  const noteHref = async () => { const sk = await con.evaluate(() => Object.keys(store.students)[0]); const p = await con.evaluate(async sk => { const r = await noteLink(sk); return r.link; }, sk); return p.replace(/^.*index\.html/, BASE + 'index.html'); };
  const nl1 = await noteHref();
  check('the note link carries the verdicts', await con.evaluate(async l => { const d = (await unpackCDL(l.split('n=')[1])).data; return d.notes.filter(n => n.verdict).length === 2; }, nl1));
  await con.evaluate(() => { const now = Date.now(); for (const {n} of pendingNotes(Object.keys(store.students)[0])) n.sentAt = now; save(); });

  // the student opens the link: Affirmed on one, Not yet on the other
  await stu.goto(nl1); await sleep(1400);
  const s1 = await st();
  check('one affirmed claim is a start, not yet secured; the other says not yet', s1.state === 'started' && !s1.secured && s1.words.some(w => /Not yet: see Ms Lim/.test(w)), JSON.stringify(s1));
  await stu.goto(BASE + 'index.html#/'); await sleep(800);
  const home = await stu.textContent('.fromcard');
  check('Home shows the reviews from the teacher, with the verdicts', /Affirmed/.test(home) && /Not yet/.test(home) && /Ms Lim/.test(home), home.replace(/\s+/g, ' ').slice(0, 160));
  check('each review offers Act on this feedback', (await stu.$$('.fromcard [data-actnote]')).length === 2);
  await stu.goto(BASE + 'index.html#/entry/e1'); await sleep(800);
  const card = await stu.textContent('#e21cc');
  check('the entry shows Affirmed with the teacher’s advice', /Affirmed/.test(card) && /repeated the titre/.test(card), card.replace(/\s+/g, ' ').slice(0, 200));
  const a2 = await axe(stu); check('the student’s entry with a review has no serious or critical accessibility issues', !a2.length, a2.join(' | '));
  await stu.screenshot({path:shots('t34-student-affirmed.png'), animations:'disabled'});

  // a second review affirms the Football claim: two contexts, more than two weeks apart, both affirmed: secured
  await open('e3');
  await con.click('#inboxList .reader [data-verdict][data-v="yes"]'); await sleep(250);
  await con.fill('#inboxList .reader [data-advice]', 'You explained the switch to me after training: the marking failed at the near post, so you changed it. That is reasoning.');
  await con.dispatchEvent('#inboxList .reader [data-advice]', 'input'); await sleep(100);
  await con.click('#inboxList .reader [data-saverev]'); await sleep(400);
  const nl2 = await noteHref();
  await stu.goto(nl2); await sleep(1400);
  const s2 = await st();
  check('two affirmed claims, in two contexts two weeks apart, secure the statement', s2.secured && s2.state === 'secured', JSON.stringify(s2));
  const changed = await stu.evaluate(sid => { const e = me.entries.find(x => x.id === 'e3'); const l = e.links.find(x => x.sid === sid); const was = l.quote; l.quote = 'We decided together to switch when it did not work.'; const r = {after:claimWord(e, statementById(sid)).word, secured:securedOf(me.entries, statementById(sid)).secured}; l.quote = was; return r; }, SID);
  check('pointing to a different sentence sends the claim back to the teacher', changed.after === 'Waiting for a teacher' && !changed.secured, JSON.stringify(changed));

  // a note starts an ACT, with the note as its feedback and the entry's experience
  await stu.goto(BASE + 'index.html#/entry/e1'); await sleep(700);
  await stu.click('[data-actnote] >> nth=0'); await sleep(900);
  const act = await stu.evaluate(() => ({kind:draft && draft.kind, ctx:draft && draft.context.name, fb:draft && draft.feedbackText, from:draft && draft.fromNote}));
  check('Act on this feedback opens an ACT about that experience, with the note as the feedback', act.kind === 'act' && act.ctx === 'Chemistry' && /^Ms Lim: /.test(act.fb || '') && act.from && act.from.eid === 'e1', JSON.stringify(act));
  await stu.click('#cClose'); await sleep(400);

  // the claim step nudges once when there is no claim
  await stu.evaluate(() => { delete me.drafts.grow; saveDb(); });
  await stu.goto(BASE + 'index.html#/write/grow?x=subject:Physics'); await sleep(700);
  await stu.evaluate(() => { draft.answers = {g1:'I understand moments are force times distance.', g2:'I would use a seesaw.', r1:'I do not yet get the units.', r2:'Do Q4 on Friday.', o1:'Opening a door.', o2:'I told my brother.', w2:'Levers.', w1:'They multiply force.'}; draft.step = stepsOf().indexOf('claim'); draft.claims = []; renderComposer(); });
  await sleep(300); await stu.click('#cNext'); await sleep(400);
  const n0 = await stu.evaluate(() => ({step:stepsOf()[draft.step], nudge:!!document.querySelector('#claimNudge'), text:(document.querySelector('#claimNudge') || {}).textContent || ''}));
  check('Next without a claim stays on the step and asks for one, once', n0.step === 'claim' && n0.nudge && /Your teacher can only affirm a claim you make/.test(n0.text), JSON.stringify(n0));
  await stu.click('#cNext'); await sleep(400);
  check('a second Next goes on without one', await stu.evaluate(() => stepsOf()[draft.step]) === 'readback');
  await stu.click('#cClose'); await sleep(400);

  // Home speaks of occasions, not of a GROW every week
  await stu.evaluate(() => { me.entries = me.entries.filter(e => Date.now() - e.created > 9 * 864e5); saveDb(); });
  await stu.goto(BASE + 'index.html#/'); await sleep(800);
  const hm = await stu.textContent('#app');
  check('Home asks for a GROW when a topic, unit or camp ends, not every week', /Finished a topic, a unit or a camp\?/.test(hm) && !/Write a GROW this week/.test(hm) && !/one GROW a week/.test(hm));

  // the console's Class grid: what the class says
  await con.evaluate(() => { for (const it of Object.values(store.items)) if (it.kind === 'e') it.data.created = Date.now() - 2 * 864e5; save(); showTab('grid'); renderGrid(); });
  await sleep(400);
  const sig = await con.textContent('#signalsBox');
  check('the Class grid shows what the class says it does not yet understand, by topic', /What your class says/.test(sig) && /Not yet understood/.test(sig) && /why we swirl the flask/.test(sig) && /Chemistry · Titration/.test(sig), sig.replace(/\s+/g, ' ').slice(0, 200));
  const a3 = await axe(con); check('the Class grid with what the class says has no serious or critical accessibility issues', !a3.length, a3.join(' | '));

  check('no page errors', !errors.length, errors.join(' | '));
  await browser.close();
  console.log(fails ? `${fails} FAILED` : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); console.log('FAIL crashed'); process.exit(1); });
