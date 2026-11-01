// Tickets: one piece of advice, printed like a transit ticket.
//
// The stub carries the move (G2 → G3, and which subject); the body leads
// with what it opens, in large type, then the condition, then the words to
// say to a real person. "Keep" puts the words on My plan, and the ticket is
// punched: a small, honest acknowledgement that the student did something.

import { getState } from '../state.js?v=4.2.0';
import { sayMove, roleWords } from './talk.js?v=4.2.0';
import { esc } from './dom.js?v=4.2.0';
import { icon } from './icons.js?v=4.2.0';
import { t } from './labels.js?v=4.2.0';

const LV_COLOR = { G1: 'var(--g1)', G2: 'var(--g2)', G3: 'var(--g3)' };

export function ticketHtml(m, { hero = false, compact = false, simple = false } = {}) {
  const st = getState();
  const rw = roleWords(st.role);
  const say = sayMove(m, st.role);
  const kept = st.actions.includes(say);
  const to = m.kind === 'pair' ? (m.moves[0] && m.moves[0].to) : m.to;
  const from = m.kind === 'pair' ? null : m.from;
  const who = m.kind === 'pair'
    ? (m.any ? `Any 2 of ${m.moves.length}` : 'Two moves')
    : (m.any ? `Any 1 of ${m.names.length}` : m.name);
  const opts = m.kind === 'pair' ? m.moves.map((x) => x.name) : (m.any ? m.names : []);
  const opened = m.opens || [];
  const nearer = m.kind === 'pair' ? [] : (m.alsoNearer && m.alsoNearer.length ? m.alsoNearer : (opened.length ? [] : m.nearer || []));

  return `
  <article class="ticket${hero ? ' tk-hero' : ''}${compact ? ' compact' : ''}${kept ? ' kept' : ''}" style="--tc:${LV_COLOR[to] || 'var(--accent)'}">
    <div class="tk-stub">
      <span class="tk-kind">${m.kind === 'add' ? 'Add a subject' : m.kind === 'pair' ? 'Two moves' : 'Move up'}</span>
      <span class="tk-move">${from ? `<b>${esc(from)}</b>${icon('arrow')}` : ''}<b class="tk-to">${esc(to || '')}</b></span>
      <span class="tk-who">${esc(who)}</span>
    </div>
    <div class="tk-body">
      <p class="tk-result">${esc(m.result || m.line)}</p>
      <p class="tk-if">${esc(m.cond || '')}${m.cond ? '.' : ''}</p>
      ${opts.length ? `<p class="tk-opts">${opts.map((o) => `<span>${esc(o)}</span>`).join('')}</p>` : ''}
      ${!compact && nearer.length && opened.length ? `<p class="tk-dests">
        ${nearer.map((d) => `<span class="dchip" data-state="near">${esc(d)} closer</span>`).join('')}
      </p>` : ''}
      ${!compact && !simple && m.because && m.because.length ? `<p class="tk-why">Because ${m.because.map((b) => esc(b)).join('; ')}.</p>` : ''}
      ${!compact && !simple && m.still && m.still.length ? `<p class="tk-why">Then: ${m.still.slice(0, 2).map((s) => `${esc(s.dest)} next asks ${esc(/^(A|An|One|Two|Three|Four|Five)\b/.test(s.next) ? s.next.charAt(0).toLowerCase() + s.next.slice(1) : s.next)}`).join('; ')}.</p>` : ''}
      ${!compact && !simple && m.sec3 ? `<p class="tk-why">In Sec 3: ${esc(m.sec3)}</p>` : ''}
      ${!compact && !simple && m.when ? `<p class="tk-when">${icon('calendar')} ${esc(m.when.charAt(0).toUpperCase() + m.when.slice(1))}. Ask ${esc(m.who)}.${m.how ? ` ${esc(m.how)}` : ''}</p>` : ''}
      ${compact ? '' : `
      <div class="say">
        <span class="say-who">${icon('talk')} ${esc(rw.say)}</span>
        <p class="say-line">${esc(say)}</p>
      </div>
      <p class="tk-actions">
        <button type="button" class="btn ghost small press" data-action="tk-copy" data-text="${esc(say)}">${icon('copy')} Copy words</button>
        <button type="button" class="btn small press tk-keep" data-action="tk-keep" data-text="${esc(say)}" aria-pressed="${kept}">${kept ? `${icon('check')} ${t('kept')}` : `${icon('ticket')} ${t('keep')}`}</button>
      </p>`}
    </div>
    <span class="tk-punch" aria-hidden="true">${esc(t('kept'))}</span>
  </article>`;
}

export function holdHtml(h) {
  const st = getState();
  return `
  <article class="holdcard">
    <span class="hold-ic">${icon('hold')}</span>
    <div>
      <p class="hold-line">${esc(h.line)}</p>
      <p class="say-line small">${esc(sayMove(h, st.role))}</p>
    </div>
  </article>`;
}
