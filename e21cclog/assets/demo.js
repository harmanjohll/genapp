/* ==================================================================
   The demo: index.html?demo=student and teacher.html?demo=1.
   Sample data (assets/demo-data.js, made up people) that is never saved, a banner that says so, and an
   optional tour. The student app runs as a guest; the console opens the sample store and never reads or
   writes its real, sealed store. Reloading starts again.
   ================================================================== */
(function(){
  'use strict';
  const view = /teacher\.html$/.test(location.pathname) ? 'teacher' : 'student';
  const root = location.pathname.replace(/[^/]*$/, '');

  // every date moves forward by the time since the data was made, so the term always ends today
  function shifted(x){
    const d = Date.now() - window.E21_DEMO.at;
    const walk = v => Array.isArray(v) ? v.map(walk) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, y]) => [k, walk(y)])) : typeof v === 'number' && v > 1.5e12 && v < 2.5e12 ? v + d : v;
    return walk(x);
  }
  // Sam's goals, made for today: a Chemistry grade, a Concert Band skill, and a competency
  function demoGoals(){
    const day = n => new Date(Date.now() + n * 864e5).toLocaleDateString('en-CA'); const t = Date.now();
    const st = (typeof coreSet === 'function' ? coreSet().list : []).find(s => s.comp === 'communication' && s.band === 'upper');
    const g = [{id:'dg1', kind:'grade', subject:'Chemistry', level:'G3', now:'B4', target:'B3', result:'eoy', by:day(9), steps:['Redo the questions I got wrong, each week', 'Ask Ms Lim about one thing I am stuck on, each week'], checks:[{id:'dc1', text:'Redo the WA2 paper', date:day(-3), done:true}, {id:'dc2', text:'Balance 10 equations without notes', date:day(2), done:false}], created:t - 20 * 864e5, updated:t},
      {id:'dg2', kind:'cca', cca:'Concert Band', title:'Play my hardest passage cleanly', nowText:'Bars 32 to 40 at 80 beats a minute', toText:'At 100, with no stops', by:day(20), steps:['Practise it for 15 minutes after training'], checks:[{id:'dc3', text:'Play it for my section leader', date:day(6), done:false}], created:t - 10 * 864e5, updated:t}];
    if (st) g.push({id:'dg3', kind:'comp', sid:st.id, by:day(30), steps:['Write a GROW after the lesson where it shows'], checks:[], created:t - 5 * 864e5, updated:t});
    return g;
  }
  function demoEvents(){
    const day = n => new Date(Date.now() + n * 864e5).toLocaleDateString('en-CA'); const t = Date.now();
    return [{id:'de1', title:'Concert Band sectional', date:day(3), time:'15:30', type:'cca', goal:'dg2', created:t, updated:t},
      {id:'de2', title:'Chemistry practical test', date:day(5), time:'', type:'assessment', goal:'dg1', created:t, updated:t},
      {id:'de3', title:'History sources quiz', date:day(12), time:'', type:'assessment', goal:'', created:t, updated:t}];
  }
  window.demoStudentDb = () => { const db = shifted(window.E21_DEMO.student); const p = db.profiles && db.profiles[db.current]; if (p && !p.goals) p.goals = demoGoals(); if (p && !p.events) p.events = demoEvents(); return db; };
  window.demoConsoleStore = () => shifted(window.E21_DEMO.console);

  /* ---------- the tour ---------- */
  const tab = name => () => { const b = document.querySelector(`.tabs button[data-tab="${name}"]`); if (b) b.click(); };
  const hash = h => () => { if ((location.hash || '#/') !== h) location.hash = h; };
  const STEPS = view === 'student' ? [
    {title:'Sam’s log, a term in', text:'Sam Lee is a made up Sec 3 student, with a term of entries across five subjects and Concert Band. Take a short tour, or explore on your own. Nothing you do here is saved.', first:true},
    {go:hash('#/'), sel:'.carrycard', title:'Carry on where you left off', text:'Sam closed the Log halfway through a Geography entry. The words are kept, and the entry waits here, one tap away.'},
    {go:hash('#/'), sel:'.fromcard', title:'Teachers reply', text:'Ms Lim answered Sam’s Chemistry entry. Notes from teachers come first, with the words and the entry they are about.'},
    {go:hash('#/'), sel:'.wheelcard', title:'Where am I now?', text:'Each part of the wheel is a competency. It grows as Sam secures I can statements: two entries that back a statement, from two different subjects or CCAs, at least two weeks apart.'},
    {go:hash('#/c/critical'), sel:'#main', title:'One competency, one ladder', text:'Critical Thinking, step by step. Sam secured a statement with a History entry and a Geography entry, in Sam’s own words.'},
    {go:hash('#/journal/grow'), sel:'#main', title:'Journals', text:'Every GROW and ACT entry, by subject and CCA. Open one to see the coach’s question, Sam’s plan, and any teacher’s note beside the words it is about.'},
    {go:hash('#/goals'), sel:'#main', title:'Goals', text:'From Sam’s last Chemistry result, B4, to B3 at the End of Year exam: realistic, with a stretch on offer. Steps and dated checkpoints, a Concert Band skill and a competency too, and a calendar of what is coming up. A goal coach asks a few questions, and checks a goal is SMART. Only Sam sees them.'},
    {go:hash('#/sharing'), sel:'#main', title:'Sam decides who sees what', text:'Each teacher gets only what Sam chooses: the Chemistry teacher, Chemistry entries; the form teacher, the sections Sam opens. Nothing is shared by default.'},
    {go:hash('#/'), sel:'.navnew .btn, .acts .btn', title:'Try it', text:'Press New GROW and write about something from today. The coach asks a question back, offline. Then see the teacher’s side.', last:true, link:['See the teacher view', root + 'teacher.html?demo=1']},
  ] : [
    {title:'Mrs Goh’s console', text:'Mrs Goh is a made up form teacher of 3I. Her console holds what eight students chose to share with her. Take a short tour, or explore on your own. Nothing you do here is saved.', first:true},
    {go:tab('inbox'), sel:'#inboxList', title:'What the class shared', text:'Each item is an entry a student chose to share with her. New ones are marked. Open one to read it.'},
    {go:async () => { tab('inbox')(); const list = [...document.querySelectorAll('#inboxList .item')].filter(x => /Sam Lee/.test(x.textContent) && !x.querySelector('.k.basket')); if (list.length && !list.some(x => x.classList.contains('open'))) list[0].click(); }, sel:'#inboxList .quick', title:'Reply in one tap', text:'Three replies in a teacher’s voice, or a line of her own. A note can also sit beside any answer, like a note in the margin.'},
    {go:tab('inbox'), sel:'#replyCard', title:'Replies to send', text:'Replies wait here, one row for each student. One tap opens a Teams chat with the link ready; the student sees the reply first on their Home.'},
    {go:tab('inbox'), sel:'#fShow', title:'Waiting for a reply', text:'Choose this order to see the entries no one has answered yet, oldest first.'},
    {go:tab('grid'), sel:'#tab-grid', title:'The class at a glance', text:'Where each student is, competency by competency, from what they shared.'},
    {go:tab('students'), sel:'#tab-students', title:'One student at a time', text:'Everything a student shared, in one place.', last:true, extra:'In the real console a PIN locks it, and what it holds is encrypted on the device. The demo skips the PIN and keeps nothing.', link:['See the student view', root + 'index.html?demo=student']},
  ];
  let at = 0, panel = null;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  function spot(sel){
    document.querySelectorAll('.demo-spot').forEach(x => x.classList.remove('demo-spot'));
    const el = sel && [...document.querySelectorAll(sel)].find(x => x.offsetParent !== null || x.getClientRects().length);
    if (el){ el.classList.add('demo-spot'); el.scrollIntoView({block:'center', behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); }
  }
  function draw(){
    const s = STEPS[at]; const n = STEPS.length - 1;
    if (!panel){ panel = document.createElement('aside'); panel.id = 'demoTour'; panel.className = 'demo-tour'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', 'demoTourH'); document.body.appendChild(panel); }
    panel.innerHTML = `${s.first ? '' : `<p class="demo-step">Step ${at} of ${n}</p>`}<h2 id="demoTourH" tabindex="-1">${s.title}</h2><p>${s.text}</p>${s.extra ? `<p class="demo-small">${s.extra}</p>` : ''}
      <div class="demo-row">${s.first ? `<button type="button" class="demo-btn" id="demoNext">Start the tour</button><button type="button" class="demo-btn ghost" id="demoEnd">Explore on my own</button>`
        : `${at > 1 ? '<button type="button" class="demo-btn ghost" id="demoBack">Back</button>' : ''}${s.last ? `<a class="demo-btn" href="${s.link[1]}">${s.link[0]}</a>` : '<button type="button" class="demo-btn" id="demoNext">Next</button>'}<button type="button" class="demo-btn ghost" id="demoEnd">Close the tour</button>`}</div>`;
    const b = id => panel.querySelector('#' + id);
    if (b('demoNext')) b('demoNext').onclick = () => go(at + 1);
    if (b('demoBack')) b('demoBack').onclick = () => go(at - 1);
    b('demoEnd').onclick = end;
    panel.querySelector('h2').focus({preventScroll:true});
  }
  async function go(k){ at = Math.max(0, Math.min(STEPS.length - 1, k)); const s = STEPS[at]; if (s.go){ await s.go(); await wait(500); } spot(s.sel); draw(); }
  function end(){ spot(null); if (panel){ panel.remove(); panel = null; } const t = document.getElementById('demoTourGo'); if (t) t.focus(); }
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && panel){ ev.preventDefault(); ev.stopPropagation(); end(); } }, true);

  /* ---------- the banner ---------- */
  function banner(){
    const other = view === 'student' ? ['Teacher view', root + 'teacher.html?demo=1'] : ['Student view', root + 'index.html?demo=student'];
    const bar = document.createElement('div'); bar.className = 'demo-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Demo');
    bar.innerHTML = `<p><b>Demo</b> · ${view === 'student' ? 'Sam Lee is made up' : 'The students are made up'}. Nothing you do here is saved. <button type="button" class="demo-link" id="demoReset">Start again</button> · <a class="demo-link" href="${root}demo/">All demos</a></p>
      <div class="demo-row"><button type="button" class="demo-btn" id="demoTourGo">Take the tour</button><a class="demo-btn ghost" href="${other[1]}">${other[0]}</a></div>`;
    document.body.prepend(bar); document.body.classList.add('demo');
    const fit = () => document.documentElement.style.setProperty('--demo-h', bar.offsetHeight + 'px'); fit(); window.addEventListener('resize', fit);
    bar.querySelector('#demoTourGo').onclick = () => go(1);
    bar.querySelector('#demoReset').onclick = () => { location.href = location.pathname + location.search; };
  }
  const css = document.createElement('style');
  css.textContent = `
    .demo-bar{position:fixed;top:0;left:0;right:0;z-index:80;background:#14214d;color:#fff;padding:8px 16px;display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;font:14px/1.4 system-ui,sans-serif}
    .demo-bar p{margin:0;flex:1 1 260px} .demo-bar b{color:#ffd23f}
    body.demo{padding-top:var(--demo-h,56px)} body.demo .topbar, body.demo .tabs.side, body.demo header.top{top:var(--demo-h,56px)}
    .demo-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .demo-btn{display:inline-flex;align-items:center;min-height:44px;padding:8px 14px;border-radius:22px;border:2px solid #ffd23f;background:#ffd23f;color:#14214d;font:600 14px/1.2 system-ui,sans-serif;text-decoration:none;cursor:pointer}
    .demo-btn.ghost{background:transparent;color:inherit;border-color:currentColor}
    .demo-bar .demo-btn.ghost{color:#fff}
    .demo-link{background:none;border:0;padding:0;color:#fff;font:inherit;text-decoration:underline;cursor:pointer}
    .demo-tour{position:fixed;z-index:85;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));width:min(380px,calc(100vw - 32px));background:#fff;color:#14214d;border:2px solid #14214d;border-radius:14px;padding:14px 16px;box-shadow:0 10px 30px rgba(0,0,0,.25);font:15px/1.5 system-ui,sans-serif}
    .demo-tour h2{margin:0 0 6px;font-size:1.15em;outline:none} .demo-tour p{margin:0 0 10px} .demo-step,.demo-small{font-size:.85em;color:#3d4670}
    .demo-tour .demo-btn.ghost{color:#14214d}
    @media (max-width:1023px){ body:not(.composing) .demo-tour{bottom:calc(84px + env(safe-area-inset-bottom))} }
    .demo-spot{outline:4px solid #ffd23f !important;outline-offset:4px;border-radius:12px;box-shadow:0 0 0 8px rgba(20,33,77,.18) !important}
    @media print{.demo-bar,.demo-tour{display:none}}`;
  document.head.appendChild(css);
  window.demoStart = () => { banner(); go(0); };
})();
