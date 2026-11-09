// t32 (Version 5.1): the goal loop closed. A goal's step is checked back on its day, from Home or the goal's page, and
// an if then line never is; the goal page leads with what the student will do, shows the weeks so far and lists the
// entries that name it; an entry can name a goal, and a result opens a reflection that names it; the coach asks what
// might get in the way next time and makes an if then plan, which the draft carries; nothing about goals is shared.
const fs = require('fs');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const yday = DAYS[new Date(Date.now() - 864e5).getDay()];
const seed = JSON.parse(fs.readFileSync(__dirname + '/fixtures/seed3.json', 'utf8')); const P = seed.profiles[seed.current];
P.experiences.levels = Object.assign({}, P.experiences.levels, {Chemistry:'G3'});
const ago = Date.now() - 10 * 864e5;
P.goals = [{id:'gs1', kind:'grade', subject:'Chemistry', level:'G3', now:'B4', target:'B3', result:'eoy', why:'To keep a pathway open', by:'2026-12-01',
  steps:[`Every ${yday}: redo the questions I got wrong`, 'If I run out of time, or feel stressed, then I will do just ten minutes'], checks:[], created:ago, updated:ago}];
P.entries[0].goal = 'gs1';
P.drafts = {};
(async () => {
  const browser = await launch(); const errors = [];
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const ctx = await browser.newContext({viewport:{width:390, height:844}}); const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
  await p.goto(BASE + 'school/beatty.json'); await p.evaluate(s => localStorage.setItem('e21cclog', s), JSON.stringify(seed)); await p.goto('about:blank'); await p.goto(BASE + 'index.html#/'); await sleep(1100);
  const go = async h => { await p.evaluate(x => { location.hash = x; }, h); await sleep(450); };

  // 1. the pure parts, on fixed days: Monday 2 November 2026, and on
  const pure = await p.evaluate(() => {
    const d = (m, day) => new Date(2026, m, day, 9).getTime(), y = t => t == null ? null : ymd(t);
    return {
      wd:[stepWeekday('Every Tuesday: redo it'), stepWeekday('Practise on thurs'), stepWeekday('Do one question')],
      tue:y(stepCheckDay('Every Tuesday: redo it', d(10, 2), d(10, 9))),
      sameDay:y(stepCheckDay('Every Tuesday: redo it', d(10, 3), d(10, 5))),
      weekly:[y(stepCheckDay('Do one practice question', d(10, 2), d(10, 8))), y(stepCheckDay('Do one practice question', d(10, 2), d(10, 9)))],
      ifThen:[isIfThen('If I rush, then I will check once'), isIfThen('Every Friday: practise')],
      cca:draftGoal({area:'cca', title:'Lead the warm up', try:'Practise for 15 minutes', day:'Friday', blockText:'I run out of time, or feel stressed', then:'Do just ten minutes.'}).steps,
      own:draftGoal({area:'own', title:'Read more', try:'Read for 20 minutes', blockText:"if I'm tired after CCA", then:"I'll read two pages"}).steps,
      none:draftGoal({area:'own', title:'Read more', try:'Read for 20 minutes', blockText:COACH_NONE, then:'something'}).steps,
      gap:[gradeGap('G3', 'B4', 'A2'), gradeGap('G3', 'B4', 'B4'), gradeGap('G2', '4', '3')]};
  });
  check('the weekday a step names: Tuesday, Thursday, or none', pure.wd.join() === '2,4,', JSON.stringify(pure.wd));
  check('a Tuesday step is checked on the Tuesday after the goal was set, never on the day it was set', pure.tue === '2026-11-03' && pure.sameDay === null, JSON.stringify({tue:pure.tue, sameDay:pure.sameDay}));
  check('a step with no day is checked a week at a time from the day the goal was set', pure.weekly[0] === null && pure.weekly[1] === '2026-11-09', JSON.stringify(pure.weekly));
  check('an if then line is a plan for when something happens, so it is never checked back', pure.ifThen.join() === 'true,false');
  check('the draft carries the if then plan, in the student’s words, with I kept as I', pure.cca.join(' | ') === 'Every Friday: practise for 15 minutes | If I run out of time, or feel stressed, then I will do just ten minutes' && pure.own[1] === "If I'm tired after CCA, then I will read two pages" && pure.none.length === 1, JSON.stringify({cca:pure.cca, own:pure.own, none:pure.none}));
  check('how far a target is, said plainly', pure.gap.join(' | ') === 'B4 to A2: two grades up. | Keep B4. | Grade 4 to Grade 3: one grade up.', pure.gap.join(' | '));

  // 2. Home asks about this week's step, and only that step
  await go('#/');
  const home = await p.evaluate(() => { const li = document.querySelector('#gstepQ') && document.querySelector('#gstepQ').closest('li'); return li ? {text:li.textContent, btns:[...li.querySelectorAll('[data-gstepans]')].map(b => b.textContent)} : null; });
  check('Home asks: did you do it, this week’s step, for the Chemistry goal; never the if then line', !!home && home.text.includes(`“Every ${yday}: redo the questions I got wrong”`) && /For your goal: Chemistry: B4 to B3/.test(home.text) && home.btns.join() === 'Yes,Partly,Not this week' && !/If I run out of time/.test(home.text), JSON.stringify(home));
  const a1 = await axe(p); check('Home with the step to check has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await p.screenshot({path:shots('t32-home-step-390.png'), animations:'disabled'});
  await p.click('[data-gstepans$="|partly"]'); await sleep(700);
  const after = await p.evaluate(() => ({checks:me.goals[0].stepChecks, asked:!!document.querySelector('#gstepQ')}));
  const key = Object.keys(after.checks || {})[0] || '';
  check('the answer is kept on the goal, for that week, and Home stops asking', /^0:\d{4}-\d{2}-\d{2}$/.test(key) && after.checks[key].answer === 'partly' && !after.asked, JSON.stringify(after));

  // 3. the goal page leads with what the student will do, shows the weeks so far, and lists its entries
  await go('#/goals/gs1');
  const page = await p.evaluate(() => {
    const card = document.querySelector('#main .card'); const h2 = card.querySelector('h2');
    const lis = [...card.querySelectorAll('.gsteps-list li')];
    return {first:h2 && h2.textContent, stepBeforeGrade:!!(card.querySelector('.gsteps-list') && card.querySelector('.gnowto') && (card.querySelector('.gsteps-list').compareDocumentPosition(card.querySelector('.gnowto')) & Node.DOCUMENT_POSITION_FOLLOWING)),
      weeks:lis.map(li => (li.querySelector('.gweeks') || {getAttribute:() => ''}).getAttribute('aria-label')), ask:!!document.querySelector('[data-gstepans]'),
      linked:[...document.querySelectorAll('.glinked a')].map(a => a.getAttribute('href')), write:(document.querySelector('#gWrite') || {}).getAttribute && document.querySelector('#gWrite').getAttribute('href')};
  });
  const firstId = await p.evaluate(() => me.entries[0].id);
  check('the goal page leads with What you will do, before the grade', page.first === 'What you will do' && page.stepBeforeGrade, JSON.stringify({first:page.first, before:page.stepBeforeGrade}));
  check('the weeks so far show the answer given; the if then line has none; nothing left to ask', /partly$/.test(page.weeks[0]) && page.weeks[1] === '' && !page.ask, JSON.stringify(page.weeks));
  check('the entries that name the goal are listed, with Write about this goal', page.linked.includes('#/entry/' + firstId) && page.write === '#/write/grow?g=gs1&x=subject%3AChemistry', JSON.stringify({linked:page.linked, write:page.write}));
  const a2 = await axe(p); check('the goal page has no serious or critical accessibility issues', !a2.length, a2.join(' | '));
  await p.screenshot({path:shots('t32-goal-390.png'), animations:'disabled', fullPage:true});

  // 4. an entry can name a goal: started from the goal, it already does
  await p.click('#gWrite'); await sleep(700);
  if (await p.$('#rNew')){ await p.click('#rNew'); await sleep(400); }
  const comp = await p.evaluate(() => ({sel:(document.querySelector('[name=goalLink]') || {}).value, opts:[...document.querySelectorAll('[name=goalLink] option')].map(o => o.textContent), ctx:draft && draft.context.name, goal:draft && draftEntry().goal}));
  check('Write about this goal opens a GROW on Chemistry that names the goal, and the entry carries it', comp.sel === 'gs1' && comp.opts.join() === 'None,Chemistry: B4 to B3' && comp.ctx === 'Chemistry' && comp.goal === 'gs1', JSON.stringify(comp));
  const a3 = await axe(p); check('the composer with the goal has no serious or critical accessibility issues', !a3.length, a3.join(' | '));
  await p.selectOption('[name=goalLink]', ''); await p.evaluate(() => collect());
  check('the student can choose no goal', await p.evaluate(() => draftEntry().goal === ''));
  await p.click('#cClose'); await sleep(400);
  await p.evaluate(() => { draft = null; me.drafts = {}; saveDb(); });

  // 5. a result opens a reflection that names the goal
  await go('#/goals/gs1');
  await p.selectOption('#gGot', 'B3'); await p.click('#gGotSave'); await sleep(600);
  const res = await p.evaluate(() => ({text:document.querySelector('#main').textContent, reflect:(document.querySelector('#gReflect') || {}).textContent || ''}));
  check('the result is recorded, and the page asks what helped and what will change', /You reached your goal/.test(res.text) && /What helped\? What will you change\?/.test(res.reflect), JSON.stringify({reflect:res.reflect}));
  await p.click('#gReflect'); await sleep(700);
  if (await p.$('#rNew')){ await p.click('#rNew'); await sleep(400); }
  const refl = await p.evaluate(() => ({topic:draft && draft.topic, goal:draft && draft.goal, ctx:draft && draft.context.name}));
  check('the reflection is a GROW on Chemistry, about the result, naming the goal', refl.topic === 'My result: B3' && refl.goal === 'gs1' && refl.ctx === 'Chemistry', JSON.stringify(refl));
  await p.click('#cClose'); await sleep(400);
  await p.evaluate(() => { draft = null; me.drafts = {}; saveDb(); });

  // 6. the coach asks what might get in the way next time, and plans for it
  await go('#/goals/coach?m=meaning');
  await p.click('[data-ca="area|grade"]'); await sleep(200); await p.click('#coachNext'); await sleep(300);
  await p.click('#coachSkip'); await sleep(300);
  await p.selectOption('#cSubject', 'Chemistry'); await sleep(250); await p.selectOption('#cNow', 'B4'); await sleep(250); await p.selectOption('#cTarget', 'B3'); await sleep(250);
  await p.click('#coachNext'); await sleep(300);
  const q4 = await p.evaluate(() => ({q:document.querySelector('#coachQ').textContent, hidden:document.querySelector('#cThenWrap').hidden, chips:[...document.querySelectorAll('.coachstep [data-ca^="block|"]')].map(c => c.textContent)}));
  await p.evaluate(() => document.querySelector('#coachNext').setAttribute('data-mark', '1'));
  await p.fill('#cBlock', "I'm tired after CCA"); await sleep(200);
  const typed = await p.evaluate(() => ({hidden:document.querySelector('#cThenWrap').hidden, label:document.querySelector('#cThenLab').textContent, same:document.querySelector('#coachNext').getAttribute('data-mark') === '1'}));
  check('question 4 asks what might get in the way next time, own words first, with no plan asked until there is something to plan for', q4.q === 'What might get in the way next time?' && q4.hidden && q4.chips.includes('I run out of time, or feel stressed'), JSON.stringify(q4));
  check('typing the obstacle opens “If I’m tired after CCA, then I will…” in place, with nothing redrawn under the next tap', !typed.hidden && typed.label === "If I'm tired after CCA, then I will…" && typed.same, JSON.stringify(typed));
  await p.click('[data-ca="block|time"]'); await sleep(250);
  const chose = await p.evaluate(() => ({text:document.querySelector('#cBlock').value, label:document.querySelector('#cThenLab').textContent, thens:[...document.querySelectorAll('.coachstep [data-ca^="then|"]')].map(c => c.textContent)}));
  await p.click('[data-ca="then|do just ten minutes"]'); await sleep(200);
  const a4 = await axe(p); check('the if then question has no serious or critical accessibility issues', !a4.length, a4.join(' | '));
  await p.screenshot({path:shots('t32-coach-ifthen-390.png'), animations:'disabled', fullPage:true});
  await p.click('#coachNext'); await sleep(300);
  await p.click('[data-ca="try|Do a short revision session"]'); await sleep(200); await p.click('[data-ca="day|Thursday"]'); await sleep(200);
  await p.click('#coachNext'); await sleep(700);
  const steps = await p.evaluate(() => [0, 1, 2].map(i => (document.querySelector(`[data-gstep="${i}"]`) || {}).value));
  check('an idea fills the words, and the then ideas fit the obstacle', chose.text === 'I run out of time, or feel stressed' && chose.label === 'If I run out of time, or feel stressed, then I will…' && chose.thens.join() === 'do just ten minutes,move it to the next free day', JSON.stringify(chose));
  check('the draft carries the weekly step and the if then plan', steps[0] === 'Every Thursday: do a short revision session' && steps[1] === 'If I run out of time, or feel stressed, then I will do just ten minutes' && steps[2] === '', JSON.stringify(steps));
  await p.evaluate(() => { goalDraft = null; });

  // 7. nothing about goals is shared; the backup keeps the answers
  const priv = await p.evaluate(() => { const e = Object.assign({}, me.entries[0], {goal:'gs1'}); const c = JSON.stringify(compactEntry(e)); const b = JSON.parse(STORE.exportProfile(me)).profile; return {shared:/gs1|"goal"/.test(c), backup:!!b.goals[0].stepChecks && Object.keys(b.goals[0].stepChecks).length === 1 && b.entries[0].goal === 'gs1'}; });
  check('an entry’s goal never goes in what is shared; the backup keeps the goal and the weeks answered', !priv.shared && priv.backup, JSON.stringify(priv));

  await ctx.close();
  check('no page errors', !errors.length, errors.join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
