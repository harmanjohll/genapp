// Builds the demo's sample data: one Sec 3 student (Sam Lee) with a term of entries, seven classmates, and the
// form teacher's console holding what the class shared. Every name is made up. It runs the app's own code in a
// browser (the built in read of each entry, basket snapshots, the console's addItems), so the data has exactly the
// shapes the app makes, then writes assets/demo-data.js. Dates are kept relative: the demo shifts them to today.
//   cd e21cclog && python3 -m http.server 8129 --directory ..  (another shell)
//   node demo/make-demo.js            (BASE defaults to http://localhost:8129/e21cclog/)
const fs = require('fs'); const path = require('path');
const BASE = process.env.BASE || 'http://localhost:8129/e21cclog/';
const launch = require('../tests/fixtures/launch.js');
const NOW = Date.now(), D = 864e5; const at = d => NOW - d * D;
const MAIL = n => n.toLowerCase().replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '_') + '@students.edu.sg';
const STAFF_MAIL = n => n.toLowerCase().replace(/^(mr|ms|mrs|mdm|dr) /, '').replace(/[^a-z ]/g, '').trim().replace(/\s+/g, '_') + '@moe.edu.sg';

/* ---------- the school's staff list (A1), made up ---------- */
const STAFF = [
  ['Mrs Goh Siew Ling', [['History', [3, 4]], ['Social Studies', [3, 4]]], [], '3I'],
  ['Ms Lim Mei', [['Chemistry', [3, 4]], ['Science', [1, 2]]], [], ''],
  ['Mr Tan Ah Kow', [['Mathematics', [3, 4]]], ['Football'], '3E'],
  ['Mdm Siti Rahmah', [['Geography', [3, 4]]], [], ''],
  ['Mr Raj Kumar', [['English', [1, 2, 3, 4]]], ['Drama'], ''],
  ['Mr Ong Kah Wee', [['Physics', [3, 4]]], ['Concert Band'], ''],
  ['Ms Chua Hui Ying', [['Mathematics', [1, 2]], ['Additional Mathematics', [3, 4]]], [], '1A'],
  ['Mr Lee Boon Hock', [['Biology', [3, 4]]], ['Badminton'], ''],
].map(([name, subjects, ccas, form]) => ({name, email:STAFF_MAIL(name), subjects:subjects.map(([n, l]) => ({name:n, levels:l})), ccas, form}));
const T = n => STAFF.find(s => s.name.includes(n)).email;

