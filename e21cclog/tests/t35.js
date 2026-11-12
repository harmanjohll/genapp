// t35 (6.0): school sign in and OneDrive, against a stand in for Microsoft (fixtures/graph.js).
// Off by default: with the school's file empty, nothing changes and the sign in library never loads. Filled in,
// the welcome page offers the school account and the sign in request is the right one. Signed in: a first sign in
// starts a log and keeps it in the student's own OneDrive; a change goes up a few seconds later; a second device
// gets the whole log; two devices writing at once lose nothing. Sharing with a teacher makes a share file only that
// teacher may read and a notes file only they may write, and asks once for a message in Teams. The console opens
// that message, reads the share file, finds students through Shared with me, cannot read the student's log, and
// saves a review into the notes file, which lands in the student's log. A confirmation of the top level does too.
const fs = require('fs');
const launch = require('./fixtures/launch.js');
const { graph, auth } = require('./fixtures/graph.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const CFG = JSON.stringify({tenantId:'11111111-2222-3333-4444-555555555555', clientId:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', consoleClientId:'cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee', folder:'E21CC Log'});
(async () => {
  const browser = await launch(); const errors = [];
  const watch = p => p.on('pageerror', e => errors.push(p.url().split('#')[0] + ' ' + e.message));
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };

  // 1. off: the school's file is empty
  {
    const ctx = await browser.newContext({viewport:{width:390, height:844}}); const p = await ctx.newPage(); watch(p);
    const asked = []; p.on('request', r => asked.push(r.url()));
    await p.goto(BASE + 'index.html#/welcome'); await p.evaluate(() => localStorage.clear()); await p.reload(); await sleep(1000);
    check('with the school’s file empty, the welcome page offers no school sign in', !(await p.$('#cloudIn')));
    check('and the sign in library is never loaded', !asked.some(u => /msal-browser/.test(u)) && await p.evaluate(() => typeof window.msal === 'undefined'));
    check('the school’s file as shipped is empty', await p.evaluate(async () => { const c = await (await fetch('school/microsoft.json')).json(); return c.tenantId === '' && c.clientId === ''; }));
    await ctx.close();
  }
  // 2. filled in: the button, and the request it makes to the school's sign in page
  {
    const ctx = await browser.newContext({viewport:{width:390, height:844}});
    await ctx.route('**/school/microsoft.json', r => r.fulfill({status:200, contentType:'application/json', body:CFG}));
    let authorize = '';
    await ctx.route('https://login.microsoftonline.com/**', r => { const u = r.request().url(); if (/authorize/.test(u)) authorize = u; return r.fulfill({status:200, contentType:'text/html', body:'<title>Sign in</title>sign in page'}); });
    const p = await ctx.newPage(); watch(p);
    await p.goto(BASE + 'index.html#/welcome'); await p.evaluate(() => localStorage.clear()); await p.reload(); await sleep(1500);
    check('filled in, the welcome page offers Sign in with your school account first', /Sign in with your school account/.test(await p.textContent('#cloudIn')));
    check('the sign in library starts with no error', await p.evaluate(() => typeof window.msal === 'object' && !M365.lastError), await p.evaluate(() => M365.lastError));
    const a0 = await axe(p); check('the welcome page with school sign in has no serious or critical accessibility issues', !a0.length, a0.join(' | '));
    await p.screenshot({path:shots('t35-welcome-signin.png'), animations:'disabled'});
    await p.click('#cloudIn'); await sleep(2500);
    const q = authorize ? new URL(authorize).searchParams : new URLSearchParams();
    check('the button goes to the school’s own sign in page, for this app', authorize.startsWith('https://login.microsoftonline.com/11111111-2222-3333-4444-555555555555/') && q.get('client_id') === 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', authorize.slice(0, 120));
    check('it asks only for the student’s own files, comes back to the Log, and uses a code with a proof key', /Files\.ReadWrite/.test(q.get('scope') || '') && !/All/.test(q.get('scope') || '') && /\/e21cclog\/index\.html$/.test(q.get('redirect_uri') || '') && q.get('response_type') === 'code' && q.get('code_challenge_method') === 'S256', JSON.stringify({scope:q.get('scope'), redirect:q.get('redirect_uri')}));
    authorize = '';
    const c = await ctx.newPage(); watch(c);
    await c.goto(BASE + 'teacher.html'); await sleep(2200);
    check('the console offers the school account too', /Sign in with your school account/.test(await c.textContent('#cloudCard')));
    await c.click('#cloudIn'); await sleep(2500);
    const cq = authorize ? new URL(authorize).searchParams : new URLSearchParams();
    check('the console signs in as its own app, asking for files students share, and comes back to the console', cq.get('client_id') === 'cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee' && /Files\.ReadWrite\.All/.test(cq.get('scope') || '') && /\/e21cclog\/teacher\.html$/.test(cq.get('redirect_uri') || ''), JSON.stringify({id:cq.get('client_id'), scope:cq.get('scope')}));
    await ctx.close();
  }

  // 3. signed in: a stand in for Microsoft answers OneDrive
  const G = graph();
  const device = async (tok, w = 1280) => { const ctx = await browser.newContext({viewport:{width:w, height:900}}); await ctx.addInitScript(auth(tok)); await G.attach(ctx); await ctx.route('https://teams.microsoft.com/**', r => r.fulfill({status:200, contentType:'text/html', body:'ok'})); const p = await ctx.newPage(); watch(p); return {ctx, p}; };
  const A = await device('tok-aisha');
  await A.p.goto(BASE + 'index.html#/welcome'); await A.p.evaluate(() => localStorage.clear()); await A.p.goto('about:blank');
  await A.p.goto(BASE + 'index.html#code=abc&state=xyz'); await sleep(2200);
  const first = await A.p.evaluate(() => ({name:me && me.name, email:me && me.email, hash:location.hash}));
  check('back from signing in, a first sign in starts a log with the school name and email', first.name === 'Aisha Tan' && first.email === 'aisha_tan@btyss.moe.edu.sg', JSON.stringify(first));
  check('and the reply is taken out of the address', !/code=/.test(first.hash), first.hash);
  const f1 = G.file('d-aisha', 'E21CC Log/log.json');
  check('the log is kept in her own OneDrive, in the folder E21CC Log', f1 && f1.data.profile && f1.data.profile.email === 'aisha_tan@btyss.moe.edu.sg');
  check('this device’s bookkeeping is not uploaded', f1 && !(f1.data.profile.cloud && f1.data.profile.cloud.etag));
  // an entry, with a claim
  await A.p.evaluate(() => { me.level = 3; me.experiences = {subjects:['Chemistry'], cca:'Football', others:[]}; me.entries.push(migrateEntry({id:'x1', kind:'grow', created:Date.now() - 20 * 864e5, updated:Date.now() - 20 * 864e5, context:{type:'subject', name:'Chemistry'}, subject:'Chemistry', topic:'Titration', answers:{g1:'I checked both readings because the first titre was too high.', r1:'I do not yet understand why we swirl the flask.'}, competencies:[], links:[{sid:'ct1.l1', quote:'I checked both readings because the first titre was too high.', at:Date.now()}], notes:[], sent:{}})); saveDb(); });
  await sleep(5200);
  check('a change goes up to OneDrive a few seconds later', (G.file('d-aisha', 'E21CC Log/log.json').data.profile.entries || []).some(e => e.id === 'x1'));
  await A.p.goto(BASE + 'index.html#/settings?s=data'); await sleep(900);
  const card = await A.p.textContent('.cloudbox');
  check('Settings says who is signed in and where the log is kept', /Signed in as/.test(card) && /Aisha Tan/.test(card) && /E21CC Log/.test(card) && /In step with OneDrive/.test(card), card.replace(/\s+/g, ' ').slice(0, 160));
  const a1 = await axe(A.p); check('Settings with the school account has no serious or critical accessibility issues', !a1.length, a1.join(' | '));

  // a second device: the whole log arrives
  const B = await device('tok-aisha', 390);
  await B.p.goto(BASE + 'index.html#/welcome'); await B.p.evaluate(() => localStorage.clear()); await B.p.goto('about:blank');
  await B.p.goto(BASE + 'index.html#code=abc&state=xyz'); await sleep(2200);
  const b = await B.p.evaluate(() => ({n:me.entries.length, x1:!!me.entries.find(e => e.id === 'x1'), level:me.level, cca:me.experiences && me.experiences.cca, hash:location.hash}));
  check('on a second device, signing in brings the whole log, settings and all', b.x1 && b.level === 3 && b.cca === 'Football' && b.hash !== '#/setup', JSON.stringify(b));
  // both devices write at once: nothing is lost
  await A.p.evaluate(() => { me.entries.push(migrateEntry({id:'xa', kind:'grow', created:Date.now(), updated:Date.now(), context:{type:'cca', name:'Football'}, subject:'Football', topic:'Set pieces', answers:{g1:'Written on the laptop.'}, competencies:[], links:[], notes:[], sent:{}})); STORE.save(db); me.cloud.changedAt = Date.now(); });
  await B.p.evaluate(() => { me.entries.push(migrateEntry({id:'xb', kind:'grow', created:Date.now(), updated:Date.now(), context:{type:'cca', name:'Football'}, subject:'Football', topic:'Fitness', answers:{g1:'Written on the iPad.'}, competencies:[], links:[], notes:[], sent:{}})); STORE.save(db); me.cloud.changedAt = Date.now(); });
  await A.p.evaluate(() => cloudSync()); await B.p.evaluate(() => cloudSync()); await A.p.evaluate(() => cloudSync());
  const both = { cloud:G.file('d-aisha', 'E21CC Log/log.json').data.profile.entries.map(e => e.id), a:await A.p.evaluate(() => me.entries.map(e => e.id)), b:await B.p.evaluate(() => me.entries.map(e => e.id)) };
  check('two devices writing at once lose nothing: OneDrive and both devices hold both entries', ['xa', 'xb'].every(id => both.cloud.includes(id) && both.a.includes(id) && both.b.includes(id)), JSON.stringify(both));

  // sharing with a teacher, through OneDrive
  await A.p.goto(BASE + 'index.html#/'); await sleep(600);
  await A.p.evaluate(() => { me.shares.adults['a:lim'] = {id:'a:lim', name:'Ms Lim', email:'lim_mei@btyss.moe.edu.sg', role:'Subject teacher'}; me.shares.sections.grow = ['a:lim']; saveDb(); });
  await A.p.evaluate(() => { const a = adultById('a:lim'); deliver(a, unsentFor(a).filter(it => it.id === 'x1')); }); await sleep(2000);
  const share = G.file('d-aisha', 'E21CC Log/shares/E21CC share for lim_mei@btyss.moe.edu.sg.json');
  const notes = G.file('d-aisha', 'E21CC Log/notes/E21CC notes from lim_mei@btyss.moe.edu.sg.json');
  check('sharing makes a share file that only Ms Lim may read, holding the entry', share && share.perms.length === 1 && share.perms[0].email === 'lim_mei@btyss.moe.edu.sg' && share.perms[0].role === 'read' && share.data.items.length === 1 && share.data.items[0].e.id === 'x1', JSON.stringify(share && share.perms));
  check('and a notes file that only Ms Lim may write', notes && notes.perms.length === 1 && notes.perms[0].role === 'write');
  const tell = await A.p.evaluate(() => { const t = document.querySelector('#dTeams'); return {h2:(document.querySelector('dialog[open] h2, #inlineDlg h2') || {}).textContent || '', href:t ? t.href : ''}; });
  const msg = new URL(tell.href || 'https://x/').searchParams.get('message') || ''; const connect = msg.slice(msg.indexOf('http')).replace(/^.*teacher\.html/, BASE + 'teacher.html');
  check('the first time, it asks Aisha to tell Ms Lim once, in Teams, with a link for her console', /Tell Ms Lim once/.test(tell.h2) && /teacher\.html#\/connect\?c=CDL/.test(connect), tell.h2);
  const a2 = await axe(A.p); check('the Tell once dialog has no serious or critical accessibility issues', !a2.length, a2.join(' | '));
  await A.p.click('#dDone'); await sleep(400);
  check('the entry is marked as sent to Ms Lim', await A.p.evaluate(() => isSent(adultById('a:lim'), me.entries.find(e => e.id === 'x1'))));

  // the console: open the message once, read the share file
  const T = await device('tok-lim');
  await T.p.goto(connect); await sleep(2500);
  const t1 = await T.p.evaluate(() => ({items:Object.keys(store.items), conn:Object.keys(store.cloud.connections), card:document.querySelector('#cloudCard').textContent}));
  check('the console opens the message, remembers where Aisha’s files are, and reads her entry', t1.conn.length === 1 && t1.items.some(k => k.endsWith('|x1')) && /1 student shares with you/.test(t1.card), JSON.stringify(t1).slice(0, 220));
  const peek = await T.p.evaluate(async d => { try{ await M365.readJson(M365.item('d-aisha', d)); return 'read'; }catch(e){ return e.status; } }, G.file('d-aisha', 'E21CC Log/log.json').id);
  check('the teacher cannot open the student’s log itself', peek === 403, String(peek));
  // a second teacher console finds her through Shared with me, once she shares with Mr Goh too
  await A.p.evaluate(() => { me.shares.adults['a:goh'] = {id:'a:goh', name:'Mr Goh', email:'goh_siew@btyss.moe.edu.sg', role:'Form teacher'}; me.shares.sections.grow = ['a:lim', 'a:goh']; saveDb(); });
  await A.p.evaluate(() => { const a = adultById('a:goh'); deliver(a, unsentFor(a).filter(it => it.id === 'x1')); }); await sleep(1800); await A.p.click('#dClose'); await sleep(300);
  const T2 = await device('tok-goh');
  await T2.p.goto(BASE + 'teacher.html'); await sleep(2200);
  await T2.p.click('#cloudFind'); await sleep(2200);
  check('a teacher can also find students through Shared with me, with no message', await T2.p.evaluate(() => Object.keys(store.cloud.connections).length === 1 && Object.keys(store.items).some(k => k.endsWith('|x1'))));
  // Ms Lim reviews the claim and saves it straight into Aisha's log
  const k = await T.p.evaluate(() => Object.keys(store.items).find(k => k.endsWith('|x1')));
  await T.p.click(`#inboxList .item[data-key="${k}"]`); await sleep(300);
  await T.p.click('#inboxList .reader [data-verdict][data-v="yes"]'); await sleep(200);
  await T.p.fill('#inboxList .reader [data-advice]', 'You repeated the titre for a reason you could name. Next, say what the two readings told you about the end point.');
  await T.p.dispatchEvent('#inboxList .reader [data-advice]', 'input'); await T.p.click('#inboxList .reader [data-saverev]'); await sleep(400);
  check('Replies to send offers Save to their log for a student who shares through OneDrive', !!(await T.p.$('#replyCard [data-replycloud]')) && !(await T.p.$('#replyCard [data-replysent]')));
  await T.p.screenshot({path:shots('t35-console-cloud.png'), animations:'disabled'});
  const a3 = await axe(T.p); check('the console with the school account has no serious or critical accessibility issues', !a3.length, a3.join(' | '));
  await T.p.click('#replyCard [data-replycloud]'); await sleep(1500);
  const nf = G.file('d-aisha', 'E21CC Log/notes/E21CC notes from lim_mei@btyss.moe.edu.sg.json');
  check('the review is saved in Aisha’s notes file for Ms Lim, signed with her school account', nf.data.notes.length === 1 && nf.data.notes[0].verdict === 'yes' && nf.data.by.email === 'lim_mei@btyss.moe.edu.sg', JSON.stringify(nf.data).slice(0, 200));
  check('and is marked as sent, with nothing left to send', await T.p.evaluate(() => Object.values(store.notes).flat().every(n => n.sentAt)) && await T.p.$eval('#replyCard', c => c.hidden));
  await T.p.evaluate(() => cloudConfirm(Object.keys(store.cloud.connections)[0], 'adaptive', Date.now()));
  // the student: the review lands, with no link
  await A.p.evaluate(() => { window.__toasts = []; return cloudSync(); }); await sleep(600);
  const land = await A.p.evaluate(() => { const e = me.entries.find(x => x.id === 'x1'); const r = reviewOf(e, 'ct1.l1'); return {verdict:r && r.verdict, by:r && r.by, conf:!!me.confirmed.adaptive}; });
  check('Ms Lim’s review lands in Aisha’s log, with no link', land.verdict === 'yes' && /Lim/.test(land.by), JSON.stringify(land));
  check('a confirmation of the top level lands too', land.conf);
  await A.p.goto(BASE + 'index.html#/'); await sleep(700);
  check('Home shows it under From your teachers', /Affirmed/.test(await A.p.textContent('.fromcard')));
  // signing out keeps the log on the device
  await A.p.goto(BASE + 'index.html#/settings?s=data'); await sleep(600); await A.p.click('#cloudOut'); await sleep(500);
  check('signing out keeps the log on this device and offers to sign in again', await A.p.evaluate(() => me && me.entries.length >= 3) && !!(await A.p.$('#cloudIn')));

  check('no page errors', !errors.length, errors.join(' | '));
  await browser.close();
  console.log(fails ? `${fails} FAILED` : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); console.log('FAIL crashed'); process.exit(1); });
