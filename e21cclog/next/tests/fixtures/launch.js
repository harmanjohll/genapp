// Launches Chromium for the suites. Every page is told the Log's one time fresh start has already
// happened, so a suite that clears storage and seeds its own log is not wiped when the page opens.
// t15 tests the fresh start itself, on a context without this mark.
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const FRESH = fs.readFileSync(path.join(__dirname, '../../assets/store.js'), 'utf8').match(/const FRESH_START = '([^']+)'/)[1];
const MARK = `try{ localStorage.setItem('e21cclog.next.fresh', ${JSON.stringify(FRESH)}); }catch(e){}`;
// The console asks for a PIN (A4). Suites open it with 2468, setting it on a first open; t19 tests the lock itself
// with window.__noAutoPin. This is test code only: the console has no way round its PIN.
const AUTOPIN = `(() => { if (!/teacher\\.html$/.test(location.pathname)) return; const tick = () => { if (window.__noAutoPin) return; const g = document.getElementById('pinGate'); const f = g && g.querySelector('form');
  if (!f || f.dataset.auto){ if (!window.__consoleData && !g) return setTimeout(tick, 40); if (f && f.dataset.auto) return; return setTimeout(tick, 40); }
  f.dataset.auto = '1'; f.querySelectorAll('input[type=password]').forEach(i => i.value = '2468'); f.requestSubmit(); }; document.addEventListener('DOMContentLoaded', tick); })();`;
module.exports = async function launch(opts){
  const browser = await chromium.launch(opts);
  const plain = browser.newContext.bind(browser);
  browser.plainContext = plain;
  browser.newContext = async o => { const ctx = await plain(o); await ctx.addInitScript(MARK); await ctx.addInitScript(AUTOPIN); return ctx; };
  browser.newPage = async o => (await browser.newContext(o)).newPage();
  return browser;
};
module.exports.FRESH = FRESH;
module.exports.AUTOPIN = AUTOPIN;
