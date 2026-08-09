// The career half, checked.
//
// WHY THIS FILE EXISTS AT ALL. An app called Education and Career Guidance had
// eight wants, four route shapes each, and nothing whatsoever about work. A
// student who asked what jobs there are got a list of qualifications back. So
// there are sectors now, and the moment you write sectors down you have built
// something that can quietly become a league table, a closed door, or a promise
// nobody can keep. These are the rules that stop it.
//
// THE LOAD BEARING CLAIM. Every sector must show a real way in at three or more
// levels of qualification. Not because it is a nice thing to say, but because it
// is TRUE of the Singapore labour market and it is the single most useful fact a
// fourteen year old can have: healthcare hires Higher Nitec holders, diploma
// holders and degree holders, and people move between those three for forty
// years. A sector that could only offer one door would be evidence for the thing
// this app exists to argue against, so a sector like that fails the sweep rather
// than shipping with an apology attached.
//
// PAY IS STATED ONCE. Per level of entry, never per sector. Sector by sector
// figures would be dozens of numbers this build cannot defend from here, and
// ranking sectors by pay is a prestige ladder wearing a dollar sign. What goes
// per sector instead is what is actually actionable: the route in, and the
// certification that moves somebody once they are inside.

const LETTERS = ['R', 'I', 'A', 'S', 'E', 'C'];
const LEVELS = ['ite', 'poly', 'arts', 'uni'];
const FAMILIES = ['academic', 'applied', 'hands', 'arts'];

const CAPS = {
  label: 7, isWhat: 22, licence: 20, moving: 30, myth: 30,
};
const ITEM_CAPS = { dayLooks: 8, thisTerm: 13 };
const ENTRY_CAPS = { role: 6, route: 12, note: 17 };

const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

