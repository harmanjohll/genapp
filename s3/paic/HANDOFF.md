# AI Confident · Parents — Handoff to Claude Code

Working pack for continuing the parent workshop build in Claude Code. Open this folder
(`Desktop/Harman/Beatty/AI Confident Workshop/Parents/`) and start from here.

> First prompt to use in Code:
> *"Read HANDOFF.md. Confirm you can run the two HTML files. Part B (Build-Off) and Task 9 (printable docs) are done; the remaining work is day-of / hosting (swap the broker, host on Pages, venue Wi-Fi pre-flight)."*

---

## 0. Scope and boundaries

- **You own `Parents/` only.** The 3-hour cluster parent workshop (South 3 Cluster PSG, Sat 4 July 2026, Beatty Secondary).
- The sibling `../SLs/` folder (School Leaders, "Leading with AI") is owned by a **separate chat**. Do not touch it.
- Audience: parents of secondary-school children. Cluster event, so cluster styling (navy + gold), **no BTY crest**.

---

## 1. What this is

A self-contained **live workshop system**, two single HTML files that talk to each other over the internet:

| File | Role |
|---|---|
| `Presenter.html` | The deck + facilitator control. Projected. You drive it Back/Next. 30 slides. |
| `Audience.html` | Each parent's companion on their own laptop. Follows the deck in lockstep, and becomes their printable / downloadable take-home card. |
| `AI_Confident_Parents_Facilitation_Plan.html` | The run-of-show / script (timings, what to say). A **separate** reference, not projected. Aligned to the 30 deck slides. |
| `AI_Confident_Parents_Cards.html` | Printable reflection + take-home cards. Older structure; to be rebuilt as the 3-card learning log (see TODO). |
| `S3 PSG Collab_Brochure_23 june.pptx` | Reference: the cluster brochure with the parent-workshop synopsis. |
| `archive/` | Superseded PPTX iterations. Ignore unless you need history. |

---

## 2. How to run and test (local, no hosting needed)

