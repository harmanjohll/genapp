# Leading with AI — a live, two-device workshop

A self-contained workshop experience for school leaders, built as two standalone
HTML files with no server and no build step. One runs on the projector, one on
each participant's phone, and they stay in sync live over the room's network.

- **`Presenter_SL.html`** — the facilitator console on the main screen (dark
  theme). 25 slides, driven with Back and Next.
- **`Audience_SL.html`** — the companion each participant opens on their phone
  (light "paper" theme). It follows the main screen and is also where people
  submit their input.

Supporting pieces in this folder: `index.html` (landing and links),
`leadai.html` (the full deck as a readable, printable document),
`SL_Facilitation_Plan.html` (the run sheet), `SL_Cards.html` (printable cards),
and the app screenshots used on the "built, free, hosted" slide
(`cocher.png`, `sgsl.png`, `weekbrief.png`).

## How the two talk

The presenter and the phones sync through MQTT over WebSockets on a public
broker (HiveMQ), joined by a shared **room code (default `S3SL`)**. Room codes
are matched with spaces and hyphens stripped and uppercased, so `S3-SL`,
`S3SL`, and `s3 sl` all join the same room.

The presenter is the single source of truth. Every time the facilitator moves,
it broadcasts the current slide; phones receive it and render in lockstep.
Participants' submissions travel back the other way and aggregate on the
presenter. **Nothing is stored anywhere** — it all lives in memory for the
duration of the session, which is why the room's collective input has to be
exported before the presenter tab is closed.

## The presenter–audience interaction, by slide type

Each slide declares how the phone should behave. There are a few modes:

- **Watch slides (most of the deck).** The phone shows a **mirror** of what is
  on the projector — a phone-styled, sanitized copy of the same content (the
  frames, the arc, PILOT, the five forces, the 5 Ps, the "built, free, hosted"
  examples, HEART through VOICE, and so on). One special watch slide, the
  **agent loop**, animates step by step on the main screen and the phones follow
  the same beat. People can look up at the room or down at their own screen and
  see the same thing.

- **Readiness, walking in and walking out.** Two poll moments. Participants
  **rate their own (or their school's) readiness** on a scale, and on the way in
  they can also **type the questions on their mind**. The room average appears
  live, and near the end the deck shows the **in to out shift**.

- **Quizzes ("reads").** Four predict-then-reveal questions (agent vs chatbot,
  the data boundary, the one-voice risk, and "Partner is not the top").
  Everyone **votes on their phone first**; the presenter then reveals the answer
  with the room's distribution and a short why and why-not.

- **My charter (the interactive centerpiece near the end).** Each person sets
  their **five postures** in their own words, plus **one line they will carry**
  from the day. Shared lines flow onto a live **charter wall** on the main
  screen (anonymous — only the words, never names). The five postures are:

  | Posture      | In one line                                                        |
  |--------------|--------------------------------------------------------------------|
  | **Prohibit** | Keep AI out. Sensitive, official, or the values call.              |
  | **Polish**   | Sharpen the thinking: spar with AI, or summon a persona.           |
  | **Plan**     | Think it through: options, tradeoffs, risks, and sequence.         |
  | **Produce**  | Make the thing: a document, a tool, a game, an applet, code.       |
  | **Partner**  | Co-author and own it. Highest trust, fullest ownership.            |

  The framing is "postures, not a ladder": the right posture is the one the task
  calls for, set by data and stakes. Partner does not beat Prohibit.

## The input the audience gives

Across the session, each participant contributes:

- a **readiness rating** walking in, and again walking out;
- the **questions** they walked in with;
- their **votes** on the four quiz reads;
- their **five posture lines** for the charter;
- their **one line to carry**.

All of it is anonymous on the shared wall, and personal on their own screen.

## The take-home "command card"

The final slide flips the phone into a **command card** — a keepsake built
entirely from that person's own answers:

- **The frames** — a compact recap of the day (PILOT; the 5 Ps; the five forces;
  HEART through VOICE; and the throughline, "we cannot govern what we have only
  been briefed on").
- **Walking in** — their name and the readiness and questions they entered.
- **The reads** — which quiz items they got right and which to revisit, drawn
  from their own votes.
- **My charter** — their five postures and the line they will carry, plus their
  readiness in to out.

They can **Save it as a PDF** (crisp on any phone) or download it as an image,
and there is a link to the full deck (`leadai.html`) to read later. It is
designed to be genuinely theirs to keep, not a generic handout.

## Design principles

- **Resilient by design.** If a phone cannot reach the broker, it says so
  honestly and tells people to just follow the main screen; the session never
  hard-fails on a flaky network.
- **Collective voice.** The copy speaks as "we / our" (the facilitator is part
  of the room). Second person is reserved for genuinely personal surfaces: your
  screen, your card, your name.
- **Ephemeral by default.** Nothing is persisted server-side, which is
  privacy-friendly but means the room's collective input must be exported from
  the presenter before the tab closes.

## Running it

1. Open **`Presenter_SL.html`** on the main screen. Confirm the room code reads
   **S3SL** (or set your own with `?room=` on the URL).
2. Participants open **`Audience_SL.html`** on their phones and join with the
   room code shown on the welcome slide (it defaults to S3SL).
3. Drive the deck with Back and Next. The phones follow; submissions aggregate
   live on the presenter.
4. At the end, everyone saves their command card. Export the room's collective
   input from the presenter before closing the tab.

See `HANDOFF.md` for operational notes and rehearsal steps.
