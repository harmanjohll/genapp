# Open questions — to resolve before v1.0

The spec §10 sets aside a small number of editorial decisions for the maintainer because they involve judgement that no software can make. Each item below is a real fork in the road. Tick it off in a PR; do not leave the dashboard sitting on default answers.

## 1. Authorship

Does the dashboard carry a named author, an organisation, or stay anonymous? Each has credibility implications:
- **Named** — strongest accountability; weakest reach.
- **Organisation** — collective sign-off; risks association if the framing offends.
- **Anonymous** — purest argument-from-the-data; harder to take seriously among the inner ring.

**Current state**: anonymous. Footer reads "ECDM is a static civic-literacy dashboard built from public Singapore energy data."

## 2. Hero copy

The "quiet kind of crisis" line is the spec's draft. It will not survive contact with a maintainer who has their own voice. Rewrite it in your own register before ship — but keep these constraints:
- The word "crisis" appears once, in the hero only.
- The number 93.1% is the headline.
- Loss-frame ("imported gas dependence", "exposure") is allowed; alarm ("blackouts", "running out") is not.

## 3. The fifth path — nuclear / CCS / geothermal

Currently presented as exploratory ("under study"), grouped on equal cardinal footing with the other four. A reader will read this either as:
- Pro-nuclear bias — "they shouldn't have given it equal billing," or
- Anti-nuclear bias — "they shouldn't have grouped it with CCS."

Maintainer choices:
- Keep grouped, label "under study" prominently — current.
- Split into two cards (Nuclear · SMR, and CCS + geothermal).
- Demote to a single explanatory paragraph below the four-card row.

## 4. Comparator countries

The eleven-country set in `comparators.json` is opinionated. Genuine alternatives:
- **South Korea** — gas + nuclear; an actual peer in size and politics.
- **Australia** — coal + solar transition; a useful "lossy" peer.
- **Costa Rica** — renewables-dominant developing economy; a moral comparator.
- **Belgium / Netherlands** — small dense-grid peers transitioning from gas.
- **UAE** — petrostate with major nuclear + solar pivot; a regional alternative to "OECD comparators."

The choice signals which futures the dashboard takes seriously.

## 5. The action zone in Phase 1

Spec §10 asks: ship empty with a "Phase 2" placeholder, or ship with a static three-action list per persona?

**Current state**: static, three actions per persona, all four personas. We chose static because an empty action zone undercuts the dashboard's claim that human decision-making is fundamental. The maintainer may prefer to remove the citizen actions if there are concerns about appearing to recommend a specific retailer (Open Electricity Market is the regulator-curated portal, not a retailer; this is defensible but not invisible).

## 6. Phase 2 — live data refresh action

The repository does not yet ship the GitHub Action that refreshes `/data/*.json` from the data.gov.sg API on a weekly schedule and opens a PR. The stale-data banner mechanism is wired and will trigger after 90 days, but the refresh itself is manual.

**Decisions to make**:
- Which datasets are eligible for automated refresh? The data.gov.sg sets are. The SP Group tariff page would require scraping.
- PR vs auto-commit on data refresh? PR keeps the maintainer in the loop; auto-commit removes friction.
- Failure handling — does a refresh-action failure trigger a banner saying "refresh action last failed [date]"?

## 7. Analytics

Spec §7 says no Google Analytics. The maintainer may want privacy-respecting analytics (Plausible, Umami) to understand who reads the dashboard and how. Currently: none. The neutrality argument cuts both ways — running zero analytics is a position, not a default.

## 8. Tablet breakpoint

Currently breakpoints at 880px (collapse to single column) and 640px (sankey degrades to flow list, geo toggle becomes bottom segmented control). The 768–879px band ("iPad portrait") is presently a "narrow desktop" experience. Worth a dedicated breakpoint? Probably yes — see how it reads on a real iPad before deciding.

## 9. Carbon-tax revenue framing

The Decision Studio's "Carbon-tax revenue" output is **electricity-sector only**. A cabinet-persona reader might rightly ask: what about industrial process emissions? What about cement, refining? The framing currently labels this clearly, but a maintainer might add a separate "total Singapore carbon-tax revenue" output anchored against the published Budget figures, with a clear note that ECDM only models the electricity portion.

## 10. The shareable card

Zone 4's "Lock this mix · save card" exports a PNG of the studio panel. The wording on the saved card is currently the live state of the slider rows — no editorial framing, no signature, no "as of" date stamped onto the export itself. A maintainer may want:
- A timestamp burned into the PNG.
- A small "Generated by ECDM · sg-energy" watermark.
- A QR back to the dashboard with the user's mix encoded in the URL (`?mix=25,8,35,18,14`).

The third option turns the card into a portable artifact of a position. Defensible; not trivial.
