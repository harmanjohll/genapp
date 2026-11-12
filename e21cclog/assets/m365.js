/* ==================================================================
   School sign in and OneDrive (Version 6). Shared by the student app and the teacher console.

   Off until the school's ICT registers the Log in its Microsoft admin page and fills in
   school/microsoft.json (tenantId and clientId). Until then nothing here runs, the sign in
   library is never loaded, and the Log works exactly as it did, with links in Teams.

   When it is on:
   - Students sign in with their school account. Their log is kept as a file in their own
     OneDrive (E21CC Log/log.json), so it follows them to any device.
   - Sharing with a teacher writes a share file (E21CC Log/shares/...) that only that teacher
     may read, and a notes file the teacher may write. No link to copy, no message to send.
   - Teachers sign in to the console, read what their students shared, and save their
     replies into the student's notes file.

   Microsoft's own library (MSAL, assets/vendor/msal-browser.min.js, MIT licence) does the
   signing in, with a redirect to the school's sign in page and back. Tokens stay in this
   browser. There is no server and no database: the files live in the students' OneDrive.

   Tests set window.E21_TEST_AUTH = {account, token(), signIn(), signOut()} to stand in for
   Microsoft, and answer the Graph calls themselves.
   Classic script, no modules, no dependencies.
   ================================================================== */
'use strict';

