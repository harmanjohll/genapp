const { chromium } = require('playwright');
const { v1 } = require('./fixtures/fixture.js');
const APP = (process.env.BASE || 'http://localhost:8123/e21cclog/') + 'index.html', CON = (process.env.BASE || 'http://localhost:8123/e21cclog/') + 'teacher.html'; const SHOTS = require('./shots.js')('v2-');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const check = (name, ok, info='') => console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : ''));
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({viewport:{width:390, height:844}, deviceScaleFactor:2}); const errors = [];
  const watch = p => { p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); p.on('pageerror', e => errors.push('PAGEERROR ' + e.stack.split('\n').slice(0,3).join(' / '))); };
  const stu = await ctx.newPage(); watch(stu);
  await stu.goto(APP + '#/welcome'); await stu.evaluate(d => { localStorage.clear(); d.current = 'p1'; localStorage.setItem('logs.v1', JSON.stringify(d)); }, v1); await stu.goto(APP + '#/'); await stu.reload(); await sleep(900);
  // share e3 with Mr Tan (no drop box): Teams link
  await stu.evaluate(() => location.hash = '#/entry/e3'); await sleep(400);
  await stu.click('#eShare'); await sleep(200); await stu.click('#dGo'); await sleep(700);
  const msg = new URL(await stu.$eval('#dTeams', a => a.href)).searchParams.get('message'); const shareLink = msg.slice(msg.indexOf('http'));
  await stu.click('#dDone'); await sleep(200);
  // teacher opens the link
  const c0 = await ctx.newPage(); await c0.goto(CON); await c0.evaluate(() => localStorage.removeItem('e21cclog.teacher')); await c0.close();
  const con = await ctx.newPage(); watch(con); await con.goto(shareLink); await sleep(1200);
  check('share link lands in the Inbox, opened', await con.$$eval('#inboxList .reader', l => l.length) === 1 && (await con.evaluate(() => location.hash)) === '');
  await con.screenshot({path:SHOTS + '50-console-reader-390.png', fullPage:true});
  // a note on g1 and one on the whole entry
  await con.click('[data-note$="|g1"]'); await con.fill('.noteedit textarea', 'Who called the switch first? Name them, and say what you noticed.'); await con.click('.noteedit .btn'); await sleep(200);
  await con.click('[data-note$="|entry"]'); await con.fill('.noteedit textarea', 'Good: you wrote about how the team worked, not the score.'); await con.click('.noteedit .btn'); await sleep(200);
  check('two pending notes shown', await con.$$eval('#inboxList .mnote.pending', l => l.length) === 2);
  await con.click('[data-sendnotes]'); await sleep(700);
  const teams = new URL(await con.$eval('#dTeams', a => a.href));
  const nmsg = teams.searchParams.get('message'); const noteLink = nmsg.slice(nmsg.indexOf('http'));
  check('Teams chat addressed to the student', teams.searchParams.get('users') === 'aisha_tan@students.edu.sg' && noteLink.includes('index.html#/note?n=CDL'), noteLink.slice(0, 80));
  await con.screenshot({path:SHOTS + '51-console-send.png', fullPage:false});
  await con.click('#dDone'); await sleep(300);
  check('notes marked sent', await con.$$eval('#inboxList .mnote.pending', l => l.length) === 0);
  // student opens the note link
  await stu.goto(noteLink); await sleep(1000);
  const landed = await stu.evaluate(() => ({hash:location.hash, g1:document.querySelectorAll('.qa-row[data-anchor=g1] .mnote').length, top:document.querySelectorAll('.entrycard > .mnote').length}));
  check('round trip: notes land beside g1 and on the entry', landed.hash.startsWith('#/entry/e3') && landed.g1 === 1 && landed.top === 1, JSON.stringify(landed));
  // Excel paste: header row, a payload row split over three answers, a legacy text only row
  const rows = await stu.evaluate(async () => {
    const sink = {kind:'gforms', url:'x', fields:{}}; const e = me.entries.find(x => x.id === 'e1'); e.answers.o1 = 'x'.repeat(10);
    const big = JSON.parse(JSON.stringify(e)); big.id = 'big1'; big.answers.g2 = Array.from({length:900}, () => Math.random().toString(36).slice(2, 8)).join(' ');
    const from = await senderInfo();
    const subs = await buildSubmissions(sink, s => readableFields({email:'tan_ah_kow@moe.edu.sg', groupCode:'DEMO'}, s), from, [{t:'e', e:compactEntry(big)}, {t:'b', b:basketSnapshot('cait')}], {chunk:3900});
    return subs.map(s => s.fields);
  });
  const cols = ['timestamp','studentName','studentEmail','classCode','teacherEmail','framework','subject','topic','entry','competencies','depth','nextStep','entryId','context','section','payload1','payload2','payload3'];
  const q = v => /[\t\n"]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v ?? '');
  let tsv = cols.join('\t') + '\n' + rows.map(f => cols.map(c => q(f[c] || '')).join('\t')).join('\n');
  tsv += '\n' + cols.map(c => q({timestamp:'2026-10-01T10:00:00Z', studentName:'Ben Lim', studentEmail:'ben_lim@students.edu.sg', classCode:'DEMO', framework:'GROW', subject:'History', topic:'Sources', entry:'G · What is one thing I understand from the lesson?\nSources can disagree, "and" that is useful.', entryId:'old1'}[c] || '')).join('\t');
  check('payload needed more than one answer', rows.some(f => f.payload2), rows.map(f => [f.payload1.length, (f.payload2||'').length, (f.payload3||'').length].join('/')).join(' '));
  await con.click('[data-tab=inbox]'); await con.fill('#paste', tsv); await con.click('#pasteGo'); await sleep(800);
  const pm = await con.textContent('#pasteMsg');
  check('paste from Excel reads payload and text rows', /3 new items from 2 students/.test(pm), pm);
  await con.fill('#paste', tsv); await con.click('#pasteGo'); await sleep(600);
  check('pasting again adds nothing', /0 new items/.test(await con.textContent('#pasteMsg')), await con.textContent('#pasteMsg'));
  await con.screenshot({path:SHOTS + '52-console-inbox.png', fullPage:true});
  // grid and students
  await con.click('[data-tab=grid]'); await sleep(300);
  check('class grid has two students', await con.$$eval('.gridtable tbody tr', l => l.length) === 2);
  await con.screenshot({path:SHOTS + '53-console-grid.png', fullPage:true});
  await con.click('[data-student]'); await sleep(300);
  check('students tab shows a timeline', await con.$$eval('#studentView .item', l => l.length) >= 1);
  // set up: form class reveals the statements card; preview works
  await con.click('[data-tab=setup]'); await sleep(200); await con.selectOption('#type', 'form'); await sleep(200);
  check('form class shows statements card', await con.$eval('#formOnly', el => !el.hidden));
  await con.setViewportSize({width:1280, height:900}); await con.click('[data-tab=inbox]'); await sleep(200);
  await con.click('#inboxList .item'); await sleep(300);
  await con.screenshot({path:SHOTS + '54-console-1280.png', fullPage:false});
  const ov = await con.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await con.setViewportSize({width:360, height:780}); await sleep(200);
  const ov2 = await con.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('console has no sideways scroll at 1280 and 360', ov <= 1 && ov2 <= 1, `${ov} ${ov2}`);
  console.log('ERRORS', errors.length ? errors : 'none');
  await browser.close();
})();
