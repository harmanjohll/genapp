// The decision studio: linked sliders + timeline scrubber + persona-aware outputs.

import {
  PERSONAS, getState, setYear, setMix, setHouseholdKwh, resetMixToCurrent, subscribe,
} from '../state.js';

let store = null;
let sliderEls = {};

const YEARS = [2026, 2030, 2032, 2040, 2050];

export function mountMixer(data) {
  store = data;

  mountScrubber();
  mountSliders();
  mountHouseholdInput();
  mountOutputs();
  wireActions();

  subscribe(() => {
    renderScrubber();
    renderSliders();
    renderOutputs();
    renderStudioSub();
  });
  renderStudioSub();
  renderScrubber();
  renderSliders();
  renderOutputs();
}

function mountScrubber() {
  const mount = document.getElementById('scrubber');
  mount.innerHTML = '';
  YEARS.forEach((y) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'scrubber__btn';
    b.dataset.y = y;
    b.textContent = y;
    b.setAttribute('role', 'tab');
    b.addEventListener('click', () => setYear(y));
    mount.appendChild(b);
  });
}

function renderScrubber() {
  const y = getState().year;
  document.getElementById('year-val').textContent = y;
  document.getElementById('lock-stamp').textContent = `Locks in until ≈ ${y + store['pathway-models'].lock_in_years}`;
  document.querySelectorAll('.scrubber__btn').forEach((b) => {
    b.setAttribute('aria-pressed', Number(b.dataset.y) === y ? 'true' : 'false');
  });
}

function mountSliders() {
  const mount = document.getElementById('sliders');
  mount.innerHTML = '';
  sliderEls = {};

  store['pathway-models'].pathways.forEach((p) => {
    const row = document.createElement('div');
    row.className = 'slider-row';
    row.innerHTML = `
      <div class="slider-row__label">
        <span class="slider-row__sw" data-tone="${p.tone}"></span>
        <span>${p.label}</span>
      </div>
      <input type="range" min="0" max="100" step="1" aria-label="${p.label} share" />
      <div class="slider-row__val tnum"><span data-v>0</span>%</div>
      <div class="slider-row__warn" data-warn></div>
    `;
    mount.appendChild(row);
    const input = row.querySelector('input');
    input.addEventListener('input', (e) => onSliderInput(p.id, Number(e.target.value)));
    sliderEls[p.id] = { row, input, val: row.querySelector('[data-v]'), warn: row.querySelector('[data-warn]') };
  });
}

function onSliderInput(id, val) {
  // Rebalance: keep this slider fixed, scale the others proportionally so they sum to 100.
  const mix = { ...getState().mix };
  mix[id] = val;
  const otherKeys = Object.keys(mix).filter((k) => k !== id);
  const otherSum = otherKeys.reduce((s, k) => s + mix[k], 0);
  const target = Math.max(0, 100 - val);
  if (otherSum === 0) {
    // distribute equally
    const each = target / otherKeys.length;
    otherKeys.forEach((k) => (mix[k] = each));
  } else {
    const scale = target / otherSum;
    otherKeys.forEach((k) => (mix[k] = mix[k] * scale));
  }
  // round to 1dp but reconcile drift
  let drift = 100 - Object.values(mix).reduce((s, v) => s + Math.round(v), 0);
  const intMix = Object.fromEntries(Object.entries(mix).map(([k, v]) => [k, Math.round(v)]));
  // put drift into the largest non-active slider
  if (drift !== 0) {
    const sorted = Object.keys(intMix).filter((k) => k !== id).sort((a, b) => intMix[b] - intMix[a]);
    if (sorted.length) intMix[sorted[0]] = Math.max(0, intMix[sorted[0]] + drift);
  }
  setMix(intMix);
}

