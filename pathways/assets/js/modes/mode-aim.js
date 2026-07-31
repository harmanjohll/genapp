// Mode AIM. Start from what you want and work backwards.
//
// Futures are wants, never job titles. Naming a job invites a fourteen year old
// to rule it in or out on prestige and on who they picture doing it, which is
// the circumscription Gottfredson describes. Naming a want does not.
//
// Every future carries three or more structurally different roads, in no order,
// with no ranking. The absence of the ranking is the content.

import { esc, onAction } from '../components/dom.js';
import { decorate, bindGlossary } from '../components/glossary.js';
import { openSheet, onSheetAction } from '../components/sheet.js';
import { getState, setAim, toggleAction, currentYear } from '../state.js';

export function renderAim(host, data, ctx, repaint) {
  const st = getState();
  const future = data.futures.futures.find((f) => f.id === st.aim);

  host.innerHTML = `<div class="wrap">${future ? detail(future, st, data) : chooser(data)}</div>`;

  bindGlossary(host);
  onAction(host, {
    pick: (btn) => { setAim(btn.dataset.id); repaint(); window.scrollTo({ top: 0 }); },
    back: () => { setAim(null); repaint(); },
    action: (btn) => { toggleAction(btn.dataset.text); repaint(); },
    road: (btn) => openRoad(future, Number(btn.dataset.i), btn),
    card: () => makeCard(st, future, data),
    print: () => window.print(),
  });
}

function chooser(data) {
  return `
    <div class="section" style="margin-top:var(--s-6)">
      <p class="caps">Aim</p>
      <h1 class="serif" style="font-size:var(--t-hero);line-height:var(--lh-hero)">Start from what you want.</h1>
      <p class="lede" style="margin-top:var(--s-3)">Not a job title.</p>
      <div class="grid two" style="margin-top:var(--s-5)">
        ${data.futures.futures.map((f) => `
          <button class="future-btn" type="button" data-action="pick" data-id="${f.id}">
            <span class="want">${esc(f.want)}</span>
          </button>`).join('')}
      </div>
    </div>`;
}

function detail(f, st, data) {
  const year = currentYear();
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

      <h2 class="h-sm" style="margin-top:var(--s-5)">${f.routes.length} roads there, in no order</h2>
      <ul class="grid two" style="list-style:none;padding:0;margin-top:var(--s-3)">${roads}</ul>

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
