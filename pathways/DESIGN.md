# Paths: design notes

Written for the October 2026 rebuild, and still the basis of the app. The
version numbers below are history; later changes are logged in
[`../PATHWAYS_VERSIONS.md`](../PATHWAYS_VERSIONS.md).

v4 is built on v3's engine, data discipline and ethics. Read v3's `DESIGN.md`
first; everything it refuses, v4 refuses (no locked state, monotone distance,
no ranking of destinations, no red, nothing leaves the device).

## The audit (2026-10-27)

| Area | Finding in v3 | v4 answer |
| --- | --- | --- |
| Scroll | Plan 3.8 phone screens, Adults 6.4; every page then repeats a one screen footer | Tabs that each fit a screen; a one paragraph footer |
| Tap and answer | The consequence of a tap rendered three scrolls below it | A dock (phones) and a side panel (wide screens) answer every tap in view |
| Stages | Year was a header chip that silently swapped the subject list | A year strip: P6 to Sec 5 and After, grouped by phase, one page each, one plan per year |
| Lower sec accuracy | reach() filtered lower secondary subjects, so a Sec 2 student raising Science was told "Nothing shifted" | Lower secondary plans are read through the Sec 3 projection before any destination sees them (`engine/years.js`) |
| Advice | "One more at G2", never which | `engine/advice.js` tries every move, names the subject, groups equivalent moves, finds pairs, and reports what is holding a door open |
| Grades | Refused entirely | Hypothetical targets, now and aimed for; aggregates computed with MOE's mapping tables (`engine/grades.js`) |
| Personal | One voice | Student, parent, teacher voices on every question; facts never change |
| Rules | JC "five at G3" without the subject structure; poly B2 rule wrong; arts claimed open from anything | JC and MI need a G3 Humanities and a G3 Maths too; poly fifth subject at G2 value; arts ask G3 English (provisional) |
| Bugs | Pulse line "at . Nothing shifted"; red focus ring on every arrival; game want cards nested a button look inside a button; sheet actions squashed into circles | All fixed |

## Decisions

1. Built as `pathways4/`; since 2026-10-31 it is served from `pathways/` (see `PATHWAYS_VERSIONS.md` at the repo root). v1 to v3 are frozen in `legacy/`.
2. One plan per year (`state.plans`), and one derived effective plan
   (`state.plan`, the latest year with entries) that the game and the adults'
   hub read unchanged.
3. Grades are the student's own targets. The app computes from them and never
   guesses them. Bonus points are named, never added.
4. Course families are opt in (Settings, or the button on a destination page).
5. One version for all three readers. The role changes who speaks, never what
   is true.
6. The game keeps its engine; its subject picker now opens the year page.

## Gates added to `tools/verify.mjs`

- Advice: every reported move is a conditional that really moves something.
- Grades: known plans give known L1R4, ELR2B2 and ELMAB3.
- PSLE: every uniform AL maps to a Posting Group or a sentence.
- Dashes: no dashes in v4 data a reader sees.

## Visual language: the night line (second pass, 2026-10-27)

The first v4 build kept v3's look (warm paper, terracotta, a serif, a
labelled card for everything) and read as generic. The second pass makes the
app's own metaphor literal: school is a transit line.

| Element | What it is | Why |
| --- | --- | --- |
| Palette | Night navy (`--night`) and signal yellow (`--accent`), cool paper, semantic transit hues unchanged | Beatty's own colours; yellow is the platform edge. No cream, no clay, no red |
| Type | Bricolage Grotesque (display and text) and JetBrains Mono (codes, grades, counts), both OFL, bundled | A sans with character for teenagers; mono makes every number read like a timetable |
| Icons | Phosphor bold, MIT, inlined | One maintained family instead of hand drawn glyphs |
| Year line | Sticky navy band, yellow track, station roundels P6 to After, phase labels, a YOU tag, a train that glides to the page you open | Wayfinding is the one motion that always plays |
| Station sign | Big mono code (S3) on a navy block with a yellow platform edge | Where you are, at a glance |
| Level switch | Three way pill with a sliding thumb in the level hue | One control per subject, feedback in the control itself |
| Departures board | Eight rows, data order, board words (Open, Nearly, Longer, Other road); rows flip when a tap changes them | The answer to every tap, in a form students read daily |
| Dock | The board folded into a bar on phones: count, next best move, eight lamps | The answer stays in view while the finger is on the list |
| Tickets | Advice as a ticket: stub with the move (G2 to G3), body that leads with what opens, the words to say, Keep punches it | Result first, then condition, then conversation |
| Score track | Aggregate drawn as a line, cut offs as stations, now as a hollow marker, target as the train | A gap you can see, with the grade steps named under it |
| Pass | My plan as a navy pass with the year line and each year's levels | The page that goes to the next conversation, and prints |

