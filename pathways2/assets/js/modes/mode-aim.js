// Mode AIM. Start from what you want and work backwards.
//
// Futures are wants, never job titles. Naming a job invites a fourteen year old
// to rule it in or out on prestige and on who they picture doing it, which is
// the circumscription Gottfredson describes. Naming a want does not.
//
// Every future carries three or more structurally different roads, in no order,
// with no ranking. The absence of the ranking is the content.

import { esc, onAction } from '../components/dom.js?v=2.7.0';
import { icon } from '../components/icons.js?v=2.7.0';
import { decorate, bindGlossary } from '../components/glossary.js?v=2.7.0';
import { openSheet, onSheetAction } from '../components/sheet.js?v=2.7.0';
import { getState, setAim, toggleAction, currentYear, setMode } from '../state.js?v=2.7.0';
import { reach } from '../engine/reach.js?v=2.7.0';
import { wantWorkBlock, openSectorSheet } from './mode-work.js?v=2.7.0';

// AIM was the only mode that knew nothing about the other two. It offered
// roads and a static list of things to do this term, while NOW held the
// student's actual combination and JOURNEY held stories they had already
// played toward the very same want. The three modes share ids: five of the
// seven futures here carry the same id as a Journey want, so a story played
// about making things is a story about this future. Wiring that up is what
// turns three screens into one instrument, and it is the CASVE execution
// step done honestly: decide, then act, with the evidence in front of you.

/** Same one line template helper the other modes use. */
function fill(tpl, vars) {
  return String(tpl).replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
}

/** A finished run that aimed at this future, most recent first. */
function storyFor(st, futureId) {
  // A run that never named a want is an 'unsure' story, and it links too.
  return [...(st.runs || [])].reverse().find((r) => (r.want ? r.want.id : 'unsure') === futureId) || null;
}

const DISP_WORD = { curiosity: 'curious', persistence: 'persistent', flexibility: 'flexible', optimism: 'hopeful', risk: 'bold' };
function idWords(r) {
  const top = Object.entries(r.disp || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 2);
  return top.length ? top.map(([k]) => DISP_WORD[k]).join(' and ') : 'still finding out';
}

/** What the plan in NOW currently reaches, using the same engine NOW uses. */
function reachNow(st, data, ctx) {
  if (!ctx || !data.pathways) return null;
  const list = data.pathways.destinations.map((d) => reach(st.plan, d, { ...ctx, plan: st.plan }));
  return { open: list.filter((r) => r.state === 'open').length, total: list.length };
}

export function renderAim(host, data, ctx, repaint) {
  const st = getState();
  const future = data.futures.futures.find((f) => f.id === st.aim);

  host.innerHTML = `<div class="wrap">${future ? detail(future, st, data, ctx) : chooser(data, st)}</div>`;

  bindGlossary(host);
  onAction(host, {
    pick: (btn) => { setAim(btn.dataset.id); repaint(); window.scrollTo({ top: 0 }); },
    tonow: () => setMode('now'),
    tojourney: () => setMode('journey'),
    back: () => { setAim(null); repaint(); },
    action: (btn) => { toggleAction(btn.dataset.text); repaint(); },
    road: (btn) => openRoad(future, Number(btn.dataset.i), btn),
    sector: (btn) => openSectorSheet(data, btn.dataset.id, btn),
    card: () => makeCard(st, future, data),
    print: () => window.print(),
  });
}

function chooser(data, st) {
  const ac = data.copy.aim || {};
  const jc = data.copy.journey;
  return `
    <div class="section" style="margin-top:var(--s-6)">
      <p class="caps">Aim</p>
      <h1 class="serif" style="font-size:var(--t-hero);line-height:var(--lh-hero)">Start from what I want.</h1>
      <p class="caps rail-q" style="margin-top:var(--s-4)">${icon('q_where')}${esc(jc.q2)}</p>
      <p class="lede" style="margin-top:var(--s-2);max-width:44ch">${esc(ac.chooserLede)}</p>
      <div class="grid two" style="margin-top:var(--s-5)">
        ${data.futures.futures.map((f) => {
          const played = storyFor(st, f.id);
          return `
          <button class="future-btn" type="button" data-action="pick" data-id="${f.id}">
            <span class="want">${esc(f.want)}</span>
            ${f.kind ? `<span class="kind-chip">${esc(f.kind)}</span>` : ''}
            ${played ? `<span class="kind-chip">${esc(ac.playedChip)}</span>` : ''}
          </button>`;
        }).join('')}
      </div>
      <p class="small" style="margin-top:var(--s-5)">
        <a href="./?mode=work">${esc(ac.workBrowse || 'Or look at the work first')}</a>
        <span class="mute"> ${esc(ac.workBrowseSub || '')}</span>
      </p>
    </div>`;
}

