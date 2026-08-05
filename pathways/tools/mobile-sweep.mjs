import { chromium } from 'playwright-core';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, normalize } from 'path';
const ROOT='/home/user/genapp';
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
 const f=join(ROOT,normalize(p).replace(/^(\.\.[/\\])+/,''));const b=await readFile(f);
 res.writeHead(200,{'Content-Type':TYPES[extname(f)]||'application/octet-stream'});res.end(b);}catch(e){res.writeHead(404);res.end('nf');}});
await new Promise(r=>server.listen(0,r));const port=server.address().port;
// Seed the version the app actually ships. Hardcoding it means the changelog
// sheet opens over the first screen on the next release and swallows every
// click after it, so the sweep fails on the release rather than on a layout.
const VERSION=JSON.parse(await readFile(join(ROOT,'pathways/data/version.json'),'utf8')).version;
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const bad=[];
const W=Number(process.argv[2]||390);
const page=await browser.newPage({viewport:{width:W,height:844}});
const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
const tab=async(re)=>{for(const b of await page.$$('button')){const t=((await b.innerText().catch(()=>''))||'').trim();if(re.test(t))return b;}return null;};

const check=async(label)=>{
  const r=await page.evaluate(()=>{
    const cw=document.documentElement.clientWidth;
    const out={scroll:document.documentElement.scrollWidth>cw+1, wide:[], clipped:[], tiny:[]};
    document.querySelectorAll('body *').forEach(el=>{
      const b=el.getBoundingClientRect(); if(!b.width||!b.height) return;
      const cs=getComputedStyle(el);
      if(cs.position==='fixed') return;
      // does it stick out, with no scroller to excuse it?
      if(b.right>cw+1||b.left<-1){
        let p=el,esc=false;
        while(p){const pc=getComputedStyle(p); if(pc.overflowX==='auto'||pc.overflowX==='scroll'){esc=true;break;} p=p.parentElement;}
        if(!esc) out.wide.push((el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\s+/)[0]:el.tagName));
      }
      // text visually cut off by a fixed height
      // sr-only text is clipped on purpose, and a form field scrolling its own
      // long value is a field doing its job, not a broken layout
      const skipClip = el.classList.contains('sr-only') || ['INPUT','TEXTAREA','SELECT'].includes(el.tagName);
      if(!skipClip && el.children.length===0 && el.scrollWidth>el.clientWidth+2 && cs.overflow!=='visible' && cs.overflowX!=='auto' && cs.overflowX!=='scroll')
        out.clipped.push((el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\s+/)[0]:el.tagName));
      if((el.tagName==='BUTTON'&&!el.disabled) && b.height<40 && !el.closest('p,li'))
        out.tiny.push((el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\s+/)[0]:el.tagName)+`:${Math.round(b.height)}`);
    });
    out.wide=[...new Set(out.wide)].slice(0,3); out.clipped=[...new Set(out.clipped)].slice(0,3); out.tiny=[...new Set(out.tiny)].slice(0,3);
    return out;
  });
  const ok=!r.scroll&&!r.wide.length&&!r.clipped.length&&!r.tiny.length;
  if(!ok) bad.push(`${label}: ${r.scroll?'PAGE-SCROLLS ':''}${r.wide.length?'wide['+r.wide+'] ':''}${r.clipped.length?'clipped['+r.clipped+'] ':''}${r.tiny.length?'tiny['+r.tiny+']':''}`);
  console.log(`${ok?'ok  ':'BAD '} ${label}`);
};
const seed=async(s)=>{await page.evaluate((x)=>localStorage.setItem('pathways.state.v1',JSON.stringify(x)),s);};

