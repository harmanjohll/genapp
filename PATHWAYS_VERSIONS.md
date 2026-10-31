# Paths: version log

## Latest: v4.0.0, in `pathways/`. Build here.

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
| v4.0.0 | `pathways/` | **Latest** | 2026-10-27 to 2026-10-31 | Year by year planning, named advice, targets, conversation |
| v3.0.0 | `legacy/pathways-v3/` | Legacy, frozen | 2026-08-22 to 2026-08-23 | A new interface on v2's engine: the map as the product |
| v2.15.0 | `legacy/pathways-v2/` | Legacy, frozen | 2026-08-07 to 2026-08-20 | A full rebuild of interface, game and content on v1's engine |
| v1 | `legacy/pathways-v1/` | Legacy, frozen | 2026-08-07 | The first build: engine, ethics, three modes |

### v4 (latest)

**What is critical (keep these when building on it)**
- The ethics and invariants from v1: no destination is ever shown as locked; adding or raising a subject never moves a destination further away; nothing leaves the device; no ranking of destinations; no red.
- Storage key `pathways4.state.v1`. Renaming it loses every saved plan; write a migration if it must change.
- Lower secondary plans reach the destination rules through the Sec 3 projection (`assets/js/engine/years.js`). Without it, Sec 1 and Sec 2 levels change nothing.
- The 2028 admission rules were checked on 2026-10-27, from search engine extracts of the MOE, SEAB and institution pages (`research/`). Check the confirmed rows on moe.gov.sg before a class uses this. Course families stay provisional until the 2028 lists arrive in mid 2027.
- `tools/verify.mjs` runs 21 checks, including advice, grades, PSLE, dashes and syntax.

**What changed**
- One page per year, P6 to Sec 5, on a sticky year line, with a separate plan for each year.
- The advice engine names the subject, level and destination; it groups equivalent moves, finds pairs, and shows which levels hold doors open.
- P6: PSLE Score, Posting Group, Sec 1 starting levels.
- Targets: L1R4, ELR2B2 and ELMAB3 from entered grades, using the MOE mapping tables.
- 2028 rules corrected: JC and MI need all five L1R4 subjects at G3; the polytechnic fifth subject counts at its G2 value; the 3 year Higher Nitec is graded at G1; LASALLE and NAFA ask G3 English (provisional).
- Student, parent and teacher voices; My plan prints.
- The "night line" look: navy and yellow, Bricolage Grotesque and JetBrains Mono, Phosphor icons, all bundled.
- A guided start with a labelled intro; a live signal (you wired to the eight destinations); Home shows one next step; four nav items; a plain words or Line mode switch.

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
