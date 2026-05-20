// Persona-conditioned action zone. Three actions/levers per persona.

import { PERSONAS, getState, subscribe } from '../state.js';

const ACTIONS = {
  student: [
    { lab: 'Share the 93% number', effect: '1 conversation', body: 'Send the headline to one friend or family member. The thing they remember tomorrow is the thing you said today.' },
    { lab: 'Audit one room', effect: '20–50 kWh / month', body: 'Walk your room with a phone torch. Anything with a glowing LED on standby is on your monthly bill. Pull the plug on one.' },
    { lab: 'Pick one path', effect: 'A position', body: 'Look at the five pathways above. Pick the one you would back, and remember why. That is what citizenship of an energy decision looks like.' },
  ],
  citizen: [
    { lab: 'Switch retailer on the Open Electricity Market', effect: 'S$15–40 / month', body: 'Open Electricity Market plans typically save 15–30% on the regulated tariff. The switch is online; takes ten minutes; no service interruption.', href: 'https://www.openelectricitymarket.sg' },
    { lab: 'Cut standby load this weekend', effect: 'S$3–9 / month', body: 'Pull the plug on the TV decoder, the set-top box, the water heater, the second router. 10–30 kWh of free savings, every household, every month.' },
    { lab: 'Read the next NDC update', effect: 'Citizen-level fluency', body: 'Singapore submitted a 2035 NDC of 45–50 MtCO₂e. Read what it does and does not commit. Civic literacy is the upstream lever.', href: 'https://www.nccs.gov.sg/singapores-climate-action/' },
  ],
  educator: [
    { lab: 'Download the one-pager', effect: 'Lesson-ready', body: 'A print-friendly version of this dashboard. Pin it on the noticeboard, hand it out, mark it up.', href: '#', isPrint: true },
    { lab: 'Run the Decision Studio in class', effect: '20 min activity', body: 'Project Zone 4. Split the class into the four personas. Each picks a 2050 mix and defends it for two minutes. End with the carbon-line chart.' },
    { lab: 'Map this to the syllabus', effect: 'Geog · IH · Econ', body: 'Lower-secondary Geography (resource management), Integrated Humanities (citizenship), and Economics (externalities, public goods) all converge here.' },
  ],
  cabinet: [
    { lab: 'Carbon-tax glide path', effect: '~S$3–6 bn / yr by 2030', body: 'The S$45 → S$50–80 trajectory is fiscal infrastructure. Revenue recycling design — whether it funds transition support, household rebates, or general revenue — is a separate decision worth making in the open.' },
    { lab: 'Import-cap negotiating posture', effect: '6 GW by 2035 target', body: 'SGEI is established. The next decision is whether the 6 GW import target is a ceiling or a floor — and what bilateral terms with Indonesia, Malaysia, Thailand and Laos make either tractable.' },
    { lab: 'CCGT H₂-readiness mandate', effect: 'Lock-in until ~2065', body: 'The 11 H₂-ready CCGTs by 2032 are a hedge. The hedge only pays off if a hydrogen supply chain exists. Public commitment to demand-side procurement now is what makes the supply side bankable.' },
  ],
};

export function mountZone6() {
  function render() {
    const persona = getState().persona || 'citizen';
    const grid = document.getElementById('action-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const lede = document.getElementById('action-lede');
    if (lede) lede.textContent = PERSONAS[persona].actionLede;

    ACTIONS[persona].forEach((a, i) => {
      const card = document.createElement('div');
      card.className = 'action-card';
      const inputId = `action-${persona}-${i}`;
      card.innerHTML = `
        <span class="action-card__effect">${a.effect}</span>
        <div class="action-card__lab">${a.lab}</div>
        <div class="action-card__body">${a.body}</div>
        <label>
          <input type="checkbox" id="${inputId}" />
          <span>Pick this one</span>
          ${a.href && a.href !== '#' ? `<a href="${a.href}" target="_blank" rel="noopener" style="margin-left:auto;">Open →</a>` : ''}
          ${a.isPrint ? `<button class="btn btn--ghost" style="margin-left:auto;padding:4px 10px;font-size:0.75rem;" onclick="window.print()">Print</button>` : ''}
        </label>
      `;
      grid.appendChild(card);
    });
  }
  render();
  subscribe(render);
}
