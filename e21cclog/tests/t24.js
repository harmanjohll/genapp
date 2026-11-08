// t24 (D4): this term's rhythm, a dot for each week written in, with no streak; milestones reached once and
// quietly, kept in Settings, never shared; an older log filled in without a word.
const fs = require('fs');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = JSON.parse(fs.readFileSync(__dirname + '/fixtures/seed3.json', 'utf8'));
const SG = s => new Date(s + '+08:00').getTime();
(async () => {
  const browser = await launch(); const errors = [];
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const open = async (data) => {
    const ctx = await browser.newContext({viewport:{width:390, height:844}, timezoneId:'Asia/Singapore'}); const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    await p.clock.install({time:SG('2026-11-04T10:00:00')});
    await p.goto(BASE + 'index.html'); await p.evaluate(s => localStorage.setItem('e21cclog', s), JSON.stringify(data)); await p.goto('about:blank'); await p.goto(BASE + 'index.html#/'); await sleep(1300);
    // every toast is recorded, so "once" can be checked
    await p.evaluate(() => { window.__toasts = []; const t = toast; toast = (m, ...a) => { window.__toasts.push(m); return t(m, ...a); }; });
    return {ctx, p};
  };
  const home = async p => { await p.evaluate(() => { window.__toasts = []; location.hash = '#/'; route(); }); await sleep(800); return p.evaluate(() => window.__toasts.slice()); };
  // an entry made the way the app makes one: migrated, and read by the built in coach
  const add = (p, e) => p.evaluate(e => { const x = migrateEntry(Object.assign({competencies:[], notes:[], sent:{}, links:[], topic:'Topic', groupCode:'', feedbackFrom:'teacher', feedbackText:''}, e)); x.e21cc = builtinE21cc(x, myStatements()); me.entries.push(x); saveDb(); }, e);

  // 1. rhythm across the Term 3 to Term 4 change, on Wednesday 4 November 2026 (Term 4, week 8)
  const R = JSON.parse(JSON.stringify(seed)); const RP = R.profiles[R.current]; const base = RP.entries[0];
  RP.entries = [['r1', '2026-09-01T16:00:00'], ['r2', '2026-09-09T16:00:00'], ['r3', '2026-09-15T16:00:00'], ['r4', '2026-09-22T16:00:00'], ['r5', '2026-10-07T16:00:00'], ['r6', '2026-11-03T16:00:00']]
    .map(([id, iso]) => Object.assign(JSON.parse(JSON.stringify(base)), {id, created:SG(iso), updated:SG(iso), notes:[], sent:{}}));
  let {ctx, p} = await open(R);
  const rh = await p.evaluate(() => { const d = [...document.querySelectorAll('.wheelcard .rdots i')]; return {n:d.length, on:d.map((x, i) => x.classList.contains('on') ? i + 1 : 0).filter(Boolean), now:d.findIndex(x => x.classList.contains('now')) + 1, label:document.querySelector('.wheelcard .rdots').getAttribute('aria-label'), lab:document.querySelector('.wheelcard .rlab').textContent, card:document.querySelector('.wheelcard').textContent}; });
  check('Term 4 has 10 dots: weeks 1, 2, 4 and 8 filled, week 8 the current one', rh.lab === 'Term 4' && rh.n === 10 && JSON.stringify(rh.on) === '[1,2,4,8]' && rh.now === 8, JSON.stringify({n:rh.n, on:rh.on, now:rh.now}));
  check('Term 3’s last week and the September holidays are not counted', !rh.on.includes(0) && rh.on.length === 4);
  check('a screen reader hears the weeks written in, and nothing about the others', rh.label === 'Term 4 so far: you wrote in weeks 1, 2, 4 and 8.', rh.label);
  check('no streak: nothing about weeks running, in a row, or missed', !/running|in a row|streak|missed/i.test(rh.card), rh.card.replace(/\s+/g, ' ').slice(0, 160));
  await p.screenshot({path:shots('t24-rhythm-390.png'), animations:'disabled'});
  const a1 = await axe(p); check('Home with the rhythm row has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await ctx.close();

  // 2. milestones from an empty log, each once, as it is reached
  const E = JSON.parse(JSON.stringify(seed)); const EP = E.profiles[E.current]; EP.entries = []; EP.done = {}; EP.planChecks = {}; delete EP.milestones;
  ({ctx, p} = await open(E));
  let t = await home(p);
  check('a new log: no milestone yet, and nothing said', !t.length && await p.evaluate(() => JSON.stringify(me.milestones) === '{}'), JSON.stringify(t));
  await p.evaluate(() => { location.hash = '#/settings?s=miles'; }); await sleep(500);
  check('Settings says the first one comes with the first entry', /Your first one comes with your first entry\./.test(await p.textContent('#miles')));
  await add(p, {id:'h1', kind:'grow', created:SG('2026-09-16T16:00:00'), context:{type:'subject', name:'History'}, subject:'History', answers:{g1:'Source A blames the generals but Source B blames the lack of planes, and I worked out that both can be true because they look at different stages.', r2:''}, links:[{sid:'ct1.u1', quote:'Source A blames the generals but Source B blames the lack of planes, and I worked out that both can be true because they look at different stages.', at:SG('2026-09-16T16:00:00')}]});
  t = await home(p);
  check('the first entry: one quiet note, a milestone', t.length === 1 && /^A milestone: your first entry\. It is kept in Settings, My milestones\.$/.test(t[0]), JSON.stringify(t));
  t = await home(p); check('and only once', !t.length, JSON.stringify(t));
  await add(p, {id:'g1', kind:'grow', created:SG('2026-10-14T16:00:00'), context:{type:'subject', name:'Geography'}, subject:'Geography', answers:{g1:'The farmers and the developers both had evidence, and I showed where their views conflicted over water.', r2:''}, links:[{sid:'ct1.u1', quote:'The farmers and the developers both had evidence, and I showed where their views conflicted over water.', at:SG('2026-10-14T16:00:00')}]});
  t = await home(p);
  const ms = await p.evaluate(() => Object.keys(me.milestones).sort());
  check('a statement secured in two subjects, four weeks apart: the first secured statement and a competency in two places, in one note', t.length === 1 && /^2 milestones: your first secured statement and a competency shown in two places\./.test(t[0]) && JSON.stringify(ms) === '["first","secured","twoplaces"]', JSON.stringify({t, ms}));
  // a GROW plan followed through, then an ACT's change answered Yes on Home
  await add(p, {id:'p1', kind:'grow', created:SG('2026-10-20T16:00:00'), context:{type:'subject', name:'Mathematics'}, subject:'Mathematics', answers:{g1:'I solved them by elimination.', r2:'Redo the fraction questions on Wednesday.'}});
  await p.evaluate(() => { me.done.p1 = true; me.planChecks = {p1:{answer:'yes', at:Date.now()}}; saveDb(); });
  t = await home(p); check('a plan followed through', t.length === 1 && /your plan|a plan followed through/i.test(t[0]), JSON.stringify(t));
  await add(p, {id:'a1', kind:'act', created:SG('2026-10-27T16:00:00'), context:{type:'subject', name:'English'}, subject:'English', answers:{a1:'Mr Raj said my tone was too casual.', t1:'I will reread every paragraph as the principal on Friday.'}});
  await home(p); const ask = await p.$('.nxplan [data-plan="yes"]');
  await p.evaluate(() => { window.__toasts = []; }); if (ask) await ask.click(); await sleep(1200);
  t = await p.evaluate(() => window.__toasts.slice());
  check('an ACT’s change, answered Yes on Home: an ACT that led to a change', !!ask && t.some(x => /^A milestone: an ACT that led to a change\./.test(x)), JSON.stringify(t));
  await p.evaluate(() => { location.hash = '#/settings?s=miles'; }); await sleep(600);
  const list = await p.$$eval('#miles .miles li b', l => l.map(x => x.textContent));
  check('My milestones lists all five, in the order reached, with no points', JSON.stringify(list) === JSON.stringify(['Your first entry', 'Your first secured statement', 'A competency shown in two places', 'A plan followed through', 'An ACT that led to a change']) && !/\d+ points?|score|rank/i.test(await p.textContent('#miles .miles')), JSON.stringify(list));
  await p.screenshot({path:shots('t24-milestones-390.png'), animations:'disabled'});
  const a2 = await axe(p); check('My milestones has no serious or critical accessibility issues', !a2.length, a2.join(' | '));
  // nothing about milestones leaves the device
  const pay = await p.evaluate(async () => { const items = [...me.entries.map(e => ({t:'e', e:compactEntry(e)})), ...BASKET_IDS.map(b => ({t:'b', b:basketSnapshot(b)}))]; return JSON.stringify({from:await senderInfo(), items}); });
  check('nothing about milestones is in what a student shares', !/milestone/i.test(pay) && pay.length > 200);
  await ctx.close();

  // 3. an older log: filled in silently, with the real dates
  const O = JSON.parse(JSON.stringify(seed)); delete O.profiles[O.current].milestones;
  ({ctx, p} = await open(O));
  t = await home(p);
  const back = await p.evaluate(() => ({kept:me.milestones, firstAt:Math.min(...me.entries.map(e => e.created))}));
  check('an older log is filled in without a word, with the dates things happened', !t.length && back.kept.first && back.kept.first.at === back.firstAt && Object.keys(back.kept).length >= 1, JSON.stringify({t, keys:Object.keys(back.kept)}));
  await ctx.close();

  check('no page errors', !errors.length, errors.join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