1. Open `Presenter.html` in a full browser tab (Chrome or Arc full tab, **not** Arc's preview window). It defaults the room code to **BTY-AI-K7QX** (top-left; `ROOM_DEFAULT` constant — rename per event).
2. Open `Audience.html` in another tab → enter `BTY-AI-K7QX` → Join.
3. Both go **green** within ~2s. Presenter shows **1 connected**. Click **Next** → the Audience screen follows.
4. Reset between runs with the Presenter's **⟳ New session** button (bottom-left).

The files need **internet** (they pull `mqtt`, `html2canvas`, and Google Fonts from CDNs). They are deliberately **not** offline-only, because the live cross-device sync requires a network.

---

## 3. Architecture (read before editing)

### Transport / sync
- **MQTT over secure WebSocket**, library `mqtt@5.10.1` loaded dynamically from jsDelivr (never a blocking `<script>` in `<head>` — that caused a hang on some networks; see `loadMqtt()` + `whenMqttReady()`).
- Broker: `const MQTT_URL = "wss://broker.hivemq.com:8884/mqtt"` at the top of **both** files. This is a **public test broker** — for the real day, swap it (and use a unique room code) so you never collide with strangers. The whole world can publish to a public topic; the session ID (below) stops them counting or steering, but a private broker/room is correct for production.
- Topic: `aiconf/<ROOM>/bus`. ROOM must match on both files (Presenter defaults to `ROOM_DEFAULT` = BTY-AI-K7QX; Audience types it, or use `?room=YOURCODE` on both — the unguessable room is what keeps strangers off the public broker).

### Session integrity
- `SID` = a per-session id generated on Presenter load and regenerated on **New session**. Every message carries `sid`.
- Presenter ignores any message whose `sid !== SID` (excludes ghosts / cross-talk / stale tabs).
- Audience **locks onto the first facilitator it hears** (`mySid`), ignores a competing/stale Presenter, and adopts a new SID only on an explicit `reset`.

### Lockstep
- Presenter is the single controller. On Back/Next (and on each new `join`) it broadcasts the stage. **No constant re-broadcast** (that caused flicker). `broadcastStage()` sends `{type:"stage", id:<aud-type>, key:<stage-id>, q, title, eyebrow}`.
- Audience dedupes on `key` and only re-renders on a real change. Content slides ("watch") **mirror** the Presenter heading with "Eyes on the main screen".

### Message types (the wire protocol)
`join`, `hb` (heartbeat, presence), `stage`, `reveal`, `confidence` (phase in/out), `quiz` (q + answer), `rule` (facilitator-typed wall line), `submitted` (step), `share` (channel + key + text + on), `reset`.
*Part B (done):* `team` (audience names a team), `vote` (audience picks a team), and a presenter-driven `buildoff` (`phase` ∈ name/vote + `teams`), broadcast on stage entry and on every `join` so latecomers get the current phase.

### Stages (Presenter `STAGES` array — 30)
Welcome (essential questions + plan) → Why we're here → The promise → **Confidence in** → What AI is (AIR) → **▶ demo** → **Q1** → reflex → **Q2** → reflex → **Q3** → reflex → **Q4** → reflex → **Q5** → reflex → How to prompt (CLEAR) → **▶ demo** (thin vs rich) → **Explore & Build** → What stays human → Polarities → **Q6 (scam)** → **Q7 (fake image)** → Guardrails → **Reflection** → **Charter (5Ps)** → **Confidence out** → Three things → Close → **Feedback survey** (QR on the Presenter, "scan the screen" instruction on the Audience; go.gov.sg/s3psgfeedback26).
Notes: the 5 quick reads run as one round after "What AI is"; Explorer Rooms is folded into the one **Explore & Build** block (kopi out, no standalone break); two **▶ demo** signpost slides cue the facilitator to present live from the Claude app; two "staying safe" quizzes (scam, AI-faked image) sit before Guardrails and reference the new **Online Safety Commission** (from 29 Jun 2026). The Presenter persists its session to `localStorage` so a reload recovers (same SID/slide/tallies); **New session** clears it.
Bold = interactive. Each stage object: `{id, aud, q?, sub?, label}`. `aud` ∈ welcome/in/quiz/reflect/charter/hold/watch/out/log. Content slides render from the `CONTENT` map (+ `ICONS` monoline SVGs).

### Share component (default-on, opt-out)
- Audience: `shareHTML()/wireShare()/publishShare()` build a textarea + a pill toggle ("Shared with the room" / "Private"). Default **on**. Channels: `question`, `reflect`, `charter`. State in `S.share[key] = {text, on}`.
- Presenter: `shared = {question:{}, reflect:{}, charter:{}}`, keyed by `from/key`. `feedHTML()` renders feeds on the Confidence-in slide (questions) and Reflection slide; charter shares flow onto the Rules Wall tiles via `renderWallTiles()`.

### Presence / meters
- `roster` Map (id → lastSeen), pruned at >11s. Top bar shows **N connected** and **X / N submitted** (turns gold when all in). Submission keys are per-stage `sub`.

### Styling
- Presenter: bold-minimal, background **#000C53**, single gold accent (#e8b13c), Inter (heavy), tabular numbers, monoline SVG icons. `prefers-reduced-motion` respected.
- Audience: light "paper" theme (cream/navy/gold), mobile-first.

---

## 4. State: DONE

- 30-slide lockstep deck (5 quick reads as one round, 2 safety quizzes, a CLEAR block, 2 live-demo signposts, a closing feedback-QR slide), space-optimised for projection, Presenter reload-recovery, monoline metaphor icons.
- Sync hardened: dynamic MQTT load, session IDs, audience locks to one presenter, mirrored content slides, **New session** reset (resets every connected screen).
- Quiz: tap-to-answer, changeable until the facilitator reveals; live vote bars + reveal pushed to all.
- Confidence bookends (live room average + delta).
- Reflections (What/So what/Now what + 3Rs) and Family Charter (5Ps) with the **unified default-on share toggle**; shared lines surface live on the Presenter.
- Learning log on the Audience: "Walking in / In the room (understood vs note) / Walking out", with **Print** and **Download .png** (html2canvas).
- Kopi-level Explorer Rooms, guardrails (incl. the memory one), "Build-Off" rename + framing.
- **Part B — Build-Off teams + voting.** Create-then-vote replaces the manual +/- scoreboard. Audience `hold` view has two phases: *name your team* (`send({type:"team", name})`) and *vote* (team buttons from the presenter broadcast → `send({type:"vote", team})`, one per device, changeable). Presenter collects unique names (`addTeamName`, case-insensitive dedupe), has an **Open voting / Back to naming** toggle (`toggleVoting` → `broadcastBuildoff`), and shows a **live tally in fixed order with the leader highlighted — no auto-sort**. Facilitator fallback kept: add-by-hand input + per-team manual `＋` vote + click-name-to-rename (`renameTeam` remaps votes). State: `teams[]`, `votes{voter→team}`, `manualVotes{team→n}`, `boPhase`.

- **Task 9 — printable docs.** `AI_Confident_Parents_Cards.html` is now the **3-card Learning Log** (Walking in: name + confidence + question · In the room: the 5 reflexes as a tick-and-note checklist · Walking out: the 5-P charter + W·So·Now + confidence in→out), mirroring the Audience log, prints 2-up on A4 — the no-laptop backup. `AI_Confident_Parents_Facilitation_Plan.html` run-of-show is **re-aligned to the 26 deck stages**, stage-numbered to the Presenter's "Stage N" counter and grouped into the five movements (Frame 1–4 · Head 5–9 · Hands 10–14 · Break 15 · Build-Off 16–18 · Heart 19–21 · Reflect &amp; Charter 22–26); the old "Prompt Olympics" section is now the **Build-Off run sheet** (create-then-vote). Cues live in the plan, not on the projected deck.

## 5. State: TODO (in priority order)

### Day-of / hosting
- **Broker (decided):** keep the **public** `MQTT_URL`; isolation comes from the **unguessable room** `ROOM_DEFAULT` (BTY-AI-K7QX) plus the per-session `SID`. Rename the room per event. (A private broker would only push throwaway creds into a world-readable static file, so it buys little for a one-off.)
- **Hosting (GitHub Pages):** this repo (`genapp`) is already a static-app collection served by Pages (root `.nojekyll`, default branch `main`). `s3/paic/index.html` links the two screens. **Publish by merging this branch into `main`** — then:
  - Presenter: `https://harmanjohll.github.io/genapp/s3/paic/Presenter.html?room=BTY-AI-K7QX`
  - Audience:  `https://harmanjohll.github.io/genapp/s3/paic/Audience.html?room=BTY-AI-K7QX`
  - or share the landing page: `…/genapp/s3/paic/`
- Pre-flight: full run on the actual venue Wi-Fi with two real devices; confirm WSS port 8884 isn't blocked; offline fallback in mind (deck still steps; sync just won't).

---

## 6. House style / voice (keep consistent)

Plain English, cumulative sentences, belief before rule, inclusive "we/our". No em-dashes in display copy. Avoid "journey, unlock, drive". Concrete Singaporean metaphors (kopitiam). Frameworks already woven: **4 Learns** (MOE COS 2026), **AIR**, **CLEAR**, **5Ps** (charter), **3Rs** (reflection), polarities, guardrails. Three critical learnings: head (intelligence comes from us), hands (sit beside), heart (protect what AI cannot grow).

## 7. Gotchas

- Public broker is **global** — unique room + own broker for production.
- Files require internet (CDNs). Don't "fix" this by inlining unless you also drop live sync.
- Edit the **Parents/** copies only.
- JS sanity-check after edits: extract the `<script>` and run `node --check`.
