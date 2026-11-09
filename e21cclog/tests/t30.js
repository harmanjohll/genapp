// t30 (V3): the calendar. The calendar file (all day and timed, Singapore time, a reminder each); the four views
// (coming up, week, month, by goal) showing the student's own events, goal checkpoints and By dates, and plan days;
// adding, editing and removing an event; putting one, or everything coming up, in the student's own calendar; the
// backup merge; nothing in what is shared; Home's Coming up; axe and no page errors.
const fs = require('fs');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = JSON.parse(fs.readFileSync(__dirname + '/fixtures/seed3.json', 'utf8')); const P = seed.profiles[seed.current];
const day = n => new Date(Date.now() + n * 864e5).toLocaleDateString('en-CA');
const now = Date.now();
// a goal with a checkpoint and a By date, and an entry whose plan names a day this week
P.goals = [{id:'g1', kind:'grade', subject:'Chemistry', level:'G3', now:'B4', target:'B3', result:'eoy', by:day(10), steps:[], checks:[{id:'c1', text:'Redo the WA2 paper', date:day(2), done:false}], created:now, updated:now}];
const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(Date.now() + 2 * 864e5).getDay()];
P.entries.push(Object.assign(JSON.parse(JSON.stringify(P.entries.find(e => e.kind === 'grow'))), {id:'pe1', created:now - 3600e3, updated:now - 3600e3, answers:{g1:'I understood rates.', r2:`Redo two rate questions on ${WD} after school`}, notes:[]}));
P.planChecks = {}; delete P.backup;
(async () => {
  const browser = await launch(); const errors = [];
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const ctx = await browser.newContext({viewport:{width:390, height:844}});
  await ctx.addInitScript(() => { navigator.canShare = d => !!(d && d.files && d.files.length); navigator.share = async d => { const f = d.files[0]; window.__shared = {name:f.name, type:f.type, text:await f.text()}; }; });
  const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
  await p.goto(BASE + 'school/beatty.json'); await p.evaluate(s => localStorage.setItem('e21cclog', s), JSON.stringify(seed)); await p.goto('about:blank'); await p.goto(BASE + 'index.html#/'); await sleep(1100);

  // 1. the calendar file
  const ics = await p.evaluate(d => icsEvents([{uid:'a1', title:'Chemistry WA2', date:d, time:''}, {uid:'a2', title:'Band, sectional', date:d, time:'15:30'}], Date.UTC(2026, 10, 8)), day(4));
  const d4 = day(4).replace(/-/g, ''); const next = new Date(day(4) + 'T00:00:00'); next.setDate(next.getDate() + 1); const d5 = next.toLocaleDateString('en-CA').replace(/-/g, '');
  check('the calendar file: an all day event and a timed one at Singapore time, each with a reminder, CRLF', ics.includes(`DTSTART;VALUE=DATE:${d4}`) && ics.includes(`DTEND;VALUE=DATE:${d5}`) && ics.includes(`DTSTART;TZID=Asia/Singapore:${d4}T153000`) && ics.includes(`DTEND;TZID=Asia/Singapore:${d4}T163000`) && ics.includes('TRIGGER:PT8H') && ics.includes('TRIGGER:-PT30M') && ics.includes('SUMMARY:Band\\, sectional') && (ics.match(/BEGIN:VEVENT/g) || []).length === 2 && /\r\n/.test(ics) && !/[^\r]\n/.test(ics));

  // 2. coming up: the checkpoint, the goal's date and the plan day, by week
  await p.evaluate(() => { location.hash = '#/goals'; }); await sleep(500);
  await p.click('.gswitch a[href="#/goals/calendar"]'); await sleep(500);
  const up = await p.evaluate(() => ({views:[...document.querySelectorAll('.cviews a')].map(a => a.textContent), rows:[...document.querySelectorAll('.cal .crow')].map(r => r.textContent.replace(/\s+/g, ' ').trim()), weeks:document.querySelectorAll('.cal .cweek').length}));
  check('the calendar sits beside Goals, with Coming up, Week, Month and By goal', up.views.join('|') === 'Coming up|Week|Month|By goal', JSON.stringify(up.views));
  check('Coming up shows the goal’s checkpoint and date, and the day the plan names, under their weeks', up.rows.some(t => /Checkpoint Redo the WA2 paper/.test(t)) && up.rows.some(t => /Goal Chemistry: B4 to B3/.test(t)) && up.rows.some(t => /Plan Redo two rate questions/.test(t)) && up.weeks >= 1, JSON.stringify(up.rows));

  // 3. add an event, linked to the goal
  await p.click('#cAdd'); await sleep(300);
  await p.fill('#evTitle', 'Chemistry practical test'); await p.fill('#evDate', day(3)); await p.fill('#evTime', '15:30'); await p.selectOption('#evGoal', 'g1');
  const a1 = await axe(p); check('the Add dialog has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await p.click('#evSave'); await sleep(500);
  const ev = await p.evaluate(() => ({events:me.events.map(e => [e.title, e.type, e.time, e.goal].join('|')), row:[...document.querySelectorAll('.cal .crow')].map(r => r.textContent.replace(/\s+/g, ' ').trim()).find(t => /practical/.test(t)) || ''}));
  check('an assessment is added with its day, time and goal, and shows in Coming up', ev.events.join() === 'Chemistry practical test|assessment|15:30|g1' && /Assessment Chemistry practical test 3\.30 pm · Chemistry: B4 to B3/.test(ev.row), JSON.stringify(ev));
  await p.screenshot({path:shots('t30-coming-up-390.png'), animations:'disabled', fullPage:true});
  const a2 = await axe(p); check('Coming up has no serious or critical accessibility issues', !a2.length, a2.join(' | '));

  // 4. week, month and by goal
  await p.click('.cviews a:nth-child(2)'); await sleep(500);
  const wk0 = await p.evaluate(() => ({days:document.querySelectorAll('.cdays > li').length, today:!!document.querySelector('.cdays li.today')}));
  await p.evaluate(d => { location.hash = '#/goals/calendar?v=week&d=' + d; }, day(3)); await sleep(400);
  const wk = await p.evaluate(d => { const li = [...document.querySelectorAll('.cdays > li')].find(x => /practical/.test(x.textContent)); return {days:document.querySelectorAll('.cdays > li').length, day:li ? li.querySelector('h2').textContent : ''}; }, day(3));
  const want = await p.evaluate(d => fmtDay(goalDate(d)), day(3));
  check('Week shows seven days with today marked, and the event under its own day', wk0.days === 7 && wk0.today && wk.days === 7 && wk.day.startsWith(want), JSON.stringify({wk0, wk, want}));
  await p.click('.cnav a[aria-label="Next week"]'); await sleep(400);
  const wk2 = await p.evaluate(() => location.hash);
  check('Week moves to the next week', /v=week&d=\d{4}-\d{2}-\d{2}/.test(wk2), wk2);
  const a3 = await axe(p); check('Week has no serious or critical accessibility issues', !a3.length, a3.join(' | '));
  await p.evaluate(() => { location.hash = '#/goals/calendar?v=month'; }); await sleep(500);
  const mo = await p.evaluate(d => { const c = document.querySelector(`.cgc[href$="d=${d}"]`); return {cells:document.querySelectorAll('.cgc').length, label:c ? c.getAttribute('aria-label') : '', badge:c ? (c.querySelector('i') || {}).textContent : ''}; }, day(3));
  check('Month shows six weeks of days, and the event’s day says how many items it has', mo.cells === 42 && (/1 item|2 items/.test(mo.label) || mo.label === ''), JSON.stringify(mo));
  await p.evaluate(d => { location.hash = '#/goals/calendar?v=month&d=' + d; }, day(3)); await sleep(500);
  const sel = await p.evaluate(() => ({cur:!!document.querySelector('.cgc[aria-current="date"]'), list:[...document.querySelectorAll('.cal .crow')].map(r => r.textContent.replace(/\s+/g, ' ').trim())}));
  check('choosing a day lists what is on it', sel.cur && sel.list.some(t => /practical/.test(t)), JSON.stringify(sel));
  await p.screenshot({path:shots('t30-month-390.png'), animations:'disabled', fullPage:true});
  const a4 = await axe(p); check('Month has no serious or critical accessibility issues', !a4.length, a4.join(' | '));
  await p.evaluate(() => { location.hash = '#/goals/calendar?v=goal'; }); await sleep(500);
  const bg = await p.evaluate(() => [...document.querySelectorAll('.cgoal')].map(s => s.textContent.replace(/\s+/g, ' ').trim()));
  check('By goal lists the goal’s checkpoint, date and linked event together', bg.length === 1 && /Redo the WA2 paper/.test(bg[0]) && /practical test/.test(bg[0]) && /Goal Chemistry/.test(bg[0]), JSON.stringify(bg));

  // 5. one event, then everything coming up, into the student's own calendar
  await p.evaluate(() => { location.hash = '#/goals/calendar'; }); await sleep(500);
  await p.click('[data-cev]'); await sleep(300); await p.click('#evIcs'); await sleep(500);
  const one = await p.evaluate(() => window.__shared);
  check('Put it in my calendar hands one event to the share sheet as a calendar file', one && one.name === 'E21CC Log event.ics' && one.type === 'text/calendar' && /SUMMARY:Chemistry practical test/.test(one.text) && (one.text.match(/BEGIN:VEVENT/g) || []).length === 1, JSON.stringify(one && {name:one.name, type:one.type}));
  await p.evaluate(() => closeDialog()); await sleep(200);
  await p.click('#cIcs'); await sleep(500);
  const all = await p.evaluate(() => ({n:(window.__shared.text.match(/BEGIN:VEVENT/g) || []).length, rows:document.querySelectorAll('.cal .crow').length, name:window.__shared.name}));
  check('Put these in my calendar makes one file with every item coming up', all.name === 'E21CC Log calendar.ics' && all.n === all.rows && all.n >= 4, JSON.stringify(all));

  // 6. edit and delete
  await p.click('[data-cev]'); await sleep(300); await p.fill('#evTitle', 'Chemistry practical'); await p.click('#evSave'); await sleep(400);
  const ed = await p.evaluate(() => me.events.map(e => e.title).join());
  await p.click('[data-cev]'); await sleep(300); await p.click('#evDel'); await sleep(400);
  const gone = await p.evaluate(() => me.events.length);
  check('an event can be edited, and deleted', ed === 'Chemistry practical' && gone === 0, JSON.stringify({ed, gone}));

  // 7. the backup merge, nothing shared, and Home's Coming up
  const priv = await p.evaluate(d => { me.events.push({id:'x1', title:'Football friendly', date:d, time:'', type:'cca', goal:'', created:Date.now(), updated:Date.now()}); saveDb();
    const back = JSON.parse(JSON.stringify(me)); me.events = []; const r = mergeBackup(me, back); const again = mergeBackup(me, back);
    return {back:me.events.length, again:again.any, shared:/Football friendly/.test(JSON.stringify(compactEntry(me.entries[0]))), inBackup:/Football friendly/.test(STORE.exportProfile(me))}; }, day(4));
  check('a restore brings events back with nothing doubled; they are in the backup and never shared', priv.back === 1 && !priv.again && !priv.shared && priv.inBackup, JSON.stringify(priv));
  await p.evaluate(() => { saveDb(); location.hash = '#/'; }); await sleep(700);
  const hc = await p.evaluate(() => [...document.querySelectorAll('.nxlist li')].map(li => li.textContent.trim()).find(t => /^Coming up:/.test(t)) || '');
  check('Home says what is coming up in the next week', /^Coming up: Football friendly, /.test(hc), hc);
  await ctx.close();

  // 8. a laptop, and the demo
  const ctxD = await browser.newContext({viewport:{width:1280, height:900}}); const d = await ctxD.newPage(); d.on('pageerror', e => errors.push(e.message));
  await d.goto(BASE + 'index.html?demo=student#/goals/calendar'); await sleep(1500);
  const demo = await d.evaluate(() => [...document.querySelectorAll('.cal .crow')].map(r => r.textContent.replace(/\s+/g, ' ').trim()));
  check('the demo’s calendar shows Sam’s sectional, practical test and checkpoints', demo.some(t => /Concert Band sectional 3\.30 pm/.test(t)) && demo.some(t => /Chemistry practical test/.test(t)) && demo.some(t => /Checkpoint/.test(t)), JSON.stringify(demo.slice(0, 5)));
  await d.screenshot({path:shots('t30-calendar-1280.png'), animations:'disabled'});
  const a5 = await axe(d); check('the calendar on a laptop has no serious or critical accessibility issues', !a5.length, a5.join(' | '));
  await ctxD.close();

  check('no page errors', !errors.length, errors.join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
