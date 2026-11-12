/* ==================================================================
   The student's side of school sign in (Version 6). Loaded after app.js; uses its state
   (db, me, unlocked) and helpers. Does nothing unless M365.enabled(): until ICT fills in
   school/microsoft.json, the Log keeps the log in this browser and shares by links, as before.

   In the student's own OneDrive, in the folder "E21CC Log":
     log.json                             the whole log, kept in step with every device
     shares/E21CC share for <email>.json  what one teacher may read; only that teacher is let in
     notes/E21CC notes from <email>.json  that teacher's replies; only that teacher may write it

   Keeping in step: the log is read when it opens and written a few seconds after each change.
   The two copies are merged the way a backup is (assets/app.js, mergeBackup): nothing doubles,
   the newer version of an entry wins, and teachers' notes are kept from both.
   ================================================================== */
'use strict';

const Cloud = {busy:false, status:'', timer:null, landedNote:0};
const CLOUD_LOCAL = ['etag', 'changedAt', 'pushedAt', 'syncedAt', 'notesTags'];   // this device's bookkeeping, never uploaded
function cloudOn(){ return typeof M365 !== 'undefined' && M365.enabled() && !GUEST && !DEMO; }
function cloudWho(){ return cloudOn() ? M365.who() : null; }
function cloudMine(){ const w = cloudWho(); return !!(w && me && w.email && String(me.email || '').toLowerCase() === w.email); }
const teacherFile = (dir, email) => `${dir}/E21CC ${dir === 'shares' ? 'share for' : 'notes from'} ${String(email).toLowerCase().replace(/[^a-z0-9@._]/g, '_')}.json`;

/* Every save marks the log changed; a few seconds later it goes up to OneDrive. */
function cloudTouched(){
  if (Cloud.busy || !me || !cloudMine()) return;
  me.cloud = me.cloud || {}; me.cloud.changedAt = Date.now();
  clearTimeout(Cloud.timer); Cloud.timer = setTimeout(() => cloudSync(), 4000);
}
function cloudPayload(){
  const p = JSON.parse(JSON.stringify(me)); if (p.cloud) for (const k of CLOUD_LOCAL) delete p.cloud[k];
  return {app:'cdl', schemaVersion:2, exported:new Date().toISOString(), profile:p};
}
/* What a backup merge does not carry: the teachers picked, sharing choices, and the files made for teachers. */
function mergeCloudExtras(t, pr){
  const pc = (pr.cloud && pr.cloud.teachers) || {}; t.cloud = t.cloud || {}; t.cloud.teachers = t.cloud.teachers || {};
  for (const [k, v] of Object.entries(pc)) if (!t.cloud.teachers[k]) t.cloud.teachers[k] = v; else if (v.told && !t.cloud.teachers[k].told) t.cloud.teachers[k].told = v.told;
  if (pr.teachers && !t.teachers) t.teachers = pr.teachers;
  if (pr.shares){ t.shares = t.shares || {adults:{}, sections:{}, scope:{}}; for (const part of ['adults', 'sections', 'scope']) for (const [k, v] of Object.entries(pr.shares[part] || {})) if (!(k in (t.shares[part] = t.shares[part] || {}))) t.shares[part][k] = v; }
  for (const e of t.entries){ const o = pr.entries.find(x => x.id === e.id); if (o && o.sent) for (const [a, at] of Object.entries(o.sent)) if (!e.sent || !(e.sent[a] >= at)) (e.sent = e.sent || {})[a] = at; }
  if (pr.sentBaskets){ t.sentBaskets = t.sentBaskets || {}; for (const [a, m] of Object.entries(pr.sentBaskets)) t.sentBaskets[a] = Object.assign({}, m, t.sentBaskets[a] || {}); }
  if (pr.confirmed){ t.confirmed = t.confirmed || {}; for (const [c, v] of Object.entries(pr.confirmed)) if (!t.confirmed[c]) t.confirmed[c] = v; }
}

