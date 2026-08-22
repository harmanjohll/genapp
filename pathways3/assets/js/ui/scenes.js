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
