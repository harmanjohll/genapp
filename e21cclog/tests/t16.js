// t16 (A1): the school staff list. The console reads a CSV or rows pasted from Excel, flags what needs
// fixing, makes one school link only when every row is fine, and keeps the list; a student who opens the link
// keeps the list on the device, with no log, a locked log or an open one, and a newer link replaces an older list.
const fs = require('fs'); const path = require('path');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = fs.readFileSync(path.join(__dirname, 'fixtures/seed3.json'), 'utf8');
const CSV = [
  'Name,Email,Subjects,CCAs,Form class',
  'Mr Tan,Tan_Ah_Kow@moe.edu.sg,"Mathematics: Sec 1, Sec 2; Science: Sec 1",Concert Band,2e1',
  '"Lim, Mei",lim_mei@moe.edu.sg,Chemistry: Upper Sec,Choir,',
  '',
  'Ms Goh,goh_siew@moe.edu.sg,English Language,,2E1',
  'Mr Ong,ong_kah@moe.edu.sg,Physical Education,Football,',
  'Mdm Siti,siti_r@moe.edu.sg,Malay Language: Sec 1 to 4,Malay Dance,3E2',
  'No Mail,,Mathematics,,',
  'Ms Astro,astro@moe.edu.sg,Astrology: Sec 3,Kite Club,'
].join('\r\n');
(async () => {
  const browser = await launch(); const errors = [];
  const watch = p => p.on('pageerror', e => errors.push(p.url().split('#')[0] + ' ' + e.message));
  const axe = async (p, sel) => { await p.addScriptTag({content:AXE}); return p.evaluate(async s => (await axe.run(s ? document.querySelector(s) : document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' ')), sel); };
  const staffOf = p => p.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog') || '{}'); return d.staff || null; });

  // 1. the reader: quotes, commas inside quotes, blank lines, rows pasted from Excel; the flags
  const ctx = await browser.newContext({viewport:{width:1280, height:900}}); await ctx.addInitScript(() => { window._copied = ''; try{ navigator.clipboard.writeText = t => { window._copied = t; return Promise.resolve(); }; }catch{} });
  const t = await ctx.newPage(); watch(t);
  await t.goto(BASE + 'teacher.html'); await t.evaluate(() => localStorage.removeItem('e21cclog.teacher')); await t.reload(); await sleep(500);
  const unit = await t.evaluate(csv => {
    const tsv = parseTable('Name\tEmail\tSubjects\nMr Tan\ttan@moe.edu.sg\tMathematics: Sec 1, Sec 2');
    const r = staffFromTable(parseTable(csv));
    return {rows:parseTable(csv).length, tsv:tsv[1], lim:r.staff[1].name, tan:r.staff[0], flags:r.staff.map(x => [x.errors.length, x.warnings.length]), noHead:staffFromTable(parseTable('Mr Tan,tan@moe.edu.sg')).problem,
      levels:[secLevels('Sec 1 to 4'), secLevels('Upper Sec'), secLevels(''), secLevels('all levels')]};
  }, CSV);
  check('the reader keeps quoted commas, skips blank lines, and reads rows pasted from Excel', unit.rows === 8 && unit.lim === 'Lim, Mei' && unit.tsv[2] === 'Mathematics: Sec 1, Sec 2', JSON.stringify({rows:unit.rows, tsv:unit.tsv}));
  check('a teacher’s email, form class, subjects with their Sec levels and CCAs are read and tidied', unit.tan.email === 'tan_ah_kow@moe.edu.sg' && unit.tan.form === '2E1' && JSON.stringify(unit.tan.subjects) === JSON.stringify([{name:'Mathematics', levels:[1, 2]}, {name:'Science', levels:[1]}]) && unit.tan.ccas[0] === 'Concert Band', JSON.stringify(unit.tan));
  check('levels read as ranges, Lower and Upper Sec, and every level when none are given', JSON.stringify(unit.levels) === JSON.stringify([[1, 2, 3, 4], [3, 4, 5], [], []]), JSON.stringify(unit.levels));
  check('flags: no email and an unknown subject are errors; an unknown CCA is only a warning; a list with no headings says so', JSON.stringify(unit.flags) === JSON.stringify([[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [1, 0], [1, 1]]) && /headings/.test(unit.noHead), JSON.stringify(unit.flags));
  const dupe = await t.evaluate(() => staffFromTable(parseTable('Name,Email\nA,a@moe.edu.sg\nB,A@moe.edu.sg')).staff[1].errors.join());
  check('the same email twice is flagged on the second row', /same email as row 1/.test(dupe), dupe);

  // 2. the console: check, the flags, the link held back until every row is fine
  await t.click('.tabs [data-tab=setup]'); await sleep(300);
  await t.fill('#staffCsv', CSV); await t.click('#staffCheck'); await sleep(300);
  const c1 = await t.evaluate(() => ({rows:document.querySelectorAll('.stafftable tbody tr').length, fix:[...document.querySelectorAll('.stafftable .fixnote')].map(x => x.textContent), warn:/Kite Club is not on the school’s CCA list/.test(document.querySelector('.stafftable').textContent), disabled:document.querySelector('#staffLink').disabled, msg:document.querySelector('#staffMsg').textContent, link:!!document.querySelector('#staffLinkOut')}));
  check('the console shows every teacher and flags the two rows that need fixing, with the CCA as a check only', c1.rows === 7 && c1.fix.length === 2 && c1.fix.some(x => /no email/.test(x)) && c1.fix.some(x => /Astrology is not a subject/.test(x)) && c1.warn, JSON.stringify(c1));
  check('the school link cannot be made while rows are flagged, and the console says why', c1.disabled && c1.msg === 'Fix the 2 flagged rows first.' && !c1.link, JSON.stringify(c1));
  await t.evaluate(() => document.querySelector('#staffCard').scrollIntoView()); await t.screenshot({path:shots('t16-console-flags.png'), animations:'disabled'});
  const a1 = await axe(t, '#staffCard'); check('the staff list card has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await t.click('[data-staffrm="6"]'); await sleep(200); await t.click('[data-staffrm="6"]'); await sleep(300);
  const c2 = await t.evaluate(() => ({rows:document.querySelectorAll('.stafftable tbody tr').length, disabled:document.querySelector('#staffLink').disabled, text:document.querySelector('#staffOut p').textContent, csv:document.querySelector('#staffCsv').value}));
  check('Remove takes a row out of the list itself; with every row fine the link can be made', c2.rows === 5 && !c2.disabled && /5 teachers\. Ready for the school link\./.test(c2.text) && !/No Mail|Astro/.test(c2.csv), JSON.stringify(c2));
  await t.click('#staffLink'); await sleep(500);
  const link5 = await t.inputValue('#staffLinkOut');
  await t.click('#staffCopy'); await sleep(200);
  check('the school link opens the student app with the list packed in it, and Copy puts it on the clipboard', link5.startsWith(BASE + 'index.html#/staff?s=CDL') && (await t.evaluate(() => window._copied)) === link5, link5.slice(0, 90));
  await t.screenshot({path:shots('t16-console-link.png'), animations:'disabled'});
  await t.reload(); await sleep(600); await t.click('.tabs [data-tab=setup]'); await sleep(300);
  const c3 = await t.evaluate(() => ({rows:document.querySelectorAll('.stafftable tbody tr').length, link:(document.querySelector('#staffLinkOut') || {}).value || ''}));
  check('the console keeps the list and its link after a reload', c3.rows === 5 && c3.link === link5, JSON.stringify({rows:c3.rows}));
  const staffJson = await t.evaluate(() => JSON.stringify(localStorage.getItem('e21cclog.teacher')).length);
  check('nothing about staff is in the repository or the website: the list lives in the console’s own storage', staffJson > 0 && !fs_hasStaff());

  // 3. a student with no log: the list is kept, and the welcome page shows
  { const s = await browser.newContext({viewport:{width:390, height:844}}); const p = await s.newPage(); watch(p);
    await p.goto(link5); await sleep(1000);
    const st = await staffOf(p); const toast = await p.textContent('#toast');
    check('with no log yet, the link keeps 5 teachers on the device and shows the welcome page', st && st.list.length === 5 && st.list[1].name === 'Lim, Mei' && (await p.evaluate(() => location.hash)) === '#/welcome' && /staff list is here \(5 teachers\)/.test(toast), JSON.stringify({n:st && st.list.length, toast}));
    await p.reload(); await sleep(700);
    check('the list is still there after a reload', ((await staffOf(p)) || {list:[]}).list.length === 5);
    await s.close(); }

  // 4. a student with an open log: the list is kept, Home shows, and Settings says what is here
  { const s = await browser.newContext({viewport:{width:390, height:844}}); const p = await s.newPage(); watch(p);
    await p.goto(BASE + 'index.html'); await p.evaluate(x => localStorage.setItem('e21cclog', x), seed); await p.reload(); await sleep(700);
    await p.goto(link5); await sleep(900);
    check('with a log open, the link keeps the list and goes Home', ((await staffOf(p)) || {list:[]}).list.length === 5 && (await p.evaluate(() => location.hash)) === '#/');
    await p.evaluate(() => location.hash = '#/settings?s=groups'); await sleep(600);
    const line = await p.textContent('#staffLine');
    check('Settings shows the staff list on this device', /^School staff list: 5 teachers, from /.test(line), line);
    await p.evaluate(() => document.querySelector('#groups').scrollIntoView()); await p.screenshot({path:shots('t16-settings-line.png'), animations:'disabled'});
    const a2 = await axe(p, '#groups'); check('the Settings groups section has no serious or critical accessibility issues', !a2.length, a2.join(' | '));
    // a newer list replaces it; an older link then leaves the newer list alone
    await t.click('[data-staffrm="5"]'); await sleep(300); await t.click('#staffLink'); await sleep(500);
    const link4 = await t.inputValue('#staffLinkOut');
    await p.goto(link4); await sleep(900);
    check('a newer link replaces the list', ((await staffOf(p)) || {list:[]}).list.length === 4);
    await p.goto(link5); await sleep(900);
    check('an older link leaves the newer list in place, and says so', ((await staffOf(p)) || {list:[]}).list.length === 4 && /already has a newer staff list/.test(await p.textContent('#toast')));
    await p.goto(BASE + 'index.html#/staff?s=CDL1.s.notalink'); await sleep(900);
    check('a broken link changes nothing and says so', ((await staffOf(p)) || {list:[]}).list.length === 4 && /did not work/.test(await p.textContent('#toast')) && (await p.evaluate(() => location.hash)) === '#/');
    await s.close(); }

  // 5. a log with a PIN, locked in a new tab: the list is kept and the PIN is still asked for
  { const s = await browser.newContext({viewport:{width:390, height:844}}); const p = await s.newPage(); watch(p);
    await p.goto(BASE + 'index.html'); await sleep(600);
    await p.fill('#newForm [name=name]', 'Wei Ling Tan'); await p.fill('#newForm [name=pin]', '1234'); await p.click('#newForm button[type=submit]'); await sleep(600);
    const tab = await s.newPage(); watch(tab); await tab.goto(link5); await sleep(1000);
    check('a locked log keeps the list from the link, and the PIN is still asked for', ((await staffOf(tab)) || {list:[]}).list.length === 5 && !!(await tab.$('#wPin')) && (await tab.evaluate(() => location.hash)) === '#/welcome');
    await s.close(); }

  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();

// the repository holds no staff list: no file under e21cclog/ names the test teachers' emails
function fs_hasStaff(){
  const root = path.join(__dirname, '..'); const hits = [];
  const walk = d => { for (const f of fs.readdirSync(d, {withFileTypes:true})){ if (f.name === 'node_modules' || f.name === 'out' || f.name === 'tests') continue; const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (/\.(js|json|html)$/.test(f.name) && /goh_siew@|ong_kah@/.test(fs.readFileSync(p, 'utf8'))) hits.push(p); } };
  walk(root); return hits.length > 0;
}
