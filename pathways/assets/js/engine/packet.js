// What a share link carries: one year's plan and the goal, and the compass
// only if the student adds it. No names, no grades, no typed words, no device data. Pure, so verify.mjs can round trip it.

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
/**
 * The compass as ids only: what is enjoyed, what matters, what the student is
 * good at. The words a student typed (proof, why, notes) never go in a link.
 */
export function packMe(c) {
  if (!c) return '';
  const str = [(c.enjoy || []).join(''), (c.values || []).join('~'), (c.strengths || []).map((r) => r.id || r).join('~')].join('.');
  return str === '..' ? '' : str;
}
export function unpackMe(str) {
  if (typeof str !== 'string' || !/^[RIASEC]{0,2}(\.[a-z_~]{0,90}){0,2}$/.test(str) || !str.replace(/\./g, '')) return null;
  const [e, v, s] = str.split('.');
  return {
    enjoy: [...new Set(e.split(''))].slice(0, 2),
    values: [...new Set((v || '').split('~').filter(Boolean))].slice(0, 3),
    strengths: [...new Set((s || '').split('~').filter(Boolean))].slice(0, 3).map((id) => ({ id, proof: '' })),
    notes: [],
  };
}
/** `me` is optional: a link carries the compass only when the student adds it. */
export function encodePacket({ y, plan, goal, me }) {
  const o = { v: 1, y, p: packPlan(plan), g: goal && goal.dest ? { sector: goal.sector || null, role: goal.role || null, dest: goal.dest, family: goal.family || null } : null };
  if (me && packMe(me)) o.m = packMe(me);
  return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodePacket(d) {
  try {
    const s = String(d).replace(/-/g, '+').replace(/_/g, '/');
    const o = JSON.parse(decodeURIComponent(escape(atob(s + '==='.slice((s.length + 3) % 4)))));
    if (!o || !YEARS.includes(o.y)) return null;
    return { y: o.y, plan: unpackPlan(o.p), goal: o.g && o.g.dest ? o.g : null, me: o.m ? unpackMe(o.m) : null };
  } catch { return null; }
}
