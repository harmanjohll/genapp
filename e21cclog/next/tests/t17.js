// t17 (next, A2): pick your teachers. With the school staff list on the device, each subject and CCA offers
// the teachers who teach it at the student's Sec level, and the form teacher list offers everyone; picks are
// kept, survive a newer list, and make each entry know its teacher; nothing is shared until the student says so.
const fs = require('fs'); const path = require('path');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/next/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/seed3.json'), 'utf8'));
const T = (name, email, subjects, ccas = [], form = '') => ({name, email, subjects:subjects.map(([n, l]) => ({name:n, levels:l || []})), ccas, form});
const STAFF = [
  T('Mr Tan', 'tan_ah_kow@moe.edu.sg', [['Mathematics', [1, 2]]], [], '2E1'),
  T('Ms Lee', 'lee_wen@moe.edu.sg', [['Mathematics', [3, 4]]]),
  T('Ms Lim', 'lim_mei@moe.edu.sg', [['Chemistry']]),
  T('Mr Ong', 'ong_kah@moe.edu.sg', [['Physical Education']], ['Football']),
  T('Ms Goh', 'goh_siew@moe.edu.sg', [['English Language']], [], '2E2'),
  T('Mdm Siti', 'siti_r@moe.edu.sg', [['Geography', [1, 2]]], ['Malay Dance'])
];
(async () => {
  const browser = await launch(); const errors = [];
  const watch = p => p.on('pageerror', e => errors.push(p.url().split('#')[0] + ' ' + e.message));
  const axe = async (p, sel) => { await p.addScriptTag({content:AXE}); return p.evaluate(async s => (await axe.run(document.querySelector(s), {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' ')), sel); };
  const ctx = await browser.newContext({viewport:{width:390, height:844}}); const p = await ctx.newPage(); watch(p);
  const go = async h => { await p.evaluate(x => location.hash = x, h); await sleep(500); };
  await p.goto(BASE + 'index.html'); await p.evaluate(x => localStorage.setItem('e21cclog.next', x), JSON.stringify(seed)); await p.reload(); await sleep(700);

  // 1. no staff list yet: one line says how to get it
  await go('#/settings?s=expCard');
  check('without a staff list, the card says to ask for the school link', /Ask your teacher for the school link to pick your teachers\./.test(await p.textContent('#expCard')) && !(await p.$('[data-tpick]')));

  // 2. with the list: a select per subject and CCA, filtered by subject and Sec level; the form teacher list has everyone
  await p.evaluate(list => { db.staff = {at:Date.now(), loaded:Date.now(), list}; saveDb(); }, STAFF); await p.reload(); await sleep(700); await go('#/settings?s=expCard');
  const opts = sel => p.$$eval(`[data-tpick="${sel}"] option`, l => l.map(o => o.textContent));
  const maths = await opts('subject|Mathematics'), football = await opts('cca|Football'), form = await opts('form|'), chem = await opts('subject|Chemistry');
  check('a Sec 2 student is offered the Sec 1 and 2 Maths teacher, not the Upper Sec one', JSON.stringify(maths) === JSON.stringify(['Not chosen', 'Mr Tan']), JSON.stringify(maths));
  check('a subject taught at every level offers its teacher, and the CCA offers its teacher', JSON.stringify(chem) === JSON.stringify(['Not chosen', 'Ms Lim']) && JSON.stringify(football) === JSON.stringify(['Not chosen', 'Mr Ong']), JSON.stringify({chem, football}));
  check('the form teacher list has everyone, with form teachers first and their class shown', form.length === 7 && form[1] === 'Mr Tan (2E1)' && form[2] === 'Ms Goh (2E2)', JSON.stringify(form));
  const sci = await p.evaluate(() => [...document.querySelectorAll('#tpicks .slv')].find(x => x.textContent.startsWith('Science')).textContent);
  check('a subject nobody on the list teaches says so instead of an empty choice', /None on the school list/.test(sci), sci);
  const labels = await p.$$eval('[data-tpick]', l => l.every(s => (s.getAttribute('aria-label') || '').startsWith('Your ')));
  check('every teacher choice is labelled for screen readers', labels);
  const a1 = await axe(p, '#expCard'); check('the card has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await p.evaluate(() => document.querySelector('[data-tpick]').scrollIntoView({block:'center'})); await p.screenshot({path:shots('t17-settings-phone.png'), animations:'disabled'});

  // 3. picking: kept, and each teacher appears once with every role
  await p.selectOption('[data-tpick="subject|Mathematics"]', 'tan_ah_kow@moe.edu.sg'); await sleep(200);
  await p.selectOption('[data-tpick="subject|Chemistry"]', 'lim_mei@moe.edu.sg'); await sleep(200);
  await p.selectOption('[data-tpick="cca|Football"]', 'ong_kah@moe.edu.sg'); await sleep(200);
  await p.selectOption('[data-tpick="form|"]', 'tan_ah_kow@moe.edu.sg'); await sleep(300);
  await p.reload(); await sleep(700); await go('#/settings?s=expCard');
  const kept = await p.evaluate(() => ({m:document.querySelector('[data-tpick="subject|Mathematics"]').value, f:document.querySelector('[data-tpick="form|"]').value, c:document.querySelector('[data-tpick="cca|Football"]').value, saved:JSON.parse(localStorage.getItem('e21cclog.next')).profiles[db.current].teachers}));
  check('the picks are kept after a reload', kept.m === 'tan_ah_kow@moe.edu.sg' && kept.f === 'tan_ah_kow@moe.edu.sg' && kept.c === 'ong_kah@moe.edu.sg' && kept.saved.subjects.Chemistry.email === 'lim_mei@moe.edu.sg', JSON.stringify(kept.saved));
  const ad = await p.evaluate(() => adults().filter(a => a.staff).map(a => ({id:a.id, name:a.name, role:a.role, teaches:a.teaches})));
  const tan = ad.find(a => a.id === 't:tan_ah_kow@moe.edu.sg');
  check('each picked teacher is one adult, with every role they hold', ad.length === 3 && tan && tan.role === 'Subject teacher · Form teacher' && tan.teaches.join() === 'Mathematics' && ad.find(a => a.name === 'Mr Ong').role === 'CCA teacher', JSON.stringify(ad));

  // 4. each entry knows its teacher
  const tf = await p.evaluate(() => { const by = id => { const t = teacherFor(me.entries.find(e => e.id === id)); return t ? t.name : null; };
    return {maths:by('s3e5'), chem:by('s3e0'), football:by('s3e2'), science:by('s3e4'), camp:(teacherFor({context:{type:'camp', name:'Sec 2 camp'}}) || {}).name || null}; });
  check('a Maths entry knows Mr Tan, a Chemistry entry Ms Lim, a Football entry Mr Ong; Science and a camp have none', tf.maths === 'Mr Tan' && tf.chem === 'Ms Lim' && tf.football === 'Mr Ong' && tf.science === null && tf.camp === null, JSON.stringify(tf));

  // 5. nothing is shared until the student says so
  const shared = await p.evaluate(() => adults().filter(a => a.staff).map(a => ({s:sectionsOf(a).length, u:unsentFor(a).length})));
  check('picking a teacher shares nothing: no sections are on and nothing waits to be sent', shared.every(x => x.s === 0 && x.u === 0), JSON.stringify(shared));
  await go('#/sharing');
  check('the Sharing page lists the picked teachers, ready for the student to choose what they see', /Mr Tan/.test(await p.textContent('#app')) && /Subject teacher · Form teacher/.test(await p.textContent('#app')));

  // 6. a newer list: picks still on it stay; a teacher no longer on it is shown as such
  await p.evaluate(list => { db.staff = {at:Date.now() + 1000, loaded:Date.now(), list:list.filter(t => t.email !== 'lim_mei@moe.edu.sg')}; saveDb(); }, STAFF); await p.reload(); await sleep(700); await go('#/settings?s=expCard');
  const after = await p.evaluate(() => ({m:document.querySelector('[data-tpick="subject|Mathematics"]').value, chem:document.querySelector('[data-tpick="subject|Chemistry"] option:checked').textContent}));
  check('with a newer list, Mr Tan stays picked, and Ms Lim shows as no longer on the school list', after.m === 'tan_ah_kow@moe.edu.sg' && after.chem === 'Ms Lim (no longer on the school list)', JSON.stringify(after));
  await p.selectOption('[data-tpick="subject|Chemistry"]', ''); await sleep(300);
  check('Not chosen clears a pick', await p.evaluate(() => !me.teachers.subjects.Chemistry));

  // 7. the same choices at setup, on a laptop
  await p.setViewportSize({width:1280, height:800}); await go('#/setup'); await sleep(300);
  const setup = await p.evaluate(() => ({n:document.querySelectorAll('[data-tpick]').length, m:(document.querySelector('[data-tpick="subject|Mathematics"]') || {}).value}));
  check('setup shows the same teacher choices', setup.n >= 4 && setup.m === 'tan_ah_kow@moe.edu.sg', JSON.stringify(setup));
  await p.evaluate(() => document.querySelector('[data-tpick]').scrollIntoView({block:'center'})); await p.screenshot({path:shots('t17-setup-laptop.png'), animations:'disabled'});

  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