function detail(f, st, data, ctx) {
  const year = currentYear();
  const ac = data.copy.aim || {};
  const jc = data.copy.journey;
  const played = storyFor(st, f.id);
  const rn = reachNow(st, data, ctx);
  const planN = Object.keys(st.plan || {}).length;

  // The story already played toward this want. Evidence beats exhortation:
  // a student who reached 48 holding six doors has proof in their own hand.
  const playedBlock = played ? `
    <div class="aim-linked">
      <p class="caps">${icon('q_who')}${esc(ac.playedHead)}</p>
      <p class="small">${esc(fill(ac.playedBody, {
        age: played.startAge, endAge: played.endAge || 48,
        n: (played.doors || []).length, words: idWords(played),
      }))}</p>
      <button class="btn ghost small" type="button" data-action="tojourney" style="margin-top:var(--s-2)">${esc(ac.playedOpen)}</button>
    </div>` : '';

  // What the combination in NOW currently reaches. AIM asked students to work
  // backwards while ignoring where they actually stand.
  const reachBlock = `
    <div class="aim-linked">
      <p class="caps">${icon('q_how')}${esc(ac.reachHead)}</p>
      <p class="small">${planN && rn ? esc(fill(ac.reachBody, { n: rn.open })) : esc(ac.reachNone)}</p>
      <button class="btn ghost small" type="button" data-action="tonow" style="margin-top:var(--s-2)">${esc(ac.reachGo)}</button>
    </div>`;

  // The same moves the game plays with. A this-term list that ignored them
  // was inventing a second, weaker vocabulary for the same idea.
  const moves = ((data.moves && data.moves.moves) || []).filter((m) => year.age >= m.ages[0] && year.age <= m.ages[1]);
  // What you committed to last time you were here. AIM was decide and forget:
  // a student ticked two things, closed the tab, and nothing ever asked again.
  // The CASVE cycle does not end at deciding, and neither should the mode.
  // Only commitments that are NOT already on this screen. Without this filter a
  // student ticks a move and immediately sees the same sentence twice: once
  // under "you said you would" with a Done button, and once in the list they
  // just ticked it in, with a tick. Worse, the heading claims it is from the
  // last time they were here, ten seconds after they made it.
  const onScreen = new Set([
    ...moves.slice(0, 5).map((m) => m.label),
    ...(f.thisTerm || []),
  ]);
  const said = (st.actions || []).filter(Boolean).filter((a) => !onScreen.has(a));
  const saidBlock = said.length ? `
    <div class="aim-linked">
      <p class="caps">${icon('q_how')}${esc(ac.saidHead)}</p>
      <p class="small mute">${esc(ac.saidBody)}</p>
      <ul style="list-style:none;padding:0;margin-top:var(--s-2)">
        ${said.map((a) => `<li class="aim-move">
          <button class="btn ghost small" type="button" data-action="action" data-text="${esc(a)}"
                  aria-label="Done: ${esc(a)}">${esc(ac.saidDone)}</button>
          <span>${esc(a)}</span>
        </li>`).join('')}
      </ul>
    </div>` : '';

  const movesBlock = moves.length ? `
    <div class="thisterm" style="margin-top:var(--s-5)">
      <p class="caps">${esc(ac.movesHead)}</p>
      <p class="micro mute">${esc(ac.movesBody)}</p>
      <ul style="list-style:none;padding:0;margin-top:var(--s-3)">
        ${moves.slice(0, 5).map((m) => {
          const on = st.actions.includes(m.label);
          return `<li class="aim-move">
            <button class="btn ${on ? 'accent' : 'ghost'} small" type="button" data-action="action"
                    data-text="${esc(m.label)}" aria-pressed="${on}">${on ? '\u2713' : '+'}</button>
            <span>${icon(m.ic)} ${esc(m.label)}</span>
            ${m.kind === 'commit' ? `<span class="mv-tag">${esc(jc.commitTag)}</span>` : ''}
          </li>`;
        }).join('')}
      </ul>
    </div>` : '';
  const roads = f.routes.map((r, i) => `
    <li>
      <button class="future-btn" type="button" data-action="road" data-i="${i}" aria-haspopup="dialog">
        <span class="want" style="font-size:0.98rem">${esc(r.label)}</span>
        <span class="steps" style="margin-top:var(--s-2)">
          ${r.steps.map((s, j) => `${j ? '<span class="arrow" aria-hidden="true">→</span>' : ''}<span class="step">${esc(s)}</span>`).join('')}
        </span>
      </button>
    </li>`).join('');

  const actions = f.thisTerm.map((t) => {
    const on = st.actions.includes(t);
    return `<li>
      <button class="btn ${on ? 'accent' : 'ghost'} small" type="button" data-action="action"
              data-text="${esc(t)}" aria-pressed="${on}">${on ? '✓' : '+'}</button>
      <span style="margin-left:var(--s-2)">${esc(t)}</span>
    </li>`;
  }).join('');

  return `
    <div class="section" style="margin-top:var(--s-6)">
      <button class="btn ghost small" type="button" data-action="back">← All of them</button>
      <h1 class="serif" style="font-size:var(--t-h1);margin-top:var(--s-4)">${esc(f.want)}</h1>
      <p class="small mute">${esc(f.looksLike)}</p>

      ${saidBlock}
      ${playedBlock}
      ${reachBlock}
      ${wantWorkBlock(data, f)}

      <p class="caps rail-q" style="margin-top:var(--s-5)">${icon('q_how')}${esc(jc.q3)}</p>
      <h2 class="h-sm">${f.routes.length} roads there, in no order</h2>
      <ul class="grid two" style="list-style:none;padding:0;margin-top:var(--s-3)">${roads}</ul>
      ${movesBlock}

      <div class="thisterm" style="margin-top:var(--s-6)">
        <p class="caps">${esc(year.label)}, this term</p>
        <ol style="list-style:decimal">${actions}</ol>
        <div class="btn-row" style="margin-top:var(--s-4)">
          <button class="btn small" type="button" data-action="card">Save a card</button>
          <button class="btn ghost small" type="button" data-action="print">Print</button>
        </div>
      </div>
    </div>`;
}

