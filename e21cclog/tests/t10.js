// t10: the coach that meets the student where they are (v2). Golden set, built in and a mocked Gemini.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = (process.env.BASE || 'http://localhost:8123/e21cclog/'); const SHOTS = require('./shots.js')('');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const PRAISE = /well done|great job|good job|excellent|amazing|awesome|fantastic|proud of you|nice work|good effort|would be pleased/i;
const seed = JSON.parse(fs.readFileSync(__dirname + '/fixtures/seed3.json', 'utf8')); const P = seed.profiles[seed.current];
P.email = 'wei_ling_tan@students.edu.sg'; P.coach.mode = 'gemini'; P.coach.geminiKey = 'TESTKEY'; P.coach.geminiModel = 'gemini-3.5-flash'; P.coach.auto = false; P.drafts = {};
P.experiences.levels = {Chemistry:'G1', Geography:'G3'};
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({viewport:{width:390, height:844}});
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  const calls = []; let reply = null;
  await page.route('https://generativelanguage.googleapis.com/**', async route => {
    const body = JSON.parse(route.request().postData() || '{}'); calls.push(body);
    return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(reply)}], role:'model'}, finishReason:'STOP'}]})});
  });
  const go = async h => { await page.evaluate(x => location.hash = x, h); await sleep(350); };
  await page.goto(BASE + 'index.html#/'); await page.evaluate(s => localStorage.setItem('e21cclog', s), JSON.stringify(seed)); await page.reload(); await sleep(500);
  const used = () => page.evaluate(() => me.coach.allowance.used || 0);

  // 1. nothing written: nothing sent, nothing counted, nothing said but that
  const u0 = await page.evaluate(() => readsUsed());
  await go('#/write/act'); await page.click('.xchips .chip'); await sleep(150);
  for (let i = 0; i < 5; i++){ await page.click('#cNext'); await sleep(150); }
  const rb = (await page.textContent('#sheet .coach')).trim();
  check('1. a blank entry: the readback says only that there is nothing to give feedback on, and offers no AI read', rb === 'Nothing is written yet, so there is nothing to give feedback on.' && !(await page.$('#askAi')), rb);
  await page.click('#cSave'); await sleep(700);
  const blankId = await page.evaluate(() => location.hash.split('/')[2].split('?')[0]);
  await page.evaluate(id => runAiFor(me.entries.find(e => e.id === id)), blankId); await sleep(300);
  const r1 = await page.evaluate(async id => { const e = me.entries.find(x => x.id === id); const r = await aiCoach(e); return {nothing:!!r.nothing, gift:r.gift, stretch:r.stretch, question:r.question}; }, blankId);
  const page1 = await page.textContent('main');
  check('1. never sent to the model, no read counted, no praise anywhere', calls.length === 0 && (await used()) === u0 && r1.nothing && !r1.gift && !r1.stretch && !r1.question && !PRAISE.test(page1) && page1.includes('Nothing is written yet'), JSON.stringify({calls:calls.length, r1}));
  await page.screenshot({path:SHOTS + 'v2-t10-blank.png', fullPage:true});

  // 2 to 4 and 8: the built in read on golden answers
  const G = await page.evaluate(() => {
    const now = Date.now(); const mk = (answers, extra = {}) => Object.assign({id:'g' + Math.random().toString(36).slice(2, 7), kind:'grow', created:now, context:{type:'subject', name:'Chemistry'}, subject:'Chemistry', topic:'Rates', answers, competencies:[], links:[]}, extra);
    const pr = e => learnerProfile(me, STMT_SET, me.entries, e, {stuck:{}});
    const idk = mk({g1:'idk'}); const bi = builtinCoach(idk, null, pr(idk));
    const task = mk({g1:'We did a worksheet on rates of reaction and I finished all the questions and submitted the homework for marks.', r2:'Finish the next worksheet.'}); const bt = builtinCoach(task, null, pr(task)); const xt = builtinE21cc(task, []);
    const strong = mk({g1:'I compared two graphs of reaction rate because the steeper curve showed the faster reaction, so I decided the warmer flask reacted faster.', g2:'I would explain it to my friend by heating two cups of tea and timing how fast the sugar dissolves.'});
    const xs = builtinE21cc(strong, []); const ids = Object.keys(STMT_SET.ksvdIndex || coreSet().ksvdIndex);
    const plan = pr(mk({}))['plans'][0]; const ft = mk({g1:'I understood that a catalyst speeds up a reaction without being used up.'}, {followThrough:{eid:plan.eid, answer:'yes'}}); const bf = builtinCoach(ft, null, pr(ft));
    return {idk:{status:bi.answers.find(a => a.qid === 'g1').status, gift:bi.gift, question:bi.question, stretch:bi.stretch},
      task:{stance:xt.stance, competency:bt.competency},
      strong:{ksvd:xs.ksvd, verbatim:xs.ksvd.every(k => isVerbatim(strong, k.quote)), known:xs.ksvd.every(k => ids.includes(k.id))},
      ft:{gift:bf.gift, status:bf.follow_through.status, plan:plan.text}};
  });
  check('2. “idk”: thin, no praise, one small question', G.idk.status === 'thin' && G.idk.gift === '' && /\?$/.test(G.idk.question) && !PRAISE.test(G.idk.stretch + G.idk.question), JSON.stringify(G.idk));
  check('3. a long answer about the task only: stance task, and the coach asks for how', G.task.stance === 'task' && /how you did it/.test(G.task.competency), JSON.stringify(G.task));
  check('4. a strong answer: knowledge, skills, values or dispositions from the map, each with the student’s exact words', G.strong.ksvd.length >= 2 && G.strong.verbatim && G.strong.known, JSON.stringify(G.strong.ksvd.map(k => k.id + ':' + k.strength)));
  check('8. follow through answered Yes: named as the strength', G.ft.status === 'done' && G.ft.gift.includes(G.ft.plan) && G.ft.gift.startsWith('You followed through'), G.ft.gift);

  // 5 and 6: uptake fades the help; a question still at its start gets a frame
  const U = await page.evaluate(() => {
    const now = Date.now(), D = 864e5; const mk = (id, days, r2, extra = {}) => Object.assign({id, kind:'grow', created:now - days * D, context:{type:'subject', name:'History'}, subject:'History', topic:'Sources', answers:{g1:'I understood how to read the source caption carefully.', r2}, competencies:[], links:[]}, extra);
    const a = mk('u1', 21, 'study more'), b = mk('u2', 14, 'revise more'), c = mk('u3', 7, 'try harder');
    for (const e of [a, b, c]) e.coach = {builtin:builtinCoach(e, null, learnerProfile(me, STMT_SET, [a, b, c].filter(x => x.created < e.created), e))};
    const now1 = mk('u4', 0, 'try harder'); const p1 = learnerProfile(me, STMT_SET, [a, b, c], now1);
    const read1 = builtinCoach(now1, null, p1);
    const now2 = mk('u5', 0, 'On Thursday after school, at my desk, I will redo two source questions for 20 minutes.'); const p2 = learnerProfile(me, STMT_SET, [a, b, c], now2);
    return {stage:p1.stage.r2, sc1:p1.scaffold.r2, frame:read1.scaffold.frame, level:read1.scaffold.level, stretchQ:read1.stretch_qid, twice:p1.lastStretch && p1.lastStretch.twice, uptake:p2.lastStretch && p2.lastStretch.uptake, sc2:p2.scaffold.r2};
  });
  check('6. a plan question at its start three times: help at level 2, a frame with blanks and none of the student’s words', U.stage === 'starting' && U.sc1 === 2 && U.level === 2 && U.frame.includes('___') && !/try harder/i.test(U.frame), JSON.stringify(U));
  check('5. the next plan has a day, a place and an action: uptake, and the help steps down', U.uptake === true && U.sc2 === 1, JSON.stringify(U));

  // 7. I'm stuck, three times: question, frame, then a model from another subject
  await page.click('a.homebtn, #cHome').catch(() => {}); await go('#/write/grow'); const resume = await page.$('#rNew'); if (resume){ await resume.click(); await sleep(200); }
  await page.click('.xchips [data-exp$="|Chemistry"]').catch(async () => { await page.click('.xchips .chip'); }); await sleep(150); await page.click('#cNext'); await sleep(200);
  await page.click('[data-stuck=g1]'); await sleep(150); const h1 = await page.textContent('.helpbox');
  await page.click('.helpbox [data-stuck=g1]'); await sleep(150); const h2 = await page.textContent('.helpbox');
  await page.click('.helpbox [data-stuck=g1]'); await sleep(150); const h3 = await page.textContent('.helpbox');
  check('7. I’m stuck: a question, then a frame, then a model from another subject', /\?/.test(h1) && !h1.includes('Try this frame') && h2.includes('Try this frame') && !h2.includes('another subject') && h3.includes('An example from another subject') && !/Chemistry/.test(h3.split('another subject')[1] || ''), [h1, h2, h3].map(x => x.replace(/\s+/g, ' ').trim().slice(0, 80)).join(' | '));
  await page.screenshot({path:SHOTS + 'v2-t10-stuck.png', fullPage:true});
  await page.click('#cClose'); await sleep(300);

  // 9 and 10, and what the model is sent: a mocked Gemini read
  calls.length = 0;
  const target = await page.evaluate(() => { const e = me.entries.filter(x => x.kind === 'grow' && x.context.name === 'Geography')[0]; return {id:e.id, quote:'I compared two maps of Bedok because the newer one showed new canals'}; });
  reply = {gift:'You compared two maps.', stretch:'Name the year of each map.', question:'Which map is newer?', competency:'Critical thinking.', depth:'working',
    answers:[{qid:'g1', status:'answered'}], stretch_qid:'o1', follow_through:{status:'unclear', note:''}, scaffold:{level:3, frame:'In ___ I saw ___.', model:'For example, in Music: I counted the beats.'},
    content_check:'Check with your teacher: do canals lower flood risk on their own?',
    e21cc:{stance:'competency', stance_note:'About how you worked.', evidence:[{id:'critical', strength:'strong', quote:target.quote, why:'You compared.'}], suggested:[], tagged_not_shown:[], probe:'Why?', probe_for:'critical',
      ksvd:[{id:'ct1.s2', quote:target.quote, strength:'strong'}, {id:'zz9.k1', quote:target.quote, strength:'clear'}, {id:'ct1.k1', quote:'words the student never wrote', strength:'clear'}], statements:[]}};
  const R = await page.evaluate(async id => { const e = me.entries.find(x => x.id === id); const r = await aiCoach(e); return {ksvd:r.e21cc.ksvd.map(k => k.id), scaffold:r.scaffold, content:r.content_check, answers:r.answers.length}; }, target.id);
  const body = calls[0] || {}; const sys = ((body.systemInstruction || {}).parts || [{}])[0].text || ''; const user = (((body.contents || [])[0] || {}).parts || [{}])[0].text || '';
  check('the prompt: the full instructions, the KSVD map, and the profile before the entry', /Where the student is\./.test(sys) && sys.includes('[ct1.s2] Weighing two sides') && sys.includes('Scaffold at the level the profile gives') && user.startsWith('Where this student is') && user.indexOf('Where this student is') < user.indexOf('Framework: GROW'));
  const oldAnswer = 'I chose the survey data as evidence because 62 percent'; const lastPlan = await page.evaluate(id => learnerProfile(me, STMT_SET, me.entries, me.entries.find(x => x.id === id)).plans[0].text, target.id);
  check('the prompt carries no name, no email, and no past answers except the last plans', !/Wei Ling Tan|wei_ling_tan@/.test(sys + user) && !user.includes(oldAnswer) && user.includes(lastPlan.slice(0, 30)), lastPlan);
  check('10. subject level sets the register: G3 for Geography in the prompt', user.includes('Subject level for Geography: G3') && sys.includes('G1: short concrete sentences'));
  check('the reply is checked: invented ids and words not in the entry are dropped; help is held to the profile’s level', R.ksvd.join() === 'ct1.s2' && R.scaffold.level === 1 && !R.scaffold.frame && !R.scaffold.model && R.answers === 8, JSON.stringify(R));
  check('9. a likely content error comes back as a question for the teacher', /^Check with your teacher: .*\?$/.test(R.content));
  const G1 = await page.evaluate(() => { const e = me.entries.find(x => x.context.name === 'Chemistry'); return profileBlock(learnerProfile(me, STMT_SET, me.entries, e)); });
  check('10. and G1 for Chemistry', G1.includes('Subject level for Chemistry: G1'));
  // a content check that is not a question is dropped
  reply.content_check = 'Canals lower flood risk.'; const R2 = await page.evaluate(async id => (await aiCoach(me.entries.find(x => x.id === id))).content_check, target.id);
  check('9. a content statement (not a question) is dropped', R2 === '');

  // what students and teachers see
  reply.content_check = 'Check with your teacher: do canals lower flood risk on their own?';
  await page.evaluate(id => { const e = me.entries.find(x => x.id === id); e.coach = e.coach || {}; return aiCoach(e).then(r => { e.coach.ai = r; e.e21cc = r.e21cc; saveDb(); }); }, target.id); await sleep(200);
  await go('#/entry/' + target.id);
  const ent = await page.textContent('main');
  check('the entry shows what the words show, in plain words, with no stage or level labels', ent.includes('What your words show') && ent.includes('Weighing two sides') && !/scaffold|stage|level 1|level 2/i.test(ent.split('What your words show')[1] || ''));
  await go('#/c/critical'); check('the competency page lists what has been shown so far', (await page.textContent('main')).includes('What you have shown so far'));
  await page.screenshot({path:SHOTS + 'v2-t10-entry.png', fullPage:true});
  const link = await page.evaluate(async id => consoleUrl() + '#/in?p=' + await packCDL('i', {v:1, from:await senderInfo(), items:[{t:'e', e:compactEntry(me.entries.find(x => x.id === id))}]}), target.id);
  const tp = await ctx.newPage(); await tp.goto(BASE + 'teacher.html'); await tp.evaluate(() => localStorage.removeItem('e21cclog.teacher')); await tp.goto(link.replace(/^.*teacher\.html/, BASE + 'teacher.html')); await sleep(900);
  const rd = await tp.textContent('.reader');
  check('the teacher sees how the coach met the student: statuses, help level, follow through, the content question, the KSVD ids', rd.includes('How the coach met this student') && rd.includes('help given at level 1') && rd.includes('Content question sent to you') && rd.includes('ct1.s2'), '');
  await tp.screenshot({path:SHOTS + 'v2-t10-teacher.png', fullPage:true});
  // the first site's log is copied in once, and never written
  const fresh = await ctx.newPage(); await fresh.goto(BASE + 'index.html#/'); await fresh.evaluate(s => { localStorage.removeItem('e21cclog'); localStorage.setItem('cdl.v2', s); }, JSON.stringify(seed)); await fresh.reload(); await sleep(1300);
  const cp = await fresh.evaluate(() => ({v2:!!localStorage.getItem('e21cclog'), first:JSON.parse(localStorage.getItem('cdl.v2')).profiles[JSON.parse(localStorage.getItem('cdl.v2')).current].entries.length, toast:(document.getElementById('toast') || {}).textContent || ''}));
  check('the Log copies the first version’s log in once, says so, and leaves it unchanged', cp.v2 && cp.first === P.entries.length && cp.toast.includes('copied in'), JSON.stringify(cp));
  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
})();