Shape system: controls are pills; cards, boards and tickets 18px; tiles 24px;
keys 12px. Motion: train glide, thumb slide, row flip, dock bump, ticket
punch, arrival stagger; all off under `prefers-reduced-motion`.

## Flow pass: the first five minutes (2026-10-31)

Problem: a first-time student did not know what to tap first. Fix:

- **Wordless intro** (first open only, skippable): switches feed one hub,
  every road out of it is drawn, lamps light, one switch slides up and two
  more light, none goes dark. Then "See what your levels open."
- **Guided start** (`screens/start.js`): year, core levels with the live
  signal above them, reveal, one next move with the words to say. Ends on
  "Saved. Next time, start here." Skip counts as done. Deep links skip it.
- **Live signal** (`ui/signal.js`): you wired to the eight destinations. A
  lit lamp on a solid wire is open; dashed is a move or more away; dotted is
  another way in; no wire is ever cut. It is the default answer everywhere.
- **Home is one next step**, computed from what the device holds.
- **Four nav items**: Home, My year, Explore, My plan.
- **Words switch** (`ui/labels.js`): plain words by default; Line mode turns
  on departures, tickets and a pass. Same visuals in both.

## The three questions (2026-11-11)

Audit of 6.0 against what Paths is for: showing possibilities, serving
parents and teachers too, goal setting, role play, an internal compass, and
ECG coaching.

| Area | Finding in 6.0 | Answer |
| --- | --- | --- |
| Two apps | A planner (levels, places, moves) and a game (wants, dispositions, reflection) that never spoke. What a student wanted was stored twice, as `goal` and `aim` | One record. The game's want is the compass's first interest; the game starts from Me and the goal, and hands back one line and one step |
| Who am I | One tap on six interests. Everything else about the student lived inside a game run | Me: a compass the student fills in. Interests, strengths with proof, values, and lines noticed |
| Goal | A place and its subject rules. No why, no date, no steps beyond levels, no review | Why, steps to tick, a date, the adult it was agreed with, and a second look when it is due |
| Past 17 | The line stopped at the 8 places | The long view: ages 12 to 65 to scale, ten markers, one open at a time |
| Adults | Two taps down in Explore. The lesson plan and counsellor guide described screens that no longer existed; two counsellor flows disagreed | Role sets the front door. What changed as four dates; a stream in today's words; a lesson that names the tabs; one session |
| Evidence | Claimed an ikigai feature no code backed, and a game that ran to 48 | Rewritten to what the app does |
| Facts | Admission rules checked from search engine extracts | Read from the primary MOE and SEAB pages; see `research/` |

### Decisions

1. **MOE's three questions are the spine.** Me (Who am I?), Goal (Where do I
   want to go?), Path (How do I get there?). Play rehearses all three; Saved
   is the record. The path stays home and sits in the middle of five tabs.
2. **The compass is authored, never computed.** The app keeps its refusal to
   type a student. It offers words to tap; it does not infer, score or match
   them. The only use made of a pick is ordering which sectors are shown.
3. **Private by default.** The compass is on a shared card only when the
   student switches it on. A link carries its ids, never typed words.
4. **Game mechanics stay in the fiction.** No points, streaks or badges on a
   real goal. The real side gets a date, a named adult and a tick.
5. **One surface added, two removed.** Me is new. Explore and Act are gone;
   their contents sit on Path and Goal, and their addresses forward.

### The compass, drawn

A navy disc with four points: Enjoy (north), Good at (east), Matters
(south), Aim (west). A point grows as it is filled. The needle rests on the
next point to fill and wavers until all four are in; then it settles on the
aim. The four hues are fixed, because the disc is navy in both themes. A
small form of the same drawing sits on the path, on Saved, on a shared card
and in the session.

### Gates added to `tools/verify.mjs`

- Seven: what comes across from 6.0, the compass limits, goal dates, what a
  link may carry, and that the lists the new screens read are whole.
- Reachable: five tabs, every screen within two taps.