function renderSliders() {
  const { mix, year } = getState();
  const pathways = store['pathway-models'].pathways;

  pathways.forEach((p) => {
    const els = sliderEls[p.id];
    const v = mix[p.id] ?? 0;
    if (Number(els.input.value) !== v) els.input.value = v;
    els.val.textContent = v;

    const cap = capFor(p, year);
    if (v > cap) {
      els.row.classList.add('is-over');
      els.warn.textContent = `Above ${cap}% feasibility cap for ${year} — ${p.notes}`;
    } else {
      els.row.classList.remove('is-over');
      els.warn.textContent = '';
    }
  });

  // Mix total + summary bar
  const total = Object.values(mix).reduce((s, v) => s + v, 0);
  const totalEl = document.getElementById('mix-total');
  totalEl.querySelector('strong').textContent = `${total}%`;
  totalEl.classList.toggle('is-off', Math.abs(total - 100) > 1);

  // mix summary stack
  const sum = document.getElementById('mix-summary');
  sum.innerHTML = pathways.map((p) => `<div data-tone="${p.tone}" style="width:${mix[p.id] || 0}%" title="${p.label}: ${mix[p.id] || 0}%"></div>`).join('');
}

function capFor(p, year) {
  // feasibility_cap is sparse; pick nearest year ≥ requested, else last.
  const caps = p.feasibility_cap;
  const exact = caps.find((c) => c.year === year);
  if (exact) return exact.cap;
  // interpolate
  for (let i = 0; i < caps.length - 1; i++) {
    if (year > caps[i].year && year < caps[i + 1].year) {
      const t = (year - caps[i].year) / (caps[i + 1].year - caps[i].year);
      return Math.round(caps[i].cap + t * (caps[i + 1].cap - caps[i].cap));
    }
  }
  return caps[caps.length - 1].cap;
}

// ── Household input ─────────────────────────────────────────────

function mountHouseholdInput() {
  const wrap = document.getElementById('household-input-wrap');
  wrap.innerHTML = '';
  // only show for citizen + educator + student
  const persona = getState().persona;
  if (persona === 'cabinet') return;

  const div = document.createElement('div');
  div.className = 'household-input';
  div.innerHTML = `
    <label for="kwh-in">Your typical monthly use</label>
    <input id="kwh-in" type="number" min="50" max="5000" step="10" />
    <span class="muted small">kWh / month · anchors your bill in the outputs</span>
  `;
  wrap.appendChild(div);
  const input = div.querySelector('input');
  input.value = getState().householdKwh;
  input.addEventListener('input', (e) => setHouseholdKwh(Number(e.target.value)));
}

// ── Outputs ─────────────────────────────────────────────────────

function mountOutputs() {
  // Render is data-driven; just keep mount empty.
  document.getElementById('outputs').innerHTML = '';
}

function renderOutputs() {
  const persona = getState().persona || 'citizen';
  const mount = document.getElementById('outputs');
  mount.innerHTML = '';

  const calc = computeOutputs();
  const cards = outputCardsFor(persona, calc);
  cards.forEach((c) => {
    const el = document.createElement('div');
    el.className = 'output';
    el.innerHTML = `
      <div class="output__lab">${c.label}</div>
      <div class="output__val tnum">${c.val}</div>
      ${c.delta ? `<div class="output__delta ${c.deltaClass || ''}">${c.delta}</div>` : ''}
      ${c.mech ? `<span class="output__mech">${c.mech}</span>` : ''}
    `;
    mount.appendChild(el);
  });
}

