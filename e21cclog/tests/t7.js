// t7: the flow, voice and interface pass
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = (process.env.BASE || 'http://localhost:8123/e21cclog/') + 'index.html'; const SHOTS = require('./shots.js')('v2-');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
const VERBATIM = /real-life|teach\/explain/g;
// the school's own words (its statements, strand names and MOE's milestones) are quoted as written, hyphens and all
const STRIP = () => { let t = document.body.innerText.replace(/gemini[\w.-]*/gi, ''); const S = normaliseStatementSet(DEFAULT_STATEMENTS); const q = [...S.list.map(x => x.text), ...S.strands.map(x => x.name), ...S.strands.flatMap(x => [x.milestone.lower, x.milestone.upper])].filter(Boolean).sort((a, b) => b.length - a.length); for (const x of q) t = t.split(x).join(''); return t; };
const BANNED = ['whole trick', ' beats ', 'not a verdict', 'most people never', 'only a wish', 'a wish, not', 'doing a lot of work', 'competencies live', 'Base camp', 'Ridge view', 'On the climb', 'honest sentences', 'still warm', 'The circle', 'held against', 'Task talk', 'delve', 'tapestry', 'journey'];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({viewport:{width:390, height:844}, deviceScaleFactor:2});
  const page = await ctx.newPage(); const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  const go = async h => { await page.evaluate(x => location.hash = x, h); await sleep(350); };
  const prof = () => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); return d.profiles[d.current]; });
  const setProf = f => page.evaluate(f => { const d = JSON.parse(localStorage.getItem('e21cclog')); const p = d.profiles[d.current]; new Function('p', f)(p); localStorage.setItem('e21cclog', JSON.stringify(d)); }, f);

  // a new student with nothing set up
  await page.goto(BASE + '#/welcome'); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(400);
  await page.fill('[name=name]', 'Nur Aisyah'); await page.click('#newForm button[type=submit]'); await sleep(500);
  await page.click('text=Skip for now'); await sleep(300);
  await setProf("p.level = 2; p.experiences.cca = 'Football';"); await page.reload(); await sleep(300);
  const av = (await prof()).prefs.avatar;
  check('a new profile gets a drawn icon, not an emoji', /^[a-z]+$/.test(av) && !!(await page.$('.topbar .avatar svg')), av);

  // 1. a draft left by the earlier version: asked, never assumed
  await setProf("p.drafts = {grow:{kind:'grow', key:'grow', step:1, subject:'Mathematics', topic:'Simultaneous equations', answers:{g1:'I can solve them by elimination.'}}};");
  await page.reload(); await sleep(400); await go('#/write/grow');
  const card = await page.textContent('#sheet');
  check('an unfinished draft asks: continue or start new', card.includes('You have an unfinished GROW entry') && card.includes('Mathematics · Simultaneous equations') && !!(await page.$('#rContinue')) && !!(await page.$('#rNew')));
  check('the card does not invent a saved date for an old draft', !card.includes('Last saved'));
  await page.screenshot({path:SHOTS + '90-resume.png'});
  await page.click('#rNew'); await sleep(300);
  check('Start a new one: blank, nothing chosen', !(await page.$('.chip.on')) && !(await page.$('.tile.on')) && (await page.textContent('.sheet .bar b')) === 'New GROW entry' && !(await prof()).drafts.grow);
  await page.click('#cClose'); await sleep(300);
  await setProf("p.drafts = {grow:{kind:'grow', key:'grow', step:1, subject:'Mathematics', topic:'Simultaneous equations', answers:{g1:'I can solve them by elimination.'}}};");
  await page.reload(); await sleep(400); await go('#/write/grow'); await page.click('#rContinue'); await sleep(300);
  check('Continue it: the old draft comes back where it was', (await page.inputValue('[data-a=g1]')) === 'I can solve them by elimination.' && (await page.textContent('.sheet .bar b')).includes('Mathematics'));
  await page.click('#cBack'); await sleep(250);
  check('the old subject shows as chosen, in the subject panel', (await page.$$eval('.typepanel .chip.on', l => l.map(x => x.textContent.trim()))).join() === 'Mathematics');
  // Home from inside the editor keeps the draft
  await page.click('#cHome'); await sleep(400);
  check('Home in the editor goes home and keeps the draft', (await page.evaluate(() => location.hash)) === '#/' && !!(await prof()).drafts.grow && (await page.textContent('#toast')).includes('Draft saved'));
  check('the home page says a GROW entry is unfinished', (await page.textContent('.nextcard')).includes('Finish your GROW entry'));
  await setProf('p.drafts = {};'); await page.reload(); await sleep(300);

  // 2. a student with only a CCA: two taps to a subject, and it is remembered
  await go('#/write/grow');
  check('the usual row holds only the CCA; six type tiles', (await page.$$eval('.xchips .chip', l => l.map(x => x.textContent.trim()))).join() === 'Football CCA' && (await page.$$('.tile')).length === 6, JSON.stringify({chips:await page.$$eval('.xchips .chip', l => l.map(x => x.textContent.trim())), tiles:(await page.$$('.tile')).length, hash:await page.evaluate(() => location.hash), dlg:await page.evaluate(() => document.getElementById('dlg').open), sheet:(await page.textContent('#sheet')).slice(0, 120)}));
  await page.click('[data-ptype=subject]'); await sleep(200);
  const subjChips = await page.$$eval('.typepanel .chip', l => l.length);
  await page.click('.typepanel [data-exp="subject|Chemistry"]'); await sleep(200);
  check('Subject, then Chemistry: chosen in two taps', subjChips >= 18 && (await page.$$eval('.typepanel .chip.on', l => l.map(x => x.textContent.trim()))).join() === 'Chemistry' && (await page.textContent('.addhint')).includes('Chemistry will be added to your subjects'));
  await page.screenshot({path:SHOTS + '91-picker.png', fullPage:true});
  await page.click('#cNext'); await sleep(300);
  check('Chemistry is saved to the student’s subjects, with Undo offered', (await prof()).experiences.subjects.includes('Chemistry') && (await page.textContent('#toast')).includes('Undo'));
  await page.click('#toast button'); await sleep(200);
  check('Undo takes it off the list', !(await prof()).experiences.subjects.includes('Chemistry'));
  await page.click('#cBack'); await sleep(200); await page.click('#cNext'); await sleep(200);
  check('it is added again when the student moves on', (await prof()).experiences.subjects.includes('Chemistry'));
  // a typed experience of another type
  await page.click('#cBack'); await sleep(200); await page.click('[data-ptype=camp]'); await sleep(200);
  await page.fill('[name=ctxName]', 'Sec 2 camp'); await page.click('#cNext'); await sleep(300);
  check('a typed camp joins Other experiences', (await prof()).experiences.others.some(o => o.type === 'camp' && o.name === 'Sec 2 camp'));
  await page.click('#cHome'); await sleep(300); await setProf('p.drafts = {};'); await page.reload(); await sleep(300);

  // 3. Home on every page, and on every editor step
  const routes = ['#/', '#/journal/grow', '#/journal/act?v=shelf', '#/c/critical', '#/settings', '#/sharing', '#/setup'];
  let missing = [];
  for (const r of routes){ await go(r); const h = await page.$('a.tab[href="#/"]'); if (!h || !(await h.isVisible()) || !(await h.textContent()).includes('Home')) missing.push(r); }
  await go('#/write/act'); await page.click('[data-ptype=subject]'); await sleep(150); await page.click('.typepanel [data-exp="subject|History"]'); await sleep(150);
  for (let i = 0; i < 6; i++){ const h = await page.$('#cHome'); if (!h || !(await h.isVisible())) missing.push('act step ' + i); const n = await page.$('#cNext'); if (!n) break; await n.click(); await sleep(150); }
  check('Home is visible on every page and every editor step', !missing.length, missing.join(' '));
  await page.click('#cClose'); await sleep(300); await setProf('p.drafts = {};'); await page.reload(); await sleep(300);
  await go('#/write/grow'); check('no Back button on step 1', !(await page.$('#cBack'))); await page.click('#cClose'); await sleep(300);

  // 4. ACT feeds the wheel: one ACT entry with a verified quote fills its segment
  await go('#/write/act'); await page.click('.xchips [data-exp="subject|History"]'); await sleep(150); await page.fill('[name=topic]', 'Source analysis essay');
  await page.click('#cNext'); await sleep(200);
  await page.fill('[data-a=a1]', 'I felt annoyed at first, but I compared the two sources again and decided my teacher was right because the second source was biased.');
  await page.fill('[data-a=a2]', 'It helps me check the provenance of each source before I use it.');
  for (let i = 0; i < 2; i++){ await page.click('#cNext'); await sleep(150); }
  await page.fill('[data-a=t1]', 'Instead of quoting the first source I find, I will check who wrote it, on Thursday after school for 20 minutes.');
  await page.click('#cNext'); await sleep(150); await page.click('.claim .cpick'); await sleep(150); await page.click('#cNext'); await sleep(300);
  await page.click('#cSave'); await sleep(800);
  const ent = (await prof()).entries.find(e => e.kind === 'act');
  const ev = (ent.e21cc.evidence || []).find(v => v.id === 'critical');
  check('the ACT entry has verified Critical Thinking evidence', ev && !ev.unverified && ev.strength !== 'glimpse', JSON.stringify(ev));
  await go('#/');
  const seg = await page.$('a[href="#/c/critical"]'); const cls = await seg.getAttribute('class'); const lbl = await seg.getAttribute('aria-label');
  check('the wheel fills from an ACT entry, and says so', /lv1/.test(cls) && lbl.includes('1 ACT entry') && lbl.includes('Setting Sail'), cls + ' | ' + lbl);
  check('the ACT entry backs its statement', (ent.links || []).length === 1 && /^[a-z]{2}\d\.[lu]\d$/.test(ent.links[0].sid) && ent.links[0].quote.length > 20, JSON.stringify(ent.links));
  await go('#/c/critical');
  check('the competency page marks the entry as ACT', !!(await page.$('.evid .badge.b-act')) && (await page.textContent('main')).includes('From 1 ACT entry. GROW and ACT entries both count'));
  await page.screenshot({path:SHOTS + '92-competency-act.png', fullPage:true});

  // 5. voice: no dashes, no hyphens in running text, none of the old sayings
  const bad = [];
  for (const r of ['#/', '#/journal/grow', '#/journal/act', '#/c/critical', '#/c/inventive', '#/settings', '#/sharing', '#/setup', '#/entry/' + ent.id]){
    await go(r); const t = (await page.evaluate(STRIP)).replace(VERBATIM, '');
    if (/[–—]/.test(t)) bad.push(r + ' dash: ' + (t.match(/.{0,30}[–—].{0,30}/) || [''])[0]);
    const hy = t.match(/\w-\w/g); if (hy) bad.push(r + ' hyphen: ' + hy.slice(0, 3).join(' '));
    for (const b of BANNED) if (t.toLowerCase().includes(b.toLowerCase())) bad.push(r + ' says "' + b.trim() + '"');
  }
  for (const k of ['grow', 'act']){ await go('#/write/' + k); for (let i = 0; i < 8; i++){ const t = await page.evaluate(STRIP); if (/[–—]/.test(t) || /\w-\w/.test(t.replace(VERBATIM, ''))) bad.push(k + ' step ' + i + ': ' + ((t.match(/.{0,30}([–—]|\w-\w).{0,30}/) || [''])[0])); for (const b of BANNED) if (t.toLowerCase().includes(b.toLowerCase())) bad.push(k + ' step ' + i + ' says "' + b.trim() + '"'); if (i === 0){ const c = await page.$('.xchips .chip'); if (c) await c.click(); await sleep(100); } const n = await page.$('#cNext'); if (!n) break; await n.click(); await sleep(120); } await page.click('#cClose'); await sleep(200); }
  const src = ['assets/app.js', 'assets/core.js', 'teacher.html'].map(f => fs.readFileSync(require('path').join(__dirname, '..', f), 'utf8')).join('\n');
  for (const b of BANNED.filter(x => x !== 'journey')) if (src.toLowerCase().includes(b.toLowerCase())) bad.push('source says "' + b.trim() + '"');
  check('no dashes, hyphens or old sayings in what students read', !bad.length, bad.slice(0, 8).join(' | '));
  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
})();