/* Read OneDrive's copy, merge it in, write back what is new here, then bring in teachers' notes. */
async function cloudSync(opts = {}){
  if (!cloudMine() || Cloud.busy) return {landed:0};
  Cloud.busy = true; let landed = 0;
  const c = me.cloud = me.cloud || {};
  try{
    const ref = M365.own('log.json');
    let got = await M365.readJson(ref);
    const take = g => { if (!g || g.etag === c.etag) return; const pr = STORE.parseImport(JSON.stringify(g.data)); mergeBackup(me, pr); mergeCloudExtras(me, pr); c.etag = g.etag; };
    take(got);
    if (!got || (c.changedAt || 0) > (c.pushedAt || 0) || opts.push){
      let w;
      try{ w = await M365.writeJson(ref, cloudPayload(), got ? got.etag : null); }
      catch(e){ if (e.status !== 412) throw e; got = await M365.readJson(ref); take(got); w = await M365.writeJson(ref, cloudPayload(), got ? got.etag : null); }
      c.etag = w.etag; c.pushedAt = Date.now();
    }
    landed = await cloudNotes();
    c.syncedAt = Date.now(); Cloud.status = ''; Cloud.needSignIn = false;
  }catch(e){ Cloud.status = e.message; if (e.auth) Cloud.needSignIn = true; }
  finally{ Cloud.busy = false; STORE.save(db); }
  if (landed){ Cloud.landedNote += landed; toast(`${plural(landed, 'reply', 'replies')} from your teachers.`, 3600); if ((location.hash || '#/') === '#/' || location.hash.startsWith('#/entry') || location.hash.startsWith('#/journal')) route(); }
  return {landed};
}
/* Teachers' notes files: read the ones that changed, and land their notes where their entries are. */
async function cloudNotes(){
  const c = me.cloud; c.notesTags = c.notesTags || {}; let landed = 0;
  let list = [];
  try{ const r = await M365.graph(M365.own('notes').meta + ':/children'); list = (r && r.value) || []; }catch(e){ if (e.status === 404) return 0; throw e; }
  for (const f of list){
    if (!/\.json$/i.test(f.name || '') || c.notesTags[f.name] === f.eTag) continue;
    const url = f['@microsoft.graph.downloadUrl']; if (!url) continue;
    let d; try{ const r = await fetch(url); d = await r.json(); }catch{ continue; }
    const by = d.by || {};
    const r = landNotes(d.notes, by); landed += r.added;
    for (const x of (Array.isArray(d.confirms) ? d.confirms : [])){ if (!x || !compOf(x.comp) || compOf(x.comp).d === 'sec' || me.confirmed[x.comp]) continue; me.confirmed[x.comp] = {by:String(by.name || 'Your teacher').slice(0, 60), role:String(by.role || '').slice(0, 40), at:Number(x.at) || Date.now()}; landed++; }
    c.notesTags[f.name] = f.eTag;
  }
  if (landed) applyPendingNotes();
  return landed;
}

