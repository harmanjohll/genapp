# Paths v2 — design spec

Version 2 of the `pathways/` ECG tool. **v1 is frozen**: not one file in `pathways/`
changes, by owner decision (2026-08-05). v2 is a full rebuild of all three modes,
the landing, the navigation, the game, the content and the visual identity, on
top of v1's engine and ethics, with every audit finding answered here.

Read v1's `METHODOLOGY.md` first. Everything it refuses, v2 refuses. The two
invariants (no dead ends, monotonicity) and the sweep culture carry over whole.

## Why a v2 exists: the audit in one table

| Area | Finding in v1 | v2 answer |
| --- | --- | --- |
| Contract bug | Destination list re-sorts by state and distance on every tap (`sortReaches` + a no-op `.order` sort; `reach()` never returned `order`) | `reach()` returns `order`; lists render in data order, always |
| Contract bug | Class code bitmask built from the sorted list, so every mask is a prefix of 1s; the teacher's "room holds N of 8" is the strongest student's count | Mask built in data order; round-trip tested in the sweep |
| Contract bug | Compare breaks on long-vs-short runs (dot columns, "You both hold ·") | Compare aligns on shared chapters, names the short run's chosen stop |
| Bug | `.kind-chip` and `.diff-combo` chip styles never written | Styled; a lint step fails on JS classes absent from CSS |
| Fact error | MI shown as L1R4 ≤ 16 "same as JC" | MI is L1R4 ≤ 20; wider entry is the point of MI |
| Stale | Glossary teaches JAE; this cohort uses the PSE (one portal, from 2028) | PSE entry; JAE marked historical |
| Stale | "Nitec, 2 years, then Higher Nitec" describes the abolished 2+2 ITE | 3-year Higher Nitec, Nitec as exit award after Year 2 |
| Stale | PFP framed as a G2-audience route | Cluster admission (AY2026); open to any level mix (AY2028) |
| Content | National Service absent from a 35-year Singapore life | NS chapters, asked in fiction at the post-secondary juncture |
| Content | Zero named places/people/dialogue; 95% of outcomes the same two-sentence shape; nothing can hurt | World-kits, dialogue, one true cost per run, style rules linted |
| Content | 12 of 27 flags write-only; `needsDoor` unused; `endingFrames` dead | Every flag pays off; doors gate late choices; endings authored per want |
| Game feel | Rewards all land at one size; opportunity cost never rendered; 2 taps of "Continue" per year | Ceremony scales with rarity; the undone thing gets a line; beats merged |
| Pacing | 18–24 (the years a student can taste) got 4 turns; 27–48 got 5 | Chapter ladder: dense milestones 17–25, three set-pieces after 27 |
| UX | Landing = a wall of 31 subject rows; Now never funnels to Journey; Aim orphaned | Landing with predict-then-reveal; nav is the loop Plan → Play → Act |
| Design | The game wears the planner's clothes; one visual temperature for 35 years | Life-stage palettes, scene per chapter, reward ceremony, dark mode |
| Sound | None, and no hook for it | Five synthesised cues, off by default, mute-respecting |

## Decisions taken by the owner (2026-08-05)

1. **v1 frozen.** All fixes land in v2 only. v1 stays as the control.
2. **NS is asked at the appropriate juncture** — after the results fork, as the
   first post-secondary chapter opens, in fiction, once. If no: logged, moved
   past, never mentioned again. No gender is ever asked or stored.
3. **Full rebuild of all three modes**, plus landing and navigation.
4. Sound included, off by default.

## Architecture

```
pathways2/
├── index.html            landing + app shell
├── DESIGN.md             this file
├── assets/
│   ├── css/              tokens2.css · base.css · components.css · stages.css
│   └── js/
│       ├── main.js · state.js · data-loader.js · sound.js
│       ├── engine/       rules.js · reach.js · project.js  (ported, small fixes)
│       │                 journey4.js · copy-lint.js        (new)
│       └── modes/        landing.js · mode-now.js · mode-journey.js
│                         mode-aim.js · mode-teacher.js · mode-parent.js
└── data/                 corrected + rewritten JSON, same _meta discipline
```

Ported with intent (not rewritten): `rules.js`, `reach.js` (+`order` in the
result, class code in data order), `project.js`, `dom.js`, `sheet.js`,
`glossary.js`, `icons.js` (extended), the sweep culture. Storage key is
`pathways2.state.v1`; v1 and v2 state never collide.

## The chapter ladder (Journey v4)

