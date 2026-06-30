# Leading with AI (SL workshop) — handoff to Claude Code

A working session for school leaders. Parent workshop structure, leader altitude. Built in Cowork; moving to Claude Code for hosting and iteration. This file is the source of truth for the build. Read it first.

## What this is

A live, two device workshop. A facilitator drives a console on the main screen; every leader follows on their own device, synced live. Plus a run sheet and a printable card. Target room: 40 to 45 leaders, one device each, 40 to 45 minutes.

## Files in this folder (`SLs/`)

| File | Role | Touch? |
|---|---|---|
| `leadai.html` | The original scrollytelling session. The **content canon** and the deep reference each leader carries home. | **Do not edit.** Port ideas out of it; never change it. |
| `leadaipacket.md` | The working content pack (research, quick wins, demos, task cards, ship steps). Background source. | Reference only. |
| `Presenter_SL.html` | Facilitator console. Drives the deck, aggregates live responses. | Active. |
| `Audience_SL.html` | Participant companion. Follows the console, collects each leader's input, builds their card. | Active. |
| `SL_Facilitation_Plan.html` | Run sheet: clock, the Relay script, tensions, guardrails, pre flight. | Active. |
| `SL_Cards.html` | Printable cards (paper fallback for the card the app builds). | Active. |

## Architecture (how the pair works)

- **Presenter** holds `STAGES` (the ordered deck), `QUIZ` (five leader level reads), `CONTENT` (watch slides). It advances stages and tallies what comes back.
- **Audience** is a lockstep router. It does not navigate itself; it renders whatever stage the presenter broadcasts, and sends the leader's responses back.
- They talk over **MQTT on a WebSocket**. The presenter is the only navigator. A session id (`SID`) isolates one run from ghosts and stale tabs; "New session" mints a fresh `SID` and clears every connected screen.

## The MQTT contract (do not break this)

Both files must agree exactly on these two constants:

```
MQTT_URL = "wss://broker.hivemq.com:8884/mqtt"   // public test broker
TOPIC_NS = "leadai"                              // topic = leadai/<ROOM>/bus
```

Default room is `BTY-SL`. Override with `?room=XYZ` on either URL.

Message types on the bus: `stage`, `reveal`, `reset` (presenter to room); `join`, `hb`, `confidence`, `quiz`, `share`, `submitted` (room to presenter). The presenter's `aud` id on each stage maps 1:1 to a case in the Audience router: `welcome, in, quiz, reflect, charter, hold, watch, out, log`. If you add a stage type, add both sides.

Verified at handoff: both script blocks pass `node --check`; the two constants match; every `aud` id has a router case.

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

1. **Host on GitHub Pages** (steps below).
2. **Move off the public broker.** Stand up a free dedicated broker (HiveMQ Cloud free tier or EMQX Cloud), give it a unique topic namespace, and swap `MQTT_URL` and `TOPIC_NS` in both files. The public broker is world readable and rate limited; charter and reflection lines, though anonymous, currently cross a shared bus.
3. **Add an `index.html` landing page** linking Presenter, Audience, the run sheet, and `leadai.html`, so the room has one clean URL.
4. **Rehearse on the venue network** and fix anything the firewall blocks (the WebSocket and the two CDN scripts: `mqtt`, `html2canvas`).
5. Optional: a reconnect or rejoin grace so a leader who drops returns to the current stage cleanly; a presenter side export of the wall and reflections.

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
