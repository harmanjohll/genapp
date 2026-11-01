# Paths: version log

## Latest: v4.2.0, in `pathways/`. Build here.

- Share **genapp/pathways.html**. It forwards to `pathways/`, which always holds the latest.
- Older versions are frozen in `legacy/`. Do not edit them, except to keep a link working.
- Before any push: `node pathways/tools/verify.mjs` (every sweep must say PASS).
- To release: `node pathways/tools/release.mjs x.y.z`, then add the notes to `pathways/data/version.json` and a line under the version below.

## Addresses

| Address | Opens |
| --- | --- |
| `genapp/pathways.html` | The latest (forwards to `pathways/`) |
| `genapp/pathways/` | The latest. Until 2026-10-31 this address was v1 |
| `genapp/pathways4/` | Forwards to the latest |
| `genapp/pathways2/`, `genapp/pathways3/` | Forward to their legacy folders |
| `genapp/legacy/pathways-v1/` to `-v3/` | The frozen versions |

The forwarding pages keep any `?query`, and remove any offline cache an old version registered at that address.

## Versions

| Version | Folder | Status | Dates | Built for |
| --- | --- | --- | --- | --- |
| v4.2.0 | `pathways/` | **Latest** | 2026-10-27 to 2026-11-01 | Year by year planning, named advice, targets, conversation |
| v3.0.0 | `legacy/pathways-v3/` | Legacy, frozen | 2026-08-22 to 2026-08-23 | A new interface on v2's engine: the map as the product |
| v2.15.0 | `legacy/pathways-v2/` | Legacy, frozen | 2026-08-07 to 2026-08-20 | A full rebuild of interface, game and content on v1's engine |
| v1 | `legacy/pathways-v1/` | Legacy, frozen | 2026-08-07 | The first build: engine, ethics, three modes |

### v4 (latest)

**What is critical (keep these when building on it)**
- The ethics and invariants from v1: no destination is ever shown as locked; adding or raising a subject never moves a destination further away; nothing leaves the device; no ranking of destinations; no red.
- Storage key `pathways4.state.v1`. Renaming it loses every saved plan; write a migration if it must change.
- Lower secondary plans reach the destination rules through the Sec 3 projection (`assets/js/engine/years.js`). Without it, Sec 1 and Sec 2 levels change nothing.
- The 2028 admission rules were checked on 2026-10-27, from search engine extracts of the MOE, SEAB and institution pages (`research/`). Check the confirmed rows on moe.gov.sg before a class uses this. Course families stay provisional until the 2028 lists arrive in mid 2027.
- `tools/verify.mjs` runs 24 checks, including advice, grades, PSLE, the lower lens, policy fixtures, dashes, syntax and white on fills.
- Sec 1 and 2 are judged by each destination's `lower` rules (`data/pathways.json`), not the SEC rules. `reach()` picks the set from the year (`lensFor`); `evalPlan` keeps raw Sec 1 and 2 rows next to the projection. Never put a subject count (`countAtLevel`) in a `lower` set: the lower lens check fails it. The SEC count is named once, in `lowerHorizon`.
- `engine/policy.js` pins verdicts MOE's rules decide (JC with Mother Tongue at G2 in Sec 2, R3, NAFA, PFP and Sec 5 grades, JC floors, HMTL, PG3 Foundation). If a rule changes, change the fixture with its source.
- Text on a coloured fill uses a theme token, never `#fff`: `--on-lv` on level and open colours, `--accent-ink` on yellow, `--sel-ink` on `--sel-bg`. The white on fills check fails any rule that breaks this.
- Visible words live in `assets/js/ui/labels.js`, in two sets: plain (the default) and Line mode. Add a label there, not inline, if it has a Line mode form.

