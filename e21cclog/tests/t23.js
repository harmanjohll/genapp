// t23 (D2 and D1): a plan that names a day is asked about on that day, not before (Yes, Partly, Not yet);
// a plan with no day is asked a week on; nothing is asked three weeks past; the composer's answer is not asked
// again. A weekly reminder is a calendar file, from Settings.
const fs = require('fs');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = JSON.parse(fs.readFileSync(__dirname + '/fixtures/seed3.json', 'utf8')); const P = seed.profiles[seed.current];
const SG = s => new Date(s + '+08:00').getTime();
// only the plans this test sets: every other entry's plan is cleared
for (const e of P.entries){ if (e.answers.r2 !== undefined) e.answers.r2 = ''; if (e.answers.t1 !== undefined) e.answers.t1 = ''; }
const plan = (id, created, text, kind = 'grow') => { const e = JSON.parse(JSON.stringify(P.entries[0])); Object.assign(e, {id, kind:'grow', created, updated:created, notes:[], sent:{}}); e.answers = Object.assign({}, e.answers, {r2:text}); return e; };
P.done = {}; P.planChecks = {}; delete P.reminder;
P.entries.push(plan('pA', SG('2026-11-02T16:00:00'), 'Practise the titration on Thursday after CCA.'));
(async () => {
  const browser = await launch(); const errors = [];
  const ctx = await browser.newContext({viewport:{width:390, height:844}, timezoneId:'Asia/Singapore', acceptDownloads:true});
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
  await p.clock.install({time:SG('2026-11-04T10:00:00')});
  await p.goto(BASE + 'index.html'); await p.evaluate(s => localStorage.setItem('e21cclog', s), JSON.stringify(seed)); await p.goto('about:blank'); await p.goto(BASE + 'index.html#/'); await sleep(1200);
  const at = async iso => { await p.clock.setSystemTime(SG(iso)); await p.evaluate(() => { location.hash = '#/'; route(); }); await sleep(500); };
  const item = () => p.evaluate(() => { const li = document.querySelector('.nxlist .nxplan'); return li ? {text:li.textContent.replace(/\s+/g, ' ').trim(), ask:li.querySelectorAll('[data-plan]').length} : null; });

  // 1. reading the day a plan names, written on Monday 2 Nov 2026 at 4 pm
  const days = await p.evaluate(base => {
    const f = t => { const d = planDue(t, base); return d ? new Date(d).toDateString().slice(0, 10) : 'none'; };
    return ['Practise on Thursday after CCA', 'tomorrow after school', 'next Monday', 'Monday', 'in 3 days', 'in two weeks', 'this weekend', 'next week', 'end of the week',
      'on 12 Nov', '12/11', 'Ask Ms Lim in Thursday’s lesson', 'tonight for 20 minutes', 'every Wednesday', 'before the test', 'with my friends after CCA'].map(f);
  }, SG('2026-11-02T16:00:00'));
  const want = ['Thu Nov 05', 'Tue Nov 03', 'Mon Nov 09', 'Mon Nov 09', 'Thu Nov 05', 'Mon Nov 16', 'Sat Nov 07', 'Mon Nov 09', 'Fri Nov 06', 'Thu Nov 12', 'Thu Nov 12', 'Thu Nov 05', 'Mon Nov 02', 'Wed Nov 04', 'none', 'none'];
  check('16 phrasings read to the right day, or to none', JSON.stringify(days) === JSON.stringify(want), JSON.stringify(days.map((d, i) => d === want[i] ? '' : d + '≠' + want[i])));

  // 2. Thursday's plan: shown on Wednesday, asked on Thursday
  await at('2026-11-04T10:00:00'); let it = await item();
  check('on Wednesday the plan shows, with its day, and nothing to answer yet', it && /^Your plan for Thu, 5 Nov: Practise the titration/.test(it.text) && !it.ask, JSON.stringify(it));
  await at('2026-11-05T10:00:00'); it = await item();
  check('on Thursday it asks: Did you do it? with Yes, Partly and Not yet', it && /^Did you do it\? “Practise the titration/.test(it.text) && it.ask === 3 && /From your Chemistry GROW on Mon, 2 Nov, for Thu, 5 Nov/.test(it.text), JSON.stringify(it));
  await p.screenshot({path:shots('t23-plan-ask-390.png'), animations:'disabled'});
  const a1 = await axe(p); check('Home with the question has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  check('the wording never says missed or have not', !/missed|have not|haven’t/i.test(await p.textContent('#main')));
  // Not yet: quiet for three days, then asked again
  await p.click('[data-plan="notyet"]'); await sleep(700);
  await at('2026-11-07T10:00:00'); it = await item();
  check('Not yet: not asked again for three days', !it || !it.ask, JSON.stringify(it));
  await at('2026-11-08T11:00:00'); it = await item();
  check('three days on, it is asked again', it && it.ask === 3, JSON.stringify(it));
  // a second plan, with no day, written on Sunday
  await p.evaluate(e => { me.entries.push(Object.assign(JSON.parse(JSON.stringify(me.entries.find(x => x.id === 'pA'))), e)); saveDb(); }, {id:'pB', created:SG('2026-11-08T09:00:00'), updated:SG('2026-11-08T09:00:00'), answers:{g1:'x', r2:'Revise the notes before the test.'}});
  await p.click('[data-plan="yes"]'); await sleep(700);
  const yes = await p.evaluate(() => ({done:!!me.done.pA, text:(document.querySelector('.nxlist .nxplan') || {}).textContent || ''}));
  check('Yes counts in Plans you followed through', yes.done && /Plans you followed through: 1/.test(yes.text), JSON.stringify(yes));
  check('a plan with no day shows as Your plan, to be asked in a week', /Your plan: Revise the notes before the test\..*ask how it went in a week/.test(yes.text.replace(/\s+/g, ' ')), yes.text.replace(/\s+/g, ' '));
  await at('2026-11-14T10:00:00'); it = await item(); check('six days on, still not asked', it && !it.ask, JSON.stringify(it));
  await at('2026-11-15T10:00:00'); it = await item(); check('a week on, it is asked', it && it.ask === 3, JSON.stringify(it));
  await p.click('[data-plan="partly"]'); await sleep(700);
  const partly = await p.evaluate(() => ({c:(me.planChecks.pB || {}).answer, done:!!me.done.pB}));
  await at('2026-11-16T10:00:00'); it = await item();
  check('Partly is kept, is not counted as done, and is not asked again', partly.c === 'partly' && !partly.done && !it, JSON.stringify({partly, it}));

  // 3. three weeks past its day, a plan is left quietly
  await p.evaluate(e => { me.entries.push(Object.assign(JSON.parse(JSON.stringify(me.entries.find(x => x.id === 'pA'))), e)); saveDb(); }, {id:'pC', created:SG('2026-11-16T09:00:00'), updated:SG('2026-11-16T09:00:00'), answers:{g1:'x', r2:'Finish the poster on Tuesday.'}});
  await at('2026-12-09T10:00:00'); it = await item();
  check('22 days past its day, a plan is not asked about', !it, JSON.stringify(it));

  // 4. the composer's own question is not asked again on Home
  await p.evaluate(e => { me.entries.push(Object.assign(JSON.parse(JSON.stringify(me.entries.find(x => x.id === 'pA'))), e)); saveDb(); }, {id:'pD', created:SG('2026-12-07T09:00:00'), updated:SG('2026-12-07T09:00:00'), answers:{g1:'x', r2:'Read chapter 4 on Wednesday.'}});
  await p.evaluate(() => { location.hash = '#/write/grow'; }); await sleep(900);
  await p.evaluate(() => { draft.step = 2; renderComposer(); }); await sleep(400);   // R: the plan question, with last time's plan above it
  await p.click('[data-ft="no"][data-eid="pD"]').catch(() => {}); await sleep(300);
  await at('2026-12-10T10:00:00'); it = await item();
  check('answered in the composer, it is not asked again on Home', (await p.evaluate(() => (me.planChecks.pD || {}).answer)) === 'no' && !it, JSON.stringify(it));

  // 5. the weekly reminder: a calendar file
  const ics = await p.evaluate(now => [[4, '15:30'], [1, '07:05'], [0, '20:00']].map(([day, time]) => icsWeekly({day, time, url:'https://harmanjohll.github.io/genapp/e21cclog/index.html', now})), SG('2026-11-04T10:00:00'));
  const icsOk = ics.map((t, i) => { const [day, hm, by, start] = [[4, '1530', 'TH', '20261105T153000'], [1, '0705', 'MO', '20261109T070500'], [0, '2000', 'SU', '20261108T200000']][i];
    const lines = t.split('\r\n'); return t.endsWith('\r\n') && !/[^\r]\n/.test(t) && lines.every(l => Buffer.byteLength(l) <= 75) && t.includes(`RRULE:FREQ=WEEKLY;BYDAY=${by}`) && t.includes(`DTSTART;TZID=Asia/Singapore:${start}`) && t.includes('TZID:Asia/Singapore') && t.includes('SUMMARY:Write a GROW in your E21CC Log') && t.includes('URL:https://harmanjohll.github.io/genapp/e21cclog/index.html'); });
  check('the calendar file: weekly on the day, at the time, Singapore time, with the title and the link, in folded CRLF lines', icsOk.every(Boolean), JSON.stringify(icsOk));
  await at('2026-12-10T10:00:00');
  const offer = await p.evaluate(() => [...document.querySelectorAll('.nxlist li')].some(l => /Remind me each week/.test(l.textContent)));
  await p.evaluate(() => { location.hash = '#/settings?s=remind'; }); await sleep(600);
  await p.selectOption('#rDay', '4'); await p.fill('#rTime', '16:15');
  const [dl] = await Promise.all([p.waitForEvent('download', {timeout:5000}).catch(() => null), p.click('#rAdd')]); await sleep(500);
  const file = dl ? fs.readFileSync(await dl.path(), 'utf8') : '';
  const kept = await p.evaluate(() => ({r:me.reminder, line:(document.querySelector('#rNow') || {}).textContent || ''}));
  check('Add to my calendar gives the file, and the reminder is kept and shown', dl && dl.suggestedFilename() === 'E21CC Log reminder.ics' && /BYDAY=TH/.test(file) && /T161500/.test(file) && kept.r && kept.r.day === 4 && kept.r.time === '16:15' && /Thursdays at 4\.15 pm\./.test(kept.line), JSON.stringify({name:dl && dl.suggestedFilename(), kept}));
  const a2 = await axe(p); check('the reminder settings have no serious or critical accessibility issues', !a2.length, a2.join(' | '));
  await p.screenshot({path:shots('t23-reminder-390.png'), animations:'disabled'});
  await p.evaluate(() => { location.hash = '#/'; }); await sleep(500);
  const gone = await p.evaluate(() => [...document.querySelectorAll('.nxlist li')].some(l => /Remind me each week/.test(l.textContent)));
  check('Home offers Remind me each week until a reminder exists', offer && !gone, JSON.stringify({offer, gone}));

  check('no page errors', !errors.length, errors.join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
