# houses

House system design tools for Beatty Secondary School. One decision dashboard, four earlier working papers, and the written record behind them in `references/`.

Start at `index.html`. Everything else is kept for traceability.

Live: `https://harmanjohll.github.io/genapp/houses/`

## Contents

| File | What it is |
| --- | --- |
| `index.html` | **The decision dashboard.** Start here. Six tabs: Evidence, Design, Talent, Schooling, Trade-offs, Decide. All 1,380 activity records are embedded and every figure is computed at load |
| `studio2.html` | **House Dashboard.** Earlier pass, superseded by `index.html`. Seven tabs, analytics and presentation. Couples the house system to talent development and treats the whole question as open, including whether to do this at all |
| `studio.html` | **House Studio.** First pass. Vertical house architecture modelling |
| `data.html` | **Calendar explorer.** The same 1,380 records standalone: filters, cross-tabs, calendar view |
| `audit.html` | **Enrichment audit.** What the Wednesday and Thursday block was actually used for, 2024 and 2025 |
| `configurator.html` | **Capacity configurator.** Earlier pass. Capacity, staffing, choice and overcommitment modelling for the enrichment block |
| `references/REPORT.md` | Written report: findings, the Gagné and Renzulli construct, house architecture, club catalogue, change management sequence |
| `references/TAXONOMY.md` | The ten category classification applied to every activity record |
| `references/NOTES.md` | Deploy steps, state of play, the four blocking unknowns, loose ends |
| `references/enrichment-audit-2024-2025.xlsx` | The primary source. 1,380 activity records with verbatim source text, frequency tables, block audit |

Every HTML file is standalone: no build step, no dependencies, no network calls. Open it or serve it.

## The dashboard

| Tab | What it answers |
| --- | --- |
| 1 Evidence | What two years of the school's own calendar actually says. Findings, records, cross-tabs, calendar, summary, and the citation register |
| 2 Design | Build a configuration: roll, house architecture, houses and what each stewards, delivery model, staffing, tiers, Cup scoring, activities |
| 3 Talent | Simulate who gets a deep experience and for how long, under five published talent models, and what each house architecture does to that |
| 4 Schooling | Teacher workload, the shared tier structure behind talent development and pastoral support, and what a house does and does not do for deployment |
| 5 Trade-offs | Every audit finding scored against the current configuration, model comparison, sensitivity, sweeps, saved scenarios |
| 6 Decide | Ten genuinely open questions, each carrying the live consequence of the current settings |

Settings propagate: change the Pursue share on Design and the Talent reach curves, the Trade-offs ledger and the Decide consequences all move with it.

### Talent models simulated

Five answers to "who gets a deep experience, and for how long", run over a whole school career because the difference between them only appears cumulatively.

| Model | Pool | Turnover a cycle | Source |
| --- | --- | --- | --- |
| Renzulli revolving door | 15–20% | 55% | Schoolwide Enrichment Model, published talent pool |
| Gagné sustained practice | 10% | 18% | DMGT, top-decile prevalence threshold |
| Fixed selection, Beatty today | 7% | 6% | Calibrated on the audit, reference E13 |
| Universal Pursue | 100% | 70% | No precedent at this scale; the upper bound |
| Explore all, Pursue few | 35% | 40% | The compromise most schools land on |

Pool shares are published; turnover rates are modelled and marked as such. The ordering of the curves is robust; the exact end points are not.

### The schooling argument

Three claims, each with its own sub-view and its own honesty box.

1. **The workload is invention, not delivery.** 42 enrichment programmes were invented in one year and 40 abandoned; 66 of 133 ran once or twice. A programme that runs once still costs a full design. A stable catalogue of about 44 groups, refreshed a quarter a year, replaces 42 designs with 11 while choice on a block day rises from 2.5 offerings to 44. Workload and opportunity were never the same axis.
2. **Talent development and pastoral support are the same architecture.** Universal, targeted, intensive; Type I, II, III. The universal tier is the same tier. Run them as one standing structure and the adult who notices a Beattyian is flourishing is the adult who notices they have stopped turning up. Doing the differentiated tiers inside a block everybody is already in means nobody is visibly withdrawn from anything.
3. **The house helps deployment, narrowly.** It is useful as a standing unit that already exists, already meets and already has a lead, so work can be handed to it without constituting anybody. It is not a curriculum, assessment or discipline unit, and level teams and departments are untouched.

Hours are controls, not measurements: the calendar records events and never time. The counts those hours multiply are measured, and the argument rests on the counts.

### Citation register

**Evidence → Sources & citations** gives every figure in the dashboard a stable reference id (`E1`–`E13` measured, `S1`–`S3` supplied by the school, `R1`–`R5` published research, `M1`–`M5` modelled here). Measured figures carry a *show the rows* button that opens the Records view on exactly the selection the figure was computed from. Reference chips appear inline wherever a figure is quoted.

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
| Enrichment block usage 2024–2025 | Measured, 1,148 calendar events decomposed into 1,380 activity records |
| Admiral biographies | Researched: Wikipedia, RMG, IWM, US Naval Institute |
| House colours for Harwood, Sturdee, Fisher | **Unverified**, set by the user |
| CCA sizes, gender mix, attrition | Modelled, adjustable |
| Form classes per level, cohort size | Modelled, adjustable |
| First choice CCA satisfaction | Modelled, illustrative |
| CCA attendance and participation quality | Out of scope this pass |

Nothing modelled is presented as measured. Every modelled input is a control in the tool that uses it.

## Needed before the next pass

1. CCA roll by CCA, split by level and gender if possible. Replaces the whole modelled layer.
2. House colours for Harwood, Sturdee and Fisher.
3. Observed turnover: how often a Beattyian actually rotates out of a pathway. The single largest assumption in the Talent tab.
4. Department tagging on enrichment records. 255 of 337 in-block enrichment records carry none, so next year's audit cannot answer the questions this one raised.

Supplied and now built in: projected roll, form classes per level, the ten-teacher ceiling on a block day.

---

Non Vi Sed Arte.
