# Mind the Gap — a group game about generations

A self-contained, facilitator-run team game that helps a room understand
generational differences at work — and arrives, by design, at the point that
**the gap between us is about values, not birthdays.**

Open `index.html` in any browser (or via GitHub Pages). No build, no install,
no accounts.

## How it plays (as a group)

One shared screen (projector or big monitor). The facilitator drives it; teams
answer out loud, by held-up card, or a quick table vote.

1. **Set up teams** — 2–6 teams, named.
2. **Warm-up · Snap Judgment** — a workplace "voice" appears; teams guess which
   generation said it. The reveal shows it was heard across *all* generations,
   and names the value underneath. *No points — just notice how confident, and
   how wrong, the guessing feels.*
3. **Round 1 · Read the Value** — teams name the value a voice is protecting.
   **Scored.**
4. **Interlude · Decode Together** *(optional)* — an ambiguous phrase; the room
   discusses what it might protect. Bonus points for a sharp read.
5. **Round 2 · Mind the Gap** — a workplace clash that got blamed on age; teams
   diagnose the real values collision, then build the bridge. **Scored.**
6. **It's about values** — final scoreboard, the six values, a take-home habit,
   discussion prompts, and a saveable summary card.

Facilitator controls: **Reveal / Next** (or `→` / `Space`), **Back** (`←`), an
optional 45-second timer, and tap-to-award scoring on each reveal.

## The game design (objective · trade-off · learning)

- **Objective / win condition** — most points wins, and points come *only* from
  reading what a person **values**, never from guessing their generation.
- **Trade-off** — each team gets just **3 "Bold reads" for the whole game**.
  Every scored prompt: play **safe** (+5 if right, no downside) or go **Bold**
  (+15 if right, **−5 if wrong**). Bold reads are scarce, so teams face real
  opportunity cost — *spend it here, or save it for one we're surer of?* This
  rewards the exact skill the game teaches and lets a trailing team gamble a
  comeback.
- **Learning** — the scoreboard itself makes the argument: the teams who win are
  simply the ones who stopped guessing ages and started reading values. The
  closing debrief turns that into one habit to take back to the team.

## A note on sources & copyright

All game content — the voices, values, scenarios, and copy — is **original,
written for this game**. Generation names and year ranges are used only as
factual reference. No wording, layout, imagery, or framing from any briefing
deck or other source has been reproduced. The voices and scenarios are
illustrative, not quotes or data.

## Tech

Single HTML file. Vanilla JS (no framework). Tailwind Play CDN, Google Fonts,
and html2canvas are loaded from CDNs for polish, but the game is designed to
work if any of them fail to load (its own CSS handles all layout; the summary-
card download degrades gracefully to "take a screenshot"). Light, high-contrast,
projector-friendly theme; responsive down to phones.
