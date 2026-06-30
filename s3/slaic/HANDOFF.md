# Leading with AI (SL workshop) — handoff to Claude Code

A working session for school leaders. Parent workshop structure, leader altitude. Built in Cowork; moving to Claude Code for hosting and iteration. This file is the source of truth for the build. Read it first.

## What this is

A live, two device workshop. A facilitator drives a console on the main screen; every leader follows on their own device, synced live. Plus a run sheet and a printable card. Target room: 40 to 45 leaders, one device each, 40 to 45 minutes.

## Files in this folder (`SLs/`)

| File | Role | Touch? |
|---|---|---|
| `leadai.html` | The original scrollytelling session. The **content canon** and the deep reference each leader carries home. | **Do not edit.** Port ideas out of it; never change it. |
| `leadaipacket.md` | The working content pack (research, quick wins, demos, task cards, ship steps). Background source. | Reference only. |
| `index.html` | Landing page. One URL for the room; links Presenter, Audience, the run sheet, the reference, the cards. | Active. |
| `Presenter_SL.html` | Facilitator console. Drives the deck, aggregates live responses. | Active. |
| `Audience_SL.html` | Participant companion. Follows the console, collects each leader's input, builds their card. | Active. |
| `SL_Facilitation_Plan.html` | Run sheet: clock, the Relay script, tensions, guardrails, pre flight. | Active. |
| `SL_Cards.html` | Printable cards (paper fallback for the card the app builds). | Active. |

## Architecture (how the pair works)

- **Presenter** holds `STAGES` (the ordered deck), `QUIZ` (five leader level reads), `CONTENT` (watch slides). It advances stages and tallies what comes back.
- **Audience** is a lockstep router. It does not navigate itself; it renders whatever stage the presenter broadcasts, and sends the leader's responses back.
- They talk over **MQTT on a WebSocket**. The presenter is the only navigator. A session id (`SID`) isolates one run from ghosts and stale tabs; "New session" mints a fresh `SID` and clears every connected screen.

## The MQTT contract (do not break this)

Both files must agree exactly on these four constants (byte for byte):

```
MQTT_URL  = "wss://broker.hivemq.com:8884/mqtt"   // swap for your own 443 endpoint
TOPIC_NS  = "leadai-bty"                           // topic = leadai-bty/<ROOM>/bus
MQTT_USER = ""                                     // broker username, if the broker needs auth
MQTT_PASS = ""                                     // broker password, if the broker needs auth
```

Default room is `BTY-SL`. Override with `?room=XYZ` on either URL.

Message types on the bus: `stage` (carries `rev` for quiz stages), `reveal`, `reset`, `reqmine` (presenter to room); `join`, `hb`, `req`, `confidence`, `quiz`, `share`, `submitted` (room to presenter). `req` asks the presenter to resend the current stage; `reqmine` asks every leader to resend their own answers (used after a presenter reload so aggregates rebuild). The presenter's `aud` id on each stage maps 1:1 to a case in the Audience router: `welcome, in, quiz, reflect, charter, hold, watch, out, log`. If you add a stage type, add both sides.

Reliability notes: the presenter rebroadcasts the current stage on a low cadence (a beacon) so a desynced leader reconverges within a few seconds; the Audience render is idempotent (it skips no-op rebroadcasts, re-renders if its view was lost). The presenter persists its session id in `localStorage`, so an accidental reload resumes the same run rather than orphaning every screen; "New session" still mints a fresh id and clears everything.

Verified at handoff: both script blocks pass `node --check`; the four constants match; every `aud` id has a router case.

## Conventions

- **Writing rules (hard).** No hyphens, en dashes, or em dashes anywhere in copy; use commas, colons, semicolons, or rephrase. No AI tells. "Beattyian" and "Beattyians" always capitalised. Match the register of `leadai.html`: lean, declarative, a point of view.
- **Theme.** Shared tokens with `leadai.html` so the live session and the take home read as one piece. Presenter is the dark variant (`--bg:#13242a`, accent `--accent:#9ec7bd`); Audience and the print pieces use the paper variant (`--paper:#f4f1ea`, accent `--accent:#2f7d72`), serif Georgia throughout.
- **Content is downstream of `leadai.html`.** Every beat in the deck traces to a section there: frame, premise, PILOT, loop, agent, govern, forces, HEART, mirror, 5Ps, flash, build, the Relay, close. If you change a message, change it in the deck, not in `leadai.html`.
- **BTY institutional facts** (mission, frameworks, theme history, the footer band) live in the `bty-context` skill. Use it for any BTY facing peripheral.

## Done

- The four part system built and wired.
- Five reads pitched at leader level: agent vs chatbot, the cohort records data boundary, what stays yours across Sergiovanni's forces, the one voice skill risk, postures not a ladder.
- Live interactions: readiness poll with a walking in to walking out delta; Command Charter on the 5 Ps; reflection plus belief shift feeding a downloadable command card; the Relay tally.

## Next (backlog, roughly ordered)

1. **Host on GitHub Pages** (steps below). `index.html` now exists in this folder and links every piece, so the room URL is the folder itself.
2. **Provision the port 443 broker (the one open item that needs an account).** The code is ready: both files read `MQTT_URL`, `TOPIC_NS`, `MQTT_USER`, `MQTT_PASS`, and pass auth to `mqtt.connect`. You still need to stand up a broker that serves WSS on **port 443** (non standard ports like 8884 are blocked on many mobile and corporate networks, which defeats the "any network" goal). Options: a managed MQTT service that natively serves `wss://host:443/mqtt`, or a small broker fronted by Cloudflare on 443. Scope the credential to `leadai-bty/<NS>/#`, set the four constants in both files, and confirm reachability with the cross network test below. Rotate the credential after the event.
3. **Rehearse across networks.** Confirm a join from a phone on mobile data (not only the venue wifi), and from a second carrier. Confirm the two CDN scripts (`mqtt`, `html2canvas`) load; if a network blocks them, the new connection failure UX says so honestly and points at the paper card.
4. Optional: a presenter side export of the wall and reflections.

Done since the original handoff: reconnect and rejoin recovery (beacon, `req`, `reqmine`, idempotent render, persisted session id); honest connection failure UX in both files; the `index.html` landing page; a unique topic namespace and auth scaffolding for the broker move.

## Hosting (multi file, no build)

These are standalone HTML files. No bundler, no framework.

1. In the repo that backs your Pages site, create a folder, for example `leading-with-ai/`.
2. Commit all of `SLs/` into it (or just the four active files plus `index.html`).
3. Settings, then Pages, deploy from branch, root. Wait a minute or two.
4. URLs become `https://harmanjohll.github.io/<repo>/leading-with-ai/Presenter_SL.html` and `...Audience_SL.html`.
5. Open both, confirm the connected count climbs and the Audience follows Next. Test on the venue wifi, not a hotspot.

## Proposed repo structure (confirm or change)

```
<your-pages-repo>/
  leading-with-ai/
    index.html              # landing: links the four pieces (to build)
    Presenter_SL.html
    Audience_SL.html
    SL_Facilitation_Plan.html
    SL_Cards.html
    leadai.html             # the reference, hosted alongside
    HANDOFF.md
```

Tell Claude Code the repo name and whether you want a top level folder or a dedicated repo, and it can lay this out and push.

## Run locally

Open any file directly in a browser. For the live pair, open `Presenter_SL.html` in one tab and `Audience_SL.html` in another, join `BTY-SL`, and drive with Next. No server needed; the broker is remote.