// Language that closes a door, ranks a person, or promises an outcome. The deck
// has had all three at various points and each one took a hand edit to find.
const FORBIDDEN = [
  [/\bcannot\b|\bcan't\b|\bnot possible\b|\bno way (in|into)\b/i, 'closes a door'],
  [/\bbetter than\b|\bbest\b|\btop tier\b|\bprestigious\b|\bhigher status\b|\belite\b/i, 'ranks'],
  [/\bguarantee(s|d)?\b|\balways leads\b|\bwill earn\b|\bsecure(s|d) a job\b/i, 'promises an outcome'],
  [/\bdead end\b|\bstuck (at|in)\b|\bno future\b|\blast resort\b/i, 'writes a route off'],
  [/\bonly (route|way|door|path)\b/i, 'claims a single way in'],
];

/**
 * The sweep. Returns { ok, failures } like every other sweep in this app.
 *
 * ctx carries the other files it cross checks against, because a sector that
 * names a subject nobody teaches, or a want that leads to no sector, is a
 * broken link rather than a bad sentence, and only the join can see it.
 */
export function workSweep(data) {
  const failures = [];
  const work = data.work || {};
  const sectors = work.sectors || [];
  const pay = work.levelPay || [];

  if (!sectors.length) return report([{ why: 'no sectors: the career half is empty' }], 0, 0);

  const subjectIds = new Set(((data.subjects && data.subjects.subjects) || []).map((s) => s.id));
  const futures = (data.futures && data.futures.futures) || [];

  // 1. Pay bands: one per level of entry, every one provisional and sourced.
  //    A confident looking figure with no source behind it is the most dangerous
  //    thing this file could ship, because a parent will quote it.
  const seenPay = new Set();
  pay.forEach((p) => {
    if (seenPay.has(p.id)) failures.push({ pay: p.id, why: 'two bands for the same level' });
    seenPay.add(p.id);
    if (!p.band) failures.push({ pay: p.id, why: 'no band' });
    if (p.status !== 'provisional') {
      failures.push({ pay: p.id, why: 'a wage figure marked anything but provisional, from a build that cannot reach the survey' });
    }
    if (!p.sourceRef) failures.push({ pay: p.id, why: 'a figure with no source to check it against' });
  });
  if (pay.length < 3) failures.push({ why: `only ${pay.length} pay bands: the ladder needs at least three rungs to be a ladder` });

  // 2. Every sector, in detail.
  const ids = new Set();
  const lettersCovered = new Set();
  const familiesCovered = new Set();
  sectors.forEach((s) => {
    if (ids.has(s.id)) failures.push({ sector: s.id, why: 'duplicate id' });
    ids.add(s.id);

    Object.entries(CAPS).forEach(([k, cap]) => {
      if (!s[k]) failures.push({ sector: s.id, why: `no ${k}` });
      else if (words(s[k]) > cap) failures.push({ sector: s.id, why: `${k} runs ${words(s[k])} words over ${cap}` });
    });
    Object.entries(ITEM_CAPS).forEach(([k, cap]) => {
      (s[k] || []).forEach((t) => {
        if (words(t) > cap) failures.push({ sector: s.id, why: `${k} "${t}" runs ${words(t)} over ${cap}` });
      });
    });
    if ((s.dayLooks || []).length < 2) failures.push({ sector: s.id, why: 'fewer than two concrete things the day contains' });
    if ((s.thisTerm || []).length < 2) failures.push({ sector: s.id, why: 'fewer than two things a student could do this term' });

    // THE LOAD BEARING CHECK. Three or more real doors in.
    const levels = new Set((s.entries || []).map((e) => e.level));
    if (levels.size < 3) {
      failures.push({ sector: s.id, why: `only ${levels.size} level${levels.size === 1 ? '' : 's'} of entry, which argues the opposite of this app` });
    }
    (s.entries || []).forEach((e) => {
      if (!LEVELS.includes(e.level)) failures.push({ sector: s.id, why: `unknown level of entry ${e.level}` });
      Object.entries(ENTRY_CAPS).forEach(([k, cap]) => {
        if (!e[k]) failures.push({ sector: s.id, why: `an entry with no ${k}` });
        else if (words(e[k]) > cap) failures.push({ sector: s.id, why: `entry ${k} "${e[k]}" runs ${words(e[k])} over ${cap}` });
      });
    });

    (s.riasec || []).forEach((l) => {
      if (!LETTERS.includes(l)) failures.push({ sector: s.id, why: `not a Holland letter: ${l}` });
      lettersCovered.add(l);
    });
    if (!(s.riasec || []).length) failures.push({ sector: s.id, why: 'no Holland letters, so no want can reach it' });

    (s.families || []).forEach((f) => {
      if (!FAMILIES.includes(f)) failures.push({ sector: s.id, why: `unknown family ${f}` });
      familiesCovered.add(f);
    });
    if (!(s.families || []).length) failures.push({ sector: s.id, why: 'no families, so no road in the game reaches it' });

    (s.subjects || []).forEach((id) => {
      if (!subjectIds.has(id)) failures.push({ sector: s.id, why: `names a subject nobody teaches: ${id}` });
    });
    if (!(s.subjects || []).length) failures.push({ sector: s.id, why: 'no subjects, so the plan cannot point here' });

    // 3. The forbidden registers, across every string the app ASSERTS.
    //
    //    `myth` is exempt, and had to be, because its entire job is to say the
    //    wrong thing out loud before denying it. The first run of this sweep
    //    flagged "that a degree is the only door" as claiming a single way in,
    //    which is precisely backwards: the card exists to contradict that.
    //    Exempting it needs its own guard or a ranking could ride in on the
    //    exemption, so the two rules below make the frame do the work.
    const asserted = [s.label, s.isWhat, s.licence, s.moving,
      ...(s.dayLooks || []), ...(s.thisTerm || []),
      ...(s.entries || []).flatMap((e) => [e.role, e.route, e.note])].join(' ');
    FORBIDDEN.forEach(([re, what]) => {
      const m = asserted.match(re);
      if (m) failures.push({ sector: s.id, why: `${what}: "${m[0]}"` });
    });
    // A myth has to be REPORTED, not asserted, so it opens as reported speech.
    if (s.myth && !/^That\b/.test(s.myth)) {
      failures.push({ sector: s.id, why: 'a myth stated as fact rather than reported as a belief' });
    }
    // And it has to carry the correction, or the app has just repeated a rumour
    // to a fourteen year old and left it standing.
    if (s.myth && !/[.!?]\s+\S/.test(s.myth)) {
      failures.push({ sector: s.id, why: 'a myth with no correction after it, which is just the rumour again' });
    }
    // Promises are forbidden even inside a myth: a belief the app repeats must
    // not be one it accidentally endorses.
    const promise = String(s.myth || '').match(FORBIDDEN[2][0]);
    if (promise) failures.push({ sector: s.id, why: `a myth that promises an outcome: "${promise[0]}"` });
    const all = `${asserted} ${s.myth || ''}`;
    // The house punctuation rule. A hyphen inside a name is fine; a dash used as
    // punctuation is not, anywhere a student reads.
    const dash = all.match(/\s[-–—]|[-–—]\s|[–—]/);
    if (dash) failures.push({ sector: s.id, why: `a dash used as punctuation: "${dash[0]}"` });
  });

  // 4. No orphaned wants. Every Holland letter a student can name in AIM or in
  //    the game has to reach somewhere, or the link renders an empty screen.
  LETTERS.forEach((l) => {
    if (!lettersCovered.has(l)) failures.push({ why: `nothing in the world of work answers to ${l}` });
  });
  FAMILIES.forEach((f) => {
    if (!familiesCovered.has(f)) failures.push({ why: `no sector is reachable from the ${f} road` });
  });
  futures.forEach((f) => {
    if (!f.riasec) return;
    const n = sectors.filter((s) => (s.riasec || []).includes(f.riasec)).length;
    if (n < 2) failures.push({ future: f.id, why: `only ${n} sector answers this want, so the screen reads as a dead end` });
  });

  // 4b. NO TIMETABLE LEADS NOWHERE.
  //
  // The subject sheet answers why am I learning this by naming the sectors a
  // subject turns up in, and the first run of that screen showed the fault this
  // rule now prevents: four of eight subjects on a real timetable named no work
  // at all, and they were the G1 syllabus versions plus Higher Mother Tongue. A
  // G3 student saw six sectors under Geography and a G1 student saw none, from
  // the same page, about the same subject. That is the exact inequity this app
  // exists to argue against, produced by nothing more than the order I happened
  // to write the sector list in. So every subject anybody can take has to be
  // named by at least one sector, and it is checked rather than remembered.
  //     The floor is two rather than one, for the same reason a want has to reach
  //     two: one sector under a subject reads as the only thing it is good for,
  //     and no school subject is only good for one thing.
  const reach = new Map();
  sectors.forEach((s) => (s.subjects || []).forEach((id) => reach.set(id, (reach.get(id) || 0) + 1)));
  [...subjectIds].sort().forEach((id) => {
    const n = reach.get(id) || 0;
    if (n < 2) failures.push({ why: `${id} reaches ${n} sector${n === 1 ? '' : 's'}, which reads as a dead end` });
  });

  // 5. Ordering. Alphabetical by label, checked, because the ONE thing that
  //    turns this file into a prestige ladder is somebody reordering it and
  //    nobody noticing. An arbitrary order has to be enforced to stay arbitrary.
  const labels = sectors.map((s) => s.label);
  const sorted = [...labels].sort((a, b) => a.localeCompare(b));
  labels.forEach((l, i) => {
    if (l !== sorted[i]) {
      failures.push({ sector: sectors[i].id, why: 'sectors are out of alphabetical order, and any other order reads as a ranking' });
    }
  });

  // 6. Provenance. The file has to say where it came from and when.
  const meta = work._meta || {};
  ['source', 'url', 'accessed'].forEach((k) => {
    if (!meta[k]) failures.push({ why: `_meta has no ${k}` });
  });

  return report(failures, sectors.length, (sectors.reduce((n, s) => n + (s.entries || []).length, 0)));
}

function report(failures, nSectors, nEntries) {
  const ok = failures.length === 0;
  console.log(
    `%cWork sweep: ${ok ? 'PASS' : 'FAIL'} (${nSectors} sectors, ${nEntries} ways in, pay stated once)`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) console.table(failures);
  return { ok, failures };
}