/* ---------- Sam Lee's term ---------- */
const grow = (id, d, subject, topic, a, links = [], extra = {}) => ({id, kind:'grow', d, subject, topic, answers:a, links, ...extra});
const act = (id, d, subject, topic, a, links = [], extra = {}) => ({id, kind:'act', d, subject, topic, answers:a, links, ...extra});
const SAM = [
  grow('sam01', 98, 'History', 'Sources on the fall of Singapore', {
    g1:'Source A blames the generals but Source B blames the lack of planes, and I worked out that both can be true because they look at different stages.',
    g2:'I would explain to a friend that two sources can disagree without one being wrong.',
    r1:'I do not yet know how to decide which cause mattered more.', r2:'Read the textbook chapter on the air force on Thursday for 20 minutes.',
    o1:'I compared the two sources line by line before I wrote my answer.', o2:'I asked my grandfather what he remembered from his father.',
    w1:'This links to how we compare evidence in Geography.', w2:'Next lesson we write a full source based answer.'},
    [['ct1.u1', 'Source A blames the generals but Source B blames the lack of planes, and I worked out that both can be true because they look at different stages.']]),
  grow('sam02', 84, 'Chemistry', 'Rates of reaction', {
    g1:'I planned to test one variable at a time and checked my method halfway, which showed my timing was the weak point.',
    g2:'I learnt that a higher temperature makes the particles collide more often.',
    r1:'I am unsure why the powder reacted so much faster than the chips.', r2:'Ask Ms Lim about surface area after Friday’s lesson.',
    o1:'I recorded every reading in a table so I could spot the odd one.', o2:'',
    w1:'We did a fair test in Science last year.', w2:'Next we look at catalysts.'},
    [['ct2.u1', 'I planned to test one variable at a time and checked my method halfway, which showed my timing was the weak point.']]),
  act('sam03', 77, 'English', 'Argumentative essay feedback', {
    a1:'Mr Raj said my argument was strong but my tone was too casual for the audience.', a2:'I felt a bit embarrassed, but I could see he was right.',
    c1:'It connects to the criterion on purpose, audience and context.', c2:'My last essay had the same comment about tone.',
    t1:'I changed my tone for the school principal as the audience and used two pieces of evidence instead of one.', t2:'I will reread every paragraph as if I were the principal before I hand it in.'},
    [['co1.u1', 'I changed my tone for the school principal as the audience and used two pieces of evidence instead of one.']]),
  grow('sam04', 70, 'Concert Band', 'Sectional practice', {
    g1:'I got the clarinets to agree on one tempo by asking each person what they found hard first.',
    g2:'I would tell a new member that listening comes before playing louder.',
    r1:'I am not sure how to help the two players who keep rushing.', r2:'Practise bars 20 to 36 with the metronome on Saturday for 15 minutes.',
    o1:'I took the second part when our section was short of players.', o2:'I helped the Sec 1s set up their stands.',
    w1:'This is like leading a group discussion in class.', w2:'The combined rehearsal is in two weeks.'},
    [['cl3.u1', 'I got the clarinets to agree on one tempo by asking each person what they found hard first.'], ['cl4.u2', 'I took the second part when our section was short of players.']], {context:{type:'cca', name:'Concert Band'}}),
  grow('sam05', 63, 'Geography', 'Land use debate', {
    g1:'The farmers and the developers both had evidence, and I showed where their views conflicted over water.',
    g2:'I would explain that land use is about trade offs, not one right answer.',
    r1:'I still find it hard to weigh long term costs against short term gains.', r2:'Make a table of costs and gains for each group before the next lesson.',
    o1:'I listened to the other side before I answered.', o2:'',
    w1:'History taught me to compare sources the same way.', w2:'Next we study housing in Singapore.'},
    [['ct1.u1', 'The farmers and the developers both had evidence, and I showed where their views conflicted over water.']]),
  grow('sam06', 56, 'Mathematics', 'Simultaneous equations', {
    g1:'I monitored my working by substituting my answers back, and I will keep doing that because it caught two mistakes.',
    g2:'I can solve them by elimination and by substitution.',
    r1:'I am slow when the coefficients are fractions.', r2:'Do five fraction questions on Wednesday after school.',
    o1:'I checked each step before moving on.', o2:'',
    w1:'This uses the algebra from Sec 2.', w2:'Next we apply it to word problems.'},
    [['ct2.u1', 'I monitored my working by substituting my answers back, and I will keep doing that because it caught two mistakes.']]),
  act('sam07', 42, 'Chemistry', 'Practical test feedback', {
    a1:'Ms Lim said my titration was accurate but my write up skipped the safety steps.', a2:'I was annoyed at first because the result was right.',
    c1:'It connects to the planning criterion.', c2:'Safety is part of the method, not an extra.',
    t1:'When my first method failed I changed both my plan and how I felt about the mistake.', t2:'I will write the safety steps first in my next plan.'},
    [['at4.u1', 'When my first method failed I changed both my plan and how I felt about the mistake.']]),
  grow('sam08', 28, 'Geography', 'Fieldwork group', {
    g1:'Our group was split on which site to measure, so I helped us agree on a plan that used both sites.',
    g2:'I would show a friend how to measure the river width with a tape.',
    r1:'I am not sure our depth readings were accurate.', r2:'Compare our readings with the other groups on Monday.',
    o1:'I made sure everyone had a job before we started.', o2:'',
    w1:'This is like the sectional practice in band.', w2:'Next we write up the fieldwork.'},
    [['cl3.u1', 'Our group was split on which site to measure, so I helped us agree on a plan that used both sites.']]),
  grow('sam09', 21, 'English', 'Class debate', {
    g1:'I adjusted my language for a younger audience and kept my points short and clear.',
    g2:'I learnt that a strong rebuttal answers the other side’s best point.',
    r1:'I rush when I am nervous.', r2:'Practise my speech aloud twice before the next debate.',
    o1:'I took notes on the other team’s points.', o2:'',
    w1:'This is the same skill as the essay on tone.', w2:'Next is the inter class debate.'},
    [['co1.u1', 'I adjusted my language for a younger audience and kept my points short and clear.']]),
  grow('sam10', 12, 'Mathematics', 'Statistics project', {
    g1:'I tried three ways to show the data before choosing the box plot.',
    g2:'I learnt that the median is better than the mean when there are outliers.',
    r1:'I do not yet know how to explain the spread in words.', r2:'Redo the box plot with the new data on Friday.',
    o1:'I asked two classmates which chart was clearest.', o2:'',
    w1:'Geography fieldwork data could use the same chart.', w2:'Next we present our findings.'},
    [['it5.u1', 'I tried three ways to show the data before choosing the box plot.']]),
  act('sam11', 5, 'History', 'Source based question feedback', {
    a1:'Mrs Goh said I listed the sources well but did not reach a judgement.', a2:'I felt I had done enough, so it was useful to hear.',
    c1:'It connects to the criterion on reaching a substantiated judgement.', c2:'It is the same as weighing views in the land use debate.',
    t1:'I explained what the conflict between the sources meant for my conclusion instead of just listing them.', t2:'I will end every answer with one sentence that says which source I trust more and why.'},
    [['ct1.u2', 'I explained what the conflict between the sources meant for my conclusion instead of just listing them.']]),
  grow('sam12', 3, 'Chemistry', 'Preparing salts', {
    g1:'Crystallising the salt was like evaporating seawater in Geography, but here we stop before it is dry.',
    g2:'I would show a friend how to tell when the solution is saturated.',
    r1:'I do not understand why we must not heat it to dryness.', r2:'Ask Ms Lim about heating to dryness in Thursday’s lesson.',
    o1:'I checked the method with my partner before we heated anything.', o2:'',
    w1:'This links to evaporation in Geography.', w2:'Next we prepare an insoluble salt.'},
    [['at3.u1', 'Crystallising the salt was like evaporating seawater in Geography, but here we stop before it is dry.']], {target:'ct1.u2'}),
];
const SAM_NOTES = {
  sam05:[{by:'Mdm Siti Rahmah', role:'Subject teacher', d:60, anchor:'g1', text:'You named the conflict clearly. Which group’s evidence was stronger, and why?', seen:true}],
  sam11:[{by:'Mrs Goh Siew Ling', role:'Form teacher', d:4, anchor:'t2', text:'Seen. Thank you for sharing this.', seen:true}],
  sam12:[{by:'Ms Lim Mei', role:'Subject teacher', d:1, anchor:'entry', text:'Good link to Geography. Which property of the salt decides when you stop heating?', seen:false}],
};
const SAM_DRAFT = {kind:'grow', key:'grow', step:2, context:{type:'subject', name:'Geography'}, subject:'Geography', topic:'River fieldwork write up', answers:{g1:'I can now explain why the river is wider downstream: more water joins it and it erodes the banks.'}, claims:[], d:0.1};

