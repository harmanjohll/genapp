# Paths

A pathways thinking tool for Singapore secondary students under Full Subject Based Banding.

Static site, zero build step, zero dependencies, zero runtime network calls. About 300 KB total.

## Run locally

ES modules and the JSON data layer both need an HTTP origin, so `file://` will not work.

```bash
# from the repository root
python3 -m http.server 8000
# then open http://localhost:8000/pathways/
```

| URL | What it does |
| --- | --- |
| `?dev=1` | Runs the reach invariant, the Journey sweep and the copy budget check, printing all three to the console |
| `?mode=teacher` | The facilitation layer. Deliberately not linked from the student header |
| `?mode=parent` | A calm printable page for parents: what changed since their day, the decision calendar, conversations that help. Linked from the footer |
| `?board=1` | Projector view: bigger type, thicker state bars, subject list hidden |
| `?p=el3~maths2&y=sec3` | Loads a plan from a link, so a student can carry it to another device |

## What it is

Three modes over one engine and one saved plan.

- **Now** — build the combination you are considering. Eight destinations, each showing what is met, what would move it, and a real road in another way.
- **Journey** — a played game from Sec 3 to 48. Say what you want by twenty five, spend two attention points a turn, answer chance cards that ask something of you, and watch named doors collect. **Your choice at 17 sets your route, and every stage after that is written for it**: a poly student gets studios and an internship, an ITE student gets a workshop and a GPA target, a JC student gets tutorials and A Levels. Then play again from the same start and compare two runs side by side.
- **Aim** — start from a want, get three or more unranked roads, leave with three things to do this term.

The subject list matches the 2027 SEC: one Combined Humanities pair (Social Studies with Geography, History or Literature) is part of every G2 and G3 package, sciences at G2 come as named pairs, pure sciences are G3 only, and subjects a school may not run carry a "selected schools" tag. One line under the list says the quiet part out loud: schools offer different subsets of these, so refer to the combinations your school offers.

Beyond students, the app carries a page for parents (`?mode=parent`, printable) and one for teachers (`?mode=teacher`), both linked from the footer.

A Long View ribbon runs along the bottom of every mode, ages 12 to 65. School is the small band on the left. That proportion is the argument.

## The two rules this app is built around

**1. It never tells a student what they cannot do.**

Structural, not editorial. There is no `locked` state in the data model, `reach()` cannot return one, and any destination that is not open carries at least one named onward route and one concrete move.

**2. No door ever moves away from a student.**

Adding a subject, or raising one a level, can never increase the distance to any destination. This one is easy to break by accident and it was broken: an earlier version charged one move for a subject you were not taking and two for the same subject held at G1, so a student entering an honest G1 plan watched Junior College, Millennia Institute and Polytechnic all recede. Silently, in arithmetic, underneath copy saying the opposite.

Both are checked rather than promised. `?dev=1` runs 904 destination evaluations over 113 generated plan states, plus a monotonicity sweep over every subject at every level from several starting plans. It fails loudly in the console.

## What it deliberately does not do

- **No score prediction.** Aggregates like L1R4 and ELR2B2 depend on grades this app does not have. They are shown as what a destination asks for and are never evaluated against anyone. Reach is computed from structure only: which subjects, at which levels.
- **No distance shown anywhere.** An earlier design slid a dot along a track to encode how far each destination was. Position is a continuous ranking, which is worse than the four labelled states it replaced, and on a low plan it drew a very clear picture of a ceiling. The repeated-move problem it was trying to solve is now solved by the lever line instead.
- **No eligibility ruling, no personality verdict, no ranking of pathways.**
- **No red, no padlocks, no greyed out cards, no disabled controls.**
- **No data collection.** No account, no server, no analytics, no cookies.

See `METHODOLOGY.md`.

## Copy budget

The screen a student lands on was 4,574 words and 33 phone screens before they had tapped anything. It is now 245.

| Screen | Before | After |
| --- | ---: | ---: |
| Now, empty | 4,661 | 245 |
| Now, with a plan | 4,016 | 265 |
| Journey intro | 214 | 16 |
| Journey turn | 107 | about 200 |
| Aim chooser | 241 | 64 |
| Aim detail | 356 | 89 |

Nothing was thrown away. The writing moved into sheets that open on demand.

Journey went the other way on purpose. It was capped at 120 words and had exactly three choices on every stage, which is why it felt hollow. NOW was the screen that needed cutting, not this one.

`engine/copy-budget.js` enforces per field word caps, scans every student facing string for hyphens and dashes, and measures first paint off the live DOM. It counts every visible label including each G1/G2/G3 chip, so the budget cannot be met by moving prose into labels.

## Journey, the game

**It starts in the year you are actually in.** Pick Sec 1 and you play Sec 1, at thirteen, where the moves are about settling in and asking to move a level up. Pick Sec 4 and you start at sixteen. The year selector used to change one sentence; now it changes the game, the subject list and what the app thinks is worth telling you.

