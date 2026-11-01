// t9: Beatty's statements, securing, levels, the teacher's confirmation, SEC, ASK, the four views, the name
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const BASE = (process.env.BASE || 'http://localhost:8123/e21cclog/'); const SHOTS = require('./shots.js')('v2-');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
// the fixture's dates move with today, so its entries keep their age
const seed3 = require('./fixtures/rebase.js')(JSON.parse(fs.readFileSync(__dirname + '/fixtures/seed3.json', 'utf8')));
// seed4: Upper Sec met in both Critical Thinking strands, so Leading waits for a teacher
const seed4 = JSON.parse(JSON.stringify(seed3)); const P4 = seed4.profiles[seed4.current];
P4.email = 'wei_ling_tan@students.edu.sg'; P4.level = 4; const D = 864e5; const now = Date.now();
const Q = 'I weighed both arguments because the evidence pointed two ways, and I decided on the stronger one.';
const mk = (id, days, name) => ({id, kind:'grow', created:now - days * D, updated:now - days * D, context:{type:'subject', name}, subject:name, topic:'Debate', groupCode:'', answers:{g1:Q}, competencies:[{id:'critical', level:2, where:''}], notes:[], sent:{},
  links:['ct1.u1', 'ct1.u2', 'ct2.u1', 'ct2.u2'].map(sid => ({sid, quote:Q, at:now - days * D})), e21cc:{source:'builtin', stance:'competency', evidence:[{id:'critical', strength:'strong', quote:Q, why:''}], statements:[], suggested:[], tagged_not_shown:[]}});
