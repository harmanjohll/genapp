// t26 (B2): one tap backup (the share sheet where it exists, a download otherwise), with drafts; bringing a
// log back on a new device from the welcome page; adding only what is new to a log that is already here (behind
// its PIN), and nothing twice; the backup reminder counting what changed since the last backup.
const fs = require('fs'); const path = require('path');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = JSON.parse(fs.readFileSync(__dirname + '/fixtures/seed3.json', 'utf8')); const P = seed.profiles[seed.current];
P.email = 'wei_ling_tan@students.edu.sg'; delete P.backup;
P.drafts = {grow:{kind:'grow', key:'grow', step:2, context:{type:'subject', name:'Geography'}, subject:'Geography', topic:'Rivers', answers:{g1:'I measured the river width at three sites.'}, claims:[], saved:Date.now() - 3600e3}};
(async () => {
  const browser = await launch(); const errors = [];
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const watch = p => { p.on('pageerror', e => errors.push(e.message)); return p; };
  const toasts = p => p.evaluate(() => { window.__toasts = []; const t = toast; toast = (m, ...a) => { window.__toasts.push(m); return t(m, ...a); }; });

  // 1. a backup: downloaded where there is no share sheet, with every entry and the draft
  const ctxA = await browser.newContext({viewport:{width:390, height:844}, acceptDownloads:true}); const a = watch(await ctxA.newPage());
  await a.goto(BASE + 'index.html'); await a.evaluate(s => localStorage.setItem('e21cclog', s), JSON.stringify(seed)); await a.goto('about:blank'); await a.goto(BASE + 'index.html#/settings?s=data'); await sleep(1200);
  check('Settings says Back up my log and Bring my log from a backup', /Back up my log/.test(await a.textContent('#sExport')) && /Bring my log from a backup/.test(await a.textContent('label[for="sImport"]')));
  const [dl] = await Promise.all([a.waitForEvent('download'), a.click('#sExport')]); await sleep(400);
  const file = path.join(path.dirname(await dl.path()), 'backup.json'); fs.copyFileSync(await dl.path(), file);
  const bk = JSON.parse(fs.readFileSync(file, 'utf8'));
  check('the backup file holds the whole log: every entry, the unfinished entry, the email', bk.app === 'cdl' && bk.profile.entries.length === P.entries.length && bk.profile.drafts.grow.answers.g1 === 'I measured the river width at three sites.' && bk.profile.email === P.email, JSON.stringify({app:bk.app, n:bk.profile.entries.length}));
  check('a backup is recorded once the file is out', await a.evaluate(() => !!me.backup && me.backup.count === me.entries.length));
  const a1 = await axe(a); check('the Your data card has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await ctxA.close();

  // 2. the share sheet, where the device has one
  const ctxS = await browser.newContext({viewport:{width:390, height:844}});
  await ctxS.addInitScript(() => { navigator.canShare = d => !!(d && d.files && d.files.length); navigator.share = async d => { window.__shared = d.files.map(f => f.name + ':' + f.type); }; });
  const s = watch(await ctxS.newPage()); await s.goto(BASE + 'index.html'); await s.evaluate(x => localStorage.setItem('e21cclog', x), JSON.stringify(seed)); await s.goto('about:blank'); await s.goto(BASE + 'index.html#/settings?s=data'); await sleep(1200);
  await s.click('#sExport'); await sleep(500);
  const sh = await s.evaluate(() => ({files:window.__shared, rec:!!me.backup}));
  check('with a share sheet, Back up my log hands it the file (to save in Files or OneDrive)', sh.files && /^e21cc-log-wei-ling-tan-.*\.json:application\/json$/.test(sh.files[0]) && sh.rec, JSON.stringify(sh));
  await ctxS.close();

  // 3. a new device: the log comes back from the welcome page, unfinished entry and all
  const ctxB = await browser.newContext({viewport:{width:390, height:844}}); const b = watch(await ctxB.newPage());
  await b.goto(BASE + 'index.html'); await sleep(900);
  check('a new device: the welcome page offers Bring my log from a backup', /Bring my log from a backup/.test(await b.textContent('.wrestore')));
  await toasts(b); await b.setInputFiles('#wRestore', file); await sleep(1500);
  const back = await b.evaluate(() => ({n:me && me.entries.length, draft:!!(me && me.drafts.grow), email:me && me.email, subj:me && me.experiences.subjects.length, hash:location.hash, carry:!!document.querySelector('#main .carrycard'), toasts:window.__toasts}));
  check('every entry, the unfinished entry, the email and the subjects are back, and the log is open', back.n === P.entries.length && back.draft && back.email === P.email && back.subj === P.experiences.subjects.length && back.carry, JSON.stringify(back));

  // 4. adding what is new to a log already here, and nothing twice
  await b.evaluate(() => { me.entries.splice(0, 2); me.entries.push(Object.assign(JSON.parse(JSON.stringify(me.entries[0])), {id:'local1', created:Date.now(), updated:Date.now()})); saveDb(); });
  await b.evaluate(() => { location.hash = '#/settings?s=data'; }); await sleep(600); await toasts(b);
  await b.setInputFiles('#sImport', file); await sleep(800);
  let t = await b.evaluate(() => ({toasts:window.__toasts, ids:me.entries.map(e => e.id)}));
  check('Settings: the two missing entries come back, the one written here stays, nothing doubles', /^2 entries brought back\./.test(t.toasts[0] || '') && t.ids.includes('local1') && t.ids.length === P.entries.length + 1 && new Set(t.ids).size === t.ids.length, JSON.stringify(t.toasts));
  await toasts(b); await b.setInputFiles('#sImport', file); await sleep(800);
  t = await b.evaluate(() => ({toasts:window.__toasts, n:me.entries.length}));
  check('a second restore of the same file finds nothing new', t.toasts[0] === 'Nothing new in that backup.' && t.n === P.entries.length + 1, JSON.stringify(t));
  // from the welcome page, into a log with a PIN: only with that PIN
  await b.evaluate(async () => { me.entries.splice(0, 1); me.pin = await hashPin(me.email || me.id, '2468'); saveDb(); db.current = null; saveDb(); me = null; unlocked = false; rememberOpen(null); location.hash = '#/welcome'; }); await sleep(800);
  await b.setInputFiles('#wRestore', file); await sleep(800);
  const offer = await b.evaluate(() => ({text:(document.querySelector('#wRestoreOut') || {}).textContent || '', pin:!!document.querySelector('#wMergePin')}));
  check('a log with that name is here: it offers to add what is new, behind that log’s PIN, or to keep it separate', /already has a log on this device/.test(offer.text) && /Add what is new to that log/.test(offer.text) && /Keep it as a separate log/.test(offer.text) && offer.pin, JSON.stringify(offer));
  await b.screenshot({path:shots('t26-welcome-merge-390.png'), animations:'disabled'});
  const a2 = await axe(b); check('the welcome page with the choice has no serious or critical accessibility issues', !a2.length, a2.join(' | '));
  await b.fill('#wMergePin', '1111'); await b.click('#wMerge'); await sleep(500);
  check('a wrong PIN does not open it', /did not match/.test(await b.textContent('#wMergeMsg')) && await b.evaluate(() => !me));
  await toasts(b); await b.fill('#wMergePin', '2468'); await b.click('#wMerge'); await sleep(1500);
  t = await b.evaluate(() => ({toasts:window.__toasts, n:me && me.entries.length, logs:Object.keys(db.profiles).length}));
  check('with its PIN, the missing entry is added to that log, and there is still one log', /^1 entry brought back\./.test(t.toasts[0] || '') && t.n === P.entries.length + 1 && t.logs === 1, JSON.stringify(t));
  await ctxB.close();

  // 5. the reminder counts what changed since the last backup
  const ctxC = await browser.newContext({viewport:{width:390, height:844}}); const c = watch(await ctxC.newPage());
  await c.goto(BASE + 'index.html'); await c.evaluate(x => localStorage.setItem('e21cclog', x), JSON.stringify(seed)); await c.goto('about:blank'); await c.goto(BASE + 'index.html#/'); await sleep(1200);
  const due = await c.evaluate(() => { const r = {}; r.none = backupDue();
    me.backup = {at:Date.now(), count:me.entries.length}; r.justNow = backupDue();
    me.backup = {at:Date.now() - 22 * 864e5, count:me.entries.length}; for (const e of me.entries) e.updated = e.created = Math.min(e.created, me.backup.at - 864e5); r.oldNothingNew = backupDue();
    me.entries[0].updated = Date.now(); r.oldOneEdited = backupDue();
    me.backup = {at:Date.now() - 864e5, count:me.entries.length}; r.yesterdayOne = backupDue();
    for (const e of me.entries.slice(0, 5)) e.updated = Date.now(); r.yesterdayFive = backupDue(); saveDb(); route(); return r; }); await sleep(400);
  const line = await c.$$eval('.nxpart:first-of-type .nxlist>li', ls => ls.map(l => l.textContent.replace(/\s+/g, ' ').trim()).find(x => /^Back up your log/.test(x)) || '');
  check('due with no backup yet; not just after one; not after three weeks with nothing changed', due.none && !due.justNow && !due.oldNothingNew, JSON.stringify(due));
  check('an entry edited after a three week old backup makes it due; one change since yesterday does not; five do', due.oldOneEdited && !due.yesterdayOne && due.yesterdayFive, JSON.stringify(due));
  check('the reminder says when the last backup was', /^Back up your log\. Last backup: .+\. 5 entries are not in a backup yet\./.test(line), line);
  await ctxC.close();

  check('no page errors', !errors.length, errors.join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