**It starts from your actual subjects.** Journey opens with your combination, taken straight from the plan you built in Now, or picked there and then if you have not built one yet. At fifteen the game says "this year you take Chemistry, Art and Computing", using your own list, and your subjects add choices and change which chances turn up.

What they never do is decide anything. No archetypes, no "you are the practical one", no path set for you, no door opened or withheld. The combination is where you are standing, not who you are, and the sweep plays eight combinations including an all G1 plan to assert that none of them plays a smaller game than picking nothing at all.

Then you pick a want: what do you want by twenty five, with "Not sure yet" as a first class answer. The ending opens by answering it.

Each turn gives two attention points. Every choice costs 1 or 2 and shows what it grows, so you spend the turn on one big thing or two small things. Nothing is subtracted from any stat and the budget resets every turn: the only cost is the thing you did not do.

Chance cards are decisions in two beats. The situation arrives with what it asks for, "This one asks for Risk taking. You have 1 of 2", and two or three responses. A response you do not have the footing for stays fully tappable and routes to a stretch outcome: you do it anyway, it goes roughly, and it builds the very disposition it asked for. Then the outcome lands.

Doors are named, never counted. Early Admissions, a portfolio, the poly to uni road, work study: a Set that only ever adds, drawn as chips. Choices set flags, callback cards name what you did stages ago, and late stage outcomes vary by the route you took, so the run remembers you.

Four families, set by a choice at 17, resolved against every stage after it.

| Ages | Shape |
| --- | --- |
| 13, 14 | Lower secondary. Asking to move a subject up actually raises it for the rest of the run |
| 15, 16 | Shared turns. Nobody has taken a route yet |
| **17, 27, 43** | **Forks.** Single pick, the age huge |
| 18 to 30 | Branched per family: `academic`, `applied`, `hands`, `arts` |
| 34 onward | Shared again |
| 38 | A reflection turn. Name one thing you would do differently, never scored, surfaced verbatim on the compare screen |

The convergence is the point. By your mid thirties the route you took at seventeen has stopped deciding what is available to you, and letting the content merge says that better than a sentence would.

15 stages, ages 13 to 48, 53 chance cards including 10 callbacks. Every age has at least 8 eligible cards on every path, every card has at least 2 responses, and 136 simulations across 8 combinations play end to end with at least 3 doors each. All of it is asserted by `runJourneySweep()`.

## Layout

Nothing is pinned to the top of the page. The header scrolls away on every device: measured across five viewports and four scroll positions, a sticky header covered between 23 and 68 pixels of content at every single position.

The ribbon sits collapsed at 26px and expands to 88px on tap or keyboard focus. At 88px fixed it covered up to 84px of the page, and its label rendered 5px above its own border, so a red label floated loose over the subject list.

The loop of the main mode is: tap a level, watch the doors change. In one column those two things are hundreds of pixels apart, so the consequence lands off screen and the tool stops feeling live.

| Width | Layout | Popup | Live feedback |
| --- | --- | --- | --- |
| to 699 | One column, doors above subjects. Header scrolls away, summary stays pinned | Bottom sheet | Eight state pips ride the sticky summary |
| 700 to 899 | One column, roomier, destination rows capped for eye travel | Centred dialog | Pips |
| 900 up | **Two panes.** Subjects left, doors pinned right | Centred dialog | The whole list is permanently visible |
| 1400 up | Two panes, subject groups of five or more split into two columns | Centred dialog | Whole list |

Also handled: short viewports (a phone held sideways) drop the ribbon and unpin everything; touch devices get `:hover` neutralised so controls do not latch after a tap; keyboard focus gets `scroll-margin` so a focused row never lands under the pinned summary bar.

Verified at 375, 430, 740x360, 834, 1112, 1366 and 1680: no horizontal overflow anywhere, focus enters and returns from every popup, zero contrast failures, every control 44px effective.

## Structure

```
pathways/
├── index.html
├── METHODOLOGY.md            what is modelled and what is refused
├── OPEN_QUESTIONS.md         the verification checklist, read this first
├── HANDOFF.md                copy rules, contracts, annual update cadence
├── assets/
│   ├── css/   tokens.css · base.css · components.css
│   ├── js/
│   │   ├── main.js · state.js · data-loader.js
│   │   ├── engine/      rules.js · reach.js · journey.js · pulse.js · copy-budget.js
│   │   ├── components/  dom.js · sheet.js · timeline-ribbon.js · glossary.js
│   │   └── modes/       mode-now.js · mode-journey.js · mode-aim.js · mode-teacher.js · mode-parent.js
└── data/                     twelve JSON files, each with a _meta source block
```

Every number resolves to a file in `data/`, each declaring `_meta` with `source`, `url`, `accessed`, `units` and `notes`, following `ecdm/`. The loader retries each file and degrades rather than failing the whole app, because thirty five devices on one school access point is exactly when a fetch times out. A stale banner fires past 90 days.

## Before you put this in front of students

Read `OPEN_QUESTIONS.md`. A number of figures are marked `provisional`, meaning they were not read from a primary MOE or SEAB page. The app says so on screen. They still need verifying.
