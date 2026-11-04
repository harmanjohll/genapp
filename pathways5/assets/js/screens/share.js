// Share: the plan as a card, for the conversation it is meant to start.
//
// The student picks who it is for (a parent, a teacher, a counsellor). The
// card carries the year, the levels, the goal, the best move and the
// questions that person should ask. It goes out as an image or a link. The
// link opens a read only view on the other device, voiced for that person;
// nothing is saved there unless they choose to. No account, no server.

import { getState, replaceYearPlan, setGoal, YEARS } from '../state.js?v=5.0.0';
import { decodePacket } from '../engine/packet.js?v=5.0.0';
import { reach } from '../engine/reach.js?v=5.0.0';
import { evalPlan, effective, PLAN_YEARS } from '../engine/years.js?v=5.0.0';
import { advise } from '../engine/advice.js?v=5.0.0';
import { goalMoves } from '../engine/goal.js?v=5.0.0';
import { sayMove } from '../ui/talk.js?v=5.0.0';
import { esc, onAction } from '../ui/dom.js?v=5.0.0';
import { icon } from '../ui/icons.js?v=5.0.0';
import { stateWord, openWord } from '../ui/labels.js?v=5.0.0';
import { goalLine } from './path.js?v=5.0.0';

const LABEL = Object.fromEntries(YEARS.map((y) => [y.id, y.label]));
const FOR = { parent: 'A parent', teacher: 'A teacher', counsellor: 'My ECG counsellor' };

// ---- the packet: what a link carries (engine/packet.js) -------------------

export { decodePacket } from '../engine/packet.js?v=5.0.0';
import { encodePacket } from '../engine/packet.js?v=5.0.0';
export function packFor(st, y) { return { y, plan: st.plans[y] || {}, goal: st.goal || null }; }
function linkFor(packet, who) {
  const url = new URL(location.origin + location.pathname);
  url.searchParams.set('s', 'shared');
  url.searchParams.set('d', encodePacket(packet));
  url.searchParams.set('for', who);
  return url.toString();
}

// ---- what a plan says, for any reader --------------------------------------

/** Everything the card and the shared view need, from a year and a plan. */
export function readPlan(api, y, plan, goal) {
  const c = api.ctx();
  const ep = evalPlan(y, plan, c.subjects);
  const rows = c.destinations.map((d) => reach(ep, d, { ...c, plan: ep, yearId: y }));
  const gm = goal ? goalMoves(goal, y, plan, c) : [];
  const a = advise({ yearId: y, plan, ctx: c });
  const top = gm[0] || a.singles[0] || a.pairs[0] || null;
  const byId = new Map(c.subjects.map((s) => [s.id, s]));
  const levels = Object.entries(plan).map(([id, lv]) => ({ name: (byId.get(id) || {}).shortName || (byId.get(id) || {}).name || id, lv }));
  return { y, rows, top, levels, open: rows.filter((r) => r.state === 'open').length, word: openWord(rows), goal };
}

/** The questions for whoever is reading. */
export function questionsFor(api, who, pl) {
  const talk = ((((api.data.years || {}).years || {})[pl.y] || {}).talk || {});
  const role = who === 'counsellor' ? 'teacher' : who;
  const out = [];
  if (pl.top) out.push(sayMove(pl.top, role === 'parent' ? 'parent' : 'teacher'));
  (talk[role] || []).slice(0, 2).forEach((q) => out.push(q));
  return out;
}

function cardHtml(api, pl, who) {
  return `
  <article class="plancard">
    <p class="pc-k">${icon('brand')} Paths · for ${esc(FOR[who] || 'you')}</p>
    <p class="pc-year">${esc(LABEL[pl.y])} <span>${pl.open} of 8 ${esc(pl.word)}</span></p>
    ${pl.goal ? `<p class="pc-goal">${icon('target')} ${esc(goalLine(api, pl.goal))}</p>` : ''}
    <p class="pc-levels">${pl.levels.map((l) => `<span class="pl-chip" data-level="${l.lv}">${esc(l.name)} <b>${l.lv}</b></span>`).join('')}</p>
    ${pl.top ? `<div class="pc-move"><p class="pc-mk">Best move</p><p class="pc-mr">${esc(pl.top.result)}</p><p class="small">${esc(pl.top.cond.charAt(0).toUpperCase() + pl.top.cond.slice(1))}.</p></div>` : ''}
    <div class="pc-q"><p class="pc-mk">Questions to ask</p>${questionsFor(api, who, pl).map((q) => `<p class="bubble">${esc(q)}</p>`).join('')}</div>
  </article>`;
}

// ---- the image -------------------------------------------------------------

