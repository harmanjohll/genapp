// Launches Chromium for the suites. Every page is told the Log's one time fresh start has already
// happened, so a suite that clears storage and seeds its own log is not wiped when the page opens.
// t15 tests the fresh start itself, on a context without this mark.
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const FRESH = fs.readFileSync(path.join(__dirname, '../../assets/store.js'), 'utf8').match(/const FRESH_START = '([^']+)'/)[1];
const MARK = `try{ localStorage.setItem('e21cclog.fresh', ${JSON.stringify(FRESH)}); }catch(e){}`;
module.exports = async function launch(opts){
  const browser = await chromium.launch(opts);
  const plain = browser.newContext.bind(browser);
  browser.plainContext = plain;
  browser.newContext = async o => { const ctx = await plain(o); await ctx.addInitScript(MARK); return ctx; };
  browser.newPage = async o => (await browser.newContext(o)).newPage();
  return browser;
};
module.exports.FRESH = FRESH;
