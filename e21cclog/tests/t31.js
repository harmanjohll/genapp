// t31 (V4): the goal coach. smartCheck reads S, M, A, R and T; draftGoal gives the same draft for the same answers and
// a draft even when every question is skipped; the meaningful path asks at most five questions, any skipped, with
// Draft my goal at any step, and its draft opens in the form to change before setting; the SMART path asks only the
// open letters and then every letter is ticked; the why shows on the goal; no praise and no "missed"; axe; backup.
const fs = require('fs');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const PRAISE = /well done|great job|good job|excellent|amazing|awesome|fantastic|proud of you|nice work|good effort|missed/i;
const seed = JSON.parse(fs.readFileSync(__dirname + '/fixtures/seed3.json', 'utf8')); const P = seed.profiles[seed.current];
P.experiences.levels = Object.assign({}, P.experiences.levels, {Chemistry:'G3'});
P.goals = [{id:'cg1', kind:'cca', cca:'Football', title:'Lead the warm up for my team', steps:[], checks:[], created:Date.now(), updated:Date.now()},
  {id:'cg2', kind:'grade', subject:'Physics', level:'G3', now:'', target:'', steps:[], checks:[], created:Date.now(), updated:Date.now()}];   // no last result: saved before the form asked
(async () => {
  const browser = await launch(); const errors = [];
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const ctx = await browser.newContext({viewport:{width:390, height:844}}); const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
  await p.goto(BASE + 'school/beatty.json'); await p.evaluate(s => localStorage.setItem('e21cclog', s), JSON.stringify(seed)); await p.goto('about:blank'); await p.goto(BASE + 'index.html#/'); await sleep(1100);

  // 1. the pure parts
  const pure = await p.evaluate(() => {
    const full = {kind:'grade', subject:'Chemistry', level:'G3', now:'B4', target:'B3', why:'To keep JC open', by:'2026-12-01'};
    const far = Object.assign({}, full, {target:'A1'});
    const bare = {kind:'own', title:'Read more'};
    const ans = {area:'grade', why:'To keep a pathway open', subject:'Chemistry', level:'G3', now:'B4', block:'practice', try:'Redo the questions I got wrong', day:'Tuesday'};
    return {full:smartCheck(full).open.join(), far:smartCheck(far).open.join(), bare:smartCheck(bare).open.join(), comp:smartCheck({kind:'comp', sid:'x', why:'y', sure:true, by:'2026-12-01'}).open.join(),
      d1:JSON.stringify(draftGoal(ans)), d2:JSON.stringify(draftGoal(ans)), skip:draftGoal({}), draft:draftGoal(ans)};
  });
  check('smartCheck: a full grade goal has every letter; two grades too far up needs A; a bare goal needs M, A, R and T', pure.full === '' && pure.far === 'A' && pure.bare === 'M,A,R,T' && pure.comp === '', JSON.stringify({full:pure.full, far:pure.far, bare:pure.bare, comp:pure.comp}));
  check('draftGoal: the same answers give the same draft, one grade up, with the day in the step and the why kept', pure.d1 === pure.d2 && pure.draft.target === 'B3' && pure.draft.steps[0] === 'Every Tuesday: redo the questions I got wrong' && pure.draft.why === 'To keep a pathway open', pure.d1);
  check('draftGoal: every question skipped still gives a draft to start from', pure.skip.kind === 'own' && Array.isArray(pure.skip.steps), JSON.stringify(pure.skip));

  // 2. the meaningful path
  await p.evaluate(() => { location.hash = '#/goals/new'; }); await sleep(500);
  const doors = await p.evaluate(() => ({coach:!!document.querySelector('#gCoach'), smart:[...document.querySelectorAll('.gsmartlist a')].map(a => a.textContent)}));
  check('New goal offers the coach, and a goal to make SMART, above the kinds', doors.coach && doors.smart.includes('Lead the warm up for my team') && doors.smart.includes('Physics'), JSON.stringify(doors));
  const a1 = await axe(p); check('New goal with the doors has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await p.click('#gCoach'); await sleep(500);
  const qs = [];
  const step = async () => { const t = await p.evaluate(() => ({k:document.querySelector('.hero .kicker').textContent, q:document.querySelector('#coachQ').textContent})); qs.push(t); return t; };
  await step(); await p.click('[data-ca="area|grade"]'); await sleep(200); await p.click('#coachNext'); await sleep(300);
  await step(); await p.click('[data-ca="why|To keep a pathway open"]'); await sleep(200);
  const a2 = await axe(p); check('a coach question has no serious or critical accessibility issues', !a2.length, a2.join(' | '));
  await p.screenshot({path:shots('t31-coach-390.png'), animations:'disabled', fullPage:true});
  await p.click('#coachNext'); await sleep(300);
  await step(); await p.selectOption('#cSubject', 'Chemistry'); await sleep(250); await p.selectOption('#cNow', 'B4'); await p.click('#coachNext'); await sleep(300);
  await step(); await p.click('#coachSkip'); await sleep(300);   // skip what got in the way
  await step(); await p.click('[data-ca="try|Keep one steady habit"]'); await sleep(200); await p.click('[data-ca="day|Tuesday"]'); await sleep(200);
  const lastBtn = await p.textContent('#coachNext');
  await p.click('#coachNext'); await sleep(600);
  check('at most five questions, numbered, the last one drafting', qs.length === 5 && qs.every((x, i) => x.k === `Question ${i + 1} of 5`) && /Draft my goal/.test(lastBtn), JSON.stringify(qs.map(x => x.k + ': ' + x.q)));
  const form = await p.evaluate(() => ({hash:location.hash, note:(document.querySelector('.hero .meta') || {}).textContent || '', now:(document.querySelector('#gNow') || {}).value, target:[...document.querySelectorAll('.gsug .chip.on')].map(c => c.textContent).join(), why:(document.querySelector('#gWhy') || {}).value, step:(document.querySelector('[data-gstep="0"]') || {}).value}));
  check('the draft opens in the form to change: B4 to B3, the why and the step filled in', form.hash === '#/goals/new?k=grade' && /Your draft, from your answers/.test(form.note) && form.now === 'B4' && /B3/.test(form.target) && form.why === 'To keep a pathway open' && form.step === 'Every Tuesday: keep one steady habit', JSON.stringify(form));
  await p.click('#gSave'); await sleep(600);
  const saved = await p.evaluate(() => { const g = me.goals.find(x => x.kind === 'grade' && x.id !== 'cg2'); return {why:g && g.why, page:document.querySelector('.gwhy') ? document.querySelector('.gwhy').textContent : '', letters:[...document.querySelectorAll('.smart .sl')].map(s => s.textContent + (s.classList.contains('on') ? '+' : '-')).join('')}; });
  check('set, the goal shows why it matters and its SMART letters', saved.why === 'To keep a pathway open' && /Why it matters/.test(saved.page) && saved.letters === 'S+M+A+R+T-', JSON.stringify(saved));

  // 3. Draft my goal now, from the first question
  await p.evaluate(() => { location.hash = '#/goals/coach?m=meaning'; }); await sleep(400);
  await p.click('#coachDraft'); await sleep(500);
  check('Draft my goal now, at any step, opens a draft to finish', await p.evaluate(() => location.hash === '#/goals/new?k=own' && /Your draft/.test(document.querySelector('.hero .meta').textContent)));
  await p.evaluate(() => { goalDraft = null; });

  // 4. the SMART path asks only what is open
  await p.evaluate(() => { location.hash = '#/goals/cg1'; }); await sleep(500);
  const before = await p.evaluate(() => ({letters:[...document.querySelectorAll('.smart .sl')].map(s => s.textContent + (s.classList.contains('on') ? '+' : '-')).join(''), btn:!!document.querySelector('#gSmart')}));
  await p.click('#gSmart'); await sleep(400);
  const asked = [];
  for (let i = 0; i < 6; i++){
    const at = await p.evaluate(() => ({hash:location.hash, k:(document.querySelector('.hero .kicker') || {}).textContent || '', q:(document.querySelector('#coachQ') || {}).textContent || ''}));
    if (!/coach/.test(at.hash)) break; asked.push(at.q);
    if (/know you got there/.test(at.q)) await p.fill('#cToText', 'All eight drills, in time, without notes');
    if (/Can you do this/.test(at.q)) await p.click('[data-ca="achieve|yes"]');
    if (/Why does it matter/.test(at.q)) await p.click('[data-ca="why|For my team or my family"]');
    if (/By when/.test(at.q)) await p.click('[data-ca^="by|"]');
    await sleep(150); await p.click('#coachNext'); await sleep(350);
  }
  const after = await p.evaluate(() => { const g = me.goals.find(x => x.id === 'cg1'); return {open:smartCheck(g).open.join(), hash:location.hash, letters:[...document.querySelectorAll('.smart .sl')].map(s => s.textContent + (s.classList.contains('on') ? '+' : '-')).join(''), btn:!!document.querySelector('#gSmart')}; });
  check('a goal missing M, A, R and T shows them open, with Make it SMART', before.letters === 'S+M-A-R-T-' && before.btn, JSON.stringify(before));
  check('Make it SMART asks one question for each open letter only, and no more than five', asked.length === 4 && asked.length <= 5, JSON.stringify(asked));
  check('then every letter is ticked, and Make it SMART goes away', after.open === '' && after.letters === 'S+M+A+R+T+' && !after.btn && after.hash === '#/goals/cg1', JSON.stringify(after));

  // a grade goal with no last result: the coach asks for it, then offers the grades, and M comes with S
  await p.evaluate(() => { location.hash = '#/goals/coach?m=smart&g=cg2'; }); await sleep(400);
  const g2 = [];
  for (let i = 0; i < 6; i++){
    const at = await p.evaluate(() => ({hash:location.hash, k:(document.querySelector('.hero .kicker') || {}).textContent || '', q:(document.querySelector('#coachQ') || {}).textContent || '', chips:[...document.querySelectorAll('.coachstep .chip')].map(c => c.textContent)}));
    if (!/coach/.test(at.hash)) break;
    if (/Which grade/.test(at.q)){ await p.selectOption('#cNow', 'C5'); await sleep(250); at.after = await p.evaluate(() => [...document.querySelectorAll('.coachstep .chip')].map(c => c.textContent).join(', ') + (document.activeElement.id === 'cNow' ? ' (focus kept)' : '')); await p.click('.coachstep [data-ca^="target|"]'); }
    if (/reach it/.test(at.q)) await p.click('[data-ca="achieve|keep"]');
    if (/Why does it matter/.test(at.q)) await p.click('[data-ca^="why|"]');
    if (/By when/.test(at.q)) await p.click('[data-ca^="by|"]');
    g2.push(at); await sleep(150); await p.click('#coachNext'); await sleep(350);
  }
  const g2s = await p.evaluate(() => { const g = me.goals.find(x => x.id === 'cg2'); return {now:g.now, target:g.target, open:smartCheck(g).open.join()}; });
  check('a grade goal with no last result: asked for it, offered B4 and B3, four questions with no M, then SMART', g2.length === 4 && /Which grade/.test(g2[0].q) && !g2[0].chips.length && /B4/.test(g2[0].after) && /B3/.test(g2[0].after) && /focus kept/.test(g2[0].after) && g2s.now === 'C5' && g2s.target === 'B4' && g2s.open === '', JSON.stringify({g2, g2s}));

  // every icon draws: the Goals tab, Home's goal item, the coach
  const blank = [];
  for (const h of ['#/', '#/goals', '#/goals/cg1', '#/goals/coach?m=meaning']){
    await p.evaluate(x => { location.hash = x; }, h); await sleep(350);
    blank.push(...await p.evaluate(x => [...document.querySelectorAll('svg')].filter(s => !s.children.length && s.getBoundingClientRect().width).map(s => x + ' ' + (s.closest('[class]') || s.parentElement).className), h));
  }
  check('every icon draws, the Goals tab’s target among them', !blank.length, blank.join(' | '));

  // 5. the words, the backup, and no page errors
  const words = await p.evaluate(() => JSON.stringify([COACH_WHY, COACH_BLOCKS, COACH_TRIES, SMART_NAMES]));
  check('the coach’s words: no praise and nothing about missing out', !PRAISE.test(words));
  const bk = await p.evaluate(() => /For my team or my family/.test(STORE.exportProfile(me)) && !/For my team or my family/.test(JSON.stringify(compactEntry(me.entries[0]))));
  check('the answers stay in the goal, in the backup, and never in what is shared', bk);
  await ctx.close();

  check('no page errors', !errors.length, errors.join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
