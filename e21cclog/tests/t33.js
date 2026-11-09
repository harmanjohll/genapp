// t33 (Version 5.2): the pilot report. The console counts, for each school week of the term, the students who shared
// an entry written that week and how many of them got a reply that was sent; a drafted reply does not count; the
// group filter narrows it; in a holiday it shows the term just ended; Copy for the pilot lead carries counts, never names.
const fs = require('fs');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const NAMES = ['Alya Rahman', 'Ben Tan', 'Chen Wei', 'Devi Kumar'];
(async () => {
  const browser = await launch(); const errors = [];
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const ctx = await browser.newContext({viewport:{width:1280, height:900}}); const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
  await p.goto(BASE + 'teacher.html'); await p.evaluate(() => localStorage.removeItem('e21cclog.teacher')); await p.reload(); await sleep(800);

  // four students in two groups; entries in weeks 1, 2 and 4 of a term, one from the term before, and a domain snapshot
  const seedAt = (now, names) => p.evaluate(({now, names}) => {
    const T = termsFor(termPos(now).year); const tp = termPos(now); const k = T.find(x => x.n === tp.term) || T[3];
    const at = d => k.start + d * 864e5 + 10 * 3600e3;
    const st = (i, g) => ({name:names[i], email:'s' + i + '@students.edu.sg', groups:[g]});
    store.students = {'s0@students.edu.sg':st(0, '3A'), 's1@students.edu.sg':st(1, '3A'), 's2@students.edu.sg':st(2, '3B'), 's3@students.edu.sg':st(3, '3A')};
    const e = (key, sk, created, kind = 'e') => [key, {key, sk, kind, data:kind === 'e' ? {id:key, kind:'grow', created, context:{type:'subject', name:'Chemistry'}, answers:{}} : {basket:'thinking', at:created}, received:now, opened:true, via:'link'}];
    store.items = Object.fromEntries([
      e('a1', 's0@students.edu.sg', at(1)), e('a2', 's0@students.edu.sg', at(2)),          // Alya, week 1, twice
      e('b1', 's1@students.edu.sg', at(3)),                                              // Ben, week 1
      e('c1', 's2@students.edu.sg', at(8)),                                              // Chen (3B), week 2
      e('d1', 's3@students.edu.sg', at(22)),                                             // Devi, week 4
      e('old', 's0@students.edu.sg', k.start - 30 * 864e5),                              // the term before
      e('snap', 's1@students.edu.sg', at(1), 'b')]);                                     // a domain snapshot, not an entry
    store.notes = {a1:[{id:'n1', anchor:'entry', text:'Seen.', at:at(2), sentAt:at(2)}], b1:[{id:'n2', anchor:'entry', text:'Drafted', at:at(4), sentAt:null}], c1:[{id:'n3', anchor:'entry', text:'Good', at:at(9), sentAt:at(10)}]};
    store.me = {name:'Ms Lim', role:''};
    return {start:k.start, end:k.end, term:k.n};
  }, {now, names});

  // 1. the count itself, on a fixed day: week 4 of the term
  const k = await p.evaluate(() => { const T = termsFor(termPos(Date.now()).year); return T.find(x => x.n === 4); });
  const wk4 = k.start + 23 * 864e5;
  await seedAt(wk4, NAMES);
  const pure = await p.evaluate(now => ({all:pilotWeeks(store.items, store.notes, () => true, now), a:pilotWeeks(store.items, store.notes, sk => inGroup(sk, '3A'), now)}), wk4);
  const row = r => r.weeks.map(w => `${w.n}:${w.shared}/${w.replied}`).join(' ');
  check('week by week: Alya counts once, a drafted reply does not count, a snapshot and last term are left out', pure.all.term === 4 && row(pure.all) === '1:2/1 2:1/1 3:0/0 4:1/0', row(pure.all));
  check('the group filter narrows it to 3A', row(pure.a) === '1:2/1 2:0/0 3:0/0 4:1/0', row(pure.a));
  const hol = await p.evaluate(({end}) => { const r = pilotWeeks(store.items, store.notes, () => true, end + 3 * 864e5); return {term:r.term, n:r.weeks.length}; }, k);
  const nWeeks = Math.ceil((k.end - k.start) / (7 * 864e5));
  check('in the holiday after term 4 it shows term 4, all its weeks', hol.term === 4 && hol.n === nWeeks, JSON.stringify({hol, nWeeks}));
  const jan = await p.evaluate(y => { const r = pilotWeeks({}, {}, () => true, new Date(y + 1, 0, 1, 9).getTime()); return {term:r.term, year:r.year}; }, new Date(k.start).getFullYear());
  check('before the first term of a year, it shows the last term of the year before', jan.term === 4 && jan.year === new Date(k.start).getFullYear(), JSON.stringify(jan));

  // 2. the card in the Class grid, today: entries placed in this term's latest week
  await p.evaluate(names => {
    const r = pilotWeeks({}, {}, () => true); const w = r.weeks[r.weeks.length - 1]; const t = w.start + 3600e3;
    const st = (i, g) => ({name:names[i], email:'s' + i + '@students.edu.sg', groups:[g]});
    store.students = {'s0@students.edu.sg':st(0, '3A'), 's2@students.edu.sg':st(2, '3B')};
    const e = (key, sk) => [key, {key, sk, kind:'e', data:{id:key, kind:'grow', created:t, context:{type:'subject', name:'Chemistry'}, answers:{}}, received:t, opened:true, via:'link'}];
    store.items = Object.fromEntries([e('x1', 's0@students.edu.sg'), e('x2', 's2@students.edu.sg')]);
    store.notes = {x1:[{id:'m1', anchor:'entry', text:'Seen.', at:t, sentAt:t}]};
    store.me = {name:'Ms Lim', role:''};
    showTab('grid');
  }, NAMES);
  await sleep(400);
  const card = await p.evaluate(() => { const b = document.querySelector('#pilotBox'); const rows = [...b.querySelectorAll('tbody tr')]; return {h:b.querySelector('h2').textContent, n:rows.length, last:[...rows[rows.length - 1].querySelectorAll('td')].map(td => td.textContent).join('/'), btn:!!b.querySelector('#pilotCopy'), above:!!(b.compareDocumentPosition(document.querySelector('#gridTable')) & Node.DOCUMENT_POSITION_FOLLOWING)}; });
  check('Class grid shows the term week by week, above the grid, this week with 2 shared and 1 replied', /^Term \d, week by week$/.test(card.h) && card.n >= 1 && card.last === '2/1' && card.btn && card.above, JSON.stringify(card));
  await p.selectOption('#gGroup', '3B'); await sleep(300);
  const b3 = await p.evaluate(() => { const rows = [...document.querySelectorAll('#pilotBox tbody tr')]; return [...rows[rows.length - 1].querySelectorAll('td')].map(td => td.textContent).join('/'); });
  check('choosing 3B in the group filter changes the count: 1 shared, none replied', b3 === '1/0', b3);
  const a1 = await axe(p); check('the pilot card has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await p.screenshot({path:shots('t33-pilot-1280.png'), animations:'disabled', clip:await p.evaluate(() => { const r = document.querySelector('#pilotBox').getBoundingClientRect(); return {x:0, y:Math.max(0, r.top + scrollY - 20), width:1280, height:Math.min(700, r.height + 60)}; })});

  // 3. Copy for the pilot lead: counts only, never names
  await p.selectOption('#gGroup', ''); await sleep(300);
  await p.evaluate(() => { window.__copied = ''; Object.defineProperty(navigator.clipboard, 'writeText', {configurable:true, value:t => { window.__copied = t; return Promise.resolve(); }}); });
  await p.click('#pilotCopy'); await sleep(300);
  const copied = await p.evaluate(() => window.__copied);
  const lines = copied.split('\n');
  check('the copy names the teacher, the group and the term, then a line a week', /^E21CC pilot · Ms Lim · All groups · Term \d, \d{4}$/.test(lines[0]) && /^Week \d+ \(from .+\): 2 shared, 1 got a reply$/.test(lines[lines.length - 1]), JSON.stringify(lines.slice(0, 2).concat(lines.slice(-1))));
  check('the copy carries no student names or emails', !NAMES.some(n => copied.includes(n) || copied.includes(n.split(' ')[0])) && !/@/.test(copied), copied.slice(0, 120));

  await ctx.close();
  check('no page errors', !errors.length, errors.join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
