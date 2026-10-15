/* ==================================================================
   Competency Development Log: the student app.
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
    prefs:{mood:'mountain', accent:'yellow', size:'normal', avatar:EMOJIS[Math.floor(Math.random() * EMOJIS.length)], motto:MOTTOS[0]},
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
function toast(msg, ms = 2600){ const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.hidden = true, ms); }
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
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', flag:'<path d="M5 21V4h11l-1.5 4L16 12H5"/>'
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
function applyPrefs(){
  const p = me ? me.prefs : {mood:'mountain', accent:'yellow', size:'normal'};
  document.body.dataset.mood = p.mood; document.body.dataset.accent = p.accent; document.body.dataset.size = p.size;
  const tc = {mountain:'#0b1446', paper:'#faf8f2', sunrise:'#fff7c9', night:'#07091a'}[p.mood] || '#0b1446';
  const m = document.getElementById('themeColor'); if (m) m.content = tc;
}

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
function COACH_MODES(){
  const relay = relayFor(null);
  const m = [
    ['builtin', 'Built in only', 'Works offline. Nothing leaves the device.'],
    ['relay', 'School coach link', 'Your teacher gives you a link and a class token. The school holds the key.' + (relay ? ' Your group already provides one.' : '')],
    ['local', 'On this device (Chrome built in AI)', 'Free and private, but only on Chrome 148 or newer on a laptop or Chromebook Plus, after a one time model download.']
  ];
  if (SAMPLE || (me && me.coach.mode === 'preview')) m.splice(1, 0, ['preview', 'Claude in this preview', 'Uses the Claude account that opened this preview. For trying the coach before a class link exists; students never see this.']);
  if (ADULT() || (me && me.coach.mode === 'key')) m.push(['key', 'A key held by an adult', 'AI providers require account holders to be 18 or older, so this is for a teacher or parent who sets up the device. The key stays in this browser.']);
  return m;
}
/* Credit guard: a daily allowance of coach reads that cost the school money. */
const METERED = ['relay', 'key'];
function dailyLimit(){ const v = myGroups().map(g => g.cfg && g.cfg.relay && Number(g.cfg.relay.daily)).filter(n => n > 0); return v.length ? Math.max(...v) : 8; }
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
  const session = await LanguageModel.create({initialPrompts:[{role:'system', content:coachSystem(cls, stmts) + '\n\n' + shapeHint(stmts)}]});
  const prompt = entryForCoach(entry); let text;
  try{ text = await session.prompt(prompt, {responseConstraint:coachSchema(stmts)}); }catch{ text = await session.prompt(prompt); }
  try{ session.destroy && session.destroy(); }catch{}
  return finish(entry, parseModelJson(text), 'chrome-built-in', stmts);
}
async function previewCoach(entry, cls, stmts){
  if (!SAMPLE) throw new Error('Claude is not available in this view. Open the preview in claude.ai, or use the school coach link.');
  let data;
  try{ data = await SAMPLE.json(coachSystem(cls, stmts) + '\n\n' + shapeHint(stmts) + '\n\nThe entry:\n\n' + entryForCoach(entry), {modelTier:'default', cache:false}); }
  catch(e){
    const m = {not_granted:'You did not allow this preview to use Claude.', rate_limited:'Claude is busy for this account. Try again in a minute.', refused:'Claude declined to read this one.', invalid_json:'Claude answered in a shape the page could not read. Try again.', sampling_disabled:'Claude is not available for this account.', session_expired:'Sign in to claude.ai again.'};
    throw new Error(m[e && e.code] || (e && e.message) || 'The preview coach could not answer.');
  }
  if (!data || typeof data !== 'object') throw new Error('Claude answered in a shape the page could not read.');
  return finish(entry, data, 'claude (preview)', stmts);
}
async function aiCoach(entry, opts = {}){
  const c = me.coach; const cls = groupFor(entry); const stmts = opts.noStatements ? [] : myStatements();
  if (c.mode === 'preview') return previewCoach(entry, cls, stmts);
  if (c.mode === 'local') return localCoach(entry, cls, stmts);
  if (METERED.includes(c.mode) && !opts.test && readsLeft() <= 0) throw new AllowanceError(`You have used today’s ${dailyLimit()} coach reads. The built in read stands; the coach is back tomorrow.`);
  const body = {
    model:c.model || 'claude-opus-5', max_tokens:1500,
    system:coachSystem(cls, stmts),
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
  const msg = `${me.name}: ${plural(chosen.length, 'item')} from my Competency Development Log. Open in your teacher console: ${link}`;
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
  if (db.current && db.profiles[db.current]) me = db.profiles[db.current];
  applyPrefs();
  const link = stashLink();
  if ((location.hash || '').startsWith('#/config')) await importConfigFromHash();
  if (QS.get('class') && !me) db._preClass = QS.get('class').toUpperCase();
  route();
  if (me){ await Promise.all(me.groups.map(g => loadGroup(g.code))); await loadStatements(); const h = location.hash || '#/'; if (h === '#/' || h.startsWith('#/basket')) route(); }
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
function route(){
  const h = location.hash || '#/';
  if (h.startsWith('#/note')){ const l = stashLink(); processStashedLink(l); return; }
  if (h.startsWith('#/config')){ importConfigFromHash(); return; }
  if (!me || (me.pin && !unlocked)){ if (h !== '#/welcome'){ location.hash = '#/welcome'; return; } return renderWelcome(); }
  if (h.startsWith('#/grow')) return openComposer('grow', h.split('/')[2]);
  if (h.startsWith('#/act')) return openComposer('act', h.split('/')[2]);
  if (h.startsWith('#/across/')){ const [, , b, id] = h.split('/'); return openComposer('across', id, b); }
  closeComposer();
  if (h.startsWith('#/entry/')) return renderEntry(h.slice(8));
  if (h.startsWith('#/basket/')) return renderBasket(h.split('/')[2].split('?')[0]);
  if (h.startsWith('#/log') || h.startsWith('#/journey')) return renderLog();
  if (h.startsWith('#/sharing')) return renderSharing();
  if (h.startsWith('#/settings')) return renderSettings();
  if (h.startsWith('#/welcome')) return renderWelcome();
  return renderMap();
}
function frame(inner, active, opts = {}){
  const nav = [['#/', 'map', 'Map'], ['#/log', 'log', 'Log'], ['#/settings', 'settings', 'Settings']];
  const links = nav.map(([h, i, l]) => `<a href="${h}" class="${active === i ? 'on' : ''}" ${active === i ? 'aria-current="page"' : ''}>${icon(i)}<span>${l}</span></a>`).join('');
  const desk = nav.map(([h, i, l]) => `<a href="${h}" class="${active === i ? 'on' : ''}">${l}</a>`).join('');
  document.body.classList.toggle('wide', !!opts.wide);
  $('#app').innerHTML = `
    <header class="top">
      <a class="brand" href="#/"><img src="assets/crest.png" alt=""><span><span class="word">Competency Development Log</span><span class="sub">Beatty Secondary School</span></span></a>
      <nav class="desknav" aria-label="Sections">${desk}</nav>
      <button class="avatar" aria-label="Settings" onclick="location.hash='#/settings'">${esc(me.prefs.avatar)}</button>
    </header>
    <nav class="nav" aria-label="Sections">${links}</nav>
    <main class="fade">${inner}</main>
    <footer class="footer"><b>Beatty Secondary School</b> · Non Vi Sed Arte · Nurturing Adaptive Thinkers, Agile Learners and Active Contributors<br>Your log lives on this device${GUEST ? ' (guest: nothing is saved)' : ''}. Export it in Settings to keep a copy.</footer>`;
  scrollTop();
}
function scrollTop(){ window.scrollTo(0, 0); if (EMBED){ try{ document.documentElement.scrollIntoView({block:'start'}); }catch{} } }

/* ---------- welcome ---------- */
function renderWelcome(){
  document.body.classList.remove('wide');
  const profiles = Object.values(db.profiles).sort((a, b) => b.created - a.created);
  const pre = db._preClass || '';
  $('#app').innerHTML = `
  <div class="welcome">
    <header class="top"><a class="brand" href="#/welcome"><img src="assets/crest.png" alt=""><span><span class="word">Competency Development Log</span><span class="sub">Beatty Secondary School</span></span></a></header>
    <section class="hero fade">
      <h1>GROW by reflecting.<br>ACT on feedback.</h1>
      <p class="motto">Believe you can.</p>
      <p class="meta">One log, from your first year at Beatty to your last. Write after lessons, CCA, camps and competitions. Watch your competencies grow, backed by your own words.</p>
    </section>
    ${profiles.length ? `<section class="card fade"><h2>Welcome back</h2><div class="profiles">${profiles.map(p => `
      <button class="pcard" data-id="${p.id}"><span class="avatar">${esc(p.prefs.avatar)}</span><span><b>${esc(p.name)}</b><small>${esc((p.groups[0] || {}).code || 'no group yet')} · ${plural(p.entries.length, 'entry', 'entries')}${p.pin ? ' · PIN' : ''}</small></span></button>`).join('')}</div>
      <div id="pinBox" hidden style="margin-top:12px"></div>
      </section>` : ''}
    <section class="card fade">
      <h2>${profiles.length ? 'Someone new?' : 'Start your log'}</h2>
      <form id="newForm" autocomplete="on">
        <label class="f"><span>Your name</span><input class="in" name="name" required maxlength="60" placeholder="What your teacher calls you" autocapitalize="words" autocomplete="name" enterkeyhint="next"></label>
        <label class="f"><span>School email</span><input class="in" name="email" type="email" inputmode="email" maxlength="120" placeholder="name@students.edu.sg" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="email" enterkeyhint="next"><small>Your teachers use this to find your entries, and their notes find you by it. It is never sent to the AI coach.</small></label>
        <label class="f"><span>Group code <small style="display:inline">(optional)</small></span><input class="in" name="classCode" maxlength="16" value="${esc(pre)}" placeholder="e.g. 2E3-MATH" style="text-transform:uppercase" autocapitalize="characters" autocorrect="off" spellcheck="false" autocomplete="off" enterkeyhint="next"><small>A teacher gives you this for a class or a CCA. It brings in their voice and their drop box. You can add more groups later.</small></label>
        <label class="f"><span>4 digit PIN <small style="display:inline">(optional)</small></span><input class="in" name="pin" inputmode="numeric" pattern="\\d{4}" maxlength="4" placeholder="For shared devices" autocomplete="off" enterkeyhint="done"><small>Stops classmates opening your log on a shared laptop. It is not a password for anything else.</small></label>
        <button class="btn wide" type="submit">${icon('arrow')} Open my log</button>
      </form>
      <p class="tiny" style="margin-top:12px">Nothing here goes to a server. Your log is saved in this browser only, so export it from Settings now and then. <a href="?guest=1#/welcome">Try as a guest</a> (nothing saved).</p>
    </section>
    <img class="band" src="assets/footer-band.jpg" alt="Beatty Secondary School, Non Vi Sed Arte">
    <p class="footer" style="padding-top:8px">Nurturing Adaptive Thinkers, Agile Learners and Active Contributors</p>
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
    Promise.all(me.groups.map(g => loadGroup(g.code))).then(loadStatements).then(() => { if ((location.hash || '#/') === '#/') route(); });
    location.hash = '#/'; route(); processStashedLink();
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
    else $('#pinMsg').textContent = 'That PIN did not match. Forgotten it? Your teacher cannot reset it, but a new profile can import an exported log.';
  };
  $('#pinForm input').focus();
}

/* ---------- the Basecamp map ---------- */
function weekKey(t){ const d = new Date(t); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); d.setHours(0, 0, 0, 0); return d.getTime(); }
function streak(entries){ const weeks = new Set(entries.map(e => weekKey(e.created))); let n = 0; let w = weekKey(Date.now()); if (!weeks.has(w)) w -= 7 * 864e5; while (weeks.has(w)){ n++; w -= 7 * 864e5; } return n; }
/* One point per day an entry filed to the basket was written; height is the strongest evidence that day. */
function trailPoints(b, year){
  const pts = me.entries.filter(e => e.kind !== 'across' && new Date(e.created).getFullYear() === year && basketsOf(e).includes(b)).map(e => ({t:e.created, y:Math.max(1, strengthIn(e, b))})).sort((x, y) => x.t - y.t);
  const out = []; for (const p of pts){ const d = new Date(p.t).toDateString(); const last = out[out.length - 1]; if (last && last.d === d){ last.y = Math.max(last.y, p.y); last.n++; } else out.push({d, t:p.t, y:p.y, n:1}); }
  return out;
}
/* The SVG stretches to the card's width; strokes and dots keep their size (non scaling strokes). */
function trailSvg(points, lits, year){
  // a lane at the top for unlocked statements, then the trail: base camp at the bottom, ridge at the top
  const W = 340, H = 76, L = 10, R = 10; const X = f => L + f * (W - L - R); const Y = v => 62 - (v - 1) * 17;
  const now = Date.now(); const cur = new Date(now).getFullYear() === year;
  let s = `<svg class="trail-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">`;
  for (let k = 0; k < 4; k++) s += `<rect x="${X(k / 4) + 1}" y="20" width="${X((k + 1) / 4) - X(k / 4) - 2}" height="${H - 24}" rx="5" class="tb tb${k % 2}"/>`;
  s += `<line x1="${X(0)}" x2="${X(1)}" y1="${Y(1)}" y2="${Y(1)}" class="base"/>`;
  if (cur){ const f = termPos(now).frac; s += `<line x1="${X(f)}" x2="${X(f)}" y1="20" y2="${H - 4}" class="now"/>`; }
  if (points.length){
    // the trail joins the dots in the order they were walked
    if (points.length > 1) s += `<polyline points="${points.map(p => `${X(termPos(p.t).frac).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ')}" class="line"/>`;
    for (const p of points){ const x = X(termPos(p.t).frac).toFixed(1), y = Y(p.y).toFixed(1); s += `<line x1="${x}" x2="${x}" y1="${y}" y2="${y}" class="dot s${p.y}${p.n > 1 ? ' many' : ''}"/>`; }
  }
  for (const t of lits){ const x = X(termPos(t).frac).toFixed(1); s += `<line x1="${x}" x2="${x}" y1="9" y2="9" class="lit-ring"/><line x1="${x}" x2="${x}" y1="9" y2="9" class="lit"/>`; }
  return s + '</svg>';
}
function yearsWithEntries(){ const ys = new Set(me.entries.map(e => new Date(e.created).getFullYear())); ys.add(new Date().getFullYear()); return [...ys].sort(); }
function renderMap(){
  const q = new URLSearchParams((location.hash.split('?')[1]) || ''); const years = yearsWithEntries();
  const year = years.includes(+q.get('y')) ? +q.get('y') : new Date().getFullYear();
  const E = me.entries.slice().sort((a, b) => b.created - a.created);
  const last = E[0]; const s = streak(E); const tp = termPos(Date.now());
  const stmts = myStatements();
  const trails = DOMAINS.map(d => {
    const pts = trailPoints(d.id, year); const sts = stmts.filter(x => x.basket === d.id).map(x => statementStatus(me.entries, x));
    const lit = sts.filter(x => x.lit); const lits = lit.map(x => x.litAt).filter(t => t && new Date(t).getFullYear() === year);
    const ev = pts.reduce((a, p) => a + p.n, 0);
    return `<a class="trail" href="#/basket/${d.id}" aria-label="${esc(d.short)}: ${plural(ev, 'entry', 'entries')} with evidence in ${year}, ${lit.length} of ${sts.length} statements lit. Open the basket.">
      <span class="tl"><b>${esc(d.short)}</b><span class="go" aria-hidden="true">${icon('arrow')}</span><small>${ev ? plural(ev, 'entry', 'entries') : 'No evidence yet'} · ${lit.length} of ${sts.length} statements lit</small></span>
      ${trailSvg(pts, lits, year)}</a>`;
  }).join('');
  const unread = E.flatMap(e => (e.notes || []).filter(n => !n.seen).map(n => ({e, n})));
  const nextEntry = E.find(e => nextStepOf(e) && !me.done[e.id]);
  const drafts = Object.keys(me.drafts || {});
  const termEnd = tp.inTerm ? termsFor(tp.year)[tp.term - 1].end : 0; const daysLeft = termEnd ? Math.ceil((termEnd - Date.now()) / 864e5) : 0;
  const acrossDone = new Set(me.entries.filter(e => e.kind === 'across' && e.term === termKey(Date.now())).map(e => e.basket));
  frame(`
    <section class="hero">
      <h1>${esc(firstName(me.name))}’s Log</h1>
      <p class="motto">${esc(me.prefs.motto || 'Believe you can.')}</p>
      <p class="meta">${tp.inTerm ? `Term ${tp.term} · Week ${tp.week}` : 'School holidays'} · ${E.length ? `${plural(E.length, 'entry', 'entries')} · ${s ? s + ' week' + (s > 1 ? 's' : '') + ' in a row' : 'no entry this week yet'}` : 'Your first entry is the hardest. It gets easier from the second.'}</p>
      ${years.length > 1 ? `<div class="seg years" role="group" aria-label="Year">${years.map(y => `<button onclick="location.hash='#/?y=${y}'" class="${y === year ? 'on' : ''}">${y}</button>`).join('')}</div>` : ''}
    </section>
    <section class="card mapcard" aria-labelledby="mapH">
      <div class="maphead"><h2 id="mapH">Your four baskets</h2><span class="tiny">▲ Ridge</span></div>
      <div class="trails">${trails}</div>
      <div class="terms" aria-hidden="true"><span>T1</span><span>T2</span><span>T3</span><span>T4</span></div>
      <p class="tiny legend">Each dot is a day with evidence; higher means stronger evidence in your own words. <span class="litkey" aria-hidden="true"></span> marks a statement you unlocked. Tap a basket to open it.</p>
    </section>
    <div class="verbs">
      <button class="verb" onclick="location.hash='#/grow'"><span class="glyph">${ringSvg('grow')}</span><span><b>GROW</b><span>Reflect on a lesson, a session, a day${drafts.includes('grow') ? ' · draft saved' : ''}</span></span><span class="go">${icon('arrow')}</span></button>
      <button class="verb" onclick="location.hash='#/act'"><span class="glyph">${ringSvg('act')}</span><span><b>ACT</b><span>Act on feedback${drafts.includes('act') ? ' · draft saved' : ''}</span></span><span class="go">${icon('arrow')}</span></button>
    </div>
    ${last ? `<p class="lastline"><a href="#/entry/${last.id}">Last: ${esc(entryTitle(last))}, ${fmtDay(last.created)}</a> · <a href="#/log">All entries</a></p>` : ''}
    ${unread.length ? `<a class="card notecard" href="#/entry/${unread[0].e.id}">${icon('note')}<span><b>${plural(unread.length, 'new note')} from ${esc(unread[0].n.by)}${new Set(unread.map(u => u.n.by)).size > 1 ? ' and others' : ''}</b><small>On ${esc(entryTitle(unread[0].e))}</small></span></a>` : ''}
    ${tp.inTerm && daysLeft <= 21 && acrossDone.size < 4 ? `<section class="card flat"><h2>Term ${tp.term} ends in ${plural(daysLeft, 'day')}</h2><p class="muted">Look across one basket before it does: read your evidence, then answer three questions. It is the best ten minutes of the term.</p><div class="chips">${DOMAINS.map(d => `<a class="chip ${acrossDone.has(d.id) ? 'on' : ''}" href="#/across/${d.id}">${acrossDone.has(d.id) ? icon('check') : ''}${esc(d.short)}</a>`).join('')}</div></section>` : ''}
    ${nextEntry ? `<section class="card"><h2>Your next step</h2><div class="next"><input type="checkbox" id="doneNext" aria-label="Done"><p>${esc(nextStepOf(nextEntry))}</p></div><p class="tiny" style="margin:8px 0 0">From your ${FRAMEWORKS[nextEntry.kind].name} entry on ${fmtDay(nextEntry.created)}. Tick it when it is done, honestly.</p></section>` : ''}
    ${!E.length ? `<section class="card flat"><h2>How the map fills</h2><p class="muted">After a lesson, a training or a camp day, open GROW and answer honestly. Claim a competency and point to where it shows. When your words back the claim, a dot appears on that basket’s trail.</p></section>` : ''}
  `, 'map');
  const cb = $('#doneNext'); if (cb) cb.onchange = () => { me.done[nextEntry.id] = true; saveDb(); toast('Ticked. That is how habits are built.'); setTimeout(route, 400); };
}

/* ---------- a basket: statements with their evidence, then the look across ---------- */
function renderBasket(id){
  const d = basketOf(id); if (!d){ location.hash = '#/'; return; }
  const q = new URLSearchParams((location.hash.split('?')[1]) || '');
  const bands = STMT_SET.bands; const band = bands ? (q.get('band') || me.band || bands[0].id) : null;
  const stmts = statementsFor(STMT_SET, band).filter(s => s.basket === id);
  const sts = stmts.map(s => statementStatus(me.entries, s));
  const byDate = (a, b) => b.created - a.created;
  const filed = me.entries.filter(e => e.kind !== 'across' && basketsOf(e).includes(id)).sort(byDate);
  const linked = new Set(sts.flatMap(s => s.links.map(k => k.e.id)));
  const loose = filed.filter(e => !linked.has(e.id));
  const acrosses = me.entries.filter(e => e.kind === 'across' && e.basket === id).sort(byDate);
  const tk = termKey(Date.now()); const mine = acrosses.find(e => e.term === tk);
  const lit = sts.filter(s => s.lit).length;
  const row = st => {
    const s = st.stmt;
    const ev = st.links.map(k => `<div class="ev ${k.backed ? 'ok' : ''}"><div class="row" style="justify-content:space-between;gap:6px"><a href="#/entry/${k.e.id}">${esc(entryTitle(k.e))}, ${fmtDay(k.e.created)}</a><span class="str ${k.backed ? 'strong' : 'none'}">${k.backed ? 'Backed' : 'Not backed yet'}</span></div>${k.l.quote ? `<q>${esc(k.l.quote)}</q>` : ''}<button class="linkbtn" data-unlink="${k.e.id}|${esc(s.id)}">Unlink</button></div>`).join('');
    const sug = st.suggested.slice(0, 2).map(e => { const m = ((e.e21cc && e.e21cc.statements) || []).find(x => x.sid === s.id); return `<div class="sugg"><span class="kick">Coach suggests</span><a href="#/entry/${e.id}">${esc(entryTitle(e))}, ${fmtDay(e.created)}</a>${m && m.quote ? `<q>${esc(m.quote)}</q>` : ''}<button class="btn small sec" data-linkit="${e.id}|${esc(s.id)}">${icon('link')} Link it</button></div>`; }).join('');
    const probe = (s.competencies.map(compOf).find(Boolean) || {}).probe || '';
    return `<li class="st ${st.state}"><span class="mark" aria-hidden="true"></span><div class="grow">
      <p class="st-text">${esc(s.text)}<span class="sr"> (${st.state === 'lit' ? 'unlocked' : st.state === 'linked' ? 'linked, not backed yet' : 'no evidence yet'})</span></p>
      ${ev}${st.state === 'linked' ? `<small class="muted">Linked, but the words do not show it yet. ${esc(probe)}</small>` : ''}${sug}
      <button class="btn small ${st.links.length ? 'ghost' : 'sec'}" data-linkone="${esc(s.id)}">${icon('link')} ${st.links.length ? 'Link another' : 'Link one'}</button></div></li>`;
  };
  frame(`
    <section class="hero"><p class="kicker"><a href="#/">Map</a> · Basket</p><h1>${esc(d.label)}</h1><p class="meta">${esc(d.blurb)}</p><p class="meta"><b>${lit} of ${stmts.length}</b> statements lit · ${plural(filed.length, 'entry', 'entries')} filed here</p></section>
    ${STMT_SET.placeholder ? `<div class="notice">These are sample statements. The school’s own I can statements will replace them; your links carry over where the ids stay the same.</div>` : ''}
    <section class="card">
      <div class="row" style="justify-content:space-between"><h2 style="margin:0">I can</h2>${bands ? `<div class="seg" role="group" aria-label="Level">${bands.map(b => `<button onclick="location.hash='#/basket/${id}?band=${b.id}'" class="${b.id === band ? 'on' : ''}">${esc(b.label)}</button>`).join('')}</div>` : ''}</div>
      <p class="tiny" style="margin:6px 0 10px">A statement lights when you link an entry and your words in it back the statement. Linking alone is not enough.</p>
      ${stmts.length ? `<ul class="stmts">${sts.map(row).join('')}</ul>` : '<p class="muted">No statements for this basket yet.</p>'}
    </section>
    <section class="card"><h2>Filed here, not linked</h2>
      ${loose.length ? `<p class="tiny">Entries whose claim or evidence sits in this basket. Link one to a statement it backs.</p>${loose.map(entryRow).join('')}` : `<p class="muted">${filed.length ? 'Every entry here is linked to a statement.' : 'Nothing filed here yet. Claim a competency from this basket on your next GROW or ACT and point to where it shows.'}</p>`}
    </section>
    <section class="card"><h2>Look across</h2>
      <p class="tiny">Once a term: read your evidence for this basket, then answer three questions.</p>
      ${mine ? entryRow(mine) : `<a class="btn" href="#/across/${id}">${icon('eye')} Look across ${termLabel(tk)}</a>`}
      ${acrosses.filter(e => e !== mine).length ? `<h3 style="margin-top:14px">Earlier terms</h3>${acrosses.filter(e => e !== mine).map(entryRow).join('')}` : ''}
    </section>
  `, 'map');
  $$('[data-linkone]').forEach(b => b.onclick = () => linkDialog(b.dataset.linkone, id));
  $$('[data-linkit]').forEach(b => b.onclick = () => { const [eid, sid] = b.dataset.linkit.split('|'); const e = me.entries.find(x => x.id === eid); const m = ((e.e21cc && e.e21cc.statements) || []).find(x => x.sid === sid); addLink(e, sid, m ? m.quote : ''); });
  $$('[data-unlink]').forEach(b => b.onclick = () => { const [eid, sid] = b.dataset.unlink.split('|'); const e = me.entries.find(x => x.id === eid); if (e){ e.links = e.links.filter(l => l.sid !== sid); saveDb(); toast('Unlinked.'); route(); } });
}
function addLink(e, sid, quote){
  if (!e) return; const s = statementById(sid);
  e.links = (e.links || []).filter(l => l.sid !== sid); e.links.push({sid, quote:String(quote || '').slice(0, 400), at:Date.now()}); saveDb();
  closeDialog();
  toast(s && linkBacked(e, s) ? 'Linked, and your words back it. The statement is lit.' : 'Linked. The coach has not seen it in your words yet.', 3400);
  route();
}
/* Link one: pick an entry, then the sentence of yours that shows the statement. */
function linkDialog(sid, basket){
  const s = statementById(sid); if (!s) return;
  const filed = me.entries.filter(e => e.kind !== 'across' && basketsOf(e).includes(basket)).sort((a, b) => b.created - a.created);
  const others = me.entries.filter(e => e.kind !== 'across' && !filed.includes(e)).sort((a, b) => b.created - a.created).slice(0, 20);
  const btn = e => `<button class="entry" data-e="${e.id}">${medal(e.kind)}<span class="grow"><b>${esc(entryTitle(e))}</b><small>${fmtDay(e.created)}${(e.links || []).some(l => l.sid === sid) ? ' · already linked' : ''}</small></span></button>`;
  dialog(`<h2>Link an entry</h2><p class="st-quote">${esc(s.text)}</p>
    ${filed.length ? `<span class="kick">Filed in this basket</span>${filed.map(btn).join('')}` : ''}
    ${others.length ? `<span class="kick" style="margin-top:10px">Other entries</span>${others.map(btn).join('')}` : ''}
    ${!filed.length && !others.length ? '<p class="muted">Write a GROW or ACT entry first.</p>' : ''}
    <div class="row" style="margin-top:12px"><button class="btn sec" id="dClose">Cancel</button></div>`);
  $('#dClose').onclick = closeDialog;
  $$('#dlgBody [data-e], #inlineDlg [data-e]').forEach(b => b.onclick = () => {
    const e = me.entries.find(x => x.id === b.dataset.e); const sents = sentencesOf(entryAnswersText(e));
    const sug = ((e.e21cc && e.e21cc.statements) || []).find(x => x.sid === sid);
    const pre = sug ? sents.findIndex(t => normText(t).includes(normText(sug.quote)) || normText(sug.quote).includes(normText(t))) : -1;
    dialog(`<h2>Which words show it?</h2><p class="st-quote">${esc(s.text)}</p><p class="tiny">Pick the sentence from “${esc(entryTitle(e))}” that shows this. The quote is what your teacher sees.</p>
      <div class="stack" id="sentList">${sents.map((t, i) => `<label class="pick-row"><input type="radio" name="sent" value="${i}" ${i === (pre >= 0 ? pre : 0) ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('') || '<p class="muted">This entry has no words yet.</p>'}</div>
      <div class="row" style="margin-top:12px"><button class="btn" id="dLink" ${sents.length ? '' : 'disabled'}>${icon('link')} Link</button><button class="btn sec" id="dBack">Back</button></div>`);
    $('#dBack').onclick = () => linkDialog(sid, basket);
    $('#dLink').onclick = () => { const r = $$('#sentList input').find(x => x.checked); addLink(e, sid, r ? sents[+r.value] : ''); };
  });
}

/* ---------- composer: GROW, ACT, and the termly look across ---------- */
function draftKey(kind, basket){ return kind === 'across' ? 'across:' + basket : kind; }
function openComposer(kind, editId, basket){
  if (kind === 'across' && !basketOf(basket)){ location.hash = '#/'; return; }
  const key = draftKey(kind, basket);
  if (!draft || draft.key !== key || (editId && draft.editId !== editId) || (!editId && draft.editId)){
    let base = me.drafts[key] ? JSON.parse(JSON.stringify(me.drafts[key])) : null;
    // a Learning Log draft carries a subject, not a context
    if (base && !base.context && base.subject) base.context = {type:inferContextType(base.subject), name:base.subject};
    if (editId){
      const e = me.entries.find(x => x.id === editId);
      if (e){ base = JSON.parse(JSON.stringify(e)); base.coachAi = e.coach && e.coach.ai ? JSON.parse(JSON.stringify(e.coach.ai)) : null;
        // reads made before v2 carry no hash: they were made on these words
        if (base.coachAi && !base.coachAi.inputHash) base.coachAi.inputHash = inputHash(e, myStatements()); }
    }
    const pg = primaryGroup();
    draft = Object.assign({kind, key, step:0, context:{type:'subject', name:''}, topic:'', groupCode:'', feedbackFrom:'teacher', feedbackText:'', answers:{}, competencies:[], basket:basket || null, term:termKey(Date.now())}, base || {});
    draft.key = key; draft.editId = editId || null; draft.step = draft.step || 0;
    if (!draft.context) draft.context = {type:inferContextType(draft.subject), name:draft.subject || ''};
    if (kind !== 'across' && !draft.context.name && !editId && pg){ draft.context = {type:pg.type === 'cca' ? 'cca' : 'subject', name:pg.subject || ''}; draft.groupCode = draft.groupCode || pg.code; }
    if (kind === 'across') draft.lookedAt = acrossEvidence(basket, draft.term).map(x => ({eid:x.e.id, quote:x.q.quote})).slice(0, 8);
  }
  renderComposer();
}
function closeComposer(){ $('#sheet').innerHTML = ''; document.body.classList.remove('composing'); }
function saveDraft(){ if (!draft) return; const d = Object.assign({}, draft); delete d.editId; delete d.coachAi; if (!draft.editId) me.drafts[draft.key] = d; saveDb(); }
function stepsOf(){ const fw = FRAMEWORKS[draft.kind]; return draft.kind === 'across' ? ['evidence', ...fw.steps.map((_, i) => 'letter' + i), 'readback'] : ['context', ...fw.steps.map((_, i) => 'letter' + i), 'lens', 'readback']; }
function renderComposer(){
  const fw = FRAMEWORKS[draft.kind]; const steps = stepsOf(); const n = steps.length; const i = Math.min(draft.step, n - 1); const kind = steps[i];
  const stepsHtml = steps.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'now' : ''}"></i>`).join('');
  let body = '', head = '';
  if (kind === 'context'){ head = stepHead(null, 'Before you start', fw.tagline); body = contextStep(fw); }
  else if (kind === 'evidence'){ const b = basketOf(draft.basket); head = stepHead({colour:'yellow', letter:'L'}, `${termLabel(draft.term)} · ${esc(b.short)}`, 'Read your <em>evidence</em>'); body = evidenceStep(); }
  else if (kind.startsWith('letter')){ const k = +kind.slice(6); const s = fw.steps[k]; head = stepHead(s, draft.kind === 'across' ? `Look across · ${esc(basketOf(draft.basket).short)}` : `${fw.name} · step ${k + 1} of ${fw.steps.length}`, s.title); body = letterStep(s); }
  else if (kind === 'lens'){ head = stepHead(null, 'Your claim', 'Which <em>competency</em> did you use?'); body = lensStep(); }
  else { head = stepHead(null, 'Read it back', 'Your reflection, and a <em>coach</em>'); body = readbackStep(); }
  const last = i === n - 1;
  const title = draft.kind === 'across' ? `Look across · ${basketOf(draft.basket).short}` : `${fw.name}${draft.context.name ? ' · ' + draft.context.name : ''}`;
  $('#sheet').innerHTML = `<div class="sheet" role="dialog" aria-label="${esc(fw.name)} entry"><div class="inner">
    <div class="bar"><button class="iconbtn" id="cClose" aria-label="Close">${icon('close')}</button><b class="grow">${esc(title)}</b><span class="tiny" style="color:inherit;opacity:.7">saved</span></div>
    <div class="steps" aria-hidden="true">${stepsHtml}</div>
    ${head}
    <div class="card fade">${body}</div>
  </div>
  <div class="dock"><div class="inner">
    <button class="btn ghost" id="cBack" ${i === 0 ? 'disabled' : ''}>${icon('back')} Back</button>
    ${last ? `<button class="btn acc" id="cSave">${icon('check')} ${draft.editId ? 'Save changes' : 'Log it'}</button>` : `<button class="btn" id="cNext">Next ${icon('arrow')}</button>`}
  </div></div></div>`;
  $('#cClose').onclick = () => { collect(); saveDraft(); draft = null; location.hash = draftReturn(); };
  $('#cBack').onclick = () => { collect(); draft.step = Math.max(0, i - 1); saveDraft(); renderComposer(); };
  const nx = $('#cNext'); if (nx) nx.onclick = () => { collect(); draft.step = i + 1; saveDraft(); renderComposer(); };
  const sv = $('#cSave'); if (sv) sv.onclick = saveEntry;
  $$('textarea.in, input.in', $('#sheet')).forEach(t => t.addEventListener('focus', () => { setTimeout(() => { try{ t.scrollIntoView({block:'center', behavior:'smooth'}); }catch{} }, 250); }));
  $$('textarea.in', $('#sheet')).forEach(t => { autosize(t); t.addEventListener('input', () => { autosize(t); debounceSave(); }); });
  $$('input.in', $('#sheet')).forEach(t => t.addEventListener('input', debounceSave));
  $$('[data-where]', $('#sheet')).forEach(inp => inp.addEventListener('input', () => { const t = (draft.competencies || []).find(x => x.id === inp.dataset.where); if (t) t.where = inp.value.trim(); }));
  wireStep();
  document.body.classList.add('composing'); document.body.classList.remove('wide');
  scrollTop();
  const first = $('.sheet textarea'); if (first && kind.startsWith('letter') && window.innerWidth > 760) first.focus();
}
function draftReturn(){ return draft && draft.kind === 'across' ? '#/basket/' + draft.basket : '#/'; }
let saveT = null; function debounceSave(){ clearTimeout(saveT); saveT = setTimeout(() => { if (!draft) return; collect(); saveDraft(); }, 400); }
function autosize(t){ t.style.height = 'auto'; t.style.height = Math.max(96, t.scrollHeight + 4) + 'px'; }
function stepHead(s, kicker, title){
  const m = s ? `<span class="medal ${s.colour}">${s.letter}</span>` : `<span class="medal navy">${icon('spark')}</span>`;
  return `<div class="stephead">${m}<div><div class="kicker">${kicker}</div><h2>${title}</h2></div></div>`;
}
function collect(){
  const sh = $('#sheet'); if (!sh || !draft) return;
  $$('[data-a]', sh).forEach(el => { draft.answers[el.dataset.a] = el.value; });
  const nm = $('[name=ctxName]', sh); if (nm) draft.context.name = nm.value.trim();
  const top = $('[name=topic]', sh); if (top) draft.topic = top.value.trim();
  const g = $('[name=groupCode]', sh); if (g) draft.groupCode = g.value;
  const ft = $('[name=feedbackText]', sh); if (ft) draft.feedbackText = ft.value.trim();
}
function contextStep(fw){
  const ct = contextTypeOf(draft.context.type); const gs = myGroups();
  const fromGroups = gs.map(g => g.cfg).filter(Boolean).filter(c => (c.type === 'cca') === (ct.id === 'cca')).flatMap(c => c.subjects && c.subjects.length ? c.subjects : [c.subject]).filter(Boolean);
  const list = Array.from(new Set([...fromGroups, ...(ct.id === 'subject' ? SUBJECTS : [])]));
  return `
    <p class="muted">${fw.id === 'grow' ? 'Use this straight after a lesson, a training, a camp day or a competition, while it is still warm. Eight questions, two per letter. Short and honest beats long and vague.' : 'Use this when you get feedback back: a marked piece, a coach’s comment, a peer’s note. Six questions, two per letter.'}</p>
    <div class="f"><span class="flabel">Where did the learning happen?</span><div class="chips" id="ctxType" role="radiogroup">${CONTEXT_TYPES.map(c => `<button type="button" class="chip ${c.id === ct.id ? 'on' : ''}" data-ctype="${c.id}" role="radio" aria-checked="${c.id === ct.id}">${esc(c.label)}</button>`).join('')}</div></div>
    <label class="f"><span>${ct.id === 'subject' ? 'Subject' : ct.label}</span><input class="in" name="ctxName" list="ctxList" value="${esc(draft.context.name)}" placeholder="${esc(ct.ph)}" autocapitalize="words" autocomplete="off" enterkeyhint="next"><datalist id="ctxList">${list.map(s => `<option value="${esc(s)}">`).join('')}</datalist></label>
    <label class="f"><span>${fw.id === 'grow' ? ct.topic : 'What the feedback was on'}</span><input class="in" name="topic" value="${esc(draft.topic)}" placeholder="${esc(fw.id === 'grow' ? ct.topicPh : 'e.g. Chemistry practical write up')}"></label>
    ${gs.length ? `<label class="f"><span>Group</span><select class="in" name="groupCode"><option value="">None</option>${gs.map(g => `<option value="${esc(g.code)}" ${draft.groupCode === g.code ? 'selected' : ''}>${esc(g.cfg ? groupName(g.cfg) : g.code)}</option>`).join('')}</select><small>Sets whose voice the coach uses, and which teacher can see it if you share.</small></label>` : ''}
    ${fw.id === 'act' ? `
    <div class="f"><span class="flabel">Who gave the feedback?</span>
      <div class="seg" id="fbFrom">${['teacher','coach','peer','myself'].map(x => `<button type="button" data-v="${x}" class="${draft.feedbackFrom === x ? 'on' : ''}">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div></div>
    <label class="f"><span>The feedback, in their words <small style="display:inline">(optional)</small></span><textarea class="in" name="feedbackText" placeholder="Copy or type what they said. Keeping the exact words makes the C step much easier.">${esc(draft.feedbackText)}</textarea></label>` : ''}
    ${fw.id === 'grow' ? `<div class="notice"><b>The circle.</b> Gift, Rise, Own, Watch. The questions say “lesson”; read it as whatever you just learnt from. The coach can only work with what you write.</div>` : `<div class="notice"><b>Feedback is information,</b> not a verdict. Acknowledge it, Connect it, Test something.</div>`}`;
}
/* This term's evidence for a basket, strongest quote per entry. */
function acrossEvidence(basket, term){ return me.entries.filter(e => e.kind !== 'across' && termKey(e.created) === term && basketsOf(e).includes(basket)).map(e => ({e, q:quoteFor(e, basket)})).filter(x => x.q).sort((a, b) => a.e.created - b.e.created); }
function evidenceStep(){
  const b = basketOf(draft.basket); const ev = acrossEvidence(draft.basket, draft.term);
  const sts = myStatements().filter(s => s.basket === draft.basket).map(s => statementStatus(me.entries, s));
  return `<p class="muted">${esc(b.label)}. Read what you wrote this term before you answer. Look for a pattern, not a highlight.</p>
    ${ev.length ? `<ul class="evid">${ev.map(x => `<li><b>${esc(entryTitle(x.e))}</b> <span class="tiny">${fmtDay(x.e.created)}</span><q>${esc(x.q.quote)}</q><span class="str ${x.q.strength}">${STRENGTHS[x.q.strength].label}</span> <small>${esc(compOf(x.q.id).label)}</small></li>`).join('')}</ul>` : `<div class="notice">No evidence filed in this basket this term yet. You can still look across: what did you notice about yourself here, even without an entry?</div>`}
    ${sts.length ? `<h3 style="margin-top:14px">Your statements</h3><ul class="stmts mini">${sts.map(st => `<li class="st ${st.state}"><span class="mark" aria-hidden="true"></span><span>${esc(st.stmt.text)}</span></li>`).join('')}</ul>` : ''}`;
}
function letterStep(s){
  return `${ringSvg(draft.kind, s.k)}` + s.qs.map(q => `
    <label class="q"><span>${q.q}</span>
      <textarea class="in" data-a="${q.id}" placeholder="${q.next ? 'Instead of “study more”, write what, when and for how long.' : 'Three honest sentences are enough.'}">${esc(draft.answers[q.id] || '')}</textarea>
      ${q.next ? `<span class="hint">A small step has a doing verb, a day and a place. Example: “Redo Q4 to Q6 on Tuesday after CCA, 20 minutes, then check with Wei Ling.”</span>` : ''}
    </label>`).join('');
}
function lensStep(){
  const all = Object.values(draft.answers).join('\n'); const seen = detectCompetencies(all).slice(0, 3).map(x => x.c.id);
  const chosen = new Map((draft.competencies || []).map(t => [t.id, t]));
  return `
    <p class="muted">Make a claim: up to two competencies you believe this entry shows. Then point to where it shows. The coach will look for it in your words, and say honestly whether it is there. A claim your words back files the entry into that basket.</p>
    ${DOMAINS.map(d => `<div class="domain"><h3>${esc(d.label)}</h3><div class="d">${esc(d.blurb)}</div>
      ${COMPETENCIES.filter(c => c.d === d.id).map(c => { const t = chosen.get(c.id); const on = !!t;
        return `<div class="comp ${on ? 'on' : ''}" data-c="${c.id}"><button type="button" class="pick" aria-pressed="${on}"><b>${esc(c.label)} ${seen.includes(c.id) && !on ? '<span class="tag">maybe</span>' : ''}</b><span>${esc(c.plain)}</span></button>
          ${on ? `<div class="levels" role="group" aria-label="How far along">${LEVELS.map(l => `<button type="button" data-l="${l.n}" class="${t.level === l.n ? 'on' : ''}" title="${esc(l.help)}">${l.label}</button>`).join('')}</div>
          <label class="f" style="margin:10px 0 0"><span style="font-size:.9em">Where does it show? <small style="display:inline">(a few of your own words, optional)</small></span><input class="in" data-where="${c.id}" value="${esc(t.where || '')}" placeholder="e.g. when I checked both equations before deciding" maxlength="160"></label>` : ''}</div>`; }).join('')}
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
      ${fw.steps.map(s => s.qs.map(q => `<div class="qa"><b>${s.letter} · ${q.q}</b><p class="${draft.answers[q.id] ? '' : 'empty'}">${esc(draft.answers[q.id] || 'left blank')}</p></div>`).join('')).join('')}
      ${draft.kind !== 'across' ? `<p>${(draft.competencies || []).length ? '<span class="tiny">Your claim: </span>' + draft.competencies.map(t => { const c = compOf(t.id); const l = LEVELS.find(x => x.n === t.level); return `<span class="tag">${esc(c.label)}${l ? ' · ' + l.label : ''}</span>`; }).join('') : '<span class="tiny">No claim made.</span>'}</p>` : ''}
    </div>
    <h3 style="margin-top:14px">Coach</h3>
    ${autoEval() && !fresh ? `<p class="tiny">When you log this, it goes to the coach (no name, no email) to be read for competencies${stmts.length ? ' and statements' : ''}. You can switch that off in Settings.</p>` : ''}
    ${stale ? `<div class="notice">Your words changed since the coach read this, so its read is set aside. Ask again, or log it and the coach reads the new version.</div>` : ''}
    ${coachCard(fresh || b, cls)}
    ${mode !== 'builtin' ? `<div class="row" style="margin-top:10px"><button class="btn sec" id="askAi" ${fresh || left <= 0 ? 'disabled' : ''}>${icon('spark')} ${draft.coachAi ? 'Ask again' : 'Ask the AI coach'}</button><span class="tiny" id="aiMsg">${fresh ? 'Change your words to ask again.' : left <= 0 ? `Today’s ${dailyLimit()} coach reads are used up.` : left !== Infinity ? `${left} of ${dailyLimit()} coach reads left today.` : 'Sends this entry (no name, no email) to the coach service.'}</span></div>` : `<p class="tiny" style="margin-top:8px">This is the built in coach: it works offline and reads for specifics, reasons and a dated next step. An AI coach in your teacher’s voice can be switched on in Settings.</p>`}`;
}
function coachCard(c, cls){
  const d = DEPTHS[c.depth] || DEPTHS.surface; const lvl = c.depth === 'deep' ? 3 : c.depth === 'working' ? 2 : 1;
  const who = c.source === 'ai' ? `${cls && cls.teacherName ? esc(cls.teacherName) + '’s coach' : 'AI coach'}` : 'Built in coach';
  return `<div class="coach"><div class="who"><span class="avatar">${c.source === 'ai' ? '🎓' : '🐝'}</span><div><b>${who}</b><small>${c.source === 'ai' ? 'Claude, in your teacher’s voice' : 'Reads for specifics, reasons and a dated next step'}</small></div></div>
    <div class="depth"><i class="${lvl >= 1 ? 'on' : ''}"></i><i class="${lvl >= 2 ? 'on' : ''}"></i><i class="${lvl >= 3 ? 'on' : ''}"></i><b>${d.label}</b><span class="tiny">${esc(d.help)}</span></div>
    <div class="part"><b>Gift</b><p>${esc(c.gift)}</p></div>
    <div class="part"><b>Stretch</b><p>${esc(c.stretch)}</p></div>
    <div class="part"><b>Competency</b><p>${esc(c.competency)}</p></div>
    <div class="part"><b>Answer this now</b><p class="ask">${esc(c.question)}</p></div>
  </div>`;
}
function wireStep(){
  const sh = $('#sheet');
  $$('[data-ctype]', sh).forEach(b => b.onclick = () => { collect(); draft.context.type = b.dataset.ctype; saveDraft(); renderComposer(); });
  const fb = $('#fbFrom', sh); if (fb) $$('button', fb).forEach(b => b.onclick = () => { draft.feedbackFrom = b.dataset.v; $$('button', fb).forEach(x => x.classList.toggle('on', x === b)); saveDraft(); });
  $$('.comp', sh).forEach(card => {
    card.addEventListener('click', (ev) => {
      const lb = ev.target.closest('[data-l]'); const pick = ev.target.closest('.pick');
      const id = card.dataset.c; const list = draft.competencies || (draft.competencies = []);
      if (lb){ const t = list.find(x => x.id === id); if (t) t.level = +lb.dataset.l; saveDraft(); renderComposer(); return; }
      if (ev.target.closest('[data-where]') || ev.target.closest('label')) return;
      if (!pick) return;
      const i = list.findIndex(x => x.id === id);
      if (i >= 0) list.splice(i, 1);
      else { if (list.length >= 2){ toast('Two is the limit. Depth beats breadth.'); return; } list.push({id, level:2, where:''}); }
      saveDraft(); renderComposer();
    });
  });
  const ask = $('#askAi', sh); if (ask) ask.onclick = async () => {
    ask.disabled = true; $('#aiMsg').innerHTML = '<span class="spin"></span> Reading your entry…';
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
    return `<div class="qa-row${ns.length ? ' has-note' : ''}" data-anchor="${q.id}"><div class="qa"><b>${s.letter} · ${q.q}</b><p class="${e.answers[q.id] ? '' : 'empty'}">${esc(e.answers[q.id] || 'left blank')}</p></div>
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
    ${isNew || edited ? `<section class="hero"><h1>${isNew ? 'Logged.' : 'Saved.'}</h1><p class="motto">${esc(nextStepOf(e) || me.prefs.motto || 'Believe you can.')}</p><p class="meta">${nextStepOf(e) ? 'That is your next step. It waits for you on the Map.' : 'Next time, give yourself a small step with a day on it.'}</p></section>` : ''}
    <section class="card entrycard">
      <div class="row" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap">
        <div class="grow"><span class="tiny">${esc(contextLine(e))} · ${fmtDay(e.created)}</span><h2 style="margin:2px 0 0">${esc(entryTitle(e))}</h2>
          ${files.length ? `<p class="tiny" style="margin:4px 0 0">Filed in ${files.map(b => `<a href="#/basket/${b}">${esc(basketOf(b).short)}</a>`).join(', ')}</p>` : ''}</div>
        ${medal(e.kind, 'style="width:44px;height:44px;flex-basis:44px;font-size:1.2em"')}
      </div>
      ${topNotes.map(noteHtml).join('')}
      ${e.kind === 'act' && e.feedbackText ? `<div class="notice"><b>Feedback (${esc(e.feedbackFrom || 'teacher')}):</b> ${esc(e.feedbackText)}</div>` : ''}
      ${e.kind === 'across' && (e.lookedAt || []).length ? `<details style="margin-top:10px"><summary>The evidence you looked across (${e.lookedAt.length})</summary><ul class="evid" style="margin-top:8px">${e.lookedAt.map(x => `<li><q>${esc(x.quote)}</q></li>`).join('')}</ul></details>` : ''}
      <div class="readback" style="margin-top:12px">${answersWithNotes(e)}</div>
      ${e.kind !== 'across' ? `<p style="margin-top:8px">${(e.competencies || []).length ? '<span class="tiny">Claimed: </span>' + e.competencies.map(t => { const c = compOf(t.id); const l = LEVELS.find(x => x.n === t.level); return c ? `<span class="tag">${esc(c.label)}${l ? ' · ' + l.label : ''}</span>` : ''; }).join('') : '<span class="tiny">No claim made.</span>'}</p>` : ''}
      <div class="row" style="margin-top:6px">
        <button class="btn small" id="eShare">${icon('share')} Share</button>
        <button class="btn small sec" id="eCopy">${icon('copy')} Copy</button>
        <button class="btn small sec" onclick="location.hash='#/${e.kind === 'across' ? 'across/' + e.basket : e.kind}/${e.id}'">${icon('edit')} Edit</button>
        <button class="btn small ghost" id="eDel" style="color:var(--red)">${icon('trash')} Delete</button>
      </div>
      ${sentTo.length ? `<p class="tiny" style="margin:8px 0 0">Sent to ${sentTo.join(', ')}.</p>` : ''}
    </section>
    ${e21ccCard(e, {pending:aiPending.has(e.id), error:aiErrors.get(e.id)})}
    <section class="card"><h2>Coach</h2>${coach ? coachCard(coach, cls) : ''}
      ${e.coach && e.coach.ai && e.coach.builtin ? `<details style="margin-top:10px"><summary>Built in coach’s read</summary>${coachCard(e.coach.builtin, cls)}</details>` : ''}
      ${me.coach.mode !== 'builtin' ? `<div class="row" style="margin-top:10px"><button class="btn sec" id="eAsk" ${fresh || aiPending.has(e.id) || left <= 0 ? 'disabled' : ''}>${icon('spark')} ${e.coach && e.coach.ai ? 'Ask again' : 'Ask the AI coach'}</button><span class="tiny" id="eAskMsg">${fresh ? 'The coach has read these words. Change them to ask again.' : left <= 0 ? `Today’s ${dailyLimit()} coach reads are used up.` : left !== Infinity ? `${left} of ${dailyLimit()} coach reads left today.` : ''}</span></div>` : ''}
    </section>
  `, 'map', {wide:true});
  // reading a note is seeing it
  let seen = false; for (const n of (e.notes || [])) if (!n.seen){ n.seen = true; seen = true; } if (seen) saveDb();
  $('#eShare').onclick = () => shareEntry(e);
  $('#eCopy').onclick = () => copyText(entryText(e, true));
  $('#eDel').onclick = () => { dialog(`<h2>Delete this entry?</h2><p>It goes for good on this device. If you sent it to a teacher, their copy stays.</p><div class="row"><button class="btn danger" id="dYes">Delete</button><button class="btn sec" id="dNo">Keep it</button></div>`); $('#dYes').onclick = () => { me.entries = me.entries.filter(x => x.id !== e.id); saveDb(); closeDialog(); location.hash = '#/'; }; $('#dNo').onclick = closeDialog; };
  const ask = $('#eAsk'); if (ask) ask.onclick = () => { ask.disabled = true; $('#eAskMsg').innerHTML = '<span class="spin"></span>'; runAiFor(e); };
  const retry = $('#e21Retry'); if (retry) retry.onclick = () => { aiErrors.delete(e.id); runAiFor(e); renderEntry(idq); };
  $$('[data-tag]').forEach(b => b.onclick = () => { const list = e.competencies || (e.competencies = []); if (list.length >= 2){ toast('Two is the limit. Untag one on Edit first.'); return; } if (!list.some(t => t.id === b.dataset.tag)) list.push({id:b.dataset.tag, level:2}); if (e.e21cc){ e.e21cc.suggested = (e.e21cc.suggested || []).filter(x => x !== b.dataset.tag); } saveDb(); toast('Claimed.'); renderEntry(idq); });
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
  const who = x.source === 'ai' ? (cls && cls.teacherName ? esc(cls.teacherName) + '’s coach' : 'Class coach') : 'Built in read';
  const claimRows = claims.map(t => { const c = compOf(t.id); if (!c) return ''; const l = LEVELS.find(z => z.n === t.level); const ev = seenEv(t.id);
    return `<li><div class="row" style="justify-content:space-between"><b>${esc(c.label)}</b><span class="str ${ev ? ev.strength : 'none'}">${ev ? 'Seen · ' + STRENGTHS[ev.strength].label : 'Not seen yet'}</span></div>
      <small>Your claim: ${l ? l.label.toLowerCase() : 'claimed'}${t.where ? `, and you pointed to “${esc(t.where)}”` : ''}.</small>
      ${ev ? (ev.quote ? `<q>${esc(ev.quote)}</q>` : '') + `<small>${esc(ev.why)}</small>` : `<small>The words do not show the moment yet. ${esc(c.probe)}</small>`}</li>`; }).join('');
  const others = (x.evidence || []).filter(v => !claimed.has(v.id) && v.strength !== 'glimpse');
  const linked = new Set((e.links || []).map(l => l.sid));
  const may = (x.statements || []).filter(s => statementById(s.sid) && !linked.has(s.sid)).slice(0, 2);
  const err = opts.error;
  return `<section class="card" id="e21cc">
    <div class="row" style="justify-content:space-between"><h2 style="margin:0">Competency read</h2><span class="tiny">${who}${opts.pending ? ' · <span class="spin"></span> reading…' : ''}</span></div>
    ${err ? (err.allowance ? `<div class="notice">${esc(err.msg)}</div>` : `<div class="notice warn">The coach could not read this one: ${esc(err.msg)} The built in read stands. <button class="btn small sec" id="e21Retry" style="margin-top:6px">Try again</button></div>`) : ''}
    ${e.kind === 'across' ? '' : claims.length ? `<span class="kick">Your claim, held against your words</span><ul class="evid">${claimRows}</ul>` : `<p class="muted">You made no claim this time. Next time, name one competency and point to where it shows; the coach will check.</p>`}
    ${others.length ? `<span class="kick" style="margin-top:12px">Also seen${e.kind === 'across' ? '' : ', not claimed'}</span><ul class="evid">${others.map(ev => { const c = compOf(ev.id); if (!c) return ''; return `<li><div class="row" style="justify-content:space-between"><b>${esc(c.label)}</b><span class="str ${ev.strength}">${STRENGTHS[ev.strength].label}</span></div>${ev.quote ? `<q>${esc(ev.quote)}</q>` : ''}<small>${esc(ev.why)}</small>${e.kind === 'across' ? '' : `<button class="btn small sec" data-tag="${ev.id}">${icon('plus')} Claim it</button>`}</li>`; }).join('')}</ul>` : ''}
    ${may.length ? `<span class="kick" style="margin-top:12px">May back a statement</span><ul class="evid">${may.map(s => { const stmt = statementById(s.sid); return `<li><b>${esc(stmt.text)}</b><q>${esc(s.quote)}</q>${s.why ? `<small>${esc(s.why)}</small>` : ''}<button class="btn small sec" data-maylink="${esc(s.sid)}">${icon('link')} Link it</button></li>`; }).join('')}</ul>` : ''}
    ${(e.links || []).length ? `<p class="tiny" style="margin-top:10px">Linked to: ${(e.links || []).map(l => { const s = statementById(l.sid); return s ? `<span class="tag">${linkBacked(e, s) ? '● ' : '○ '}${esc(s.text)}</span>` : ''; }).join('')}</p>` : ''}
    <div class="stance" style="margin-top:12px"><div class="track"><i class="${pos >= 0 ? 'on' : ''}"></i><i class="${pos >= 1 ? 'on' : ''}"></i><i class="${pos >= 2 ? 'on' : ''}"></i></div><div><b>${st.label}</b> <span class="tiny">${esc(x.stance_note || st.help)}</span></div></div>
    ${x.probe ? `<div style="margin-top:8px"><span class="kick">Go deeper${compOf(x.probe_for) ? ' on ' + esc(compOf(x.probe_for).label) : ''}</span><p class="ask">${esc(x.probe)}</p></div>` : ''}
    <p class="tiny" style="margin:10px 0 0">Glimpse: a word points here. Clear: a moment in your words. Strong: the moment and the why.${x.source !== 'ai' && aiReady() && !opts.pending && !err && !(e.coach && e.coach.ai) ? ' The coach has not read this one yet.' : ''}</p>
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

/* ---------- the log: every entry, filterable ---------- */
function entryRow(e){
  const fw = FRAMEWORKS[e.kind]; const c = coachOf(e); const first = fw.steps[0].qs[0].id;
  const unread = (e.notes || []).filter(n => !n.seen).length;
  const anySent = Object.keys(e.sent || {}).length;
  return `<button class="entry" onclick="location.hash='#/entry/${e.id}'">${medal(e.kind)}<span class="grow"><b>${esc(entryTitle(e))}</b><small>${fmtDay(e.created)} · ${esc(contextLine(e))}${c && DEPTHS[c.depth] ? ' · ' + DEPTHS[c.depth].label : ''}${anySent ? '<span class="dot ok" title="shared"></span>' : ''}${unread ? ` <span class="newnote">${plural(unread, 'new note')}</span>` : ''}</small><span class="snip">${esc(e.answers[first] || nextStepOf(e) || '')}</span></span></button>`;
}
function sparkline(vals){
  const w = 320, h = 70, p = 10; const n = vals.length; const x = i => p + (w - 2 * p) * (n > 1 ? i / (n - 1) : .5); const y = v => h - p - (h - 2 * p) * (v - 1) / 2;
  const pts = vals.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" role="img" aria-label="Depth over time">${[1,2,3].map(v => `<line x1="${p}" x2="${w - p}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/>`).join('')}<polyline points="${pts}" fill="none" stroke="var(--navy)" stroke-width="2.5" stroke-linejoin="round"/>${vals.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="var(--accent)" stroke="var(--navy)" stroke-width="1.5"/>`).join('')}</svg>`;
}
function renderLog(){
  const E = me.entries.slice().sort((a, b) => b.created - a.created);
  const q = new URLSearchParams((location.hash.split('?')[1]) || ''); const f = q.get('f') || 'all'; const ct = q.get('c') || '';
  const shown = E.filter(e => (f === 'all' || e.kind === f) && (!ct || (e.context && e.context.type === ct)));
  let claimsMade = 0, claimsBacked = 0; for (const e of E) for (const t of (e.competencies || [])){ claimsMade++; if (e.e21cc && (e.e21cc.evidence || []).some(v => v.id === t.id && v.strength !== 'glimpse' && !v.unverified)) claimsBacked++; }
  const depths = E.filter(e => e.kind !== 'across').slice().reverse().map(e => { const c = coachOf(e); return c ? (c.depth === 'deep' ? 3 : c.depth === 'working' ? 2 : 1) : 1; });
  const groups = {}; for (const e of shown){ const k = new Date(e.created).toLocaleDateString('en-SG', {month:'long', year:'numeric'}); (groups[k] = groups[k] || []).push(e); }
  const types = [...new Set(E.map(e => e.context && e.context.type).filter(Boolean))];
  const s = streak(E);
  frame(`
    <section class="hero"><h1>Your log</h1><p class="meta">${plural(E.length, 'entry', 'entries')} · ${E.filter(e => e.kind === 'grow').length} GROW · ${E.filter(e => e.kind === 'act').length} ACT · ${E.filter(e => e.kind === 'across').length} look across · ${s ? s + ' week' + (s > 1 ? 's' : '') + ' in a row' : 'start a streak this week'}</p></section>
    ${claimsMade ? `<section class="card"><p class="bigline">Claims backed by your own words: ${claimsBacked} of ${claimsMade}.</p><p class="tiny" style="margin:0">Claims are what you said you used. Backed means the coach found a clear moment in your words. The gap between the two is the interesting part.</p></section>` : ''}
    ${depths.length >= 2 ? `<section class="card"><h2>Depth over time</h2>${sparkline(depths)}<p class="tiny">Each dot is an entry: base camp, on the climb, ridge view. The line going up matters more than any single dot.</p></section>` : ''}
    <section class="card">
      <div class="row" style="justify-content:space-between"><h2 style="margin:0">Entries</h2><div class="seg">${[['all','All'],['grow','GROW'],['act','ACT'],['across','Across']].map(([k, l]) => `<button onclick="location.hash='#/log?f=${k}${ct ? '&c=' + ct : ''}'" class="${f === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      ${types.length > 1 ? `<div class="chips" style="margin-top:10px"><a class="chip ${!ct ? 'on' : ''}" href="#/log?f=${f}">Everywhere</a>${types.map(t => `<a class="chip ${ct === t ? 'on' : ''}" href="#/log?f=${f}&c=${t}">${esc(contextTypeOf(t).label)}</a>`).join('')}</div>` : ''}
      ${Object.keys(groups).length ? Object.entries(groups).map(([m, list]) => `<h3 style="margin:14px 0 2px">${m}</h3>${list.map(entryRow).join('')}`).join('') : '<p class="muted" style="margin-top:8px">Nothing here yet.</p>'}
    </section>
  `, 'log');
}

/* ---------- sharing: who sees what. Nothing is shared by default. ---------- */
function renderSharing(){
  const list = adults();
  const card = a => {
    const secs = sectionsOf(a); const unsent = unsentFor(a); const sink = a.sink && a.sink.kind && a.sink.kind !== 'none' ? (a.sink.kind === 'msforms' ? 'Microsoft Form' : 'Google Form') : 'a link in Teams';
    return `<section class="card adult" data-a="${esc(a.id)}">
      <div class="row" style="justify-content:space-between;align-items:flex-start"><div><h2 style="margin:0">${esc(a.name)}</h2><p class="tiny" style="margin:2px 0 0">${esc(a.role)}${a.groupLabel ? ' · ' + esc(a.groupLabel) : ''} · sends by ${sink}</p></div>${a.group ? '' : `<button class="btn small ghost" data-remove="${esc(a.id)}" style="color:var(--red)">${icon('trash')} Remove</button>`}</div>
      <span class="flabel" style="margin-top:12px">What ${esc(a.name)} can see</span>
      <div class="chips">${SECTIONS.map(([k, l]) => `<button type="button" class="chip ${secs.includes(k) ? 'on' : ''}" data-sec="${k}" aria-pressed="${secs.includes(k)}">${secs.includes(k) ? icon('eye') : icon('lock')}${esc(l)}</button>`).join('')}</div>
      ${a.group ? `<span class="flabel" style="margin-top:12px">Which entries</span><div class="seg" role="group" aria-label="Which entries">${[['group', `Only ${a.groupLabel || 'this group'}`], ['all', 'All my entries']].map(([k, l]) => `<button type="button" data-scope="${k}" class="${scopeOf(a) === k ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>` : ''}
      <div class="row" style="margin-top:12px;justify-content:space-between"><span class="tiny">${secs.length ? (unsent.length ? `${plural(unsent.length, 'item')} not sent yet` : 'Up to date') : 'Nothing shared'}</span>${unsent.length ? `<button class="btn small" data-send="${esc(a.id)}">${icon('send')} Send ${unsent.length} new</button>` : ''}</div>
    </section>`;
  };
  frame(`
    <section class="hero"><h1>Sharing</h1><p class="meta">Your log is yours. Each adult sees only the sections you open to them, and only when you send.</p></section>
    <div class="notice">GROW and ACT share whole entries. A basket shares its statements, the quotes that back them, and your look across. Teachers reply with notes in the margin.</div>
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

/* ---------- settings ---------- */
function renderSettings(){
  const p = me.prefs; const c = me.coach; const gs = myGroups(); const relay = relayFor(null);
  const sinkLabel = cfg => cfg && cfg.sink && cfg.sink.kind && cfg.sink.kind !== 'none' ? (cfg.sink.kind === 'msforms' ? 'Microsoft Form' : 'Google Form') : 'no drop box';
  frame(`
    <section class="hero"><h1>Make it yours</h1><p class="meta">The log should look like the person writing it.</p></section>
    <section class="card"><h2>You</h2>
      <label class="f"><span>Name</span><input class="in" id="sName" value="${esc(me.name)}" maxlength="60"></label>
      <label class="f"><span>School email</span><input class="in" id="sEmail" type="email" value="${esc(me.email)}" maxlength="120"><small>Teachers’ notes find you by this email.</small></label>
      <label class="f"><span>Your line</span><input class="in" id="sMotto" value="${esc(p.motto || '')}" maxlength="80" placeholder="A sentence you want to see every day"><small>Try: ${MOTTOS.map(m => `<a href="#" data-motto="${esc(m)}">${esc(m)}</a>`).join(' · ')}</small></label>
      <div class="f"><span class="flabel">Your mark</span><div class="emojis">${EMOJIS.map(e => `<button type="button" data-e="${e}" class="${p.avatar === e ? 'on' : ''}">${e}</button>`).join('')}</div></div>
    </section>
    <section class="card"><h2>Look</h2>
      <div class="f"><span class="flabel">Mood</span><div class="moods">${MOODS.map(m => `<button type="button" class="mood ${p.mood === m.id ? 'on' : ''}" data-mood="${m.id}"><i style="background:${m.c}"></i>${m.label}</button>`).join('')}</div></div>
      <div class="f"><span class="flabel">Your colour</span><div class="swatches">${ACCENTS.map(a => `<button type="button" class="sw ${p.accent === a.id ? 'on' : ''}" data-accent="${a.id}" style="--c:${a.c}" aria-label="${a.id}"></button>`).join('')}</div><small class="tiny">Navy and yellow are the school’s. This one is yours.</small></div>
      <div class="f"><span class="flabel">Text size</span><div class="seg">${[['normal','A'],['large','A+'],['xl','A++']].map(([k, l]) => `<button type="button" data-size="${k}" class="${p.size === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    </section>
    <section class="card"><h2>Groups</h2>
      <p class="muted">Each group is a class or a CCA, with its teacher, their voice for the coach and their drop box.</p>
      ${gs.length ? `<ul class="groups">${gs.map(g => `<li><div class="grow"><b>${esc(g.cfg ? (g.cfg.subject || g.code) : g.code)}</b> <span class="tag">${esc(ROLE_OF[groupType(g)] ? groupType(g) === 'cca' ? 'CCA' : groupType(g) === 'form' ? 'Form class' : groupType(g) === 'subject' ? 'Subject' : 'Group' : 'Group')}</span><small>${esc(g.code)}${g.cfg ? ' · ' + esc(g.cfg.teacherName || 'teacher') + ' · ' + sinkLabel(g.cfg) : ' · not loaded yet'}</small></div><button class="btn small ghost" data-drop="${esc(g.code)}" aria-label="Remove ${esc(g.code)}">${icon('trash')}</button></li>`).join('')}</ul>` : '<p class="tiny">No groups yet. A teacher can give you a code or a link.</p>'}
      <div class="row"><label class="f grow" style="margin:0"><span>Add a group code</span><input class="in" id="sClass" maxlength="16" style="text-transform:uppercase" placeholder="From your teacher" autocapitalize="characters" autocorrect="off" spellcheck="false" autocomplete="off"></label><button class="btn sec" id="sLoad" style="margin-top:22px">Add</button></div>
      <p class="tiny" id="clsMsg" style="margin-top:8px"></p>
      <p style="margin:6px 0 0"><a class="btn sec small" href="#/sharing">${icon('share')} Sharing: who sees what</a></p>
    </section>
    <section class="card"><h2>Coach</h2>
      <p class="muted">The built in coach always reads your entry. An AI coach adds feedback in your teacher’s voice and checks your claims and statements against your words. It never receives your name or email. Nobody needs an account or a key: your group provides the coach link.</p>
      <div class="stack" id="coachMode">
        ${COACH_MODES().map(([k, l, h]) => `<label class="pcard" style="cursor:pointer"><input type="radio" name="cm" value="${k}" ${c.mode === k ? 'checked' : ''} style="width:22px;height:22px;accent-color:var(--navy)"><span><b>${l}</b><small>${h}</small></span></label>`).join('')}
      </div>
      <div id="coachRelay" ${c.mode === 'relay' ? '' : 'hidden'} style="margin-top:10px">
        <label class="f"><span>Coach link</span><input class="in" id="sRelay" value="${esc(c.relayUrl || '')}" placeholder="${esc((relay && relay.url) || 'https://…workers.dev')}"><small>${relay ? 'Leave blank to use the one your group provides.' : ''}</small></label>
        <label class="f"><span>Class token</span><input class="in" id="sToken" value="${esc(c.token || '')}" placeholder="${relay && relay.token ? 'Provided by your group' : 'From your teacher'}"></label>
      </div>
      <div id="coachKey" ${c.mode === 'key' ? '' : 'hidden'} style="margin-top:10px">
        <label class="f"><span>Anthropic API key</span><input class="in" id="sKey" type="password" value="${esc(c.key || '')}" placeholder="sk-ant-…" autocomplete="off"><small>Stored only in this browser. Anyone who can open this profile can use it, so set a PIN.</small></label>
        <label class="f"><span>Model</span><select class="in" id="sModel">${[['claude-opus-5','Claude Opus 5 (default)'],['claude-sonnet-5','Claude Sonnet 5 (cheaper)'],['claude-haiku-4-5','Claude Haiku 4.5 (cheapest)']].map(([v, l]) => `<option value="${v}" ${c.model === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      </div>
      <label class="row" id="autoRow" style="margin-top:10px;cursor:pointer" ${c.mode === 'builtin' ? 'hidden' : ''}><input type="checkbox" id="sAuto" ${c.auto !== false ? 'checked' : ''} style="width:22px;height:22px;accent-color:var(--navy)"><span>Read every entry when I log it<small style="display:block;color:var(--text-2)">Off means the coach only reads when you press the button. Each version of your words is read once.</small></span></label>
      <p class="tiny" id="allowRow" ${METERED.includes(c.mode) ? '' : 'hidden'} style="margin-top:8px">Coach reads today: ${readsUsed()} of ${dailyLimit()}. The school pays for each read, so the allowance resets each day.</p>
      <div class="row" style="margin-top:8px"><button class="btn sec small" id="sTest" ${c.mode === 'builtin' ? 'hidden' : ''}>Test the coach</button><span class="tiny" id="sTestMsg"></span></div>
    </section>
    <section class="card"><h2>Your data</h2>
      <p class="muted">Everything is in this browser. A cleared cache, a new laptop or a school reimage loses it, so export now and then. The file is yours: it opens in any text editor and imports back here, on any device.</p>
      <div class="row">
        <button class="btn sec" id="sExport">${icon('down')} Export log</button>
        <label class="btn sec" for="sImport">${icon('up')} Import<input type="file" id="sImport" accept="application/json,.json" hidden></label>
        <button class="btn sec" id="sCopyAll">${icon('copy')} Copy all as text</button>
      </div>
      ${STORE.hasV1() && db.migratedFrom ? `<details style="margin-top:14px"><summary>The old Learning Log copy</summary><p class="tiny" style="margin-top:6px">Your Learning Log entries moved into this log on ${fmtDate(db.migratedAt || Date.now())}. A copy of the old log is still kept in this browser as a safety net. Once you have exported this log, you can remove it.</p><button class="btn small danger" id="sDropV1">Remove the old copy</button></details>` : ''}
      <details style="margin-top:14px"><summary>Change or remove PIN</summary>
        <form id="pinChange" class="row" style="margin-top:8px"><input class="in grow" name="pin" inputmode="numeric" maxlength="4" placeholder="New 4 digit PIN, or blank to remove"><button class="btn small" type="submit">Set</button></form></details>
      <div class="row" style="margin-top:14px">
        <button class="btn ghost" id="sOut">${icon('user')} Switch person</button>
        <button class="btn danger small" id="sDelete">${icon('trash')} Delete this profile from this device</button>
      </div>
    </section>
    <section class="card flat"><h2>About</h2><p class="tiny">Competency Development Log for Beattyians. GROW by reflecting and ACT on Feedback are the school’s frameworks; the competency lens follows MOE’s 21st Century Competencies (2023 refresh). Built with no accounts and no database on purpose: your reflections are yours until you choose to share them. Teachers: see <a href="teacher.html">the teacher console</a>.</p></section>
  `, 'settings');
  const sv = () => { saveDb(); applyPrefs(); };
  $('#sName').oninput = e => { me.name = e.target.value; sv(); };
  $('#sEmail').oninput = e => { me.email = e.target.value.trim().toLowerCase(); sv(); };
  $('#sMotto').oninput = e => { me.prefs.motto = e.target.value; sv(); };
  $$('[data-motto]').forEach(a => a.onclick = ev => { ev.preventDefault(); me.prefs.motto = a.dataset.motto; $('#sMotto').value = a.dataset.motto; sv(); });
  $$('.emojis button').forEach(b => b.onclick = () => { me.prefs.avatar = b.dataset.e; sv(); $$('.emojis button').forEach(x => x.classList.toggle('on', x === b)); $('.top .avatar').textContent = b.dataset.e; });
  $$('.mood').forEach(b => b.onclick = () => { me.prefs.mood = b.dataset.mood; sv(); $$('.mood').forEach(x => x.classList.toggle('on', x === b)); });
  $$('.sw').forEach(b => b.onclick = () => { me.prefs.accent = b.dataset.accent; sv(); $$('.sw').forEach(x => x.classList.toggle('on', x === b)); });
  $$('button[data-size]').forEach(b => b.onclick = () => { me.prefs.size = b.dataset.size; sv(); $$('button[data-size]').forEach(x => x.classList.toggle('on', x === b)); });
  $$('[data-drop]').forEach(b => b.onclick = () => { me.groups = me.groups.filter(g => g.code !== b.dataset.drop); saveDb(); toast('Group removed. Its entries stay in your log.'); loadStatements().then(renderSettings); });
  $('#sLoad').onclick = async () => {
    const code = $('#sClass').value.trim().toUpperCase(); if (!code) return;
    $('#clsMsg').innerHTML = '<span class="spin"></span> Looking for the group…';
    const cfg = await loadGroup(code);
    if (cfg){ addGroupToMe(code); adoptGroup(cfg); saveDb(); await loadStatements(); toast(`Added ${code}.`); renderSettings(); }
    else $('#clsMsg').textContent = `No group file found for ${code}. Ask your teacher for a share link, or check the code.`;
  };
  $$('#coachMode input').forEach(r => r.onchange = () => { me.coach.mode = r.value; me.coach.touched = true; saveDb(); $('#coachRelay').hidden = r.value !== 'relay'; $('#coachKey').hidden = r.value !== 'key'; $('#sTest').hidden = r.value === 'builtin'; $('#autoRow').hidden = r.value === 'builtin'; $('#allowRow').hidden = !METERED.includes(r.value); });
  $('#sAuto').onchange = e => { me.coach.auto = e.target.checked; saveDb(); };
  $('#sRelay').oninput = e => { me.coach.relayUrl = e.target.value.trim(); saveDb(); };
  $('#sToken').oninput = e => { me.coach.token = e.target.value.trim(); saveDb(); };
  $('#sKey').oninput = e => { me.coach.key = e.target.value.trim(); saveDb(); };
  $('#sModel').onchange = e => { me.coach.model = e.target.value; saveDb(); };
  $('#sTest').onclick = async () => { const m = $('#sTestMsg'); m.innerHTML = '<span class="spin"></span> Testing…'; try{ const r = await aiCoach({id:'test', kind:'grow', context:{type:'subject', name:'Mathematics'}, subject:'Mathematics', topic:'Test', answers:{g1:'I understand that simultaneous equations are two rules that must both be true at once, because the lines cross at one point.', r2:'Redo Q3 to Q5 tonight after dinner for 20 minutes.'}, competencies:[]}, {test:true, noStatements:true}); m.textContent = 'The coach answered: “' + r.question + '”'; }catch(e){ m.textContent = e.message; } };
  $('#sExport').onclick = () => download(`competency-log-${(me.name || 'me').replace(/\W+/g, '-').toLowerCase()}-${today()}.json`, STORE.exportProfile(me));
  $('#sImport').onchange = async ev => {
    const f = ev.target.files[0]; if (!f) return;
    try{
      const p = STORE.parseImport(await f.text()); let added = 0, updated = 0;
      for (const e of p.entries){ const i = me.entries.findIndex(x => x.id === e.id); if (i < 0){ me.entries.push(e); added++; } else if (version(e) > version(me.entries[i])){ const keepNotes = me.entries[i].notes || []; e.notes = [...keepNotes, ...(e.notes || []).filter(n => !keepNotes.some(k => k.id === n.id))]; me.entries[i] = e; updated++; } else { const cur = me.entries[i]; for (const n of (e.notes || [])) if (!cur.notes.some(k => k.id === n.id)) cur.notes.push(n); } }
      if (!me.email && p.email) me.email = p.email;
      for (const g of p.groups) addGroupToMe(g.code);
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