const M365 = (() => {
  const GRAPH = 'https://graph.microsoft.com/v1.0';
  /* What each side asks for. ICT grants these once for the whole school (admin consent). */
  const SCOPES = {student:['User.Read', 'Files.ReadWrite'], teacher:['User.Read', 'Files.ReadWrite.All']};
  const FROM_KEY = 'e21cclog.signinFrom';
  let cfg = null, pca = null, account = null, initP = null, lastError = '';
  let role = /teacher\.html$/.test(location.pathname) ? 'teacher' : 'student';
  const test = () => window.E21_TEST_AUTH || null;
  const base = () => location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');   // …/e21cclog/

  async function loadConfig(){
    if (cfg) return cfg;
    try{ const r = await fetch(base() + 'school/microsoft.json', {cache:'no-store'}); cfg = r.ok ? await r.json() : {}; }catch{ cfg = {}; }
    return cfg;
  }
  /* Two registrations, so each side holds only what it needs: the Log (students: their own files) and the console
     (teachers: files students share with them). consoleClientId falls back to clientId if only one was made. */
  const clientId = () => String((cfg && (role === 'teacher' ? cfg.consoleClientId || cfg.clientId : cfg.clientId)) || '').trim();
  const ready = () => !!(cfg && clientId() && String(cfg.tenantId || '').trim());
  function enabled(){ return !!test() || ready(); }
  function folder(){ return String((cfg && cfg.folder) || 'E21CC Log').replace(/[\\/:*?"<>|#%]/g, ' ').trim() || 'E21CC Log'; }
  function loadScript(src){ return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('The sign in library did not load. Check the connection and try again.')); document.head.appendChild(s); }); }
  const redirectUri = () => base() + (role === 'teacher' ? 'teacher.html' : 'index.html');
  /* A reply from the school's sign in page sits in the address after the #. */
  function responsePending(){ const h = location.hash || ''; return /(^#|&)(code|error)=/.test(h) && /(^#|&)state=/.test(h); }

  function init(r){
    if (r) role = r;
    if (initP) return initP;
    initP = (async () => {
      await loadConfig();
      const t = test(); if (t){ account = t.account || null; if (responsePending()) back(); return account; }
      if (!ready()) return null;
      try{
        if (!window.msal) await loadScript(base() + 'assets/vendor/msal-browser.min.js');
        pca = new window.msal.PublicClientApplication({
          auth:{clientId:clientId(), authority:'https://login.microsoftonline.com/' + String(cfg.tenantId).trim(), redirectUri:redirectUri(), postLogoutRedirectUri:redirectUri()},
          cache:{cacheLocation:'localStorage'}
        });
        await pca.initialize();
        const wasReply = responsePending();
        // the reply is handled on the page it lands on; the Log itself goes back to where the person was (back())
        let res = null; try{ res = await pca.handleRedirectPromise({navigateToLoginRequestUrl:false}); }catch(e){ lastError = friendly(e); }
        if (res && res.account) account = res.account;
        if (!account) account = pca.getActiveAccount() || pca.getAllAccounts()[0] || null;
        if (account) pca.setActiveAccount(account);
        // back to the page the person signed in from, with the reply taken out of the address
        if (wasReply) back();
      }catch(e){ lastError = friendly(e); }
      return account;
    })();
    return initP;
  }
  function back(){ let to = '#/'; try{ to = sessionStorage.getItem(FROM_KEY) || to; sessionStorage.removeItem(FROM_KEY); }catch{} history.replaceState(null, '', location.pathname + location.search + to); }
  function friendly(e){ const m = String((e && (e.errorMessage || e.message)) || e || ''); return /AADSTS65001|consent/i.test(m) ? 'The school has not yet approved the Log for sign in. Ask ICT to grant consent.' : /AADSTS50011|redirect/i.test(m) ? 'The Log’s address is not registered for sign in. Ask ICT to add it.' : m.slice(0, 200); }
  /* Microsoft's sign in page will not open inside a frame (as when Co-Cher shows the Log): sign in in its own tab.
     The account is then known to this browser, and the framed Log uses it after a reload. */
  const framed = () => { try{ return window.self !== window.top; }catch{ return true; } };
  async function signIn(){
    await init(); const t = test(); if (t) return t.signIn ? t.signIn() : null;
    if (framed()){ window.open(redirectUri() + (location.hash || ''), '_blank', 'noopener'); return; }
    if (!pca) throw new Error(lastError || 'School sign in is not set up yet.');
    try{ sessionStorage.setItem(FROM_KEY, location.hash && !responsePending() ? location.hash : '#/'); }catch{}
    await pca.loginRedirect({scopes:SCOPES[role], prompt:'select_account', redirectUri:redirectUri()});
  }
  /* Signing out of the Log forgets the account in this browser only: Teams and Outlook stay signed in. */
  async function signOut(){
    const t = test(); if (t){ if (t.signOut) t.signOut(); account = null; return; }
    if (pca && account){ try{ await pca.clearCache({account}); }catch{} }
    account = null;
  }
  function authError(m){ const e = new Error(m); e.auth = true; return e; }
  async function token(){
    const t = test(); if (t){ if (!account) throw authError('Sign in first.'); return t.token(); }
    if (!pca || !account) throw authError('Sign in with your school account first.');
    try{ return (await pca.acquireTokenSilent({scopes:SCOPES[role], account})).accessToken; }
    catch(e){ const err = authError('Your school sign in has run out. Sign in again.'); err.cause = e; throw err; }
  }
  async function graph(path, opts = {}){
    const headers = Object.assign({Authorization:'Bearer ' + await token()}, opts.headers || {});
    let body = opts.body;
    if (body !== undefined && typeof body !== 'string'){ body = JSON.stringify(body); headers['Content-Type'] = 'application/json'; }
    let r;
    try{ r = await fetch(/^https:/.test(path) ? path : GRAPH + path, {method:opts.method || 'GET', headers, body}); }
    catch{ const e = new Error('No connection to OneDrive right now. Your work is kept on this device.'); e.offline = true; throw e; }
    if (r.status === 401) throw authError('Your school sign in has run out. Sign in again.');
    if (!r.ok){ const e = new Error(r.status === 403 ? 'OneDrive did not allow that. The file may not be shared with you.' : r.status === 404 ? 'Not found in OneDrive.' : `OneDrive answered ${r.status}.`); e.status = r.status; throw e; }
    if (r.status === 204) return null;
    return (r.headers.get('content-type') || '').includes('json') ? r.json() : r.text();
  }
  const enc = p => p.split('/').map(encodeURIComponent).join('/');
  /* Where a file is: in the signed in person's own OneDrive by path, or anywhere by drive and item id. */
  function own(rel){ const p = enc(folder() + '/' + rel); return {meta:`/me/drive/root:/${p}`, content:`/me/drive/root:/${p}:/content`}; }
  function item(driveId, id){ return {meta:`/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(id)}`, content:`/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(id)}/content`}; }
  /* A JSON file and its version tag, or null when there is none yet. */
  async function readJson(ref){
    let meta; try{ meta = await graph(ref.meta); }catch(e){ if (e.status === 404) return null; throw e; }
    const url = meta['@microsoft.graph.downloadUrl'];
    let text;
    if (url){ const r = await fetch(url); if (!r.ok) throw new Error(`OneDrive answered ${r.status}.`); text = await r.text(); }
    else text = await graph(ref.content);
    let data = null; try{ data = typeof text === 'string' ? JSON.parse(text) : text; }catch{ throw new Error('That file in OneDrive is not one the Log can read.'); }
    return {data, etag:meta.eTag || '', id:meta.id, driveId:meta.parentReference && meta.parentReference.driveId};
  }
  /* Writes a JSON file. With an etag, only if nobody changed it since (else the error has status 412). */
  async function writeJson(ref, data, etag){
    const headers = {'Content-Type':'application/json'}; if (etag) headers['If-Match'] = etag;
    const m = await graph(ref.content, {method:'PUT', headers, body:JSON.stringify(data)});
    return {etag:m.eTag || '', id:m.id, driveId:m.parentReference && m.parentReference.driveId};
  }
  /* Lets one named person open one file: read, or write. Signing in is always needed; no email is sent. */
  async function invite(itemId, email, write){
    return graph(`/me/drive/items/${encodeURIComponent(itemId)}/invite`, {method:'POST', body:{recipients:[{email}], roles:[write ? 'write' : 'read'], requireSignIn:true, sendInvitation:false}});
  }
  async function me(){ return graph('/me?$select=id,displayName,mail,userPrincipalName'); }
  /* Files others have shared with the signed in person. Microsoft may retire this; callers cope without it. */
  async function sharedWithMe(){ const r = await graph('/me/drive/sharedWithMe'); return (r && r.value) || []; }
  function who(){ const a = account; return a ? {name:a.name || '', email:String(a.username || '').toLowerCase()} : null; }

  // a reply from the sign in page is taken in at once, before the page reads its own address
  const REPLY = responsePending();
  if (REPLY) init();
  /* Reads the school's file only: quick, and enough to know whether to offer sign in. */
  async function prepare(){ await loadConfig(); return enabled(); }
  return {init, prepare, enabled, signIn, signOut, graph, readJson, writeJson, own, item, invite, me, sharedWithMe, who, folder, responsePending,
    get account(){ return account; }, get lastError(){ return lastError; }, get role(){ return role; }, get wasReply(){ return REPLY; }, config:() => cfg, SCOPES};
})();
