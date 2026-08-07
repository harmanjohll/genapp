# house

House system design tools for Beatty Secondary School. Three self contained HTML models plus the written record behind them.

Live: `https://harmanjohll.github.io/genapp/house/`

## Contents

| File | What it is |
| --- | --- |
| `index.html` | Overview, the five houses, what the modelling settled, data provenance |
| `studio.html` | **House Studio.** The primary tool. Vertical house architecture modelling |
| `audit.html` | **Enrichment audit.** What the Wednesday and Thursday band was actually used for, 2024 and 2025 |
| `configurator.html` | **Band configurator.** Earlier pass. Capacity, staffing, choice and overcommitment modelling for the band |
| `REPORT.md` | Written report: findings, the Gagné and Renzulli construct, house architecture, club catalogue, change management sequence |
| `TAXONOMY.md` | The ten category classification applied to every activity record |
| `NOTES.md` | **Start here.** Deploy steps, state of play, the four blocking unknowns, loose ends |
| `data/enrichment-audit-2024-2025.xlsx` | 1,380 activity records with verbatim source text, frequency tables, band audit |

Every HTML file is standalone: no build step, no dependencies, no network calls. Open it or serve it.

## The five houses

Beatty's houses already exist and are named after Royal Navy officers connected to Admiral David Beatty, after whom the school and Beatty Road are named.

| House | Colour | Namesake | Remembered for | Stewards |
| --- | --- | --- | --- | --- |
| Hood | Red | Rear-Admiral Sir Horace Hood, 1870–1916 | Going first. Died at Jutland commanding the vanguard attached to Beatty's fleet | Service, Leadership and Community |
| Jellicoe | Orange | Admiral of the Fleet John Jellicoe, 1859–1935 | Judgement and restraint. Commanded the Grand Fleet at Jutland | Humanities and Global Citizenship |
| Harwood | *unverified* | Admiral Sir Henry Harwood, 1888–1950 | Reading a situation while outnumbered. River Plate, 1939 | Language, Oracy and Expression |
| Sturdee | *unverified* | Admiral of the Fleet Sir Doveton Sturdee, 1859–1925 | Preparation, then pursuit. Falkland Islands, 1914 | Sport, Health and the Outdoors |
| Fisher | *unverified* | Admiral of the Fleet John "Jacky" Fisher, 1841–1920 | Making the old obsolete. Drove HMS Dreadnought | STEM, Design and Making |

Hood is Red and Jellicoe is Orange. The remaining three colours are Green, Yellow and Blue, but which house holds which is not published anywhere reachable. The Studio lets you assign them.

No source states why these five admirals were chosen. The school's Wikipedia page, its own history page, the MOE Heritage Centre profile and NewspaperSG were all checked. The two commemorative histories in the NLB catalogue (*Forward to Glory*, 1953–1991; *50th Anniversary*, 1953–2003) are the likely record if a founding era answer exists.

## What the modelling settled

- **Five houses need five sports, and Beatty has four.** MOE files Wushu under Visual and Performing Arts. Count it as a sport and the arithmetic closes exactly. File it as an art and one house has no sport anchor.
- **Class nesting is the binding constraint.** Form classes per level must divide by five or houses cannot hold whole classes evenly at every level. Eight does not; ten does.
- **Vertical houses and inter class activity reinforce only under class anchoring.** If a form class sits entirely in one house, every inter class competition is already an inter house competition and the house table fills from events already running.
- **Gender balance and anchor reach fight each other.** Levelling gender wants Volleyball beside a boys uniformed group; keeping flagships open wants them apart. Three boys only CCAs against one girls only is structural.
- **Under class anchoring the anchors cannot balance anything.** Size comes from class allocation, gender from the classes. Anchors control only reach.

## Data provenance

| Input | Status |
| --- | --- |
| The seventeen CCAs, categories, gender eligibility | Measured, MOE School Finder |
| Band usage 2024–2025 | Measured, 1,148 calendar events |
| Admiral biographies | Researched: Wikipedia, RMG, IWM, US Naval Institute |
| House colours for Harwood, Sturdee, Fisher | **Unverified**, set by the user |
| CCA sizes, gender mix, attrition | Modelled, adjustable |
| Form classes per level, cohort size | Modelled, adjustable |
| First choice CCA satisfaction | Modelled, illustrative |
| CCA attendance and participation quality | Out of scope this pass |

Nothing modelled is presented as measured. Every modelled input is a control in the tool that uses it.

## Needed before the next pass

1. Form classes per level. Decides whether five houses nest cleanly.
2. CCA roll by CCA, split by level and gender if possible. Replaces the whole modelled layer.
3. Facilitator supply per band day. Determines whether the choice architecture is real or nominal.
4. House colours for Harwood, Sturdee and Fisher.

---

Non Vi Sed Arte.
