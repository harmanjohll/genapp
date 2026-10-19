/* ==================================================================
   E21CC Learning Log: the student app.
   Needs core.js and store.js. Nothing leaves the device unless the
   student presses a button that says so.
   ================================================================== */
'use strict';

/* ---------- runtime ---------- */
const QS = new URLSearchParams(location.search);
const GUEST = QS.get('guest') === '1';
const EMBED = (() => { try{ return window.self !== window.top || QS.get('embed') === '1'; }catch{ return true; } })();
if (EMBED) document.body.classList.add('embedded');
LocalStore.guest = GUEST;
const STORE = LocalStore;               // Phase 2 swaps this for OneDriveStore
/* Inside the claude.ai preview the viewer can ask Claude on the viewer's own
   account and save a file. Both resolve later, or stay null. */
let SAMPLE = null, DOWNLOADS = null;
async function initRuntime(){
  if (!(window.claude && typeof window.claude.use === 'function')) return;
  try{ SAMPLE = await window.claude.use('sample'); }catch{ SAMPLE = null; }
  try{ DOWNLOADS = await window.claude.use('downloads'); }catch{ DOWNLOADS = null; }
  if (SAMPLE && me && !me.coach.touched && me.coach.mode === 'builtin'){ me.coach.mode = 'preview'; saveDb(); }
  if (SAMPLE && (location.hash || '').startsWith('#/settings')) route();
}
let db = STORE.open();
let me = null;               // current profile
let unlocked = false;        // PIN passed this session
let draft = null;            // composer state
let toastTimer = null;
function saveDb(){ if (!STORE.save(db)) toast('Could not save on this device. Export your log to keep it.'); }
function newProfile(name, email, code){
  return migrateProfile({
    id:uid(), name:name.trim(), email:(email || '').trim().toLowerCase(),
    groups: code ? [{code:code.trim().toUpperCase(), type:'subject'}] : [],
    pin:null, created:Date.now(),
    prefs:{mood:'mountain', accent:'yellow', size:'normal', avatar:AVATAR_IDS[Math.floor(Math.random() * AVATAR_IDS.length)], motto:MOTTOS[0]},
    coach:{mode:'builtin', key:'', relayUrl:'', token:'', model:'claude-opus-5'},
    entries:[], drafts:{}, done:{}
  });
}
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
async function hashPin(email, pin){ return sha256Hex(email + ':' + pin); }
/* Learning Log PINs set on a page without secure crypto used a short fallback hash; still accept those. */
async function pinMatches(p, pin){
  const key = (p.email || p.id) + ':' + pin;
  if (await hashPin(p.email || p.id, pin) === p.pin) return true;
  if (String(p.pin || '').startsWith('x')){ let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) | 0; return 'x' + h === p.pin; }
  return false;
}

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c])); }
function fmtDate(t){ return new Date(t).toLocaleDateString('en-SG', {day:'numeric', month:'short', year:'numeric'}); }
function fmtDay(t){ return new Date(t).toLocaleDateString('en-SG', {weekday:'short', day:'numeric', month:'short'}); }
function firstName(n){ return (n || '').trim().split(/\s+/)[0] || 'there'; }
function plural(n, one, many){ return `${n} ${n === 1 ? one : (many || one + 's')}`; }
function today(){ return new Date().toLocaleDateString('en-CA'); }
function toast(msg, ms = 2600, action){
  const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) $('button', t).onclick = () => { action.fn(); t.hidden = true; if (action.done) toast(action.done); };
  t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.hidden = true, ms);
}
function icon(n){
  const P = {
    map:'<path d="M3 20l6-11 4 6 3-4 5 9z"/><path d="M14 6l1.5-2L17 6"/>',
    log:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    back:'<path d="M15 18l-6-6 6-6"/>', close:'<path d="M18 6L6 18M6 6l12 12"/>', arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    send:'<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>', copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    down:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>', up:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>', check:'<path d="M20 6L9 17l-5-5"/>', spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
    edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', plus:'<path d="M12 5v14M5 12h14"/>', user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
    link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    note:'<path d="M4 4h16v12H8l-4 4z"/><path d="M8 9h8M8 12h5"/>', lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', flag:'<path d="M5 21V4h11l-1.5 4L16 12H5"/>',
    wheel:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>',
    list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', shelf:'<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="16" rx="1"/><path d="M17.5 5l3 .8-3.8 14.4-3-.8"/>',
    book:'<path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M4 17a3 3 0 0 1 3-3h12"/>',
    home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5.5 5"/>',
    tent:'<path d="M3 20 12 4l9 16"/><path d="M9 20l3-6 3 6"/><path d="M2 20h20"/>',
    trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8 21h8"/>',
    heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    sliders:'<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    grow:'<circle cx="12" cy="12" r="8"/><path d="M12 4v4M20 12h-4M12 20v-4M4 12h4"/>', act:'<path d="M4 12h4l3-7 3 14 3-7h3"/>',
    star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
}
function ringSvg(kind, active){
  if (kind === 'grow'){
    // W top left, G top right, R bottom right, O bottom left: the slide's clock.
    const pos = {w:[30,30], g:[110,30], r:[110,110], o:[30,110]};
    let s = `<svg class="ring" viewBox="0 0 140 140" aria-hidden="true"><circle cx="70" cy="70" r="52" fill="#fff" stroke="#e3e5ef" stroke-width="2"/>
      <text x="70" y="66" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="22" fill="#EC3237">GROW</text>
      <text x="70" y="84" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="10" fill="#5a5f7a">Believe you can</text>`;
    for (const k of ['g','r','o','w']){
      const [x, y] = pos[k]; const on = k === active;
      s += `<circle cx="${x}" cy="${y}" r="${on ? 19 : 16}" fill="${on ? '#FFE200' : '#000C53'}" stroke="#fff" stroke-width="3"/>
            <text x="${x}" y="${y + 6}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="18" fill="${on ? '#000C53' : '#FFE200'}">${k.toUpperCase()}</text>`;
    }
    return s + '</svg>';
  }
  if (kind === 'across'){
    // four small peaks, one per basket, under a ridge line
    return `<svg class="ring" viewBox="0 0 140 140" aria-hidden="true"><circle cx="70" cy="70" r="52" fill="#fff" stroke="#e3e5ef" stroke-width="2"/>
      <path d="M26 92 L46 62 L58 78 L74 48 L88 70 L100 58 L114 92 Z" fill="#000C53"/><path d="M68 56 L74 48 L80 56 Z" fill="#FFE200"/>
      <text x="70" y="112" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="11" fill="#5a5f7a">Look across</text></svg>`;
  }
  // ACT: three arcs, navy, yellow, red, as on the slide.
  const arcs = [{k:'a', c:'#000C53', from:150, to:270}, {k:'c', c:'#FFE200', from:270, to:390}, {k:'t', c:'#EC3237', from:30, to:150}];
  let s = `<svg class="ring" viewBox="0 0 140 140" aria-hidden="true">`;
  for (const a of arcs){
    const on = a.k === active;
    s += `<path d="${arcPath(70, 70, on ? 50 : 46, a.from, a.to)}" fill="none" stroke="${a.c}" stroke-width="${on ? 22 : 16}" stroke-linecap="butt" opacity="${active && !on ? .45 : 1}"/>`;
    const mid = (a.from + a.to) / 2 * Math.PI / 180; const x = 70 + 48 * Math.cos(mid), y = 70 + 48 * Math.sin(mid);
    s += `<text x="${x}" y="${y + 6}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="18" fill="${a.k === 'c' ? '#000C53' : '#fff'}">${a.k.toUpperCase()}</text>`;
  }
  s += `<text x="70" y="76" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="20" fill="var(--head)">ACT</text>`;
  return s + '</svg>';
}
function arcPath(cx, cy, r, a1, a2){
  const p = a => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
  const [x1, y1] = p(a1), [x2, y2] = p(a2);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}
function medal(kind, extra = ''){ const m = {grow:['navy','G'], act:['red','A'], across:['yellow','L']}[kind] || ['navy','?']; return `<span class="medal ${m[0]}" ${extra}>${m[1]}</span>`; }
/* The notebook's look: a cover colour, a paper, the student's accent. */
const COVERS = [
  {id:'navy', label:'Navy', c:'#0d1b5e'}, {id:'forest', label:'Forest', c:'#1d4a37'}, {id:'plum', label:'Plum', c:'#4a2a5c'},
  {id:'crimson', label:'Crimson', c:'#861c27'}, {id:'teal', label:'Teal', c:'#0e5461'}, {id:'ochre', label:'Ochre', c:'#77560f'}
];
const PAPERS = [{id:'lined', label:'Lined'}, {id:'dotted', label:'Dotted'}, {id:'plain', label:'Plain'}, {id:'dark', label:'Dark'}];
/* The student's icon: line drawings that look the same on every device.
   Earlier logs stored an emoji; it maps to the nearest drawing. */
const AVATARS = {
  leaf:'<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19l8-8"/>',
  owl:'<circle cx="8.5" cy="10.5" r="2.5"/><circle cx="15.5" cy="10.5" r="2.5"/><path d="M5 5l3 2.5M19 5l-3 2.5"/><path d="M5 9v5a7 7 0 0 0 14 0V9"/><path d="M11 14.5l1 1.5 1-1.5"/>',
  bee:'<ellipse cx="12" cy="14" rx="5" ry="6"/><path d="M7.4 12h9.2M7.4 16h9.2"/><path d="M9 8.5C7 5 4 5 4 7.5S7 10 9 9.5M15 8.5c2-3.5 5-3.5 5-1S17 10 15 9.5"/>',
  mountain:'<path d="M3 20l6-11 4 6 3-4 5 9z"/><path d="M14 6l1.5-2L17 6"/>',
  wave:'<path d="M2 7c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/><path d="M2 12c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/><path d="M2 17c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/>',
  flame:'<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 2-5 5-5 8 0 4 3 7 7 7z"/>',
  moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  paw:'<circle cx="7" cy="8.5" r="1.8"/><circle cx="12" cy="6" r="1.8"/><circle cx="17" cy="8.5" r="1.8"/><path d="M12 11.5c-3 0-6 3.5-6 6.5 0 2 1.5 3 3 3 1.2 0 2-.6 3-.6s1.8.6 3 .6c1.5 0 3-1 3-3 0-3-3-6.5-6-6.5z"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  book:'<path d="M4 4h12a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M4 17a3 3 0 0 1 3-3h12"/>',
  palette:'<path d="M12 3a9 9 0 0 0 0 18c1.1 0 1.5-.8 1.5-1.6 0-.9-.6-1.4-.6-2.2 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  ball:'<circle cx="12" cy="12" r="9"/><path d="M12 7l4.3 3.1-1.6 5h-5.4l-1.6-5z"/><path d="M12 3v4M20.5 9.5l-4.2.6M17.5 19.5l-2.8-4.4M6.5 19.5l2.8-4.4M3.5 9.5l4.2.6"/>',
  flask:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M7.5 15h9"/>',
  rocket:'<path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.1 2.1 0 0 0-2.9-.1z"/><path d="M12 15l-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
  rainbow:'<path d="M22 17a10 10 0 0 0-20 0"/><path d="M18 17a6 6 0 0 0-12 0"/><path d="M14 17a2 2 0 0 0-4 0"/>',
  fish:'<path d="M7 12c2.5-3.5 6-5 9-5 3 0 6 2.5 6 5s-3 5-6 5c-3 0-6.5-1.5-9-5z"/><path d="M7 12L2 8v8z"/><circle cx="17" cy="11" r=".6"/>',
  butterfly:'<path d="M12 8v12"/><path d="M12 10C9 5 3 4 3 8c0 3 3 5 9 5"/><path d="M12 10c3-5 9-6 9-2 0 3-3 5-9 5"/><path d="M12 13c-3 0-6 2-5 5s4 1 5-2M12 13c3 0 6 2 5 5s-4 1-5-2"/>',
  cat:'<path d="M4 4l4 4h8l4-4v9a8 8 0 0 1-16 0z"/><path d="M9 13h.01M15 13h.01M11 16.5l1 .8 1-.8"/>',
  smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  bulb:'<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  cup:'<path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
  pencil:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8 21h8"/>'
};
const AVATAR_IDS = Object.keys(AVATARS);
const EMOJI_AVATAR = {'🌱':'leaf','🌿':'leaf','🍀':'leaf','🦉':'owl','🐝':'bee','⛰':'mountain','🧗':'mountain','🌊':'wave','🛶':'wave','🔥':'flame','🌙':'moon','⭐':'star','🔭':'star','✨':'star','🐢':'paw','🦁':'paw','🎯':'target','🧭':'compass','📚':'book','🎨':'palette','🎵':'music','🎸':'music','🎧':'music','⚽':'ball','🏀':'ball','🏸':'ball','🧪':'flask','🌈':'rainbow','🦊':'cat','🐬':'fish','🦋':'butterfly','🌻':'sun','🚀':'rocket','🎭':'smile','🧩':'bulb','💡':'bulb','✏':'pencil','🐉':'bolt','🦖':'bolt','🍉':'heart','☕':'cup','🎓':'owl'};
function avatarId(v){ return AVATARS[v] ? v : EMOJI_AVATAR[String(v || '').replace(/\uFE0F/g, '')] || 'leaf'; }
function avatarSvg(v){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${AVATARS[avatarId(v)]}</svg>`; }
function iconPicker(){ const cur = avatarId(me.prefs.avatar); return `<div class="icons-pick" role="group" aria-label="Your icon">${AVATAR_IDS.map(id => `<button type="button" data-av="${id}" class="${cur === id ? 'on' : ''}" aria-pressed="${cur === id}" aria-label="${id[0].toUpperCase() + id.slice(1)}">${avatarSvg(id)}</button>`).join('')}</div>`; }
function wireIconPicker(){ $$('[data-av]').forEach(b => b.onclick = () => { me.prefs.avatar = b.dataset.av; saveDb(); $$('[data-av]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); const a = $('.cover .avatar'); if (a) a.innerHTML = avatarSvg(b.dataset.av); }); }
function applyPrefs(){
  if (me && !AVATARS[me.prefs.avatar]) me.prefs.avatar = avatarId(me.prefs.avatar);
  const p = me ? me.prefs : {cover:'navy', paper:'lined', accent:'yellow', size:'normal'};
  document.body.dataset.cover = p.cover || 'navy'; document.body.dataset.paper = p.paper || 'lined'; document.body.dataset.accent = p.accent || 'yellow'; document.body.dataset.size = p.size || 'normal';
  const m = document.getElementById('themeColor'); if (m) m.content = (COVERS.find(c => c.id === p.cover) || COVERS[0]).c;
}
function logTitle(){ return (me && me.prefs.title && me.prefs.title.trim()) || APP_NAME; }

/* ---------- groups: a form class, subject classes, a CCA, each with its own adult and drop box ---------- */
const ROLE_OF = {form:'Form teacher', subject:'Subject teacher', cca:'CCA teacher', other:'Teacher'};
function groupCfg(code){ return code ? db.groups[code] || null : null; }
function myGroups(){ return (me ? me.groups : []).map(g => Object.assign({code:g.code, type:g.type}, {cfg:groupCfg(g.code)})).filter(g => g.code); }
function groupType(g){ return (g.cfg && g.cfg.type) || g.type || 'subject'; }
/* The form class leads; otherwise the first group added. */
function primaryGroup(){ const gs = myGroups(); const f = gs.find(g => groupType(g) === 'form'); return (f || gs[0] || {}).cfg || null; }
function groupFor(entry){ return (entry && groupCfg(entry.groupCode)) || primaryGroup(); }
function groupName(cfg){ return cfg ? `${cfg.subject || cfg.code}${cfg.teacherName ? ' with ' + cfg.teacherName : ''}` : ''; }
/* The coach link: the entry's group first, then any group that has one (the school usually shares one relay). */
function relayFor(entry){ const g = groupFor(entry); if (g && g.relay && g.relay.url) return g.relay; const any = myGroups().map(x => x.cfg).find(c => c && c.relay && c.relay.url); return any ? any.relay : null; }
async function loadGroup(code){
  code = (code || '').trim().toUpperCase(); if (!code) return null;
  const have = db.groups[code];
  if (have && have._fetched && Date.now() - have._fetched < 6 * 3600e3) return have;
  try{
    const r = await fetch(`classes/${encodeURIComponent(code)}.json`, {cache:'no-cache'});
    if (!r.ok) return have || null;
    const cfg = await r.json(); cfg.code = code; cfg._fetched = Date.now(); db.groups[code] = cfg; adoptGroup(cfg); saveDb(); return cfg;
  }catch{ return have || null; }
}
function adoptGroup(cfg){
  if (!me || !cfg) return;
  const g = me.groups.find(x => x.code === cfg.code); if (g && cfg.type) g.type = cfg.type;
  if (cfg.relay && cfg.relay.url && !me.coach.touched && me.coach.mode === 'builtin') me.coach.mode = 'relay';
  if (cfg.type === 'form' && cfg.band) me.band = cfg.band;
}
function addGroupToMe(code){ code = code.trim().toUpperCase(); if (!code || !me) return; if (!me.groups.some(g => g.code === code)) me.groups.push({code, type:(groupCfg(code) || {}).type || 'subject'}); }
function decodeConfig(b64){
  try{ const json = decodeURIComponent(escape(atob(b64.replace(/-/g, '+').replace(/_/g, '/')))); const cfg = JSON.parse(json); if (!cfg.code) throw 0; cfg.code = String(cfg.code).toUpperCase(); return cfg; }catch{ return null; }
}

/* ---------- I can statements: the form group may name a set; otherwise the default ---------- */
let STMT_SET = normaliseStatementSet(DEFAULT_STATEMENTS);
async function loadStatements(){ await loadStatementSet(); refreshBuiltinStatements(); }
/* Built in reads made before statements existed (or under another set) get their suggestions recomputed; AI reads are left alone. */
function refreshBuiltinStatements(){
  if (!me) return; const st = myStatements(); let changed = false;
  for (const e of me.entries){ if (!e.e21cc || e.e21cc.source !== 'builtin') continue; const s = builtinE21cc(e, st).statements; if (JSON.stringify(s) !== JSON.stringify(e.e21cc.statements || [])){ e.e21cc.statements = s; changed = true; } }
  if (changed) saveDb();
}
async function loadStatementSet(){
  const f = myGroups().find(g => groupType(g) === 'form' && g.cfg && g.cfg.statements);
  const id = (f && String(f.cfg.statements).replace(/[^\w.-]/g, '')) || 'default';
  const cached = db.statementSets[id];
  if (cached && cached._fetched && Date.now() - cached._fetched < 6 * 3600e3){ STMT_SET = normaliseStatementSet(cached) || STMT_SET; return; }
  try{
    const r = await fetch(`statements/${encodeURIComponent(id)}.json`, {cache:'no-cache'});
    if (r.ok){ const raw = await r.json(); const set = normaliseStatementSet(raw); if (set && set.list.length){ raw._fetched = Date.now(); db.statementSets[id] = raw; STMT_SET = set; saveDb(); return; } }
  }catch{}
  if (cached) STMT_SET = normaliseStatementSet(cached) || STMT_SET;
}
function myStatements(){ return statementsFor(STMT_SET, me && me.band); }
function statementById(id){ return STMT_SET.list.find(s => s.id === id) || null; }

/* ---------- the coach ---------- */
/* The adult key option shows only with ?adult=1 (or when a profile already uses it). */
function ADULT(){ return QS.get('adult') === '1'; }
/* The coach options. Gemini comes first while the log is being tested; the
   others stay for later (the school relay) or for special cases. */
function COACH_MODES(){
  const relay = relayFor(null);
  const main = [
    ['builtin', 'Built in coach', 'Works offline. Reads for specifics, reasons and a dated next step. Nothing leaves the device.'],
    ['gemini', 'Gemini (for testing)', 'Your own Gemini API key gives E21CC feedback on every entry. For testing by adults: Gemini’s terms do not allow users under 18.']
  ];
  const more = [
    ['relay', 'School coach link (later)', 'The school holds one key in a relay; students hold none.' + (relay ? ' Your group already provides one.' : '')],
    ['local', 'On this device (Chrome built in AI)', 'Free and private, but only on Chrome 148 or newer on a laptop or Chromebook Plus.']
  ];
  if (SAMPLE || (me && me.coach.mode === 'preview')) main.push(['preview', 'Claude in this preview', 'Uses the Claude account that opened this preview.']);
  if (ADULT() || (me && me.coach.mode === 'key')) more.push(['key', 'An Anthropic key held by an adult', 'The key stays in this browser.']);
  return {main, more};
}
/* Credit guard: a daily allowance of coach reads that cost someone money. */
const METERED = ['relay', 'key', 'gemini'];
function dailyLimit(){ if (me && me.coach.mode === 'gemini') return 40; const v = myGroups().map(g => g.cfg && g.cfg.relay && Number(g.cfg.relay.daily)).filter(n => n > 0); return v.length ? Math.max(...v) : 8; }
function readsUsed(){ const a = me.coach.allowance || (me.coach.allowance = {day:'', used:0}); if (a.day !== today()){ a.day = today(); a.used = 0; } return a.used; }
function readsLeft(){ return METERED.includes(me.coach.mode) ? Math.max(0, dailyLimit() - readsUsed()) : Infinity; }
function countRead(){ if (METERED.includes(me.coach.mode)){ readsUsed(); me.coach.allowance.used++; saveDb(); } }
class AllowanceError extends Error {}

function shapeHint(stmts){
  return 'Reply with only one JSON object and no other text, with exactly these keys: gift, stretch, question, competency, depth (one of "surface", "working", "deep"), e21cc: {stance (one of "task", "mixed", "competency"), stance_note, evidence: [{id, strength (one of "glimpse", "clear", "strong"), quote, why}], suggested: [ids], tagged_not_shown: [ids], probe, probe_for' + (stmts.length ? ', statements: [{sid, quote, why}]' : '') + '}. Valid ids: ' + COMPETENCY_IDS.join(', ') + '.';
}
function parseModelJson(text){ try{ return JSON.parse(text); }catch{ const a = text.indexOf('{'), b = text.lastIndexOf('}'); return JSON.parse(text.slice(a, b + 1)); } }
function finish(entry, parsed, model, stmts){
  if (!['surface','working','deep'].includes(parsed.depth)) parsed.depth = 'working';
  parsed.e21cc = normaliseE21cc(entry, parsed.e21cc, 'ai', stmts);
  return Object.assign({source:'ai', model, at:Date.now(), inputHash:inputHash(entry, stmts)}, parsed);
}
async function localCoach(entry, cls, stmts){
  // Chrome's built in Prompt API (desktop and Chromebook Plus only).
  if (typeof LanguageModel === 'undefined') throw new Error('This browser has no built in AI. It needs Chrome 148 or newer on a laptop or Chromebook Plus. Use the school coach link instead.');
  if (await LanguageModel.availability() === 'unavailable') throw new Error('Built in AI is not available on this device.');
  const session = await LanguageModel.create({initialPrompts:[{role:'system', content:coachSystem(cls, stmts, me.prefs.tone) + '\n\n' + shapeHint(stmts)}]});
  const prompt = entryForCoach(entry); let text;
  try{ text = await session.prompt(prompt, {responseConstraint:coachSchema(stmts)}); }catch{ text = await session.prompt(prompt); }
  try{ session.destroy && session.destroy(); }catch{}
  return finish(entry, parseModelJson(text), 'chrome-built-in', stmts);
}
async function previewCoach(entry, cls, stmts){
  if (!SAMPLE) throw new Error('Claude is not available in this view. Open the preview in claude.ai, or use the school coach link.');
  let data;
  try{ data = await SAMPLE.json(coachSystem(cls, stmts, me.prefs.tone) + '\n\n' + shapeHint(stmts) + '\n\nThe entry:\n\n' + entryForCoach(entry), {modelTier:'default', cache:false}); }
  catch(e){
    const m = {not_granted:'You did not allow this preview to use Claude.', rate_limited:'Claude is busy for this account. Try again in a minute.', refused:'Claude declined to read this one.', invalid_json:'Claude answered in a shape the page could not read. Try again.', sampling_disabled:'Claude is not available for this account.', session_expired:'Sign in to claude.ai again.'};
    throw new Error(m[e && e.code] || (e && e.message) || 'The preview coach could not answer.');
  }
  if (!data || typeof data !== 'object') throw new Error('Claude answered in a shape the page could not read.');
  return finish(entry, data, 'claude (preview)', stmts);
}
/* ---------- Gemini, for testing: the user's own key, called from this browser ---------- */
const GEMINI = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_DEFAULT = 'gemini-flash-latest';
/* Gemini's JSON schema support is a subset: drop what it may not accept. */
function geminiSchema(s){ return JSON.parse(JSON.stringify(s, (k, v) => k === 'additionalProperties' ? undefined : v)); }
function geminiError(status, text){
  const t = String(text || ''); let msg = ''; try{ msg = (JSON.parse(t).error || {}).message || ''; }catch{}
  if (status === 400 && /api key/i.test(msg + t)) return 'Gemini did not accept the key. Check it in Settings, Coach.';
  if (status === 403) return 'Gemini refused the key here. If the key is restricted, allow this site and the Generative Language API.';
  if (status === 404) return 'That Gemini model is not available to this key. Pick another in Settings, Coach.';
  if (status === 429) return 'The Gemini key has hit its limit for now. Try again later.';
  return `Gemini could not answer (status ${status}). ${msg.slice(0, 160)}`;
}
async function geminiModels(key){
  const res = await fetch(`${GEMINI}/models?pageSize=200`, {headers:{'x-goog-api-key':key}});
  if (!res.ok) throw new Error(geminiError(res.status, await res.text()));
  const data = await res.json();
  const ids = (data.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => String(m.name || '').replace(/^models\//, ''))
    .filter(id => /^gemini/.test(id) && !/embedding|image|tts|audio|live|vision|robotics|computer/.test(id));
  const num = id => { const m = /gemini-(\d+(?:\.\d+)?)/.exec(id); return m ? parseFloat(m[1]) : 0; };
  ids.sort((a, b) => num(b) - num(a) || a.localeCompare(b));
  const pick = ids.includes(GEMINI_DEFAULT) ? GEMINI_DEFAULT : (ids.find(id => /flash/.test(id) && !/lite|preview|exp/.test(id)) || ids.find(id => /flash/.test(id)) || ids[0] || GEMINI_DEFAULT);
  return {ids, pick};
}
async function geminiCoach(entry, cls, stmts, opts = {}){
  const c = me.coach; if (!c.geminiKey) throw new Error('No Gemini key saved yet. Add one in Settings, Coach.');
  const model = c.geminiModel || GEMINI_DEFAULT; const sys = coachSystem(cls, stmts, me.prefs.tone);
  const body = {systemInstruction:{parts:[{text:sys}]}, contents:[{role:'user', parts:[{text:entryForCoach(entry)}]}],
    generationConfig:{responseMimeType:'application/json', responseJsonSchema:geminiSchema(coachSchema(stmts)), temperature:0.4}};
  const call = () => fetch(`${GEMINI}/models/${encodeURIComponent(model)}:generateContent`, {method:'POST', headers:{'Content-Type':'application/json', 'x-goog-api-key':c.geminiKey}, body:JSON.stringify(body)});
  let res = await call();
  if (res.status === 400){
    const t = await res.text();
    if (/api key/i.test(t)) throw new Error(geminiError(400, t));
    // an older model or API version that does not take the schema: ask for JSON by instruction instead
    delete body.generationConfig.responseJsonSchema; body.systemInstruction.parts[0].text = sys + '\n\n' + shapeHint(stmts);
    res = await call();
  }
  if (!res.ok) throw new Error(geminiError(res.status, await res.text()));
  const data = await res.json(); const cand = (data.candidates || [])[0];
  if (!cand) throw new Error(data.promptFeedback && data.promptFeedback.blockReason ? 'Gemini declined to read this one. The built in feedback stands.' : 'Gemini gave no answer. Try again.');
  const text = ((cand.content && cand.content.parts) || []).map(p => p.text || '').join('');
  if (!opts.test) countRead();
  return finish(entry, parseModelJson(text), 'gemini:' + model, stmts);
}
async function aiCoach(entry, opts = {}){
  const c = me.coach; const cls = groupFor(entry); const stmts = opts.noStatements ? [] : myStatements();
  if (c.mode === 'preview') return previewCoach(entry, cls, stmts);
  if (c.mode === 'local') return localCoach(entry, cls, stmts);
  if (METERED.includes(c.mode) && !opts.test && readsLeft() <= 0) throw new AllowanceError(`You have used today’s ${dailyLimit()} coach reads. The built in read stands; the coach is back tomorrow.`);
  if (c.mode === 'gemini') return geminiCoach(entry, cls, stmts, opts);
  const body = {
    model:c.model || 'claude-opus-5', max_tokens:1500,
    system:coachSystem(cls, stmts, me.prefs.tone),
    messages:[{role:'user', content:entryForCoach(entry)}],
    output_config:{effort:'low', format:{type:'json_schema', schema:coachSchema(stmts)}},
    fallbacks:'default'
  };
  let res;
  if (c.mode === 'relay'){
    const r = relayFor(entry) || {}; const url = c.relayUrl || r.url || ''; const token = c.token || r.token || '';
    if (!url) throw new Error('No coach link set. Ask your teacher for the group file, or add the link in Settings.');
    const student = (await sha256Hex('cdl:' + token + ':' + (me.email || me.id))).slice(0, 32);
    res = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json', 'x-class-token':token, 'x-class-code':(cls && cls.code) || '', 'x-student':student}, body:JSON.stringify(body)});
  } else if (c.mode === 'key'){
    if (!c.key) throw new Error('No API key saved. Add one in Settings, or switch to the built in coach.');
    res = await fetch('https://api.anthropic.com/v1/messages', {method:'POST', headers:{
      'Content-Type':'application/json', 'x-api-key':c.key, 'anthropic-version':'2023-06-01',
      'anthropic-beta':'server-side-fallback-2026-07-01', 'anthropic-dangerous-direct-browser-access':'true'}, body:JSON.stringify(body)});
  } else throw new Error('The AI coach is off. The built in coach is already reading your entry.');
  if (!res.ok){
    let t = ''; try{ t = await res.text(); }catch{}
    if (res.status === 401 || res.status === 403) throw new Error('The coach service did not accept the key or class token. Check Settings.');
    if (res.status === 429) throw new Error('The coach is busy. Try again in a minute.');
    throw new Error(`The coach could not answer (status ${res.status}). ${t.slice(0, 140)}`);
  }
  const data = await res.json();
  if (data.stop_reason === 'refusal') throw new Error('The coach declined to answer this one. The built in feedback still stands.');
  if (!opts.test) countRead();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  return finish(entry, parseModelJson(text), data.model || body.model, stmts);
}

/* The smart action: every logged entry is read. The built in read is instant;
   with a coach configured, the entry (no name, no email) is read once per
   version of its words. */
const aiPending = new Set(); const aiErrors = new Map();
function aiReady(){ return !!(me && me.coach && me.coach.mode !== 'builtin'); }
function autoEval(){ return aiReady() && me.coach.auto !== false; }
function aiFresh(e){ return !!(e.coach && e.coach.ai && e.coach.ai.inputHash && e.coach.ai.inputHash === inputHash(e, myStatements())); }
async function runAiFor(e){
  if (aiPending.has(e.id) || aiFresh(e)) return;
  aiPending.add(e.id); aiErrors.delete(e.id);
  try{ const r = await aiCoach(e); e.coach = e.coach || {}; e.coach.ai = r; if (r.e21cc) e.e21cc = r.e21cc; saveDb(); }
  catch(err){ aiErrors.set(e.id, {msg:err.message, allowance:err instanceof AllowanceError}); }
  finally{ aiPending.delete(e.id); const h = location.hash || ''; if (h.startsWith('#/entry/' + e.id)) renderEntry(h.slice(8)); }
}

/* ---------- entry text ---------- */
function nextStepOf(e){ return e.kind === 'grow' ? e.answers.r2 : e.kind === 'act' ? e.answers.t1 : e.answers.x3; }
function coachOf(e){ return e.coach && (e.coach.ai || e.coach.builtin); }
function depthOf(e){ const c = coachOf(e); return c ? c.depth : ''; }
function claimText(e){ const t = (e.competencies || []).map(x => { const c = compOf(x.id); const l = LEVELS.find(z => z.n === x.level); return c ? `${c.label} (${l ? l.label : ''})` : ''; }).filter(Boolean); return 'Claimed: ' + (t.length ? t.join('; ') : 'none') + (e.e21cc ? '. ' + e21ccSummary(e.e21cc) : ''); }
function entryTitle(e){
  if (e.kind === 'across') return `Look across: ${(basketOf(e.basket) || {}).short || ''}`;
  const ctx = e.context || {}; const name = ctx.name || e.subject || FRAMEWORKS[e.kind].name;
  return `${name}${e.topic ? ' · ' + e.topic : ''}`;
}
function contextLine(e){
  if (e.kind === 'across') return `Look across · ${termLabel(e.term)}`;
  const t = e.context && e.context.type; return `${FRAMEWORKS[e.kind].tagline}${t && t !== 'subject' ? ' · ' + contextTypeOf(t).label : ''}`;
}
function entryText(e, forAdult){
  const fw = FRAMEWORKS[e.kind]; const L = [];
  L.push(`${fw.tagline} · ${entryTitle(e)} · ${fmtDate(e.created)}`);
  if (forAdult && me) L.push(`${me.name}${me.email ? ' <' + me.email + '>' : ''}`);
  if (e.kind === 'act' && e.feedbackText) L.push(`Feedback (${e.feedbackFrom || 'teacher'}): ${e.feedbackText}`);
  for (const s of fw.steps) for (const q of s.qs) L.push(`${s.letter} · ${q.q.replace(/<[^>]+>/g, '')}\n${e.answers[q.id] || '(blank)'}`);
  if (e.kind !== 'across') L.push(claimText(e));
  const c = coachOf(e); if (c && DEPTHS[c.depth]) L.push(`Depth: ${DEPTHS[c.depth].label}`);
  return L.join('\n\n');
}

/* ---------- adults and sharing: nothing is shared until the student says so ---------- */
const SECTIONS = [['grow', 'GROW'], ['act', 'ACT'], ...DOMAINS.map(d => [d.id, d.short])];
function adults(){
  const out = [];
  for (const g of myGroups()){ const c = g.cfg; if (!c || !(c.teacherName || c.teacherEmail)) continue;
    out.push({id:'g:' + g.code, name:c.teacherName || 'Teacher', email:c.teacherEmail || '', role:ROLE_OF[groupType(g)] || 'Teacher', groupCode:g.code, groupLabel:c.subject || g.code, sink:c.sink || null, group:true}); }
  for (const a of Object.values(me.shares.adults)) out.push(Object.assign({sink:null, group:false, groupCode:''}, a));
  return out;
}
function adultById(id){ return adults().find(a => a.id === id) || null; }
function scopeOf(a){ return me.shares.scope[a.id] || (a.group ? 'group' : 'all'); }
function sectionsOf(a){ return Object.entries(me.shares.sections).filter(([, ids]) => ids.includes(a.id)).map(([k]) => k); }
function sharesEntry(a, e){
  const secs = sectionsOf(a);
  if (e.kind === 'across') return secs.includes(e.basket);
  if (!secs.includes(e.kind)) return false;
  return scopeOf(a) === 'all' || !a.groupCode || e.groupCode === a.groupCode;
}
function version(e){ return e.updated || e.created; }
function isSent(a, e){ return !!(e.sent && e.sent[a.id] >= version(e)); }
function basketSnapshot(b){
  const entries = me.entries;
  return {basket:b, set:STMT_SET.id, evidence:entries.filter(e => e.kind !== 'across' && basketsOf(e).includes(b)).length,
    statements:myStatements().filter(s => s.basket === b).map(s => { const st = statementStatus(entries, s); return {id:s.id, text:s.text, state:st.state, quotes:st.links.filter(k => k.backed).slice(0, 3).map(k => ({eid:k.e.id, quote:k.l.quote}))}; })};
}
function snapHash(s){ return fnvHex(JSON.stringify(s.statements) + '|' + s.evidence); }
function unsentFor(a){
  const items = me.entries.filter(e => sharesEntry(a, e) && !isSent(a, e)).sort((x, y) => x.created - y.created).map(e => ({t:'e', id:e.id, title:entryTitle(e), e}));
  for (const b of BASKET_IDS) if (sectionsOf(a).includes(b)){ const s = basketSnapshot(b); if ((me.sentBaskets[a.id] || {})[b] !== snapHash(s)) items.push({t:'b', id:'basket:' + b, title:`${basketOf(b).short}: statements and evidence`, b, snap:s}); }
  return items;
}
function toPayloadItem(it){ return it.t === 'e' ? {t:'e', e:compactEntry(it.e)} : {t:'b', b:it.snap}; }
function markSent(a, items){
  const now = Date.now();
  for (const it of items){
    if (it.t === 'e'){ const e = me.entries.find(x => x.id === it.id); if (e){ e.sent = e.sent || {}; e.sent[a.id] = Math.max(now, version(e)); e.pushed = {at:now, kind:a.sink ? a.sink.kind : 'link'}; } }
    else { me.sentBaskets[a.id] = me.sentBaskets[a.id] || {}; me.sentBaskets[a.id][it.b] = snapHash(it.snap); }
  }
  saveDb();
}
async function senderInfo(){ return {name:me.name, email:me.email, tag:me.email ? await emailTag(me.email) : '', groups:me.groups.map(g => g.code)}; }
function readableFields(a, slice){
  const head = {timestamp:new Date().toISOString(), studentName:me.name, studentEmail:me.email, classCode:a.groupCode || ((me.groups[0] || {}).code || ''), teacherEmail:a.email || '',
    section:[...new Set(slice.map(x => x.t === 'b' ? x.b.basket : x.e.kind))].join(', ')};
  if (slice.length === 1 && slice[0].t === 'e'){
    const e = me.entries.find(x => x.id === slice[0].e.id) || slice[0].e;
    return Object.assign(head, {framework:e.kind.toUpperCase(), subject:(e.context && e.context.name) || e.subject || '', context:contextTypeOf(e.context && e.context.type).label, topic:e.topic || '',
      entry:entryText(e, false).slice(0, 1500), competencies:claimText(e).slice(0, 1500), depth:depthOf(e), nextStep:(nextStepOf(e) || '').slice(0, 500), entryId:e.id});
  }
  return Object.assign(head, {framework:'BUNDLE', subject:'', context:'', topic:'', depth:'', nextStep:'', competencies:'',
    entry:slice.map(x => x.t === 'e' ? `${x.e.kind.toUpperCase()} · ${(x.e.context && x.e.context.name) || ''}${x.e.topic ? ' · ' + x.e.topic : ''}` : `Basket · ${basketOf(x.b.basket).short}`).join('\n').slice(0, 1500),
    entryId:slice.map(x => x.t === 'e' ? x.e.id : 'basket:' + x.b.basket).join(' ').slice(0, 500)});
}
/* The send sheet for one adult: their unsent items, ticked, or a given list. */
async function sendSheet(a, preset){
  const items = preset || unsentFor(a);
  if (!items.length){ toast(`Nothing new for ${a.name}.`); return; }
  dialog(`<h2>Send to ${esc(a.name)}</h2><p class="tiny">${esc(a.role)}${a.groupLabel ? ' · ' + esc(a.groupLabel) : ''} · ${a.sink && a.sink.kind === 'msforms' ? 'their Microsoft Form' : a.sink && a.sink.kind === 'gforms' ? 'their Google Form' : 'a link you send them in Teams'}</p>
    <div class="stack" id="sendList">${items.map((it, i) => `<label class="pick-row"><input type="checkbox" data-i="${i}" checked><span><b>${esc(it.title)}</b><small>${it.t === 'e' ? esc(contextLine(it.e)) + ' · ' + fmtDay(it.e.created) + (it.e.sent && it.e.sent[a.id] ? ' · updated since you sent it' : '') : 'Your statements, the quotes that back them, and your evidence count'}</small></span></label>`).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn" id="dGo">${icon('send')} Send</button><button class="btn sec" id="dClose">Cancel</button></div>`);
  $('#dClose').onclick = closeDialog;
  $('#dGo').onclick = async () => { const chosen = $$('#sendList input').filter(x => x.checked).map(x => items[+x.dataset.i]); if (!chosen.length) return toast('Tick at least one.'); $('#dGo').disabled = true; await deliver(a, chosen); };
}
async function deliver(a, chosen){
  const from = await senderInfo(); const payloadItems = chosen.map(toPayloadItem); const sink = a.sink;
  if (sink && sink.url && (sink.kind === 'msforms' || sink.kind === 'gforms')){
    if (!mappedCount(sink, Object.fromEntries(FORM_FIELDS.map(f => [f, 1])))){ dialog(`<h2>The drop box is not set up</h2><p>${esc(a.name)}’s form has no field map yet. Tell them, or send a link instead.</p><div class="row"><button class="btn" id="dLink">${icon('link')} Send a link instead</button><button class="btn sec" id="dClose">Close</button></div>`); $('#dClose').onclick = closeDialog; $('#dLink').onclick = () => deliver(Object.assign({}, a, {sink:null}), chosen); return; }
    const subs = await buildSubmissions(sink, slice => readableFields(a, slice), from, payloadItems);
    const parts = subs.map(s => ({items:s.items.map(pi => chosen.find(c => (pi.t === 'e' ? c.id === pi.e.id : c.id === 'basket:' + pi.b.basket))), fields:s.fields, url:s.url}));
    if (sink.kind === 'gforms'){ for (const p of parts) FormsTransport.postGoogle(sink, p.fields); markSent(a, chosen); closeDialog(); toast(`Sent to ${a.name}’s sheet.`); route(); return; }
    return msStep(a, parts, 0);
  }
  // no drop box: a link that opens in the adult's teacher console
  const link = consoleUrl() + '#/in?p=' + await packCDL('i', {v:1, from, items:payloadItems});
  const msg = `${me.name}: ${plural(chosen.length, 'item')} from my E21CC Learning Log. Open in your teacher console: ${link}`;
  dialog(`<h2>Send a link to ${esc(a.name)}</h2><p>${esc(a.name)} has no drop box, so send a link. It opens in their teacher console and adds ${plural(chosen.length, 'item')}. Anyone with the link can read it, so send it only to them.</p>
    <div class="row">${a.email ? `<a class="btn" id="dTeams" href="${esc(teamsChatUrl(a.email, msg))}" target="_blank" rel="noopener">${icon('send')} Open Teams chat</a>` : ''}<button class="btn sec" id="dCopy">${icon('copy')} Copy link</button></div>
    <p class="tiny" style="margin-top:8px">${link.length > 7000 ? `This link is long (${link.length} characters). If Teams cuts it, send fewer items at a time.` : 'Teams not working? Copy the link and paste it into a chat or email to them.'}</p>
    <div class="row" style="margin-top:10px"><button class="btn acc" id="dDone">${icon('check')} I sent it</button><button class="btn ghost" id="dClose">Not yet</button></div>`);
  $('#dCopy').onclick = () => copyText(link);
  $('#dDone').onclick = () => { markSent(a, chosen); closeDialog(); toast(`Marked as sent to ${a.name}.`); route(); };
  $('#dClose').onclick = closeDialog;
}
function msStep(a, parts, k){
  const p = parts[k]; const n = parts.length;
  dialog(`<h2>${n > 1 ? `Part ${k + 1} of ${n}` : 'One more tap'}</h2><p>Open ${esc(a.name)}’s form: your ${plural(p.items.length, 'item')} ${p.items.length === 1 ? 'is' : 'are'} already filled in. Check it, then press <b>Submit</b> there.</p>
    <div class="row"><a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener" id="dOpen">${icon('send')} Open the form</a></div>
    <div class="row" style="margin-top:12px"><button class="btn acc" id="dDone">${icon('check')} I pressed Submit</button><button class="btn ghost" id="dClose">Not yet</button></div>`);
  $('#dDone').onclick = () => { markSent(a, p.items); if (k + 1 < n) msStep(a, parts, k + 1); else { closeDialog(); toast(`Sent to ${a.name}.`); route(); } };
  $('#dClose').onclick = closeDialog;
}

/* ---------- margin notes arrive by link: index.html#/note?n=CDL1.n.… ---------- */
async function importNoteLink(text){
  const got = await unpackCDL(text); if (!got || got.kind !== 'n') throw new Error('That link is not a note link.');
  const d = got.data || {};
  if (!me.email) throw new Error('Add your school email in Settings first. Notes find you by it.');
  if (d.to !== await emailTag(me.email)) throw new Error('This note is addressed to a different student email. Check the email in Settings, or ask your teacher to resend it.');
  const by = d.by || {}; let added = 0, pending = 0, first = null;
  for (const n of (Array.isArray(d.notes) ? d.notes : [])){
    if (!n || !n.id || !n.text) continue;
    const note = {id:String(n.id), by:String(by.name || 'Your teacher').slice(0, 60), role:String(by.role || '').slice(0, 40), at:n.at || Date.now(), anchor:String(n.anchor || 'entry'), text:String(n.text).slice(0, 600), seen:false};
    const e = me.entries.find(x => x.id === n.eid);
    if (!e){ if (!me.pendingNotes.some(p => p.note.id === note.id)){ me.pendingNotes.push({eid:n.eid, note}); pending++; } continue; }
    if (!e.notes.some(x => x.id === note.id)){ e.notes.push(note); added++; first = first || e.id; }
  }
  saveDb();
  return {added, pending, first, by:by.name || 'Your teacher'};
}
function applyPendingNotes(){
  let n = 0; me.pendingNotes = (me.pendingNotes || []).filter(p => { const e = me.entries.find(x => x.id === p.eid); if (!e) return true; if (!e.notes.some(x => x.id === p.note.id)){ e.notes.push(p.note); n++; } return false; });
  return n;
}
function stashLink(){ const h = location.hash || ''; if (!h.startsWith('#/note')) return false; try{ sessionStorage.setItem('cdl.link', h); }catch{} try{ history.replaceState(null, '', location.pathname + location.search + '#/'); }catch{ location.hash = '#/'; } return h; }
async function processStashedLink(h){
  if (!h){ try{ h = sessionStorage.getItem('cdl.link'); }catch{} }
  if (!h || !me || (me.pin && !unlocked)) return;
  try{ sessionStorage.removeItem('cdl.link'); }catch{}
  const q = new URLSearchParams(h.split('?')[1] || '');
  try{
    const r = await importNoteLink(q.get('n') || '');
    if (r.added){ toast(`${plural(r.added, 'note')} from ${r.by}.`, 3200); location.hash = '#/entry/' + r.first; }
    else if (r.pending) dialog(`<h2>A note for an entry not on this device</h2><p>${esc(r.by)} wrote on ${plural(r.pending, 'entry', 'entries')} that this device does not have. Import your exported log (Settings, Your data) and the note will land in place.</p><div class="row"><button class="btn sec" id="dClose">OK</button></div>`), $('#dClose').onclick = closeDialog;
    else toast('You already have these notes.');
  }catch(err){ dialog(`<h2>That note did not open</h2><p>${esc(err.message)}</p><div class="row"><button class="btn sec" id="dClose">OK</button></div>`); $('#dClose').onclick = closeDialog; }
}

/* ---------- dialogs, copy, download ---------- */
async function copyText(t){ try{ await navigator.clipboard.writeText(t); toast('Copied.'); }catch{ dialog(`<h2>Copy this</h2><textarea class="in" style="min-height:220px">${esc(t)}</textarea><div class="row" style="margin-top:10px"><button class="btn sec" id="dClose">Close</button></div>`); $('#dClose').onclick = closeDialog; } }
function dialog(html){
  if (EMBED){
    // a modal centred on a frame the viewer cannot scroll would land off screen; show it in the flow instead
    let p = $('#inlineDlg'); if (!p){ p = document.createElement('div'); p.id = 'inlineDlg'; p.className = 'card inline-dlg'; }
    p.innerHTML = html; const host = $('#sheet .inner') || $('#app main') || document.body; host.prepend(p);
    try{ p.scrollIntoView({block:'start', behavior:'smooth'}); }catch{} return;
  }
  $('#dlgBody').innerHTML = html; const d = $('#dlg'); if (!d.open) d.showModal();
}
function closeDialog(){ const p = $('#inlineDlg'); if (p) p.remove(); const d = $('#dlg'); if (d.open) d.close(); }
function download(name, text, type = 'application/json'){
  if (DOWNLOADS){ DOWNLOADS.save({filename:name, data:text}).then(() => toast('Saved.')).catch(() => {}); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], {type})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}

/* ---------- routing ---------- */
window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', boot);

async function boot(){
  initRuntime();
  const sk = $('.skip'); if (sk) sk.onclick = ev => { ev.preventDefault(); const m = $('#main'); if (m){ m.focus(); m.scrollIntoView(); } };
  if (db.current && db.profiles[db.current]) me = db.profiles[db.current];
  applyPrefs();
  const link = stashLink();
  if ((location.hash || '').startsWith('#/config')) await importConfigFromHash();
  if (QS.get('class') && !me) db._preClass = QS.get('class').toUpperCase();
  route();
  if (me){ await Promise.all(me.groups.map(g => loadGroup(g.code))); await loadStatements(); const h = location.hash || '#/'; if (h === '#/' || h.startsWith('#/c/')) route(); }
  processStashedLink(link || null);
}
async function importConfigFromHash(){
  const q = new URLSearchParams((location.hash.split('?')[1]) || ''); const cfg = decodeConfig(q.get('c') || '');
  if (!cfg){ toast('That group link did not work.'); location.hash = '#/'; return; }
  cfg._fetched = Date.now(); db.groups[cfg.code] = cfg;
  if (me){ addGroupToMe(cfg.code); adoptGroup(cfg); loadStatements(); }
  else db._preClass = cfg.code;
  saveDb(); toast(`Group ${cfg.code} added${cfg.teacherName ? ' (' + cfg.teacherName + ')' : ''}.`);
  location.hash = me ? '#/settings' : '#/welcome';
}
function hashParts(){ const h = location.hash || '#/'; const [path, q] = h.split('?'); return {parts:path.split('/'), q:new URLSearchParams(q || '')}; }
function route(){
  const h = location.hash || '#/';
  if (h.startsWith('#/note')){ const l = stashLink(); processStashedLink(l); return; }
  if (h.startsWith('#/config')){ importConfigFromHash(); return; }
  if (!me || (me.pin && !unlocked)){ if (h !== '#/welcome'){ location.hash = '#/welcome'; return; } return renderWelcome(); }
  const {parts} = hashParts();
  if (h.startsWith('#/write/')){ const kind = parts[2]; if (kind === 'grow' || kind === 'act') return openComposer(kind, parts[3]); }
  if (h.startsWith('#/across/')) return openComposer('across', parts[3], parts[2]);
  // addresses from earlier versions
  if (/^#\/(grow|act)(\/|$|\?)/.test(h)){ location.hash = '#/write/' + parts[1] + (parts[2] ? '/' + parts[2] : ''); return; }
  if (h.startsWith('#/log') || h.startsWith('#/journey')){ location.hash = '#/journal/grow'; return; }
  if (h.startsWith('#/basket/')){ location.hash = '#/'; return; }
  closeComposer();
  if (h.startsWith('#/entry/')) return renderEntry(h.slice(8));
  if (h.startsWith('#/c/')) return renderCompetency(parts[2]);
  if (h.startsWith('#/journal/')) return renderJournal(parts[2] === 'act' ? 'act' : 'grow');
  if (h.startsWith('#/setup')) return renderSetup();
  if (h.startsWith('#/sharing')) return renderSharing();
  if (h.startsWith('#/settings')) return renderSettings();
  if (h.startsWith('#/welcome')) return renderWelcome();
  return renderHome();
}
/* The notebook: a cover with Home, the log's title and the student's icon; ribbon tabs; the page. */
const TABS = [['e21cc', '#/', 'E21CC', 'wheel'], ['grow', '#/journal/grow', 'GROW', 'grow'], ['act', '#/journal/act', 'ACT', 'act'], ['settings', '#/settings', 'Settings', 'sliders']];
function frame(inner, active, opts = {}){
  document.body.classList.toggle('wide', !!opts.wide);
  const t = logTitle();
  $('#app').innerHTML = `
    <header class="cover">
      <a class="homebtn" href="#/">${icon('home')}<span>Home</span></a>
      <div class="brand"><span class="word">${esc(t)}</span><span class="sub">${esc(me.name)}${t !== APP_NAME ? ' · ' + APP_NAME : ''}</span></div>
      <a class="avatar" href="#/settings" aria-label="Settings for ${esc(me.name)}">${avatarSvg(me.prefs.avatar)}</a>
    </header>
    <nav class="tabs" aria-label="Sections of the log">${TABS.map(([id, href, label, ic]) => `<a class="tab t-${id}${active === id ? ' on' : ''}" href="${href}"${active === id ? ' aria-current="page"' : ''}>${icon(ic)}<span>${label}</span></a>`).join('')}</nav>
    <main class="page fade${opts.ribbon ? ' ribbon' : ''}" id="main" tabindex="-1">${inner}</main>
    <footer class="footer"><b>Beatty Secondary School</b> · Non Vi Sed Arte<br>Your log is saved on this device${GUEST ? ' (guest: nothing is saved)' : ''}. Export a copy in Settings now and then.</footer>`;
  scrollTop();
}
function scrollTop(){ window.scrollTo(0, 0); if (EMBED){ try{ document.documentElement.scrollIntoView({block:'start'}); }catch{} } }

/* ---------- welcome, then a first page that makes it yours ---------- */
function renderWelcome(){
  document.body.classList.remove('wide');
  const profiles = Object.values(db.profiles).sort((a, b) => b.created - a.created);
  const pre = db._preClass || '';
  $('#app').innerHTML = `
  <div class="welcome">
    <section class="cover-big fade">
      <img src="assets/crest.png" alt="" class="crest">
      <h1>E21CC<br>Learning Log</h1>
      <p class="motto">GROW by reflecting. ACT on feedback.</p>
      <p class="meta">One log for everything you learn at Beatty: lessons, CCA, camps and competitions. Each entry gets feedback on the 21st Century Competencies your writing shows.</p>
      <div class="cover-tabs" aria-hidden="true"><span class="t-e21cc">E21CC</span><span class="t-grow">GROW</span><span class="t-act">ACT</span></div>
    </section>
    ${profiles.length ? `<section class="card fade"><h2>Welcome back</h2><div class="profiles">${profiles.map(p => `
      <button class="pcard" data-id="${p.id}"><span class="avatar">${avatarSvg(p.prefs.avatar)}</span><span><b>${esc(p.name)}</b><small>${plural(p.entries.length, 'entry', 'entries')}${p.pin ? ' · PIN' : ''}</small></span></button>`).join('')}</div>
      <div id="pinBox" hidden style="margin-top:12px"></div>
      </section>` : ''}
    <section class="card fade">
      <h2>${profiles.length ? 'Someone new?' : 'Start your log'}</h2>
      <form id="newForm" autocomplete="on">
        <label class="f"><span>Your name</span><input class="in" name="name" required maxlength="60" placeholder="What your teachers call you" autocapitalize="words" autocomplete="name" enterkeyhint="next"></label>
        <label class="f"><span>School email <small style="display:inline">(optional)</small></span><input class="in" name="email" type="email" inputmode="email" maxlength="120" placeholder="name@students.edu.sg" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="email" enterkeyhint="next"><small>Only needed if you share with a teacher. It is never sent to the AI coach.</small></label>
        ${pre ? `<label class="f"><span>Group code</span><input class="in" name="classCode" maxlength="16" value="${esc(pre)}" style="text-transform:uppercase" autocapitalize="characters" autocorrect="off" spellcheck="false" autocomplete="off"><small>From your teacher.</small></label>` : ''}
        <label class="f"><span>4 digit PIN <small style="display:inline">(optional)</small></span><input class="in" name="pin" inputmode="numeric" pattern="\\d{4}" maxlength="4" placeholder="For shared devices" autocomplete="off" enterkeyhint="done"><small>Stops classmates opening your log on a shared laptop.</small></label>
        <button class="btn wide" type="submit">${icon('arrow')} Open my log</button>
      </form>
      <p class="tiny" style="margin-top:12px">Nothing here goes to a server unless you turn on an AI coach or share. Your log is saved in this browser, so export it from Settings now and then. <a href="?guest=1#/welcome">Try as a guest</a> (nothing saved).</p>
    </section>
  </div>`;
  $$('.pcard').forEach(b => b.onclick = () => pickProfile(b.dataset.id));
  $('#newForm').onsubmit = async (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    const name = String(f.get('name') || '').trim(); if (!name) return;
    const p = newProfile(name, f.get('email'), String(f.get('classCode') || ''));
    const pin = String(f.get('pin') || '').trim(); if (/^\d{4}$/.test(pin)) p.pin = await hashPin(p.email || p.id, pin);
    db.profiles[p.id] = p; db.current = p.id; delete db._preClass; me = p; unlocked = true;
    for (const g of me.groups) if (db.groups[g.code]) adoptGroup(db.groups[g.code]);
    saveDb(); applyPrefs();
    Promise.all(me.groups.map(g => loadGroup(g.code))).then(loadStatements);
    location.hash = '#/setup'; processStashedLink();
  };
}
async function openProfile(id){
  const p = db.profiles[id]; db.current = id; me = p; unlocked = true; saveDb(); applyPrefs();
  Promise.all(p.groups.map(g => loadGroup(g.code))).then(loadStatements).then(() => { if ((location.hash || '#/') === '#/') route(); });
  location.hash = '#/'; route(); processStashedLink();
}
async function pickProfile(id){
  const p = db.profiles[id]; if (!p) return;
  if (!p.pin) return openProfile(id);
  const box = $('#pinBox'); box.hidden = false;
  box.innerHTML = `<form id="pinForm" class="row"><label class="f grow" style="margin:0"><span>PIN for ${esc(p.name)}</span><input class="in" name="pin" inputmode="numeric" maxlength="4" autofocus autocomplete="off" enterkeyhint="done"></label><button class="btn" type="submit" style="margin-top:22px">Open</button></form><p class="tiny" id="pinMsg"></p>`;
  $('#pinForm').onsubmit = async (e) => {
    e.preventDefault(); const pin = new FormData(e.target).get('pin');
    if (await pinMatches(p, pin)) openProfile(id);
    else $('#pinMsg').textContent = 'That PIN did not match. Forgotten it? A new profile can import an exported log.';
  };
  $('#pinForm input').focus();
}
/* First page after the name: subjects, CCA, a cover and an icon. All of it can wait. */
function renderSetup(){
  frame(`
    <section class="hero"><h1>Make it yours</h1><p class="meta">Your subjects and CCA become bookmarks in your journals. You can change all of this later in Settings.</p></section>
    ${experiencesEditor()}
    <section class="card"><h2>Your cover</h2>${coverPicker()}<span class="flabel" style="margin-top:14px">Your icon</span>${iconPicker()}</section>
    <div class="row" style="justify-content:space-between;margin-top:6px"><a class="btn ghost" href="#/">Skip for now</a><a class="btn acc" href="#/">${icon('check')} Open my log</a></div>
  `, 'settings');
  wireExperiences(renderSetup); wireCover(); wireIconPicker();
}

/* ---------- the E21CC tab: the competency wheel ---------- */
const DOMAIN_COLOUR = {cait:'#1f3fa8', cci:'#0f7a6b', cgc:'#b23a48', sec:'#c98a00'};
const WHEEL_LABEL = {critical:['Critical'], adaptive:['Adaptive'], inventive:['Inventive'], communication:['Communication'], collaboration:['Collaboration'], information:['Information'],
  civic:['Civic'], global:['Global'], crosscultural:['Cross', 'cultural'], selfaware:['Self', 'awareness'], selfmanage:['Self', 'management'], socialaware:['Social', 'awareness'], relationship:['Relationships'], decisions:['Decisions']};
const LEVEL_WORD = ['no evidence yet', 'a glimpse or a claim', 'clear evidence', 'strong evidence'];
function weekKey(t){ const d = new Date(t); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); d.setHours(0, 0, 0, 0); return d.getTime(); }
function streak(entries){ const weeks = new Set(entries.map(e => weekKey(e.created))); let n = 0; let w = weekKey(Date.now()); if (!weeks.has(w)) w -= 7 * 864e5; while (weeks.has(w)){ n++; w -= 7 * 864e5; } return n; }
/* How each competency stands: the strongest evidence (3 strong, 2 clear, 1 glimpse or claim), entries, statements lit. */
function compLevelOf(e, id){
  let lv = 0;
  // a quote the coach could not find in the student's words counts for nothing
  for (const v of ((e.e21cc && e.e21cc.evidence) || [])) if (v.id === id && !v.unverified) lv = Math.max(lv, v.strength === 'strong' ? 3 : v.strength === 'clear' ? 2 : 1);
  if (!lv && (e.competencies || []).some(t => t.id === id)) lv = 1;
  return lv;
}
function compStats(){
  const st = {}; for (const c of COMPETENCIES) st[c.id] = {level:0, n:0, g:0, a:0, lit:0, total:0, last:0};
  for (const e of me.entries){ if (e.kind === 'across') continue; for (const c of COMPETENCIES){ const lv = compLevelOf(e, c.id); if (lv){ const s = st[c.id]; s.level = Math.max(s.level, lv); s.n++; if (e.kind === 'act') s.a++; else s.g++; s.last = Math.max(s.last, e.created); } } }
  for (const s of myStatements()) for (const cid of s.competencies){ if (!st[cid]) continue; st[cid].total++; if (statementStatus(me.entries, s).lit) st[cid].lit++; }
  return st;
}
/* "from 2 GROW and 1 ACT entry": both journals feed the wheel, and the student can see it */
function fromLine(x){ const parts = []; if (x.g) parts.push(`${x.g} GROW`); if (x.a) parts.push(`${x.a} ACT`); return parts.length ? `from ${parts.join(' and ')} ${x.n === 1 ? 'entry' : 'entries'}` : 'no entries yet'; }
const STAR = '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>';
function sector(cx, cy, r0, r1, a0, a1){
  const P = (r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
  const [x0, y0] = P(r1, a0), [x1, y1] = P(r1, a1), [x2, y2] = P(r0, a1), [x3, y3] = P(r0, a0); const big = a1 - a0 > 180 ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r1} ${r1} 0 ${big} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}A${r0} ${r0} 0 ${big} 0 ${x3.toFixed(2)} ${y3.toFixed(2)}Z`;
}
/* MOE's framework drawn as rings: values at the centre, the five social and
   emotional competencies around them, the nine emerging competencies outside.
   Each segment deepens with the strongest evidence in the student's words. */
function wheelSvg(st){
  const cx = 160, cy = 160; let s = `<svg class="wheel" viewBox="0 0 320 320" role="group" aria-label="Your 21st Century Competencies">`;
  const seg = (c, r0, r1, a0, a1, fs) => {
    const x = st[c.id]; const col = DOMAIN_COLOUR[c.d]; const op = [0, .3, .62, .95][x.level];
    const mid = (a0 + a1) / 2, rm = (r0 + r1) / 2; const tx = cx + rm * Math.cos(mid * Math.PI / 180), ty = cy + rm * Math.sin(mid * Math.PI / 180);
    const rot = mid > 0 && mid < 180 ? mid - 90 : mid + 90; const lines = WHEEL_LABEL[c.id] || [c.label];
    const label = `${c.label}: ${LEVEL_WORD[x.level]}, ${fromLine(x)}${x.total ? `, ${x.lit} of ${x.total} statements unlocked` : ''}. Open.`;
    let g = `<a href="#/c/${c.id}" class="seg lv${x.level}" aria-label="${esc(label)}"><title>${esc(label)}</title>`;
    g += `<path d="${sector(cx, cy, r0, r1, a0, a1)}" class="segbg"/>${x.level ? `<path d="${sector(cx, cy, r0, r1, a0, a1)}" fill="${col}" fill-opacity="${op}"/>` : ''}<path d="${sector(cx, cy, r0, r1, a0, a1)}" class="segline" stroke="${col}"/>`;
    g += `<text transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) rotate(${rot.toFixed(1)})" text-anchor="middle" font-size="${fs}" class="${x.level >= 2 ? 'on' : ''}">${lines.map((l, i) => `<tspan x="0" dy="${i === 0 ? (lines.length > 1 ? -fs * .2 : fs * .35) : fs * 1.1}">${esc(l)}</tspan>`).join('')}</text>`;
    if (x.lit){ const ra = r1 - 7, sx = cx + ra * Math.cos(a1 * Math.PI / 180 - .16), sy = cy + ra * Math.sin(a1 * Math.PI / 180 - .16); g += `<path class="star" transform="translate(${(sx - 6).toFixed(1)} ${(sy - 6).toFixed(1)}) scale(.5)" d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>`; }
    return g + '</a>';
  };
  // the nine emerging competencies, three domains of 120 degrees, Thinking at the top
  const outer = ['cait', 'cci', 'cgc'].flatMap(d => COMPETENCIES.filter(c => c.d === d));
  outer.forEach((c, i) => { const a0 = -150 + i * 40; s += seg(c, 104, 156, a0 + .6, a0 + 40 - .6, 9.5); });
  COMPETENCIES.filter(c => c.d === 'sec').forEach((c, i) => { const a0 = -126 + i * 72; s += seg(c, 50, 100, a0 + .8, a0 + 72 - .8, 8.6); });
  s += `<circle cx="${cx}" cy="${cy}" r="46" class="core"/><text x="${cx}" y="${cy - 3}" text-anchor="middle" font-size="11" class="corelabel">Core</text><text x="${cx}" y="${cy + 11}" text-anchor="middle" font-size="11" class="corelabel">values</text>`;
  return s + '</svg>';
}
function domainLegend(){ return `<div class="dlegend">${DOMAINS.map(d => `<span><i style="background:${DOMAIN_COLOUR[d.id]}"></i>${esc(d.short)}</span>`).join('')}</div>`; }
function renderHome(){
  const E = me.entries.slice().sort((a, b) => b.created - a.created); const st = compStats(); const tp = termPos(Date.now()); const s = streak(E);
  const ranked = COMPETENCIES.map(c => Object.assign({c}, st[c.id])).sort((a, b) => b.level - a.level || b.n - a.n);
  const strong = ranked.filter(x => x.level).slice(0, 3); const quiet = ranked.filter(x => !x.level).slice(0, 4);
  const latest = E.find(e => e.kind !== 'across' && e.e21cc);
  const unread = E.flatMap(e => (e.notes || []).filter(n => !n.seen).map(n => ({e, n})));
  const nextEntry = E.find(e => nextStepOf(e) && !me.done[e.id]);
  const drafts = Object.keys(me.drafts || {}).filter(k => draftHasWork(me.drafts[k]));
  const termEnd = tp.inTerm ? termsFor(tp.year)[tp.term - 1].end : 0; const daysLeft = termEnd ? Math.ceil((termEnd - Date.now()) / 864e5) : 0;
  const acrossDone = new Set(me.entries.filter(e => e.kind === 'across' && e.term === termKey(Date.now())).map(e => e.basket));
  const fed = k => E.filter(e => e.kind === k && COMPETENCIES.some(c => compLevelOf(e, c.id))).length;
  frame(`<div class="homegrid">
    <section class="titlepage">
      <p class="kicker">${tp.inTerm ? `Term ${tp.term} · Week ${tp.week}` : 'School holidays'}${E.length ? ` · ${plural(E.length, 'entry', 'entries')}${s ? ` · ${s} week${s > 1 ? 's' : ''} in a row` : ''}` : ''}</p>
      <h1>Your competencies</h1>
      <p class="lede">Every GROW and ACT entry you write adds to this wheel.</p>
      <div class="wheelwrap">${wheelSvg(st)}</div>
      ${domainLegend()}
      <p class="tiny" style="text-align:center;margin:6px 0 0">The more clearly your words show a competency, the darker its part of the wheel. <svg class="istar" viewBox="0 0 24 24" aria-hidden="true">${STAR}</svg> marks an I can statement you have unlocked. Tap any part to see more.</p>
    </section>
    <div class="homeside">
    <div class="acts">
      <a class="actcard" href="#/write/grow"><span class="badge b-grow">GROW</span><b>New GROW entry</b><span class="sub">After a lesson, a training or a camp day${drafts.includes('grow') ? '. You have one unfinished.' : ''}</span></a>
      <a class="actcard" href="#/write/act"><span class="badge b-act">ACT</span><b>New ACT entry</b><span class="sub">After you get feedback on your work${drafts.includes('act') ? '. You have one unfinished.' : ''}</span></a>
    </div>
    ${unread.length ? `<a class="card notecard" href="#/entry/${unread[0].e.id}">${icon('note')}<span><b>${plural(unread.length, 'new note')} from ${esc(unread[0].n.by)}</b><small>On ${esc(entryTitle(unread[0].e))}</small></span></a>` : ''}
    ${E.length ? `<section class="card"><h2>Where you stand</h2>
      <p class="tiny" style="margin:0 0 8px">Your wheel uses ${plural(fed('grow'), 'GROW entry', 'GROW entries')} and ${plural(fed('act'), 'ACT entry', 'ACT entries')}.</p>
      ${strong.length ? `<span class="kick">Shown most</span><div class="chips">${strong.map(x => `<a class="chip dchip" style="--d:${DOMAIN_COLOUR[x.c.d]}" href="#/c/${x.c.id}">${esc(x.c.label)}<small>${[x.g ? x.g + ' GROW' : '', x.a ? x.a + ' ACT' : ''].filter(Boolean).join(', ')}</small></a>`).join('')}</div>` : ''}
      ${quiet.length ? `<span class="kick" style="margin-top:10px">Not shown yet</span><div class="chips">${quiet.map(x => `<a class="chip dchip quiet" style="--d:${DOMAIN_COLOUR[x.c.d]}" href="#/c/${x.c.id}">${esc(x.c.label)}</a>`).join('')}</div><p class="tiny" style="margin:8px 0 0">You have not written about these yet. Tap one to see what it looks like.</p>` : ''}
    </section>` : `<section class="card"><h2>How the wheel fills</h2><p class="muted" style="margin:0">Write a GROW entry after a lesson, a training or a camp day, or an ACT entry when you get feedback. Either one fills the wheel. Claim a competency and say where it shows. When your words show it, that part of the wheel gets darker.</p></section>`}
    ${latest ? `<a class="card latest" href="#/entry/${latest.id}"><span class="kick">Latest feedback · ${esc(entryTitle(latest))}</span>${latestLine(latest)}</a>` : ''}
    ${tp.inTerm && daysLeft <= 21 && acrossDone.size < 4 ? `<section class="card flat"><h2>Term ${tp.term} ends in ${plural(daysLeft, 'day')}</h2><p class="muted">Choose one area. Read what you wrote this term, then answer three questions.</p><div class="chips">${DOMAINS.map(d => `<a class="chip ${acrossDone.has(d.id) ? 'on' : ''}" href="#/across/${d.id}">${acrossDone.has(d.id) ? icon('check') : ''}${esc(d.short)}</a>`).join('')}</div></section>` : ''}
    ${nextEntry ? `<section class="card"><h2>Your next step</h2><label class="next"><input type="checkbox" id="doneNext"><p>${esc(nextStepOf(nextEntry))}</p></label><p class="tiny" style="margin:8px 0 0">From your ${FRAMEWORKS[nextEntry.kind].name} entry on ${fmtDay(nextEntry.created)}. Tick it when you have done it.</p></section>` : ''}
    </div></div>`, 'e21cc', {ribbon:true, wide:true});
  const cb = $('#doneNext'); if (cb) cb.onchange = () => { me.done[nextEntry.id] = true; saveDb(); toast('Done. Well done for following through.'); setTimeout(route, 400); };
}
function latestLine(e){
  const x = e.e21cc; const ev = (x.evidence || []).filter(v => !v.unverified && v.strength !== 'glimpse')[0];
  const c = coachOf(e);
  return `${ev ? `<p style="margin:4px 0 0"><b>${esc(compOf(ev.id).label)}</b> <span class="str ${ev.strength}">${STRENGTHS[ev.strength].label}</span></p>${ev.quote ? `<q>${esc(ev.quote)}</q>` : ''}` : `<p class="muted" style="margin:4px 0 0">${esc(x.stance_note || '')}</p>`}${c && c.question ? `<p class="ask">${esc(c.question)}</p>` : ''}`;
}