/* The two files for one teacher, made once and opened to that teacher alone. */
async function cloudTeacher(a){
  const email = String(a.email || '').toLowerCase(); const c = me.cloud = me.cloud || {}; c.teachers = c.teachers || {};
  const t = c.teachers[email] = c.teachers[email] || {name:a.name, email};
  if (!t.shareId){
    const ref = M365.own(teacherFile('shares', email)); const cur = await M365.readJson(ref);
    const w = cur || await M365.writeJson(ref, {app:'e21cclog-share', v:1, items:[]}, null);
    t.shareId = w.id; t.driveId = w.driveId; t.shared = false;
  }
  if (!t.notesId){
    const ref = M365.own(teacherFile('notes', email)); const cur = await M365.readJson(ref);
    const w = cur || await M365.writeJson(ref, {app:'e21cclog-notes', v:1, notes:[]}, null);
    t.notesId = w.id; t.driveId = t.driveId || w.driveId; t.shared = false;
  }
  if (!t.shared){ await M365.invite(t.shareId, email, false); await M365.invite(t.notesId, email, true); t.shared = Date.now(); }
  saveDb(); return t;
}
/* Sharing chosen items with a teacher through OneDrive: they are added to that teacher's share file. */
async function cloudDeliver(a, chosen){
  dialog(`<h2>Sharing with ${esc(a.name)}</h2><p><span class="spin"></span> Saving to your OneDrive…</p>`);
  try{
    const t = await cloudTeacher(a); const ref = M365.own(teacherFile('shares', a.email));
    const write = async () => {
      const cur = await M365.readJson(ref); const data = cur && cur.data && cur.data.app === 'e21cclog-share' ? cur.data : {app:'e21cclog-share', v:1, items:[]};
      const keyOf = it => it.t === 'e' ? 'e:' + it.e.id : 'b:' + it.b.basket;
      const items = new Map((data.items || []).map(it => [keyOf(it), it])); for (const it of chosen.map(toPayloadItem)) items.set(keyOf(it), it);
      Object.assign(data, {from:await senderInfo(), to:{name:a.name, email:a.email}, notes:{driveId:t.driveId, id:t.notesId}, updated:Date.now(), items:[...items.values()]});
      return M365.writeJson(ref, data, cur ? cur.etag : null);
    };
    try{ await write(); }catch(e){ if (e.status !== 412) throw e; await write(); }
    markSent(a, chosen);
    if (!t.told) return cloudTell(a, t);
    closeDialog(); toast(`Shared with ${a.name}. It is in their console.`, 3600); route();
  }catch(e){
    dialog(`<h2>That did not reach OneDrive</h2><p>${esc(e.message)}</p><div class="row">${e.auth ? `<button class="btn" id="dSign">Sign in again</button>` : ''}<button class="btn sec" id="dLink">${icon('link')} Send a link instead</button><button class="btn ghost" id="dClose">Close</button></div>`);
    const s = $('#dSign'); if (s) s.onclick = () => M365.signIn();
    $('#dLink').onclick = () => deliver(Object.assign({}, a, {viaLink:true}), chosen); $('#dClose').onclick = closeDialog;
  }
}
/* Once per teacher: a short message in Teams so their console knows where to look. After that, sharing needs no message. */
async function cloudTell(a, t){
  const link = consoleUrl() + '#/connect?c=' + await packCDL('c', {v:1, from:await senderInfo(), driveId:t.driveId, share:t.shareId, notes:t.notesId});
  const msg = `${me.name}: I share my E21CC Log with you through OneDrive. Open this once, and your console will find what I share from now on: ${link}`;
  dialog(`<h2>Tell ${esc(a.name)} once</h2><p>${esc(a.name)} can now read what you share with them, and nobody else can. Send this message once, so their console knows where to look. After this, sharing needs no message.</p>
    <div class="row">${a.email ? `<a class="btn" id="dTeams" href="${esc(teamsChatUrl(a.email, msg))}" target="_blank" rel="noopener">${icon('send')} Open Teams chat</a>` : ''}<button class="btn sec" id="dCopy">${icon('copy')} Copy message</button></div>
    <div class="row" style="margin-top:10px"><button class="btn acc" id="dDone">${icon('check')} I sent it</button><button class="btn ghost" id="dClose">Later</button></div>`);
  $('#dCopy').onclick = () => copyText(msg);
  $('#dDone').onclick = () => { t.told = Date.now(); saveDb(); closeDialog(); toast(`Done. ${a.name}’s console will find what you share.`, 3600); route(); };
  $('#dClose').onclick = () => { closeDialog(); route(); };
}

/* After the school's sign in page: open this person's log here, or start one, then bring OneDrive's copy in. */
async function cloudAdopt(){
  const w = cloudWho(); if (!w || !w.email) return false;
  let p = Object.values(db.profiles).find(x => String(x.email || '').toLowerCase() === w.email);
  // a log already open on this device, started before sign in with no email or another one, under the same name: it is this person's
  if (!p && me && (!me.email || sameName(me.name, w.name || ''))){ p = me; p.email = w.email; }
  let fresh = false;
  if (!p){ p = newProfile(w.name || w.email.split('@')[0], w.email); db.profiles[p.id] = p; fresh = true; }
  db.current = p.id; me = p; unlocked = true; rememberOpen(p.id); saveDb(); applyPrefs();
  if (fresh){
    // a returning student on a new device: OneDrive's copy becomes the log here, whole
    try{
      const got = await M365.readJson(M365.own('log.json'));
      if (got){ const pr = STORE.parseImport(JSON.stringify(got.data)); delete db.profiles[p.id]; pr.email = w.email; pr.cloud = Object.assign({}, pr.cloud || {}, {etag:got.etag}); db.profiles[pr.id] = pr; db.current = pr.id; me = pr; rememberOpen(pr.id); saveDb(); applyPrefs(); fresh = false; }
    }catch(e){ Cloud.status = e.message; }
  }
  await cloudSync({push:true});
  Promise.all(me.groups.map(g => loadGroup(g.code))).then(loadStatements);
  return {fresh};
}
async function cloudSignIn(){ try{ await M365.signIn(); }catch(e){ toast(e.message, 4200); } }
async function cloudSignOut(){ await M365.signOut(); Cloud.status = ''; toast('Signed out of your school account here. Your log stays on this device.', 4200); route(); }

