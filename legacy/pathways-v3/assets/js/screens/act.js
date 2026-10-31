// Act: leave with three real moves this term.
//
// The v2 audit found Aim was a five-panel stack that knew nothing about the
// other two modes. v3's Act keeps exactly four things: the want, the three
// moves that serve it, one question to take to a real adult, and the carry
// link. A want is never a verdict and "not sure yet" is a full answer.
//
// The hot path preserves focus: ticking a move patches the tapped button,
// the commitments card and the closing line in place. Changing the want
// repaints, because everything below it changes with it.

import {
  getState, setAim, toggleAction, carryUrl, carrySummary,
} from '../state.js?v=3.0.0';
import { esc, onAction } from '../ui/dom.js?v=3.0.0';

function fill(tpl, vars) {
  return String(tpl).replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
}

function wants(api) {
  return (api.data.journey && api.data.journey.wants) || [];
}

function futureFor(api, id) {
  const list = (api.data.futures && api.data.futures.futures) || [];
  return list.find((f) => f.id === id) || list.find((f) => f.id === 'unsure') || null;
}

/** The last finished life that named a want, if it named one. */
function leanedWant() {
  const runs = getState().runs || [];
  const last = runs[runs.length - 1];
  return (last && last.want && last.want.id && last.want.label) ? last.want : null;
}

/**
 * The one question worth taking to a person. A subject that can still move
 * up beats everything, because the level question has a real answer this
 * term. Otherwise the question follows the want.
 */
function askQuote(api) {
  const st = getState();
  const ask = (api.data.copy && api.data.copy.ask) || {};
  const canMove = api.ctx().subjects.find((s) => {
    const lv = st.plan[s.id];
    if (!lv) return false;
    const i = (s.levels || []).indexOf(lv);
    return i > -1 && i < s.levels.length - 1;
  });
  if (canMove && ask.move) return fill(ask.move, { who: `${canMove.name} teacher`, subject: canMove.name });
  if (st.aim && st.aim !== 'unsure' && ask.aim) return ask.aim;
  if (ask.open) return ask.open;
  return 'Ask my form teacher: which of these would suit how I learn?';
}

function moveBtn(text, on) {
  return `<button type="button" class="move press" data-action="ac-move" data-text="${esc(text)}"
    aria-pressed="${on}"><span class="tick" aria-hidden="true">&#10003;</span><span>${esc(text)}</span></button>`;
}

function saidHtml(api) {
  const acts = (getState().actions || []).filter(Boolean);
  if (!acts.length) return '';
  return `
  <div class="card" style="margin-top:24px">
    <p class="caps">${esc(api.copy('aim.saidHead', 'I said I would'))}</p>
    <ul class="movelist" style="margin-top:8px">
      ${acts.map((t) => `<li>${moveBtn(t, true)}</li>`).join('')}
    </ul>
    <p class="small" style="margin:12px 0 0">${esc(api.copy('chrome.actPlenty', 'Three is plenty. One done beats three written.'))}</p>
  </div>`;
}

function carryNote() {
  const c = carrySummary();
  const bits = [];
  if (c.subjects) bits.push(`${c.subjects} subject${c.subjects === 1 ? '' : 's'}`);
  if (c.todo) bits.push(`${c.todo} commitment${c.todo === 1 ? '' : 's'}`);
  if (c.want) bits.push('your want');
  return bits.length ? `The link carries ${bits.join(', ')}. Nothing else.` : 'The link carries your plan and nothing else.';
}

function closeHtml(api) {
  const done = (getState().actions || []).length > 0;
  return `
    <div class="btnrow">
      <button type="button" class="btn ghost small press" data-action="ac-carry">${esc(api.copy('chrome.carry', 'Carry this to another device'))}</button>
      <span class="small" id="ac-carry-note">${esc(carryNote())}</span>
    </div>
    ${done
      ? `<p class="notegood" style="margin-top:16px">${esc(api.copy('chrome.actDone', 'That is Act done. Come back when one is done in real life.'))}</p>`
      : `<p class="small" style="margin-top:16px">${esc(api.copy('chrome.actNotYet', 'Tick one move above and this screen is done.'))}</p>`}`;
}

