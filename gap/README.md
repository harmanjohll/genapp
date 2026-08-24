# Mind the Gap — a game about generations

A self-contained web game that helps people understand generational differences
at work — and arrives, by design, at the point that **the gap between us is
about values, not birthdays.**

Open `index.html` in any browser (or via GitHub Pages). No build, no install,
no accounts. Two ways to play:

- **Group** — facilitator-run on a shared screen; 2–6 teams answer by shout,
  card, or table vote, and the facilitator awards points on each reveal.
- **Solo vs Computer** — one player taps their own answers on any device and
  plays against a computer opponent. Great for testing, or a quick warm-up.

The current build number shows in the **bottom-right corner** of the game;
`CHANGELOG.md` lists what changed in each version.

## The flow (both modes)

1. **Warm-up · Snap Judgment** — a workplace "voice" appears; you guess which
   generation said it. The reveal shows it was heard across *all* generations,
   and names the value underneath. *No points — just notice how confident, and
   how wrong, the guessing feels.*
2. **Round 1 · Read the Value** — name the value a voice is protecting. **Scored.**
3. **Interlude · Decode Together** *(optional)* — an ambiguous phrase; weigh what
   it might mean. Discussion only.
4. **Round 2 · Mind the Gap** — a workplace clash blamed on age; diagnose the real
   values collision, then build the bridge. **Scored.**
5. **It's about values** — final scoreboard, the six values, a take-home habit,
   discussion prompts, and a saveable summary card.

## The game design (objective · trade-off · learning)

- **Objective / win condition** — most points wins, and points come *only* from
  reading what a person **values**, never from guessing their generation.
- **Trade-off** — each side gets just **3 "Bold reads" for the whole game**.
  Every scored prompt: play **safe** (+5 if right, no downside) or go **Bold**
  (+15 if right, **−5 if wrong**). Bold reads are scarce, so you face real
  opportunity cost — *spend it here, or save it for one you're surer of?*
- **Learning** — the scoreboard itself makes the argument: whoever stops guessing
  ages and starts reading values wins. The closing debrief turns that into one
  habit to take back to the team.

## Solo vs Computer

- **Three difficulty levels** — Rookie / Pro / Sage — change how accurately the
  computer reads values *and* how shrewdly it bets its own Bold reads.
- **Streaks** — consecutive correct reads build a 🔥 streak; every third in a row
  earns a bonus.
- **Keyboard** — `1`–`6` pick an answer, `Enter` locks in Safe, `B` goes Bold,
  `←/→` navigate.
- The computer reacts to each round, and the finale tells you whether you
  out-read the machine.

## Facilitator notes (group mode)

- **Reveal / Next** (`→` / `Space`), **Back** (`←`), an optional 45-second timer,
  and tap-to-award scoring on each reveal (Safe / ⚡ Bold win / ⚡ Bold miss per
  team, plus discussion bonuses).
- **Shuffle** is on by default, and each round draws from a slightly larger pool
  than it plays (8 value-reads → 6 shown, 4 scenarios → 3, 3 decodes → 2), so
  repeat sessions differ.
- A 🔊 sound toggle sits in the top-right; sound is on by default.

## A note on sources & copyright

All game content — the voices, values, scenarios, and copy — is **original,
written for this game**. Generation names and year ranges are used only as
factual reference. No wording, layout, imagery, or framing from any briefing
deck or other source has been reproduced. The voices and scenarios are
illustrative, not quotes or data.

## Tech

Single HTML file. Vanilla JS (no framework). Tailwind Play CDN, Google Fonts,
and html2canvas are loaded from CDNs for polish, but the game is built to work
if any of them fail to load — its own CSS handles all layout, sound is generated
with the Web Audio API (no audio files), confetti is drawn on a canvas (no
library), and the summary-card download degrades gracefully to "take a
screenshot." Light, high-contrast, projector-friendly theme; responsive to
phones; respects `prefers-reduced-motion`.
