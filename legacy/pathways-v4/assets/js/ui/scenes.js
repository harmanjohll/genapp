// The drawn-scene kit v2 promised and never shipped, started deliberately
// small: one horizon strip per life band, plus the two ceremony objects (the
// envelope, the door). Style guide, enforced by eye until the kit grows:
// 900x110 viewBox, single-weight 2.5px round-cap strokes, ink is
// currentColor so the era palette and dark mode tint everything for free,
// fills forbidden except tiny accents, people never drawn.
//
// Five strips, not thirty plates: the audit was blunt that a half-empty
// object system reads worse than none, so the kit ships complete at low
// resolution rather than gappy at high.

const wrap = (inner) => `<svg class="scene-art" viewBox="0 0 900 110" preserveAspectRatio="xMidYMax meet" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

const SKYLINES = {
  // 13-16: the void deck. Two HDB blocks, the letterbox wall, the flag.
  school: wrap(`
    <path d="M40 104V38h150v66"/><path d="M40 60h150M40 82h150"/>
    <path d="M64 38v-8h24v8M118 38v-8h24v8"/>
    <path d="M70 104v-14h28v14M132 104v-14h28v14"/>
    <path d="M240 104V54h120v50"/><path d="M240 78h120"/>
    <path d="M262 68h16M290 68h16M318 68h16M262 92h16M290 92h16"/>
    <path d="M420 104V30"/><path d="M420 34l34 8-34 8"/>
    <path d="M500 104c40-2 80-2 120 0M540 104v-12M580 104v-12"/>
    <path d="M700 104V72c0-10 8-18 18-18s18 8 18 18v32"/>
    <path d="M780 104h80"/>
  `),
  // 17-21: the campus and the workshop. Sawtooth roof, gantry, a bus stop.
  postsec: wrap(`
    <path d="M40 104V64l40-22v22l40-22v22l40-22v40"/>
    <path d="M60 84h12M100 84h12M140 84h12"/>
    <path d="M240 104V44h6M246 44h90M336 44v60M270 44v60M306 44v60"/>
    <path d="M255 74h66"/>
    <path d="M430 104v-40h110v40M430 76h110M452 64v12M496 64v12"/>
    <path d="M620 104v-34h90M710 70v34M636 70v-16h28v16"/>
    <path d="M790 104h70M804 104V84h42v20"/>
  `),
  // 22-29: town. The viaduct on pillars, a train, towers behind.
  twenties: wrap(`
    <path d="M40 104V40h60v64M52 56h36M52 72h36M52 88h36"/>
    <path d="M130 104V24h70v80M144 40h42M144 58h42M144 76h42"/>
    <path d="M230 104V56h56v48"/>
    <path d="M330 78h530"/><path d="M370 78v26M470 78v26M570 78v26M670 78v26M770 78v26"/>
    <path d="M400 78v-16h150v16M414 62v16M448 62v16M482 62v16M516 62v16"/>
    <path d="M620 104h60M700 104h40"/>
  `),
  // 30-39: the estate. Blocks, a crane still building, young trees.
  thirties: wrap(`
    <path d="M50 104V50h80v54M64 66h52M64 84h52"/>
    <path d="M170 104V34h80v70M184 50h52M184 68h52M184 86h52"/>
    <path d="M330 104V28"/><path d="M330 36h110M440 36v10M394 36v14M330 52l40-16"/>
    <path d="M520 104v-20c0-8 7-14 15-14s15 6 15 14v20M535 70v-10"/>
    <path d="M600 104v-26c0-9 8-16 17-16s17 7 17 16v26"/>
    <path d="M700 104h160M730 104V88h40v16M800 104V88h34v16"/>
  `),
  // 40+: your own block. Close, low, a bench, one grown tree.
  later: wrap(`
    <path d="M60 104V44h180v60M84 62h132M84 82h132"/>
    <path d="M120 104v-18h40v18"/>
    <path d="M320 104v-34c0-16 13-28 28-28s28 12 28 28v34M348 42v-12"/>
    <path d="M300 104h100"/>
    <path d="M480 104h90M494 92v12M556 92v12M486 92h76"/>
    <path d="M650 104h190M680 104V70h60v34M694 84h32"/>
  `),
};

export function skyline(era) {
  return SKYLINES[era] || SKYLINES.school;
}

/** The envelope, closed or torn open. The fork's first beat holds it. */
export function envelopeArt(open) {
  return `
  <svg class="env-art${open ? ' open' : ''}" viewBox="0 0 340 230" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    ${open ? `<rect class="env-slip" x="66" y="18" width="208" height="120" rx="6" fill="var(--surface)"/>
              <path class="env-sliplines" d="M92 48h156M92 70h156M92 92h110" stroke-width="2.5" opacity="0.5"/>` : ''}
    <rect x="40" y="76" width="260" height="130" rx="10" fill="var(--surface)"/>
    <path class="env-flap" d="M40 86l130 74 130-74" ${open ? 'opacity="0.35"' : ''}/>
    ${open ? '' : '<circle cx="170" cy="160" r="4" fill="currentColor" stroke="none"/>'}
  </svg>`;
}

/* ---- v4: the guided start ---------------------------------------------------
   Step illustrations: one small drawing per step, same single weight line,
   one yellow accent. They say what the step is for before the words do. */

const step = (inner) => `<svg class="step-art" viewBox="0 0 240 120" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

