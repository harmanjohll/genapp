// t36 (6.2): from the staff Padlet. A Start here card on Home, through its three steps; setup from the usual
// subjects in one tap; GROW in all four parts or two or more; an entry needs real answers before it is logged; a
// teacher's occasion link, from the console to the student's Home, the composer and back to the console; and
// My growth story, which shows only what a teacher affirmed and prints.
const fs = require('fs');
const launch = require('./fixtures/launch.js');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const shots = require('./shots.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
(async () => {
  const browser = await launch(); const errors = [];
  const watch = p => p.on('pageerror', e => errors.push(p.url().split('#')[0] + ' ' + e.message));
  const axe = async p => { await p.addScriptTag({content:AXE}); return p.evaluate(async () => (await axe.run(document, {resultTypes:['violations']})).violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => v.id + ' ' + v.nodes[0].target.join(' '))); };
  const ctx = await browser.newContext({viewport:{width:390, height:844}});
  const p = await ctx.newPage(); watch(p);
  const go = async h => { await p.evaluate(x => { location.hash = x; }, h); await sleep(500); };

  // a new log
  await p.goto(BASE + 'index.html#/welcome'); await p.evaluate(() => localStorage.clear()); await p.goto('about:blank'); await p.goto(BASE + 'index.html#/welcome'); await sleep(700);
  await p.fill('#newForm [name=name]', 'Nur Aini'); await p.fill('#newForm [name=email]', 'nur_aini@students.edu.sg'); await p.click('#newForm button[type=submit]'); await sleep(700);

  // 1. Start here, step 1
  await go('#/');
  const s1 = await p.evaluate(() => { const c = document.querySelector('.startcard'); return c ? {now:c.querySelector('li.now').textContent.trim(), go:c.querySelector('#startGo').textContent.trim(), href:c.querySelector('#startGo').getAttribute('href'), n:c.querySelectorAll('li').length} : null; });
  check('a new log’s Home opens with Start here: three steps, and Set up first', s1 && s1.n === 3 && /^1\s*Set up/.test(s1.now) && s1.go === 'Set up' && s1.href === '#/setup', JSON.stringify(s1));
  const a1 = await axe(p); check('Home with Start here has no serious or critical accessibility issues', !a1.length, a1.join(' | '));
  await p.screenshot({path:shots('t36-start-here.png'), animations:'disabled'});

  // 2. the usual subjects, Lower Sec then Upper Sec
  await p.evaluate(() => { me.level = 1; saveDb(); }); await go('#/settings?s=expCard');
  check('setup offers the usual subjects for the level', /Start with the usual subjects for Sec 1/.test(await p.textContent('[data-usual]')));
  await p.click('[data-usual]'); await sleep(500);
  const lower = await p.evaluate(() => me.experiences.subjects.slice());
  check('Lower Sec: English, Mathematics, Science, the Humanities, the Common Curriculum, PE and CCE in one tap', ['English Language', 'Mathematics', 'Science', 'Geography', 'History', 'Literature in English', 'Art', 'Design and Technology', 'Food and Consumer Education', 'Music', 'Physical Education', 'Character and Citizenship Education'].every(n => lower.includes(n)) && lower.length === 12, lower.join(', '));
  check('never a Mother Tongue, an outside subject or the G1 modules, which differ by student', !lower.some(n => /Chinese|Malay|Tamil|Mother Tongue|Exposure/.test(n)));
  check('once they are in, the button goes', !(await p.$('[data-usual]')));
  const upper = await p.evaluate(() => { me.level = 3; me.experiences.subjects = []; saveDb(); addUsualSubjects(); return me.experiences.subjects.slice(); });
  check('Upper Sec, where combinations differ: English Language, Mathematics, PE and CCE', upper.join() === 'English Language,Mathematics,Physical Education,Character and Citizenship Education', upper.join());
  await p.evaluate(() => { me.level = 1; me.experiences.subjects = []; addUsualSubjects(); });

  // 3. Start here, step 2
  await go('#/');
  check('set up done, Start here moves to Write your first GROW', /^2\s*Write your first GROW/.test(await p.textContent('.startcard li.now')) && await p.$eval('#startGo', a => a.getAttribute('href')) === '#/write/grow');

  // 4. parts of GROW
  await go('#/write/grow?x=subject:Mathematics');
  const parts0 = await p.$$eval('[data-part]', l => l.map(b => b.textContent.trim() + ':' + b.getAttribute('aria-pressed')));
  check('a GROW starts with all four parts on', parts0.length === 4 && parts0.every(x => x.endsWith(':true')) && /^G · Gift/.test(parts0[0]), JSON.stringify(parts0));
  await p.click('[data-part="o"]'); await sleep(250); await p.click('[data-part="w"]'); await sleep(250);
  const two = await p.evaluate(() => ({parts:draft.parts, steps:stepsOf()}));
  check('two parts chosen: the entry has only those steps', two.parts.join() === 'g,r' && two.steps.join() === 'context,letter0,letter1,claim,readback', JSON.stringify(two));
  await p.click('[data-part="r"]'); await sleep(250);
  check('at least two parts must stay', (await p.evaluate(() => draft.parts.join())) === 'g,r');
  const a2 = await axe(p); check('the first step with the parts of GROW has no serious or critical accessibility issues', !a2.length, a2.join(' | '));

  // 5. an entry needs real answers
  const atReadback = async answers => { await p.evaluate(a => { draft.answers = a; draft.claims = []; draft._claimNudged = true; draft.step = stepsOf().indexOf('readback'); renderComposer(); }, answers); await sleep(250); await p.click('#cSave'); await sleep(500); };
  await atReadback({});
  check('an empty GROW is not logged, and says why', (await p.evaluate(() => me.entries.length)) === 0 && /at least two parts of GROW/.test(await p.textContent('#lackNote')), await p.evaluate(() => (document.querySelector('#lackNote') || {}).textContent || ''));
  await atReadback({g1:'I understand that a ratio compares two amounts of the same kind.', r1:'idk'});
  check('one real answer and an idk is not enough', (await p.evaluate(() => me.entries.length)) === 0 && !!(await p.$('#lackNote')));
  await atReadback({g1:'I understand that a ratio compares two amounts of the same kind.', r2:'Redo the five ratio questions I got wrong on Thursday after school.'});
  const e1 = await p.evaluate(() => { const e = me.entries[0]; return e ? {parts:e.parts, hash:location.hash, id:e.id} : null; });
  check('a real answer in two parts is logged, and the entry keeps its parts', e1 && e1.parts.join() === 'g,r' && /^#\/entry\//.test(e1.hash), JSON.stringify(e1));
  check('the entry shows only the parts written', (await p.$$eval('.qa-row', l => l.map(r => r.dataset.anchor).join())) === 'g1,g2,r1,r2');
  const lacks = await p.evaluate(() => ({act1:!!logLack({kind:'act', answers:{a1:'I felt annoyed at first but it is fair.'}}), act2:logLack({kind:'act', answers:{a1:'I felt annoyed at first but it is fair.', t1:'I will explain each point with an example on Friday.'}}), across0:!!logLack({kind:'across', answers:{}}), across1:logLack({kind:'across', answers:{x1:'My entries show I can now explain my reasons.'}}), old:logLack({kind:'grow', answers:{g1:'I checked both readings because the first was high.', w2:'Next we learn about inequalities in class.'}})}));
  check('an ACT needs two real answers, a look across one, and an older GROW counts all four parts', lacks.act1 && lacks.act2 === null && lacks.across0 && lacks.across1 === null && lacks.old === null, JSON.stringify(lacks));

  // 6. Start here, step 3, then hidden
  await go('#/');
  check('the first GROW written, Start here moves to Share it', /^3\s*Share it with your teacher/.test(await p.textContent('.startcard li.now')) && await p.$eval('#startGo', a => a.getAttribute('href')) === '#/entry/' + e1.id);
  await p.click('#startHide'); await sleep(400);
  check('Hide this puts Start here away for good', !(await p.$('.startcard')) && await p.evaluate(() => !!me.startDone));

  // 7. the teacher asks for an entry: one link for the class
  const con = await (await browser.newContext({viewport:{width:1280, height:900}})).newPage(); watch(con);
  await con.goto(BASE + 'teacher.html'); await sleep(1800);
  await con.click('.tabs button[data-tab="setup"]'); await sleep(300);
  await con.click('#akMake'); await sleep(200);
  check('the link needs to say what is asked', /Say what you ask/.test(await con.textContent('#akMsg')) && await con.$eval('#akOut', x => x.hidden));
  await con.fill('#akTitle', 'End of unit: Acids and bases'); await con.fill('#akName', 'Chemistry'); await con.fill('#akTopic', 'Acids and bases');
  await con.selectOption('[data-akc="0"]', 'critical'); await sleep(150); await con.selectOption('[data-aks="0"]', 'ct1.l1');
  await con.uncheck('[data-akpart="o"]'); await con.uncheck('[data-akpart="w"]');
  await con.fill('#akBy', 'Ms Lim'); await con.fill('#akEmail', 'lim_mei@btyss.moe.edu.sg');
  const a3 = await axe(con); check('Ask for an entry has no serious or critical accessibility issues', !a3.length, a3.join(' | '));
  await con.screenshot({path:shots('t36-ask-for-an-entry.png'), animations:'disabled'});
  await con.click('#akMake'); await sleep(500);
  const link = await con.$eval('#akLink', x => x.value);
  const packed = await con.evaluate(async l => (await unpackCDL(l.split('o=')[1])).data, link);
  check('it makes one link that names no student', /index\.html#\/ask\?o=CDL/.test(link) && packed.title === 'End of unit: Acids and bases' && packed.sids.join() === 'ct1.l1' && packed.parts.join() === 'g,r' && !JSON.stringify(packed).includes('student'), JSON.stringify(packed).slice(0, 200));

  await p.goto('about:blank'); await p.goto(link.replace(/^.*index\.html/, BASE + 'index.html')); await sleep(1200);
  const ask = await p.evaluate(() => { const c = document.querySelector('.askcard'); return {hash:location.hash, h:c ? c.querySelector('h2').textContent : '', t:c ? c.querySelector('.tiny').textContent : '', kept:Object.keys(JSON.parse(localStorage.getItem('e21cclog')).occasions || {}).length}; });
  check('the student opens it, and Home says what the teacher asks', ask.hash === '#/' && ask.h === 'Ms Lim asks: End of unit: Acids and bases' && /A GROW about Chemistry · Acids and bases, with 1 I can statement to look at/.test(ask.t) && ask.kept === 1, JSON.stringify(ask));
  await p.screenshot({path:shots('t36-teacher-asks.png'), animations:'disabled'});
  await p.click('.askcard a.btn'); await sleep(700);
  const d0 = await p.evaluate(() => ({ctx:draft.context, topic:draft.topic, parts:draft.parts, oc:draft.occasion, adult:adults().find(a => a.email === 'lim_mei@btyss.moe.edu.sg')}));
  check('Write it starts the GROW on that experience, with the parts the teacher chose', d0.ctx.name === 'Chemistry' && d0.topic === 'Acids and bases' && d0.parts.join() === 'g,r' && d0.oc.title === 'End of unit: Acids and bases', JSON.stringify(d0).slice(0, 220));
  check('the teacher who asked is among the student’s adults, to share with', d0.adult && d0.adult.name === 'Ms Lim');
  await p.evaluate(() => { draft.answers = {g1:'I chose methyl orange because the end point of a strong acid and weak base is acidic.', r2:'Practise three titration calculations on Tuesday after CCA.'}; draft.step = stepsOf().indexOf('claim'); renderComposer(); }); await sleep(300);
  const cl = await p.evaluate(() => { const m = [...document.querySelectorAll('#main .mini')].map(x => x.textContent); const first = document.querySelector('#main .claim b'); return {minis:m, first:first ? first.textContent : ''}; });
  check('the claim step lists the teacher’s statement first', cl.minis[0] === 'Your teacher asks you to look at these' && /^I can explain my thinking and decisions using evidence/.test(cl.first), JSON.stringify(cl));
  await p.click('#main .claim .cpick'); await sleep(250);
  await p.evaluate(() => { draft.claims[0].quote = 'I chose methyl orange because the end point of a strong acid and weak base is acidic.'; draft.step = stepsOf().indexOf('readback'); renderComposer(); }); await sleep(250);
  await p.click('#cSave'); await sleep(700);
  const e2 = await p.evaluate(() => { const e = me.entries.find(x => x.occasion); return e ? {oc:e.occasion.title, links:e.links.map(l => l.sid).join(), comp:compactEntry(e)} : null; });
  check('the entry keeps what it was for, and carries it to the teacher', e2 && e2.oc === 'End of unit: Acids and bases' && e2.links === 'ct1.l1' && e2.comp.occasion.title === e2.oc && e2.comp.parts.join() === 'g,r');
  await go('#/'); check('once written, Home no longer asks for it', !(await p.$('.askcard')));
  const share = (await p.evaluate(async () => consoleUrl() + '#/in?p=' + await packCDL('i', {v:1, from:await senderInfo(), items:me.entries.filter(e => e.occasion).map(e => ({t:'e', e:compactEntry(e)}))}))).replace(/^.*teacher\.html/, BASE + 'teacher.html');
  await con.goto('about:blank'); await con.goto(share); await sleep(1600);
  const rd = await con.evaluate(() => { const r = document.querySelector('#inboxList .reader'); return r ? {text:r.textContent.replace(/\s+/g, ' ').slice(0, 300), rows:r.querySelectorAll('.qa-row').length} : null; });
  check('the console shows what the entry was for, and only the parts written', rd && /For: End of unit: Acids and bases/.test(rd.text) && rd.rows === 4, JSON.stringify(rd));

  // 8. My growth story
  await go('#/story');
  check('with nothing affirmed yet, the growth story says so', /Nothing here yet/.test(await p.textContent('#story')) && /My growth story/.test(await p.textContent('#story h1')));
  await p.evaluate(() => { const e = me.entries.find(x => x.occasion); e.notes.push({id:'rv1', by:'Ms Lim', role:'Subject teacher', at:Date.now(), anchor:'claim:ct1.l1', sid:'ct1.l1', verdict:'yes', quote:e.links[0].quote, text:'I saw this too. You chose the indicator for a reason you could name. Next, say what would change with a weak acid.', seen:true}); saveDb(); route(); }); await sleep(500);
  const st = await p.textContent('#story');
  check('it shows the affirmed claim: the statement, the student’s sentence and the teacher’s words', /Critical Thinking/.test(st) && /I can explain my thinking and decisions using evidence/.test(st) && /I chose methyl orange because/.test(st) && /Ms Lim: I saw this too/.test(st) && /Affirmed in 1 entry/.test(st), st.replace(/\s+/g, ' ').slice(0, 260));
  check('it names the student and says only affirmed claims are shown', /Nur Aini/.test(st) && /Sec 1/.test(st) && /Only claims a teacher affirmed are shown/.test(st));
  const pr = await p.evaluate(() => { let rule = false; for (const sh of document.styleSheets){ try{ for (const r of sh.cssRules) if (r.media && /print/.test(r.media.mediaText) && /#story/.test(r.cssText)) rule = true; }catch(e){} } let called = 0; const was = window.print; window.print = () => { called++; }; document.querySelector('#storyPrint').click(); window.print = was; return {rule, called}; });
  check('Print, or save as a PDF, prints the story alone', pr.rule && pr.called === 1, JSON.stringify(pr));
  const a4 = await axe(p); check('My growth story has no serious or critical accessibility issues', !a4.length, a4.join(' | '));
  await p.screenshot({path:shots('t36-growth-story.png'), fullPage:true, animations:'disabled'});
  await go('#/c'); check('Competencies links to My growth story', await p.$eval('.storylink a', a => a.getAttribute('href')) === '#/story');
  check('the version is 6.2', (await p.evaluate(() => VERSION_NO)) === '6.2');

  check('no page errors', !errors.length, errors.join(' | '));
  await browser.close();
  console.log(fails ? `${fails} FAILED` : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); console.log('FAIL crashed'); process.exit(1); });
