import { PERSONAS, getState, subscribe } from '../state.js';
import { mountFuelMix } from '../components/fuel-mix-bar.js';

export function mountZone1(data) {
  mountFuelMix(data);

  // Animated count-up to 93.1
  const heroNum = document.getElementById('hero-number-val');
  const target  = data['sg-fuel-mix'].series.find((s) => s.year === '2025H1').values[0].pct;
  const tariff  = data['sg-tariff-history'].current.tariff_incl_gst;
  document.getElementById('tariff-current').textContent = tariff.toFixed(2);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    heroNum.textContent = target.toFixed(1);
  } else {
    let start = 0;
    const t0 = performance.now();
    const dur = 1600;
    function tick(now) {
      const t = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      heroNum.textContent = (start + (target - start) * eased).toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
      else heroNum.textContent = target.toFixed(1);
    }
    requestAnimationFrame(tick);
  }

  // Persona-conditioned subhead
  function render() {
    const p = PERSONAS[getState().persona || 'citizen'];
    document.getElementById('hero-frame').textContent = p.heroSub;
  }
  render();
  subscribe(render);
}