const STEPS = {
  year: step(`
    <path d="M20 70h200" stroke="var(--accent)" stroke-width="8"/>
    <circle cx="36" cy="70" r="9" fill="var(--surface)"/><circle cx="84" cy="70" r="9" fill="var(--surface)"/>
    <circle cx="156" cy="70" r="9" fill="var(--surface)"/><circle cx="204" cy="70" r="9" fill="var(--surface)"/>
    <rect x="102" y="54" width="36" height="32" rx="12" fill="var(--accent)" stroke="var(--night)"/>
    <path d="M112 66h16M112 74h16" stroke="var(--night)"/>
    <path d="M120 40v-14M114 32l6-6 6 6"/>`),
  levels: step(`
    <rect x="30" y="22" width="120" height="30" rx="15"/><circle cx="135" cy="37" r="11" fill="var(--accent)" stroke="var(--night)"/>
    <rect x="30" y="68" width="120" height="30" rx="15"/><circle cx="90" cy="83" r="11" fill="var(--surface)"/>
    <path d="M170 37h40M170 83h24"/><circle cx="214" cy="37" r="6" fill="var(--line-open)" stroke="none"/>`),
  reveal: step(`
    <circle cx="40" cy="60" r="16" fill="var(--surface)"/>
    <path d="M56 60c40 0 44-36 120-36" stroke="var(--line-open)" stroke-width="4"/>
    <path d="M56 60h120" stroke="var(--line-open)" stroke-width="4"/>
    <path d="M56 60c40 0 44 36 120 36" stroke-dasharray="6 7"/>
    <circle cx="190" cy="24" r="10" fill="var(--line-open)" stroke="none"/><circle cx="190" cy="60" r="10" fill="var(--line-open)" stroke="none"/>
    <circle cx="190" cy="96" r="10" fill="var(--surface)"/>`),
  move: step(`
    <rect x="24" y="28" width="132" height="64" rx="10" fill="var(--surface)"/>
    <path d="M70 28v64" stroke-dasharray="5 6"/><path d="M36 52h22M36 66h14"/><path d="M84 50h56M84 64h40"/>
    <path d="M172 34h44a10 10 0 0 1 10 10v22a10 10 0 0 1-10 10h-22l-14 12V76h-8a10 10 0 0 1-10-10V44a10 10 0 0 1 10-10z" fill="var(--accent)" stroke="var(--night)"/>`),
  done: step(`
    <circle cx="120" cy="60" r="36" fill="var(--accent)" stroke="var(--night)"/>
    <path d="M102 60l12 12 24-26" stroke="var(--night)" stroke-width="5"/>
    <path d="M30 60h40M170 60h40" stroke-dasharray="2 8"/>`),
};

