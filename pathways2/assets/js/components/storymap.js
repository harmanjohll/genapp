// The story map: one played life drawn as a transit map.
//
// WHY A MAP AND NOT A LIST. The previous card drew a vertical line of dots,
// which is a list wearing a metaphor. A transit map earns the metaphor only if
// it shows the network: the roads you did not take, running alongside, and the
// station where they rejoin the one you did. That is the whole argument of this
// app in one picture, and Singapore already reads this diagram fluently.
//
// WHAT IS DRAWN. The school years as a spine. Results day as an interchange.
// The road taken in full ink, the roads refused as pale parallel lines with
// their names set along them. Where the families reconnect, every pale line
// curves back into the spine and the station is named for it. Then the years
// after, to wherever the story stopped. Each station carries the year, and
// beneath it, in smaller ink, the thing that actually happened there.
//
// WHAT IS NOT DRAWN. No score, no total, no bar, no ranking, nothing that
// sorts this life against another. Ages appear only as station years; everyone
// reaches Results day at about the same age, so a year cannot rank anyone. The
// reflection written at 38 is included only if the student ticks the box, and
// the box starts unticked, because that line is theirs.
//
// The same function draws the card on screen at the ending and the PNG that
// gets saved, so what a student shares is exactly what they were shown.

const W = 1080;
const M = 84;
const SPINE = 430;          // the played line
const LANE = 74;            // gap between pale lanes, running left of the spine
const LABEL_X = SPINE + 46;
const LABEL_W = W - M - LABEL_X;
const MAX_STATIONS = 14;
const SPLAY = 54;           // vertical run of the curve off the spine
const NEST = 15;            // each pale road leaves a little lower than the last
const LANE_LABEL = 176;     // straight run a lane needs to carry its own name

const F = {
  caps: '700 24px system-ui, sans-serif',
  want: '600 52px Georgia, serif',
  sub: '400 28px system-ui, sans-serif',
  station: '600 31px Georgia, serif',
  stationPlain: '400 30px system-ui, sans-serif',
  year: '400 24px system-ui, sans-serif',
  beat: '400 23px system-ui, sans-serif',
  lane: '600 21px system-ui, sans-serif',
  chip: '600 25px system-ui, sans-serif',
  became: '600 40px Georgia, serif',
  foot: '400 24px system-ui, sans-serif',
};

const css = (v, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fallback;

function palette() {
  return {
    paper: css('--paper', '#FBF8F3'),
    surface: css('--surface', '#FFFFFF'),
    ink: css('--ink', '#14181F'),
    inkSoft: css('--ink-soft', '#39414D'),
    inkMute: css('--ink-mute', '#5A6370'),
    accent: css('--accent', '#C25E3A'),
    accentDk: css('--accent-dk', '#A44A2A'),
    open: css('--open-ink', '#276A4C'),
    rule: css('--rule', '#E3DCD0'),
  };
}

// --------------------------------------------------------------------------
// Reading the run

/** Stages every family lives, so the map knows where the roads rejoin. */
function sharedStageIds(journey) {
  const seqs = (journey.paths || []).map((p) => p.sequence || []);
  if (!seqs.length) return new Set();
  return new Set(seqs[0].filter((id) => seqs.every((s) => s.includes(id))));
}

/** The roads this run refused at Results day, by the name the fork gave them. */
function refusedRoads(journey, run) {
  const fork = (journey.stages || []).find((s) => s.id === 's_results');
  if (!fork) return [];
  const takenLabel = run.pathLabel;
  return (fork.choices || [])
    .map((c) => (c.sets && c.sets.label) || c.label)
    .filter((label) => label && label !== takenLabel)
    .slice(0, 4);
}

/**
 * One line per station: what happened there, in the student's own terms.
 * The chance that landed wins over the choice made, because the chance is the
 * part they did not control and the part they remember.
 */
function beatFor(step) {
  if (step.chance && step.chance.title) return step.chance.title;
  if (step.format === 'reflect') return 'A year with nothing to decide';
  if (step.choices && step.choices.length) return step.choices.join(', ');
  return '';
}

/** At most fourteen stations: forks and the ends always, the rest thinned. */
function pickSteps(run) {
  const steps = (run.steps || []).filter((s) => s.format !== 'ask-ns');
  if (steps.length <= MAX_STATIONS) return steps;
  const keep = new Set([0, steps.length - 1]);
  steps.forEach((s, i) => { if (s.format === 'fork') keep.add(i); });
  const want = MAX_STATIONS - keep.size;
  const pool = steps.map((_, i) => i).filter((i) => !keep.has(i));
  for (let k = 0; k < want; k += 1) {
    keep.add(pool[Math.round((pool.length - 1) * (k / Math.max(1, want - 1)))]);
  }
  return steps.filter((_, i) => keep.has(i));
}

const DISP_WORD = {
  curiosity: 'curious', persistence: 'persistent', flexibility: 'flexible',
  optimism: 'hopeful', risk: 'bold',
};
function becameWords(run) {
  const top = Object.entries(run.disp || {}).filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]).slice(0, 2);
  return top.length ? top.map(([k]) => DISP_WORD[k]).join(' and ') : 'still working it out';
}

