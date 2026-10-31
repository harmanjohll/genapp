// Instant feedback. Pure: diffs two reach sets and produces what the UI says.
//
// Design note on what is deliberately NOT here.
//
// An earlier design encoded distance as position on a track, so every tap slid
// eight dots. It was killed for two reasons. First, a continuous position is a
// ranking with better resolution than the four labelled states it replaced, and
// this app must not rank pathways. Second, and worse, distance could rise when
// a student added a subject, so a student on a low plan would watch doors
// retreat as they told the truth about themselves.
//
// The engine now guarantees monotonicity, so the second failure is impossible.
// The first is avoided by not encoding distance anywhere in the UI at all. What
// moves is the count of open doors and one sentence naming what changed.

const S = (n) => (n === 1 ? '' : 's');

export function pulse(prev, next, evt, copy) {
  const byId = (l) => Object.fromEntries(l.map((r) => [r.id, r]));
  const a = byId(prev);

  const openNow = next.filter((r) => r.state === 'open').length;
  const openWas = prev.filter((r) => r.state === 'open').length;

  const moved = next
    .filter((r) => a[r.id] && a[r.id].distance !== r.distance)
    .map((r) => ({
      id: r.id,
      name: r.railName,
      from: a[r.id].distance,
      to: r.distance,
      dir: r.distance < a[r.id].distance ? 'nearer' : 'further',
      jump: Math.abs(a[r.id].distance - r.distance),
    }));

  const justOpened = next.filter((r) => r.state === 'open' && a[r.id] && a[r.id].state !== 'open');

  return {
    openNow,
    openDelta: openNow - openWas,
    moved,
    justOpened,
    line: line({ openNow, moved, justOpened, evt, copy, total: next.length }),
  };
}

function fill(tpl, vars) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
}

function line({ openNow, moved, justOpened, evt, copy, total }) {
  const p = (copy && copy.pulse) || {};

  if (openNow === total && p.allOpen) return p.allOpen;

  if (justOpened.length) {
    return fill(p.opened, { dest: justOpened[0].railName });
  }
  if (evt && evt.action === 'clear') {
    const near = moved.length ? moved[0].name : '';
    return fill(p.removed, { subject: evt.subjectName, dest: near || 'Everything' });
  }
  const nearer = moved.filter((m) => m.dir === 'nearer').sort((x, y) => y.jump - x.jump);
  if (nearer.length) {
    return fill(p.nearer, { dest: nearer[0].name });
  }
  if (evt && evt.first) {
    return fill(p.firstPick, { subject: evt.subjectName, level: evt.level, open: openNow });
  }
  if (evt) {
    return fill(p.noChange, { subject: evt.subjectName, level: evt.level });
  }
  return '';
}

/** The at rest line: the single move that would shift the most. */
export function leverLine(lev, copy) {
  if (!lev) return '';
  const p = (copy && copy.pulse) || {};
  const n = lev.opens.length;
  return fill(n === 1 ? p.leverOne : p.lever, { move: lev.short, n: `${n} of these` });
}

export { S };