/* ---------- seven classmates, a few entries each ---------- */
const MATES = [
  ['Aisyah Rahman', [['Geography', 'Fieldwork group', 'We divided the measuring so each of us checked one site, then compared.', 'cl4.u3'], ['English', 'Class debate', 'I answered the other team’s strongest point before making my own.', 'co1.u3']]],
  ['Daniel Ng', [['Mathematics', 'Statistics project', 'I picked the median because two results were far from the rest.', null], ['Football', 'Match review', 'When we went a goal down I moved to defence because the team needed it.', 'cl4.u2'], ['Chemistry', 'Rates of reaction', 'I changed my plan when the first reading made no sense.', 'at4.u1']]],
  ['Priya Nair', [['History', 'Sources on the fall of Singapore', 'I showed where Source C and Source D disagree and what that means for my answer.', 'ct1.u2'], ['Drama', 'Production rehearsal', 'I helped two actors who were arguing hear what each other wanted.', 'cl3.u2']]],
  ['Marcus Tan', [['Chemistry', 'Practical test', 'I checked my readings twice because the first titre looked too high.', null], ['Geography', 'Land use debate', 'I tried to see the issue from the farmers’ side before I argued.', 'co2.u1']]],
  ['Hui Min Chua', [['English', 'Argumentative essay', 'I rewrote my opening for a younger audience.', 'co1.u1'], ['Concert Band', 'Combined rehearsal', 'I suggested we record ourselves so the section could hear the problem.', 'it5.u1'], ['Mathematics', 'Simultaneous equations', 'I tracked which method I used and which one was faster for me.', 'ct2.u1']]],
  ['Ethan Lim', [['Badminton', 'Doubles training', 'My partner and I agreed who covers the back before each rally.', 'cl3.u1']]],
  ['Farah Ismail', [['History', 'Source based question', 'I weighed both sources and said which I trusted more and why.', 'ct1.u3'], ['Geography', 'Housing in Singapore', 'I compared housing in Singapore and Hong Kong and saw what is similar.', 'at3.u1']]],
].map(([name, list], i) => ({name, email:MAIL(name), entries:list.map(([subject, topic, line, sid], k) => grow('m' + i + 'e' + k, 30 - k * 9 - i, subject, topic, {g1:line, g2:'I learnt something I can use again.', r1:'I am still unsure about one part.', r2:'Practise it again this week.'}, sid ? [[sid, line]] : []))}));

