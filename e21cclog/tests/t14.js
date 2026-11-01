// t14: Beatty's own offering. The subjects follow the Sec level, in full names, with only the levels
// of demand each is offered at; CCAs and NEXUS@BTY modules come from the school's lists, alphabetically;
// older logs are renamed without losing an entry or a secured statement; an old group file still matches;
// the coach is told the right level; the console offers the same names.
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const BASE = process.env.BASE || 'http://localhost:8123/e21cclog/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/seed3.json'), 'utf8'));
const SCHOOL = JSON.parse(fs.readFileSync(path.join(__dirname, '../school/beatty.json'), 'utf8'));
(async () => {
  const browser = await chromium.launch(); const errors = [];
  const open = async (edit, vp = {width:1280, height:900}) => {
    const ctx = await browser.newContext({viewport:vp}); const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
    const s = JSON.parse(JSON.stringify(seed)); if (edit) edit(s.profiles[s.current], s);
    await p.goto(BASE + 'index.html'); await p.evaluate(x => { localStorage.clear(); localStorage.setItem('e21cclog', x); }, JSON.stringify(s)); await p.reload(); await sleep(700);
    return {ctx, p};
  };
  const go = async (p, h) => { await p.evaluate(x => location.hash = x, h); await sleep(450); };
  const texts = (p, sel) => p.$$eval(sel, l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  const sorted = a => a.slice().sort((x, y) => x.localeCompare(y, 'en', {sensitivity:'base'}));

  // 1. the copy inside the app is the school's file
  { const {ctx, p} = await open();
    const same = await p.evaluate(s => JSON.stringify(DEFAULT_SCHOOL) === JSON.stringify(s), SCHOOL);
    check('the offering inside core.js matches school/beatty.json', same);
    await ctx.close(); }

  // 2. Sec 1: the Lower Sec list
  { const {ctx, p} = await open(P => { P.level = 1; P.experiences.subjects = ['Geography', 'Art', 'Humanities Exposure Modules']; P.experiences.levels = {}; });
    await go(p, '#/settings?s=expCard');
    const chips = await p.$$eval('[data-subj]', l => l.map(x => x.dataset.subj));
    const groups = await texts(p, '#expCard .mini');
    check('Sec 1 sees the Lower Sec subjects, grouped, and none of the Upper Sec ones',
      chips.includes('Humanities Exposure Modules') && chips.includes('Food and Consumer Education') && chips.includes('Higher Malay Language')
      && !chips.includes('Additional Mathematics') && !chips.includes('Principles of Accounts') && !chips.some(c => c.startsWith('Humanities (')) && groups.slice(0, 6).join('|') === 'Languages|Mathematics|Sciences|Humanities|Common Curriculum|Others',
      groups.join('|'));
    const geo = await p.$$eval('[data-slv="Geography"] option', l => l.map(o => o.value).filter(Boolean));
    const slv = await texts(p, '.slv');
    check('Lower Sec Humanities at G2 or G3 only; Common Curriculum without a level; the exposure modules at G1',
      geo.join() === 'G2,G3' && !slv.some(t => t.startsWith('Art')) && slv.some(t => /Humanities Exposure Modules\s*G1 only/.test(t)), JSON.stringify({geo, slv}));
    const nx = await texts(p, '[data-nx]');
    check('Sec 1 sees only NX101', nx.join() === 'NX101 Critical Cornerstones: The Critical Inquiry Project', nx.join());
    await ctx.close(); }

  // 3. Sec 3: the Upper Sec list
  { const {ctx, p} = await open(P => { P.level = 3; P.experiences.subjects = ['Computing', 'Additional Mathematics', 'Social Studies']; P.experiences.levels = {}; });
    await go(p, '#/settings?s=expCard');
    const chips = await p.$$eval('[data-subj]', l => l.map(x => x.dataset.subj));
    check('Sec 3 sees both Humanities combinations, pure Geography and Literature in English, and no pure History or Social Studies with Literature',
      chips.includes('Humanities (Social Studies, Geography)') && chips.includes('Humanities (Social Studies, History)') && chips.includes('Geography') && chips.includes('Literature in English')
      && !chips.includes('History') && !chips.some(c => /Literature\)/.test(c)) && !chips.includes('Elements of Business Skills') && !chips.includes('Food and Consumer Education'), chips.join(', '));
    check('the sciences: pure Chemistry, Physics and Biology, both combined sciences, and Science at G1',
      ['Chemistry', 'Physics', 'Biology', 'Science (Chemistry, Physics)', 'Science (Chemistry, Biology)', 'Science'].every(c => chips.includes(c)));
    const comp = await p.$$eval('[data-slv="Computing"] option', l => l.map(o => o.textContent).filter(t => t !== 'Not set'));
    const slv = await texts(p, '.slv'); const music = await p.textContent('[data-subj="Music"]');
    check('Additional Mathematics G3 only; Computing at G1 here and G3 outside school; Music marked outside school; Social Studies G1',
      slv.some(t => /Additional Mathematics\s*G3 only/.test(t)) && comp.join('|') === 'G1|G3, outside school' && /outside school/.test(music) && slv.some(t => /Social Studies\s*G1 only/.test(t)), JSON.stringify({comp, slv}));
    const tiers = await texts(p, '#expCard .mini');
    const nx301 = SCHOOL.nexus.modules.filter(m => m.tier === 'NX301'); const shown = await texts(p, '[data-nx]');
    check('Sec 3 sees NX301 and NX302, each alphabetical by name', tiers.some(t => t.startsWith('NX301')) && tiers.some(t => t.startsWith('NX302')) && !shown.some(t => /^NX[12]01/.test(t))
      && shown.slice(0, nx301.length).join('|') === sorted(nx301.map(m => m.name)).map(n => nx301.find(m => m.name === n).code + ' ' + n).join('|'), shown.slice(0, 8).join(' | '));
    await ctx.close(); }

  // 4. CCAs from the school's list, groups and names alphabetical
  { const {ctx, p} = await open(P => { P.level = 2; });
    await go(p, '#/settings?s=expCard');
    const groups = await p.$$eval('#expCard .mini[id^=cg]', l => l.map(x => x.textContent));
    const byGroup = await p.$$eval('#expCard .mini[id^=cg]', l => l.map(h => [...h.nextElementSibling.querySelectorAll('[data-cca]')].map(b => b.dataset.cca)));
    const all = byGroup.flat();
    check('17 CCAs in four groups, groups and names alphabetical', all.length === 17 && groups.join() === sorted(groups).join() && byGroup.every(g => g.join() === sorted(g).join()) && groups.join('|') === 'Clubs|Performing Arts|Sports|Uniformed Groups', JSON.stringify(byGroup));
    await p.click('[data-cca="Choir"]'); await sleep(250);
    check('a CCA tapped joins the student’s CCAs', (await p.evaluate(() => me.experiences.cca)) === 'Football, Choir');
    await ctx.close(); }

  // 5. an older log: names in full, NEXUS as its own kind, nothing lost
  { const raw = JSON.parse(JSON.stringify(seed)); const P = raw.profiles[raw.current];
    P.experiences.subjects = ['English', 'Literature', 'PE', 'NEXUS', 'Mathematics']; P.experiences.levels = {English:'G2'};
    P.entries.push(Object.assign(JSON.parse(JSON.stringify(P.entries[0])), {id:'nx1', context:{type:'subject', name:'NEXUS'}, subject:'NEXUS', links:[]}));
    const {ctx, p} = await open(Q => { Object.assign(Q, P); });
    const r = await p.evaluate(raw => {
      const before = raw.profiles[raw.current].entries; const secured = es => (STMT_SET.list || []).filter(s => securedOf(es, s).state === 'secured').length;
      return {subjects:me.experiences.subjects, levels:me.experiences.levels, others:me.experiences.others, n:me.entries.length, nBefore:before.length,
        links:me.entries.reduce((a, e) => a + e.links.length, 0), linksBefore:before.reduce((a, e) => a + (e.links || []).length, 0),
        secured:secured(me.entries), securedBefore:secured(JSON.parse(JSON.stringify(before))), ctx:me.entries.map(e => e.context.type + ':' + e.context.name)};
    }, raw);
    check('old subject names become full names, and their levels follow', r.subjects.join() === 'English Language,Literature in English,Physical Education,Mathematics' && r.levels['English Language'] === 'G2' && !r.levels.English, JSON.stringify(r.subjects) + JSON.stringify(r.levels));
    check('NEXUS moves to its own kind, in experiences and entries', r.others.some(o => o.type === 'nexus') && r.ctx.includes('nexus:NEXUS@BTY') && r.ctx.includes('subject:English Language') && !r.ctx.includes('subject:English'), r.ctx.join(', '));
    check('no entry, link or secured statement is lost', r.n === r.nBefore && r.links === r.linksBefore && r.secured === r.securedBefore && r.secured > 0, JSON.stringify({n:r.n, links:r.links, secured:r.secured, securedBefore:r.securedBefore}));
    const again = await p.evaluate(() => { const d = migrateDb(JSON.parse(JSON.stringify(db))); return JSON.stringify(d.profiles[d.current].experiences) === JSON.stringify(me.experiences); });
    check('renaming again changes nothing', again);
    // a teacher's group file written with the old name still matches the full name
    const g = await p.evaluate(() => { me.groups.push({code:'OLDENG', type:'subject'}); db.groups.OLDENG = {code:'OLDENG', type:'subject', subject:'English', subjects:['English']}; draft = {context:{type:'subject', name:'English Language'}, groupCode:''}; matchGroup(); const c = draft.groupCode; draft = null; return c; });
    check('an old group file (subject "English") still matches English Language', g === 'OLDENG', g);
    await ctx.close(); }

  // 6. the coach is told the right level of demand
  { const {ctx, p} = await open(P => { P.level = 3; P.experiences.levels = {Geography:'G1'}; });
    const r = await p.evaluate(() => { const lp = n => learnerProfile(me, STMT_SET, me.entries, {id:'x', created:Date.now(), context:{type:'subject', name:n}}).subjectLevel; return {am:lp('Additional Mathematics'), ss:lp('Social Studies'), geo:lp('Geography'), en:lp('English Language')}; });
    check('one level offered is that level; a level not offered is ignored; Social Studies at G1 is marked not examined', r.am === 'G3' && r.ss === 'G1, not examined' && r.geo === 'G3' && r.en === '', JSON.stringify(r));
    await ctx.close(); }

  // 7. the gate before a first entry: level first, then that level's subjects; the school's CCAs
  { const {ctx, p} = await open(P => { P.level = null; P.experiences = {subjects:[], cca:'', others:[], levels:{}}; });
    await go(p, '#/write/grow'); await sleep(300);
    const before = await p.textContent('#gateSubj');
    await p.click('#dlg [data-lv="1"]'); await sleep(250);
    const chips = await p.$$eval('#dlg [data-gsubj]', l => l.map(x => x.dataset.gsubj));
    const opts = await p.$$eval('#gateCca optgroup', l => l.map(g => g.label + ':' + g.children.length));
    check('the gate asks for the level first, then shows Sec 1 subjects and the school’s CCAs', /Sec level first/.test(before) && chips.includes('Humanities Exposure Modules') && !chips.includes('Additional Mathematics') && opts.join() === 'Clubs:1,Performing Arts:6,Sports:5,Uniformed Groups:5', JSON.stringify({before:before.slice(0, 60), opts}));
    await p.selectOption('#gateCca', 'Canoeing'); await sleep(150);
    check('choosing a CCA in the gate opens the way to the entry', (await p.evaluate(() => me.experiences.cca)) === 'Canoeing' && !(await p.$eval('#gateGo', b => b.disabled)));
    await ctx.close(); }

  // 8. the composer: NEXUS@BTY as a kind, with this level's modules; it joins the student's experiences
  { const {ctx, p} = await open(P => { P.level = 3; P.drafts = {}; });
    await go(p, '#/write/grow'); await p.click('[data-ptype=nexus]'); await sleep(250);
    const heads = await texts(p, '.typepanel .mini');
    await p.click('.typepanel [data-exp="nexus|NX3016 Saue High School, Estonia: BTY e-Exchange"]'); await sleep(150); await p.click('#cNext'); await sleep(300);
    const o = await p.evaluate(() => me.experiences.others);
    check('the composer offers this level’s NEXUS@BTY modules, and a module chosen joins the student’s experiences', heads.some(h => h.startsWith('NX301')) && heads.some(h => h.startsWith('NX302')) && o.some(x => x.type === 'nexus' && x.name.startsWith('NX3016')), heads.join(' | '));
    await p.click('#cBack'); await sleep(200); await p.click('[data-ptype=subject]'); await sleep(200);
    const sh = await texts(p, '.typepanel .mini');
    check('the composer’s subjects are grouped as in Settings', sh.slice(0, 6).join('|') === 'Languages|Mathematics|Sciences|Humanities|Electives|Others', sh.join('|'));
    await ctx.close(); }

  // 9. the console offers the same names for a group
  { const ctx = await browser.newContext({viewport:{width:1280, height:800}}); const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message)); await p.goto(BASE + 'teacher.html'); await sleep(600);
    const list = await p.$$eval('#subjList option', l => l.map(o => o.value));
    check('the console’s group form offers the school’s subjects, CCAs and NEXUS@BTY modules', list.includes('Humanities (Social Studies, History)') && list.includes('Choir') && list.includes('NX3023 A*STAR') && !list.includes('English'), list.length + '');
    await ctx.close(); }

  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
})();