School years stay calendar years; after the fork, **turns are chapters named by
milestone, with age as a caption**. Life density, not arithmetic.

| # | Chapter | Age | Notes |
| --- | --- | --- | --- |
| 1–4 | Sec 1 · Sec 2 · Sec 3 · Sec 4 | 13–16 | Calendar years, raises real, narrated from inside the age |
| 5 | The envelope | 17 | Fork → `academic` / `applied` / `hands` / `arts` |
| 6 | **Before it starts** | 17 | **The NS question**, one screen, logged to `run.ns`, never re-asked |
| 7–9 | Three chapters per family | 17–21 | e.g. applied: First semester → The internship → Graduation season. hands: Year one, workshop → The exit decision (Nitec exit vs continue — the new ITE architecture as a story beat) → Higher Nitec final |
| NS | Enlistment · ORD | ~19–21 | Dealt only when `run.ns`; position varies by family (academic serves before uni, applied/hands/arts after graduating). The mixer chapters: all four families in one bunk |
| 10 | First pay cheque | 23–25 | Convergence begins; want check-in beat |
| 11 | The crossroads | 27 | Fork, full bleed |
| 12 | Building | 30–34 | One chapter, not two |
| 13 | The quiet year | 38 | Reflect, kept from v1 |
| 14 | **The form comes home again** | ~41 | The mirror chapter: someone younger brings you the combination form |
| 15 | Where you stand | 48 | Ending feeds authored frames |

Engine requirements:

- Stages carry `chapter`, `age`, optional `requiresNS: true` / family variants.
- The NS question is a stage of `format: "ask-ns"`: two options, neutral words,
  writes `run.ns`, grants nothing, no points. Choosing no is one tap and done.
- **NS parity invariant (new):** across the full simulation grid, `ns: true`
  runs and `ns: false` runs must not differ materially in doors (same two-sided
  5% spread used for combinations). NS adds chapters and texture, never size.
- **Doors are keys:** late chapters (10+) each carry ≥1 choice gated by
  `needsDoor`, and the sweep asserts every such stage still offers ≥2 ungated
  1-point choices. Door grants rebalanced (v1: 29 of 61 grants were `d_people`).
- **Opportunity cost renders:** every choice may carry `missed`, one authored
  line for the road not taken ("The band went on without you."). The lived
  screen shows the top undone choice's `missed` line. Costs touch the story,
  never the option set.
- **Beats merged:** chance response resolves into the lived screen; one
  Continue per year, not two.
- **Ceremony scales:** a door opening is a full-width moment with its own cue,
  not a chip beside "+1 Persistence".
- **Staged onboarding:** year one is pure picking; the hand deals in year two;
  the want check-in appears at chapter 10.
- `endingFrames` revived: keyed on want × dominant track × ns, authored text,
  "Not sure yet" a first-class key. The Aim mode's "By 48…" template becomes
  age-aware (v1 printed "By 48" for runs that stopped at 18).

## Content style guide (linted where possible)