/* ---------- a competency: what it means, its statements, the entries that show it ---------- */
function stmtRow(st, compId){
  const s = st.stmt;
  const ev = st.links.map(k => `<div class="ev ${k.backed ? 'ok' : ''}"><div class="row" style="justify-content:space-between;gap:6px"><a href="#/entry/${k.e.id}"><span class="badge b-${k.e.kind}" style="margin-right:6px">${FRAMEWORKS[k.e.kind].name}</span>${esc(entryTitle(k.e))}, ${fmtDay(k.e.created)}</a><span class="str ${k.backed ? 'strong' : 'none'}">${k.backed ? 'Backed' : 'Not backed yet'}</span></div>${k.l.quote ? `<q>${esc(k.l.quote)}</q>` : ''}<button class="linkbtn" data-unlink="${k.e.id}|${esc(s.id)}">Unlink</button></div>`).join('');
  const sug = st.suggested.slice(0, 2).map(e => { const m = ((e.e21cc && e.e21cc.statements) || []).find(x => x.sid === s.id); return `<div class="sugg"><span class="kick">The coach suggests</span><a href="#/entry/${e.id}"><span class="badge b-${e.kind}" style="margin-right:6px">${FRAMEWORKS[e.kind].name}</span>${esc(entryTitle(e))}, ${fmtDay(e.created)}</a>${m && m.quote ? `<q>${esc(m.quote)}</q>` : ''}<button class="btn small sec" data-linkit="${e.id}|${esc(s.id)}">${icon('link')} Link it</button></div>`; }).join('');
  const probe = (compOf(compId) || {}).probe || '';
  return `<li class="st ${st.state}"><span class="mark" aria-hidden="true"></span><div class="grow">
    <p class="st-text">${s.level ? `<span class="lvl">${s.level === 1 ? 'Starting' : 'Stretching'}</span> ` : ''}${esc(s.text)}<span class="sr"> (${st.state === 'lit' ? 'unlocked' : st.state === 'linked' ? 'linked, not backed yet' : 'no evidence yet'})</span></p>
    ${ev}${st.state === 'linked' ? `<small class="muted">Linked, but your words do not show it yet. ${esc(probe)}</small>` : ''}${sug}
    <button class="btn small ${st.links.length ? 'ghost' : 'sec'}" data-linkone="${esc(s.id)}">${icon('link')} ${st.links.length ? 'Link another' : 'Link an entry'}</button></div></li>`;
}
function wireStmtButtons(compId){
  $$('[data-linkone]').forEach(b => b.onclick = () => linkDialog(b.dataset.linkone, compId));
  $$('[data-linkit]').forEach(b => b.onclick = () => { const [eid, sid] = b.dataset.linkit.split('|'); const e = me.entries.find(x => x.id === eid); const m = ((e.e21cc && e.e21cc.statements) || []).find(x => x.sid === sid); addLink(e, sid, m ? m.quote : ''); });
  $$('[data-unlink]').forEach(b => b.onclick = () => { const [eid, sid] = b.dataset.unlink.split('|'); const e = me.entries.find(x => x.id === eid); if (e){ e.links = e.links.filter(l => l.sid !== sid); saveDb(); toast('Unlinked.'); route(); } });
}
function bestQuote(e, id){ return ((e.e21cc && e.e21cc.evidence) || []).filter(v => v.id === id && v.quote && !v.unverified).sort((a, b) => ({strong:3, clear:2, glimpse:1}[b.strength] - {strong:3, clear:2, glimpse:1}[a.strength]))[0] || null; }
function renderCompetency(id){
  const c = compOf(id); if (!c){ location.hash = '#/'; return; }
  const d = basketOf(c.d); const st = compStats()[id];
  const stmts = myStatements().filter(s => s.competencies.includes(id)).map(s => statementStatus(me.entries, s));
  const shows = me.entries.filter(e => e.kind !== 'across' && compLevelOf(e, id)).sort((a, b) => compLevelOf(b, id) - compLevelOf(a, id) || b.created - a.created);
  const tk = termKey(Date.now()); const across = me.entries.find(e => e.kind === 'across' && e.basket === c.d && e.term === tk);
  frame(`
    <section class="hero comp-hero" style="--d:${DOMAIN_COLOUR[c.d]}">
      <p class="kicker"><a href="#/">E21CC</a> · ${esc(d.label)}</p>
      <h1>${esc(c.label)}</h1>
      <p class="plain">${esc(c.plain)}</p>
      <p class="meta"><span class="lvlbar">${[1, 2, 3].map(n => `<i class="${st.level >= n ? 'on' : ''}"></i>`).join('')}</span> ${LEVEL_WORD[st.level][0].toUpperCase() + LEVEL_WORD[st.level].slice(1)} · ${fromLine(st)}${st.total ? ` · ${st.lit} of ${st.total} statements unlocked` : ''}</p>
    </section>
    ${STMT_SET.placeholder ? `<div class="notice">Starter statements. The school’s own I can statements will replace them.</div>` : ''}
    <section class="card"><h2>I can</h2>
      <p class="tiny" style="margin:0 0 10px">To unlock a statement, link an entry whose words show it.</p>
      ${stmts.length ? `<ul class="stmts">${stmts.map(x => stmtRow(x, id)).join('')}</ul>` : '<p class="muted">No statements for this competency yet.</p>'}
    </section>
    <section class="card"><h2>Where it shows in your log</h2>${shows.length ? `<p class="tiny" style="margin:0 0 8px">${fromLine(st)[0].toUpperCase() + fromLine(st).slice(1)}. GROW and ACT entries both count.</p>` : ''}
      ${shows.length ? `<ul class="evid">${shows.map(e => { const q = bestQuote(e, id); const lv = compLevelOf(e, id); return `<li><span class="badge b-${e.kind}">${FRAMEWORKS[e.kind].name}</span> <a href="#/entry/${e.id}"><b>${esc(entryTitle(e))}</b></a> <span class="tiny">${fmtDay(e.created)}</span> <span class="str ${lv === 3 ? 'strong' : lv === 2 ? 'clear' : 'none'}">${lv === 3 ? 'Strong' : lv === 2 ? 'Clear' : 'Glimpse or claim'}</span>${q ? `<q>${esc(q.quote)}</q>` : ''}</li>`; }).join('')}</ul>` : `<p class="muted">Not in your log yet. ${esc(c.probe)}</p>`}
    </section>
    <section class="card flat"><h2>Go deeper</h2><p class="ask">${esc(c.probe)}</p>
      <p class="tiny" style="margin-top:10px">Once a term, look across ${esc(d.short.toLowerCase())}: ${across ? `<a href="#/entry/${across.id}">read this term’s look across</a>` : `<a href="#/across/${c.d}">look across ${termLabel(tk)}</a>`}.</p></section>
  `, 'e21cc');
  wireStmtButtons(id);
}
function addLink(e, sid, quote){
  if (!e) return; const s = statementById(sid);
  e.links = (e.links || []).filter(l => l.sid !== sid); e.links.push({sid, quote:String(quote || '').slice(0, 400), at:Date.now()}); saveDb();
  closeDialog();
  toast(s && linkBacked(e, s) ? 'Linked, and your words back it. The statement is unlocked.' : 'Linked. The coach has not seen it in your words yet.', 3400);
  route();
}
/* Link an entry: pick an entry, then the sentence of yours that shows the statement. */
function linkDialog(sid, compId){
  const s = statementById(sid); if (!s) return;
  const showing = me.entries.filter(e => e.kind !== 'across' && compLevelOf(e, compId)).sort((a, b) => b.created - a.created);
  const others = me.entries.filter(e => e.kind !== 'across' && !showing.includes(e)).sort((a, b) => b.created - a.created).slice(0, 20);
  const btn = e => `<button class="entry" data-e="${e.id}">${medal(e.kind)}<span class="grow"><b>${esc(entryTitle(e))}</b><small>${fmtDay(e.created)}${(e.links || []).some(l => l.sid === sid) ? ' · already linked' : ''}</small></span></button>`;
  dialog(`<h2>Link an entry</h2><p class="st-quote">${esc(s.text)}</p>
    ${showing.length ? `<span class="kick">Entries that show ${esc(compOf(compId).label.toLowerCase())}</span>${showing.map(btn).join('')}` : ''}
    ${others.length ? `<span class="kick" style="margin-top:10px">Other entries</span>${others.map(btn).join('')}` : ''}
    ${!showing.length && !others.length ? '<p class="muted">Write a GROW or ACT entry first, then link it here.</p>' : ''}
    <div class="row" style="margin-top:12px"><button class="btn sec" id="dClose">Cancel</button></div>`);
  $('#dClose').onclick = closeDialog;
  $$('#dlgBody [data-e], #inlineDlg [data-e]').forEach(b => b.onclick = () => {
    const e = me.entries.find(x => x.id === b.dataset.e); const sents = sentencesOf(entryAnswersText(e));
    const sug = ((e.e21cc && e.e21cc.statements) || []).find(x => x.sid === sid);
    const pre = sug ? sents.findIndex(t => normText(t).includes(normText(sug.quote)) || normText(sug.quote).includes(normText(t))) : -1;
    dialog(`<h2>Which words show it?</h2><p class="st-quote">${esc(s.text)}</p><p class="tiny">Pick the sentence from “${esc(entryTitle(e))}” that shows this.</p>
      <div class="stack" id="sentList">${sents.map((t, i) => `<label class="pick-row"><input type="radio" name="sent" value="${i}" ${i === (pre >= 0 ? pre : 0) ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('') || '<p class="muted">This entry has no words yet.</p>'}</div>
      <div class="row" style="margin-top:12px"><button class="btn" id="dLink" ${sents.length ? '' : 'disabled'}>${icon('link')} Link</button><button class="btn sec" id="dBack">Back</button></div>`);
    $('#dBack').onclick = () => linkDialog(sid, compId);
    $('#dLink').onclick = () => { const r = $$('#sentList input').find(x => x.checked); addLink(e, sid, r ? sents[+r.value] : ''); };
  });
}

/* ---------- composer: GROW, ACT, and the termly look across ---------- */
function draftKey(kind, basket){ return kind === 'across' ? 'across:' + basket : kind; }
function draftHasWork(d){ return !!d && (Object.values(d.answers || {}).some(v => String(v || '').trim()) || !!(d.context && d.context.name) || !!d.subject || !!String(d.topic || '').trim()); }
function freshDraft(kind, key, basket){ return {kind, key, step:0, context:{type:'subject', name:''}, topic:'', groupCode:'', feedbackFrom:'teacher', feedbackText:'', answers:{}, competencies:[], basket:basket || null, term:termKey(Date.now()), started:Date.now()}; }
function applyPrefill(pre){ const i = pre.indexOf(':'); draft.context = {type:pre.slice(0, i) || 'subject', name:pre.slice(i + 1)}; draft.step = 0; matchGroup(); }
function openComposer(kind, editId, basket){
  if (kind === 'across' && !basketOf(basket)){ location.hash = '#/'; return; }
  const key = draftKey(kind, basket);
  if (!draft || draft.key !== key || (editId && draft.editId !== editId) || (!editId && draft.editId)){
    let base = me.drafts[key] ? JSON.parse(JSON.stringify(me.drafts[key])) : null;
    // a Learning Log draft carries a subject, not a context; it comes back only if the student chooses to continue it
    if (base && !base.context && base.subject) base.context = {type:inferContextType(base.subject), name:base.subject};
    let ask = false;
    if (editId){
      const e = me.entries.find(x => x.id === editId);
      if (e){ base = JSON.parse(JSON.stringify(e)); base.coachAi = e.coach && e.coach.ai ? JSON.parse(JSON.stringify(e.coach.ai)) : null;
        // reads made before v2 carry no hash: they were made on these words
        if (base.coachAi && !base.coachAi.inputHash) base.coachAi.inputHash = inputHash(e, myStatements()); }
    } else if (base && kind !== 'across' && draftHasWork(base)) ask = true;
    else if (base && kind !== 'across') base = null;
    draft = Object.assign(freshDraft(kind, key, basket), base || {});
    draft.key = key; draft.editId = editId || null; draft.step = draft.step || 0; draft._ask = ask;
    if (!draft.context) draft.context = {type:inferContextType(draft.subject), name:draft.subject || ''};
    // nothing is assumed: the subject or experience comes from the student, or from the bookmark they started at
    draft._pre = kind !== 'across' && !editId ? hashParts().q.get('x') || '' : '';
    if (draft._pre && !ask) applyPrefill(draft._pre);
    if (kind === 'across') draft.lookedAt = acrossEvidence(basket, draft.term).map(x => ({eid:x.e.id, quote:x.q.quote})).slice(0, 8);
  }
  renderComposer();
}
function closeComposer(){ $('#sheet').innerHTML = ''; document.body.classList.remove('composing'); }
function saveDraft(){
  if (!draft || draft._ask) return; const d = Object.assign({}, draft); delete d.editId; delete d.coachAi; delete d._ask; delete d._pre; d.saved = Date.now();
  if (!draft.editId){ me.drafts[draft.key] = d; const p = $('#sheet .prog'); if (p && !$('.saved', p)) p.insertAdjacentHTML('beforeend', `<span class="saved">${icon('check')} Draft saved</span>`); }
  saveDb();
}
function stepsOf(){ const fw = FRAMEWORKS[draft.kind]; return draft.kind === 'across' ? ['evidence', ...fw.steps.map((_, i) => 'letter' + i), 'readback'] : ['context', ...fw.steps.map((_, i) => 'letter' + i), 'lens', 'readback']; }
/* An unfinished entry waits; the student decides whether to pick it up. */
function resumeCard(fw){
  const qs = fw.steps.flatMap(s => s.qs); const done = qs.filter(q => String(draft.answers[q.id] || '').trim()).length;
  const what = [draft.context.name, draft.topic].filter(Boolean).join(' · ') || 'No subject or experience chosen yet';
  const when = draft.saved;
  return `<div class="resume">${stepHead(null, fw.name + ' journal', `You have an unfinished ${fw.name} entry`)}
    <p style="margin:0 0 4px"><b>${esc(what)}</b></p>
    <p class="tiny">${when ? 'Last saved ' + fmtDay(when) + ' · ' : ''}${done} of ${qs.length} questions answered</p>
    <p class="muted">Do you want to continue it, or start a new one? Starting a new one deletes the unfinished entry.</p>
    <div class="row"><button class="btn" id="rContinue">${icon('edit')} Continue it</button><button class="btn sec" id="rNew">${icon('plus')} Start a new one</button></div></div>`;
}
function renderComposer(){
  const fw = FRAMEWORKS[draft.kind]; const steps = stepsOf(); const n = steps.length; const i = Math.min(draft.step, n - 1); const kind = steps[i];
  const ask = draft._ask; const counter = fw.tagline;
  let body = '';
  if (ask) body = resumeCard(fw);
  else if (kind === 'context') body = stepHead(null, counter, 'What is this entry about?') + contextStep(fw);
  else if (kind === 'evidence'){ const b = basketOf(draft.basket); body = stepHead({colour:'yellow', letter:'L'}, `${termLabel(draft.term)} · ${esc(b.short)}`, 'Read your <em>evidence</em>') + evidenceStep(); }
  else if (kind.startsWith('letter')){ const s = fw.steps[+kind.slice(6)]; body = stepHead(s, draft.kind === 'across' ? `Look across · ${esc(basketOf(draft.basket).short)}` : counter, s.title) + letterStep(s); }
  else if (kind === 'lens') body = stepHead(null, counter, 'Which <em>competency</em> did you use?') + lensStep();
  else body = stepHead(null, counter, 'Read it back') + readbackStep();
  const last = i === n - 1;
  const title = draft.kind === 'across' ? `Look across · ${basketOf(draft.basket).short}` : draft.editId ? `Editing ${fw.name} entry` : draft.context.name && !ask ? `${fw.name} · ${draft.context.name}` : `New ${fw.name} entry`;
  const saved = !draft.editId && !ask && me.drafts[draft.key];
  $('#sheet').innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="inner">
    <div class="bar"><button class="homebtn" id="cHome" type="button">${icon('home')}<span>Home</span></button><b>${esc(title)}</b><button class="roundbtn" id="cClose" type="button" aria-label="Close">${icon('close')}</button></div>
    ${ask ? '<div style="height:8px"></div>' : `<div class="prog"><span>Step ${i + 1} of ${n}</span><div class="track" aria-hidden="true"><i style="width:${Math.round((i + 1) / n * 100)}%"></i></div>${saved ? `<span class="saved">${icon('check')} Draft saved</span>` : ''}</div>`}
    <div class="card fade" id="main" tabindex="-1">${body}</div>
  </div>
  ${ask ? '' : `<div class="dock"><div class="inner">
    ${i > 0 ? `<button class="btn ghost" id="cBack" type="button">${icon('back')} Back</button>` : ''}
    ${last ? `<button class="btn acc go" id="cSave" type="button">${icon('check')} ${draft.editId ? 'Save changes' : 'Log it'}</button>` : `<button class="btn go" id="cNext" type="button">Next ${icon('arrow')}</button>`}
  </div></div>`}</div>`;
  const leave = to => { if (!draft._ask){ collect(); saveDraft(); } const kept = !draft._ask && !draft.editId && draftHasWork(draft); draft = null; location.hash = to; if (kept) toast('Draft saved. It will be waiting when you start a new entry.'); };
  $('#cHome').onclick = () => leave('#/');
  $('#cClose').onclick = () => leave(draftReturn());
  const rc = $('#rContinue'); if (rc) rc.onclick = () => { draft._ask = false; renderComposer(); };
  const rn = $('#rNew'); if (rn) rn.onclick = () => { delete me.drafts[draft.key]; saveDb(); const pre = draft._pre; draft = Object.assign(freshDraft(draft.kind, draft.key, draft.basket), {editId:null, _pre:pre}); if (pre) applyPrefill(pre); renderComposer(); };
  const bk = $('#cBack'); if (bk) bk.onclick = () => { collect(); draft.step = Math.max(0, i - 1); saveDraft(); renderComposer(); };
  const nx = $('#cNext'); if (nx) nx.onclick = () => {
    collect();
    if (kind === 'context'){
      if (!draft.context.name){ toast('First choose a subject or an experience.'); const f = $('.xchips .chip') || $('.tile') || $('[name=ctxName]'); if (f) f.focus(); return; }
      const undo = rememberExperience(draft.context);
      if (undo){ const nm = draft.context.name; toast(`${nm} is now in your ${draft.context.type === 'subject' ? 'subjects' : draft.context.type === 'cca' ? 'CCA list' : 'experiences'}.`, 5000, {label:'Undo', fn:undo, done:`${nm} removed from your list.`}); }
    }
    draft.step = i + 1; saveDraft(); renderComposer();
  };
  const sv = $('#cSave'); if (sv) sv.onclick = saveEntry;
  $$('textarea.in, input.in', $('#sheet')).forEach(t => t.addEventListener('focus', () => { setTimeout(() => { try{ t.scrollIntoView({block:'center', behavior:'smooth'}); }catch{} }, 250); }));
  $$('textarea.in', $('#sheet')).forEach(t => { autosize(t); t.addEventListener('input', () => { autosize(t); debounceSave(); }); });
  $$('input.in', $('#sheet')).forEach(t => t.addEventListener('input', () => { t.dataset.typed = '1'; debounceSave(); }));
  $$('[data-where]', $('#sheet')).forEach(inp => inp.addEventListener('input', () => { const t = (draft.competencies || []).find(x => x.id === inp.dataset.where); if (t) t.where = inp.value.trim(); }));
  wireStep();
  document.body.classList.add('composing'); document.body.classList.remove('wide');
  scrollTop();
  const first = $('.sheet textarea'); if (first && kind.startsWith('letter') && window.innerWidth > 760) first.focus();
}
function draftReturn(){ return !draft ? '#/' : draft.kind === 'across' ? '#/' : '#/journal/' + draft.kind; }
/* If a teacher's group teaches the chosen subject or CCA, link it; never pick a subject from the group. */
function matchGroup(){ if (!draft || draft.groupCode) return; const n = (draft.context.name || '').toLowerCase(); const g = myGroups().find(x => x.cfg && [x.cfg.subject, ...(x.cfg.subjects || [])].some(s => String(s || '').toLowerCase() === n)); if (g) draft.groupCode = g.code; }
let saveT = null; function debounceSave(){ clearTimeout(saveT); saveT = setTimeout(() => { if (!draft) return; collect(); saveDraft(); }, 400); }
function autosize(t){ t.style.height = 'auto'; t.style.height = Math.max(96, t.scrollHeight + 4) + 'px'; }
function stepHead(s, kicker, title){
  const m = s ? `<span class="medal ${s.colour}" aria-hidden="true">${s.letter}</span>` : `<span class="medal navy" aria-hidden="true">${icon('spark')}</span>`;
  return `<div class="stephead">${m}<div><div class="kicker">${kicker}</div><h1>${title}</h1></div></div>`;
}
function collect(){
  const sh = $('#sheet'); if (!sh || !draft || draft._ask) return;
  $$('[data-a]', sh).forEach(el => { draft.answers[el.dataset.a] = el.value; });
  const nm = $('[name=ctxName]', sh);
  if (nm){ const v = nm.value.trim(); if (v) draft.context = {type:draft._pick || draft.context.type || 'subject', name:v}; else if (nm.dataset.typed === '1') draft.context = {type:draft._pick || 'subject', name:''}; matchGroup(); }
  const top = $('[name=topic]', sh); if (top) draft.topic = top.value.trim();
  const g = $('[name=groupCode]', sh); if (g) draft.groupCode = g.value;
  const ft = $('[name=feedbackText]', sh); if (ft) draft.feedbackText = ft.value.trim();
}
/* A new subject or experience the student picks joins their list, so it is there next time. */
function rememberExperience(ctx){
  if (!ctx || !ctx.name || ctx.type === 'across' || myExperiences().some(x => x.name.toLowerCase() === ctx.name.toLowerCase())) return null;
  const x = me.experiences;
  if (ctx.type === 'subject') x.subjects.push(ctx.name);
  else if (ctx.type === 'cca') x.cca = [x.cca, ctx.name].filter(Boolean).join(', ');
  else x.others.push({type:ctx.type, name:ctx.name});
  saveDb();
  return () => {
    if (ctx.type === 'subject') x.subjects = x.subjects.filter(s => s !== ctx.name);
    else if (ctx.type === 'cca') x.cca = String(x.cca || '').split(/\s*,\s*/).filter(s => s && s !== ctx.name).join(', ');
    else x.others = x.others.filter(o => o.name !== ctx.name);
    saveDb();
  };
}
const PICK_TYPES = [['subject', 'Subject', 'book'], ['cca', 'CCA', 'users'], ['camp', 'Camp or trip', 'tent'], ['competition', 'Competition', 'trophy'], ['service', 'Service', 'heart'], ['other', 'Something else', 'spark']];
function typeIcon(t){ return (PICK_TYPES.find(p => p[0] === t) || PICK_TYPES[5])[2]; }
function groupLine(){
  const gs = myGroups(); if (!gs.length) return '';
  const g = gs.find(x => x.code === draft.groupCode);
  return `<div class="grpline"><span>Teacher’s group: <b>${g ? esc(g.cfg ? groupName(g.cfg) : g.code) : 'none'}</b></span><button type="button" class="linkbtn" id="grpChange" aria-expanded="${!!draft._grpOpen}">Change</button></div>
    ${draft._grpOpen ? `<label class="f" style="margin-top:6px"><span>Teacher’s group</span><select class="in" name="groupCode"><option value="">None</option>${gs.map(x => `<option value="${esc(x.code)}" ${draft.groupCode === x.code ? 'selected' : ''}>${esc(x.cfg ? groupName(x.cfg) : x.code)}</option>`).join('')}</select><small>The coach uses this teacher’s voice. This teacher can see the entry if you share it.</small></label>` : ''}`;
}
function contextStep(fw){
  const cur = draft.context || {type:'subject', name:''}; const curL = (cur.name || '').toLowerCase();
  const exps = myExperiences(); const recent = [];
  for (const e of me.entries.slice().sort((a, b) => b.created - a.created)){ const nm = e.context && e.context.name; if (nm && e.kind !== 'across' && ![...exps, ...recent].some(x => x.name.toLowerCase() === nm.toLowerCase())) recent.push({type:e.context.type, name:nm}); }
  const usual = [...exps, ...recent.slice(0, 4)];
  const inUsual = usual.some(x => x.name.toLowerCase() === curL);
  const ptype = draft._pick !== undefined && draft._pick !== null ? draft._pick : (cur.name && !inUsual ? cur.type : '');
  const chip = (x, withIcon = true) => { const on = x.name.toLowerCase() === curL; return `<button type="button" class="chip ${on ? 'on' : ''}" data-exp="${esc(x.type)}|${esc(x.name)}" aria-pressed="${on}">${withIcon ? icon(typeIcon(x.type)) : ''}${esc(x.name)}${withIcon && x.type === 'cca' ? ' <em>CCA</em>' : ''}</button>`; };
  let panel = '';
  if (ptype === 'subject'){
    const list = [...new Set([...SUBJECTS, ...(me.experiences.subjects || [])])];
    const typed = cur.type === 'subject' && cur.name && !list.some(x => x.toLowerCase() === curL);
    panel = `<span class="mini" id="pkSubj">Which subject?</span><div class="chips" role="group" aria-labelledby="pkSubj">${list.map(x => chip({type:'subject', name:x}, false)).join('')}</div>
      <label class="f" style="margin:12px 0 0"><span>Another subject</span><input class="in" name="ctxName" value="${typed ? esc(cur.name) : ''}" placeholder="e.g. Additional Mathematics" autocapitalize="words" autocomplete="off" maxlength="60"></label>`;
  } else if (ptype){
    const ct = contextTypeOf(ptype); const known = usual.filter(x => x.type === ptype);
    const typed = cur.type === ptype && cur.name && !known.some(x => x.name.toLowerCase() === curL);
    const label = ptype === 'cca' ? 'Your CCA' : ptype === 'other' ? 'Where did the learning happen?' : `Name of the ${ct.label.toLowerCase()}`;
    panel = `${known.length ? `<span class="mini" id="pkKnown">Yours so far</span><div class="chips" role="group" aria-labelledby="pkKnown">${known.map(x => chip(x, false)).join('')}</div>` : ''}
      <label class="f" style="margin:${known.length ? '12px' : '0'} 0 0"><span>${known.length ? (ptype === 'cca' ? 'Another CCA' : 'Another one') : label}</span><input class="in" name="ctxName" value="${typed ? esc(cur.name) : ''}" placeholder="${esc(ct.ph)}" autocapitalize="words" autocomplete="off" maxlength="60"></label>`;
  }
  const willAdd = cur.name && !exps.some(x => x.name.toLowerCase() === curL);
  const where = cur.type === 'subject' ? 'subjects' : cur.type === 'cca' ? 'CCA list' : 'experiences';
  const ct = contextTypeOf(cur.type);
  return `
    <p class="muted">${fw.id === 'grow' ? 'Write this soon after the lesson or activity. Two or three sentences for each question is enough.' : 'Write this when you get feedback: a marked piece of work, a comment from your coach, or a note from a friend.'}</p>
    ${usual.length ? `<span class="mini" id="pkUsual">Your usual</span><div class="chips xchips" role="group" aria-labelledby="pkUsual">${usual.map(x => chip(x)).join('')}</div>` : ''}
    <span class="mini" id="pkType">${usual.length ? 'Or choose a type' : 'Choose a type'}</span>
    <div class="tiles" role="group" aria-labelledby="pkType">${PICK_TYPES.map(([id, l, ic]) => `<button type="button" class="tile ${ptype === id ? 'on' : ''}" data-ptype="${id}" aria-expanded="${ptype === id}">${icon(ic)}${l}</button>`).join('')}</div>
    ${ptype ? `<div class="typepanel">${panel}${willAdd && cur.type === ptype ? `<p class="addhint">${icon('check')} ${esc(cur.name)} will be added to your ${where}.</p>` : ''}</div>` : willAdd ? `<p class="addhint">${icon('check')} ${esc(cur.name)} will be added to your ${where}.</p>` : ''}
    ${!usual.length ? `<p class="tiny" style="margin:10px 0 0">Tip: add your subjects and CCA in <a href="#/settings" id="toSettings">Settings</a>, and they will appear at the top.</p>` : ''}
    <label class="f" style="margin-top:16px"><span>${fw.id === 'grow' ? ct.topic : 'What was the feedback on?'} <small style="display:inline">(optional)</small></span><input class="in" name="topic" value="${esc(draft.topic)}" placeholder="${esc(fw.id === 'grow' ? ct.topicPh : 'e.g. Chemistry practical write up')}" maxlength="80"></label>
    ${groupLine()}
    ${fw.id === 'act' ? `
    <div class="f" style="margin-top:12px"><span class="flabel" id="fbLbl">Who gave the feedback?</span>
      <div class="seg" id="fbFrom" role="group" aria-labelledby="fbLbl">${['teacher','coach','peer','myself'].map(x => `<button type="button" data-v="${x}" class="${draft.feedbackFrom === x ? 'on' : ''}" aria-pressed="${draft.feedbackFrom === x}">${x === 'peer' ? 'A friend' : x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div></div>
    <label class="f" style="margin-top:12px"><span>What did they say? <small style="display:inline">(optional)</small></span><textarea class="in" name="feedbackText" placeholder="Type what they said, in their words if you can. This helps with the Connect step.">${esc(draft.feedbackText)}</textarea></label>` : ''}
    ${fw.id === 'grow' ? `<div class="notice"><b>GROW has four parts:</b> Gift, Rise, Own, Watch. Where a question says “lesson”, think of whatever you learnt from. The more you write, the more useful the feedback.</div>` : `<div class="notice"><b>ACT has three parts:</b> Acknowledge the feedback, Connect it to your goals, then Test one change.</div>`}`;
}
/* This term's evidence for a basket, strongest quote per entry. */
function acrossEvidence(basket, term){ return me.entries.filter(e => e.kind !== 'across' && termKey(e.created) === term && basketsOf(e).includes(basket)).map(e => ({e, q:quoteFor(e, basket)})).filter(x => x.q).sort((a, b) => a.e.created - b.e.created); }
function evidenceStep(){
  const b = basketOf(draft.basket); const ev = acrossEvidence(draft.basket, draft.term);
  const sts = myStatements().filter(s => s.basket === draft.basket).map(s => statementStatus(me.entries, s));
  return `<p class="muted">${esc(b.label)}. Read what you wrote this term before you answer. Look for things that happened more than once.</p>
    ${ev.length ? `<ul class="evid">${ev.map(x => `<li><b>${esc(entryTitle(x.e))}</b> <span class="tiny">${fmtDay(x.e.created)}</span><q>${esc(x.q.quote)}</q><span class="str ${x.q.strength}">${STRENGTHS[x.q.strength].label}</span> <small>${esc(compOf(x.q.id).label)}</small></li>`).join('')}</ul>` : `<div class="notice">You have no entries for this area this term yet. You can still answer: what did you notice about yourself here?</div>`}
    ${sts.length ? `<h2 style="margin-top:14px">Your statements</h2><ul class="stmts mini">${sts.map(st => `<li class="st ${st.state}"><span class="mark" aria-hidden="true"></span><span>${esc(st.stmt.text)}</span></li>`).join('')}</ul>` : ''}`;
}
function letterStep(s){
  return `${ringSvg(draft.kind, s.k)}` + s.qs.map(q => `
    <label class="q"><span>${q.q}</span>
      <textarea class="in" data-a="${q.id}" placeholder="${q.next ? 'Instead of “study more”, write what you will do, when and for how long.' : 'Two or three sentences are enough.'}">${esc(draft.answers[q.id] || '')}</textarea>
      ${q.next ? `<span class="hint">Write what you will do, when and where. For example: “Redo Q4 to Q6 on Tuesday after CCA, for 20 minutes, then check with Wei Ling.”</span>` : ''}
    </label>`).join('');
}
function lensStep(){
  const all = Object.values(draft.answers).join('\n'); const seen = detectCompetencies(all).slice(0, 3).map(x => x.c.id);
  const chosen = new Map((draft.competencies || []).map(t => [t.id, t]));
  return `
    <p class="muted">Choose up to two competencies you think this entry shows, and say where it shows. The coach checks your words for it. If your words show it, that part of your E21CC wheel gets darker. GROW and ACT entries both count.</p>
    ${DOMAINS.map(d => `<div class="domain"><h2>${esc(d.label)}</h2><div class="d">${esc(d.blurb)}</div>
      ${COMPETENCIES.filter(c => c.d === d.id).map(c => { const t = chosen.get(c.id); const on = !!t;
        return `<div class="comp ${on ? 'on' : ''}" data-c="${c.id}"><button type="button" class="pick" aria-pressed="${on}"><b>${esc(c.label)} ${seen.includes(c.id) && !on ? '<span class="tag">Maybe</span>' : ''}</b><span>${esc(c.plain)}</span></button>
          ${on ? `<div class="levels" role="group" aria-label="How far along">${LEVELS.map(l => `<button type="button" data-l="${l.n}" class="${t.level === l.n ? 'on' : ''}" title="${esc(l.help)}">${l.label}</button>`).join('')}</div>
          <label class="f" style="margin:10px 0 0"><span style="font-size:.92em">Where does it show? <small style="display:inline">(a few of your own words, optional)</small></span><input class="in" data-where="${c.id}" value="${esc(t.where || '')}" placeholder="e.g. when I checked both equations before deciding" maxlength="160"></label>` : ''}</div>`; }).join('')}
    </div>`).join('')}`;
}
function draftEntry(){
  const base = {id:draft.editId || draft._id || (draft._id = uid()), kind:draft.kind, created:draft.created || Date.now(), answers:draft.answers};
  if (draft.kind === 'across'){ const b = basketOf(draft.basket); return Object.assign(base, {basket:draft.basket, term:draft.term, context:{type:'across', name:b.label}, subject:b.short, topic:termLabel(draft.term), lookedAt:draft.lookedAt || [], groupCode:'', competencies:[]}); }
  return Object.assign(base, {context:{type:draft.context.type, name:draft.context.name}, subject:draft.context.name, topic:draft.topic, groupCode:draft.groupCode || '', feedbackFrom:draft.feedbackFrom, feedbackText:draft.feedbackText, competencies:draft.competencies || []});
}
function readbackStep(){
  const fw = FRAMEWORKS[draft.kind]; const entry = draftEntry(); const cls = groupFor(entry); const stmts = myStatements();
  const b = builtinCoach(entry, cls); const fresh = draft.coachAi && draft.coachAi.inputHash === inputHash(entry, stmts) ? draft.coachAi : null;
  const stale = draft.coachAi && !fresh; const mode = me.coach.mode; const left = readsLeft();
  return `
    <div class="readback">
      <p class="tiny">${esc(entryTitle(entry))} · ${fmtDate(Date.now())}</p>
      ${fw.steps.map(s => s.qs.map(q => `<div class="qa"><b>${s.letter} · ${q.q}</b><p class="${draft.answers[q.id] ? '' : 'empty'}">${esc(draft.answers[q.id] || 'Not answered')}</p></div>`).join('')).join('')}
      ${draft.kind !== 'across' ? `<p>${(draft.competencies || []).length ? '<span class="tiny">Your claim: </span>' + draft.competencies.map(t => { const c = compOf(t.id); const l = LEVELS.find(x => x.n === t.level); return `<span class="tag">${esc(c.label)}${l ? ' · ' + l.label : ''}</span>`; }).join('') : '<span class="tiny">No competency claimed.</span>'}</p>` : ''}
    </div>
    <h2 style="margin-top:14px">Feedback</h2>
    ${autoEval() && !fresh ? `<p class="tiny">When you log this, the coach reads it (without your name or email) and gives feedback. You can turn this off in Settings.</p>` : ''}
    ${stale ? `<div class="notice">You changed your words after the coach read them, so that feedback no longer applies. Ask again, or log the entry and the coach will read the new version.</div>` : ''}
    ${coachCard(fresh || b, cls, fresh ? fresh.e21cc : builtinE21cc(entry, stmts))}
    ${mode !== 'builtin' ? `<div class="row" style="margin-top:10px"><button class="btn sec" id="askAi" ${fresh || left <= 0 ? 'disabled' : ''}>${icon('spark')} ${draft.coachAi ? 'Ask again' : 'Ask the AI coach'}</button><span class="tiny" id="aiMsg">${fresh ? 'Change your words to ask again.' : left <= 0 ? `Today’s ${dailyLimit()} coach reads are used up.` : left !== Infinity ? `${left} of ${dailyLimit()} coach reads left today.` : 'Sends this entry to the coach, without your name or email.'}</span></div>` : `<p class="tiny" style="margin-top:8px">This feedback comes from the built in coach, which works offline. It checks for details, reasons and a next step with a day. You can turn on an AI coach in Settings.</p>`}`;
}
function coachWho(src, model, cls){
  if (src !== 'ai') return {name:'Built in coach', sub:'Checks for details, reasons and a next step', glyph:'bee'};
  const tone = (TONES[me.prefs.tone] || TONES.warm).label.toLowerCase();
  if (String(model || '').startsWith('gemini')) return {name:'Gemini coach', sub:`${String(model).replace(/^gemini:/, '')} · ${tone} tone`, glyph:'bulb'};
  return {name:cls && cls.teacherName ? cls.teacherName + '’s coach' : 'AI coach', sub:`Claude · ${tone} tone`, glyph:'owl'};
}
function coachCard(c, cls, x){
  const d = DEPTHS[c.depth] || DEPTHS.surface; const lvl = c.depth === 'deep' ? 3 : c.depth === 'working' ? 2 : 1;
  const w = coachWho(c.source, c.model, cls);
  const seen = x ? (x.evidence || []).filter(v => v.strength !== 'glimpse' && !v.unverified).slice(0, 3) : [];
  return `<div class="coach"><div class="who"><span class="avatar">${avatarSvg(w.glyph)}</span><div><b>${esc(w.name)}</b><small>${esc(w.sub)}</small></div></div>
    ${x ? `<div class="part"><b>E21CC</b>${seen.length ? `<div class="chips">${seen.map(v => `<span class="chip dchip" style="--d:${DOMAIN_COLOUR[compOf(v.id).d]}">${esc(compOf(v.id).label)}<small>${STRENGTHS[v.strength].label}</small></span>`).join('')}</div>` : `<p>${esc(x.stance_note || 'No competency shows clearly yet.')}</p>`}</div>` : ''}
    <div class="depth"><i class="${lvl >= 1 ? 'on' : ''}"></i><i class="${lvl >= 2 ? 'on' : ''}"></i><i class="${lvl >= 3 ? 'on' : ''}"></i><b>${d.label}</b><span class="tiny">${esc(d.help)}</span></div>
    <div class="part"><b>What went well</b><p>${esc(c.gift)}</p></div>
    <div class="part"><b>What to work on</b><p>${esc(c.stretch)}</p></div>
    <div class="part"><b>Competency</b><p>${esc(c.competency)}</p></div>
    <div class="part"><b>A question for you</b><p class="ask">${esc(c.question)}</p></div>
  </div>`;
}
function wireStep(){
  const sh = $('#sheet');
  $$('[data-ptype]', sh).forEach(b => b.onclick = () => { collect(); const t = b.dataset.ptype; const open = draft._pick === t || (draft._pick == null && $('.tile.on', sh) === b); draft._pick = open ? '' : t; if (!open && draft.context.type !== t) draft.context = {type:t, name:''}; saveDraft(); renderComposer(); if (!open && t !== 'subject'){ const n = $('[name=ctxName]'); if (n && !$('.typepanel .chip', sh)) n.focus(); } });
  $$('[data-exp]', sh).forEach(b => b.onclick = () => { collect(); const s = b.dataset.exp; const i = s.indexOf('|'); draft.context = {type:s.slice(0, i), name:s.slice(i + 1)}; if (b.closest('.xchips')) draft._pick = ''; const n = $('[name=ctxName]', sh); if (n) n.value = ''; matchGroup(); saveDraft(); renderComposer(); });
  const gc = $('#grpChange', sh); if (gc) gc.onclick = () => { collect(); draft._grpOpen = !draft._grpOpen; saveDraft(); renderComposer(); };
  const ts = $('#toSettings', sh); if (ts) ts.onclick = () => { collect(); saveDraft(); draft = null; };
  const fb = $('#fbFrom', sh); if (fb) $$('button', fb).forEach(b => b.onclick = () => { draft.feedbackFrom = b.dataset.v; $$('button', fb).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); saveDraft(); });
  $$('.comp', sh).forEach(card => {
    card.addEventListener('click', (ev) => {
      const lb = ev.target.closest('[data-l]'); const pick = ev.target.closest('.pick');
      const id = card.dataset.c; const list = draft.competencies || (draft.competencies = []);
      if (lb){ const t = list.find(x => x.id === id); if (t) t.level = +lb.dataset.l; saveDraft(); renderComposer(); return; }
      if (ev.target.closest('[data-where]') || ev.target.closest('label')) return;
      if (!pick) return;
      const i = list.findIndex(x => x.id === id);
      if (i >= 0) list.splice(i, 1);
      else { if (list.length >= 2){ toast('You can choose up to two. Remove one first.'); return; } list.push({id, level:2, where:''}); }
      saveDraft(); renderComposer();
    });
  });
  const ask = $('#askAi', sh); if (ask) ask.onclick = async () => {
    ask.disabled = true; $('#aiMsg').innerHTML = '<span class="spin"></span> The coach is reading your entry…';
    try{ draft.coachAi = await aiCoach(draftEntry()); renderComposer(); }
    catch(e){ ask.disabled = e instanceof AllowanceError; $('#aiMsg').textContent = e.message; }
  };
}
function saveEntry(){
  collect(); const e = draftEntry(); const stmts = myStatements(); const h = inputHash(e, stmts);
  const fresh = draft.coachAi && draft.coachAi.inputHash === h ? draft.coachAi : null;
  e.updated = Date.now();
  e.coach = {builtin:builtinCoach(e, groupFor(e)), ai:fresh};
  e.e21cc = fresh && fresh.e21cc ? fresh.e21cc : builtinE21cc(e, stmts);
  let changed = true;
  if (draft.editId){
    const i = me.entries.findIndex(x => x.id === draft.editId); const old = me.entries[i];
    if (old){
      e.created = old.created; e.pushed = old.pushed; e.sent = old.sent || {}; e.notes = old.notes || []; e.links = old.links || [];
      changed = inputHash(old, stmts) !== h;
      if (!changed && !fresh && old.coach && old.coach.ai){ e.coach.ai = old.coach.ai; e.e21cc = old.e21cc; }   // same words: keep the read that was paid for
      if (!changed) e.updated = old.updated || old.created;
      me.entries[i] = migrateEntry(e);
    }
  } else { me.entries.push(migrateEntry(Object.assign(e, {links:[], notes:[], sent:{}}))); delete me.drafts[draft.key]; }
  if (!draft.editId && e.kind !== 'across') rememberExperience(e.context);
  saveDb(); const id = e.id; const isEdit = !!draft.editId; draft = null; closeComposer();
  location.hash = '#/entry/' + id + (!isEdit ? '?new=1' : changed ? '?edited=1' : '');
}

/* ---------- an entry: the words, the margin notes, the read ---------- */
function noteHtml(n){ return `<aside class="mnote${n.seen ? '' : ' unread'}" aria-label="Note from ${esc(n.by)}"><span class="by">${esc(n.by)}${n.role ? ' · ' + esc(n.role) : ''} · ${fmtDay(n.at)}</span><p>${esc(n.text)}</p></aside>`; }
function answersWithNotes(e){
  const fw = FRAMEWORKS[e.kind]; const notes = e.notes || [];
  return fw.steps.map(s => s.qs.map(q => {
    const ns = notes.filter(n => n.anchor === q.id).sort((a, b) => a.at - b.at);
    const latest = ns[ns.length - 1]; const older = ns.slice(0, -1);
    return `<div class="qa-row${ns.length ? ' has-note' : ''}" data-anchor="${q.id}"><div class="qa"><b>${s.letter} · ${q.q}</b><p class="${e.answers[q.id] ? '' : 'empty'}">${esc(e.answers[q.id] || 'Not answered')}</p></div>
      ${latest ? `<div class="notes">${older.length ? `<details class="older"><summary>${plural(older.length, 'earlier note')}</summary>${older.map(noteHtml).join('')}</details>` : ''}${noteHtml(latest)}</div>` : ''}</div>`;
  }).join('')).join('');
}
function renderEntry(idq){
  const [id, q] = idq.split('?'); const e = me.entries.find(x => x.id === id);
  if (!e){ location.hash = '#/'; return; }
  const fw = FRAMEWORKS[e.kind]; const cls = groupFor(e); const isNew = (q || '').includes('new=1'); const edited = (q || '').includes('edited=1');
  const coach = coachOf(e); const fresh = aiFresh(e); const left = readsLeft();
  const topNotes = (e.notes || []).filter(n => !fw.steps.some(s => s.qs.some(x => x.id === n.anchor))).sort((a, b) => a.at - b.at);
  const sentTo = Object.entries(e.sent || {}).map(([aid, t]) => { const a = adultById(aid); return a ? `${esc(a.name)} (${fmtDay(t)}${t < version(e) ? ', before your last edit' : ''})` : ''; }).filter(Boolean);
  const files = basketsOf(e);
  frame(`
    <p class="crumb"><a class="backlink" href="${e.kind === 'across' ? '#/' : '#/journal/' + e.kind}">${icon('back')} ${e.kind === 'across' ? 'E21CC' : FRAMEWORKS[e.kind].name + ' journal'}</a></p>
    ${isNew || edited ? `<div class="banner" role="status"><span class="medal yellow" aria-hidden="true">${icon('check')}</span><div><b>${isNew ? 'Logged.' : 'Saved.'}</b><p>${nextStepOf(e) ? `Your next step, also on your Home page: ${esc(nextStepOf(e))}` : 'Next time, add a small step with a day on it.'}</p></div></div>` : ''}
    <section class="card entrycard">
      <div class="row" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap">
        <div class="grow"><span class="tiny">${esc(contextLine(e))} · ${fmtDay(e.created)}</span><h1 style="margin:2px 0 0;font-size:1.45em">${esc(entryTitle(e))}</h1>
          ${files.length ? `<p class="tiny" style="margin:4px 0 0">Shows ${COMPETENCIES.filter(c => compLevelOf(e, c.id) >= 2).map(c => `<a href="#/c/${c.id}">${esc(c.label)}</a>`).join(', ') || files.map(b => esc(basketOf(b).short)).join(', ')}</p>` : ''}</div>
        <span class="badge b-${e.kind}">${fw.name}</span>
      </div>
      ${topNotes.map(noteHtml).join('')}
      ${e.kind === 'act' && e.feedbackText ? `<div class="notice"><b>Feedback (${esc(e.feedbackFrom || 'teacher')}):</b> ${esc(e.feedbackText)}</div>` : ''}
      ${e.kind === 'across' && (e.lookedAt || []).length ? `<details style="margin-top:10px"><summary>The evidence you looked across (${e.lookedAt.length})</summary><ul class="evid" style="margin-top:8px">${e.lookedAt.map(x => `<li><q>${esc(x.quote)}</q></li>`).join('')}</ul></details>` : ''}
      <div class="readback" style="margin-top:12px">${answersWithNotes(e)}</div>
      ${e.kind !== 'across' ? `<p style="margin-top:8px">${(e.competencies || []).length ? '<span class="tiny">You claimed: </span>' + e.competencies.map(t => { const c = compOf(t.id); const l = LEVELS.find(x => x.n === t.level); return c ? `<span class="tag">${esc(c.label)}${l ? ' · ' + l.label : ''}</span>` : ''; }).join('') : '<span class="tiny">No competency claimed.</span>'}</p>` : ''}
      <div class="row" style="margin-top:6px">
        <button class="btn small" id="eShare">${icon('share')} Share</button>
        <button class="btn small sec" id="eCopy">${icon('copy')} Copy</button>
        <button class="btn small sec" onclick="location.hash='#/${e.kind === 'across' ? 'across/' + e.basket : 'write/' + e.kind}/${e.id}'">${icon('edit')} Edit</button>
        <button class="btn small ghost danger" id="eDel">${icon('trash')} Delete</button>
      </div>
      ${sentTo.length ? `<p class="tiny" style="margin:8px 0 0">Sent to ${sentTo.join(', ')}.</p>` : ''}
    </section>
    ${e21ccCard(e, {pending:aiPending.has(e.id), error:aiErrors.get(e.id)})}
    <section class="card"><h2>Coach’s notes</h2>${coach ? coachCard(coach, cls) : ''}
      ${e.coach && e.coach.ai && e.coach.builtin ? `<details style="margin-top:10px"><summary>Built in coach’s read</summary>${coachCard(e.coach.builtin, cls)}</details>` : ''}
      ${me.coach.mode !== 'builtin' ? `<div class="row" style="margin-top:10px"><button class="btn sec" id="eAsk" ${fresh || aiPending.has(e.id) || left <= 0 ? 'disabled' : ''}>${icon('spark')} ${e.coach && e.coach.ai ? 'Ask again' : 'Ask the AI coach'}</button><span class="tiny" id="eAskMsg">${fresh ? 'The coach has read these words. Change them to ask again.' : left <= 0 ? `Today’s ${dailyLimit()} coach reads are used up.` : left !== Infinity ? `${left} of ${dailyLimit()} coach reads left today.` : ''}</span></div>` : ''}
    </section>
  `, e.kind === 'across' ? 'e21cc' : e.kind, {wide:true});
  // reading a note is seeing it
  let seen = false; for (const n of (e.notes || [])) if (!n.seen){ n.seen = true; seen = true; } if (seen) saveDb();
  $('#eShare').onclick = () => shareEntry(e);
  $('#eCopy').onclick = () => copyText(entryText(e, true));
  $('#eDel').onclick = () => { dialog(`<h2>Delete this entry?</h2><p>It will be deleted from this device. If you sent it to a teacher, they keep their copy.</p><div class="row"><button class="btn danger" id="dYes">Delete</button><button class="btn sec" id="dNo">Keep it</button></div>`); $('#dYes').onclick = () => { me.entries = me.entries.filter(x => x.id !== e.id); saveDb(); closeDialog(); location.hash = '#/'; }; $('#dNo').onclick = closeDialog; };
  const ask = $('#eAsk'); if (ask) ask.onclick = () => { ask.disabled = true; $('#eAskMsg').innerHTML = '<span class="spin"></span>'; runAiFor(e); };
  const retry = $('#e21Retry'); if (retry) retry.onclick = () => { aiErrors.delete(e.id); runAiFor(e); renderEntry(idq); };
  $$('[data-tag]').forEach(b => b.onclick = () => { const list = e.competencies || (e.competencies = []); if (list.length >= 2){ toast('You can claim up to two. Edit the entry to remove one first.'); return; } if (!list.some(t => t.id === b.dataset.tag)) list.push({id:b.dataset.tag, level:2}); if (e.e21cc){ e.e21cc.suggested = (e.e21cc.suggested || []).filter(x => x !== b.dataset.tag); } saveDb(); toast('Claimed.'); renderEntry(idq); });
  $$('[data-maylink]').forEach(b => b.onclick = () => { const m = ((e.e21cc && e.e21cc.statements) || []).find(x => x.sid === b.dataset.maylink); addLink(e, b.dataset.maylink, m ? m.quote : ''); });
  // the smart action: a fresh or changed entry is read once by the coach
  if ((isNew || edited) && autoEval() && !fresh && !aiPending.has(e.id) && !aiErrors.has(e.id)){ runAiFor(e); renderEntry(idq); }
}
function e21ccCard(e, opts = {}){
  const x = e.e21cc; if (!x) return '';
  const st = STANCES[x.stance] || STANCES.mixed; const pos = x.stance === 'task' ? 0 : x.stance === 'mixed' ? 1 : 2;
  const claims = e.competencies || []; const claimed = new Set(claims.map(t => t.id));
  const seenEv = id => (x.evidence || []).find(v => v.id === id && v.strength !== 'glimpse');
  const cls = groupFor(e);
  const who = esc(x.source === 'ai' ? coachWho('ai', (e.coach && e.coach.ai && e.coach.ai.model) || '', cls).name : 'Built in coach');
  const claimRows = claims.map(t => { const c = compOf(t.id); if (!c) return ''; const l = LEVELS.find(z => z.n === t.level); const ev = seenEv(t.id);
    return `<li><div class="row" style="justify-content:space-between"><b>${esc(c.label)}</b><span class="str ${ev ? ev.strength : 'none'}">${ev ? 'Seen · ' + STRENGTHS[ev.strength].label : 'Not seen yet'}</span></div>
      <small>Your claim: ${l ? l.label.toLowerCase() : 'claimed'}${t.where ? `, and you pointed to “${esc(t.where)}”` : ''}.</small>
      ${ev ? (ev.quote ? `<q>${esc(ev.quote)}</q>` : '') + `<small>${esc(ev.why)}</small>` : `<small>Your words do not show this yet. ${esc(c.probe)}</small>`}</li>`; }).join('');
  const others = (x.evidence || []).filter(v => !claimed.has(v.id) && v.strength !== 'glimpse');
  const linked = new Set((e.links || []).map(l => l.sid));
  const may = (x.statements || []).filter(s => statementById(s.sid) && !linked.has(s.sid)).slice(0, 2);
  const err = opts.error;
  return `<section class="card" id="e21cc">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">E21CC feedback</h2><span class="tiny">${who}${opts.pending ? ' · <span class="spin"></span> reading…' : ''}</span></div>
    ${err ? (err.allowance ? `<div class="notice">${esc(err.msg)}</div>` : `<div class="notice warn">The coach could not read this entry: ${esc(err.msg)} The built in feedback is shown instead. <button class="btn small sec" id="e21Retry" style="margin-top:6px">Try again</button></div>`) : ''}
    ${e.kind === 'across' ? '' : claims.length ? `<span class="kick">Your claim, checked against your words</span><ul class="evid">${claimRows}</ul>` : `<p class="muted">You did not claim a competency this time. Next time, choose one and say where it shows, and the coach will check.</p>`}
    ${others.length ? `<span class="kick" style="margin-top:12px">${e.kind === 'across' ? 'Shown in your words' : 'Also shown in your words'}</span><ul class="evid">${others.map(ev => { const c = compOf(ev.id); if (!c) return ''; return `<li><div class="row" style="justify-content:space-between"><b>${esc(c.label)}</b><span class="str ${ev.strength}">${STRENGTHS[ev.strength].label}</span></div>${ev.quote ? `<q>${esc(ev.quote)}</q>` : ''}<small>${esc(ev.why)}</small>${e.kind === 'across' ? '' : `<button class="btn small sec" data-tag="${ev.id}">${icon('plus')} Claim it</button>`}</li>`; }).join('')}</ul>` : ''}
    ${may.length ? `<span class="kick" style="margin-top:12px">Could unlock a statement</span><ul class="evid">${may.map(s => { const stmt = statementById(s.sid); return `<li><b>${esc(stmt.text)}</b><q>${esc(s.quote)}</q>${s.why ? `<small>${esc(s.why)}</small>` : ''}<button class="btn small sec" data-maylink="${esc(s.sid)}">${icon('link')} Link it</button></li>`; }).join('')}</ul>` : ''}
    ${(e.links || []).length ? `<p class="tiny" style="margin-top:10px">Linked to: ${(e.links || []).map(l => { const s = statementById(l.sid); return s ? `<span class="tag">${linkBacked(e, s) ? '● ' : '○ '}${esc(s.text)}</span>` : ''; }).join('')}</p>` : ''}
    <div class="stance" style="margin-top:12px"><div class="track"><i class="${pos >= 0 ? 'on' : ''}"></i><i class="${pos >= 1 ? 'on' : ''}"></i><i class="${pos >= 2 ? 'on' : ''}"></i></div><div><b>${st.label}</b> <span class="tiny">${esc(x.stance_note || st.help)}</span></div></div>
    ${x.probe ? `<div style="margin-top:8px"><span class="kick">Go deeper${compOf(x.probe_for) ? ' on ' + esc(compOf(x.probe_for).label) : ''}</span><p class="ask">${esc(x.probe)}</p></div>` : ''}
    <p class="tiny" style="margin:10px 0 0">Glimpse: one word hints at it. Clear: you describe a moment. Strong: you describe a moment and say how or why.${x.source !== 'ai' && aiReady() && !opts.pending && !err && !(e.coach && e.coach.ai) ? ' The coach has not read this one yet.' : ''}</p>
  </section>`;
}
/* Share one entry: choose the adults; those whose sharing settings cover it come ticked. */
function shareEntry(e){
  const list = adults();
  if (!list.length){ dialog(`<h2>No one to share with yet</h2><p>Add a group from your teacher (Settings, Groups), or invite a mentor in Sharing.</p><div class="row"><a class="btn" href="#/sharing" id="dGo">${icon('share')} Open Sharing</a><button class="btn sec" id="dClose">Close</button></div>`); $('#dClose').onclick = closeDialog; $('#dGo').onclick = closeDialog; return; }
  dialog(`<h2>Share this entry</h2><p class="tiny">${esc(entryTitle(e))}. Only the people you pick get it.</p>
    <div class="stack" id="shareList">${list.map((a, i) => `<label class="pick-row"><input type="radio" name="who" value="${i}" ${i === 0 ? 'checked' : ''}><span><b>${esc(a.name)}</b><small>${esc(a.role)}${a.groupLabel ? ' · ' + esc(a.groupLabel) : ''}${isSent(a, e) ? ' · already has this version' : ''}</small></span></label>`).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn" id="dGo">${icon('send')} Next</button><button class="btn sec" id="dClose">Cancel</button><a class="btn ghost" href="#/sharing" id="dSet">Sharing settings</a></div>`);
  $('#dClose').onclick = closeDialog; $('#dSet').onclick = closeDialog;
  $('#dGo').onclick = () => { const r = $$('#shareList input').find(x => x.checked); const a = list[+r.value]; deliver(a, [{t:'e', id:e.id, title:entryTitle(e), e}]); };
}

/* ---------- the GROW and ACT journals: bookmarks or a shelf, pivoted four ways ---------- */
const PIVOTS = [['experience', 'Experience'], ['date', 'Date'], ['competency', 'Competency'], ['term', 'Term']];
const TYPE_COLOUR = {cca:'#0f7a6b', subject:'#1f3fa8', camp:'#2f6b3a', competition:'#b23a48', service:'#a8740b', other:'#6a3f86', across:'#c98a00'};
function entryRow(e){
  const fw = FRAMEWORKS[e.kind]; const c = coachOf(e); const first = fw.steps[0].qs[0].id;
  const unread = (e.notes || []).filter(n => !n.seen).length; const anySent = Object.keys(e.sent || {}).length;
  const comps = COMPETENCIES.filter(x => compLevelOf(e, x.id) >= 2).slice(0, 3);
  const d = new Date(e.created);
  return `<a class="entry" href="#/entry/${e.id}"><span class="dt" aria-hidden="true"><b>${d.getDate()}</b><span>${d.toLocaleDateString('en-SG', {month:'short'})}</span></span><span class="grow"><b>${esc(entryTitle(e))}</b><small>${e.context && e.context.type && e.context.type !== 'subject' ? esc(typeLabel(e.context.type)) + ' · ' : ''}${c && DEPTHS[c.depth] ? DEPTHS[c.depth].label : ''}${anySent ? '<span class="dot ok" title="shared"></span>' : ''}${unread ? ` <span class="newnote">${plural(unread, 'new note')}</span>` : ''}</small><span class="snip">${esc(e.answers[first] || nextStepOf(e) || '')}</span>${comps.length ? `<span class="cdots">${comps.map(x => `<i style="--d:${DOMAIN_COLOUR[x.d]}">${esc(x.label)}</i>`).join('')}</span>` : ''}</span></a>`;
}
/* The student's own experiences, in their order: CCA first, then subjects, then the rest. */
function myExperiences(){
  const x = me.experiences || {subjects:[], cca:'', others:[]}; const out = []; const seen = new Set();
  const push = (type, name) => { name = String(name || '').trim(); const k = name.toLowerCase(); if (!name || seen.has(k)) return; seen.add(k); out.push({type, name}); };
  for (const n of String(x.cca || '').split(/\s*,\s*/)) push('cca', n);
  for (const s of (x.subjects || [])) push('subject', s);
  for (const o of (x.others || [])) push(o.type || 'other', o.name);
  return out;
}
function typeLabel(t){ return t === 'cca' ? 'CCA' : t === 'across' ? 'Look across' : contextTypeOf(t).label; }
function journalGroups(kind, pivot){
  const E = me.entries.filter(e => e.kind === kind).sort((a, b) => b.created - a.created);
  const groups = new Map();
  const add = (key, label, meta, e) => { if (!groups.has(key)) groups.set(key, Object.assign({key, label, entries:[]}, meta)); if (e) groups.get(key).entries.push(e); };
  if (pivot === 'experience'){
    for (const x of myExperiences()) add('x:' + x.name.toLowerCase(), x.name, {type:x.type, colour:TYPE_COLOUR[x.type] || TYPE_COLOUR.other}, null);
    for (const e of E){ const n = ((e.context && e.context.name) || e.subject || '').trim() || 'Unsorted'; const t = (e.context && e.context.type) || 'subject'; add('x:' + n.toLowerCase(), n, {type:t, colour:TYPE_COLOUR[t] || TYPE_COLOUR.other}, e); }
  } else if (pivot === 'date'){
    for (const e of E){ const d = new Date(e.created); add(`d:${d.getFullYear()}-${d.getMonth()}`, d.toLocaleDateString('en-SG', {month:'long', year:'numeric'}), {colour:'var(--cover)'}, e); }
  } else if (pivot === 'term'){
    for (const e of E){ const k = termKey(e.created); add('t:' + k, termLabel(k), {colour:'var(--cover)'}, e); }
  } else {
    for (const c of COMPETENCIES){ for (const e of E) if (compLevelOf(e, c.id)) add('c:' + c.id, c.label, {colour:DOMAIN_COLOUR[c.d], comp:c.id}, e); }
    const none = E.filter(e => !COMPETENCIES.some(c => compLevelOf(e, c.id))); for (const e of none) add('c:none', 'No competency yet', {colour:'var(--g5)'}, e);
  }
  return [...groups.values()];
}
function renderJournal(kind){
  const fw = FRAMEWORKS[kind]; const {q} = hashParts();
  const pref = me.prefs.journal; const pivot = PIVOTS.some(p => p[0] === q.get('p')) ? q.get('p') : pref.pivot; const view = q.get('v') === 'shelf' || q.get('v') === 'bookmarks' ? q.get('v') : pref.view;
  if (pivot !== pref.pivot || view !== pref.view){ pref.pivot = pivot; pref.view = view; saveDb(); }
  const groups = journalGroups(kind, pivot); const gkey = q.get('g') || ''; const sel = groups.find(g => g.key === gkey) || null;
  const total = me.entries.filter(e => e.kind === kind).length;
  const base = `#/journal/${kind}`;
  const href = (o) => { const p = new URLSearchParams({p:o.p || pivot, v:o.v || view}); if (o.g) p.set('g', o.g); return `${base}?${p}`; };
  const newHref = g => `#/write/${kind}` + (g && pivot === 'experience' && g.key !== 'x:unsorted' ? `?x=${encodeURIComponent((g.type || 'subject') + ':' + g.label)}` : '');
  const groupPanel = g => `<section class="gpanel" style="--g:${g.colour}">
      <div class="row" style="justify-content:space-between;align-items:flex-end"><div><span class="kick">${pivot === 'experience' ? esc(typeLabel(g.type)) : pivot === 'competency' && g.comp ? esc(basketOf(compOf(g.comp).d).short) : esc(PIVOTS.find(p => p[0] === pivot)[1])}</span><h2 style="margin:0">${esc(g.label)}</h2></div>
        ${pivot === 'experience' ? `<a class="btn small" href="${newHref(g)}">${icon('plus')} New ${fw.name}</a>` : g.comp ? `<a class="btn small sec" href="#/c/${g.comp}">Open ${esc(g.label)}</a>` : ''}</div>
      ${g.entries.length ? g.entries.map(entryRow).join('') : `<p class="muted" style="margin-top:10px">No ${fw.name} entries here yet.${pivot === 'experience' ? ` Start one after your next ${g.type === 'cca' ? 'session' : g.type === 'subject' ? 'lesson' : 'activity'}.` : ''}</p>`}
    </section>`;
  let body = '';
  if (view === 'shelf'){
    body = sel ? `<p style="margin:0 0 4px"><a class="backlink" href="${href({})}">${icon('back')} All notebooks</a></p>${groupPanel(sel)}`
      : groups.length ? `<div class="shelf">${groups.map(g => `<a class="nb${g.entries.length ? '' : ' empty'}" href="${href({g:g.key})}" style="--g:${g.colour}"><span class="nb-title">${esc(g.label)}</span><span class="nb-meta">${pivot === 'experience' ? esc(typeLabel(g.type)) + '<br>' : ''}${plural(g.entries.length, 'entry', 'entries')}${g.entries[0] ? '<br>' + fmtDay(g.entries[0].created) : ''}</span></a>`).join('')}</div>` : '';
  } else {
    body = sel ? groupPanel(sel) : groups.filter(g => g.entries.length).map(g => `<section class="gblock" style="--g:${g.colour}"><h2><a href="${href({g:g.key})}">${esc(g.label)}</a>${pivot === 'experience' && g.type === 'cca' ? '<span class="gtag">CCA</span>' : ''}<span class="tiny">${plural(g.entries.length, 'entry', 'entries')}</span></h2>${g.entries.map(entryRow).join('')}</section>`).join('');
  }
  const empty = !total;
  const viewSw = `<div class="seg icons" role="group" aria-label="View"><a class="${view === 'bookmarks' ? 'on' : ''}" href="${href({v:'bookmarks', g:gkey})}" title="Bookmarks" aria-label="Bookmarks"${view === 'bookmarks' ? ' aria-current="true"' : ''}>${icon('list')}</a><a class="${view === 'shelf' ? 'on' : ''}" href="${href({v:'shelf', g:gkey})}" title="Shelf of notebooks" aria-label="Shelf of notebooks"${view === 'shelf' ? ' aria-current="true"' : ''}>${icon('shelf')}</a></div>`;
  const marks = view === 'bookmarks' ? `<div class="bookmarks" role="list"><a role="listitem" class="bm${sel ? '' : ' on'}" href="${href({})}">All <b>${total}</b></a>${groups.map(g => `<a role="listitem" class="bm${sel === g ? ' on' : ''}${g.entries.length ? '' : ' empty'}" href="${href({g:g.key})}" style="--g:${g.colour}">${esc(g.label)} <b>${g.entries.length}</b></a>`).join('')}</div>` : '<span class="grow"></span>';
  frame(`
    <section class="jhead">
      <div class="grow"><h1>${fw.name} journal</h1><p class="meta">${kind === 'grow' ? 'Gift · Rise · Own · Watch' : 'Acknowledge · Connect · Test'}</p></div>
      <a class="btn acc" href="#/write/${kind}">${icon('plus')} New entry</a>
    </section>
    <div class="sortby"><span id="sortLbl">Sort by</span><div class="seg" role="group" aria-labelledby="sortLbl">${PIVOTS.map(([k, l]) => `<a class="${pivot === k ? 'on' : ''}" href="${href({p:k})}" ${pivot === k ? 'aria-current="true"' : ''}>${l}</a>`).join('')}</div></div>
    <div class="bmrow"${view === 'shelf' ? ' style="border-bottom:0"' : ''}>${marks}${viewSw}</div>
    ${empty && pivot === 'experience' && !myExperiences().length ? `<div class="notice">Add your subjects and CCA in <a href="#/settings">Settings</a>, and they will appear here as bookmarks.</div>` : ''}
    ${body}
    ${empty ? `<section class="card flat"><p class="muted" style="margin:0">Your ${fw.name} journal is empty. ${kind === 'grow' ? 'After your next lesson or CCA session, write your first entry. Two or three sentences for each question is enough.' : 'When you next get feedback on your work, write your first entry.'}</p></section>` : ''}
  `, kind);
}

/* ---------- sharing: who sees what. Nothing is shared by default. ---------- */
function renderSharing(){
  const list = adults();
  const card = a => {
    const secs = sectionsOf(a); const unsent = unsentFor(a); const sink = a.sink && a.sink.kind && a.sink.kind !== 'none' ? (a.sink.kind === 'msforms' ? 'Microsoft Form' : 'Google Form') : 'a link in Teams';
    return `<section class="card adult" data-a="${esc(a.id)}">
      <div class="row" style="justify-content:space-between;align-items:flex-start"><div><h2 style="margin:0">${esc(a.name)}</h2><p class="tiny" style="margin:2px 0 0">${esc(a.role)}${a.groupLabel ? ' · ' + esc(a.groupLabel) : ''} · sends by ${sink}</p></div>${a.group ? '' : `<button class="btn small ghost danger" data-remove="${esc(a.id)}">${icon('trash')} Remove</button>`}</div>
      <span class="flabel" style="margin-top:12px">What ${esc(a.name)} can see</span>
      <div class="chips">${SECTIONS.map(([k, l]) => `<button type="button" class="chip ${secs.includes(k) ? 'on' : ''}" data-sec="${k}" aria-pressed="${secs.includes(k)}">${secs.includes(k) ? icon('eye') : icon('lock')}${esc(l)}</button>`).join('')}</div>
      ${a.group ? `<span class="flabel" style="margin-top:12px">Which entries</span><div class="seg" role="group" aria-label="Which entries">${[['group', `Only ${a.groupLabel || 'this group'}`], ['all', 'All my entries']].map(([k, l]) => `<button type="button" data-scope="${k}" class="${scopeOf(a) === k ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>` : ''}
      <div class="row" style="margin-top:12px;justify-content:space-between"><span class="tiny">${secs.length ? (unsent.length ? `${plural(unsent.length, 'item')} not sent yet` : 'Up to date') : 'Nothing shared'}</span>${unsent.length ? `<button class="btn small" data-send="${esc(a.id)}">${icon('send')} Send ${unsent.length} new</button>` : ''}</div>
    </section>`;
  };
  frame(`
    <section class="hero"><h1>Sharing</h1><p class="meta">Your log is yours. Each adult sees only the sections you open to them, and only when you send.</p></section>
    <div class="notice">GROW and ACT share whole entries. A domain shares its I can statements, the quotes that back them, and your look across. Teachers reply with notes in the margin.</div>
    ${list.length ? list.map(card).join('') : `<section class="card flat"><p class="muted">No adults yet. A teacher’s group brings them in (Settings, Groups), or invite a mentor below.</p></section>`}
    <section class="card"><h2>Invite a mentor or another adult</h2>
      <form id="addAdult" class="two">
        <label class="f"><span>Name</span><input class="in" name="name" maxlength="60" required placeholder="e.g. Ms Lim"></label>
        <label class="f"><span>Email</span><input class="in" name="email" type="email" maxlength="120" placeholder="name@moe.edu.sg" autocapitalize="none" autocorrect="off" spellcheck="false"></label>
        <label class="f"><span>Role</span><select class="in" name="role">${['Mentor','Counsellor','CCA coach','Year head','Other'].map(r => `<option>${r}</option>`).join('')}</select></label>
        <div class="f" style="align-self:end"><button class="btn" type="submit">${icon('plus')} Add</button></div>
      </form>
      <p class="tiny">Adults without a drop box get a link you send them in Teams. It opens in their teacher console.</p>
    </section>
  `, 'settings');
  $$('.adult').forEach(card => {
    const a = adultById(card.dataset.a);
    $$('[data-sec]', card).forEach(b => b.onclick = () => { const arr = me.shares.sections[b.dataset.sec]; const i = arr.indexOf(a.id); if (i >= 0) arr.splice(i, 1); else arr.push(a.id); saveDb(); renderSharing(); });
    $$('[data-scope]', card).forEach(b => b.onclick = () => { me.shares.scope[a.id] = b.dataset.scope; saveDb(); renderSharing(); });
    const s = $('[data-send]', card); if (s) s.onclick = () => sendSheet(a);
    const r = $('[data-remove]', card); if (r) r.onclick = () => { delete me.shares.adults[a.id]; for (const k of Object.keys(me.shares.sections)) me.shares.sections[k] = me.shares.sections[k].filter(x => x !== a.id); saveDb(); renderSharing(); };
  });
  $('#addAdult').onsubmit = ev => { ev.preventDefault(); const f = new FormData(ev.target); const name = String(f.get('name') || '').trim(); if (!name) return; const id = 'm:' + uid(); me.shares.adults[id] = {id, name, email:String(f.get('email') || '').trim().toLowerCase(), role:String(f.get('role') || 'Mentor')}; saveDb(); toast(`${name} added. Choose what they can see.`); renderSharing(); };
}

/* ---------- pieces shared by setup and settings ---------- */
function experiencesEditor(){
  const x = me.experiences; const custom = x.subjects.filter(s => !SUBJECTS.includes(s));
  return `<section class="card" id="expCard"><h2>My experiences</h2>
    <p class="tiny" style="margin-top:0">These become bookmarks in your GROW and ACT journals, and the first choices when you write. Pick only what you take.</p>
    <span class="flabel">My subjects</span>
    <div class="chips" id="subjChips">${[...SUBJECTS, ...custom].map(s => `<button type="button" class="chip ${x.subjects.includes(s) ? 'on' : ''}" data-subj="${esc(s)}" aria-pressed="${x.subjects.includes(s)}">${x.subjects.includes(s) ? icon('check') : ''}${esc(s)}</button>`).join('')}</div>
    <form class="row" id="addSubj" style="margin-top:8px"><input class="in grow" name="s" maxlength="40" aria-label="Another subject" placeholder="Another subject, e.g. Additional Mathematics"><button class="btn sec small" type="submit">${icon('plus')} Add</button></form>
    <label class="f" style="margin-top:14px"><span>My CCA</span><input class="in" id="ccaIn" value="${esc(x.cca)}" maxlength="80" placeholder="e.g. Football, or Choir, Robotics" autocapitalize="words"><small>It becomes your first experience bookmark. Separate two with a comma.</small></label>
    <span class="flabel">Other experiences</span>
    ${x.others.length ? `<ul class="groups">${x.others.map((o, i) => `<li><div class="grow"><b>${esc(o.name)}</b> <span class="tag">${esc(typeLabel(o.type))}</span></div><button class="btn small ghost" data-dropx="${i}" aria-label="Remove ${esc(o.name)}">${icon('trash')}</button></li>`).join('')}</ul>` : '<p class="tiny" style="margin:0 0 8px">Camps, competitions, service, leadership: add them as they happen, or straight from a new entry.</p>'}
    <form class="row" id="addOther"><select class="in" name="t" style="width:auto" aria-label="Type of experience">${CONTEXT_TYPES.filter(c => c.id !== 'subject' && c.id !== 'cca').map(c => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select><input class="in grow" name="n" maxlength="60" aria-label="Name of the experience" placeholder="e.g. Sec 2 camp"><button class="btn sec small" type="submit">${icon('plus')} Add</button></form>
  </section>`;
}
function wireExperiences(rerender){
  const x = me.experiences;
  $$('[data-subj]').forEach(b => b.onclick = () => { const s = b.dataset.subj; const i = x.subjects.indexOf(s); if (i >= 0) x.subjects.splice(i, 1); else x.subjects.push(s); saveDb(); b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', i < 0); b.innerHTML = (i < 0 ? icon('check') : '') + esc(s); });
  $('#addSubj').onsubmit = ev => { ev.preventDefault(); const v = String(new FormData(ev.target).get('s') || '').trim(); if (!v) return; if (!x.subjects.some(s => s.toLowerCase() === v.toLowerCase())) x.subjects.push(v); saveDb(); rerender(); };
  $('#ccaIn').oninput = e => { x.cca = e.target.value; saveDb(); };
  $$('[data-dropx]').forEach(b => b.onclick = () => { x.others.splice(+b.dataset.dropx, 1); saveDb(); rerender(); });
  $('#addOther').onsubmit = ev => { ev.preventDefault(); const f = new FormData(ev.target); const n = String(f.get('n') || '').trim(); if (!n) return; x.others.push({type:String(f.get('t') || 'other'), name:n}); saveDb(); rerender(); };
}
function coverPicker(){
  const p = me.prefs;
  return `<span class="flabel">Cover colour</span><div class="swatches">${COVERS.map(c => `<button type="button" class="sw cv ${p.cover === c.id ? 'on' : ''}" data-cover="${c.id}" style="--c:${c.c}" aria-label="${c.label}" title="${c.label}"></button>`).join('')}</div>
    <span class="flabel" style="margin-top:14px">Paper</span><div class="papers">${PAPERS.map(x => `<button type="button" class="paper-opt pp-${x.id} ${p.paper === x.id ? 'on' : ''}" data-paper="${x.id}"><i></i>${x.label}</button>`).join('')}</div>`;
}
function wireCover(){
  $$('[data-cover]').forEach(b => b.onclick = () => { me.prefs.cover = b.dataset.cover; saveDb(); applyPrefs(); $$('[data-cover]').forEach(x => x.classList.toggle('on', x === b)); });
  $$('[data-paper]').forEach(b => b.onclick = () => { me.prefs.paper = b.dataset.paper; saveDb(); applyPrefs(); $$('[data-paper]').forEach(x => x.classList.toggle('on', x === b)); });
}

/* ---------- settings ---------- */
function renderSettings(){
  const p = me.prefs; const c = me.coach; const gs = myGroups(); const relay = relayFor(null); const modes = COACH_MODES();
  const sinkLabel = cfg => cfg && cfg.sink && cfg.sink.kind && cfg.sink.kind !== 'none' ? (cfg.sink.kind === 'msforms' ? 'Microsoft Form' : 'Google Form') : 'no drop box';
  const modeCard = ([k, l, h]) => `<label class="pcard" style="cursor:pointer"><input type="radio" name="cm" value="${k}" ${c.mode === k ? 'checked' : ''} style="width:22px;height:22px;accent-color:var(--cover)"><span><b>${l}</b><small>${h}</small></span></label>`;
  frame(`
    <section class="hero"><h1>Settings</h1><p class="meta">Make the log yours, choose your coach, and list what you learn from.</p>
      <nav class="jumps">${[['me','Me'],['look','Look'],['coach','Coach'],['expCard','Experiences'],['groups','Groups'],['data','Data']].map(([id, l]) => `<a href="#" data-jump="${id}">${l}</a>`).join('')}</nav></section>
    <section class="card" id="me"><h2>Me</h2>
      <label class="f"><span>Name</span><input class="in" id="sName" value="${esc(me.name)}" maxlength="60"></label>
      <label class="f"><span>Title of your log</span><input class="in" id="sTitle" value="${esc(p.title || '')}" maxlength="50" placeholder="E21CC Learning Log"><small>Shown on the cover. Leave blank for “E21CC Learning Log”.</small></label>
      <label class="f"><span>Your line</span><input class="in" id="sMotto" value="${esc(p.motto || '')}" maxlength="80" placeholder="A sentence you want to see every day"></label>
      <div class="f"><span class="flabel">Your icon</span>${iconPicker()}</div>
      <label class="f"><span>School email</span><input class="in" id="sEmail" type="email" value="${esc(me.email)}" maxlength="120" placeholder="name@students.edu.sg"><small>Only needed for sharing with teachers. Their notes reach you through it.</small></label>
    </section>
    <section class="card" id="look"><h2>Look</h2>
      ${coverPicker()}
      <span class="flabel" style="margin-top:14px">Highlight colour</span><div class="swatches">${ACCENTS.map(a => `<button type="button" class="sw ${p.accent === a.id ? 'on' : ''}" data-accent="${a.id}" style="--c:${a.c}" aria-label="${a.id}"></button>`).join('')}</div>
      <span class="flabel" style="margin-top:14px" id="sizeLbl">Text size</span><div class="seg" role="group" aria-labelledby="sizeLbl">${[['normal','A'],['large','A+'],['xl','A++']].map(([k, l]) => `<button type="button" data-size="${k}" class="${p.size === k ? 'on' : ''}" aria-label="${k === 'normal' ? 'Normal' : k === 'large' ? 'Large' : 'Extra large'} text">${l}</button>`).join('')}</div>
    </section>
    <section class="card" id="coach"><h2>Coach</h2>
      <span class="flabel">Tone</span>
      <div class="tones">${Object.entries(TONES).map(([k, t]) => `<button type="button" class="tone ${p.tone === k ? 'on' : ''}" data-tone="${k}"><b>${t.label}</b><small>${t.help}</small></button>`).join('')}</div>
      <span class="flabel" style="margin-top:14px">Who reads your entries</span>
      <div class="stack" id="coachMode">${modes.main.map(modeCard).join('')}</div>
      <div id="geminiBox" ${c.mode === 'gemini' ? '' : 'hidden'} class="subpanel">
        <label class="f"><span>Gemini API key</span><input class="in" id="sGKey" type="password" value="${esc(c.geminiKey || '')}" placeholder="Paste the key from Google AI Studio" autocomplete="off" autocapitalize="none" spellcheck="false"><small>Stored only in this browser. Make one at aistudio.google.com, and restrict it to the Generative Language API and this site. For testing by adults: Gemini’s terms do not allow users under 18.</small></label>
        <div class="row"><label class="f grow" style="margin:0"><span>Model</span><select class="in" id="sGModel"><option value="${esc(c.geminiModel || GEMINI_DEFAULT)}">${esc(c.geminiModel || GEMINI_DEFAULT)}</option></select></label><button class="btn sec small" id="sGLoad" style="margin-top:26px">Load models</button></div>
        <p class="tiny" id="sGMsg"></p>
      </div>
      <details style="margin-top:10px" ${['relay','local','key'].includes(c.mode) ? 'open' : ''}><summary>Other options</summary><div class="stack" id="coachMore" style="margin-top:8px">${modes.more.map(modeCard).join('')}</div>
        <div id="coachRelay" ${c.mode === 'relay' ? '' : 'hidden'} class="subpanel">
          <label class="f"><span>Coach link</span><input class="in" id="sRelay" value="${esc(c.relayUrl || '')}" placeholder="${esc((relay && relay.url) || 'https://…workers.dev')}"></label>
          <label class="f"><span>Class token</span><input class="in" id="sToken" value="${esc(c.token || '')}" placeholder="${relay && relay.token ? 'Provided by your group' : 'From your teacher'}"></label>
        </div>
        <div id="coachKey" ${c.mode === 'key' ? '' : 'hidden'} class="subpanel">
          <label class="f"><span>Anthropic API key</span><input class="in" id="sKey" type="password" value="${esc(c.key || '')}" placeholder="sk-ant-…" autocomplete="off"></label>
          <label class="f"><span>Model</span><select class="in" id="sModel">${[['claude-opus-5','Claude Opus 5'],['claude-sonnet-5','Claude Sonnet 5'],['claude-haiku-4-5','Claude Haiku 4.5']].map(([v, l]) => `<option value="${v}" ${c.model === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        </div></details>
      <label class="check" id="autoRow" style="margin-top:8px" ${c.mode === 'builtin' ? 'hidden' : ''}><input type="checkbox" id="sAuto" ${c.auto !== false ? 'checked' : ''}><span>Give feedback on every entry when I log it<small style="display:block;color:var(--text-2)">Each version of your words is read once. Off means only when you press the button.</small></span></label>
      <p class="tiny" id="allowRow" ${METERED.includes(c.mode) ? '' : 'hidden'} style="margin-top:8px">Coach reads today: ${readsUsed()} of ${dailyLimit()}.</p>
      <div class="row" style="margin-top:8px"><button class="btn sec small" id="sTest" ${c.mode === 'builtin' ? 'hidden' : ''}>Test the coach</button><span class="tiny" id="sTestMsg"></span></div>
    </section>
    ${experiencesEditor()}
    <section class="card" id="groups"><h2>Groups and sharing</h2>
      <p class="tiny" style="margin-top:0">A group is a class or CCA a teacher set up. It brings their coach voice and lets you share entries with them.</p>
      ${gs.length ? `<ul class="groups">${gs.map(g => `<li><div class="grow"><b>${esc(g.cfg ? (g.cfg.subject || g.code) : g.code)}</b> <span class="tag">${groupType(g) === 'cca' ? 'CCA' : groupType(g) === 'form' ? 'Form class' : groupType(g) === 'subject' ? 'Subject' : 'Group'}</span><small>${esc(g.code)}${g.cfg ? ' · ' + esc(g.cfg.teacherName || 'teacher') + ' · ' + sinkLabel(g.cfg) : ' · not loaded yet'}</small></div><button class="btn small ghost" data-drop="${esc(g.code)}" aria-label="Remove ${esc(g.code)}">${icon('trash')}</button></li>`).join('')}</ul>` : ''}
      <div class="row"><label class="f grow" style="margin:0"><span>Add a group code</span><input class="in" id="sClass" maxlength="16" style="text-transform:uppercase" placeholder="From your teacher" autocapitalize="characters" autocorrect="off" spellcheck="false" autocomplete="off"></label><button class="btn sec" id="sLoad" style="margin-top:22px">Add</button></div>
      <p class="tiny" id="clsMsg" style="margin-top:8px"></p>
      <p style="margin:6px 0 0"><a class="btn sec small" href="#/sharing">${icon('share')} Sharing: who sees what</a></p>
    </section>
    <section class="card" id="data"><h2>Your data</h2>
      <p class="muted">Everything is in this browser. A cleared cache, a new laptop or a school reimage loses it, so export now and then. The file imports back here, on any device.</p>
      <div class="row">
        <button class="btn sec" id="sExport">${icon('down')} Export log</button>
        <label class="btn sec" for="sImport">${icon('up')} Import<input type="file" id="sImport" accept="application/json,.json" hidden></label>
        <button class="btn sec" id="sCopyAll">${icon('copy')} Copy all as text</button>
      </div>
      ${STORE.hasV1() && db.migratedFrom ? `<details style="margin-top:14px"><summary>The old Learning Log copy</summary><p class="tiny" style="margin-top:6px">Your old entries moved into this log on ${fmtDate(db.migratedAt || Date.now())}. A copy of the old log is still kept in this browser as a safety net. Once you have exported, you can remove it.</p><button class="btn small danger" id="sDropV1">Remove the old copy</button></details>` : ''}
      <details style="margin-top:14px"><summary>Change or remove PIN</summary>
        <form id="pinChange" class="row" style="margin-top:8px"><input class="in grow" name="pin" inputmode="numeric" maxlength="4" aria-label="New 4 digit PIN" placeholder="New 4 digit PIN, or blank to remove"><button class="btn small" type="submit">Set</button></form></details>
      <div class="row" style="margin-top:14px">
        <button class="btn ghost" id="sOut">${icon('user')} Switch person</button>
        <button class="btn danger small" id="sDelete">${icon('trash')} Delete this profile from this device</button>
      </div>
    </section>
    <section class="card flat"><h2>About</h2><p class="tiny">E21CC Learning Log for Beattyians. GROW by reflecting and ACT on Feedback are the school’s frameworks; the competencies follow MOE’s 21st Century Competencies (2023 refresh). No accounts and no database: your reflections are yours until you choose to share them. Teachers: see <a href="teacher.html">the teacher console</a>.</p></section>
  `, 'settings');
  const sv = () => { saveDb(); applyPrefs(); };
  $$('[data-jump]').forEach(a => a.onclick = ev => { ev.preventDefault(); const t = document.getElementById(a.dataset.jump); if (t) t.scrollIntoView({behavior:'smooth', block:'start'}); });
  $('#sName').oninput = e => { me.name = e.target.value; sv(); };
  $('#sTitle').oninput = e => { me.prefs.title = e.target.value; sv(); const w = $('.cover .word'); if (w) w.textContent = logTitle(); };
  $('#sEmail').oninput = e => { me.email = e.target.value.trim().toLowerCase(); sv(); };
  $('#sMotto').oninput = e => { me.prefs.motto = e.target.value; sv(); };
  wireIconPicker(); wireCover();
  $$('button[data-accent]').forEach(b => b.onclick = () => { me.prefs.accent = b.dataset.accent; sv(); $$('button[data-accent]').forEach(x => x.classList.toggle('on', x === b)); });
  $$('button[data-size]').forEach(b => b.onclick = () => { me.prefs.size = b.dataset.size; sv(); $$('button[data-size]').forEach(x => x.classList.toggle('on', x === b)); });
  $$('[data-tone]').forEach(b => b.onclick = () => { me.prefs.tone = b.dataset.tone; saveDb(); $$('[data-tone]').forEach(x => x.classList.toggle('on', x === b)); });
  wireExperiences(renderSettings);
  $$('[data-drop]').forEach(b => b.onclick = () => { me.groups = me.groups.filter(g => g.code !== b.dataset.drop); saveDb(); toast('Group removed. Its entries stay in your log.'); loadStatements().then(renderSettings); });
  $('#sLoad').onclick = async () => {
    const code = $('#sClass').value.trim().toUpperCase(); if (!code) return;
    $('#clsMsg').innerHTML = '<span class="spin"></span> Looking for the group…';
    const cfg = await loadGroup(code);
    if (cfg){ addGroupToMe(code); adoptGroup(cfg); saveDb(); await loadStatements(); toast(`Added ${code}.`); renderSettings(); }
    else $('#clsMsg').textContent = `No group file found for ${code}. Ask your teacher for a share link, or check the code.`;
  };
  $$('#coachMode input, #coachMore input').forEach(r => r.onchange = () => {
    me.coach.mode = r.value; me.coach.touched = true; saveDb();
    $$('#coachMode input, #coachMore input').forEach(x => x.checked = x.value === r.value);
    $('#geminiBox').hidden = r.value !== 'gemini'; $('#coachRelay').hidden = r.value !== 'relay'; $('#coachKey').hidden = r.value !== 'key';
    $('#sTest').hidden = r.value === 'builtin'; $('#autoRow').hidden = r.value === 'builtin'; $('#allowRow').hidden = !METERED.includes(r.value);
  });
  $('#sGKey').oninput = e => { me.coach.geminiKey = e.target.value.trim(); saveDb(); };
  $('#sGModel').onchange = e => { me.coach.geminiModel = e.target.value; saveDb(); };
  $('#sGLoad').onclick = async () => {
    const m = $('#sGMsg'); if (!me.coach.geminiKey){ m.textContent = 'Paste a key first.'; return; }
    m.innerHTML = '<span class="spin"></span> Asking Gemini which models this key can use…';
    try{
      const {ids, pick} = await geminiModels(me.coach.geminiKey); const curM = me.coach.geminiModel || pick;
      $('#sGModel').innerHTML = (ids.length ? ids : [pick]).map(id => `<option value="${esc(id)}" ${id === curM ? 'selected' : ''}>${esc(id)}${id === pick ? ' (suggested)' : ''}</option>`).join('');
      if (!me.coach.geminiModel){ me.coach.geminiModel = pick; saveDb(); }
      m.textContent = `${plural(ids.length, 'model')} available. A Flash model is quick and cheap enough for feedback.`;
    }catch(err){ m.textContent = err.message; }
  };
  $('#sAuto').onchange = e => { me.coach.auto = e.target.checked; saveDb(); };
  $('#sRelay').oninput = e => { me.coach.relayUrl = e.target.value.trim(); saveDb(); };
  $('#sToken').oninput = e => { me.coach.token = e.target.value.trim(); saveDb(); };
  $('#sKey').oninput = e => { me.coach.key = e.target.value.trim(); saveDb(); };
  $('#sModel').onchange = e => { me.coach.model = e.target.value; saveDb(); };
  $('#sTest').onclick = async () => { const m = $('#sTestMsg'); m.innerHTML = '<span class="spin"></span> Testing…'; try{ const r = await aiCoach({id:'test', kind:'grow', context:{type:'subject', name:'Mathematics'}, subject:'Mathematics', topic:'Test', answers:{g1:'I understand that simultaneous equations are two rules that must both be true at once, because the lines cross at one point.', r2:'Redo Q3 to Q5 tonight after dinner for 20 minutes.'}, competencies:[]}, {test:true, noStatements:true}); m.textContent = 'The coach answered: “' + r.question + '”'; }catch(e){ m.textContent = e.message; } };
  $('#sExport').onclick = () => download(`e21cc-log-${(me.name || 'me').replace(/\W+/g, '-').toLowerCase()}-${today()}.json`, STORE.exportProfile(me));
  $('#sImport').onchange = async ev => {
    const f = ev.target.files[0]; if (!f) return;
    try{
      const pr = STORE.parseImport(await f.text()); let added = 0, updated = 0;
      for (const e of pr.entries){ const i = me.entries.findIndex(x => x.id === e.id); if (i < 0){ me.entries.push(e); added++; } else if (version(e) > version(me.entries[i])){ const keepNotes = me.entries[i].notes || []; e.notes = [...keepNotes, ...(e.notes || []).filter(n => !keepNotes.some(k => k.id === n.id))]; me.entries[i] = e; updated++; } else { const cur = me.entries[i]; for (const n of (e.notes || [])) if (!cur.notes.some(k => k.id === n.id)) cur.notes.push(n); } }
      if (!me.email && pr.email) me.email = pr.email;
      for (const g of pr.groups) addGroupToMe(g.code);
      const xs = pr.experiences || {}; for (const s of (xs.subjects || [])) if (!me.experiences.subjects.includes(s)) me.experiences.subjects.push(s); if (!me.experiences.cca && xs.cca) me.experiences.cca = xs.cca;
      const landed = applyPendingNotes(); saveDb();
      toast(`Imported ${plural(added, 'new entry', 'new entries')}${updated ? `, updated ${updated}` : ''}${landed ? `, and ${plural(landed, 'waiting note')} landed` : ''}.`, 3400);
      Promise.all(me.groups.map(g => loadGroup(g.code))).then(loadStatements);
    }catch{ toast('That file is not a log export.'); }
    ev.target.value = '';
  };
  $('#sCopyAll').onclick = () => copyText(me.entries.slice().sort((a, b) => a.created - b.created).map(e => entryText(e, true)).join('\n\n' + '─'.repeat(24) + '\n\n'));
  const dv1 = $('#sDropV1'); if (dv1) dv1.onclick = () => { STORE.dropV1(); toast('The old copy is gone.'); renderSettings(); };
  $('#pinChange').onsubmit = async e => { e.preventDefault(); const pin = new FormData(e.target).get('pin').trim(); if (!pin){ me.pin = null; saveDb(); toast('PIN removed.'); return; } if (!/^\d{4}$/.test(pin)){ toast('Four digits.'); return; } me.pin = await hashPin(me.email || me.id, pin); saveDb(); toast('PIN set.'); e.target.reset(); };
  $('#sOut').onclick = () => { db.current = null; saveDb(); me = null; unlocked = false; applyPrefs(); location.hash = '#/welcome'; };
  $('#sDelete').onclick = () => { dialog(`<h2>Delete ${esc(me.name)}’s log from this device?</h2><p>${plural(me.entries.length, 'entry', 'entries')}. Export first if you want to keep them. This cannot be undone.</p><div class="row"><button class="btn danger" id="dYes">Delete</button><button class="btn sec" id="dNo">Keep it</button></div>`); $('#dYes').onclick = () => { delete db.profiles[me.id]; db.current = null; me = null; unlocked = false; saveDb(); closeDialog(); applyPrefs(); location.hash = '#/welcome'; }; $('#dNo').onclick = closeDialog; };
}
