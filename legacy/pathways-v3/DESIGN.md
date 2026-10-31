# Paths v3 — design spec

Version 3 of the pathways thinking tool. **v1 (`pathways/`) and v2 (`pathways2/`)
are frozen**; v3 is a greenfield rebuild in `pathways3/` with the same intention
and ethics, built from a fresh eleven-dimension audit of v2 (2026-08-22): six
code auditors, three independent reimagining passes, an engine cartography, and
a live screenshot walkthrough at 375/1366 in both themes.

Read v2's `DESIGN.md` and v1's `METHODOLOGY.md` first. Everything they refuse,
v3 refuses: no dead ends, monotonicity, no red, no verdicts on a student or a
family, no accounts, no network calls at runtime, all state on-device, static
files, no build step.

## The audit in one table

| Area | Finding in v2 | v3 answer |
| --- | --- | --- |
| Identity | The transit story map, the app's one screenshot-worthy artifact, appears once, after the game, as a receipt | **The map is the product.** It is the home screen, Plan's live consequence, Play's spine, and the ending. One drawing kit everywhere |
| Navigation | No `popstate` anywhere; the Android back gesture exits the site; reloads always land on the landing; a student who tapped "Straight in" is re-quizzed forever; satellites navigate by full page reload | A real router: `pushState`/`popstate` for every surface, URLs that reproduce the screen, back closes sheets, scroll policy, focus + `document.title` + live-region announcement per screen (the screen contract) |
| Entry | The guess is about the app's thesis, spoilable by the first classmate who shouts "all eight"; the guess UI sits four screens below eight near-empty cards; the year selector silently defaults to Sec 2 | First run is a 30-second conversation: **your year** (five big buttons) → **your guess, about you** → the reveal drawn on **your map**. Returning visits resume where you were |
| Plan | ~14 screens of scroll on a phone; consequences render above the controls; the reach summary wears an alert box; Act's and the counsellor's features stacked underneath | Subjects first, one section at a time; a sticky live strip (open count + map pips + what just moved); destinations one tap away; everything that was Act's moves to Act |
| Rulebook | `L1R4`, `ELMAB3(G2)`, PSE at full strength on first contact | Three altitudes: L0 a state word on the map · L1 one plain sentence · L2 the exact rule with source and status behind one fold. Acronyms never appear above L2, and every term is tap-glossed inline |
| Game staging | Results day is eight buttons in a list; the door "ceremony" is a bordered div with a 200ms pop; the ending is a ten-section scroll; the rail hides the hand mechanic below ~20 blocks on phones | A four-beat turn ritual (Arrive → Choose → Live → Keep); the envelope opens as an object; doors get a full-screen ceremony; the ending is the map drawing itself, then a card with exactly two buttons |
| Type | Georgia does not exist on Android; headings render fake-bold in four different serifs across the fleet | One bundled variable serif (**Literata**, OFL, 86KB latin subset, preloaded, `font-display: swap`) with honest 400/700 weights; system stack fallback with `Noto Serif` named |
| Eras | An 8–16% paper tint the build's own comments admit nobody saw | Eras stage four things: paper light (kept), a drawn skyline strip per life band, surface tint that moves with the paper, and tempo (`--tempo` duration multiplier). Semantic hues stay frozen |
| CSS | 106KB append-only monolith organized as a changelog; ~84 selectors silently overridden by later strata; one shipped bug (`var(--bg)` undefined = transparent commit bar) | `@layer tokens, base, components, screens` across small files; one definition per component; a rendered-CSS check in the sweep (undefined `var()` refs fail) |
| Satellites | Six of eight reachable only from footer links; money — "the most consequential page" — never surfaced inside the game; teacher page is a 436-line wall; audience `<select>` navigates on keyboard arrow (WCAG 3.2.2 fail) | Money/work/schools become **context at the point of need** (cost lines in destination sheets, a money line in every post-fork chapter, sectors from subjects) plus clean standalone pages for bookmarks; adults get one tabbed hub; the audience select becomes links |
| A11y | Mode switches are silent to screen readers; Plan has no h1; board mode scales almost nothing; dead CSS `--scroll-pad` fix; live region created too late | Screen contract in the router (h1, focus, title, announce); board mode scales the root tokens and forces high contrast; live region mounted at boot; the sweep gains contrast + rendered-CSS gates |
| Performance | ~120KB of eager JSON the first paint never reads; zero `modulepreload`; no offline story despite "it is on this device for good" copy | Eager list cut to what the first screen reads; `modulepreload` hints; a version-keyed cache-first service worker so visit two is instant and works offline |
| Copy | Beautiful, but 61% of card outcomes end on literary epigrams; chrome speaks in inner monologue; "one aphorism per screen" unenforced at screen level | Chrome is chrome (glanceable, ≤12 words); decision points allow no idiom; narrative keeps its voice; inline tap-gloss on first use of any glossary term |

