// ECDM main entry. Loads data, mounts all zones, wires global affordances.

import { loadAll, formatDate } from './data-loader.js';
import { getState, subscribe, SCOPES, PERSONAS } from './state.js';
import { mountPersonaSwitch } from './components/persona-switch.js';
import { mountGeoToggle } from './components/geo-toggle.js';
import { mountPersonaChooser } from './zones/persona-chooser.js';
import { mountZone1 } from './zones/zone-1-situation.js';
import { mountZone2 } from './zones/zone-2-why.js';
import { mountZone3 } from './zones/zone-3-tradeoffs.js';
import { mountZone4 } from './zones/zone-4-decision.js';
import { mountZone5 } from './zones/zone-5-economics.js';
import { mountZone6 } from './zones/zone-6-action.js';

async function init() {
  // Top chrome first so the user sees the persona/scope controls early.
  mountPersonaSwitch(document.getElementById('persona-mount'));
  mountGeoToggle(document.getElementById('geo-mount'));

  // Scroll reveal
  const reveal = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        reveal.unobserve(e.target);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  document.querySelectorAll('.reveal').forEach((el) => reveal.observe(el));

  // Persona chooser is fine without data
  mountPersonaChooser();

  // Hero copy reacts to scope change
  subscribe(updateHeroSubFromScope);

  // Load data
  let bundle;
  try {
    bundle = await loadAll();
  } catch (e) {
    console.error('Data load failed', e);
    document.getElementById('hero-caption').textContent = 'Data failed to load. Try refreshing — or read the README.';
    return;
  }

  const { data, latest, isStale } = bundle;

  // Footer + stale banner
  document.getElementById('footer-date').textContent = formatDate(latest);
  if (isStale) {
    const banner = document.getElementById('stale-banner');
    banner.classList.add('is-shown');
    banner.querySelector('#stale-date').textContent = formatDate(latest);
  }

  // Mount zones
  mountZone1(data);
  mountZone2(data);
  mountZone3(data);
  mountZone4(data);
  mountZone5(data);
  mountZone6();
}

function updateHeroSubFromScope() {
  // Subtle hero copy nudge per scope (still subordinate to persona subhead)
  const scope = getState().scope;
  const cap = document.getElementById('hero-caption');
  if (!cap) return;
  cap.textContent = scope === 'sg'
    ? "of Singapore's electricity in 2025 came from imported natural gas."
    : scope === 'regional'
      ? "imported gas dependence in Singapore — by far the cleanest, by far the most exposed, in ASEAN."
      : "imported gas dependence — higher than any developed grid we benchmark against.";
}

document.addEventListener('DOMContentLoaded', init);