function computeOutputs() {
  const { mix, year, householdKwh } = getState();
  const pm = store['pathway-models'];
  const emissions = store['sg-emissions'];
  const tariffNow = store['sg-tariff-history'].current.tariff_incl_gst; // ¢/kWh
  const ctSteps = store['carbon-tax-timeline'].steps;
  const demandRow = pm.demand_forecast_twh.find((d) => d.year === year) || pm.demand_forecast_twh[pm.demand_forecast_twh.length - 1];
  const demandTwh = demandRow.twh;

  // Weighted carbon intensity (kg/kWh)
  let gef = 0; let lcoe = 0;
  pm.pathways.forEach((p) => { gef  += (mix[p.id] / 100) * p.carbon_kg_per_kwh; });
  pm.pathways.forEach((p) => { lcoe += (mix[p.id] / 100) * p.lcoe_sgd_per_mwh; });

  const annualMt = (gef * demandTwh * 1e9) / 1e9; // gef[kg/kWh] * twh[1e9 kWh] = kg ; /1e9 → Mt
  // ndc check
  const ndc2030 = emissions.totals.ndc_2030_mtco2e_ceiling;
  const ndc2035 = emissions.totals.ndc_2035_mtco2e_range; // [45,50]

  // Import dependence: imports + hydrogen + LNG portion of gas (assume 60% of gas is imported LNG share-of-mix; pipeline gas also imported, so gas is ~100% imported, plus imports + hydrogen)
  const importDep = Math.min(100, (mix.gas + mix.imports + mix.hydrogen));

  // Land utilisation in hectares
  let landHa = 0;
  pm.pathways.forEach((p) => { landHa += (mix[p.id] / 100) * demandTwh * p.land_per_twh_ha; });

  // Peak capacity vs forecast (peak 2031 9.6–11.4 GW)
  const peakLow = 9.6, peakHigh = 11.4;

  // Carbon-tax revenue (S$ M)
  const ctYear = ctSteps.find((s) => year >= s.from && year <= s.to) || ctSteps[ctSteps.length - 1];
  const ctRevSgdM = (annualMt * 1e6 * ctYear.rate) / 1e6; // = annualMt * rate

  // Household bill projection
  // Effective tariff scales with mix: higher gas → tariff ~ tariffNow * (1 + scale); higher imports/nuclear → tariff up too (LCOE based)
  const baselineLcoe = 110; // gas-current
  const tariffScale = lcoe / baselineLcoe;
  const effectiveTariff = tariffNow * tariffScale; // ¢/kWh
  const monthlyBill = (householdKwh * effectiveTariff) / 100; // S$
  const billDelta = monthlyBill - (householdKwh * tariffNow) / 100;

  // Household carbon share — household sector is 14.6% of national demand; statistically your kWh inherit gef
  const householdAnnualKg = householdKwh * 12 * gef;
  const householdCarbonTaxPassthrough = householdAnnualKg / 1000 * ctYear.rate; // S$/yr

  return {
    year, gef, lcoe, annualMt, ndc2030, ndc2035,
    importDep, landHa, peakLow, peakHigh,
    ctRevSgdM, monthlyBill, billDelta,
    effectiveTariff, householdAnnualKg, householdCarbonTaxPassthrough,
    ctRate: ctYear.rate,
    householdKwh,
  };
}

