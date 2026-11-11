// The long view: ages 12 to 65 on one ribbon.
//
// 6.0's path stopped at the 8 places, at 17. This draws what comes after to
// scale, so secondary school is the short band on the left that it is. Ten
// markers sit on the ribbon; one is open at a time, and Next steps forward
// through them. The first one open is the next one ahead of the student.
//
// The data is data/lifelong.json, which an earlier build wrote for a ribbon
// it never drew.

import { esc } from './dom.js?v=7.0.0';
import { icon } from './icons.js?v=7.0.0';

const pct = (age, r) => ((age - r.from) / (r.to - r.from)) * 100;

/** The marker to open first: the first at or after this age. */
export function firstMarker(markers, age) {
  const i = markers.findIndex((m) => m.age >= age);
  return i < 0 ? markers.length - 1 : i;
}

/**
 * @param {Object} lifelong  data/lifelong.json
 * @param {number} age       the student's age now
 * @param {number} sel       index of the open marker
 */
export function longViewHtml(lifelong, age, sel) {
  const r = (lifelong && lifelong.ribbon) || { from: 12, to: 65 };
  const bands = (lifelong && lifelong.bands) || [];
  const markers = (lifelong && lifelong.markers) || [];
  if (!markers.length) return '';
  const i = Math.min(markers.length - 1, Math.max(0, sel));
  const m = markers[i];
  const say = m.you || { title: m.title, body: m.body };
  return `<div class="longview" data-sel="${i}">
    <div class="lv-track" role="group" aria-label="Ages ${r.from} to ${r.to}">
      <div class="lv-bands" aria-hidden="true">${bands.map((b) => `<span class="lv-band" data-tone="${esc(b.tone)}" data-id="${esc(b.id)}" style="flex:${b.to - b.from + 1}"><i>${esc(b.you || b.label)}</i></span>`).join('')}</div>
      ${markers.map((x, k) => `<button type="button" class="lv-m" data-action="lv-pick" data-i="${k}" data-key="lv-${k}" aria-pressed="${k === i}" aria-label="Age ${x.age}: ${esc((x.you || x).title)}" style="left:${pct(x.age, r).toFixed(2)}%"><i></i></button>`).join('')}
      <span class="lv-you" style="left:${pct(Math.max(r.from, Math.min(r.to, age)), r).toFixed(2)}%" aria-hidden="true">You</span>
    </div>
    <div class="lv-ages" aria-hidden="true"><span>${r.from}</span><span>20</span><span>30</span><span>45</span><span>${r.to}</span></div>
    <div class="lv-card" aria-live="polite">
      <p class="lv-age">Age ${m.age}</p>
      <p class="lv-t">${esc(say.title)}</p>
      <p class="lv-b">${esc(say.body)}${m.status === 'provisional' ? ' <span class="src-chip provisional">to confirm</span>' : ''}</p>
      <p class="lv-nav">
        <button type="button" class="btn ghost small press" data-action="lv-pick" data-i="${i - 1}" data-key="lv-prev" ${i === 0 ? 'disabled' : ''} aria-label="Earlier">${icon('back')}</button>
        <span class="lv-n">${i + 1} of ${markers.length}</span>
        <button type="button" class="btn small press" data-action="lv-pick" data-i="${i + 1}" data-key="lv-next" ${i === markers.length - 1 ? 'disabled' : ''}>Next ${icon('arrow')}</button>
      </p>
    </div>
  </div>`;
}
