// t29 (V2): goals. Beatty's scales (G3 A1 to F9, G2 Grades 1 to 6, G1 A to D); from the last result the Log suggests a
// realistic target (one up) and a stretch (two up), and keeps the top grade; a grade goal set from the form, with steps
// and a checkpoint ticked; a competency goal and a CCA goal from presets; the result recorded and the next goal started
// from it; goals never in what is shared; a restore merges goals with nothing doubled; Home shows the nearest goal.
const fs = require('fs');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = JSON.parse(fs.readFileSync(__dirname + '/fixtures/seed3.json', 'utf8')); const P = seed.profiles[seed.current];
P.experiences.levels = Object.assign({}, P.experiences.levels, {Chemistry:'G3'}); P.email = P.email || 'wei_ling_tan@students.edu.sg';
(async () => {
  const browser = await launch(); const errors = [];
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const ctx = await browser.newContext({viewport:{width:390, height:844}}); const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
  await p.goto(BASE + 'school/beatty.json'); await p.evaluate(s => localStorage.setItem('e21cclog', s), JSON.stringify(seed)); await p.goto('about:blank'); await p.goto(BASE + 'index.html#/'); await sleep(1100);

  // 1. the scales and the suggestions
  const s = await p.evaluate(() => ({g3:GRADE_SCALES.G3.join(), g2:GRADE_SCALES.G2.join(), g1:GRADE_SCALES.G1.join(),
    b4:gradeTargets('G3', 'B4'), a2:gradeTargets('G3', 'A2'), a1:gradeTargets('G3', 'A1'), f9:gradeTargets('G3', 'F9'), g2t:gradeTargets('G2', '4'), d:gradeTargets('G1', 'D'), lbl:gradeLabel('G2', '3'), ch:gradeChoices('G3', 'C5').join()}));
  check('Beatty’s scales: G3 A1 to F9, G2 Grades 1 to 6, G1 A to D', s.g3 === 'A1,A2,B3,B4,C5,C6,D7,E8,F9' && s.g2 === '1,2,3,4,5,6' && s.g1 === 'A,B,C,D' && s.lbl === 'Grade 3', JSON.stringify(s));
  check('from the last result: one up is realistic, two up a stretch; at the top, keep it; the next result is never below the last', s.b4.realistic === 'B3' && s.b4.stretch === 'A2' && s.a2.realistic === 'A1' && s.a2.stretch === 'A1' && s.a1.top && s.a1.realistic === 'A1' && s.f9.realistic === 'E8' && s.f9.stretch === 'D7' && s.g2t.realistic === '3' && s.g2t.stretch === '2' && s.d.realistic === 'C' && s.d.stretch === 'B' && s.ch === 'A1,A2,B3,B4,C5', JSON.stringify(s));

  // 2. Home offers a goal; the Goals place is in the navigation
  const home = await p.evaluate(() => ({offer:[...document.querySelectorAll('.nxlist li')].some(li => /^Set a goal\./.test(li.textContent.trim())), tab:!!document.querySelector('.tabs a[href="#/goals"]')}));
  check('Home offers to set a goal, and Goals is in the navigation', home.offer && home.tab, JSON.stringify(home));

  // 3. a grade goal from the form
  await p.click('.tabs a[href="#/goals"]'); await sleep(500);
  check('Goals with none yet says how to start', /No goals yet/.test(await p.textContent('#main')));
  await p.click('#gNew'); await sleep(400);
  const kinds = await p.$$eval('.gkind b', l => l.map(x => x.textContent));
  check('a new goal starts from four kinds', kinds.join('|') === 'A subject grade|A competency|A CCA skill|My own goal', kinds.join('|'));
  await p.click('.gkind[href="#/goals/new?k=grade"]'); await sleep(400);
  await p.selectOption('#gSubject', 'Chemistry'); await sleep(250);
  const lv = await p.evaluate(() => document.querySelector('[data-glevel].on').textContent);
  await p.selectOption('#gNow', 'B4'); await sleep(250);
  const sug = await p.$$eval('.gsug .chip', l => l.map(x => x.textContent + (x.classList.contains('on') ? '*' : '')));
  check('Chemistry at G3: from B4, Realistic B3 (chosen) and Stretch A2 are offered', lv === 'G3' && sug.join('|') === 'Realistic: B3*|Stretch: A2', JSON.stringify({lv, sug}));
  await p.click('.gsug .chip:nth-child(2)'); await sleep(250);
  await p.click('[data-gresult="eoy"]'); await sleep(250);
  await p.click('[data-gsteppre]'); await sleep(250);
  await p.screenshot({path:shots('t29-goal-form-390.png'), animations:'disabled', fullPage:true});
  const a1 = await axe(p); check('the goal form has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await p.click('#gSave'); await sleep(600);
  const g = await p.evaluate(() => ({hash:location.hash, goals:me.goals.map(x => ({kind:x.kind, subject:x.subject, level:x.level, now:x.now, target:x.target, result:x.result, steps:x.steps}))}));
  check('the goal is set: Chemistry, G3, B4 to A2, by the End of Year exam, with a step', g.goals.length === 1 && g.goals[0].subject === 'Chemistry' && g.goals[0].now === 'B4' && g.goals[0].target === 'A2' && g.goals[0].result === 'eoy' && g.goals[0].steps.length === 1 && /^#\/goals\//.test(g.hash), JSON.stringify(g));
  const title = await p.textContent('#main h1');
  check('its page reads Chemistry: B4 to A2', title === 'Chemistry: B4 to A2', title);
  // a checkpoint, added and ticked
  await p.fill('#gCheckText', 'Redo the WA2 paper'); await p.fill('#gCheckDate', await p.evaluate(() => new Date(Date.now() + 3 * 864e5).toLocaleDateString('en-CA'))); await p.click('#gCheckAdd'); await sleep(500);
  await p.check('[data-gcheck]'); await sleep(500);
  const ck = await p.evaluate(() => me.goals[0].checks.map(c => c.text + ':' + c.done));
  check('a checkpoint is added with its date, and ticked', ck.join() === 'Redo the WA2 paper:true', ck.join());
  const a2 = await axe(p); check('the goal page has no serious or critical accessibility issues', !a2.length, a2.join(' | '));
  // the result comes in: reached, and the next goal starts from it
  await p.selectOption('#gGot', 'A2'); await p.click('#gGotSave'); await sleep(500);
  const got = await p.evaluate(() => ({done:me.goals[0].done, got:me.goals[0].got, txt:document.querySelector('#main').textContent}));
  check('recording the result: reached, and the goal is done', got.done && got.got === 'A2' && /You reached your goal/.test(got.txt), JSON.stringify({done:got.done, got:got.got}));
  await p.click('#gAgain'); await sleep(500);
  const nx = await p.evaluate(() => ({now:document.querySelector('#gNow').value, chips:[...document.querySelectorAll('.gsug .chip')].map(x => x.textContent)}));
  check('the next goal starts from that result: A2, with A1 offered', nx.now === 'A2' && nx.chips.join() === 'Realistic: A1', JSON.stringify(nx));

  // 4. a competency goal and a CCA goal
  await p.evaluate(() => { goalDraft = null; location.hash = '#/goals/new?k=comp'; }); await sleep(500);
  await p.selectOption('#gComp', 'critical'); await sleep(250);
  const sid = await p.$eval('#gSid option:nth-child(2)', o => o.value); await p.selectOption('#gSid', sid); await sleep(200); await p.click('#gSave'); await sleep(500);
  await p.evaluate(() => { goalDraft = null; location.hash = '#/goals/new?k=cca'; }); await sleep(500);
  const presets = await p.$$eval('[data-gpreset]', l => l.map(x => x.textContent));
  await p.click('[data-gpreset]'); await sleep(250); await p.click('#gSave'); await sleep(500);
  const all = await p.evaluate(() => me.goals.map(x => x.kind + ':' + (x.kind === 'comp' ? !!statementById(x.sid) : x.kind === 'cca' ? x.cca + '|' + x.title : x.subject)));
  check('a competency goal (an I can statement) and a CCA goal from a skill preset', all.includes('comp:true') && all.some(x => /^cca:Football\|/.test(x)) && presets.length === 4 && presets.every(t => !/award|medal|gold/i.test(t)), JSON.stringify({all, presets}));
  await p.evaluate(() => { location.hash = '#/goals'; }); await sleep(500);
  const list = await p.evaluate(() => ({live:document.querySelectorAll('#main .goals:not(details .goals) .goal').length, done:(document.querySelector('#main details summary') || {}).textContent || ''}));
  check('Goals lists the live goals, and the done one under Done', list.live === 2 && /Done \(1\)/.test(list.done), JSON.stringify(list));
  await p.screenshot({path:shots('t29-goals-390.png'), animations:'disabled', fullPage:true});

  // 5. private: not in what is shared; kept by a backup and merged by a restore
  const priv = await p.evaluate(() => { const e = me.entries[0]; const c = JSON.stringify(compactEntry(e)); return {inShare:/goals|gradeTarget|Redo the WA2/.test(c), inBackup:/Redo the WA2 paper/.test(STORE.exportProfile(me))}; });
  check('goals are never in what is shared, and are in the backup', !priv.inShare && priv.inBackup, JSON.stringify(priv));
  const mg = await p.evaluate(() => { const back = JSON.parse(JSON.stringify(me)); const before = me.goals.length; const r1 = mergeBackup(me, back); me.goals.splice(1, 1); const r2 = mergeBackup(me, back); return {before, after:me.goals.length, again:r1.any, ids:new Set(me.goals.map(g => g.id)).size}; });
  check('a restore brings back a missing goal and doubles nothing', mg.after === mg.before && mg.ids === mg.before && !mg.again, JSON.stringify(mg));

  // 6. Home shows the nearest goal
  await p.evaluate(() => { location.hash = '#/'; }); await sleep(700);
  const hg = await p.evaluate(() => [...document.querySelectorAll('.nxlist li')].map(li => li.textContent.trim()).find(t => /^Goal:/.test(t)) || '');
  check('Home shows the nearest live goal', /^Goal: /.test(hg), hg);
  await ctx.close();

  // 7. a laptop: Goals in the sidebar, and the page reads well
  const ctxD = await browser.newContext({viewport:{width:1280, height:900}}); const d = await ctxD.newPage(); d.on('pageerror', e => errors.push(e.message));
  await d.goto(BASE + 'index.html?demo=student#/goals'); await sleep(1500);
  const demo = await d.evaluate(() => ({goals:document.querySelectorAll('#main .goal').length, first:(document.querySelector('#main .goal b') || {}).textContent || ''}));
  check('the demo shows Sam’s goals, nearest first', demo.goals >= 2 && /Chemistry: B4 to B3/.test(demo.first), JSON.stringify(demo));
  await d.screenshot({path:shots('t29-goals-1280.png'), animations:'disabled'});
  const a3 = await axe(d); check('the Goals page on a laptop has no serious or critical accessibility issues', !a3.length, a3.join(' | '));
  await ctxD.close();

  check('no page errors', !errors.length, errors.join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