## Decisions taken (2026-08-22)

1. **The map is the identity.** One SVG drawing kit (`ui/map.js`) renders the
   eight-destination network on home, the live pips in Plan, the growing line in
   Play, and the ending story map. Line hues are the four reach states at full
   chroma **only when drawn as lines**; as UI washes they stay quiet. No red,
   ever, and the map stays topological — never metric, never a ranking.
2. **Literata, not Georgia.** Committed to the repo, no CDN. (An earlier draft
   suggested Fraunces; rejected — overused to the point of anonymity.)
3. **v2's engine ports whole, sweeps first.** `rules/reach/project/pulse/
   possible/journey4` are pure and land verbatim (minus embedded-copy edits
   noted inline). `node tools/verify.mjs` must be green before any UI exists,
   and stays the gate.
4. **The data layer copies wholesale.** The 20 fact-checked JSON files with
   their `_meta`/source/status discipline are the most valuable artifact in the
   repo. Figures unchanged from v2 (checked 2026-08-05); re-eyeball confirmed
   rows against moe.gov.sg before a class uses this.
5. **The table (multiplayer) mode is not ported.** It remains available in v2;
   v3 links teachers to it. Reason: it is a facilitated variant, and v3's
   budget goes to the solo phone experience the audit found weakest.
6. **Deferred to v3.1, recorded here so they are not forgotten:** what-if ghost
   forks from the ending map; the plain-twin copy register toggle for all 28k
   words; QR carry codes; ZH/MS/TA parent page; consented alumni profiles for
   `stories.json`; per-line sound motifs.

## Architecture

```
pathways3/
├── index.html              shell + modulepreload/preload hints
├── sw.js                   version-keyed cache-first service worker
├── DESIGN.md · README.md
├── assets/
│   ├── fonts/              literata-var-latin.woff2 + OFL.txt
│   ├── css/                tokens3.css · base.css · app.css · play.css   (@layer discipline)
│   └── js/
│       ├── main.js         router + screen contract + shell chrome
│       ├── state.js        store (key pathways3.state.v1) · plan codec · URL ingestion
│       ├── data-loader.js  eager/deferred/top-up (mechanism verbatim, manifests retuned)
│       ├── sound.js        five cues verbatim, muted() injected
│       ├── engine/         rules · reach · project · pulse · possible · journey4
│       │                   copy-lint · ecg-lint · work-lint · schools-lint · evidence-lint
│       ├── ui/             dom · sheet · icons · glossary · map · scenes · storymap
│       └── screens/        home · plan · play · act · adults · info (money/work/schools)
├── data/                   copied from v2; copy.json chrome rewritten; version.json restarted
└── tools/                  verify.mjs (rewired, minus table sweep) · release.mjs
```

Storage key is `pathways3.state.v1`; v2 and v3 state never collide. Engine
modules import nothing from `ui/` or `screens/` and never touch
`document`/`window`/`localStorage`. The UI renders lists in data order and
never calls `sortReaches` for display.

## Interface

- **Home is your map.** The eight destinations as stations on a drawn network,
  coloured by live reach state, with one computed next-step card (no year →
  "Tell me your year"; empty plan → "Set your first subject"; plan set → "Play
  it forward"; run finished → "Pick your moves in Act"). Three doors carry live
  badges (subject count, saved-run age, commitment count). Trust line above the
  fold. Adults and money/work/schools reachable from a single More row.
- **First run** (once, resumable, skippable): year → guess-about-you → the
  reveal performed by the map — the network draws itself, all eight stations
  light, "All eight. Still yours. You guessed N." Then straight into Plan with
  one spotlighted chip.
- **Plan**: subject rows first, grouped, one tap per level chip; a sticky strip
  shows open count, eight map pips, and the last change (via `pulse()`); the
  destination list is a second segment, each row opening the three-altitude
  sheet (L0 word → L1 plain sentence → L2 exact rule + source chip + status).
  The lever and one next step close the screen. Nothing else.
- **Play**: see "The game restaged" below.
- **Act**: want → future → three moves this term, each phrased as words to say
  to a named adult; the ask-card (copyable) promoted; the carry link.
- **Adults hub** (`?s=adults`): four tabs — For parents (guest-play as the
  hero) · Run a lesson (task-ordered: the 45-minute shape first) · One student
  · What this is built on. The old `?mode=` URLs redirect.
- **Board mode** (`?board=1`): forces dark, scales the root token ladder,
  high-contrast; the class-code reveal is staged.

## Visual system

- **Type**: Literata (400–700, opsz) for display and narrative; system sans for
  chrome. Student body text floors at 17px equivalent; micro type floors at
  13px. No fake bold: only weights the face carries.
- **Two-voice palette**: the four reach hues and terracotta accent exist in two
  volumes — `--line-*` (full chroma, strokes in drawn SVG only, never on a word
  about a student) and the quiet wash voice (UI state, v2 values kept). Accent
  text on paper uses `--accent-dk` (AA); accent fills use `--accent`.
- **Eras**: paper `color-mix` kept; plus per-era skyline strip (drawn, five
  bands: void deck → campus/workshop → CBD → estate → your own block), surface
  tint that follows the paper, and `--tempo` (1.0 → 1.25 as decades pass). Dark
  mode is night in the same city: elevation by surface lightness, transit lines
  get a faint glow only after dark. Semantic hues never move.
- **Motion verbs**, each a token, all dead under `prefers-reduced-motion`:
  ARRIVE (content enters, staggered, max 4), DRAW (a line draws itself — the
  house signature), TRAVEL (a thing moves to where it now lives), OPEN (the
  door ceremony), SETTLE (state change in place). One easing family.
- **Press states** on every tappable (scale 0.98 + tone shift, ~90ms) — v2 had
  exactly one `:active` rule for a touch-first audience.

## The game restaged (engine unchanged)

- Four-beat turn ritual on one screen: **Arrive** (era skyline, age roundel,
  situation ≤2 sentences, dialogue styled as speech) → **Choose** (choice cards
  with a visible week budget; the hand of asks lives beside the choices, never
  below the fold) → **Live** (one commit bar — opaque, on `--surface`) →
  **Keep** (lived line, chance card resolved in place, the missed line, one
  Continue).
- **The envelope**: results day opens as a held object — full-screen envelope,
  press to open (button fallback, reduced-motion instant), the hope written at
  results eve printed on the slip, then eight platform cards with real entry
  asks (`forkNeed`), in data order.
- **Doors**: a full-screen ceremony — dim, a drawn door opens, light in the
  door's own line hue, the key travels to the line strip. Once per door,
  tap-to-skip, silent in board mode.
- **The line strip**: a persistent horizontal map at the top of Play; stations
  appear as chapters are lived; the roundel travels one station per turn
  (TRAVEL); refused roads stay as pale parallels.
- **The ending**: the story map draws itself (DRAW) at container width ×
  devicePixelRatio (v2 drew 1080px scaled to a smudge), then the card: ending
  frame title, roads still open, doors held, save PNG. Exactly two buttons:
  Keep this card · So what now → Act.
- **Compare**: two lines on one map, driven by the real diff rows (v2's bezier
  was decorative); the table survives as a fold-out.

## Content rules delta

v2's style rules and lint culture port whole (aphorism budget, dash ban, "You"
opener cap, MURKY list, word caps). New rules:

13. Chrome is chrome: buttons, chips, headings pass a two-second glance test;
    the reflective first-person voice is reserved for narrative surfaces.
14. No idiom, no metaphor at decision points (landing, NS ask, fork, ending
    choices) — extend the MURKY discipline to those strings.
15. Any glossary term is tap-glossed inline on first use per screen.
16. Screen-level composition budget: the sweep counts words before the first
    interactive control on each core screen.

## Verification gates (all must pass)

1. Reach invariant + monotonicity + class-code round-trip (ported, unchanged).
2. Projection sweep (ported).
3. Journey v4 sweep whole: chapter coverage, NS parity, door keys, flag
   economy, ending coverage, activity monotonicity (ported, unchanged).
4. Copy lint: v2 caps + chrome-glance + decision-point plainness additions.
5. Domain lints: ecg, work, money, schools, evidence (ported).
6. New: rendered-CSS check (no undefined `var()` references), eager-payload
   byte budget, token contrast pairs on every era paper.
7. Screenshots at 375 and 1366, both themes, no horizontal overflow.
8. `node tools/verify.mjs` green before every push; `?dev=1` runs the same
   sweeps in the browser.
