// t25 (next, D3): one gentle prompt each time the Log is opened, in turn (a plan due, a statement close to secured,
// a subject with no entry yet this term); the same prompt for the whole open; Not now puts that kind aside a week;
// nothing said twice on Home; no prompt when nothing applies; never "missed" or "have not".
const fs = require('fs');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/next/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = JSON.parse(fs.readFileSync(__dirname + '/fixtures/seed3.json', 'utf8')); const P = seed.profiles[seed.current];
const SG = s => new Date(s + '+08:00').getTime();
// one plan only: the Wednesday one in the newest entry; every other plan is cleared
const newest = P.entries.slice().sort((a, b) => b.created - a.created)[0];
for (const e of P.entries) if (e !== newest){ if (e.answers.r2 !== undefined) e.answers.r2 = ''; if (e.answers.t1 !== undefined) e.answers.t1 = ''; }
P.done = {}; P.planChecks = {}; delete P.prompts;
P.experiences.subjects = [...P.experiences.subjects, 'History'];   // a subject with nothing written yet this term
(async () => {
  const browser = await launch(); const errors = []; const said = [];
  const ctx = await browser.newContext({viewport:{width:390, height:844}, timezoneId:'Asia/Singapore'});
  await ctx.clock.install({time:SG('2026-11-04T10:00:00')});
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const seen = p => p.evaluate(() => { const n = document.querySelector('#main .nudge'); return {kind:n ? n.dataset.kind : null, text:n ? n.textContent.replace(/\s+/g, ' ').trim() : '', planLine:!!document.querySelector('.nxlist .nxplan'), almostLine:[...document.querySelectorAll('.nxlist li')].some(l => /^Almost secured/.test(l.textContent.trim())), href:(n && n.querySelector('a.btn') || {}).getAttribute ? n.querySelector('a.btn') && n.querySelector('a.btn').getAttribute('href') : ''}; });
  // each open is a new tab: its own session, the same log
  const open = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message)); await p.goto(BASE + 'index.html#/'); await sleep(1300); const s = await seen(p); if (s.text) said.push(s.text); return {p, s}; };
  const first = await ctx.newPage(); await first.goto(BASE + 'index.html'); await first.evaluate(x => localStorage.setItem('e21cclog.next', x), JSON.stringify(seed)); await first.close();

  // 1. three opens, three prompts, in turn
  let o1 = await open();
  check('the first open: the plan that is due, asked at the top of Home', o1.s.kind === 'plan' && /has come round\. “Do Q4 to Q8 on Wednesday after school for 30 minutes\.” Did it happen\?/.test(o1.s.text), JSON.stringify(o1.s));
  check('while the prompt asks about the plan, What next does not list it again', !o1.s.planLine);
  await o1.p.screenshot({path:shots('t25-prompt-plan-390.png'), animations:'disabled'});
  const a1 = await axe(o1.p); check('Home with a prompt has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await o1.p.evaluate(() => route()); await sleep(400);
  check('within the same open, Home keeps the same prompt', (await seen(o1.p)).kind === 'plan');
  await o1.p.close();
  const o2 = await open();
  check('the second open: a statement close to secured, not listed again in What next', o2.s.kind === 'almost' && /^Close to secured: “.+”\./.test(o2.s.text) && !o2.s.almostLine, JSON.stringify(o2.s));
  await o2.p.close();
  const o3 = await open();
  check('the third open: a subject with no entry yet this term, with New GROW ready for it', o3.s.kind === 'subject' && /^Nothing in your log yet for .+ this term\. Your next .+ (lesson|session) could be the one\./.test(o3.s.text) && /^#\/write\/grow\?x=(subject|cca)%3A/.test(o3.s.href || ''), JSON.stringify(o3.s));
  await o3.p.screenshot({path:shots('t25-prompt-subject-390.png'), animations:'disabled'});
  await o3.p.close();

  // 2. answering the plan in the prompt: recorded as in D2, and nothing takes its place this open
  const o4 = await open();
  check('the fourth open comes round to the plan again', o4.s.kind === 'plan', JSON.stringify(o4.s));
  await o4.p.click('#main .nudge [data-plan="yes"]'); await sleep(900);
  const after = await o4.p.evaluate(() => ({done:!!me.done[Object.keys(me.done)[0]], n:Object.keys(me.done).length, nudge:!!document.querySelector('#main .nudge')}));
  check('Yes in the prompt counts the plan as followed through, and no other prompt takes its place', after.done && after.n === 1 && !after.nudge, JSON.stringify(after));
  await o4.p.close();

  // 3. Not now: that kind stays away a week
  const o5 = await open();
  check('the next open moves on to the statement', o5.s.kind === 'almost', JSON.stringify(o5.s));
  await o5.p.click('#nudgeLater'); await sleep(600);
  check('Not now: the prompt goes, quietly', !(await o5.p.$('#main .nudge')) && await o5.p.evaluate(() => me.prompts.away.almost > Date.now() + 6.9 * 864e5));
  await o5.p.close();
  const kinds = [];
  for (let i = 0; i < 2; i++){ const o = await open(); kinds.push(o.s.kind); await o.p.close(); }
  await ctx.clock.setSystemTime(SG('2026-11-10T10:00:00'));
  { const o = await open(); kinds.push(o.s.kind); await o.p.close(); }
  check('for the rest of the week the statement is not offered again', !kinds.includes('almost') && kinds.every(k => k === 'subject'), JSON.stringify(kinds));
  await ctx.clock.setSystemTime(SG('2026-11-12T10:00:00'));
  { const o = await open(); check('after a week it can come back', o.s.kind === 'almost', JSON.stringify(o.s)); await o.p.close(); }

  // 4. nothing that applies: no prompt
  const Q = JSON.parse(JSON.stringify(seed)); const QP = Q.profiles[Q.current]; const e0 = JSON.parse(JSON.stringify(newest));
  Object.assign(e0, {id:'q1', created:SG('2026-11-11T16:00:00'), updated:SG('2026-11-11T16:00:00'), links:[], notes:[], sent:{}, context:{type:'subject', name:'Chemistry'}, subject:'Chemistry'}); e0.answers = {g1:'I learnt how to name salts.'};
  QP.entries = [e0]; QP.experiences = {subjects:['Chemistry'], cca:'', others:[], levels:{}}; QP.done = {}; QP.planChecks = {}; delete QP.prompts;
  const p0 = await ctx.newPage(); p0.on('pageerror', e => errors.push(e.message)); await p0.goto(BASE + 'index.html'); await p0.evaluate(x => localStorage.setItem('e21cclog.next', x), JSON.stringify(Q)); await p0.close();
  { const o = await open(); check('when nothing applies, there is no prompt', !o.s.kind, JSON.stringify(o.s)); await o.p.close(); }

  check('every prompt shown is kind: never missed, have not or haven’t', said.length >= 6 && !said.some(t => /missed|have not|haven’t|haven't/i.test(t)), JSON.stringify(said.length));
  check('no page errors', !errors.length, errors.join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
