# Changelog — Mind the Gap

All notable changes to the `gap/` game, newest first. The current version is
also shown in the **bottom-right corner of the game itself**, so you can confirm
which build you're looking at (GitHub Pages sometimes serves a cached copy).

Versioning is informal semver: the middle number bumps for a feature or content
change, the last for a small fix.

## v0.7.0
- **Scoring made coherent — every question now rewards a correct answer.** The
  old Round 1 asked you to guess a *generation* (which has no reliable answer)
  and so scored nothing, even while showing a definite value. That round is gone.
- **Round 1 is now "Read the Value" (scored)** — the former generation-guess
  voices became scored value questions, and the age-busting ("said by a
  26-year-old with a mortgage") now lands in the reveals, where it makes the
  point without dangling an unscoreable question.
- **Round 2 (Mind the Gap) answers fixed to match their own logic** — each
  scenario reveal now shows the right shape: a two-value clash, one value that
  was *misread*, or one shared value read through two different signals (the
  stay-late case previously showed "Purpose vs Security," contradicting its own
  "same value, different signals" answer).

## v0.6.0
- **Versioning added** — an in-app version badge (bottom-right, on every screen)
  and this changelog, so changes are easy to track across builds.

## v0.5.0
- **Round 2 (Read the Value) is now multi-select.** Some lines genuinely protect
  more than one value, so you can pick several. The prompt says "You can pick
  more than one," and the reveal lights every value that fits.
- Scoring: a read counts as right if it names at least one value and *every* pick
  is defensible (within the acceptable set for that line).
- Round 3 stays single-select and now says "Pick one," so each round signals how
  many answers it wants.

## v0.4.0
- **Sharper writing** across Rounds 2–3 and the Decode interlude — punchier
  voices, scenarios, and feedback. Scoring and answers unchanged.

## v0.3.0
- **Round 1 (Snap Judgment) fixed as an explicit red-herring round** — labelled
  "no points — it's a trap," with multi-select generations plus an "Any of them"
  option, and sharper voices and tells.

## v0.2.0
- **New Solo vs Computer mode** — play one-on-one against a computer opponent
  with three difficulty levels (Rookie / Pro / Sage).
- **Gameplay polish** — streaks with a bonus, Web Audio sound effects with a mute
  toggle, canvas confetti, a progress bar, keyboard shortcuts, shuffled question
  pools drawing a subset each game, plus two extra voices and a fourth scenario.

## v0.1.0
- **Initial release** — facilitator-run group game with three rounds, the scarce
  "3 Bold reads" risk/reward trade-off, live team scoring, and the "it's about
  values" finale with a saveable summary card.
