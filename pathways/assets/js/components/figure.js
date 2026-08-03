// The figure: one person, drawn from parameters, ageing across a Journey run.
//
// WHAT IT RESPONDS TO, AND WHY THE LIST IS SO SHORT
//
// Two inputs. Age, and the doors the run is holding. Nothing else reaches it:
// not the ledger, not the dispositions, not whether the last card was a
// setback, not how near the want is.
//
// That is the whole design, not a first pass to be enriched later. This app has
// spent its entire development making sure nothing on screen evaluates the
// student. A figure that slumped after a bad turn would undo that in a single
// frame, and it would do it faster and more memorably than any sentence could,
// to exactly the child the app exists to protect. So the figure has no mood. A
// student who has just taken the worst card in the deck sees a figure one year
// older carrying precisely what it carried before.
//
// What it does instead is make the app's two real claims physical. The life is
// long: the figure visibly grows across the fifteen stages. Doors only ever
// add: the marks it carries accumulate and there is no code path that removes
// one.
//
// WHY IT HAS NO FACE
//
// No face, no hair, no clothing, no skin tone, no gender marker. One drawn
// person cannot stand in for a Singapore classroom, and a faceless one does not
// try. It also means there is no expression to read a verdict into.
//
// HOW THE AGEING WORKS, AND WHAT IT HONESTLY CANNOT DO
//
// The head stays close to the size it already is at thirteen and the body grows
// around it, so the head-to-height ratio falls out of the drawing rather than
// being animated separately. Roughly seven heads tall at thirteen, eight at the
// end.
//
// The growth is on a curve that finishes around eighteen, because that is when
// growing actually finishes. Build carries on broadening to about twenty five
// and then stops too. Which means the figure at twenty one and the figure at
// forty eight are nearly the same drawing, and no amount of cleverness changes
// that without lying about bodies or reaching for props: a briefcase at forty,
// a stoop at forty eight. Both would say something about a life, and saying
// things about the student's life is the one thing this component must not do.
//
// So the later stages are told apart by what the figure is standing on, not by
// what has happened to its body. That is the right division anyway. The years
// from thirteen to seventeen are when a Singapore student's subject levels can
// actually move, and those are exactly the years where the figure visibly
// changes. After that the growth is in the doors.

const YOUNG = 13;
const OLD = 48;

// Growing finishes; a curve that keeps climbing to forty eight would be a lie
// told in the one place a student reads before they read any words.
function eased(x) { const c = Math.max(0, Math.min(1, x)); return 1 - (1 - c) * (1 - c); }

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/**
 * Journey shows no numerals anywhere in its ledger UI, on purpose: a number is
 * the thing a parent reads across a desk as a score. The figure's accessible
 * label is part of that UI, so it spells the age out rather than smuggling a
 * digit back in through the one surface nobody was checking.
 */
export function wordAge(n) {
  const v = Math.round(Number(n) || 0);
  if (v < 20) return ONES[v] || String(v);
  const t = TENS[Math.floor(v / 10)];
  const o = v % 10;
  return o ? `${t} ${ONES[o]}` : t;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function r1(n) { return Math.round(n * 10) / 10; }

/**
 * Every proportion the drawing needs, derived from one age.
 * Exported so runFigureSweep() can check growth without parsing SVG.
 */
export function proportions(age) {
  const t = Math.max(0, Math.min(1, (age - YOUNG) / (OLD - YOUNG)));
  const gHeight = eased((age - YOUNG) / 5);   // height, done by eighteen
  const gBuild = eased((age - YOUNG) / 12);   // build, done by twenty five

  const height = lerp(132, 160, gHeight);
  const headR = lerp(9.2, 10, gHeight);       // barely moves, so the ratio does the work
  const legFrac = lerp(0.455, 0.49, gHeight); // legs lengthen faster than the trunk
  // Shoulder breadth is about a quarter of standing height in a real body.
  // Anything narrower and the drawing turns back into a stick.
  const shoulder = lerp(14, 18, gBuild);
  const hip = lerp(9.5, 12, gBuild);

  const base = 172;
  const top = base - height;
  const headY = top + headR;
  const neckY = headY + headR;
  const shoulderY = neckY + lerp(3.5, 4.5, gBuild);
  const hipY = base - height * legFrac;

  return {
    t,
    height: r1(height),
    headR: r1(headR),
    headY: r1(headY),
    neckY: r1(neckY),
    shoulderY: r1(shoulderY),
    hipY: r1(hipY),
    shoulder: r1(shoulder),
    hip: r1(hip),
    heads: r1(height / (headR * 2)),
    base,
    cx: 60,
  };
}

/**
 * Where the doors sit: a shallow arc under the feet, widening as they collect.
 *
 * The first version hung them off the figure's hand as a fan, which at ten
 * doors read as a scatter of specks rather than anything held. Putting them
 * underfoot fixes the legibility and says the better thing besides: what a run
 * accumulates is ground to stand on, and the ground only ever gets wider. It is
 * also symmetric, so it can never look like a blob however many there are.
 *
 * The layout is recomputed from n each time, so every mark shifts outward when
 * a new one lands. The arc stays centred, which is what makes the widening the
 * thing you notice rather than the sideways drift.
 */
function doorMarks(p, n) {
  if (!n) return [];
  const y0 = p.base + 12;
  const gap = 9.5;
  const half = (n - 1) / 2;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const off = i - half;
    const sag = half ? (off / half) ** 2 * 2.5 : 0;
    out.push({ x: r1(p.cx + off * gap), y: r1(y0 + sag) });
  }
  return out;
}

