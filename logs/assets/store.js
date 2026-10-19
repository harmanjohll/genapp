/* ==================================================================
   Storage and transport seam for the E21CC Learning Log.

   Phase 1 (now): LocalStore keeps the log in this browser; FormsTransport
   sends chosen items to an adult's Microsoft or Google Form; share and note
   links carry items and margin notes as CDL payloads.

   Phase 2 (after MOE IT clears it): OneDriveStore and GraphTransport take
   the same shapes, so screens do not change. See PHASE2-REQUEST.md.
   Needs core.js loaded first.
   ================================================================== */
'use strict';

const DB_KEY_V2 = 'cdl.v2';
const DB_KEY_V1 = 'logs.v1';   // the Learning Log's key: read once, never written, kept as a rollback copy

const LocalStore = {
  guest:false,
  open(){
    if (this.guest) return migrateDb({});
    try{
      const v2 = localStorage.getItem(DB_KEY_V2);
      if (v2) return migrateDb(JSON.parse(v2));
      const v1 = localStorage.getItem(DB_KEY_V1);
      if (v1){ const d = migrateDb(JSON.parse(v1)); d.migratedFrom = DB_KEY_V1; d.migratedAt = Date.now(); this.save(d); return d; }
    }catch{}
    return migrateDb({});
  },
  save(db){ if (this.guest) return true; try{ localStorage.setItem(DB_KEY_V2, JSON.stringify(db)); return true; }catch{ return false; } },
  hasV1(){ try{ return !!localStorage.getItem(DB_KEY_V1); }catch{ return false; } },
  dropV1(){ try{ localStorage.removeItem(DB_KEY_V1); }catch{} },
  exportProfile(p){ return JSON.stringify({app:'cdl', schemaVersion:2, exported:new Date().toISOString(), profile:p}, null, 2); },
  /* Reads a v2 export, a Learning Log v1 export, or a bare profile. */
  parseImport(text){ const d = JSON.parse(text); const p = d && (d.profile || d); if (!p || !Array.isArray(p.entries)) throw new Error('not a log'); return migrateProfile(JSON.parse(JSON.stringify(p))); }
};

/* ---------- what an adult receives ---------- */
const FORM_FIELDS = ['timestamp','studentName','studentEmail','classCode','teacherEmail','framework','subject','topic','entry','competencies','depth','nextStep','entryId','context','section','payload1','payload2','payload3'];

/* A compact copy of an entry for an adult: the words, the claim, the read.
   Coach prose is left out to keep links and form answers small. */
function compactEntry(e){
  const answers = {}; for (const [k, v] of Object.entries(e.answers || {})) if (String(v || '').trim()) answers[k] = v;
  const x = e.e21cc || null; const c = e.coach && (e.coach.ai || e.coach.builtin);
  const out = {id:e.id, kind:e.kind, created:e.created, updated:e.updated || e.created, context:e.context, topic:e.topic || '', groupCode:e.groupCode || '', answers,
    competencies:(e.competencies || []).map(t => ({id:t.id, level:t.level, where:t.where || ''})),
    links:(e.links || []).map(l => ({sid:l.sid, quote:l.quote})),
    depth:c ? c.depth : '', question:c ? c.question : ''};
  if (e.kind === 'act'){ out.feedbackFrom = e.feedbackFrom || ''; out.feedbackText = e.feedbackText || ''; }
  if (e.kind === 'across'){ out.basket = e.basket; out.term = e.term; out.lookedAt = (e.lookedAt || []).slice(0, 8); }
  if (x) out.e21cc = {source:x.source, stance:x.stance, evidence:(x.evidence || []).map(v => ({id:v.id, strength:v.strength, quote:v.quote || '', unverified:!!v.unverified})), statements:(x.statements || []).map(s => ({sid:s.sid, quote:s.quote}))};
  return out;
}

/* Packs items into as few submissions as the form allows: each answer at most
   `chunk` characters across payload1 to payload3, and (Microsoft Forms) the
   whole pre filled link under `budget` characters. */
async function buildSubmissions(sink, readable, from, items, opts){
  const chunk = (opts && opts.chunk) || 3900; const budget = (sink && sink.maxUrl) || (opts && opts.budget) || 8000;
  const out = []; let i = 0;
  while (i < items.length){
    let n = items.length - i, sub = null;
    for (; n >= 1; n--){
      const slice = items.slice(i, i + n);
      const payload = await packCDL('i', {v:1, from, items:slice});
      const parts = splitCDL(payload, chunk); if (parts.length > 3 && n > 1) continue;
      const fields = Object.assign({}, readable(slice), {payload1:parts[0] || '', payload2:parts[1] || '', payload3:parts[2] || ''});
      if (parts.length > 3) fields.payload3 = parts.slice(2).join('');   // a single item too big for three answers: the form may truncate it
      const url = sink && sink.kind === 'msforms' ? formUrl(sink, fields) : '';
      if (url && url.length > budget && n > 1) continue;
      if (url && url.length > budget){ fields.entry = String(fields.entry || '').slice(0, 300); fields.competencies = String(fields.competencies || '').slice(0, 300); }
      sub = {items:slice, fields, url: sink && sink.kind === 'msforms' ? formUrl(sink, fields) : ''}; break;
    }
    out.push(sub); i += sub.items.length;
  }
  return out;
}
function formUrl(sink, fields){
  const u = new URL(sink.url); const map = sink.fields || {};
  for (const [k, id] of Object.entries(map)) if (k in fields && fields[k] !== '') u.searchParams.set(id, String(fields[k]));
  return u.toString();
}
function mappedCount(sink, fields){ return Object.keys(sink.fields || {}).filter(k => k in fields).length; }

const FormsTransport = {
  /* Google Forms accepts a silent POST when the form allows responses from outside the organisation. */
  postGoogle(sink, fields){
    const action = sink.url.replace(/\/viewform.*$/, '/formResponse').replace(/\?.*$/, '');
    const f = document.createElement('form'); f.method = 'POST'; f.action = action; f.target = 'pushframe'; f.style.display = 'none';
    for (const [k, id] of Object.entries(sink.fields || {})){ if (!(k in fields)) continue; const inp = document.createElement('input'); inp.name = id; inp.value = fields[k]; f.appendChild(inp); }
    let fr = document.querySelector('iframe[name=pushframe]'); if (!fr){ fr = document.createElement('iframe'); fr.name = 'pushframe'; fr.style.display = 'none'; document.body.appendChild(fr); }
    document.body.appendChild(f); f.submit(); setTimeout(() => f.remove(), 3000);
  },
  /* Microsoft Forms has no silent submit: the form opens filled in and the student presses Submit. */
  openMicrosoft(url){ window.open(url, '_blank', 'noopener'); }
};

/* ---------- links ---------- */
function consoleUrl(){ return location.href.replace(/[#?].*$/, '').replace(/index\.html$/, '').replace(/\/?$/, '/') + 'teacher.html'; }
function appUrl(){ return location.href.replace(/[#?].*$/, '').replace(/teacher\.html$/, '').replace(/index\.html$/, '').replace(/\/?$/, '/') + 'index.html'; }
/* A Teams chat with one person, message filled in. Falls back to copying when Teams is not available. */
function teamsChatUrl(email, message){ return `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(email)}&message=${encodeURIComponent(message)}`; }
