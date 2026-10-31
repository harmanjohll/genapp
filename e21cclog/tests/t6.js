const { chromium } = require('playwright');
const BASE = (process.env.BASE || 'http://localhost:8123/e21cclog/') + 'index.html'; const SHOTS = require('./shots.js')('v2-');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const check = (name, ok, info='') => console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : ''));
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({viewport:{width:390, height:844}, deviceScaleFactor:2});
  const page = await ctx.newPage(); const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.stack.split('\n').slice(0,3).join(' / ')));
  // Gemini, intercepted: a models list, and a read that quotes the first answer verbatim plus one invented quote
  const calls = []; let failSchemaOnce = false;
  await page.route('https://generativelanguage.googleapis.com/**', async route => {
    const req = route.request(); const url = req.url();
    if (url.includes('/models?')) return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({models:[
      {name:'models/gemini-2.5-flash', supportedGenerationMethods:['generateContent']}, {name:'models/gemini-3.5-flash', supportedGenerationMethods:['generateContent','countTokens']},
      {name:'models/gemini-3.5-flash-lite', supportedGenerationMethods:['generateContent']}, {name:'models/gemini-embedding-001', supportedGenerationMethods:['embedContent']}, {name:'models/gemini-3.1-pro-preview', supportedGenerationMethods:['generateContent']}]})});
    const body = JSON.parse(req.postData() || '{}'); calls.push({url, key:req.headers()['x-goog-api-key'], body});
    if (failSchemaOnce && body.generationConfig.responseJsonSchema){ failSchemaOnce = false; return route.fulfill({status:400, contentType:'application/json', body:JSON.stringify({error:{code:400, message:'Invalid JSON payload received. Unknown name "responseJsonSchema"'}})}); }
    const text = body.contents[0].parts[0].text; const m = text.match(/\n(?:G|A|L): [^\n]+\n([^\n]+)/); const first = m ? m[1].split(/(?<=[.!?])\s/)[0].replace(/[.!?]$/, '') : '';
    const out = {gift:'You named the exact check you made.', stretch:'Say what made you doubt the first reading; that is where critical thinking shows.', question:'Which reading would you trust, and why?', competency:'Critical thinking shows in how you checked.', depth:'working',
      e21cc:{stance:'competency', stance_note:'You wrote about how you worked.', evidence:[{id:'critical', strength:'strong', quote:first, why:'You weighed two readings before deciding.'},{id:'inventive', strength:'clear', quote:'an invented sentence never written', why:'x'}], suggested:[], tagged_not_shown:[], probe:'What made you doubt it?', probe_for:'critical', statements:[{sid:'ct1.l1', quote:first, why:'You weighed evidence.'}]}};
    return route.fulfill({status:200, contentType:'application/json', body:JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(out)}], role:'model'}, finishReason:'STOP'}]})});
  });
  await page.goto(BASE + '#/welcome'); await page.evaluate(() => localStorage.clear()); await page.reload(); await sleep(400);
  await page.screenshot({path:SHOTS + '70-welcome.png', fullPage:true});
  await page.fill('[name=name]', 'Wei Ling Tan'); await page.click('#newForm button[type=submit]'); await sleep(600);
  check('new profile lands on setup', (await page.evaluate(() => location.hash)) === '#/setup');
  for (const s of ['Chemistry', 'English', 'History']) await page.click(`[data-subj="${s}"]`);
  await page.fill('#ccaIn', 'Football'); await page.fill('#addOther [name=n]', 'Sec 2 camp'); await page.selectOption('#addOther [name=t]', 'camp'); await page.click('#addOther button'); await sleep(300);
  await page.click('[data-lv="2"]'); await page.click('[data-col=teal]'); await page.click('[data-av=owl]');
  await page.screenshot({path:SHOTS + '71-setup.png', fullPage:true});
  await page.click('text=Open my log'); await sleep(500);
  const prof = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); return d.profiles[d.current]; });
  check('setup saved subjects, CCA, camp, cover', prof.experiences.subjects.join() === 'Chemistry,English,History' && prof.experiences.cca === 'Football' && prof.experiences.others[0].name === 'Sec 2 camp' && prof.prefs.colour === 'teal', JSON.stringify(prof.experiences));
  check('no group, no preset subject', prof.groups.length === 0);
  await page.screenshot({path:SHOTS + '72-home-empty.png', fullPage:true});
  // journal bookmarks: CCA first, then subjects, then camp, all empty
  await page.evaluate(() => location.hash = '#/journal/grow'); await sleep(400);
  const marks = await page.$$eval('.bm', l => l.map(x => x.textContent.trim().replace(/\s+/g, ' ')));
  check('bookmarks: All, CCA, subjects, camp', marks.join('|') === 'All 0|Football 0|Chemistry 0|English 0|History 0|Sec 2 camp 0', marks.join('|'));
  // Gemini settings
  await page.evaluate(() => location.hash = '#/settings'); await sleep(400);
  await page.click('#coachMode input[value=gemini]'); await page.fill('#sGKey', 'TESTKEY123'); await page.click('#sGLoad'); await sleep(500);
  const opts = await page.$$eval('#sGModel option', l => l.map(o => o.value + (o.selected ? '*' : '')));
  check('models listed, Flash suggested, embeddings left out', opts.includes('gemini-3.5-flash*') && !opts.some(o => o.includes('embedding')), opts.join(' '));
  await page.click('[data-tone=direct]');
  await page.screenshot({path:SHOTS + '73-settings-gemini.png', fullPage:false});
  // composer from the Chemistry bookmark: Chemistry preselected
  await page.evaluate(() => location.hash = '#/journal/grow?g=x%3Achemistry'); await sleep(300);
  await page.click('.gpanel a.btn'); await sleep(300);
  check('bookmark start preselects that experience', (await page.$$eval('.xchips .chip.on', l => l.map(x => x.textContent.trim()))).join() === 'Chemistry');
  await page.click('#cClose'); await sleep(200);
  await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); const p = d.profiles[d.current]; p.drafts = {}; localStorage.setItem('e21cclog', JSON.stringify(d)); }); await page.reload(); await sleep(400);
  // plain new entry: nothing preselected, Next blocked
  await page.evaluate(() => location.hash = '#/write/grow'); await sleep(300);
  const pre = await page.$$eval('.xchips .chip.on', l => l.length); const order = await page.$$eval('.xchips .chip', l => l.map(x => x.textContent.trim()));
  check('nothing preselected; CCA chips first', pre === 0 && order[0].startsWith('Football'), order.join(','));
  await page.screenshot({path:SHOTS + '74-composer-context.png', fullPage:true});
  await page.click('#cNext'); await sleep(200);
  check('Next blocked until a choice', (await page.$eval('.stephead h1', k => k.textContent)).includes('What is this entry about') && /choose/i.test(await page.textContent('#toast')));
  await page.click('[data-exp="subject|Chemistry"]'); await page.fill('[name=topic]', 'Titration'); await page.click('#cNext'); await sleep(200);
  await page.fill('[data-a=g1]', 'I checked both readings because the first titre was too high, so I decided to repeat it. The second matched.');
  await page.click('#cNext'); await sleep(150); await page.fill('[data-a=r2]', 'Redo Q3 on Tuesday after CCA for 20 minutes.');
  for (let i = 0; i < 3; i++){ await page.click('#cNext'); await sleep(150); }
  await page.click('.claim .cpick'); await sleep(150); await page.click('#cNext'); await sleep(300);
  await page.click('#cSave'); await sleep(1200);
  check('one Gemini call, key in header', calls.length === 1 && calls[0].key === 'TESTKEY123' && calls[0].url.includes('/models/gemini-3.5-flash:generateContent'), calls.length + ' ' + (calls[0] || {}).url);
  const b = calls[0].body;
  check('schema sent without additionalProperties; tone and E21CC anchor in the prompt', !!b.generationConfig.responseJsonSchema && !JSON.stringify(b.generationConfig.responseJsonSchema).includes('additionalProperties') && b.systemInstruction.parts[0].text.includes('Tone: direct') && b.systemInstruction.parts[0].text.includes('Anchor every part') && b.contents[0].parts[0].text.includes('Context: Subject, Chemistry'));
  const ent = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); return d.profiles[d.current].entries[0]; });
  check('Gemini read stored, invented quote demoted, statement match kept', ent.coach.ai && ent.coach.ai.model === 'gemini:gemini-3.5-flash' && ent.e21cc.evidence.find(v => v.id === 'inventive').unverified && ent.e21cc.statements[0].sid === 'ct1.l1' && ent.links.length === 1 && ent.competencies.length === 1, JSON.stringify(ent.links));
  check('entry page leads with E21CC feedback from the Gemini coach', (await page.textContent('#e21cc')).includes('E21CC feedback') && (await page.textContent('#e21cc')).includes('Gemini coach'));
  await page.screenshot({path:SHOTS + '75-entry-gemini.png', fullPage:true});
  // unchanged edit: no second call
  await page.click('a.btn:has-text("Edit")'); await sleep(300); for (let i = 0; i < 7; i++){ const n = await page.$('#cNext'); if (!n) break; await n.click(); await sleep(120); } await page.click('#cSave'); await sleep(800);
  check('unchanged edit makes no second call', calls.length === 1, 'calls ' + calls.length);
  // schema fallback: a model that rejects responseJsonSchema
  failSchemaOnce = true;
  await page.evaluate(() => location.hash = '#/write/act'); await sleep(300); await page.click('[data-exp="cca|Football"]'); await page.click('#cNext'); await sleep(150);
  await page.fill('[data-a=a1]', 'I felt annoyed but the coach was right that I drifted from my position.');
  for (let i = 0; i < 6; i++){ const n = await page.$('#cNext'); if (!n) break; await n.click(); await sleep(120); } await page.click('#cSave'); await sleep(1200);
  check('falls back when a model rejects the schema', calls.length === 3 && !calls[2].body.generationConfig.responseJsonSchema && calls[2].body.systemInstruction.parts[0].text.includes('Reply with only one JSON object'), 'calls ' + calls.length);
  // pivots and views
  for (const [p, want] of [['competency', 'Critical Thinking'], ['date', ''], ['term', 'Term 4']]){
    await page.evaluate(x => location.hash = '#/journal/grow?p=' + x, p); await sleep(300);
    const t = await page.$$eval('.bm', l => l.map(x => x.textContent.trim()).join('|'));
    check(`pivot ${p}`, want ? t.includes(want) : t.split('|').length >= 2, t.slice(0, 80));
  }
  await page.evaluate(() => location.hash = '#/journal/grow?p=experience&v=shelf'); await sleep(300);
  check('shelf view lists notebooks', await page.$$eval('.shelf .nb', l => l.length) === 5);
  await page.screenshot({path:SHOTS + '76-shelf.png', fullPage:true});
  await page.reload(); await sleep(400); await page.evaluate(() => location.hash = '#/journal/act'); await sleep(300);
  check('journal remembers pivot and view', !!(await page.$('.shelf')));
  // wheel and personalisation
  await page.evaluate(() => location.hash = '#/'); await sleep(400);
  check('wheel shows Critical Thinking at Emerging', !!(await page.$('a[href="#/c/critical"].lv1')));
  check('cover and icon persist', (await page.evaluate(() => document.body.dataset.colour)) === 'teal' && (await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); return d.profiles[d.current].prefs.avatar; })) === 'owl' && !!(await page.$('.topbar .avatar svg')));
  await page.screenshot({path:SHOTS + '77-home-filled.png', fullPage:true});
  await page.click('a[href="#/c/critical"]'); await sleep(300);
  check('competency page lists its two ladders and entries', await page.$$eval('.ladder .st', l => l.length) === 10 && (await page.textContent('main')).includes('Titration'));
  await page.screenshot({path:SHOTS + '78-competency.png', fullPage:true});
  // device matrix
  let worst = [];
  for (const [w, h] of [[320, 568], [360, 780], [412, 915], [1280, 900]]){ await page.setViewportSize({width:w, height:h});
    for (const r of ['#/', '#/journal/grow', '#/journal/act?v=bookmarks', '#/c/critical', '#/settings', '#/write/grow', '#/entry/' + ent.id]){ await page.evaluate(x => location.hash = x, r); await sleep(200); const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ov > 1) worst.push(w + r + ':' + ov); }
    if (w === 320) { await page.evaluate(() => location.hash = '#/'); await sleep(200); await page.screenshot({path:SHOTS + '79-home-320.png', fullPage:false}); }
    if (w === 1280) { await page.evaluate(() => location.hash = '#/'); await sleep(200); await page.screenshot({path:SHOTS + '80-home-1280.png', fullPage:false}); }
  }
  check('no sideways scroll at 320, 360, 412, 1280', !worst.length, worst.join(' '));
  console.log('ERRORS', errors.length ? errors : 'none');
  await browser.close();
})();