P4.entries = [mk('L1', 30, 'Mathematics'), mk('L2', 10, 'English')];
(async () => {
  const browser = await require('./fixtures/launch.js')();
  const ctx = await browser.newContext({viewport:{width:390, height:844}});
  const page = await ctx.newPage(); const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/400/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  const go = async h => { await page.evaluate(x => location.hash = x, h); await sleep(400); };
  const load = async seed => { await page.goto(BASE + 'index.html#/'); await page.evaluate(s => localStorage.setItem('e21cclog', s), JSON.stringify(seed)); await page.reload(); await sleep(500); await go('#/'); };
  const prof = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); return d.profiles[d.current]; });

  // 1. the set
  await load(seed3);
  const set = await page.evaluate(async () => { const S = normaliseStatementSet(DEFAULT_STATEMENTS); const raw = await (await fetch('statements/beatty-v1.json')).json(); const F = normaliseStatementSet(raw);
    return {strands:S.strands.length, lower:S.list.filter(s => s.band === 'lower').length, upper:S.list.filter(s => s.band === 'upper').length, same:JSON.stringify(S.list.map(s => [s.id, s.text])) === JSON.stringify(F.list.map(s => [s.id, s.text])), comps:[...new Set(S.list.map(s => s.comp))].length, sec:S.list.some(s => s.basket === 'sec'), draft:S.draft}; });
  check('Beatty V1: 18 strands, 38 Lower Sec and 47 Upper Sec statements, nine competencies, none for SEC', set.strands === 18 && set.lower === 38 && set.upper === 47 && set.comps === 9 && !set.sec, JSON.stringify(set));
  check('the embedded set matches statements/beatty-v1.json word for word', set.same && set.draft === 'V1');
  // 2. bands
  const b2 = await page.evaluate(() => ({band:myBand(), mine:myStatements().length, other:otherStatements().length, coach:coachSystem(null, myStatements()).match(/\[[a-z]{2}\d\.[lu]\d\]/g).length, upperInCoach:/\[[a-z]{2}\d\.u\d\]/.test(coachSystem(null, myStatements()))}));
  check('Sec 2: Lower Sec is their band, Upper Sec the stretch; the coach gets only their band', b2.band === 'lower' && b2.mine === 38 && b2.other === 47 && b2.coach === 38 && !b2.upperInCoach, JSON.stringify(b2));
  await go('#/c/critical');
  const labels = await page.$eval('.strand', s => [...s.querySelectorAll('.bandlbl')].map(x => x.textContent.trim()));
  check('a competency shows its two strands as ladders, own band first, stretch after', (await page.$$('.strand')).length === 2 && labels[0] === 'Lower Sec · your band' && labels[1] === 'Upper Sec · stretch', labels.join(' | '));
  // 3. securing, as the student sees it
  const rows = await page.$$eval('.ladder .st', l => l.map(x => ({cls:x.className, t:x.querySelector('.st-text').textContent, line:(x.querySelector('.stl') || {}).textContent || ''})));
  const r1 = rows.find(r => r.t.startsWith('I can explain my thinking and decisions using evidence')); const r2 = rows.find(r => r.t.startsWith('I can consider viewpoints different from my own'));
  check('two entries, two subjects, two weeks apart: secured', r1 && r1.cls.includes('s-secured') && r1.line.startsWith('Secured · Chemistry, English'), JSON.stringify(r1));
  check('two entries, two subjects, under two weeks: not yet, with the date', r2 && r2.cls.includes('s-started') && /2 entries.*on or after \d+ \w+/.test(r2.line), JSON.stringify(r2));
  await go('#/c/collaboration');
  const r3 = await page.$eval('.ladder .st.s-started .stl', x => x.textContent);
  check('one entry: asks for another subject or CCA', r3.includes('1 of 2 entries') && r3.includes('other than Football'), r3);
  await go('#/');
  const home = await page.textContent('main');
  check('Home (v3): what was secured this term, and what is almost secured under What next', home.includes('You secured 1 statement this term') && home.includes('Almost secured:') && !home.includes('Showcase'), '');
  check('Home (v3): the aim shows under Longer term', home.includes('Aiming for: “I can reflect on how I think and learn'));
  // 4. changing the level changes the band
  await go('#/settings?s=me'); await page.click('[data-lv="4"]'); await sleep(200);
  const b4 = await page.evaluate(() => ({band:myBand(), mine:myStatements().length}));
  await go('#/c/critical');
  const l4 = await page.$eval('.strand', s => [...s.querySelectorAll('.bandlbl')].map(x => x.textContent.trim()));
  check('Sec 4: Upper Sec becomes their band, Lower Sec earlier ground', b4.band === 'upper' && b4.mine === 47 && l4[0] === 'Upper Sec · your band' && l4[1] === 'Lower Sec · earlier ground' && (await prof()).level === 4, JSON.stringify(b4) + l4.join('|'));
  // 5. SEC: evidence only
  await go('#/c/selfmanage');
  check('SEC: no ladders, no level, evidence only', !(await page.$('.ladder')) && (await page.textContent('.comp-hero')).includes('Evidence only') && (await page.textContent('main')).includes('No statements yet'));
  // 6. ASK
  await go('#/journal/ask');
  check('ASK: a placeholder journal, switched beside GROW and ACT', (await page.textContent('h1')) === 'ASK journal' && (await page.textContent('.jswitch a.on')).startsWith('ASK') && !(await page.$('textarea')));
  await go('#/journal'); check('Journals remembers the last journal', (await page.evaluate(() => location.hash)) === '#/journal/ask');
  // 7. the claim: at most two
  await go('#/write/grow'); await page.click('.xchips .chip'); await sleep(150);
  await page.click('#cNext'); await sleep(150); await page.fill('[data-a=g1]', 'Our group divided the roles and we agreed together on the plan, because Siti was careful.'); await page.fill('[data-a=g2]', 'I explained the method to my friend in my own words and checked she understood.');
  for (let i = 0; i < 4; i++){ await page.click('#cNext'); await sleep(150); }
  const cards = await page.$$('.claim .cpick'); await cards[0].click(); await sleep(200); await (await page.$$('.claim .cpick'))[1].click(); await sleep(200); await (await page.$$('.claim .cpick'))[2].click(); await sleep(200);
  check('the claim takes at most two statements, each with a sentence of the student’s', (await page.$$('.claim.on')).length === 2 && (await page.textContent('#toast')).includes('up to two') && (await page.$$eval('.claim.on .where q', l => l.length)) === 2);
  await page.click('#cNext'); await sleep(200); await page.click('#cSave'); await sleep(600);
  const newest = (await prof()).entries.sort((a, b) => b.created - a.created)[0];
  check('Log it: the claim becomes the entry’s links, and its competencies follow', newest.links.length === 2 && newest.competencies.length >= 1 && newest.links.every(l => l.quote.length > 10), JSON.stringify(newest.links));
  check('the entry lists the statements it backs', (await page.textContent('.backs')).includes('Statements this entry backs'));
  // 8. levels: waiting for a teacher, then the teacher confirms
  await load(seed4);
  await go('#/c/critical');
  check('Upper Sec met in both strands: the top level (Charting in this look), waiting for a teacher', (await page.textContent('.comp-hero .pill')).includes('Charting: waiting for a teacher') && (await page.textContent('.comp-hero')).includes('ask them to confirm'));
  const link = await page.evaluate(async () => consoleUrl() + '#/in?p=' + await packCDL('i', {v:1, from:await senderInfo(), items:[{t:'b', b:basketSnapshot('cait')}]}));
  const tp = await ctx.newPage(); tp.on('pageerror', e => errors.push('TEACHER ' + e.message));
  await tp.goto(BASE + 'teacher.html'); await tp.evaluate(() => localStorage.removeItem('e21cclog.teacher')); await tp.goto(link.replace(/^.*teacher\.html/, BASE + 'teacher.html')); await sleep(900);
  await tp.evaluate(() => { window._copied = ''; navigator.clipboard.writeText = t => { window._copied = t; return Promise.resolve(); }; });
  check('teacher console: the shared domain shows levels and a Confirm Proficient button', (await tp.textContent('.reader')).includes('Proficient: waiting for a teacher') && !!(await tp.$('[data-confirm]')));
  await tp.screenshot({path:SHOTS + 't9-teacher-confirm.png', fullPage:true});
  await tp.click('[data-confirm]'); await sleep(500); await tp.click('#dCopy'); await sleep(200);
  const conf = await tp.evaluate(() => window._copied);
  await tp.click('#dDone'); await sleep(300);
  check('the confirmation is a note link for this student, remembered as sent', /index\.html#\/note\?n=CDL[01]\.n\./.test(conf) && (await tp.textContent('.reader')).includes('You confirmed this'), conf.slice(0, 80));
  await tp.click('.tabs [data-tab=grid]'); await sleep(300);
  check('class grid: one letter per competency, ! where Leading waits', (await tp.$$eval('.lvc.w', l => l.length)) === 1);
  await tp.click('.tabs [data-tab=statements]'); await sleep(300);
  check('teacher console: Beatty’s statements with the Draft V1 label', (await tp.textContent('#stDraft')) === 'Draft V1' && (await tp.$$('#stList details')).length === 14 && (await tp.$$eval('#stList .ladder li', l => l.length)) === 85);
  await page.goto(conf.replace(/^.*index\.html/, BASE + 'index.html')); await sleep(1000);
  const p4 = await prof();
  check('the student opens it: the top level in Critical Thinking, in their look’s word', p4.confirmed.critical && p4.confirmed.critical.by && (await page.evaluate(() => location.hash)) === '#/c/critical' && (await page.textContent('.comp-hero .pill')) === 'Charting', JSON.stringify(p4.confirmed));
  await page.screenshot({path:SHOTS + 't9-leading.png', fullPage:true});
  const other = await page.evaluate(async () => location.href.replace(/#.*$/, '') + '#/note?n=' + await packCDL('n', {v:1, to:'0000000000000000', by:{name:'X'}, notes:[], confirms:[{comp:'adaptive', at:Date.now()}]}));
  await page.goto(other); await sleep(800);
  check('a confirmation for another student is refused', !(await prof()).confirmed.adaptive && (await page.textContent('body')).includes('different student email'));
  // 9. the four views, light and dark, chosen in Settings
  await page.click('#dClose'); await sleep(200); await page.goto(BASE + 'index.html#/settings?s=look'); await sleep(500);
  for (const k of ['a', 'c', 'd', 'b']){ await page.click(`[data-lk=${k}]`); await sleep(120); }
  await page.click('[data-lk=c]'); await page.click('[data-th=dark]'); await page.click('[data-col=plum]'); await sleep(200); await page.reload(); await sleep(500);
  const ds = await page.evaluate(() => ({...document.body.dataset}));
  check('Settings: a view, a theme and a colour, kept after reload', ds.look === 'c' && ds.theme === 'dark' && ds.colour === 'plum', JSON.stringify(ds));
  await page.click('[data-th=light]'); await page.click('[data-lk=b]'); await page.click('[data-col=navy]'); await sleep(200);
  // 10. the name: E21CC Log, never portfolio or folio
  const files = ['index.html', 'teacher.html', 'assets/app.js', 'assets/core.js', 'manifest.webmanifest', 'README.md', 'DESIGN.md'].map(f => [f, fs.readFileSync(require('path').join(__dirname, '..', f), 'utf8')]);
  const bad = files.filter(([f, t]) => f !== 'DESIGN.md' && /portfolio|\bfolio/i.test(t)).map(([f]) => f);
  const old = files.filter(([f, t]) => f !== 'DESIGN.md' && /E21CC Learning Log/.test(t)).map(([f]) => f);
  check('no portfolio or folio anywhere; the old name only in DESIGN history', !bad.length && !old.length, bad.concat(old).join(', '));
  const title = await page.title();
  check('the page is called E21CC Log; the version shows in the app, not the title or the address', title.startsWith('E21CC Log') && !/v\d/.test(title) && (await page.textContent('.topbar .word')) === 'E21CC Logv3' && (await page.textContent('.topbar .vmark')) === 'v3');
  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
})();