export default {
  id: 'act',
  title: 'Act',
  era: 'school',

  render(root, api) {
    const st = getState();
    const ws = wants(api);
    const future = st.aim ? futureFor(api, st.aim) : null;
    const lean = leanedWant();
    const askText = askQuote(api);

    root.innerHTML = `
    <div class="wrap-narrow">
      <header class="hero" style="padding-bottom:16px">
        <h1>${esc(api.copy('chrome.actHead', 'Act.'))}</h1>
        <p class="lede">${esc(api.copy('chrome.actLede', 'Leave with three real moves this term.'))}</p>
      </header>

      ${lean && lean.id !== st.aim ? `
      <p class="small" style="margin-bottom:16px">${esc(api.copy('chrome.actLean', 'In the life you played, you leaned toward:'))}
        <button type="button" class="btn ghost small press" data-action="ac-adopt" data-id="${esc(lean.id)}">${esc(lean.label)}</button>
      </p>` : ''}

      <section aria-label="What you want">
        <p class="caps">${esc(api.copy('chrome.actWantHead', 'Start from what you want'))}</p>
        <p class="small">${esc(api.copy('aim.chooserLede', 'Not a job title. A shape of life, and more than one road to it.'))}</p>
        <div class="wantgrid" style="margin-top:12px" role="group" aria-label="Wants">
          ${ws.map((w) => `
          <button type="button" class="want press" data-action="ac-want" data-id="${esc(w.id)}"
            aria-pressed="${st.aim === w.id}">${esc(w.label)}</button>`).join('')}
        </div>
      </section>

      ${future ? `
      <section class="section" aria-label="What this looks like">
        <p class="caps">${esc(api.copy('chrome.actLooksHead', 'What this looks like at work'))}</p>
        <p style="margin:8px 0 0">${esc(future.looksLike)}</p>
        <p class="small" style="margin:8px 0 0">${esc(api.copy('chrome.actRoads', 'Roads people take:'))}
          ${(future.routes || []).map((r) => esc(r.label)).join(' &middot; ')}. ${esc(api.copy('chrome.actRoadsNote', 'In no order. More than one works.'))}</p>
      </section>

      <section class="section" aria-label="Moves this term">
        <h2>${esc(api.copy('chrome.actMovesHead', 'Three moves this term'))}</h2>
        <p class="small">${esc(api.copy('chrome.actMovesHint', 'Tap the ones you will actually do.'))}</p>
        <ul class="movelist" style="margin-top:12px">
          ${(future.thisTerm || []).map((t) => `<li>${moveBtn(t, (st.actions || []).includes(t))}</li>`).join('')}
        </ul>
      </section>` : ''}

      <div id="ac-said">${saidHtml(api)}</div>

      <section class="section" aria-label="One question to a person">
        <div class="askcard">
          <p class="caps">${esc(api.copy('chrome.askHead', 'Take one question to a person'))}</p>
          <blockquote id="ac-quote">${esc(askText)}</blockquote>
          <div class="btnrow">
            <button type="button" class="btn ghost small press" data-action="ac-copy">${esc(api.copy('chrome.actCopyWords', 'Copy the words'))}</button>
            <span class="small" id="ac-copy-note"></span>
          </div>
        </div>
      </section>

      <section class="section" aria-label="Keep this" id="ac-close">${closeHtml(api)}</section>
    </div>`;

    bind(root, api);
  },
};

function bind(root, api) {
  onAction(root, {
    'ac-want': (btn) => {
      const id = btn.dataset.id;
      setAim(getState().aim === id ? null : id);
      api.refresh();
    },

    'ac-adopt': (btn) => {
      setAim(btn.dataset.id);
      api.refresh();
    },

    'ac-move': (btn) => {
      const text = btn.dataset.text || '';
      if (!text) return;
      toggleAction(text);
      const st = getState();
      const on = st.actions.includes(text);

      // Patch in place: the finger stays where it was.
      root.querySelectorAll('.move[data-text]').forEach((b) => {
        if (b.dataset.text === text) b.setAttribute('aria-pressed', String(on));
      });
      const said = root.querySelector('#ac-said');
      if (said) said.innerHTML = saidHtml(api);
      const close = root.querySelector('#ac-close');
      if (close) close.innerHTML = closeHtml(api);

      if (on) api.cue('lived');
      const n = st.actions.length;
      api.announce(on
        ? `Added. ${n} on your list.`
        : `Removed. ${n} on your list.`);
    },

    'ac-copy': async () => {
      const q = root.querySelector('#ac-quote');
      const note = root.querySelector('#ac-copy-note');
      const text = q ? q.textContent.trim() : '';
      try {
        await navigator.clipboard.writeText(text);
        if (note) note.textContent = api.copy('chrome.actCopied', 'Copied. Send it, or read it out.');
      } catch {
        if (note) note.textContent = text;
      }
      api.announce(note ? note.textContent : '');
    },

    'ac-carry': async () => {
      const url = carryUrl();
      const note = root.querySelector('#ac-carry-note');
      try {
        if (navigator.share) { await navigator.share({ title: 'Paths', url }); return; }
        await navigator.clipboard.writeText(url);
        if (note) note.textContent = api.copy('chrome.carryDone', 'Copied. Paste it anywhere that reaches your other device.');
      } catch {
        if (note) note.textContent = url;
      }
    },
  });
}
