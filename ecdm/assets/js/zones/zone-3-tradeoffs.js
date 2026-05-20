import { mountCarbonTaxStep } from '../components/carbon-tax-step.js';
import { mountComparator } from '../components/comparator-bars.js';

export function mountZone3(data) {
  const grid = document.getElementById('path-grid');
  grid.innerHTML = '';

  data['pathway-models'].pathways.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'path-card';
    card.dataset.tone = p.tone;
    card.innerHTML = `
      <div class="path-card__label">${p.label}</div>
      <div class="path-card__notes">${p.notes}</div>
      <div class="chip-row">
        <span class="chip"><strong>Maturity</strong> · ${p.maturity}</span>
        <span class="chip"><strong>Land</strong> · ${landTier(p.land_per_twh_ha)}</span>
        <span class="chip"><strong>Geopol.</strong> · ${geoTier(p.geopolitical_risk)}</span>
      </div>
    `;
    grid.appendChild(card);
  });

  mountCarbonTaxStep(data);
  mountComparator(data);
}

function landTier(haPerTwh) {
  if (haPerTwh < 30) return 'Compact';
  if (haPerTwh < 100) return 'Moderate';
  if (haPerTwh < 500) return 'Large';
  return 'Land-bound';
}

function geoTier(score) {
  return ['—', 'Low', 'Moderate', 'Notable', 'High', 'Concentrated'][score] || 'Moderate';
}
