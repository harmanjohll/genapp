const { chromium } = require('playwright');
const BASE = (process.env.BASE || 'http://localhost:8123/e21cclog/') + 'index.html'; const SHOTS = require('./shots.js')('v2-');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function chooseCtx(page, name){ const chip = await page.$(`.xchips [data-exp$="|${name}"]`); if (chip) return chip.click(); await page.click('[data-ptype=subject]'); await sleep(150); const sc = await page.$(`.typepanel [data-exp="subject|${name}"]`); if (sc) return sc.click(); await page.fill('[name=ctxName]', name); }
const relayCalls = async () => (await (await fetch('http://localhost:8124/calls')).json());
const CHEM = {code:'4E1-CHEM', type:'subject', teacherName:'Ms Lim', teacherEmail:'lim_mei@moe.edu.sg', subject:'Chemistry',
  voice:{tone:'precise', phrases:[], avoid:[], sample:''}, criteria:[], knowledge:'', relay:{url:'http://localhost:8124/', token:'bee7', daily:3},
  sink:{kind:'msforms', url:'https://forms.office.com/Pages/ResponsePage.aspx?id=TEST', fields:{studentName:'r1', studentEmail:'r2', entry:'r3', payload1:'r4', payload2:'r5', payload3:'r6', framework:'r7', entryId:'r8'}}};
