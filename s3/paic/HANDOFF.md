# AI Confident · Parents — Handoff to Claude Code

Working pack for continuing the parent workshop build in Claude Code. Open this folder
(`Desktop/Harman/Beatty/AI Confident Workshop/Parents/`) and start from here.

> First prompt to use in Code:
> *"Read HANDOFF.md. Confirm you can run the two HTML files. Part B (Build-Off teams + voting) is done; start Task 9 (printable docs)."*

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
| `Presenter.html` | The deck + facilitator control. Projected. You drive it Back/Next. 26 stages. |
| `Audience.html` | Each parent's companion on their own laptop. Follows the deck in lockstep, and becomes their printable / downloadable take-home card. |
| `AI_Confident_Parents_Facilitation_Plan.html` | The run-of-show / script (timings, what to say). A **separate** reference, not projected. Needs re-aligning to the 26 deck stages (see TODO). |
| `AI_Confident_Parents_Cards.html` | Printable reflection + take-home cards. Older structure; to be rebuilt as the 3-card learning log (see TODO). |
| `S3 PSG Collab_Brochure_23 june.pptx` | Reference: the cluster brochure with the parent-workshop synopsis. |
| `archive/` | Superseded PPTX iterations. Ignore unless you need history. |

---

## 2. How to run and test (local, no hosting needed)

1. Open `Presenter.html` in a full browser tab (Chrome or Arc full tab, **not** Arc's preview window). It defaults the room code to **BTY-AI** (top-left).
2. Open `Audience.html` in another tab → enter `BTY-AI` → Join.
3. Both go **green** within ~2s. Presenter shows **1 connected**. Click **Next** → the Audience screen follows.
4. Reset between runs with the Presenter's **⟳ New session** button (bottom-left).

The files need **internet** (they pull `mqtt`, `html2canvas`, and Google Fonts from CDNs). They are deliberately **not** offline-only, because the live cross-device sync requires a network.

---

## 3. Architecture (read before editing)

### Transport / sync
- **MQTT over secure WebSocket**, library `mqtt@5.10.1` loaded dynamically from jsDelivr (never a blocking `<script>` in `<head>` — that caused a hang on some networks; see `loadMqtt()` + `whenMqttReady()`).
- Broker: `const MQTT_URL = "wss://broker.hivemq.com:8884/mqtt"` at the top of **both** files. This is a **public test broker** — for the real day, swap it (and use a unique room code) so you never collide with strangers. The whole world can publish to a public topic; the session ID (below) stops them counting or steering, but a private broker/room is correct for production.
- Topic: `aiconf/<ROOM>/bus`. ROOM must match on both files (Presenter defaults BTY-AI; Audience types it, or use `?room=YOURCODE` on both).

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

### Stages (Presenter `STAGES` array — 26)
Welcome → Why we're here → The promise → **Confidence in** → What AI is (AIR) → **Q1** → reflex → **Q2** → reflex → Explorer Rooms → **Q3** → reflex → **Q4** → reflex → Break → **Build-Off** → **Q5** → reflex → What stays human → Polarities → Guardrails → **Reflection** → **Charter (5Ps)** → **Confidence out** → Three things → Close.
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

- 26-stage lockstep deck, quizzes interleaved with one-line reflex slides, monoline metaphor icons.
- Sync hardened: dynamic MQTT load, session IDs, audience locks to one presenter, mirrored content slides, **New session** reset (resets every connected screen).
- Quiz: tap-to-answer, changeable until the facilitator reveals; live vote bars + reveal pushed to all.
- Confidence bookends (live room average + delta).
- Reflections (What/So what/Now what + 3Rs) and Family Charter (5Ps) with the **unified default-on share toggle**; shared lines surface live on the Presenter.
- Learning log on the Audience: "Walking in / In the room (understood vs note) / Walking out", with **Print** and **Download .png** (html2canvas).
- Kopi-level Explorer Rooms, guardrails (incl. the memory one), "Build-Off" rename + framing.
- **Part B — Build-Off teams + voting.** Create-then-vote replaces the manual +/- scoreboard. Audience `hold` view has two phases: *name your team* (`send({type:"team", name})`) and *vote* (team buttons from the presenter broadcast → `send({type:"vote", team})`, one per device, changeable). Presenter collects unique names (`addTeamName`, case-insensitive dedupe), has an **Open voting / Back to naming** toggle (`toggleVoting` → `broadcastBuildoff`), and shows a **live tally in fixed order with the leader highlighted — no auto-sort**. Facilitator fallback kept: add-by-hand input + per-team manual `＋` vote + click-name-to-rename (`renameTeam` remaps votes). State: `teams[]`, `votes{voter→team}`, `manualVotes{team→n}`, `boPhase`.

## 5. State: TODO (in priority order)

### Task 9 — printable docs (align to the build)
- Rebuild `AI_Confident_Parents_Cards.html` as the **3-card learning log** mirroring the Audience log (Walking in / In the room: understood + to note / Walking out: charter + W·So·Now + confidence). Print 2-up on A4. This is the no-laptop / backup artefact.
- Re-align `AI_Confident_Parents_Facilitation_Plan.html` to the **26 deck stages** as the printed script. Facilitator cues live **here**, not on the projected deck (decided).

### Day-of / hosting
- Swap `MQTT_URL` (both files) to your own free broker (HiveMQ Cloud / EMQX / Ably) and set a unique room code.
- Host on **GitHub Pages**: push `Presenter.html` + `Audience.html`; parents open the Audience URL on their laptops, you open the Presenter URL on the projector machine. (Static hosting is fine — all logic is client-side; only the broker is external.)
- Pre-flight: test the full run on the actual venue Wi-Fi with two real devices; confirm the broker port isn't blocked; have the offline fallback in mind (deck still steps; sync just won't).

---

## 6. House style / voice (keep consistent)

Plain English, cumulative sentences, belief before rule, inclusive "we/our". No em-dashes in display copy. Avoid "journey, unlock, drive". Concrete Singaporean metaphors (kopitiam). Frameworks already woven: **4 Learns** (MOE COS 2026), **AIR**, **CLEAR**, **5Ps** (charter), **3Rs** (reflection), polarities, guardrails. Three critical learnings: head (intelligence comes from us), hands (sit beside), heart (protect what AI cannot grow).

## 7. Gotchas

- Public broker is **global** — unique room + own broker for production.
- Files require internet (CDNs). Don't "fix" this by inlining unless you also drop live sync.
- Edit the **Parents/** copies only.
- JS sanity-check after edits: extract the `<script>` and run `node --check`.