function wrap(ctx, text, x, y, maxW, lh) {
  const words = String(text).split(/\s+/); let line = ''; let yy = y;
  words.forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = test;
  });
  if (line) { ctx.fillText(line, x, yy); yy += lh; }
  return yy;
}

async function cardImage(api, pl, who) {
  await document.fonts.ready;
  const W = 1080; const H = 1350;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  x.fillStyle = '#0B1A3F'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#FFC21A'; x.beginPath(); x.roundRect(80, 80, 72, 72, 20); x.fill();
  // The brand mark: the same path as the 32 unit SVG, scaled by 2.25 at (80, 80).
  x.strokeStyle = '#0B1A3F'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(95.75, 131.75);
  x.bezierCurveTo(107, 131.75, 104.75, 100.25, 116, 100.25); x.bezierCurveTo(127.25, 100.25, 125, 131.75, 136.25, 131.75); x.stroke();
  x.fillStyle = '#EEF2FB'; x.font = '800 54px "Bricolage Grotesque", sans-serif'; x.fillText('Paths', 176, 134);
  x.fillStyle = '#A9B6D6'; x.font = '700 26px "JetBrains Mono", monospace'; x.fillText(`FOR ${String(FOR[who] || 'you').toUpperCase()}`, 80, 220);
  x.fillStyle = '#EEF2FB'; x.font = '800 96px "Bricolage Grotesque", sans-serif'; x.fillText(LABEL[pl.y], 80, 320);
  x.fillStyle = '#FFC21A'; x.font = '700 40px "Bricolage Grotesque", sans-serif'; x.fillText(`${pl.open} of 8 ${pl.word}`, 80, 380);
  let y = 450;
  if (pl.goal) { x.fillStyle = '#EEF2FB'; x.font = '700 36px "Bricolage Grotesque", sans-serif'; y = wrap(x, `Aiming for: ${goalLine(api, pl.goal)}`, 80, y, 920, 46) + 14; }
  // Levels as chips.
  x.font = '700 30px "Bricolage Grotesque", sans-serif';
  let cx = 80; const chipH = 54;
  pl.levels.forEach((l) => {
    const label = `${l.name}  ${l.lv}`; const w = x.measureText(label).width + 40;
    if (cx + w > W - 80) { cx = 80; y += chipH + 14; }
    x.fillStyle = '#13265A'; x.beginPath(); x.roundRect(cx, y, w, chipH, 14); x.fill();
    x.fillStyle = '#EEF2FB'; x.fillText(label, cx + 20, y + 37); cx += w + 12;
  });
  y += chipH + 50;
  if (pl.top) {
    x.fillStyle = '#A9B6D6'; x.font = '700 24px "JetBrains Mono", monospace'; x.fillText('BEST MOVE', 80, y); y += 46;
    x.fillStyle = '#EEF2FB'; x.font = '800 40px "Bricolage Grotesque", sans-serif'; y = wrap(x, pl.top.result, 80, y, 920, 50);
    x.fillStyle = '#A9B6D6'; x.font = '500 30px "Bricolage Grotesque", sans-serif'; y = wrap(x, `${pl.top.cond.charAt(0).toUpperCase()}${pl.top.cond.slice(1)}.`, 80, y + 4, 920, 40) + 24;
  }
  x.fillStyle = '#A9B6D6'; x.font = '700 24px "JetBrains Mono", monospace'; x.fillText('QUESTIONS TO ASK', 80, y); y += 46;
  x.fillStyle = '#EEF2FB'; x.font = '500 32px "Bricolage Grotesque", sans-serif';
  questionsFor(api, who, pl).slice(0, 2).forEach((q) => { if (y < H - 160) y = wrap(x, q, 80, y, 920, 42) + 14; });
  x.fillStyle = '#FFC21A'; x.font = '700 26px "JetBrains Mono", monospace'; x.fillText('harmanjohll.github.io/genapp/pathways5', 80, H - 80);
  return new Promise((res) => cv.toBlob(res, 'image/png'));
}

// ---- screens ---------------------------------------------------------------