const b64 = o => Buffer.from(JSON.stringify(o), 'utf8').toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const out = {}; const check = (name, ok, info='') => { out[name] = ok; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
(async () => {
  await fetch('http://localhost:8124/reset');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({viewport:{width:390, height:844}, deviceScaleFactor:2});
  const page = await ctx.newPage(); const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.stack.split('\n').slice(0,3).join(' / ')));
  await page.goto(BASE + '#/welcome'); await page.evaluate(() => localStorage.clear()); await page.goto(BASE.replace('index.html', 'index.html?class=DEMO') + '#/welcome'); await sleep(300);
  await page.fill('[name=name]', 'Aisha Tan'); await page.fill('[name=email]', 'aisha_tan@students.edu.sg'); await page.fill('[name=classCode]', 'demo');
  await page.click('#newForm button[type=submit]'); await sleep(700);
  await page.evaluate(() => { me.level = 2; me.experiences.cca = 'Choir'; saveDb(); });
  await page.goto(BASE + '#/config?c=' + b64(CHEM)); await sleep(700);
  const st0 = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); const p = d.profiles[d.current]; return {groups:p.groups, mode:p.coach.mode}; });
  check('two groups, relay adopted', st0.groups.length === 2 && st0.mode === 'relay', JSON.stringify(st0));

  // GROW entry through the composer
  await page.evaluate(() => location.hash = '#/grow'); await sleep(400);
  await page.screenshot({path:SHOTS + '20-grow-context.png', fullPage:true});
  await chooseCtx(page, 'Chemistry'); await sleep(150); await page.fill('[name=topic]', 'Titration'); if (!(await page.$('[name=groupCode]'))){ await page.click('#grpChange'); await sleep(150); } await page.selectOption('[name=groupCode]', '4E1-CHEM');
  await page.click('#cNext'); await sleep(200);
  await page.fill('[data-a=g1]', 'I checked both readings because the first titre was too high, so I decided to repeat it. The second titre matched.');
  await page.click('#cNext'); await sleep(150);
  await page.fill('[data-a=r2]', 'Redo Q3 on Tuesday after CCA for 20 minutes.');
  await page.click('#cNext'); await sleep(150); await page.click('#cNext'); await sleep(150); await page.click('#cNext'); await sleep(200);
  await page.click('#cNext'); await sleep(250);
  await page.screenshot({path:SHOTS + '21-readback.png', fullPage:true});
  await page.click('#cSave'); await sleep(1500);
  let calls = await relayCalls();
  const eid = await page.evaluate(() => location.hash.split('/')[2].split('?')[0]);
  const s1 = await page.evaluate(id => { const d = JSON.parse(localStorage.getItem('e21cclog')); const e = d.profiles[d.current].entries.find(x => x.id === id); return {src:e.e21cc.source, st:e.e21cc.statements, ev:e.e21cc.evidence, hash:e.coach.ai && e.coach.ai.inputHash, group:e.groupCode, ctx:e.context}; }, eid);
  check('auto read made once, with student tag', calls.length === 1 && /^[a-f0-9]{32}$/.test(calls[0].student) && calls[0].hasStatements, JSON.stringify(calls[0]));
  check('invented quote demoted, statement match verified', s1.ev.find(v => v.id === 'inventive').unverified === true && s1.st.length === 1 && s1.st[0].sid === 'ct1.l1', JSON.stringify(s1.st));
  await page.screenshot({path:SHOTS + '22-entry-ai.png', fullPage:true});
  check('ask again disabled when fresh', await page.$eval('#eAsk', b => b.disabled));

  // edit without changing words: no new call, read kept
  await page.click('a.btn:has-text("Edit")'); await sleep(300);
  for (let i = 0; i < 6; i++){ const n = await page.$('#cNext'); if (!n) break; await n.click(); await sleep(120); }
  await page.click('#cSave'); await sleep(1200);
  calls = await relayCalls();
  const s2 = await page.evaluate(id => { const d = JSON.parse(localStorage.getItem('e21cclog')); const e = d.profiles[d.current].entries.find(x => x.id === id); return {ai:!!e.coach.ai, src:e.e21cc.source}; }, eid);
  check('unchanged edit: no call, AI read kept', calls.length === 1 && s2.ai && s2.src === 'ai', `calls ${calls.length}, ${JSON.stringify(s2)}`);

  // link the coach's statement match: it should light
  await page.evaluate(id => location.hash = '#/entry/' + id, eid); await sleep(400);
  await page.click('[data-maylink="ct1.l1"]'); await sleep(500);
  await page.evaluate(() => location.hash = '#/c/critical'); await sleep(400);
  check('statement started after link: backed by the words, one entry of two', await page.$$eval('.st.s-started', l => l.length) === 1 && (await page.textContent('.st.s-started .stl')).includes('1 of 2 entries'));
  await page.screenshot({path:SHOTS + '23-basket-lit.png', fullPage:true});
  await page.evaluate(() => location.hash = '#/'); await sleep(400);
  check('wheel shows Critical Thinking at Emerging, no star until secured', !!(await page.$('a[href="#/c/critical"].lv1')) && await page.$$eval('.wheel .star', l => l.length) === 0);
  await page.screenshot({path:SHOTS + '24-map-lit.png', fullPage:true}); 

  // edit with changed words: one more call; then allowance (3 a day) blocks the fourth
  await page.evaluate(id => location.hash = '#/grow/' + id, eid); await sleep(300);
  await page.click('#cNext'); await sleep(150);
  await page.fill('[data-a=g2]', 'I would show my friend the burette and explain why the meniscus matters.');
  for (let i = 0; i < 6; i++){ const n = await page.$('#cNext'); if (!n) break; await n.click(); await sleep(120); }
  await page.click('#cSave'); await sleep(1500);
  calls = await relayCalls(); check('changed edit: read again', calls.length === 2, 'calls ' + calls.length);
  // two more new entries: third read allowed, fourth blocked by the daily allowance
  for (const txt of ['We decided together to change the plan when the first method did not work.', 'I asked Ravi to check my working because I was unsure.']){
    await page.evaluate(() => location.hash = '#/act'); await sleep(300);
    await chooseCtx(page, 'Chemistry'); await sleep(150); await page.click('#cNext'); await sleep(150);
    await page.fill('[data-a=a1]', txt);
    for (let i = 0; i < 6; i++){ const n = await page.$('#cNext'); if (!n) break; await n.click(); await sleep(120); }
    await page.click('#cSave'); await sleep(1300);
  }
  calls = await relayCalls();
  const allowanceMsg = await page.$eval('#e21cc', el => el.textContent.includes('coach reads'));
  check('daily allowance stops the 4th read', calls.length === 3 && allowanceMsg, 'calls ' + calls.length);
  await page.screenshot({path:SHOTS + '25-allowance.png', fullPage:true});

  // share to Ms Lim through her Microsoft Form
  await page.evaluate(() => location.hash = '#/sharing'); await sleep(400);
  const lim = await page.$('.adult[data-a="g:4E1-CHEM"]');
  await (await lim.$('[data-sec=grow]')).click(); await sleep(300);
  await page.screenshot({path:SHOTS + '26-sharing-on.png', fullPage:true});
  await (await page.$('.adult[data-a="g:4E1-CHEM"] [data-send]')).click(); await sleep(400);
  await page.click('#dGo'); await sleep(900);
  const href = await page.$eval('#dOpen', a => a.href);
  const u = new URL(href); const parts = ['r4','r5','r6'].map(k => u.searchParams.get(k) || '');
  const decoded = await page.evaluate(async parts => { const r = await unpackCDL(joinCDL(parts)); return r && {kind:r.kind, n:r.data.items.length, id:r.data.items[0].e.id, tag:r.data.from.tag}; }, parts);
  check('form link carries the entry', decoded && decoded.kind === 'i' && decoded.id === eid && href.length < 8000 && parts.every(p => p.length <= 3900), `url ${href.length}, ${JSON.stringify(decoded)}`);
  await page.screenshot({path:SHOTS + '27-ms-step.png', fullPage:true});
  await page.click('#dDone'); await sleep(400);
  check('marked sent, nothing left', await page.$eval('.adult[data-a="g:4E1-CHEM"]', c => c.textContent.includes('Up to date')));

  // share one entry with Mr Tan (no drop box): a Teams link
  await page.evaluate(id => location.hash = '#/entry/' + id, eid); await sleep(400);
  await page.click('#eShare'); await sleep(300);
  await page.click('#shareList label:has-text("Mr Tan")'); await page.click('#dGo'); await sleep(700);
  const teams = await page.$eval('#dTeams', a => a.href);
  const tu = new URL(teams); const msg = tu.searchParams.get('message');
  check('Teams link to Mr Tan carries a console link', tu.searchParams.get('users') === 'tan_ah_kow@moe.edu.sg' && /teacher\.html#\/in\?p=CDL1\.i\./.test(msg), msg.slice(0, 120));
  require('fs').writeFileSync(require('./shots.js')('share-link.txt'), msg.slice(msg.indexOf('http')));
  await page.click('#dDone'); await sleep(300);

  // margin notes arrive by link
  const noteLink = await page.evaluate(async id => BASE_NOTE(id), eid).catch(() => null);
  const mk = async (to, notes) => page.evaluate(async ([to, notes]) => location.href.replace(/#.*$/, '') + '#/note?n=' + await packCDL('n', {v:1, to, by:{name:'Ms Lim', role:'Subject teacher'}, notes}), [to, notes]);
  const tag = await page.evaluate(() => emailTag('aisha_tan@students.edu.sg'));
  const link = await mk(tag, [{id:'n1', eid, anchor:'g1', text:'The bridge is the idea. Use it on Q4.', at:Date.now()}, {id:'n2', eid, anchor:'entry', text:'A careful entry.', at:Date.now()}]);
  await page.goto(link); await sleep(900);
  check('note link lands on the entry', (await page.evaluate(() => location.hash)).startsWith('#/entry/' + eid) && await page.$$eval('.qa-row[data-anchor=g1] .mnote', l => l.length) === 1);
  const pos390 = await page.evaluate(() => { const r = document.querySelector('.qa-row[data-anchor=g1]'); const qa = r.querySelector('.qa').getBoundingClientRect(); const n = r.querySelector('.mnote').getBoundingClientRect(); return {below: n.top >= qa.bottom - 1}; });
  check('phone: note sits under its paragraph', pos390.below);
  await page.screenshot({path:SHOTS + '28-note-390.png', fullPage:true});
  await page.setViewportSize({width:1280, height:900}); await sleep(300);
  const pos1280 = await page.evaluate(() => { const r = document.querySelector('.qa-row[data-anchor=g1]'); const qa = r.querySelector('.qa').getBoundingClientRect(); const n = r.querySelector('.mnote').getBoundingClientRect(); return {dTop:Math.abs(n.top - qa.top), right:n.left >= qa.right}; });
  check('wide: note beside its paragraph', pos1280.right && pos1280.dTop <= 30, JSON.stringify(pos1280));
  await page.screenshot({path:SHOTS + '29-note-1280.png', fullPage:false});
  await page.setViewportSize({width:390, height:844});
  await page.goto(link); await sleep(900);
  const nn = await page.evaluate(id => { const d = JSON.parse(localStorage.getItem('e21cclog')); return d.profiles[d.current].entries.find(x => x.id === id).notes.length; }, eid);
  check('replayed link adds nothing', nn === 2, 'notes ' + nn);
  const bad = await mk('0000000000000000', [{id:'n9', eid, anchor:'g1', text:'not for you', at:Date.now()}]);
  await page.goto(bad); await sleep(900);
  check('wrong student refused', (await page.textContent('body')).includes('different student email'));
  console.log('ERRORS', errors.length ? errors : 'none');
  require('fs').writeFileSync(require('./shots.js')('t2-result.json'), JSON.stringify(out));
  await browser.close();
})();
