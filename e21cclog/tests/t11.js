// t11: v3. Home as Where am I now? and What next?, three levels in the look's words,
// GROW's wording, the (i) beside each question, the two step aim, the settings alert,
// the console's three levels, and the one time copy from v2.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = (process.env.BASE || 'http://localhost:8123/e21cclog/'); const SHOTS = require('./shots.js')('');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed3 = JSON.parse(fs.readFileSync(__dirname + '/fixtures/seed3.json', 'utf8'));
// seed4: the Upper Sec band met in both Critical Thinking strands, so the top level waits for a teacher
const seed4 = JSON.parse(JSON.stringify(seed3)); const P4 = seed4.profiles[seed4.current];
P4.email = 'wei_ling_tan@students.edu.sg'; P4.level = 4; const D = 864e5; const now = Date.now();
const Q = 'I weighed both arguments because the evidence pointed two ways, and I decided on the stronger one.';
const mk = (id, days, name) => ({id, kind:'grow', created:now - days * D, updated:now - days * D, context:{type:'subject', name}, subject:name, topic:'Debate', groupCode:'', answers:{g1:Q}, competencies:[{id:'critical', quote:Q}],
  links:['ct1.u1', 'ct1.u2', 'ct2.u1', 'ct2.u2'].map(sid => ({sid, quote:Q, at:now - days * D})), e21cc:{source:'builtin', stance:'competency', evidence:[{id:'critical', strength:'strong', quote:Q, why:''}], statements:[]}, notes:[]});