const PLAN={el:'G2',maths:'G3',sci_pc:'G3',hum_ss_hist:'G2',art:'G2'};
await page.goto(`http://127.0.0.1:${port}/pathways/index.html`,{waitUntil:'domcontentloaded'});
await seed({mode:'now',year:'sec3',plan:PLAN,seenVersion:VERSION});
await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(700);
await check('NOW landing');
// sheets from Now
const gl=await tab(/^Words$/); if(gl){ await gl.click(); await page.waitForTimeout(500); await check('sheet: glossary'); await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
const row=await page.$('.srow-name, .srows button'); if(row){ await row.click(); await page.waitForTimeout(500); await check('sheet: subject detail'); await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
const sh=await tab(/carry this to another device/i); if(sh){ await sh.click(); await page.waitForTimeout(500); await check('sheet: share + class code'); await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
// what else you carry: the panel filled, and the picker behind it
const actBtn=await tab(/add what you do|change these/i);
if(actBtn){ await actBtn.click(); await page.waitForTimeout(500); await check('sheet: what else you carry');
  // the sheet repaints on every toggle, so a held handle goes stale
  for(const want of [/^A sport CCA$/,/people at home$/,/outside school$/]){
    for(const b of await page.$$('dialog[open] .actrow')){
      if(want.test(((await b.innerText().catch(()=>''))||'').trim())){ await b.click(); await page.waitForTimeout(180); break; }
    }
  }
  await check('sheet: activities picked');
  const dn=await tab(/^Done/i); if(dn){ await dn.click(); await page.waitForTimeout(600); }
  await check('NOW with a full week'); }
// journey
await (await tab(/^Journey$/)).click(); await page.waitForTimeout(600); await check('JOURNEY intro');
const pick=await tab(/pick your subjects|change subjects/i); if(pick){ await pick.click(); await page.waitForTimeout(600); await check('sheet: subject picker'); await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
await (await page.$$('.future-btn'))[0].click(); await page.waitForTimeout(600);
await check('sheet: how it works and how far');
for(const b of await page.$$('dialog[open] button')){const t=((await b.innerText().catch(()=>''))||'').trim();
  if(/whole thing/i.test(t)){ await b.click(); break; }}
await page.waitForTimeout(600); await check('JOURNEY turn');
const ac=await page.$('.askcard'); if(ac){ await ac.click(); await page.waitForTimeout(400); }
const ch=await page.$('.choice'); if(ch){ await ch.click(); await page.waitForTimeout(400); }
await check('JOURNEY turn, year staged');
// walk far enough to hit a chance card, a fork, the reflect stage and the ending
let sawChance=false, sawFork=false, sawReflect=false, sawEnd=false;
for(let i=0;i<90;i++){
  if(await page.$('.chance') && !sawChance){ sawChance=true; await check('JOURNEY chance card'); }
  if(await page.$('.fork') && !sawFork){ sawFork=true; await check('JOURNEY fork'); }
  if(await page.$('.reflect') && !sawReflect){ sawReflect=true; await check('JOURNEY reflect at 38'); }
  const t=await page.innerText('#app').catch(()=>'');
  if(/play it again/i.test(t) && !sawEnd){ sawEnd=true; await check('JOURNEY ending'); break; }
  const a=await page.$('.askcard:not([disabled])'); if(a) await a.click().catch(()=>{});
  const cs=await page.$$('.choice:not(.on):not([data-dim])'); if(cs.length) await cs[0].click().catch(()=>{});
  await page.waitForTimeout(130);
  const adv=await tab(/^Live this year$|^Keep going$|^Continue$/i) || await page.$('.fork-c') || await tab(/^Still true$|^Keep it to yourself$/i);
  if(adv) await adv.click().catch(()=>{});
  await page.waitForTimeout(200);
}
if(!sawChance) console.log('..  no chance card in this run');
if(!sawEnd) console.log('..  ending not reached');
// compare needs two runs
await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('pathways.state.v1'));
  if(s.runs&&s.runs.length===1) s.runs.push(JSON.parse(JSON.stringify({...s.runs[0],label:'Story 2'})));
  localStorage.setItem('pathways.state.v1',JSON.stringify(s));});
await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(700);
const cmp=await tab(/side by side/i);
if(cmp){ await cmp.click(); await page.waitForTimeout(700); await check('JOURNEY compare'); }
else { const chips=await page.$$('.chip-btn'); if(chips.length>=2){ await chips[0].click(); await page.waitForTimeout(250);
  const c2=await page.$$('.chip-btn'); await c2[1].click(); await page.waitForTimeout(250);
  const go=await tab(/side by side/i); if(go){ await go.click(); await page.waitForTimeout(700); await check('JOURNEY compare'); } } }
// aim
await (await tab(/^Aim$/)).click(); await page.waitForTimeout(600); await check('AIM chooser');
const fb=await page.$$('.future-btn'); if(fb.length){ await fb[0].click(); await page.waitForTimeout(700); await check('AIM detail');
  const road=await page.$('.future-btn'); if(road){ await road.click(); await page.waitForTimeout(500); await check('sheet: a road'); await page.keyboard.press('Escape'); } }
// teacher + class view
await page.goto(`http://127.0.0.1:${port}/pathways/index.html?mode=teacher`,{waitUntil:'networkidle'}); await page.waitForTimeout(700);
await check('TEACHER page');
const box=await page.$('#classcodes'); if(box){ await page.fill('#classcodes','A7303\nS520C\nR4130\nI6405'); await page.waitForTimeout(500); await check('TEACHER class picture'); }
// parent
await page.goto(`http://127.0.0.1:${port}/pathways/index.html?mode=parent`,{waitUntil:'networkidle'}); await page.waitForTimeout(700);
await check('PARENT page');
// version popup
await page.goto(`http://127.0.0.1:${port}/pathways/index.html`,{waitUntil:'domcontentloaded'});
await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('pathways.state.v1')||'{}'); s.seenVersion='0.9.0';
  localStorage.setItem('pathways.state.v1',JSON.stringify(s));});
await page.reload({waitUntil:'networkidle'}); await page.waitForTimeout(900);
await check('version popup');
console.log(`\n=== ${W}px: ${bad.length} problem screens ===`);
bad.forEach(b=>console.log('  '+b));
console.log('ERRORS:', errs.length?[...new Set(errs)].join(' | '):'none');
await browser.close(); server.close();