function outputCardsFor(persona, c) {
  const fmtMt   = (v) => (v).toFixed(1) + ' MtCO₂';
  const fmtPct  = (v) => v.toFixed(0) + '%';
  const fmtSgd  = (v) => 'S$' + (Math.round(v * 100) / 100).toFixed(2);
  const fmtSgdM = (v) => 'S$' + Math.round(v).toLocaleString() + ' M';
  const fmtGef  = (v) => (v).toFixed(3) + ' kg/kWh';
  const fmtHa   = (v) => Math.round(v).toLocaleString() + ' ha';

  const ndcMid = (c.ndc2035[0] + c.ndc2035[1]) / 2;
  const ndcLabel = c.year >= 2035 ? `NDC 2035 target: ${c.ndc2035[0]}–${c.ndc2035[1]} Mt` : `NDC 2030 ceiling: ${c.ndc2030} Mt`;
  const ndcTarget = c.year >= 2035 ? ndcMid : c.ndc2030;
  const ndcClass = c.annualMt > ndcTarget ? 'up' : 'down';
  const ndcDelta = `${ndcLabel} · you're ${c.annualMt > ndcTarget ? 'over' : 'under'} by ${Math.abs(c.annualMt - ndcTarget).toFixed(1)} Mt`;

  const billClass = c.billDelta > 0 ? 'up' : 'down';
  const billDeltaTxt = `${c.billDelta >= 0 ? '+' : '−'}${fmtSgd(Math.abs(c.billDelta))} vs today's tariff`;

  const cabinet = [
    { label: 'National emissions (electricity)', val: fmtMt(c.annualMt), delta: ndcDelta, deltaClass: ndcClass, mech: 'Loss frame · NDC trajectory' },
    { label: 'Carbon-tax revenue', val: fmtSgdM(c.ctRevSgdM), delta: `at S$${c.ctRate}/tCO₂e`, mech: 'Fiscal capacity · revenue recycling lever' },
    { label: 'Import dependence', val: fmtPct(c.importDep), delta: c.importDep > 85 ? 'Above 85% — geopolitical exposure persists' : 'Diversified beyond single-fuel risk', deltaClass: c.importDep > 85 ? 'up' : 'down', mech: 'Strategic exposure · counterfactual framing' },
    { label: 'Grid carbon intensity', val: fmtGef(c.gef), delta: `vs 2024 baseline 0.402 kg/kWh`, deltaClass: c.gef < 0.4 ? 'down' : 'up', mech: 'Anchored to current GEF' },
    { label: 'Land footprint', val: fmtHa(c.landHa), delta: `vs total land area ~73,000 ha`, mech: 'Hard constraint · public-good tradeoff' },
    { label: 'Peak demand vs capacity', val: `${c.peakLow}–${c.peakHigh} GW peak`, delta: `Firm capacity must cover the high end`, mech: 'Reliability constraint' },
  ];

  const citizen = [
    { label: 'Your projected monthly bill', val: fmtSgd(c.monthlyBill), delta: billDeltaTxt, deltaClass: billClass, mech: 'Anchored to your ' + c.householdKwh + ' kWh / month' },
    { label: 'Your annual carbon footprint', val: (c.householdAnnualKg / 1000).toFixed(2) + ' tCO₂', delta: `at carbon-tax pass-through ≈ ${fmtSgd(c.householdCarbonTaxPassthrough)}/yr`, mech: 'Loss frame · what your kWh costs the climate' },
    { label: 'Effective ¢/kWh under this mix', val: c.effectiveTariff.toFixed(2) + '¢', delta: `vs ${c.year === 2026 ? '29.72¢' : '29.72¢ today'}`, deltaClass: c.effectiveTariff > 30 ? 'up' : 'down', mech: 'Comparison · not exhortation' },
    { label: 'National emissions you helped shape', val: fmtMt(c.annualMt), delta: `Households are ${(14.6).toFixed(1)}% of demand — the rest of the lever is industry & commerce`, mech: 'Honesty about scale' },
  ];

  const educator = [...cabinet.slice(0, 3), ...citizen.slice(0, 2)];
  const student  = [
    { label: 'Your projected monthly bill', val: fmtSgd(c.monthlyBill), delta: billDeltaTxt, deltaClass: billClass, mech: 'What it costs you' },
    { label: 'Singapore’s carbon emissions', val: fmtMt(c.annualMt), delta: ndcDelta, deltaClass: ndcClass, mech: 'What it costs the planet' },
    { label: 'Imported energy in this mix', val: fmtPct(c.importDep), delta: `Most of our power still comes from somewhere else.`, mech: 'Where it comes from' },
  ];

  return {
    cabinet, citizen, educator, student,
  }[persona] || citizen;
}

function renderStudioSub() {
  const p = PERSONAS[getState().persona || 'citizen'];
  const sub = document.getElementById('studio-sub');
  if (sub && p) sub.textContent = p.studioSub;
}

function wireActions() {
  document.getElementById('reset-btn')?.addEventListener('click', () => resetMixToCurrent());

  document.getElementById('share-btn')?.addEventListener('click', async () => {
    const studio = document.querySelector('.studio');
    if (!studio || !window.html2canvas) {
      showToast('Snapshot unavailable in this environment.');
      return;
    }
    showToast('Rendering your decision card…');
    try {
      const canvas = await window.html2canvas(studio, {
        backgroundColor: getCss('--paper'),
        scale: 2,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ecdm-decision-${getState().year}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
        showToast('Decision card saved. Bring it to the conversation.');
      });
    } catch (e) {
      console.error(e);
      showToast('Could not render — try again after charts finish loading.');
    }
  });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('is-shown');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove('is-shown'), 3200);
}

function getCss(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#fff'; }

// keep household input reactive to persona changes
subscribe(() => {
  const wrap = document.getElementById('household-input-wrap');
  if (!wrap) return;
  const hasInput = !!wrap.querySelector('input');
  const cabinetMode = getState().persona === 'cabinet';
  if (hasInput && cabinetMode) wrap.innerHTML = '';
  else if (!hasInput && !cabinetMode) mountHouseholdInput();
});