/* Settings: the school account, how the log is kept in step, and the teachers it is shared with. */
function cloudCard(){
  if (!cloudOn()) return '';
  const w = cloudWho(); const c = (me && me.cloud) || {};
  if (!w) return `<div class="cloudbox" role="group" aria-labelledby="cloudH"><h3 id="cloudH">School account</h3><p>Sign in with your school account, the same one as Teams, to keep your log in your own OneDrive. Then it is on every device you sign in on, and sharing with a teacher needs no message.</p><button class="btn" id="cloudIn">${icon('arrow')} Sign in with your school account</button>${M365.lastError ? `<p class="tiny">${esc(M365.lastError)}</p>` : ''}</div>`;
  if (!cloudMine()) return `<div class="cloudbox" role="group" aria-labelledby="cloudH"><h3 id="cloudH">School account</h3><div class="notice">You are signed in as ${esc(w.email)}, but this log belongs to ${esc(me.email || me.name)}. Sign out, or open the log for ${esc(w.email)}.</div><div class="row"><button class="btn sec" id="cloudOut">Sign out</button><button class="btn" id="cloudMineBtn">Open my log</button></div></div>`;
  const ts = Object.values(c.teachers || {});
  return `<div class="cloudbox" role="group" aria-labelledby="cloudH"><h3 id="cloudH">School account</h3>
    <p>Signed in as <b>${esc(w.name || w.email)}</b>. Your log is kept in your OneDrive, in the folder “${esc(M365.folder())}”.</p>
    <p class="tiny" id="cloudState">${Cloud.busy ? '<span class="spin"></span> Keeping in step…' : Cloud.status ? esc(Cloud.status) : c.syncedAt ? 'In step with OneDrive, ' + esc(fmtDay(c.syncedAt)) + ' ' + new Date(c.syncedAt).toLocaleTimeString('en-SG', {hour:'numeric', minute:'2-digit'}) + '.' : 'Not in step yet.'}</p>
    ${ts.length ? `<p class="tiny">Shared through OneDrive with: ${ts.map(t => esc(t.name || t.email)).join(', ')}.</p>` : ''}
    <div class="row">${Cloud.needSignIn ? `<button class="btn" id="cloudIn">Sign in again</button>` : `<button class="btn sec" id="cloudNow">Keep in step now</button>`}<button class="btn ghost" id="cloudOut">Sign out</button></div></div>`;
}
function wireCloud(){
  const i = $('#cloudIn'); if (i) i.onclick = cloudSignIn;
  const o = $('#cloudOut'); if (o) o.onclick = cloudSignOut;
  const n = $('#cloudNow'); if (n) n.onclick = async () => { n.disabled = true; await cloudSync({push:true}); route(); };
  const m = $('#cloudMineBtn'); if (m) m.onclick = async () => { await cloudAdopt(); location.hash = '#/'; route(); };
}
/* Welcome: a school account first, when the school has it. */
function cloudWelcome(){ return cloudOn() ? `<div class="cloudin"><button type="button" class="btn" id="cloudIn">${icon('arrow')} Sign in with your school account</button><p class="tiny">The same account as Teams. Your log is kept in your own OneDrive, on every device you sign in on.</p>${M365.lastError ? `<p class="tiny">${esc(M365.lastError)}</p>` : ''}</div>` : ''; }

/* Started from boot: once signed in, keep in step now, when the Log comes back into view, and every few minutes. */
async function cloudStart(){
  if (!cloudOn()) return;
  await M365.init('student');
  // the welcome page and Settings were drawn before the account was known
  const h = location.hash || '#/'; if (h.startsWith('#/welcome') || h.startsWith('#/settings')) route();
  if (!cloudMine()) return;
  cloudSync();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') cloudSync(); });
  setInterval(() => { if (document.visibilityState === 'visible') cloudSync(); }, 5 * 60e3);
}
