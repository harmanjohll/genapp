// A stand in for Microsoft: the OneDrive calls the Log makes through Graph, answered in memory, with the same
// rules that matter here: each person has their own drive; a file opens only to its owner and to those it was
// shared with; writing needs write access; If-Match refuses a stale write with 412. Pages get window.E21_TEST_AUTH
// in place of signing in, with a token that says who they are.
const USERS = {
  'tok-aisha':{id:'u-aisha', name:'Aisha Tan', email:'aisha_tan@btyss.moe.edu.sg', drive:'d-aisha'},
  'tok-lim':{id:'u-lim', name:'Lim Mei', email:'lim_mei@btyss.moe.edu.sg', drive:'d-lim'},
  'tok-goh':{id:'u-goh', name:'Goh Siew', email:'goh_siew@btyss.moe.edu.sg', drive:'d-goh'}
};
function graph(){
  const drives = {}; for (const u of Object.values(USERS)) drives[u.drive] = {owner:u.email, items:{}};
  let seq = 0; const calls = [];
  const cors = {'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'authorization, content-type, if-match', 'Access-Control-Allow-Methods':'GET, PUT, POST, OPTIONS', 'Access-Control-Expose-Headers':'etag'};
  const reply = (route, status, body) => route.fulfill({status, headers:Object.assign({'Content-Type':'application/json'}, cors), body:body === undefined ? '' : JSON.stringify(body)});
  const meta = (d, it) => ({id:it.id, name:it.name, eTag:it.eTag, parentReference:{driveId:d}, file:{mimeType:'application/json'}, '@microsoft.graph.downloadUrl':`https://dl.test/${d}/${it.id}?v=${it.eTag}`});
  const byPath = (d, path) => Object.values(drives[d].items).find(it => it.path === path);
  const can = (d, it, user, write) => drives[d].owner === user.email || it.perms.some(p => p.email === user.email && (!write || p.role === 'write'));
  function put(d, it, path, body, ifMatch){
    if (ifMatch && it && ifMatch !== it.eTag) return {status:412};
    if (ifMatch && !it) return {status:412};
    if (!it){ it = {id:'i' + (++seq), name:path.split('/').pop(), path, perms:[]}; drives[d].items[it.id] = it; }
    it.content = body; it.eTag = '"e' + (++seq) + '"'; return {status:200, it};
  }
  async function handle(route){
    const req = route.request(); if (req.method() === 'OPTIONS') return route.fulfill({status:204, headers:cors});
    const u = new URL(req.url()); const p = decodeURIComponent(u.pathname.replace(/^\/v1\.0/, ''));
    const user = USERS[(req.headers().authorization || '').replace(/^Bearer /, '')];
    calls.push(req.method() + ' ' + p + (user ? ' as ' + user.email : ''));
    if (!user) return reply(route, 401, {error:{code:'InvalidAuthenticationToken'}});
    const ifMatch = req.headers()['if-match'] || '';
    if (p === '/me') return reply(route, 200, {id:user.id, displayName:user.name, mail:user.email, userPrincipalName:user.email});
    if (p === '/me/drive/sharedWithMe'){ const out = []; for (const [d, dr] of Object.entries(drives)) for (const it of Object.values(dr.items)) if (it.perms.some(x => x.email === user.email)) out.push({name:it.name, remoteItem:{id:it.id, name:it.name, parentReference:{driveId:d}}}); return reply(route, 200, {value:out}); }
    let m;
    if ((m = /^\/me\/drive\/root:\/(.+?)(:\/content|:\/children)?$/.exec(p))){
      const d = user.drive; const path = m[1];
      if (m[2] === ':/children'){ const kids = Object.values(drives[d].items).filter(it => it.path.slice(0, it.path.lastIndexOf('/')) === path); return kids.length ? reply(route, 200, {value:kids.map(it => meta(d, it))}) : reply(route, 404, {error:{code:'itemNotFound'}}); }
      if (m[2] === ':/content' && req.method() === 'PUT'){ const r = put(d, byPath(d, path), path, req.postData() || '', ifMatch); return r.status === 412 ? reply(route, 412, {error:{code:'preconditionFailed'}}) : reply(route, r.it.content && byPath(d, path) === r.it ? 200 : 201, meta(d, r.it)); }
      const it = byPath(d, path); return it ? reply(route, 200, meta(d, it)) : reply(route, 404, {error:{code:'itemNotFound'}});
    }
    if ((m = /^\/me\/drive\/items\/([^/]+)\/invite$/.exec(p))){
      const it = drives[user.drive].items[m[1]]; if (!it) return reply(route, 404, {});
      const b = JSON.parse(req.postData() || '{}'); for (const r of b.recipients || []) it.perms.push({email:String(r.email).toLowerCase(), role:(b.roles || [])[0] || 'read'});
      return reply(route, 200, {value:it.perms});
    }
    if ((m = /^\/drives\/([^/]+)\/items\/([^/]+?)(\/content)?$/.exec(p))){
      const d = m[1]; const it = drives[d] && drives[d].items[m[2]]; if (!it) return reply(route, 404, {error:{code:'itemNotFound'}});
      if (req.method() === 'PUT'){ if (!can(d, it, user, true)) return reply(route, 403, {error:{code:'accessDenied'}}); const r = put(d, it, it.path, req.postData() || '', ifMatch); return r.status === 412 ? reply(route, 412, {}) : reply(route, 200, meta(d, r.it)); }
      if (!can(d, it, user, false)) return reply(route, 403, {error:{code:'accessDenied'}});
      return m[3] ? route.fulfill({status:200, headers:cors, body:it.content}) : reply(route, 200, meta(d, it));
    }
    return reply(route, 404, {error:{code:'notHandled', path:p}});
  }
  async function download(route){
    const req = route.request(); if (req.method() === 'OPTIONS') return route.fulfill({status:204, headers:cors});
    const [, d, id] = new URL(req.url()).pathname.split('/'); const it = drives[d] && drives[d].items[id];
    return it ? route.fulfill({status:200, headers:Object.assign({'Content-Type':'application/json'}, cors), body:it.content}) : route.fulfill({status:404, headers:cors, body:''});
  }
  async function attach(ctx){ await ctx.route('https://graph.microsoft.com/**', handle); await ctx.route('https://dl.test/**', download); }
  const file = (d, path) => { const it = byPath(d, path); return it ? {id:it.id, perms:it.perms, data:JSON.parse(it.content || 'null')} : null; };
  return {attach, drives, calls, file};
}
// an init script for a page: who is signed in, if anyone
const auth = tok => `window.E21_TEST_AUTH = (() => { const U = ${JSON.stringify(USERS)}; let t = ${JSON.stringify(tok || '')}; const acct = () => t ? {name:U[t].name, username:U[t].email} : null; return {get account(){ return acct(); }, token(){ return t; }, signIn(){}, signOut(){ t = ''; }}; })();`;
module.exports = {graph, auth, USERS};