1. Every screen owns at least one concrete noun. Public places real (MRT
   lines, towns, institutions, named policies); private ones invented but
   specific ("the zi char stall at Blk 214", "your uncle's aircon crew in
   Tampines"). Never a real small business or private person.
2. Dialogue exists. Teens, aunties, sergeants, bosses. Singlish where a real
   speaker would use it, warm, never mocked, never phonetically exaggerated.
3. **One aphorism per screen, maximum.** The lint counts aphorism shapes
   ("X, not Y", "which is …", "That is …") per string.
4. Sentence-shape variety: at most 30% of card outcomes may open with "You".
   No two outcomes in the deck share a first clause. Linted.
5. School years are narrated from inside the age; the memoir voice is earned
   from 27 up.
6. Money is real numbers with `_meta` sources: NSF allowance, poly starting
   pay bands, what a room costs. Never a verdict on a family's money.
7. Setbacks hurt first, then are survivable, and the survival names amounts
   and offices (v1's own rule, now applied to feelings too). One true cost
   per run: something a student wanted goes away and stays away; every
   *option* remains open. EAE genuinely does not come round again.
8. Every flag has at least one callback card that names the earlier moment.
9. NS content is specific and respectful: the cookhouse, the book-out bag,
   the platoon mate from the path you didn't take. Never partisan, never
   gory, never a recruitment ad or a complaint.
10. No hyphens or dashes in student-facing copy (v1 rule, kept, linted).
11. Mother tongue is a card family, not a subject id. Tuition, the retake,
    the grandparent conversation.
12. v1's caps stay; entries the weakest readers rely on stay a little longer.

## Interface

- **Landing:** first visit gets one screen: "Eight places you could go after
  secondary school. How many stay reachable no matter which subjects you
  pick? Guess." Tap a number, see the answer (all eight have a road), then
  three doors: **Plan** (Now) · **Play** (Journey) · **Act** (Aim). Returning
  visits skip to the last mode; the landing stays one tap away on the brand.
- **Navigation is the loop, not tabs:** Plan → Play → Act, in that order, with
  the connective tissue: Now carries "Play these subjects forward"; the ending
  carries "So what now?" into Aim; Aim carries "Check what this reaches" back
  to Now. Words (glossary), year selector and audience switch stay quiet.
- **Return loop:** a device-local line, no scheduling, no data: near the
  subject-review window (term 4), Now says "Your levels can move soon. Two
  minutes: is the lever still the same?"
- **Visual identity:** one palette per life band (school / post-sec / twenties
  / thirties / forties+) shifting subtly under the same tokens; a drawn scene
  per chapter (inline SVG, currentColor discipline kept); the compare screen
  draws two route-lines that diverge and reconverge (the thesis as a picture);
  the ikigai blob replaced by four labelled bars; dark mode via
  `prefers-color-scheme` plus a toggle; `?board=1` becomes theatre (huge type,
  staged class-code reveal). Level hues stay equal-weight; reach states keep
  four colours and no red; distance still never renders.
- **Sound (`sound.js`):** five synthesised cues (year lived, chance arrives,
  door opens, the fork, the ending), WebAudio, no assets, **off by default**,
  one visible toggle, persisted, silent in board mode unless enabled,
  respects `prefers-reduced-motion` as a mute signal.

## Data corrections (fact-checked 2026-08-05; MOE pages corroborated via multi-source extracts)

| Item | v2 value | Status |
| --- | --- | --- |
| JC (2028) | L1R4 ≤ 16, five G3 subjects; floors EL C6, G3 Maths D7, MTL D7 | confirmed |
| MI (2028) | **L1R4 ≤ 20**, same subject rules as JC, wider entry | confirmed |
| Poly Y1 (2028) | Four G3 + one G2 B-subject; ELR2B2 ≤ 22 (nursing 24); course MERs publish mid-2027 | confirmed / provisional |
| PFP | ELMAB3(G2) ≤ 12; clusters from AY2026; any level mix from AY2028 | confirmed |
| DPP | Last intake AY2027; replaced by direct Year-2 Higher Nitec entry, ELMAB3 ≤ 19 | confirmed |
| ITE | 3-year Higher Nitec is the architecture; Nitec is an exit award; `nitec_to_hnitec` route is 3 years, not 4 | confirmed |
| ITE → poly | Net GPA ≥ 2.5 to apply (AY2027 on); raw GPA ≥ 3.5 guaranteed a place | confirmed |
| Fifth year | Criteria as v1, plus: all-G3 fifth year needs gross ELMAB3(G2) ≤ 19 | confirmed |
| PSE | Replaces JAE from 2028: one portal, mid-Jan results, choice order breaks ties, EAE/DSA continue | confirmed |
| SkillsFuture | $4k MCC at 40 (May 2024); >36,000 first-year take-up (date the figure); MCTA 50%, $300–$3,000, part-time $300 from 1 Mar 2026; MCES 90% AY2025 | confirmed |
| Still provisional | Drama/D&T/Music at G2; ESS SEC code; per-school availability; poly course MERs until mid-2027 | provisional |

Combined Humanities note: at G3 the elective half can also be Literature in a
Mother Tongue Language; footnoted in the availability sheet.

## Verification gates (all must pass before anything ships)

1. Reach invariant + monotonicity (ported, unchanged).
2. Projection sweep (ported).
3. Journey v4 sweep: chapter coverage (≥8 eligible cards per chapter per
   family per NS state), stretch on every `needsAsk`, ≥2 ungated 1-point
   choices beside any door-gated choice, combination parity (two-sided 5%),
   **NS parity (two-sided 5%)**, every flag read somewhere, every door
   granted somewhere and asked for somewhere, endings resolve for every
   want × ns × track.
4. Copy lint: v1 caps + dash rule + aphorism budget + "You"-opener ratio +
   first-clause uniqueness + JS-class-exists-in-CSS.
5. Class code round-trip: two synthetic students' codes union to the true
   destination union.
6. Scripted playthroughs: long/short × NS yes/no × two wants, plus compare.
7. Screenshots at 375 and 1366, both themes, no horizontal overflow.
