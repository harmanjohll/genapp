# The Long Game

A pathways thinking tool for Singapore secondary students under Full Subject Based Banding.

Live at `./index.html`. Static site, zero build step, no dependencies, no network calls at runtime.

## Run locally

ES modules and the JSON data layer both need an HTTP origin, so opening `index.html` from `file://` will not work.

```bash
# from the repository root
python3 -m http.server 8000
# then open http://localhost:8000/pathways/
```

Add `?dev=1` to run the reach invariant sweep and print the result to the console.

## What it is

Three modes over one engine and one saved plan.

- **Now** — build the subject combination you are considering and see what it opens. Every destination shows what is met, what is not, exactly what would move it, and a real route that goes round another way.
- **Journey** — play your life forward from where you are to about age 42, a few years at a time, with chances and setbacks. Then play it again from the same start and put the two side by side.
- **Aim** — start from the kind of life you want, see three or more structurally different roads to it, and leave with three things to do this term.

A Long View ribbon runs along the bottom of every mode, ages 12 to 65. Secondary school is the small band on the left. That proportion is the argument.

A teacher layer sits behind the Teacher button, or `?mode=teacher`.

## The rule this app is built around

**It never tells a student what they cannot do.**

That is not a copy guideline. There is no `locked` state in the data model, `reach()` cannot return one, and any destination that is not currently open carries at least one named onward route and at least one concrete move.

It is checked rather than hoped for. `?dev=1` runs `runInvariantSweep()`, which generates 93 plan states, from an empty plan through every single subject at every level it is offered at, uniform plans, 24 deliberately awkward mixed plans, and everything at once, then asserts across all 744 destination evaluations that nothing produced a dead end. If the data is edited badly, the sweep fails loudly in the console rather than a padlock quietly appearing in front of a fourteen year old.

## What it deliberately does not do

- **No score prediction.** Aggregates like L1R4, ELR2B2 and ELMAB3 depend on grades this app does not have. They are shown as information about what a destination asks for, and are never evaluated against anyone. Reach is computed from structure only: which subjects, at which levels.
- **No eligibility ruling.** It shows what is open, close, or reachable another way. It does not adjudicate.
- **No personality verdict.** Nothing here tells a student what kind of person they are and therefore where they belong.
- **No ranking of pathways.** JC, polytechnic and ITE routes appear beside each other, in no order of merit.

See `METHODOLOGY.md`.

## Structure

```
pathways/
├── index.html
├── METHODOLOGY.md            what is modelled and what is refused
├── OPEN_QUESTIONS.md         the verification checklist, read this first
├── HANDOFF.md                copy rules and the annual update cadence
├── assets/
│   ├── css/   tokens.css · base.css · components.css
│   ├── js/
│   │   ├── main.js · state.js · data-loader.js
│   │   ├── engine/      rules.js · reach.js · journey.js
│   │   ├── components/  dom.js · timeline-ribbon.js · glossary.js
│   │   └── modes/       mode-now.js · mode-journey.js · mode-aim.js · mode-teacher.js
│   └── vendor/ html2canvas.min.js
└── data/                     ten JSON files, each with a _meta source block
```

Every number resolves to a file in `data/`. Each declares `_meta` with `source`, `url`, `accessed`, `units` and `notes`, following the convention set by `ecdm/`. The loader takes the oldest `accessed` date across all files and shows a stale data banner past 90 days, because admission criteria change annually and a tool quietly serving last year's thresholds is worse than no tool.

## Before you put this in front of students

Read `OPEN_QUESTIONS.md`. A number of figures are marked `provisional`, meaning they were not read from a primary MOE or SEAB page. The app says so on screen, next to the figures themselves. They still need verifying.