// --------------------------------------------------------------------------
// Layout: measured first, drawn second, so nothing collides and nothing floats.

function measurer() {
  const c = document.createElement('canvas');
  return c.getContext('2d');
}

function wrapLines(g, text, font, maxW, max) {
  g.font = font;
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const out = [];
  let line = '';
  words.forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > maxW && line) { out.push(line); line = w; }
    else line = test;
  });
  if (line) out.push(line);
  if (max && out.length > max) {
    const cut = out.slice(0, max);
    cut[max - 1] = `${cut[max - 1].replace(/[,.]$/, '')}…`;
    return cut;
  }
  return out;
}

function layout(run, data, opts) {
  const g = measurer();
  const journey = data.journey || {};
  const shared = sharedStageIds(journey);
  const family = (journey.paths || []).find((p) => p.id === run.path);
  const famOnly = new Set(((family && family.sequence) || []).filter((id) => !shared.has(id)));

  const steps = pickSteps(run);
  const forkAt = steps.findIndex((s) => s.stageId === 's_results');
  let lastFam = -1;
  steps.forEach((s, i) => { if (famOnly.has(s.stageId)) lastFam = i; });
  // The roads rejoin at the first station after the last family-only chapter.
  const rejoinAt = (forkAt >= 0 && lastFam >= 0 && lastFam + 1 < steps.length) ? lastFam + 1 : -1;

  const stations = steps.map((s, i) => {
    const isFork = s.format === 'fork';
    const title = s.title || '';
    const beat = beatFor(s);
    const titleLines = wrapLines(g, title, isFork ? F.station : F.stationPlain, LABEL_W - 70, 2);
    const beatLines = beat ? wrapLines(g, beat, F.beat, LABEL_W, 2) : [];
    const opened = (s.opened || []).map((d) => {
      const cat = (journey.doorsCatalog || {})[d] || {};
      return cat.label || d;
    });
    const h = 26 + titleLines.length * 38 + beatLines.length * 29 + opened.length * 34;
    return {
      step: s, i, isFork, isRejoin: i === rejoinAt,
      titleLines, beatLines, opened, age: s.age,
      h: Math.max(72, h),
    };
  });

  // Header: measured against the same baselines the draw pass uses, so the
  // spacing is designed rather than guessed.
  const headerTop = M + 30;
  const wantText = `“${run.want ? run.want.label : 'Not sure yet, honestly'}”`;
  const wantLines = wrapLines(g, wantText, F.want, W - M * 2, 3);
  const wantY0 = headerTop + 48;
  const nsPart = run.ns === true ? ', National Service included' : '';
  const subLine = `The ${run.pathLabel || 'own'} road${nsPart}`;
  const subY = wantY0 + (wantLines.length - 1) * 62 + 52;
  const endHead = (run.ending && run.ending.head) ? run.ending.head : '';
  const endHeadY = endHead ? subY + 40 : subY;

  const lanes = refusedRoads(journey, run).length;

  // A pale road needs room to carry its name. If the family chapters are too
  // few to give it that, those chapters get the extra air; they are the most
  // distinctive part of the run and can afford to breathe.
  if (forkAt >= 0 && rejoinAt > forkAt && lanes) {
    const needed = LANE_LABEL + 2 * (26 + SPLAY + (lanes - 1) * NEST);
    const span = rejoinAt - forkAt;
    const have = stations.slice(forkAt + 1, rejoinAt + 1).reduce((n, s) => n + s.h, 0);
    if (have < needed) {
      const each = Math.ceil((needed - have) / span);
      for (let i = forkAt + 1; i <= rejoinAt; i += 1) stations[i].h += each;
    }
  }

  const mapTop = endHeadY + 56;
  let sy = mapTop;
  stations.forEach((st) => { st.y = sy + st.h / 2; sy += st.h; });
  let mapBottom = sy + 34;                       // room for the terminus bar

  // A run that stopped early has no rejoin station, so the refused roads run on
  // past the terminus. They are given the room to do it, and to be named: a
  // short run should look like a story that stopped, not a world that ended.
  let laneEnd = 0;
  if (forkAt >= 0 && rejoinAt < 0 && lanes) {
    laneEnd = stations[forkAt].y + 26 + (lanes - 1) * NEST + SPLAY + LANE_LABEL;
    mapBottom = Math.max(mapBottom, laneEnd + 40);
  }

  // Blocks below the map.
  const blocks = [];
  const doors = (run.doors || []).map((d) => {
    const cat = (journey.doorsCatalog || {})[d] || {};
    return cat.label || d;
  });
  if (doors.length) blocks.push({ kind: 'chips', caps: 'DOORS I CAN BOARD FROM HERE', items: doors });
  blocks.push({ kind: 'big', caps: 'WHO I BECAME', text: becameWords(run) });

  const refused = (run.steps || []).map((s) => s.missed).filter(Boolean);
  if (refused.length) {
    blocks.push({ kind: 'lines', caps: 'WHAT I PUT DOWN TO PICK THIS UP', items: refused.slice(-3) });
  }
  const raises = (run.raises || []).map((r) => `${r.name}, ${r.from} to ${r.to}, at ${r.age}`);
  if (raises.length) blocks.push({ kind: 'lines', caps: 'WHAT I RAISED ALONG THE WAY', items: raises.slice(0, 3) });
  const moves = ((run.movesMade || []).map((mm) => {
    const m = ((data.moves && data.moves.moves) || []).find((x) => x.id === mm.id);
    return m ? `${m.label}, at ${mm.age}` : null;
  }).filter(Boolean));
  if (moves.length) blocks.push({ kind: 'lines', caps: 'WHAT I COMMITTED TO', items: moves.slice(0, 3) });
  if (opts && opts.includeReflection && run.reflection) {
    blocks.push({ kind: 'quote', caps: 'WHAT I WROTE AT 38', text: run.reflection });
  }

  let by = mapBottom + (lanes && forkAt >= 0 ? 96 : 60);
  blocks.forEach((b) => {
    b.y = by;
    by += 34;
    if (b.kind === 'chips') {
      // chips flow, measured properly so the block knows its own height
      g.font = F.chip;
      let x = M; let rows = 1;
      b.layout = b.items.map((label) => {
        const w = g.measureText(label).width + 46;
        if (x + w > W - M) { x = M; rows += 1; }
        const pos = { label, x, row: rows - 1, w };
        x += w + 14;
        return pos;
      });
      by += rows * 58;
    } else if (b.kind === 'big') {
      by += 52;
    } else if (b.kind === 'lines') {
      b.wrapped = b.items.map((t) => wrapLines(g, t, F.beat, W - M * 2, 2));
      by += b.wrapped.reduce((n, w) => n + w.length * 31, 0) + 8;
    } else if (b.kind === 'quote') {
      b.wrapped = wrapLines(g, `“${b.text}”`, F.sub, W - M * 2, 3);
      by += b.wrapped.length * 38 + 8;
    }
    by += 26;
  });

  const footTop = by + 30;
  const H = Math.max(1350, Math.round(footTop + 120));

  return {
    H, wantLines, subLine, subY, headerTop, endHead, endHeadY,
    stations, mapTop, mapBottom, laneEnd, forkAt, rejoinAt,
    refusedRoads: refusedRoads(journey, run),
    blocks, footTop: H - 108,
  };
}

