// The story card: one picture of a played life, drawn on a canvas, saved to
// the device, shared by the student or not shared at all.
//
// Drawn, not screenshotted, in the app's own tokens, so it belongs to the
// design in both themes. An MRT strip is the metaphor Singapore already
// reads: chapters as stations, forks as interchanges, doors as the lines you
// can board from here. NO SCORE APPEARS ANYWHERE: no points, no counts, no
// ledger bars, because a card that can be read as a ranking will be. Ages
// appear only as station markers; everyone reaches Results day at about the
// same age, so an age cannot rank anyone. The reflection written at 38 is
// deliberately absent; that line is private and stays on the device it was
// typed on.

const W = 1080;
const H = 1350;
const M = 84;

const css = (v, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fallback;

export function drawLifeCard(run, data) {
  const doorsCatalog = (data.journey && data.journey.doorsCatalog) || {};
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');

  const paper = css('--paper', '#FBF8F3');
  const surface = css('--surface', '#FFFFFF');
  const ink = css('--ink', '#14181F');
  const inkSoft = css('--ink-soft', '#39414D');
  const inkMute = css('--ink-mute', '#5A6370');
  const accent = css('--accent', '#C25E3A');
  const accentDk = css('--accent-dk', '#A44A2A');
  const openInk = css('--open-ink', '#276A4C');
  const rule = css('--rule', '#E3DCD0');

  g.fillStyle = paper;
  g.fillRect(0, 0, W, H);
  g.fillStyle = accent;
  g.fillRect(0, 0, W, 12);

  // Header
  let y = M + 34;
  g.fillStyle = inkMute;
  g.font = '700 24px system-ui, sans-serif';
  g.fillText('MY STORY, PLAYED FORWARD', M, y);

  y += 64;
  g.fillStyle = ink;
  g.font = '600 52px Georgia, serif';
  const wantLine = run.want ? run.want.label : 'Not sure yet, honestly';
  y = wrap(g, `“${wantLine}”`, M, y, W - M * 2, 62);

  y += 44;
  g.fillStyle = inkSoft;
  g.font = '400 28px system-ui, sans-serif';
  const ns = run.ns === true ? ', NS included' : '';
  g.fillText(`The ${run.pathLabel || 'own'} way${ns}`, M, y);

  // The strip: chapters as stations down the left. The pitch is capped, so a
  // short run reads as a compact strip instead of four dots adrift on a
  // full length line, and the line ends where the story did.
  const stations = pickStations(run);
  const topY = y + 70;
  const botY = H - 340;
  const pitch = stations.length > 1
    ? Math.min(96, (botY - topY) / (stations.length - 1)) : 0;
  const lineEnd = topY + pitch * Math.max(0, stations.length - 1);
  const x = M + 26;
  g.strokeStyle = accent;
  g.lineWidth = 8;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x, topY);
  g.lineTo(x, lineEnd);
  g.stroke();

  stations.forEach((s, i) => {
    const sy = topY + pitch * i;
    const isFork = s.format === 'fork';
    g.beginPath();
    g.arc(x, sy, isFork ? 15 : 10, 0, Math.PI * 2);
    g.fillStyle = isFork ? accent : surface;
    g.fill();
    g.lineWidth = isFork ? 0 : 5;
    if (!isFork) { g.strokeStyle = accent; g.stroke(); }

    g.fillStyle = ink;
    g.font = `${isFork ? 600 : 400} 30px ${isFork ? 'Georgia, serif' : 'system-ui, sans-serif'}`;
    g.fillText(s.title, x + 44, sy + 10);
    const tw = g.measureText(s.title).width;
    g.fillStyle = inkMute;
    g.font = '400 24px system-ui, sans-serif';
    g.fillText(String(s.age), x + 44 + tw + 18, sy + 10);
  });

  // Who you became, following the strip's actual end rather than a fixed slot.
  let by = lineEnd + 84;
  g.fillStyle = inkMute;
  g.font = '700 24px system-ui, sans-serif';
  g.fillText('WHO I BECAME', M, by);
  by += 48;
  g.fillStyle = accentDk;
  g.font = '600 40px Georgia, serif';
  g.fillText(idWords(run), M, by);

  // Doors as boardable lines
  by += 56;
  g.fillStyle = inkMute;
  g.font = '700 24px system-ui, sans-serif';
  g.fillText('DOORS I HOLD', M, by);
  by += 44;
  let dx = M;
  g.font = '600 26px system-ui, sans-serif';
  (run.doors || []).forEach((d) => {
    const label = (doorsCatalog[d] || {}).label || d;
    const w2 = g.measureText(label).width + 44;
    if (dx + w2 > W - M) { dx = M; by += 56; }
    g.fillStyle = withAlpha(openInk, 0.13);
    roundRect(g, dx, by - 32, w2, 46, 23);
    g.fill();
    g.fillStyle = openInk;
    g.fillText(label, dx + 22, by);
    dx += w2 + 14;
  });

  // Footer
  g.strokeStyle = rule;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(M, H - 108);
  g.lineTo(W - M, H - 108);
  g.stroke();
  g.fillStyle = inkMute;
  g.font = '400 24px system-ui, sans-serif';
  g.fillText('Played on Paths. Same start as thousands, same ending as no one.', M, H - 62);
  g.strokeStyle = accent;
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(W - M - 88, H - 56);
  g.bezierCurveTo(W - M - 66, H - 56, W - M - 66, H - 86, W - M - 44, H - 86);
  g.bezierCurveTo(W - M - 22, H - 86, W - M - 22, H - 56, W - M, H - 56);
  g.stroke();

  const a = document.createElement('a');
  a.href = cv.toDataURL('image/png');
  a.download = 'my-paths-story.png';
  a.click();
}

/**
 * At most eleven stations: every fork always, the first and last always, and
 * the turns thinned evenly in between. A strip that scrolls is a strip nobody
 * posts.
 */
function pickStations(run) {
  const steps = (run.steps || []).filter((s) => s.format !== 'ask-ns');
  const MAX = 11;
  if (steps.length <= MAX) return steps;
  const keep = new Set([0, steps.length - 1]);
  steps.forEach((s, i) => { if (s.format === 'fork') keep.add(i); });
  const want = MAX - keep.size;
  const pool = steps.map((_, i) => i).filter((i) => !keep.has(i));
  for (let k = 0; k < want; k += 1) {
    keep.add(pool[Math.round((pool.length - 1) * (k / Math.max(1, want - 1)))]);
  }
  return steps.filter((_, i) => keep.has(i));
}

const DISP_WORD = { curiosity: 'curious', persistence: 'persistent', flexibility: 'flexible', optimism: 'hopeful', risk: 'bold' };
function idWords(r) {
  const top = Object.entries(r.disp || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 2);
  return top.length ? top.map(([k]) => DISP_WORD[k]).join(' and ') : 'still working it out';
}

function withAlpha(color, a) {
  // Token colours are hex; a wash is built here rather than read, so the
  // card never depends on a rgba var surviving getComputedStyle.
  const m = color.match(/^#([0-9a-f]{6})$/i);
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function wrap(g, text, x, y, maxW, lh) {
  const words = String(text).split(' ');
  let line = '';
  words.forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; }
    else line = test;
  });
  if (line) g.fillText(line, x, y);
  return y;
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