const profileOf = (name, email, entries, opts = {}) => ({id:'demo-' + email.split('@')[0], name, email, groups:[], pin:null, created:at(120), level:3,
  prefs:{look:'b', mood:'mountain', accent:'yellow', size:'normal', avatar:opts.avatar || 'compass'},
  experiences:opts.experiences || {subjects:[...new Set(entries.filter(e => !e.context).map(e => e.subject))], cca:'', others:[], levels:{}},
  entries:entries.map(e => ({id:e.id, kind:e.kind, created:at(e.d), updated:at(e.d), context:e.context || {type:'subject', name:e.subject}, subject:e.subject, topic:e.topic, groupCode:'',
    feedbackFrom:'teacher', feedbackText:'', answers:e.answers, competencies:[], notes:[], sent:{}, target:e.target || '', links:e.links.map(([sid, quote]) => ({sid, quote, at:at(e.d)}))})),
  drafts:{}, done:{}, confirmed:{}, pendingNotes:[], sentBaskets:{}, shares:{adults:{}, sections:{grow:[], act:[], cait:[], cci:[], cgc:[], sec:[]}, scope:{}}});

(async () => {
  const browser = await launch(); const ctx = await browser.newContext({viewport:{width:1280, height:900}});
  const stu = await ctx.newPage(); stu.on('pageerror', e => console.log('student page error', e.message));
  await stu.goto(BASE + 'index.html');
  // each log goes through the app: migrated, read by the built in coach, and packed as the console would receive it
  const run = async (prof, setup) => stu.evaluate(async ([p, setup]) => {
    const db = migrateDb({profiles:{[p.id]:p}, current:p.id}); localStorage.setItem('e21cclog', JSON.stringify(db));
    window.__db = db; me = db.profiles[p.id]; await loadStatements();
    for (const e of me.entries){ Object.assign(e, migrateEntry(e)); e.e21cc = builtinE21cc(e, myStatements()); }
    if (setup) (new Function('me', 'db', setup))(me, db);
    const items = [...me.entries.map(e => ({t:'e', e:compactEntry(e)})), ...BASKET_IDS.map(b => ({t:'b', b:basketSnapshot(b)}))];
    return {db:JSON.parse(JSON.stringify(db)), from:await senderInfo(), items};
  }, [prof, setup || '']);

  const sam = profileOf('Sam Lee', MAIL('Sam Lee'), SAM, {avatar:'compass', experiences:{subjects:['Chemistry', 'English', 'Geography', 'History', 'Mathematics'], cca:'Concert Band', others:[], levels:{}}});
  const samSetup = `
    db.staff = ${JSON.stringify({at:at(30), loaded:at(29), list:STAFF})};
    me.teachers = {subjects:{Chemistry:'${T('Lim Mei')}', English:'${T('Raj')}', Geography:'${T('Siti')}', History:'${T('Goh')}', Mathematics:'${T('Tan Ah')}'}, ccas:{'Concert Band':'${T('Ong')}'}, form:'${T('Goh')}'};
    const form = 't:${T('Goh')}'; me.shares.sections.grow = [form]; me.shares.sections.act = [form];
    const notes = ${JSON.stringify(SAM_NOTES)}; const NOW = ${NOW}, D = ${D};
    for (const [eid, list] of Object.entries(notes)){ const e = me.entries.find(x => x.id === eid); for (const n of list) e.notes.push({id:'n' + eid + n.d, by:n.by, role:n.role, at:NOW - n.d * D, anchor:n.anchor, text:n.text, seen:n.seen}); }
    // the older entries already went to the form teacher; the two newest wait in Send
    for (const e of me.entries) if (e.created < NOW - 4 * D) e.sent[form] = e.created + D;
    me.done.sam06 = true;
    // 6.0: teachers have checked Sam's older claims. Where the words show it, the subject teacher affirmed it; where
    // they do not, the teacher said not yet, with advice. The newest entries still wait for a teacher.
    const nameOf = em => (((db.staff || {}).list || []).find(t => t.email === em) || {}).name || 'Your teacher';
    const teacherOf = e => { const T = me.teachers || {}; const em = (T.subjects || {})[e.context.name] || (T.ccas || {})[e.context.name] || T.form; return nameOf(typeof em === 'object' && em ? em.email : em); };
    for (const e of me.entries) if (e.created < NOW - 6 * D) for (const l of (e.links || [])){
      const st = statementById(l.sid); if (!st) continue; const yes = wordsShow(e, st);
      e.notes.push({id:'r' + e.id + l.sid.replace(/\W/g, ''), by:teacherOf(e), role:e.context.type === 'cca' ? 'CCA teacher' : 'Subject teacher', at:e.created + 2 * D, anchor:'claim:' + l.sid, sid:l.sid, quote:l.quote, verdict:yes ? 'yes' : 'notyet', seen:true,
        text:yes ? 'I saw this too. You named what you did and why, and it matches what I saw in class. Next, try it somewhere new and say what changed.' : 'Not yet. Your sentence says what happened, but not how you decided. Next time, write the reason that tipped your choice.'});
    }
    const d = ${JSON.stringify(SAM_DRAFT)}; d.saved = NOW - d.d * D; d.started = d.saved - 600000; d.term = termKey(NOW); delete d.d; me.drafts.grow = d;`;
  const S = await run(sam, samSetup);
  const mates = []; for (const m of MATES) mates.push(await run(profileOf(m.name, m.email, m.entries)));

  // the form teacher's console: what each student opened to her, with replies, some sent and some waiting
  const con = await ctx.newPage(); con.on('pageerror', e => console.log('console page error', e.message));
  await con.goto(BASE + 'teacher.html'); await new Promise(r => setTimeout(r, 1500));
  const store = await con.evaluate(async ([all, NOW, D]) => {
    Object.assign(store, blankStore()); store.me = {name:'Mrs Goh Siew Ling', role:'Form teacher'};
    all.forEach(({from, items}, i) => { from.groups = ['3I']; addItems(from, items, i % 3 ? 'link' : 'form'); });
    const list = Object.values(store.items); list.forEach((it, i) => { it.received = (it.data.updated || it.data.created || NOW) + 3600e3 * (2 + i % 5); it.opened = it.received < NOW - 3 * D; });
    const note = (sk, id, text, sent, anchor = 'entry') => { const key = sk + '|' + id; if (!store.items[key]) return; (store.notes[key] = store.notes[key] || []).push({id:'d' + Math.abs(key.split('').reduce((h, c) => h * 31 + c.charCodeAt(0) | 0, 7)).toString(36), anchor, text, at:store.items[key].received + 3600e3, sentAt:sent ? store.items[key].received + 7200e3 : null}); };
    const sk = n => Object.keys(store.students).find(k => store.students[k].name === n);
    note(sk('Sam Lee'), 'sam11', 'Thank you for sharing this. Your plan names a day and a task, which makes it easy to check. Tell me on Friday how it went.', true, 'entry');
    note(sk('Priya Nair'), 'm2e0', 'Clear thinking here: you gave a reason for each choice. Next, compare it with what your group decided.', true);
    note(sk('Daniel Ng'), 'm1e1', 'Let us talk about this next lesson: bring the match sheet, and we will look at where the marking broke down.', false);
    note(sk('Aisyah Rahman'), 'm0e0', 'You set the group up well. What would you do differently next time?', false, 'g1');
    return JSON.parse(JSON.stringify(store));
  }, [[S, ...mates].map(x => ({from:x.from, items:x.items})), NOW, D]);
  await browser.close();

  const out = `/* The demo's sample data, made by demo/make-demo.js on ${new Date(NOW).toISOString().slice(0, 10)}. Every person here is made up.
   "at" is when it was made: the demo moves every date forward by the time since, so the term always ends today. */
window.E21_DEMO = ${JSON.stringify({at:NOW, student:S.db, console:store})};
`;
  fs.writeFileSync(path.join(__dirname, '..', 'assets', 'demo-data.js'), out);
  console.log('wrote assets/demo-data.js', Math.round(out.length / 1024) + ' KB', Object.keys(store.items).length + ' console items', S.db.profiles[sam.id].entries.length + ' entries for Sam');
})();
