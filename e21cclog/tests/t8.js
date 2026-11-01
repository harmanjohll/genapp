// t8: layouts that fit the device
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = (process.env.BASE || 'http://localhost:8123/e21cclog/') + 'index.html'; const SHOTS = require('./shots.js')('v2-');
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const check = (name, ok, info = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); };
// the seed log, plus a second GROW entry so the reader has somewhere to move
const seed = JSON.parse(fs.readFileSync(__dirname + '/fixtures/seed.json', 'utf8')); const P = seed.profiles[seed.current];
const g1 = P.entries.find(e => e.kind === 'grow'); const a1 = P.entries.find(e => e.kind === 'act');
const g2 = JSON.parse(JSON.stringify(g1)); g2.id = 'g2test'; g2.created = g1.created - 3 * 864e5; g2.context = {type:'subject', name:'English'}; g2.subject = 'English'; g2.topic = 'Persuasive essay'; g2.links = []; g2.notes = []; g2.sent = {};
P.entries.push(g2); P.drafts = {}; P.level = P.level || 2; P.experiences = P.experiences || {subjects:[], cca:'', others:[]}; if (!P.experiences.subjects.length && !P.experiences.cca) P.experiences.cca = 'Football';
const SEED = JSON.stringify(seed);
(async () => {
  const browser = await require('./fixtures/launch.js')();
  const ctx = await browser.newContext({viewport:{width:390, height:844}});
  const page = await ctx.newPage(); const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  const go = async h => { await page.evaluate(x => location.hash = x, h); await sleep(400); };
  await page.goto(BASE + '#/'); await page.evaluate(s => localStorage.setItem('e21cclog', s), SEED); await page.reload(); await sleep(500); await go('#/');

  // phone
  const bar = await page.evaluate(() => { const t = document.querySelector('.tabs'); const r = t.getBoundingClientRect(); return {pos:getComputedStyle(t).position, bottom:Math.round(r.bottom), h:Math.round(r.height), vh:innerHeight}; });
  check('phone: the tabs sit fixed at the bottom', bar.pos === 'fixed' && bar.bottom === bar.vh && bar.h >= 60, JSON.stringify(bar));
  const acts = await page.evaluate(() => { const a = document.querySelector('.acts').getBoundingClientRect(); const t = document.querySelector('.tabs').getBoundingClientRect(); return {bottom:Math.round(a.bottom), barTop:Math.round(t.top)}; });
  check('phone: New GROW and New ACT show in the first screen', acts.bottom <= acts.barTop, JSON.stringify(acts));
  await page.screenshot({path:SHOTS + '93-phone-home.png'});
  await go('#/settings'); await page.focus('#sName'); await sleep(150);
  check('phone: the tab bar hides while typing', await page.evaluate(() => getComputedStyle(document.querySelector('.tabs')).display === 'none'));
  await page.evaluate(() => document.activeElement.blur()); await sleep(150);
  check('phone: and comes back after', await page.evaluate(() => getComputedStyle(document.querySelector('.tabs')).display !== 'none'));
  await go('#/write/grow');
  check('phone: no tab bar while writing, no guide', await page.evaluate(() => { const t = document.querySelector('.tabs'); return !t || !t.offsetParent; }) && !(await page.isVisible('.guide')));
  await page.click('#cClose'); await sleep(300);
  await go('#/journal/grow');
  check('phone: journal keeps the bookmark row, rows open the entry page', !!(await page.$('.bookmarks')) && !(await page.$('.jindex')) && (await page.getAttribute('.entry', 'href')).startsWith('#/entry/'));

  // laptop
  await page.setViewportSize({width:1280, height:800}); await sleep(400);
  check('resizing to a laptop re-renders the journal as a spread', !!(await page.$('.page.spread .jindex')) && !(await page.$('.bookmarks')));
  check('laptop: the places sit in a sidebar, with New GROW and New ACT', await page.evaluate(() => { const t = document.querySelector('.tabs').getBoundingClientRect(), m = document.querySelector('#main').getBoundingClientRect(); return getComputedStyle(document.querySelector('.tabs')).position !== 'fixed' && t.right <= m.left + 1 && !!document.querySelector('.navnew .btn').offsetParent; }));
  await go('#/');
  const homeL = await page.evaluate(() => { const a = document.querySelector('.wheelcard').getBoundingClientRect(), b = document.querySelector('.nextcard').getBoundingClientRect(); return {stacked:b.top >= a.bottom - 1 && Math.abs(a.width - b.width) < 2, wheel:!!document.querySelector('.wheelcard .wheel'), next:document.querySelectorAll('.nextcard .nxpart').length}; });
  check('laptop (v3): Home is Where am I now? across the page, with What next? below', homeL.stacked && homeL.wheel && homeL.next === 2, JSON.stringify(homeL));
  await go('#/journal/grow?p=experience&v=bookmarks');
  check('laptop: the reader opens the latest entry', (await page.textContent('.leaf.r .etitle')).includes('Titration'));
  await page.click(`.rrow[href*="e=g2test"]`); await sleep(400);
  check('laptop: clicking a row shows it on the right, the URL carries it', (await page.textContent('.leaf.r .etitle')).includes('Persuasive essay') && (await page.evaluate(() => location.hash)).includes('e=g2test') && (await page.$$('.rrow.on')).length === 1);
  await page.screenshot({path:SHOTS + '94-laptop-reader.png'});
  await page.goBack(); await sleep(400);
  check('laptop: Back returns to the previous entry', (await page.textContent('.leaf.r .etitle')).includes('Titration'));
  await page.click('.ji:has-text("English")'); await sleep(400);
  check('laptop: a bookmark narrows the list and opens its entry', (await page.$$('.rrow')).length === 1 && (await page.textContent('.leaf.r .etitle')).includes('Persuasive'));
  await go('#/entry/' + g1.id + '?new=1');
  const h = await page.evaluate(() => location.hash);
  check('laptop: an entry link opens in the journal reader, with the Logged banner', h.startsWith('#/journal/grow?e=' + g1.id) && h.includes('new=1') && (await page.textContent('.leaf.r')).includes('Logged.'), h);
  // the editor
  await go('#/write/grow');
  check('laptop: the editor shows the guide', await page.isVisible('.guide') && (await page.$$('.gsteps button')).length === 7);
  check('laptop: steps are locked until a subject is chosen', await page.$eval('.gsteps button[data-jump="3"]', b => b.disabled));
  await page.click('.xchips .chip'); await sleep(200);
  await page.click('.gsteps button[data-jump="3"]'); await sleep(300);
  check('laptop: jumping to a step works', (await page.textContent('.stephead h1')).includes('Own your knowledge') && await page.$eval('.gsteps button[data-jump="3"]', b => b.classList.contains('on')));
  await page.screenshot({path:SHOTS + '95-laptop-editor.png'});
  await page.click('#cClose'); await sleep(300);
  await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('e21cclog')); d.profiles[d.current].drafts = {}; localStorage.setItem('e21cclog', JSON.stringify(d)); });
  // settings
  await go('#/settings');
  const vis = async () => page.$$eval('.leaf.r > section[id]', l => l.filter(x => !x.hidden).map(x => x.id));
  check('laptop: settings shows the index and one section', (await vis()).join() === 'me' && await page.isVisible('.snav'));
  await page.click('.snav a[href="#/settings?s=look"]'); await sleep(300);
  check('laptop: choosing Look shows Look', (await vis()).join() === 'look');
  await page.screenshot({path:SHOTS + '96-laptop-settings.png'});

  // no sideways scroll anywhere, on ten devices
  const routes = ['#/', '#/journal/grow', '#/journal/act?v=shelf', '#/c/critical', '#/settings', '#/sharing', '#/setup', '#/entry/' + a1.id, '#/write/act'];
  const sizes = [[320, 568], [390, 844], [412, 915], [844, 390], [768, 1024], [834, 1194], [1024, 768], [1280, 800], [1440, 900], [1920, 1080]];
  const over = [];
  for (const [w, hh] of sizes){ await page.setViewportSize({width:w, height:hh}); await sleep(250);
    for (const r of routes){ await go(r); const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 1) over.push(`${w}x${hh} ${r} +${o}`); if (r.startsWith('#/write')){ const c = await page.$('#cClose'); if (c){ await c.click(); await sleep(200); } } } }
  check('no sideways scroll on ten devices', !over.length, over.slice(0, 6).join(' | '));
  console.log('ERRORS', errors.length ? errors : 'none');
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  await browser.close();
})();
