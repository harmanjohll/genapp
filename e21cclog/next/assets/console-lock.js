/* ==================================================================
   The console's lock (A4). The teacher console keeps students' shared work in this browser; here it
   is kept encrypted, with a key made from the teacher's PIN, so a borrowed or shared device shows
   nothing readable. The PIN is asked on every open and after ten minutes without use.

   The console's own script waits in teacher.html (#consoleMain) and starts only once the PIN opens
   the store: it reads window.__consoleData and saves through window.__consoleSave.

   Keys: e21cclog.next.teacher (the store, sealed with AES GCM), e21cclog.next.teacher.pin (the salt,
   the iteration count, and a sealed check word; never the PIN), e21cclog.next.teacher.pause (tries).
   A four to six digit PIN keeps out a curious borrower, not a determined attacker with the device.
   teacher.html?demo=1 opens the demo's made up store instead (assets/demo.js); it never touches these keys.
   Needs core.js (b64urlFromBytes, bytesFromB64url).
   ================================================================== */
(function(){
  'use strict';
  const DATA = 'e21cclog.next.teacher', LOCK = 'e21cclog.next.teacher.pin', PAUSE = 'e21cclog.next.teacher.pause';
  const ITER = 150000, TRIES = 5, WAIT = 30000;
  const IDLE = Number(sessionStorage.getItem('e21cclog.next.idle')) || 10 * 60 * 1000;
  // the demo (teacher.html?demo=1) opens made up sample data, never the real store, and saves nothing
  const DEMO = new URLSearchParams(location.search).get('demo') === '1';
  const te = new TextEncoder(), td = new TextDecoder();
  let key = null, pending = Promise.resolve();

  const read = k => { try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch{ return null; } };
  async function makeKey(pin, salt, iterations){
    const base = await crypto.subtle.importKey('raw', te.encode(pin), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['encrypt', 'decrypt']);
  }
  async function seal(k, text){ const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv}, k, te.encode(text))); return {iv:b64urlFromBytes(iv), ct:b64urlFromBytes(ct)}; }
  async function unseal(k, box){ return td.decode(await crypto.subtle.decrypt({name:'AES-GCM', iv:bytesFromB64url(box.iv)}, k, bytesFromB64url(box.ct))); }

  // saves run one after another, so the last one written is always the newest
  window.__consoleSave = store => {
    const text = JSON.stringify(store);
    pending = pending.then(async () => { if (!key) return; const box = await seal(key, text);
      try{ localStorage.setItem(DATA, JSON.stringify(Object.assign({v:1, sealed:'aes-gcm'}, box))); }catch{ window.dispatchEvent(new Event('consolefull')); } }).catch(() => {});
    return pending;
  };
  window.__consoleFlush = () => pending;

  /* ---------- the PIN screen ---------- */
  const gate = document.createElement('div'); gate.id = 'pinGate'; gate.setAttribute('role', 'dialog'); gate.setAttribute('aria-modal', 'true'); gate.setAttribute('aria-labelledby', 'pinH');
  const others = () => [...document.body.children].filter(el => el !== gate && el.tagName !== 'SCRIPT');
  const lockPage = on => others().forEach(el => on ? el.setAttribute('inert', '') : el.removeAttribute('inert'));
  const pinField = (name, label) => `<label class="f"><span>${label}</span><input class="in" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" name="${name}" required></label>`;
  const say = (text, bad) => { const m = gate.querySelector('#pinMsg'); if (m){ m.textContent = text; m.className = 'tiny' + (bad ? ' bad' : ''); } };
  const head = `<div class="pinbrand"><img src="assets/crest.png" alt=""><span>E21CC Log · Teacher console</span></div>`;

  function show(mode, note){
    const plain = read(DATA); const holds = plain && !plain.sealed && Object.keys(plain.items || {}).length;
    if (mode === 'set') gate.innerHTML = `<form class="card pincard">${head}<h1 id="pinH">Set a PIN for the console</h1>
      <p class="muted">The console keeps the work students share with you on this device. A PIN locks it: without the PIN, nothing it holds can be read. It is asked each time the console opens, and after ten minutes without use.</p>
      ${holds ? `<p class="tiny">This console already holds shared work. The PIN will lock that too.</p>` : ''}
      ${pinField('pin', 'New PIN, 4 to 6 digits')}${pinField('again', 'Type it again')}
      <p id="pinMsg" class="tiny" aria-live="polite">${note || ''}</p><button class="btn" type="submit">Set PIN and open</button></form>`;
    else if (mode === 'ask') gate.innerHTML = `<form class="card pincard">${head}<h1 id="pinH">Enter your PIN</h1>
      <p class="muted">The console is locked. Students’ shared work stays unreadable until the PIN is entered.</p>
      ${pinField('pin', 'PIN')}<p id="pinMsg" class="tiny" aria-live="polite">${note || ''}</p>
      <div class="row"><button class="btn" type="submit">Open the console</button><button class="btn ghost" type="button" id="pinForgot">Forgot PIN</button></div></form>`;
    else gate.innerHTML = `<div class="card pincard">${head}<h1 id="pinH">Forgot your PIN?</h1>
      <p class="muted">A PIN cannot be recovered. Clearing the console removes everything it holds on this device: students’ shared work, your notes and your classes. Students keep their own logs, and can send their work again. If you kept a backup file, restore it after clearing: Set up, Restore from a backup.</p>
      <div class="row"><button class="btn danger" type="button" id="pinClear">Clear the console</button><button class="btn sec" type="button" id="pinBack">Back</button></div></div>`;
    if (!gate.isConnected){ document.body.appendChild(gate); lockPage(true); }
    const f = gate.querySelector('form'); if (f) f.onsubmit = ev => { ev.preventDefault(); (mode === 'set' ? setPin : askPin)(f); };
    const fg = gate.querySelector('#pinForgot'); if (fg) fg.onclick = () => show('forgot');
    const bk = gate.querySelector('#pinBack'); if (bk) bk.onclick = () => show('ask');
    const cl = gate.querySelector('#pinClear'); if (cl) cl.onclick = () => { localStorage.removeItem(DATA); localStorage.removeItem(LOCK); localStorage.removeItem(PAUSE); show('set', 'The console was cleared. Set a new PIN.'); };
    if (mode === 'ask') paused();
    const first = gate.querySelector('input, button'); if (first) first.focus();
  }
  function paused(){
    const p = read(PAUSE) || {}; const left = (p.until || 0) - Date.now(); const f = gate.querySelector('form'); if (!f) return false;
    const off = left > 0; f.querySelectorAll('input, button[type=submit]').forEach(el => el.disabled = off);
    if (off){ say(`Too many tries. Wait ${Math.ceil(left / 1000)} seconds, then try again.`, true); setTimeout(() => { if (gate.isConnected && gate.querySelector('#pinH').textContent === 'Enter your PIN') show('ask'); }, left + 50); }
    return off;
  }
  async function setPin(f){
    const a = f.pin.value.trim(), b = f.again.value.trim();
    if (!/^\d{4,6}$/.test(a)) return say('Use 4 to 6 digits.', true);
    if (a !== b) return say('The two PINs are not the same. Type them again.', true);
    say('Setting the PIN…');
    const salt = crypto.getRandomValues(new Uint8Array(16)); const k = await makeKey(a, salt, ITER);
    const plain = read(DATA); const data = plain && !plain.sealed ? plain : null;
    localStorage.setItem(LOCK, JSON.stringify({v:1, iter:ITER, salt:b64urlFromBytes(salt), check:await seal(k, 'e21cclog')}));
    key = k; localStorage.removeItem(PAUSE);
    if (data) await window.__consoleSave(data); else localStorage.removeItem(DATA);
    open(data);
  }
  async function askPin(f){
    if (paused()) return;
    const lock = read(LOCK); const pin = f.pin.value.trim(); say('Opening…');
    let k = null; try{ k = await makeKey(pin, bytesFromB64url(lock.salt), lock.iter || ITER); if (await unseal(k, lock.check) !== 'e21cclog') k = null; }catch{ k = null; }
    if (!k){ const p = read(PAUSE) || {}; const tries = (p.tries || 0) + 1;
      localStorage.setItem(PAUSE, JSON.stringify(tries >= TRIES ? {tries:0, until:Date.now() + WAIT} : {tries}));
      f.pin.value = ''; f.pin.focus(); if (!paused()) say(`That PIN did not match. ${TRIES - tries} ${TRIES - tries === 1 ? 'try' : 'tries'} left before a short pause.`, true); return; }
    localStorage.removeItem(PAUSE); key = k;
    const box = read(DATA); let data = null;
    if (box && box.sealed){ try{ data = JSON.parse(await unseal(k, box)); }catch{ say('The console’s store could not be opened with this PIN.', true); return; } }
    else if (box){ data = box; await window.__consoleSave(box); }
    open(data);
  }

  /* ---------- open: start the console, and lock again after ten minutes without use ---------- */
  function open(data, demo){
    window.__consoleData = data; gate.remove(); lockPage(false);
    const s = document.createElement('script'); s.textContent = document.getElementById('consoleMain').textContent; document.body.appendChild(s);
    if (demo) return;
    let last = Date.now(); const touch = () => { last = Date.now(); };
    for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart', 'input']) window.addEventListener(ev, touch, {capture:true, passive:true});
    setInterval(async () => { if (Date.now() - last > IDLE){ await pending; location.reload(); } }, Math.min(15000, Math.max(250, IDLE / 4)));
  }

  if (DEMO){
    window.__consoleSave = () => Promise.resolve(); window.__consoleFlush = () => Promise.resolve();
    const add = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
    add('assets/demo-data.js').then(() => add('assets/demo.js')).then(() => { open(window.demoConsoleStore(), true); window.demoStart(); });
    return;
  }
  if (!window.crypto || !crypto.subtle){ document.body.insertAdjacentHTML('afterbegin', '<p class="notice warn" style="margin:16px">This browser cannot lock the console. Open it in a recent Chrome, Edge or Safari, at its https address.</p>'); return; }
  show(read(LOCK) ? 'ask' : 'set');
})();
