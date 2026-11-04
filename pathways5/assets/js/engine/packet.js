// What a share link carries: one year's plan and the goal, nothing else.
// No names, no grades, no device data. Pure, so verify.mjs can round trip it.

const LEVEL_CODE = { G1: '1', G2: '2', G3: '3' };
const CODE_LEVEL = { 1: 'G1', 2: 'G2', 3: 'G3' };
const YEARS = ['sec1', 'sec2', 'sec3', 'sec4', 'sec5'];

export function packPlan(plan) {
  return Object.entries(plan || {}).map(([id, lv]) => `${id}${LEVEL_CODE[lv] || ''}`).join('~');
}
export function unpackPlan(str) {
  const out = {};
  String(str || '').split('~').forEach((tok) => { const m = tok.match(/^([a-z_0-9]+?)([123])$/); if (m) out[m[1]] = CODE_LEVEL[m[2]]; });
  return out;
}
export function encodePacket({ y, plan, goal }) {
  const o = { v: 1, y, p: packPlan(plan), g: goal && goal.dest ? { sector: goal.sector || null, role: goal.role || null, dest: goal.dest, family: goal.family || null } : null };
  return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodePacket(d) {
  try {
    const s = String(d).replace(/-/g, '+').replace(/_/g, '/');
    const o = JSON.parse(decodeURIComponent(escape(atob(s + '==='.slice((s.length + 3) % 4)))));
    if (!o || !YEARS.includes(o.y)) return null;
    return { y: o.y, plan: unpackPlan(o.p), goal: o.g && o.g.dest ? o.g : null };
  } catch { return null; }
}
