// t22 (S1): the demo. demo/ links to a student view and a teacher view; each opens made up sample data with
// a banner and an optional tour; neither reads nor changes a real log or a real console on the same device.
const fs = require('fs');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = JSON.parse(fs.readFileSync(__dirname + '/fixtures/seed3.json', 'utf8'));
(async () => {
  const browser = await launch(); const errors = [];
  const watch = p => p.on('pageerror', e => errors.push(p.url().split('#')[0] + ' ' + e.message));
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const ctx = await browser.newContext({viewport:{width:390, height:844}});
  const keys = p => p.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(k => /^e21cclog(\.|$)/.test(k) && !/fresh$/.test(k)).map(k => [k, localStorage.getItem(k)])));

  // a real log and a real, sealed console already on this device
  const real = await ctx.newPage(); watch(real);
  await real.goto(BASE + 'index.html'); await real.evaluate(s => localStorage.setItem('e21cclog', s), JSON.stringify(seed)); await real.reload(); await sleep(900);
  await real.goto(BASE + 'teacher.html'); await sleep(1500);
  const before = await keys(real); await real.close();
  check('a real log and a sealed console are on the device', !!before['e21cclog'] && /sealed/.test(before['e21cclog.teacher'] || '{"sealed":1}') && !!before['e21cclog.teacher.pin'], Object.keys(before).join(', '));

  // 1. the landing page
  const land = await ctx.newPage(); watch(land); await land.goto(BASE + 'demo/'); await sleep(400);
  const links = await land.$$eval('a.door', l => l.map(a => a.getAttribute('href')));
  const who = await land.$$eval('.who h2', l => l.map(h => h.textContent));
  check('demo/ offers the student view and the teacher view, and speaks to students, teachers and parents', JSON.stringify(links) === JSON.stringify(['student/', 'teacher/']) && JSON.stringify(who) === JSON.stringify(['For students', 'For teachers', 'For parents']), JSON.stringify({links, who}));
  const a0 = await axe(land); check('the landing page has no serious or critical accessibility issues', !a0.length, a0.join(' | '));
  await land.screenshot({path:shots('t22-demo-landing.png'), fullPage:true});

  // 2. the student view
  await land.click('a.door[href="student/"]'); await sleep(2200);
  const s1 = await land.evaluate(() => ({url:location.search, name:(document.querySelector('.topbar .sub') || {}).textContent || '', bar:!!document.querySelector('.demo-bar'), tour:(document.querySelector('#demoTour h2') || {}).textContent || '', carry:!!document.querySelector('.carrycard'), from:!!document.querySelector('.fromcard'), entries:me.entries.length}));
  check('demo/student opens Sam Lee’s made up log, with the banner and the tour’s welcome', s1.url === '?demo=student' && /^Sam Lee · Sec 3/.test(s1.name) && s1.bar && /Sam’s log, a term in/.test(s1.tour) && s1.entries >= 12, JSON.stringify(s1));
  check('Home shows the half written entry and a teacher’s note, as a student would see them', s1.carry && s1.from);
  const newest = await land.evaluate(() => Math.max(...me.entries.map(e => e.created)));
  check('the dates move forward to today', Date.now() - newest < 5 * 864e5 && Date.now() - newest > 0, new Date(newest).toISOString());
  const a1 = await axe(land); check('the student demo with banner and tour has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await land.screenshot({path:shots('t22-demo-student-390.png'), animations:'disabled'});
  // every tour step finds what it points at
  await land.click('#demoNext'); await sleep(900); const seen = [];
  for (let i = 0; i < 12; i++){
    const st = await land.evaluate(() => ({h:document.querySelector('#demoTour h2').textContent, spot:document.querySelectorAll('.demo-spot').length, next:!!document.querySelector('#demoNext'), link:(document.querySelector('#demoTour a.demo-btn') || {}).href || ''}));
    seen.push(st); if (!st.next) break; await land.click('#demoNext'); await sleep(1000);
  }
  check('the student tour points at something on every step, and ends with the teacher view', seen.length === 7 && seen.every(s => s.spot === 1) && /teacher\.html\?demo=1$/.test(seen[seen.length - 1].link), JSON.stringify(seen.map(s => s.h + ':' + s.spot)));
  await land.keyboard.press('Escape'); await sleep(200); check('Escape closes the tour', !(await land.$('#demoTour')));
  // trying things changes nothing real: a written entry, a setting
  await land.evaluate(() => { location.hash = '#/'; }); await sleep(400);
  await land.evaluate(() => { me.entries.push(Object.assign({}, me.entries[0], {id:'try1'})); me.prefs.look = 'a'; saveDb(); }); await sleep(200);
  await land.reload(); await sleep(2000);
  check('Start again: a reload brings the sample back as it was', await land.evaluate(() => !me.entries.some(e => e.id === 'try1') && me.prefs.look === 'b'));

  // 3. the teacher view
  await land.goto(BASE + 'demo/teacher/'); await sleep(2500);
  const t1 = await land.evaluate(() => ({url:location.search, gate:!!document.querySelector('#pinGate'), n:Object.keys(store.items).length, me:store.me.name, replies:!document.querySelector('#replyCard').hidden, bar:!!document.querySelector('.demo-bar')}));
  check('demo/teacher opens Mrs Goh’s made up console without a PIN, with the class’s work and replies waiting', t1.url === '?demo=1' && !t1.gate && t1.n > 40 && t1.me === 'Mrs Goh Siew Ling' && t1.replies && t1.bar, JSON.stringify(t1));
  const a2 = await axe(land); check('the console demo with banner and tour has no serious or critical accessibility issues', !a2.length, a2.join(' | '));
  await land.click('#demoNext'); await sleep(900); const tseen = [];
  for (let i = 0; i < 12; i++){
    const st = await land.evaluate(() => ({h:document.querySelector('#demoTour h2').textContent, spot:document.querySelectorAll('.demo-spot').length, next:!!document.querySelector('#demoNext'), link:(document.querySelector('#demoTour a.demo-btn') || {}).href || ''}));
    tseen.push(st); if (!st.next) break; await land.click('#demoNext'); await sleep(1000);
  }
  check('the teacher tour points at something on every step, and ends with the student view', tseen.length === 6 && tseen.every(s => s.spot === 1) && /index\.html\?demo=student$/.test(tseen[tseen.length - 1].link), JSON.stringify(tseen.map(s => s.h + ':' + s.spot)));
  await land.keyboard.press('Escape');
  await land.evaluate(() => { const b = [...document.querySelectorAll('.tabs button')].find(x => x.dataset.tab === 'inbox'); if (b) b.click(); }); await sleep(300);
  const q = await land.$('#inboxList .qchip:not([disabled])'); if (q){ await q.click(); await sleep(400); }
  await land.setViewportSize({width:1280, height:800}); await sleep(400); await land.screenshot({path:shots('t22-demo-teacher-1280.png'), animations:'disabled'}); await land.setViewportSize({width:390, height:844});

  // 4. nothing real was read or changed
  const after = await keys(land);
  check('the real log and the sealed console are exactly as they were', JSON.stringify(after) === JSON.stringify(before), JSON.stringify(Object.keys(after)));

  check('no page errors', !errors.length);
  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
