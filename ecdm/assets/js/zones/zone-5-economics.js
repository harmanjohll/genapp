// Behavioural-economics strip. Three cards with named mechanisms.

export function mountZone5(data) {
  const grid = document.getElementById('econ-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const sectors = data['sg-emissions'].consumption_sector_2024;
  const hh = data['household-typology'].behavioural;
  const tariff = data['sg-tariff-history'].current.tariff_incl_gst / 100; // $/kWh

  const standbyMidKwh = (hh.standby_kwh_per_household_low + hh.standby_kwh_per_household_high) / 2;
  const standbyHousehold = standbyMidKwh * tariff; // S$/month
  const standbyNation    = (standbyMidKwh * hh.households_total * tariff * 12) / 1e6; // S$M/year
  const oemMidSaving = (hh.oem_typical_saving_pct[0] + hh.oem_typical_saving_pct[1]) / 2;
  const oemStillRegulated = 100 - hh.oem_uptake_pct_estimate;

  // Card 1: Carbon-tax incidence
  const incidence = sectors
    .filter((s) => s.sector !== 'Others')
    .map((s) => ({
      ...s,
      tone: s.sector.startsWith('Households') ? 'house' :
            s.sector.startsWith('Industry')   ? 'industry' :
            s.sector.startsWith('Commerce')   ? 'commerce' : 'transport',
    }));

  const c1 = card({
    mech: 'Mechanism · tax incidence + pass-through',
    title: 'Who actually pays the carbon tax?',
    num: '14.6%',
    body: 'Households are 14.6% of demand — but the tax lands on industry (39.4%) and commerce (40.2%) first, then arrives in our bills with a lag. The macro lever is not in our hands; the local lever is.',
    viz: `<div class="bar-incidence" role="img" aria-label="Sector shares of electricity demand">${incidence.map((i) => `<div data-tone="${i.tone}" style="width:${i.pct}%" title="${i.sector}: ${i.pct}%">${i.pct >= 8 ? i.pct.toFixed(1) + '%' : ''}</div>`).join('')}</div>
            <div class="muted small" style="margin-top:8px;">Industry ${sectors[1].pct}% · Commerce ${sectors[0].pct}% · Households ${sectors[2].pct}% · Transport ${sectors[3].pct}%</div>`,
  });

  // Card 2: standby load
  const c2 = card({
    mech: 'Mechanism · status-quo bias + default architecture',
    title: 'The standby-load tax we already pay',
    num: 'S$' + standbyHousehold.toFixed(0) + ' / mo',
    body: `Each household burns roughly ${hh.standby_kwh_per_household_low}–${hh.standby_kwh_per_household_high} kWh a month on appliances doing nothing. Scaled to ${(hh.households_total / 1e6).toFixed(1)}M households at today's tariff, the country pays around <strong>S$${Math.round(standbyNation)} M</strong> a year for nothing.`,
    viz: `<div style="display:flex;align-items:flex-end;height:90px;gap:6px;">
            <div style="width:32%;background:var(--smoke);height:30%;border-radius:3px;" title="Low standby"></div>
            <div style="width:32%;background:var(--amber);height:60%;border-radius:3px;" title="Median standby"></div>
            <div style="width:32%;background:var(--critical);height:100%;border-radius:3px;" title="High standby"></div>
          </div>
          <div class="muted small" style="margin-top:6px;">${hh.standby_kwh_per_household_low} · ${standbyMidKwh.toFixed(0)} · ${hh.standby_kwh_per_household_high} kWh / household / month</div>`,
  });

  // Card 3: OEM free-ridership
  const c3 = card({
    mech: 'Mechanism · choice friction, decision fatigue',
    title: 'Free money left on the table',
    num: oemMidSaving + '% saving',
    body: `Open Electricity Market plans typically save <strong>${hh.oem_typical_saving_pct[0]}–${hh.oem_typical_saving_pct[1]}%</strong> against the regulated tariff. Roughly <strong>${oemStillRegulated.toFixed(0)}%</strong> of households still pay the regulated rate — not because the maths is wrong, but because switching takes ten minutes that nobody schedules.`,
    viz: `<div style="display:flex;height:14px;border-radius:4px;overflow:hidden;box-shadow:inset 0 0 0 1px var(--rule);">
            <div style="background:var(--ink);width:${hh.oem_uptake_pct_estimate}%;" title="On OEM"></div>
            <div style="background:var(--amber);width:${oemStillRegulated}%;" title="Still on regulated tariff"></div>
          </div>
          <div class="muted small" style="margin-top:6px;">${hh.oem_uptake_pct_estimate}% on OEM · ${oemStillRegulated.toFixed(0)}% still on regulated tariff</div>`,
  });

  grid.appendChild(c1);
  grid.appendChild(c2);
  grid.appendChild(c3);
}

function card({ mech, title, num, body, viz }) {
  const el = document.createElement('div');
  el.className = 'econ-card';
  el.innerHTML = `
    <div class="econ-card__mech">${mech}</div>
    <div class="econ-card__title">${title}</div>
    <div class="econ-card__num tnum">${num}</div>
    <div class="econ-card__viz">${viz || ''}</div>
    <div class="econ-card__body">${body}</div>
  `;
  return el;
}