function openRoad(f, i, trigger) {
  const r = f.routes[i];
  if (!r) return;
  openSheet(`
    <h2 id="sheet-title">${esc(r.label)}</h2>
    <div class="steps">${r.steps.map((s, j) => `${j ? '<span class="arrow" aria-hidden="true">→</span>' : ''}<span class="step">${esc(s)}</span>`).join('')}</div>
    <p>${decorate(r.note)}</p>
    ${r.years ? `<p class="micro faint">About ${r.years} year${r.years === 1 ? '' : 's'} to the first qualification.</p>` : ''}
    <p class="micro mute">None of these roads is better than the others. They suit different people.</p>`, trigger);
  onSheetAction({});
}

/**
 * Draws the card directly on a canvas rather than screenshotting the DOM.
 *
 * This replaced html2canvas, which was 198 KB, roughly 62 percent of the entire
 * app payload, loaded to photograph one small card. Deterministic, about two
 * kilobytes, no third party code, and the output is designed rather than
 * captured.
 */
function makeCard(st, future, data) {
  if (!st.actions.length) { alert('Add at least one thing first.'); return; }

  const W = 820; const H = 1060; const M = 64;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#000';

  g.fillStyle = css('--surface') || '#fff';
  g.fillRect(0, 0, W, H);
  g.fillStyle = css('--accent');
  g.fillRect(0, 0, W, 10);

  let y = M + 30;
  g.fillStyle = css('--ink-mute');
  g.font = '600 20px system-ui, sans-serif';
  g.fillText('THIS TERM', M, y);

  y += 56;
  g.fillStyle = css('--ink');
  g.font = '600 40px Georgia, serif';
  y = wrap(g, future ? future.want : 'My next steps', M, y, W - M * 2, 48);

  y += 30;
  g.font = '400 25px system-ui, sans-serif';
  st.actions.slice(0, 6).forEach((a, i) => {
    g.fillStyle = css('--accent');
    g.beginPath(); g.arc(M + 9, y - 9, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = css('--ink-soft');
    y = wrap(g, a, M + 34, y, W - M * 2 - 34, 34) + 26;
    if (i < st.actions.length - 1) {
      g.strokeStyle = css('--rule-soft'); g.beginPath();
      g.moveTo(M, y - 14); g.lineTo(W - M, y - 14); g.stroke();
    }
  });

  // The plan, as level chips, so the card carries what it was built from.
  const plan = Object.entries(st.plan);
  if (plan.length) {
    y += 24;
    g.fillStyle = css('--ink-mute');
    g.font = '600 18px system-ui, sans-serif';
    g.fillText('MY SUBJECTS', M, y);
    y += 34;
    let x = M;
    const byId = new Map(data.subjects.subjects.map((s) => [s.id, s]));
    plan.forEach(([id, lv]) => {
      const s = byId.get(id);
      const label = `${s ? (s.shortName || s.name) : id} ${lv}`;
      g.font = '600 19px system-ui, sans-serif';
      const w = g.measureText(label).width + 26;
      if (x + w > W - M) { x = M; y += 44; }
      g.fillStyle = css(`--${lv.toLowerCase()}-wash`) || '#eee';
      roundRect(g, x, y - 24, w, 34, 17); g.fill();
      g.fillStyle = css(`--${lv.toLowerCase()}`) || '#333';
      g.fillText(label, x + 13, y);
      x += w + 10;
    });
    y += 40;
  }

  g.fillStyle = css('--ink-faint');
  g.font = '400 17px system-ui, sans-serif';
  wrap(g, 'A thinking tool, not official advice. Talk to your ECG counsellor.', M, H - M, W - M * 2, 24);

  const a = document.createElement('a');
  a.href = cv.toDataURL('image/png');
  a.download = 'this-term.png';
  a.click();
}

function wrap(g, text, x, y, maxW, lh) {
  const words = String(text).split(' ');
  let line = '';
  words.forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; }
    else line = test;
  });
  if (line) { g.fillText(line, x, y); }
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