// --------------------------------------------------------------------------
// Drawing

/** Draw the map for `run` onto a fresh canvas and return it. */
export function drawStoryMap(run, data, opts = {}) {
  const L = layout(run, data, opts);
  const P = palette();
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = L.H;
  const g = cv.getContext('2d');

  g.fillStyle = P.paper;
  g.fillRect(0, 0, W, L.H);
  g.fillStyle = P.accent;
  g.fillRect(0, 0, W, 12);

  // --- header -------------------------------------------------------------
  let y = L.headerTop;
  g.fillStyle = P.inkMute;
  g.font = F.caps;
  g.fillText('MY STORY, PLAYED FORWARD', M, y);
  y += 48;
  g.fillStyle = P.ink;
  g.font = F.want;
  L.wantLines.forEach((line) => { g.fillText(line, M, y); y += 62; });
  g.fillStyle = P.inkSoft;
  g.font = F.sub;
  g.fillText(L.subLine, M, L.subY);
  if (L.endHead) {
    g.fillStyle = P.accentDk;
    g.font = '600 30px Georgia, serif';
    g.fillText(L.endHead, M, L.endHeadY);
  }

  // --- the pale roads, drawn first so the played line sits over them -------
  const first = L.stations[0];
  const last = L.stations[L.stations.length - 1];
  const forkSt = L.forkAt >= 0 ? L.stations[L.forkAt] : null;
  const rejoinSt = L.rejoinAt >= 0 ? L.stations[L.rejoinAt] : null;

  if (forkSt && L.refusedRoads.length) {
    const endY = rejoinSt ? rejoinSt.y : (L.laneEnd || L.mapBottom - 44);
    // Each refused road leaves the interchange a little lower than the one
    // inside it, so the four of them nest instead of stacking into a box.
    // The outermost road leaves first and comes back last, so the lane with the
    // longest walk to make is the one with the most room to carry its name.
    const deep = L.refusedRoads.length - 1;
    const geo = L.refusedRoads.map((label, k) => {
      const outY = forkSt.y + 26 + (deep - k) * NEST;
      const inY = endY - 26 - (deep - k) * NEST;
      return {
        label,
        lx: SPINE - LANE * (k + 1),
        outY,
        topY: outY + SPLAY,
        botY: rejoinSt ? inY - SPLAY : endY,
        inY,
      };
    }).filter((l) => l.botY > l.topY + 24);

    g.save();
    g.lineWidth = 5;
    g.strokeStyle = P.rule;
    g.lineCap = 'butt';
    geo.forEach((l) => {
      g.setLineDash([11, 9]);
      g.beginPath();
      g.moveTo(SPINE, l.outY);
      g.bezierCurveTo(SPINE - LANE * 0.55, l.outY, l.lx, l.outY + SPLAY * 0.45, l.lx, l.topY);
      g.lineTo(l.lx, l.botY);
      if (rejoinSt) {
        g.bezierCurveTo(l.lx, l.inY - SPLAY * 0.45, SPINE - LANE * 0.55, l.inY, SPINE, l.inY);
      }
      g.stroke();
      if (!rejoinSt) {                    // a road left hanging, drawn hollow
        g.setLineDash([]);
        g.beginPath();
        g.arc(l.lx, l.botY, 7, 0, Math.PI * 2);
        g.fillStyle = P.paper; g.fill();
        g.strokeStyle = P.rule; g.lineWidth = 4; g.stroke();
        g.lineWidth = 5;
      }
    });
    // Names set along their own line, with the paper knocked out behind them,
    // which is how a transit map labels a route without needing a key.
    g.setLineDash([]);
    geo.forEach((l) => {
      const room = l.botY - l.topY - 18;
      g.font = F.lane;
      let name = l.label;
      while (g.measureText(name).width > room && name.length > 5) name = name.slice(0, -2);
      if (name !== l.label) name = `${name.trim().replace(/,$/, '')}…`;
      const wLab = g.measureText(name).width;
      g.save();
      g.translate(l.lx, (l.topY + l.botY) / 2);
      g.rotate(-Math.PI / 2);
      g.fillStyle = P.paper;
      g.fillRect(-wLab / 2 - 10, -15, wLab + 20, 30);
      g.fillStyle = P.inkMute;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(name, 0, 1);
      g.restore();
    });
    g.restore();
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
  }

  // --- the played line ----------------------------------------------------
  g.strokeStyle = P.accent;
  g.lineWidth = 9;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(SPINE, first.y);
  g.lineTo(SPINE, last.y);
  g.stroke();

  // terminus bar, so the line reads as ended rather than cropped
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(SPINE - 22, last.y + 26);
  g.lineTo(SPINE + 22, last.y + 26);
  g.stroke();

  // --- stations -----------------------------------------------------------
  L.stations.forEach((st) => {
    const big = st.isFork || st.isRejoin;
    g.beginPath();
    g.arc(SPINE, st.y, big ? 17 : 11, 0, Math.PI * 2);
    if (big) {
      g.fillStyle = P.paper; g.fill();
      g.strokeStyle = P.accent; g.lineWidth = 8; g.stroke();
      g.beginPath();
      g.arc(SPINE, st.y, 6, 0, Math.PI * 2);
      g.fillStyle = P.accent; g.fill();
    } else {
      g.fillStyle = P.paper; g.fill();
      g.strokeStyle = P.accent; g.lineWidth = 5; g.stroke();
    }

    let ty = st.y - ((st.titleLines.length - 1) * 38 + st.beatLines.length * 29) / 2 + 11;
    g.fillStyle = P.ink;
    g.font = st.isFork || st.isRejoin ? F.station : F.stationPlain;
    st.titleLines.forEach((line, k) => {
      g.fillText(line, LABEL_X, ty);
      if (k === 0) {
        const w = g.measureText(line).width;
        g.save();
        g.fillStyle = P.inkMute;
        g.font = F.year;
        g.fillText(String(st.age), LABEL_X + w + 16, ty);
        g.restore();
      }
      ty += 38;
    });
    if (st.beatLines.length) {
      g.fillStyle = P.inkMute;
      g.font = F.beat;
      st.beatLines.forEach((line) => { g.fillText(line, LABEL_X, ty); ty += 29; });
    }
    // A door opened here: a short green spur off the station, and the line's
    // name beside it. A door is a route you can board, so it is drawn as one.
    if (st.opened.length) {
      g.strokeStyle = P.open;
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(SPINE - 12, st.y);
      g.lineTo(SPINE - 34, st.y);
      g.stroke();
      g.beginPath();
      g.arc(SPINE - 40, st.y, 6, 0, Math.PI * 2);
      g.fillStyle = P.open; g.fill();
      g.font = '600 23px system-ui, sans-serif';
      st.opened.forEach((label) => {
        g.fillStyle = P.open;
        g.fillText(`${label}, open`, LABEL_X, ty);
        ty += 34;
      });
    }
  });

  // the one caption the map needs: what the pale lines mean
  if (forkSt && L.refusedRoads.length) {
    g.fillStyle = P.inkMute;
    g.font = '400 21px system-ui, sans-serif';
    const cap = rejoinSt
      ? `The pale roads are the ones I did not take. They meet mine again at ${(rejoinSt.step.title || '').toLowerCase()}.`
      : 'The pale roads are the ones I did not take. This run stopped before they came back.';
    wrapLines(g, cap, '400 21px system-ui, sans-serif', W - M * 2, 2)
      .forEach((line, k) => g.fillText(line, M, L.mapBottom + 22 + k * 28));
  }

  // --- blocks -------------------------------------------------------------
  L.blocks.forEach((b) => {
    let by = b.y;
    g.fillStyle = P.inkMute;
    g.font = F.caps;
    g.fillText(b.caps, M, by);
    by += 40;
    if (b.kind === 'chips') {
      g.font = F.chip;
      b.layout.forEach((c) => {
        const cy = by + c.row * 58;
        g.fillStyle = withAlpha(P.open, 0.13);
        roundRect(g, c.x, cy - 32, c.w, 46, 23);
        g.fill();
        g.fillStyle = P.open;
        g.fillText(c.label, c.x + 23, cy);
      });
    } else if (b.kind === 'big') {
      g.fillStyle = P.accentDk;
      g.font = F.became;
      g.fillText(b.text, M, by + 8);
    } else if (b.kind === 'lines') {
      g.fillStyle = P.inkSoft;
      g.font = F.beat;
      b.wrapped.forEach((lines) => { lines.forEach((line) => { g.fillText(line, M, by); by += 31; }); });
    } else if (b.kind === 'quote') {
      g.fillStyle = P.inkSoft;
      g.font = F.sub;
      b.wrapped.forEach((line) => { g.fillText(line, M, by); by += 38; });
    }
  });

  // --- footer -------------------------------------------------------------
  g.strokeStyle = P.rule;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(M, L.footTop);
  g.lineTo(W - M, L.footTop);
  g.stroke();
  g.fillStyle = P.inkMute;
  g.font = F.foot;
  g.fillText('Played on Paths. Same start as thousands, same ending as no one.', M, L.footTop + 46);
  g.strokeStyle = P.accent;
  g.lineWidth = 5;
  const fx = W - M;
  const fy = L.footTop + 52;
  g.beginPath();
  g.moveTo(fx - 88, fy);
  g.bezierCurveTo(fx - 66, fy, fx - 66, fy - 30, fx - 44, fy - 30);
  g.bezierCurveTo(fx - 22, fy - 30, fx - 22, fy, fx, fy);
  g.stroke();

  return cv;
}

/** Save the map as a PNG on this device. Nothing is uploaded. */
export function saveStoryCard(run, data, opts = {}) {
  const cv = drawStoryMap(run, data, opts);
  const a = document.createElement('a');
  a.href = cv.toDataURL('image/png');
  a.download = 'my-paths-story.png';
  a.click();
}

// --------------------------------------------------------------------------

function withAlpha(color, a) {
  // Tokens are hex; the wash is built here so the card never depends on an
  // rgba custom property surviving getComputedStyle.
  const m = String(color).match(/^#([0-9a-f]{6})$/i);
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