export const share = {
  id: 'share',
  title: 'Share',
  era: 'school',
  render(root, api) {
    const st = getState();
    const q = api.route().q;
    const who = FOR[q.for] ? q.for : 'parent';
    const e = effective(st.plans, api.ctx().subjects);
    const y = q.y && PLAN_YEARS.includes(q.y) ? q.y : (st.yearSet && st.year !== 'p6' && Object.keys(st.plans[st.year] || {}).length ? st.year : e.yearId);
    if (!y) {
      root.innerHTML = `<div class="wrap-narrow sharewrap"><p class="ph-k">Share</p><h1>Share your plan</h1><p class="lede">Set your levels first. Then share them with a parent, a teacher or your counsellor.</p>
        <p><button type="button" class="btn press" data-action="go" data-s="path">Set your levels ${icon('arrow')}</button></p></div>`;
      return;
    }
    const pl = readPlan(api, y, st.plans[y] || {}, st.goal);
    root.innerHTML = `
    <div class="wrap-narrow sharewrap">
      <p class="ph-k">Share</p>
      <h1>Who is it for?</h1>
      <div class="segtabs compact" role="tablist" aria-label="Who it is for">${Object.entries(FOR).map(([k, v]) => `<button type="button" role="tab" class="segtab press" data-action="go" data-s="share" data-for="${k}" data-y="${y}" aria-selected="${k === who}">${esc(v.replace('My ', ''))}</button>`).join('')}</div>
      ${cardHtml(api, pl, who)}
      <p class="btnrow">
        <button type="button" class="btn press" data-action="sh-image">${icon('copy')} Share image</button>
        <button type="button" class="btn ghost press" data-action="sh-link">Copy link</button>
        ${who === 'counsellor' ? `<button type="button" class="btn ghost press" data-action="go" data-s="session" data-y="${y}">Start a 15 minute session</button>` : ''}
      </p>
      <p class="small" id="sh-note" role="status"></p>
      <p class="small">The link opens a read only copy on their device. Nothing is saved there unless they choose.</p>
      <p class="small"><button type="button" class="linkbtn" data-action="go" data-s="myplan">Saved moves (${st.actions.length})</button></p>
    </div>`;
    const note = root.querySelector('#sh-note');
    onAction(root, {
      'sh-link': async () => {
        const url = linkFor(packFor(getState(), y), who);
        try {
          if (navigator.share) { await navigator.share({ title: 'My Paths plan', url }); return; }
          await navigator.clipboard.writeText(url); note.textContent = 'Link copied.';
        } catch { note.textContent = url; }
      },
      'sh-image': async () => {
        const blob = await cardImage(api, pl, who);
        const file = new File([blob], `paths-${y}.png`, { type: 'image/png' });
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'My Paths plan' }); return; }
        } catch { /* fall through to a download */ }
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        note.textContent = 'Image saved.';
      },
    });
  },
};

export const shared = {
  id: 'shared',
  title: 'A shared plan',
  era: 'school',
  render(root, api) {
    const q = api.route().q;
    const pk = decodePacket(q.d || '');
    if (!pk) {
      root.innerHTML = `<div class="wrap-narrow sharewrap"><h1>This link did not open</h1><p class="lede">Ask for the link again, or open your own path.</p><p><button type="button" class="btn press" data-action="go" data-s="path">Open my path</button></p></div>`;
      return;
    }
    const who = FOR[q.for] ? q.for : 'parent';
    const pl = readPlan(api, pk.y, pk.plan, pk.goal);
    root.innerHTML = `
    <div class="wrap-narrow sharewrap">
      <p class="callout small">${icon('talk')} A plan someone shared with you. It is not saved on this device unless you choose.</p>
      <p class="ph-k">Reading as</p>
      <div class="segtabs compact" role="tablist" aria-label="Reading as">${Object.entries(FOR).map(([k, v]) => `<button type="button" role="tab" class="segtab press" data-action="sd-for" data-for="${k}" aria-selected="${k === who}">${esc(v.replace('My ', ''))}</button>`).join('')}</div>
      ${cardHtml(api, pl, who)}
      <h2 class="advh">All 8 places</h2>
      <ul class="pafter">${pl.rows.map((r) => `<li><div class="pa-row" data-goal="${!!(pk.goal && r.id === pk.goal.dest)}"><span class="pa-name">${esc(r.railName)}</span><span class="pill" data-tone="${esc(r.state)}">${esc(stateWord(r.state, r.lens))}</span></div></li>`).join('')}</ul>
      <p class="btnrow">
        ${who === 'counsellor' ? `<button type="button" class="btn press" data-action="go" data-s="session" data-d="${esc(q.d)}">Start a 15 minute session</button>` : ''}
        <button type="button" class="btn ghost press" data-action="sd-save">Save this plan to this device</button>
      </p>
      <p class="small" id="sd-note" role="status"></p>
    </div>`;
    onAction(root, {
      'sd-for': (btn) => { api.setQuery({ for: btn.dataset.for }); api.refresh(); },
      'sd-save': () => {
        replaceYearPlan(pk.y, pk.plan);
        if (pk.goal) setGoal(pk.goal);
        root.querySelector('#sd-note').textContent = `Saved as your ${LABEL[pk.y]} plan.`;
      },
    });
  },
};
