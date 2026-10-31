/* ==================================================================
   Legacy mode for the older versions of the E21CC Log (v1 and v2).
   They are kept so nothing is lost: they open, show what was written,
   and export it, but they no longer save. A banner sends the student
   to the E21CC Log, and can bring across any entries written here
   after the log moved, so each student keeps one log.
   Loaded by legacy/v1 and legacy/v2: after store.js in index.html,
   and at the end of teacher.html.
   ================================================================== */
(function(){
  'use strict';
  const V = /\/legacy\/v1\//.test(location.pathname) ? 'v1' : 'v2';
  const TEACHER = /teacher\.html$/.test(location.pathname);
  const OLD_KEY = TEACHER ? (V === 'v1' ? 'logs.teacher.v2' : 'logs.teacher.logsv2') : (V === 'v1' ? 'cdl.v2' : 'cdl.logsv2');
  const MAIN_KEY = TEACHER ? 'e21cclog.teacher' : 'e21cclog';
  const MAIN = '../../' + (TEACHER ? 'teacher.html' : 'index.html');

  // read only: nothing written here is kept
  if (TEACHER){ window.save = function(){}; }
  else if (typeof LocalStore !== 'undefined'){ LocalStore.save = function(){ return true; }; }

  // writing routes lead nowhere in an older version
  const blocked = /^#\/(write|grow|act|across|setup)\b/;
  const guard = () => { if (blocked.test(location.hash || '')) history.replaceState(null, '', '#/'); };
  if (!TEACHER){ guard(); window.addEventListener('hashchange', guard, true); }

  // newer entries written here after the move go into the E21CC Log; the newer copy of an entry wins
  function bringAcross(){
    let old, main;
    try{ old = JSON.parse(localStorage.getItem(OLD_KEY) || 'null'); main = JSON.parse(localStorage.getItem(MAIN_KEY) || 'null'); }catch{ return {error:true}; }
    if (!old || !old.profiles) return {added:0, updated:0};
    if (!main) return {fresh:true};
    main.profiles = main.profiles || {}; let added = 0, updated = 0;
    for (const [pid, p] of Object.entries(old.profiles)){
      const m = main.profiles[pid];
      if (!m){ main.profiles[pid] = p; added += (p.entries || []).length; continue; }
      m.entries = m.entries || []; const at = new Map(m.entries.map((e, i) => [e.id, i]));
      for (const e of (p.entries || [])){
        if (!at.has(e.id)){ m.entries.push(e); added++; continue; }
        const cur = m.entries[at.get(e.id)];
        if ((e.updated || e.created || 0) > (cur.updated || cur.created || 0)){ m.entries[at.get(e.id)] = e; updated++; }
      }
    }
    if (added || updated){ main.broughtAcross = {from:V, at:Date.now(), added, updated}; localStorage.setItem(MAIN_KEY, JSON.stringify(main)); }
    return {added, updated};
  }
  window.LEGACY = {version:V, bringAcross};

  function banner(){
    const css = document.createElement('style');
    css.textContent = `.legacy-banner{position:sticky;top:0;z-index:70;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;padding:10px 16px;background:#0b1b5c;color:#fff;font:15px/1.45 Inter,system-ui,sans-serif}
      .legacy-banner p{margin:0;flex:1 1 22em}.legacy-banner a,.legacy-banner button{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border-radius:10px;font:inherit;font-weight:700;text-decoration:none;cursor:pointer}
      .legacy-banner a{background:#FFE200;color:#0b1b5c;border:0}.legacy-banner button{background:transparent;color:#fff;border:2px solid #fff}
      .legacy-banner a:focus-visible,.legacy-banner button:focus-visible{outline:3px solid #FFE200;outline-offset:2px}
      ${TEACHER ? '' : 'section.card:has(#newForm),.navnew,.acts,a[href^="#/write"],a[href^="#/across"],a[href="#/setup"],a[href^="#/grow"],a[href^="#/act"]{display:none!important}'}`;
    document.head.appendChild(css);
    const b = document.createElement('div'); b.className = 'legacy-banner'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Older version');
    b.innerHTML = TEACHER
      ? `<p>This is an older version of the teacher console, kept so nothing is lost. It no longer saves. The console now lives with the E21CC Log.</p><a href="${MAIN}">Open the console</a>`
      : `<p>This is an older version of the E21CC Log, kept so nothing is lost. It no longer saves. Your log now lives in the E21CC Log.</p><a href="${MAIN}">Open my E21CC Log</a><button type="button" id="lgMove">Bring newer entries across</button>`;
    document.body.prepend(b);
    const mv = document.getElementById('lgMove');
    if (mv) mv.onclick = () => {
      const r = bringAcross();
      if (r.error){ mv.textContent = 'Could not read this log'; return; }
      // with nothing newer, or no E21CC Log yet, opening it is enough: a new E21CC Log copies the newest older log in
      location.href = MAIN + (r.added || r.updated ? '#/' : '');
    };
  }
  if (document.body) banner(); else document.addEventListener('DOMContentLoaded', banner);
})();
