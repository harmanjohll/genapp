// Five sounds, synthesised, off by default.
//
// No assets, no network, no library: a WebAudio oscillator pair per cue, each
// under half a second, quiet by design. Sound is opt in because this runs in
// classrooms of thirty devices; it exists because a door opening should be
// felt on headphones at home. prefers-reduced-motion is honoured as a mute
// signal, and board mode stays silent regardless of the toggle.

// v3: no import of state. The shell injects the mute predicate at boot, so
// this file is pure WebAudio and portable anywhere, including the Node
// harness, which imports modules that import this one.
let isMuted = () => true;
export function setMutePredicate(fn) { if (typeof fn === 'function') isMuted = fn; }

let ctx = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function muted() {
  try { return isMuted(); } catch { return true; }
}

/** One enveloped tone. */
function tone(a, freq, t0, dur, type = 'sine', gainPeak = 0.08) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime + t0);
  g.gain.setValueAtTime(0, a.currentTime + t0);
  g.gain.linearRampToValueAtTime(gainPeak, a.currentTime + t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0004, a.currentTime + t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + t0);
  o.stop(a.currentTime + t0 + dur + 0.05);
}

const CUES = {
  // A year committed: one soft low tick.
  lived:  (a) => { tone(a, 220, 0, 0.16, 'triangle', 0.06); },
  // A chance arrives: two quick mid notes, a knock.
  chance: (a) => { tone(a, 392, 0, 0.09, 'sine', 0.05); tone(a, 392, 0.11, 0.09, 'sine', 0.05); },
  // A door opens: a rising fifth, the biggest sound in the app.
  door:   (a) => { tone(a, 330, 0, 0.22, 'triangle', 0.09); tone(a, 495, 0.12, 0.3, 'triangle', 0.09); },
  // The fork: one long low swell.
  fork:   (a) => { tone(a, 165, 0, 0.5, 'sine', 0.07); },
  // The ending: a soft major triad, arpeggiated.
  ending: (a) => { tone(a, 262, 0, 0.3, 'triangle', 0.06); tone(a, 330, 0.1, 0.3, 'triangle', 0.06); tone(a, 392, 0.2, 0.42, 'triangle', 0.07); },
};

export function cue(name) {
  try {
    if (muted()) return;
    const a = ac();
    if (!a || !CUES[name]) return;
    CUES[name](a);
  } catch { /* sound must never break a screen */ }
}
