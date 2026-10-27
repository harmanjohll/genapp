# Paths v4: design notes

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

1. `pathways4/` is a new folder; v3 is frozen.
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
