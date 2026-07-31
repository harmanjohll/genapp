# The Long Game

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
| `?dev=1` | Runs the reach invariant sweep and the copy budget check, printing both to the console |
| `?mode=teacher` | The facilitation layer. Deliberately not linked from the student header |
| `?board=1` | Projector view: bigger type, thicker state bars, subject list hidden |
| `?p=el3~maths2&y=sec3` | Loads a plan from a link, so a student can carry it to another device |

## What it is

Three modes over one engine and one saved plan.

- **Now** — build the combination you are considering. Eight destinations, each showing what is met, what would move it, and a real road in another way.
- **Journey** — play forward from where you are to about 42, with chances and setbacks. Then play again from the same start and compare.
- **Aim** — start from a want, get three or more unranked roads, leave with three things to do this term.

A Long View ribbon runs along the bottom of every mode, ages 12 to 65. School is the small band on the left. That proportion is the argument.

## The two rules this app is built around

**1. It never tells a student what they cannot do.**

Structural, not editorial. There is no `locked` state in the data model, `reach()` cannot return one, and any destination that is not open carries at least one named onward route and one concrete move.

**2. No door ever moves away from a student.**

Adding a subject, or raising one a level, can never increase the distance to any destination. This one is easy to break by accident and it was broken: an earlier version charged one move for a subject you were not taking and two for the same subject held at G1, so a student entering an honest G1 plan watched Junior College, Millennia Institute and Polytechnic all recede. Silently, in arithmetic, underneath copy saying the opposite.

Both are checked rather than promised. `?dev=1` runs 744 destination evaluations over 93 generated plan states, plus a monotonicity sweep over every subject at every level from several starting plans. It fails loudly in the console.

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
| Aim chooser | 241 | 64 |
| Aim detail | 356 | 89 |

Nothing was thrown away. The writing moved into sheets that open on demand.

`engine/copy-budget.js` enforces per field word caps, scans every student facing string for hyphens and dashes, and measures first paint off the live DOM. It counts every visible label including each G1/G2/G3 chip, so the budget cannot be met by moving prose into labels.

## Layout

The loop of the main mode is: tap a level, watch the doors change. In one column those two things are hundreds of pixels apart, so the consequence lands off screen and the tool stops feeling live.

| Width | Layout | Popup | Live feedback |
| --- | --- | --- | --- |
| to 699 | One column, doors above subjects. Header scrolls away, summary stays pinned | Bottom sheet | Eight state pips ride the sticky summary |
| 700 to 899 | One column, roomier, destination rows capped for eye travel | Centred dialog | Pips |
| 900 up | **Two panes.** Subjects left, doors pinned right | Centred dialog | The whole list is permanently visible |
| 1400 up | Two panes, subject groups of five or more split into two columns | Centred dialog | Whole list |

Also handled: short viewports (a phone held sideways) drop the ribbon and unpin everything; touch devices get `:hover` neutralised so controls do not latch after a tap; keyboard focus gets `scroll-margin` so a focused row never lands under the sticky header.

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
│   │   └── modes/       mode-now.js · mode-journey.js · mode-aim.js · mode-teacher.js
└── data/                     eleven JSON files, each with a _meta source block
```

Every number resolves to a file in `data/`, each declaring `_meta` with `source`, `url`, `accessed`, `units` and `notes`, following `ecdm/`. The loader retries each file and degrades rather than failing the whole app, because thirty five devices on one school access point is exactly when a fetch times out. A stale banner fires past 90 days.

## Before you put this in front of students

Read `OPEN_QUESTIONS.md`. A number of figures are marked `provisional`, meaning they were not read from a primary MOE or SEAB page. The app says so on screen. They still need verifying.
