# Methodology — ECDM

This document explains where each number in the dashboard comes from, what was excluded and why, how comparator countries were chosen, what the dashboard is **not** claiming, and our position on the framing of "crisis." Required by the spec §7. Without it, ECDM is opinion; with it, it is journalism.

## Position on the word "crisis"

We use the word once, in the hero, and never again as a heading. The situation it names is not imminent failure — Singapore's grid is one of the most reliable on the planet (SAIDI 0.14 min/customer/year) — but **structural exposure**: a 93% dependence on a single imported fuel, with no domestic alternative at scale, in a region without yet-mature low-carbon import infrastructure. We follow the spec's framing of "the quiet kind of crisis." A reader who disagrees with the framing should leave the dashboard equipped to make that argument; we have tried not to make the rebuttal harder than it should be.

## Sources, by dataset

| File | Primary source | URL | Accessed |
|---|---|---|---|
| `sg-fuel-mix.json` | EMA Singapore Energy Statistics 2025 H1 | https://www.ema.gov.sg/resources/singapore-energy-statistics | 2026-05-20 |
| `sg-tariff-history.json` | SP Group quarterly tariff publications, cross-checked against EMA regulated tariff page | https://www.spgroup.com.sg/our-services/utilities/tariff-information | 2026-05-20 |
| `sg-gas-imports.json` | EMA *Our Energy Story*; LNG cargo trade-press reporting | https://www.ema.gov.sg/our-energy-story | 2026-05-20 |
| `sg-emissions.json` | EMA GEF series; NCCS climate-action pages | https://www.nccs.gov.sg/singapores-climate-action/ | 2026-05-20 |
| `carbon-tax-timeline.json` | NCCS carbon-tax policy publications; Budget statements 2022–2026 | https://www.nccs.gov.sg/singapores-climate-action/carbon-tax/ | 2026-05-20 |
| `comparators.json` | Our World in Data — Energy; Ember Climate; IEA country profiles | https://ourworldindata.org/energy | 2026-05-20 |
| `pathway-models.json` | EMA scenario discussions; NCCS net-zero commentary; OWID + IEA cost benchmarks. Envelopes are editorial — see below. | — | 2026-05-20 |
| `household-typology.json` | SP Group typical household consumption tables; EMA statistics on dwelling types | https://www.spgroup.com.sg/our-services/utilities/tariff-information | 2026-05-20 |
| `annotations.json` | Editorial timeline cross-referenced to global news events | — | 2026-05-20 |

## Pathway-model envelopes — what they are and aren't

The Decision Studio's feasibility caps (the points beyond which a slider triggers a constraint warning) are **plausibility brackets, not forecasts**. They are drawn from public targets (3 GWp solar by 2030, 6 GW low-carbon imports by 2035, 11 H₂-ready CCGTs by 2032) and published cost benchmarks (LCOE figures from IEA WEO and EMA cost discussions).

We have set the brackets with a small optimistic bias — the cap is the *defensible upper edge of plausibility* for a given year, not the central case. A user who pushes solar to 8% by 2050 is not predicting; they are saying "this is the most aggressive plausible solar build-out." A user who pushes hydrogen to 50% by 2050 is matching the upper bound of the National Hydrogen Strategy 2022.

The carbon-intensity coefficients per pathway (kg CO₂ / kWh) are conservative grid-average operating figures, not full lifecycle. We acknowledge this is an editorial choice — full-LCA hydrogen and solar look different. We will revisit if a maintainer disputes.

## Carbon-tax revenue calculation

`Revenue = National annual electricity emissions (Mt) × carbon tax rate (S$/tCO₂)`. We use only electricity-sector emissions in the Decision Studio output, not full Singapore emissions — the dashboard is about the electricity system. We label this in the output ("Carbon-tax revenue — electricity only"). A reader scaling to Singapore's total ~50–60 MtCO₂e/yr would multiply.

## Household-bill projection

The mixer's "Your projected monthly bill" output is computed as:

```
effective_tariff = current_tariff × (mix-weighted LCOE / current-gas LCOE)
monthly_bill = (your kWh per month × effective_tariff) / 100
```

This is a **first-order approximation**. It does not model: capital-cost amortisation curves, network charge changes, retailer competition margins, time-of-use pricing, or government subsidy lifecycles. It anchors the conversation; it does not forecast a single household's actual future bill.

## Exclusions

- **Embodied / lifecycle emissions of imported fuels** — we count gas burned in Singapore, not gas-extraction methane leakage in Qatar. We acknowledge this matters and the OWID treatment of it is good.
- **Industrial decarbonisation pathways** — Tuas Power, Jurong Island, Sembcorp — are visible in sector breakdown but not separately modelled. The dashboard is about *electricity generation*, not industrial energy use.
- **Transport electrification's load impact** — the demand forecast already assumes growth, but EV-specific scenarios are out of scope.
- **Carbon-intensity by hour-of-day** — peaker plants are dirtier than baseload. Annual averages hide this.

If any of these matter to your reading, the dashboard should be the start of the conversation, not the end.

## Comparator countries — how we chose

**Regional** (when the toggle is set to Regional): the ASEAN-6 plus Cambodia. Chosen because these are the countries Singapore physically connects to or could connect to via the ASEAN Power Grid (LTMS-PIP and successor interconnections).

**International**: seven countries chosen not because they are big, but because each embodies a distinct decarbonisation strategy:
- Germany — political-economy under public scrutiny (Energiewende)
- Denmark — most-wind small grid; market design
- France — what scaled nuclear actually looks like
- Norway — geographic luck Singapore cannot copy (counterfactual)
- Japan — post-Fukushima reset; a peer we watch
- UK — coal phase-out in one generation; market liberalisation
- Iceland — what 100% renewables looks like, and why Singapore cannot

A maintainer might prefer to swap in South Korea (gas + nuclear), Australia (coal + solar transition), or Costa Rica (renewables-dominant developing economy). The choice signals which futures the dashboard takes seriously. See `OPEN_QUESTIONS.md`.

## Behavioural-economics layer

Each nudge in Zones 4–6 is tagged with the mechanism it relies on. The reference is the spec §4: BJ Fogg's Behaviour Model (B = MAP), Thaler & Sunstein on choice architecture, Allcott on social comparison, Darby and Fischer on energy feedback. We label mechanisms openly because the audience includes policymakers and educators who deserve to see the work; we do not gamify guilt and do not deploy any image or moralising prose.

## What the dashboard is **not** claiming

- That gas is "bad." It is the cleanest fossil fuel, and Singapore's grid emissions are lower than most peer cities because of it. The argument is about exposure, not virtue.
- That any one pathway is "the answer." The Decision Studio refuses to pick. The carbon line and the cost line are visible; the choice is yours.
- That household action is sufficient. Households are 14.6% of demand. The macro lever is in industry and policy. The dashboard says both things.
- That household action is irrelevant. The dashboard says both things.
- That this is forecasting. We model first-order, not scenarios in any IEA / IPCC sense. A maintainer building a planning tool should source the Singapore Energy Modelling Hub.

## Authorship and updates

This dashboard was scaffolded from the `SG_ENERGY_CRISIS_SPEC.md` editorial brief. Maintainer decisions on authorship attribution, comparator-country edits, and the nuclear-pathway framing live in `OPEN_QUESTIONS.md`. The data files refresh weekly under Phase 2 (a GitHub Action — not yet shipped); until then, refresh by hand and bump the `_meta.accessed` field. Stale-data banner triggers at 90 days.