**What changed**
- One page per year, P6 to Sec 5, on a sticky year line, with a separate plan for each year.
- The advice engine names the subject, level and destination; it groups equivalent moves, finds pairs, and shows which levels hold doors open.
- P6: PSLE Score, Posting Group, Sec 1 starting levels.
- Targets: L1R4, ELR2B2 and ELMAB3 from entered grades, using the MOE mapping tables.
- 2028 rules corrected: JC and MI need all five L1R4 subjects at G3; the polytechnic fifth subject counts at its G2 value; the 3 year Higher Nitec is graded at G1; LASALLE and NAFA ask G3 English (provisional).
- Student, parent and teacher voices; My plan prints.
- The "night line" look: navy and yellow, Bricolage Grotesque and JetBrains Mono, Phosphor icons, all bundled.
- A guided start with a labelled intro; a live signal (you wired to the eight destinations); Home shows one next step; four nav items; a plain words or Line mode switch.

**What changed in 4.2.0 (2026-11-01): advice that fits the year, SEC rules re-checked**
- Sec 1 and 2 have their own rules per destination, in lower secondary subjects. The last subject each place counts is left to Sec 3. Mother Tongue need not be G3 for JC or MI.
- In Sec 1 and 2, "Open now" reads "On track", and advice says "is on track". There are no SEC counts or aggregates in lower secondary advice; each place names its SEC count once, as a horizon line.
- Moves carry a Sec 3 note (Maths, Science, Humanities; the school sets the mark). Timing follows MOE: the school's review, often the end of Sec 1; humanities from Sec 2; the student asks and the school decides.
- P6: "What these choices put on track" (each PSLE choice, and each Posting Group at 21 to 22 and 25); a Higher Mother Tongue result input (Distinction or Merit qualifies, 2026 intake on); the Foundation option for Posting Group 3.
- SEC fixes: JC and MI need three of Humanities, Maths or Science at G3 (R3); NAFA and LASALLE need four at G3; grade targets apply each place's exclusions (PFP, Sec 5), Sec 5's G3 pass route and the JC and MI grade floors; bonus points are posting only; English is soft for the 3 year Higher Nitec.
- Sources and the extract only status are in `research/pse.md` and `research/years.md` (re-check 2026-11-01).

**What changed in 4.1.0 (2026-10-31): readable in dark mode, precise labels**
- Contrast: every screen and state passes WCAG AA in both themes (measured with a scan at 390 wide). Fixed: the not ready setup button, the Saved button on a move, game level chips, lesson step numbers, and older white on colour styles.
- Navigation: Home, Subjects, Pathways, Saved (was Home, My year, Explore, My plan).
- Tabs: Set levels, Best moves, Grade targets, Year guide; short forms on phones.
- States: Open now, 1 to 2 moves away, 3 to 5 moves away, Another route in.
- Destination names: Sec 5, NAFA or LASALLE, Higher Nitec (2 yrs), Higher Nitec (3 yrs). `data/pathways.json` keeps its alphabetical `order`, so the destination list order changed.
- Header chip reads "I am: Student"; buttons name their action (Save move, Copy words, Skip setup).

### v3 (legacy)

- **What is critical:** a real router (back button, URLs, reload), the map as the product, the rulebook in three levels of detail, the game staged turn by turn, the offline service worker, CSS in layers, 16 sweeps.
- **Why it was superseded:** it was still a toolbox. Plan ran to 3.8 phone screens. The year was a header chip. Lower secondary levels never reached the destination rules. Advice was generic ("one more at G2").

### v2 (legacy)

- **What is critical:** the game (journey v4: the chapter ladder, NS parity, door keys, the flag economy), the content style rules, the 2026 figures corrected with sources, five sweeps, and the tabletop multiplayer mode (only in v2; v3 and v4 link to it).
- **Why it was superseded:** no router (back exited the site); about 14 phone screens of scroll; Georgia rendered differently on every phone; a single 106KB CSS file.

### v1 (legacy)

- **What is critical:** the reach engine and its invariant, monotonicity, the data files with source and status on every figure, zero network calls, and the three modes (Now, Journey, the teacher and parent pages).
- **Why it was superseded:** v2 rebuilt the interface, the game and the content after the first audit.

## Starting the next version (v5)

1. Copy `pathways/` to `legacy/pathways-v4/` and commit that copy on its own.
2. Build v5 in `pathways/`; `node pathways/tools/release.mjs 5.0.0`.
3. Update this log: the Latest line, a v5 section, and v4 moved to Legacy with why it was superseded.
4. Keep `pathways.html` and the forwarding pages as they are; they need no change.