P4.entries = [mk('L1', 30, 'Mathematics'), mk('L2', 10, 'English')];
// a log with no Sec level and no subjects or CCA
const bare = JSON.parse(JSON.stringify(seed3)); const PB = bare.profiles[bare.current]; delete PB.level; PB.experiences = {subjects:[], cca:'', others:[], levels:{}};
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({viewport:{width:1440, height:900}});
  const page = await ctx.newPage(); const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/400/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  const go = async h => { await page.evaluate(x => location.hash = x, h); await sleep(450); };
  const load = async (seed, look) => { const s = JSON.parse(JSON.stringify(seed)); if (look) s.profiles[s.current].prefs.look = look; await page.goto(BASE + 'index.html#/'); await page.evaluate(x => { localStorage.clear(); localStorage.setItem('e21cclog', x); }, JSON.stringify(s)); await page.reload(); await sleep(500); await go('#/'); };
  const prof = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); return d.profiles[d.current]; });

  // 1. three levels, the top one confirmed by a teacher
  await load(seed4);
  let L = await page.evaluate(() => { const r = levelOf(me.entries, STMT_SET, 'critical', {}); return {idx:r.idx, waiting:r.waiting, next:r.next, n:LOG_LEVELS.length}; });
  check('three levels; Upper Sec met in every strand waits for a teacher at level 2', L.n === 3 && L.idx === 2 && L.waiting && /Charting: waiting for a teacher/.test(L.next), JSON.stringify(L));
  L = await page.evaluate(() => { const r = levelOf(me.entries, STMT_SET, 'critical', {critical:{by:'Mr Lim', at:Date.now()}}); return {idx:r.idx, waiting:r.waiting, level:r.level}; });
  check('a teacher’s confirmation makes it level 3 (Proficient)', L.idx === 3 && !L.waiting && L.level === 'proficient', JSON.stringify(L));
  const old = await page.evaluate(() => ({lab:levelLabel('leading', 'a'), idx:levelIdx('leading'), b:levelLabel('developing', 'b')}));
  check('v2’s Leading reads as the top level; ids map to the look’s words', old.lab === 'Proficient' && old.idx === 3 && old.b === 'Navigating', JSON.stringify(old));

  // 2. the words follow the look
  const words = {a:'Emerging Developing Proficient', b:'Setting Sail Navigating Charting', c:'Level 1 Level 2 Level 3', d:'One star Two stars Three stars'};
  for (const lk of ['a', 'b', 'c', 'd']){
    await load(seed3, lk);
    const legRaw = await page.$$eval('.wlegend span', x => x.map(y => y.textContent.trim()).filter(t => !/^SEC|Secured$/.test(t))); const leg = legRaw.map(t => t.replace(/\s*\d+$/, '')).join(' ');
    if (lk === 'b') check('Home’s legend counts the competencies at each level', legRaw.every(t => /\d+$/.test(t)) && legRaw.reduce((k, t) => k + +t.match(/\d+$/)[0], 0) <= 9, legRaw.join(' | '));
    await go('#/c'); const key = await page.$$eval('.lvkey b', b => b.map(x => x.textContent).join(' '));
    await go('#/c/critical'); const pill = await page.textContent('.comp-hero .pill');
    check(`look ${lk}: the legend, How levels work and the level use ${words[lk]}`, leg === words[lk] && key === words[lk] && words[lk].split(/ (?=[A-Z])/).some(w => pill.startsWith(w.trim())), `${leg} | ${key} | ${pill}`);
  }

  // 3. Home: Where am I now? and What next?, nothing else
  await load(seed3);
  const home = await page.evaluate(() => ({h1:document.querySelector('.wheelcard h1').textContent, h2:document.querySelector('.nextcard h2').textContent, parts:[...document.querySelectorAll('.nxh')].map(h => h.firstChild.textContent.trim()), cards:document.querySelectorAll('#main section.card').length,
    gone:['.showcase', '.lvlist', '.latest', '.slist'].filter(s => document.querySelector('#main ' + s)), text:document.querySelector('#main').textContent}));
  check('Home is two places: Where am I now? and What next?', home.h1 === 'Where am I now?' && home.h2 === 'What next?' && home.cards === 2, JSON.stringify({h1:home.h1, h2:home.h2, cards:home.cards}));
  check('What next? has Immediate, then Longer term', JSON.stringify(home.parts) === '["Immediate","Longer term"]', JSON.stringify(home.parts));
  check('the levels list, showcase, latest feedback and statement lists are gone from Home', !home.gone.length, home.gone.join(','));
  const nx = await page.evaluate(() => ({now:[...document.querySelectorAll('.nxpart:first-of-type .nxlist>li')].map(l => l.textContent.replace(/\s+/g, ' ').trim()), later:[...document.querySelectorAll('.nxpart:last-of-type .nxlist>li')].map(l => l.textContent.replace(/\s+/g, ' ').trim())}));
  check('Immediate: the plan to tick, and the statement almost secured', /Tick it when you have done it/.test(nx.now[0] || '') && nx.now.some(t => /^Almost secured: “.+”\. One more entry/.test(t)), JSON.stringify(nx.now));
  check('Longer term: the statement aimed for, and the nearest next level with what it takes', nx.later.some(t => /^Aiming for: “/.test(t)) && nx.later.some(t => /, now Setting Sail\. To reach Navigating, secure/.test(t)), JSON.stringify(nx.later));
  // a note and a draft come first
  await page.evaluate(() => { me.entries[0].notes = [{id:'n1', by:'Mr Lim', text:'Good start.', at:Date.now(), seen:false, field:'g1'}]; me.drafts.grow = {kind:'grow', key:'grow', step:1, context:{type:'subject', name:'Art'}, answers:{g1:'I learnt shading.'}, claims:[]}; saveDb(); route(); }); await sleep(400);
  const nx2 = await page.$$eval('.nxpart:first-of-type .nxlist>li', ls => ls.map(l => l.textContent.replace(/\s+/g, ' ').trim()));
  check('Immediate also lists a teacher’s note to read and an entry to finish', nx2.some(t => /^Read Mr Lim’s note/.test(t)) && nx2.some(t => /^Finish your GROW entry/.test(t)), JSON.stringify(nx2));
  await page.evaluate(() => { me.entries[0].notes = []; delete me.drafts.grow; saveDb(); route(); }); await sleep(300);

  // 4. the wheel's panel: full width Home, the most recent competency first, then hover with a mouse, then a click opens
  const lay = await page.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect(); const a = r('.wheelcard'), b = r('.nextcard'), m = r('#main');
    return {stacked:b.top >= a.bottom - 1 && Math.abs(a.left - b.left) < 2 && Math.abs(a.width - b.width) < 2, full:(() => { const cs = getComputedStyle(document.querySelector('#main')); return a.width >= m.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2; })(), wheel:Math.round(r('.wheel').width), cols:getComputedStyle(document.querySelector('.nxparts')).gridTemplateColumns.split(' ').length, side:r('#cpanel').left > r('.wheel').right}; });
  check('Home (laptop): Where am I now? spans the page, the wheel is large with the panel beside it, What next? below in two columns', lay.stacked && lay.full && lay.wheel >= 400 && lay.side && lay.cols === 2, JSON.stringify(lay));
  const p0 = await page.textContent('#cpanel');
  const pd = await page.evaluate(() => ({kicker:document.querySelector('#cpanel .kicker').textContent, strands:document.querySelectorAll('#cpanel .cpstrands li').length, bars:document.querySelectorAll('#cpanel .pbar').length, quote:!!document.querySelector('#cpanel .cpq q'), next:!!document.querySelector('#cpanel .nextlv'), sel:[...document.querySelectorAll('.wheel a.seg.sel')].map(a => a.dataset.comp)}));
  check('before anything is pointed at, the panel shows the most recent competency: strands, the next step, the student’s own words', /^Most recent/.test(pd.kicker) && pd.strands === 2 && pd.bars === 4 && pd.quote && pd.next && pd.sel.length === 1, JSON.stringify(pd));
  await page.hover('.wheel a.seg[data-comp="collaboration"]'); await sleep(200);
  const p1 = await page.textContent('#cpanel'); const sel = await page.$$eval('.wheel a.seg.sel', a => a.map(x => x.dataset.comp));
  check('pointing at a part shows its level and next step beside the wheel', /Most recent/.test(p0) && /Collaboration/.test(p1) && !/Most recent/.test(p1) && /statements secured/.test(p1) && sel.join() === 'collaboration', p1.slice(0, 120));
  await page.click('.wheel a.seg[data-comp="collaboration"]'); await sleep(400);
  check('with a mouse, a click opens the competency', await page.evaluate(() => location.hash) === '#/c/collaboration');
  await go('#/');
  // keyboard: tabbing to a part shows it
  await page.focus('.wheel a.seg[data-comp="critical"]'); await page.keyboard.press('Tab'); await sleep(200);
  const pk = await page.textContent('#cpanel');
  check('tabbing to a part shows it too', /Adaptive Thinking/.test(pk) && !/Most recent/.test(pk), pk.slice(0, 80));
  await page.screenshot({path:SHOTS + 't11-home-laptop.png'});

  // 5. a phone: the first tap shows, the second opens
  const pctx = await browser.newContext({viewport:{width:390, height:844}, hasTouch:true, isMobile:true}); const ph = await pctx.newPage();
  ph.on('pageerror', e => errors.push('PAGEERROR phone ' + e.message));
  await ph.goto(BASE + 'index.html#/'); await ph.evaluate(x => localStorage.setItem('e21cclog', x), JSON.stringify(seed3)); await ph.reload(); await sleep(500); await ph.evaluate(() => location.hash = '#/'); await sleep(500);
  check('phone: the panel waits for a tap, so the first screen keeps the wheel and the New buttons', await ph.evaluate(() => getComputedStyle(document.querySelector('#cpanel')).display === 'none' && document.querySelector('.acts').getBoundingClientRect().bottom <= document.querySelector('.tabs').getBoundingClientRect().top));
  await ph.tap('.wheel a.seg[data-comp="inventive"]'); await sleep(300);
  const t1 = {hash:await ph.evaluate(() => location.hash), panel:await ph.textContent('#cpanel')};
  await ph.tap('.wheel a.seg[data-comp="inventive"]'); await sleep(400);
  const t2 = await ph.evaluate(() => location.hash);
  check('phone: the first tap shows the level, the second opens the competency', t1.hash === '#/' && /Inventive Thinking/.test(t1.panel) && t2 === '#/c/inventive', JSON.stringify({t1:t1.hash, t2}));
  await ph.evaluate(() => location.hash = '#/'); await sleep(400); await ph.tap('.wheel a.seg[data-comp="inventive"]'); await sleep(300);
  await ph.screenshot({path:SHOTS + 't11-home-phone.png'});

  // a student with nothing started: one Start item, not a competency list that all says the same
  { const fresh = JSON.parse(JSON.stringify(seed3)); const F = fresh.profiles[fresh.current]; F.entries = []; F.drafts = {}; await load(fresh);
    const lt = await page.$$eval('.nxpart:last-of-type .nxlist>li', ls => ls.map(l => l.textContent.replace(/\s+/g, ' ').trim()));
    check('nothing started: Longer term offers one way in', lt.filter(t => /^Start with one competency/.test(t)).length === 1 && !lt.some(t => /Write an entry that shows it, then link it to a statement/.test(t)), JSON.stringify(lt)); }
  // hovering what is selected never hides its words: the active tab, in Bright and friendly light and dark, and the current step
  for (const th of ['light', 'dark']){
    const s4 = JSON.parse(JSON.stringify(seed3)); Object.assign(s4.profiles[s4.current].prefs, {look:'d', theme:th}); await load(s4);
    await page.hover('.tabs .tab.on'); await sleep(150);
    const hc = await page.evaluate(() => { const parse = c => c.match(/\d+(\.\d+)?/g).map(Number); const lum = ([r, g, b]) => { const f = x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
      const t = document.querySelector('.tabs .tab.on'); const s = getComputedStyle(t); let bg = s.backgroundColor; if (/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) bg = getComputedStyle(t.parentElement).backgroundColor; const a = lum(parse(s.color)), b = lum(parse(bg)); return {ratio:(Math.max(a, b) + .05) / (Math.min(a, b) + .05), color:s.color, bg}; });
    check(`Bright and friendly ${th}: hovering the active tab keeps its words readable`, hc.ratio >= 4.5, JSON.stringify(hc));
  }
  await load(seed3); await go('#/write/grow'); await page.evaluate(() => { draft.context = {type:'subject', name:'Art'}; draft.step = 2; saveDraft(); renderComposer(); }); await sleep(300);
  await page.hover('.gsteps button.on'); await sleep(150);
  const gs = await page.evaluate(() => { const b = document.querySelector('.gsteps button.on'); const s = getComputedStyle(b); return {bg:s.backgroundColor, color:s.color}; });
  check('hovering the current step in the guide keeps its words readable', gs.bg !== 'rgba(0, 0, 0, 0)' && gs.bg !== gs.color && !/244, 246, 253|255, 255, 255/.test(gs.bg), JSON.stringify(gs));
  await page.evaluate(() => { closeComposer(); delete me.drafts.grow; draft = null; saveDb(); }); await go('#/');

  // 6. GROW's words
  const g = await page.evaluate(() => ({qs:GROW.steps.flatMap(s => s.qs.map(q => [q.id, q.q])), when:GROW.when, sys:coachSystem(null, [], 'warm', STMT_SET)}));
  const qs = Object.fromEntries(g.qs);
  check('GROW never says lesson; g1 says this learning experience', !g.qs.some(([, q]) => /lesson/i.test(q)) && qs.g1 === 'What is one thing I understand from this learning experience?' && g.when === 'after a learning experience');
  check('Own asks for a real-life example or application', qs.o1 === 'What is one real-life example or application?');
  check('Watch asks what is coming up next first, then what I know or expect', JSON.stringify(g.qs.slice(-2)) === JSON.stringify([['w2', 'What is coming up next?'], ['w1', 'What do I already know about it, or expect from it?']]));
  check('the coach’s instructions carry the new GROW questions', /w2 What is coming up next\? then w1 What do I already know about it, or expect from it\?/.test(g.sys) && /real-life example or application/.test(g.sys) && !/next lesson/.test(g.sys));
  // an earlier entry's Watch answers keep their meaning
  const eid = seed3.profiles[seed3.current].entries.find(e => e.kind === 'grow').id;
  await page.evaluate(id => { const e = me.entries.find(x => x.id === id); e.answers.w1 = 'I know about plates.'; e.answers.w2 = 'Next week: volcanoes.'; saveDb(); }, eid);
  await go('#/entry/' + eid); const order = await page.evaluate(() => { const t = document.querySelector('#main').textContent; return [t.indexOf('What is coming up next?'), t.indexOf('Next week: volcanoes.'), t.indexOf('What do I already know about it'), t.indexOf('I know about plates.')]; });
  check('an earlier entry shows its Watch answers under the right questions, in the new order', order.every(x => x >= 0) && order[0] < order[1] && order[1] < order[2] && order[2] < order[3], JSON.stringify(order));

  // 7. the (i) beside every question
  await go('#/write/grow'); await sleep(200);
  const ctxCopy = await page.textContent('#sheet');
  check('the GROW context step speaks of a learning experience, and the topic field is just Topic', /soon after the learning experience/.test(ctxCopy) && !/lesson 2/.test(ctxCopy) && !/Where a question says/.test(ctxCopy));
  const counts = await page.evaluate(() => { const out = {}; for (const k of ['grow', 'act', 'across']){ const fw = FRAMEWORKS[k]; out[k] = fw.steps.flatMap(s => s.qs).filter(q => QHELP[q.id] && QHELP[q.id].ex.length === 3 && QHELP[q.id].strong.length >= 3).length + '/' + fw.steps.flatMap(s => s.qs).length; } return out; });
  check('every question in GROW, ACT and Look across has its own help, with three examples', counts.grow === '8/8' && counts.act === '6/6' && counts.across === '3/3', JSON.stringify(counts));
  await page.evaluate(() => { draft.context = {type:'subject', name:'Geography'}; draft.step = 1; saveDraft(); renderComposer(); }); await sleep(300);
  const n = await page.$$eval('#sheet .qinfo', b => b.length); const stuck = await page.$$eval('#sheet .stuckbtn', b => b.length);
  check('each question has an (i), and I’m stuck stays', n === 2 && stuck === 2, `${n} ${stuck}`);
  await page.hover('[data-qinfo="g1"]'); await sleep(200);
  const hov = await page.evaluate(() => ({open:!document.getElementById('qp-g1').hidden, exp:document.querySelector('[data-qinfo="g1"]').getAttribute('aria-expanded'), text:document.getElementById('qp-g1').textContent}));
  check('hovering the (i) opens the question’s own help: what it asks, a strong answer, examples', hov.open && hov.exp === 'true' && /Name one thing that now makes sense/.test(hov.text) && /A strong answer has/.test(hov.text) && /Football/.test(hov.text), hov.text.slice(0, 80));
  await page.screenshot({path:SHOTS + 't11-qinfo-laptop.png'});
  await page.mouse.move(5, 880); await sleep(200);
  check('moving away closes it', await page.evaluate(() => document.getElementById('qp-g1').hidden));
  await page.click('[data-qinfo="g2"]'); await page.mouse.move(5, 880); await sleep(200);
  const pinned = await page.evaluate(() => !document.getElementById('qp-g2').hidden);
  await page.keyboard.press('Escape'); await sleep(150);
  const esc = await page.evaluate(() => ({closed:document.getElementById('qp-g2').hidden, sheet:!!document.querySelector('#sheet .sheet')}));
  check('a click keeps it open; Escape closes it and leaves the entry open', pinned && esc.closed && esc.sheet, JSON.stringify({pinned, ...esc}));
  await page.focus('[data-qinfo="g1"]'); await page.keyboard.press('Enter'); await sleep(150);
  check('the keyboard opens it too', await page.evaluate(() => !document.getElementById('qp-g1').hidden));
  await page.keyboard.press('Escape');

  // 8. the aim: a competency first, then its statements
  await page.evaluate(() => { draft.step = 4; saveDraft(); renderComposer(); }); await sleep(300);
  const a0 = await page.evaluate(() => ({comp:document.querySelector('[name=aimComp]').value, dis:document.querySelector('#sheet [name=target]').disabled, n:document.querySelectorAll('#sheet [name=target] option').length}));
  check('the aim starts with a competency; the statements wait for it', a0.comp === '' && a0.dis && a0.n === 1, JSON.stringify(a0));
  await page.selectOption('[name=aimComp]', 'communication'); await sleep(300);
  const a1 = await page.evaluate(() => ({dis:document.querySelector('#sheet [name=target]').disabled, comps:[...document.querySelectorAll('#sheet [name=target] option')].slice(1).map(o => statementById(o.value).comp), groups:[...document.querySelectorAll('#sheet [name=target] optgroup')].map(g => g.label), focus:document.activeElement && document.activeElement.name}));
  check('then only that competency’s statements, grouped by band, with focus moved to them', !a1.dis && a1.comps.length > 0 && a1.comps.every(c => c === 'communication') && a1.groups.length === 2 && a1.focus === 'target', JSON.stringify({n:a1.comps.length, groups:a1.groups, focus:a1.focus}));
  const sid = await page.$eval('#sheet [name=target] option:nth-child(2)', o => o.value).catch(() => '') || await page.$eval('#sheet [name=target] optgroup option', o => o.value);
  await page.selectOption('#sheet [name=target]', sid); await page.evaluate(() => collect());
  check('choosing a statement sets the aim', await page.evaluate(() => draft.target) === sid);
  await page.selectOption('[name=aimComp]', 'critical'); await sleep(250);
  check('changing the competency clears an aim from another one', await page.evaluate(() => draft.target) === '');
  await page.screenshot({path:SHOTS + 't11-aim-laptop.png'});
  await page.evaluate(() => { closeComposer(); delete me.drafts.grow; draft = null; saveDb(); }); await go('#/');

  // 9. the settings alert
  await load(bare);
  const hb = await page.$$eval('.nxpart:first-of-type .nxlist>li', ls => ls.map(l => l.textContent.replace(/\s+/g, ' ').trim()));
  check('Home asks for the two settings first', /^Set up your log\. Choose your Sec level and add a subject or CCA/.test(hb[0] || ''), hb[0]);
  await page.click('.navnew a[href="#/write/grow"]'); await sleep(500);
  let gt = await page.evaluate(() => ({dlg:document.getElementById('dlg').open, go:document.getElementById('gateGo').disabled, msg:document.getElementById('gateMsg').textContent, sheet:!!document.querySelector('#sheet .sheet')}));
  check('New GROW without them opens the alert, not the entry', gt.dlg && gt.go && /your Sec level and a subject or CCA/.test(gt.msg) && !gt.sheet, JSON.stringify(gt));
  await page.screenshot({path:SHOTS + 't11-gate.png'});
  await page.click('#dlg [data-lv="2"]'); await sleep(100);
  gt = await page.evaluate(() => ({go:document.getElementById('gateGo').disabled, msg:document.getElementById('gateMsg').textContent}));
  check('the level alone is not enough', gt.go && /a subject or CCA/.test(gt.msg), gt.msg);
  await page.click('#dlg [data-gsubj="Geography"]'); await sleep(100);
  check('with a subject too, Continue is ready', await page.evaluate(() => !document.getElementById('gateGo').disabled));
  await page.click('#gateGo'); await sleep(500);
  const pb = await prof();
  check('Continue opens the entry, with both settings saved', await page.evaluate(() => !!document.querySelector('#sheet .sheet') && !document.getElementById('dlg').open) && pb.level === 2 && pb.experiences.subjects.includes('Geography'), JSON.stringify({level:pb.level, subj:pb.experiences.subjects}));
  await page.evaluate(() => { closeComposer(); draft = null; }); await go('#/');
  await load(bare); await go('#/write/act'); await sleep(300);
  await page.click('#gateLater'); await sleep(400);
  check('Not now goes back Home without writing', await page.evaluate(() => location.hash) === '#/' && await page.evaluate(() => !document.querySelector('#sheet .sheet')));
  await load(bare); await go('#/write/grow'); await page.keyboard.press('Escape'); await sleep(400);
  check('Escape on the alert goes back Home too', await page.evaluate(() => location.hash) === '#/');
  await load(seed3); await go('#/write/grow');
  check('a log with both settings goes straight to the entry', await page.evaluate(() => !document.getElementById('dlg').open && !!document.querySelector('#sheet .sheet')));
  await page.evaluate(() => { closeComposer(); draft = null; });

  // 10. the console: three levels, the student's word beside the standard one
  await load(seed4, 'b');
  const snap = await page.evaluate(() => basketSnapshot('cait'));
  check('a shared domain carries the student’s look', snap.look === 'b' && snap.levels.critical.waiting === true, JSON.stringify({look:snap.look, crit:snap.levels.critical}));
  const tp = await ctx.newPage(); tp.on('pageerror', e => errors.push('PAGEERROR console ' + e.message));
  await tp.goto(BASE + 'teacher.html'); await sleep(500);
  const tc = await tp.evaluate(s => {
    s = Object.assign({}, s, {levels:Object.assign({}, s.levels, {adaptive:{level:'developing', waiting:false, secured:3, total:9}})});
    const sk = 'wei'; store.students[sk] = {name:'Wei Ling Tan', email:'wei_ling_tan@students.edu.sg', groups:[]};
    const it = {key:sk + '|basket:cait', sk, kind:'b', data:s, received:Date.now(), opened:true, via:'link'};
    const old = {key:sk + '|basket:cci', sk, kind:'b', data:Object.assign({}, s, {basket:'cci', look:'', levels:{communication:{level:'leading', waiting:false, secured:5, total:9}}}), received:Date.now(), opened:true, via:'link'};
    const t = document.createElement('div'); t.innerHTML = readerHtml(it); const t2 = document.createElement('div'); t2.innerHTML = readerHtml(old);
    return {a:t.textContent.replace(/\s+/g, ' '), b:t2.textContent.replace(/\s+/g, ' '), btn:[...t.querySelectorAll('[data-confirm]')].map(b => b.textContent), title:document.title};
  }, snap);
  check('the console reads Proficient: waiting, with Confirm Proficient', /Critical Thinking ?Proficient: waiting for a teacher/.test(tc.a) && tc.btn.includes('Confirm Proficient'), JSON.stringify(tc.btn));
  check('the student’s own word shows beside the standard one', /Adaptive Thinking ?Developing · they see “Navigating”/.test(tc.a), tc.a.slice(0, 300));
  check('a v2 Leading snapshot reads as Proficient', /Communication ?Proficient/.test(tc.b) && !/Leading/.test(tc.b), tc.b.slice(0, 200));
  check('the console shows Version 3 in the page, not the title, and says nothing of Leading as a level', tc.title.startsWith('E21CC Log') && !/v\d/.test(tc.title) && /Version 3/.test(await tp.textContent('.brand')) && !/Leading:|Confirm Leading|L Leading/.test(await tp.textContent('body')));

  // 11. one copy from v2, never written back
  const fresh = await browser.newContext(); const fp = await fresh.newPage();
  await fp.goto(BASE + 'index.html#/'); await fp.evaluate(s => { localStorage.clear(); localStorage.setItem('cdl.logsv2', s); localStorage.setItem('cdl.v2', '{"profiles":{},"current":null}'); }, JSON.stringify(Object.assign({}, seed3, {copiedFromFirst:1, copiedNoticed:true})));
  await fp.reload(); await sleep(1500);
  const cp = await fp.evaluate(() => ({v3:JSON.parse(localStorage.getItem('e21cclog') || 'null'), v2:localStorage.getItem('cdl.logsv2'), toast:(document.getElementById('toast') || {}).textContent || ''}));
  check('the Log copies the v2 log once into its lasting key, says so, and leaves v2 as it was', cp.v3 && cp.v3.copiedFrom === 'v2' && /from v2 was copied in\. The older version is kept, read only/.test(cp.toast) && JSON.parse(cp.v2).copiedNoticed === true && Object.keys(cp.v3.profiles).length === Object.keys(seed3.profiles).length, cp.toast);
  await fresh.close();

  // 12. no dashes in what students read
  await load(seed3); const txt = (await page.textContent('#main')) + (await page.evaluate(() => JSON.stringify(QHELP) + JSON.stringify(LEVEL_WORDS)));
  check('no dashes in Home or the question help', !/[–—]/.test(txt) && !/ - /.test(txt));
  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
})();