export function stepArt(name) {
  return STEPS[name] || '';
}

/**
 * The intro, labelled. An example student's five subject levels feed one
 * hub ("You"); a wire runs from it to each of the eight destinations, by
 * name; the open ones light; then Maths slides up one level and the places
 * that move opens light too; none goes dark. The example is computed by the
 * real rules engine in start.js, so every lit lamp is true for that plan.
 *
 * Every element's resting style is its final frame, and the animation only
 * plays the way there, so reduced motion shows the finished, labelled
 * picture rather than an empty one.
 *
 * @param {Object} ex { subjects: [{ name, from, to? }], dests: [{ name, before, after }] }
 *   before/after are true when that destination is open.
 */
export function introArt(ex) {
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const POS = { G1: 13, G2: 40, G3: 67 };
  const subjY = (i) => 34 + i * 54;
  const hubX = 168; const hubY = 140;
  const lampX = 250;
  const lampY = (i) => 20 + i * 34.5;
  const subs = ex.subjects.map((sb, i) => {
    const y = subjY(i);
    const moving = sb.to && sb.to !== sb.from;
    const thumb = (lv, cls) => `<g transform="translate(${POS[lv]} ${y + 2})"><g class="in-th ${cls}"><rect width="26" height="20" rx="10"/><text x="13" y="14" text-anchor="middle">${lv}</text></g></g>`;
    return `
      <g class="in-sw${moving ? ' sw-move' : ''}" style="--i:${i}">
        <text class="in-sname" x="10" y="${y - 6}">${esc(sb.name)}</text>
        <rect class="in-track" x="10" y="${y}" width="86" height="24" rx="12"/>
        ${moving ? `${thumb(sb.from, 'th-from')}${thumb(sb.to, 'th-to')}` : thumb(sb.from, '')}
      </g>
      <path class="in-feed" d="M96 ${y + 12} C 140 ${y + 12}, 140 ${hubY}, ${hubX - 18} ${hubY}" pathLength="100" style="--i:${i}"/>`;
  }).join('');
  const lamps = ex.dests.map((d, i) => {
    const cls = d.before ? 'lit0' : d.after ? 'lit1' : 'ring';
    const y = lampY(i);
    const d2 = `M${hubX + 18} ${hubY} C ${hubX + 46} ${hubY}, ${lampX - 44} ${y}, ${lampX - 11} ${y}`;
    return `
      ${cls === 'lit1' ? `<path class="in-wire w-ring" d="${d2}" pathLength="100" style="--i:${i}"/>` : ''}
      <path class="in-wire w-${cls}" d="${d2}" pathLength="100" style="--i:${i}"/>
      <circle class="in-lamp l-${cls}" cx="${lampX}" cy="${y}" r="10" style="--i:${i}"/>
      <text class="in-dname n-${cls}" x="${lampX + 16}" y="${y + 4.5}" style="--i:${i}">${esc(d.name)}</text>`;
  }).join('');
  return `
  <svg class="intro-art" viewBox="0 0 400 296" role="img" aria-label="An example: five subject levels lead to eight places after secondary school. ${ex.dests.filter((d) => d.before).length} are open. Moving Maths up one level opens ${ex.dests.filter((d) => !d.before && d.after).map((d) => d.name).join(' and ')}. None closes." fill="none" stroke-linecap="round">
    ${subs}
    <g class="in-hub"><circle cx="${hubX}" cy="${hubY}" r="18"/><text x="${hubX}" y="${hubY + 4}" text-anchor="middle">You</text></g>
    ${lamps}
  </svg>`;
}
