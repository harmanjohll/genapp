// Version 6: only a claim a teacher affirmed backs a statement. Suites written before it seeded logs where the coach's
// read of the words did the backing. In those suites a stand in teacher affirms each claim the words show, so what
// they test (securing, levels, Home, the console) still holds under the new rule. t34 tests the teacher's review itself.
// Run in the student app's page: page.evaluate(AFFIRM)  or  new Function(AFFIRM)() inside an evaluate.
const AFFIRM = `(() => {
  const list = typeof me !== 'undefined' && me ? me.entries : [];
  let n = 0;
  for (const e of list) for (const l of (e.links || [])){
    const s = typeof statementById === 'function' ? statementById(l.sid) : null; if (!s || !wordsShow(e, s)) continue;
    e.notes = e.notes || []; if (e.notes.some(x => x.sid === l.sid && x.verdict && x.quote === (l.quote || ''))) continue;
    e.notes.push({id:'rv' + e.id + '_' + l.sid + '_' + n, by:'Ms Test', role:'Subject teacher', at:Math.max(e.created || 0, l.at || 0) + 1000, anchor:'claim:' + l.sid, sid:l.sid, verdict:'yes', quote:l.quote || '', text:'Affirmed by a stand in teacher in a test.', seen:true}); n++;
  }
  if (n && typeof saveDb === 'function') saveDb();
  return n;
})()`;
// The same, on the store saved in this browser, before the page opens the log: use it between seeding and reload,
// so the first open already sees the reviews (Home's one prompt per open is chosen on that first open).
const AFFIRM_STORE = `(() => {
  const d = JSON.parse(localStorage.getItem('e21cclog') || 'null'); if (!d || !d.profiles) return 0;
  const set = coreSet(); let n = 0;
  for (const p of Object.values(d.profiles)) for (const e of (p.entries || [])) for (const l of (e.links || [])){
    const s = set.list.find(x => x.id === l.sid); if (!s || !wordsShow(e, s)) continue;
    e.notes = e.notes || []; if (e.notes.some(x => x.sid === l.sid && x.verdict)) continue;
    e.notes.push({id:'rv' + e.id + '_' + l.sid + '_' + n, by:'Ms Test', role:'Subject teacher', at:Math.max(e.created || 0, l.at || 0) + 1000, anchor:'claim:' + l.sid, sid:l.sid, verdict:'yes', quote:l.quote || '', text:'Affirmed by a stand in teacher in a test.', seen:true}); n++;
  }
  localStorage.setItem('e21cclog', JSON.stringify(d)); return n;
})()`;
// In Node, on a seeded profile: a stand in teacher affirms every claim, where a suite needs secured statements to stay
// secured through a change it tests (a migration, a rename).
function affirmAll(profile){ for (const e of (profile.entries || [])) for (const l of (e.links || [])){ e.notes = e.notes || []; if (!e.notes.some(x => x.sid === l.sid && x.verdict)) e.notes.push({id:'rv' + e.id + '_' + l.sid, by:'Ms Test', role:'Subject teacher', at:Math.max(e.created || 0, l.at || 0) + 1000, anchor:'claim:' + l.sid, sid:l.sid, verdict:'yes', quote:l.quote || '', text:'Affirmed by a stand in teacher in a test.', seen:true}); } return profile; }
module.exports = {AFFIRM, AFFIRM_STORE, affirmAll};