function joinNames(list) {
  if (!list.length) return '';
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

/**
 * figure({ age, doors, doorLabels })
 *
 * `doors`      array of door ids, in the order the run opened them
 * `doorLabels` id to human label, used only for the accessible description
 *
 * Returns an inline SVG string. Nothing here reads global state, so the dev
 * sweep can render any age against any door set without standing up a run.
 */
export function figure({ age, doors = [], doorLabels = {}, cls = '' } = {}) {
  const p = proportions(age);
  const marks = doorMarks(p, doors.length);

  const names = doors.map((d) => (doorLabels[d] || d)).filter(Boolean);
  const label = names.length
    ? `You at ${wordAge(age)}, standing on ${joinNames(names)}.`
    : `You at ${wordAge(age)}.`;

  // The newest mark is the only thing that animates, and only to say "this one
  // is new". Everything already gathered stays exactly as it was.
  const dots = marks.map((m, i) => {
    const isNew = i === marks.length - 1;
    return `<circle class="fig-door${isNew ? ' is-new' : ''}" cx="${m.x}" cy="${m.y}" r="3.4"/>`;
  }).join('');

  // Arms leave the shoulder and open outwards through a soft elbow. Drawn as
  // two straight verticals they closed the silhouette into a box and the whole
  // thing stopped reading as a person.
  const torso = p.hipY - p.shoulderY;
  const arm = (s) => {
    const sx = r1(p.cx + s * p.shoulder);
    const ex = r1(p.cx + s * (p.shoulder + 2.5));
    const hx = r1(p.cx + s * (p.shoulder + 4));
    return `M${sx} ${p.shoulderY}L${ex} ${r1(p.shoulderY + torso * 0.5)}L${hx} ${r1(p.hipY + 7)}`;
  };
  const leg = (s) => {
    const kx = r1(p.cx + s * p.hip * 0.7);
    const fx = r1(p.cx + s * p.hip);
    return `M${p.cx} ${p.hipY}L${kx} ${r1((p.hipY + p.base) / 2)}L${fx} ${p.base}`;
  };

  return `
    <svg class="figure${cls ? ` ${cls}` : ''}" viewBox="0 0 120 200" role="img"
         aria-label="${label.replace(/"/g, '&quot;')}" data-age="${age}">
      <g class="fig-body" fill="none" stroke="currentColor" stroke-width="5"
         stroke-linecap="round" stroke-linejoin="round">
        <circle cx="${p.cx}" cy="${p.headY}" r="${p.headR}" fill="currentColor" stroke="none"/>
        <path d="M${p.cx} ${p.neckY}V${p.hipY}"/>
        <path d="M${r1(p.cx - p.shoulder)} ${p.shoulderY}H${r1(p.cx + p.shoulder)}"/>
        <path d="${arm(-1)}"/>
        <path d="${arm(1)}"/>
        <path d="${leg(-1)}"/>
        <path d="${leg(1)}"/>
      </g>
      <g class="fig-doors" fill="currentColor" stroke="none">${dots}</g>
    </svg>`;
}

/**
 * Guards the three things about the figure that are contracts rather than art.
 *
 * The numeral check is the one that earns its keep. Journey keeps numbers off
 * every ledger surface because a number is what gets read across a desk as a
 * score, and the accessible label is the one surface where a digit could walk
 * back in without anybody seeing it on screen.
 */
export function runFigureSweep() {
  const failures = [];

  // Nobody shrinks, and nobody gets proportionally younger.
  let prevHeight = -Infinity;
  let prevHeads = -Infinity;
  for (let age = YOUNG; age <= OLD; age += 1) {
    const p = proportions(age);
    if (p.height < prevHeight) failures.push(`height fell at ${age}`);
    if (p.heads < prevHeads) failures.push(`head ratio fell at ${age}`);
    prevHeight = p.height;
    prevHeads = p.heads;
  }

  // Doors only ever add, drawn as well as stored.
  const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  let prevMarks = -1;
  for (let n = 0; n <= ids.length; n += 1) {
    // Anchored on the closing quote or the space before `is-new`, so the
    // wrapping `fig-doors` group is not counted as an eleventh door.
    const marks = (figure({ age: 30, doors: ids.slice(0, n) }).match(/class="fig-door[" ]/g) || []).length;
    if (marks !== n) failures.push(`${n} doors drew ${marks} marks`);
    if (marks < prevMarks) failures.push(`marks fell from ${prevMarks} to ${marks}`);
    prevMarks = marks;
  }

  // No digit in the label, at any age, ever.
  for (let age = YOUNG; age <= OLD; age += 1) {
    const svg = figure({ age, doors: ['d_eae'], doorLabels: { d_eae: 'Early Admissions' } });
    const label = (svg.match(/aria-label="([^"]*)"/) || [])[1] || '';
    if (/\d/.test(label)) failures.push(`numeral in the label at ${age}: "${label}"`);
  }

  const ok = !failures.length;
  console.log(
    `%cFigure sweep: ${ok ? 'PASS' : 'FAIL'} (${OLD - YOUNG + 1} ages, ${ids.length} door states)`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) console.table(failures.slice(0, 20));
  return { ok, failures };
}
