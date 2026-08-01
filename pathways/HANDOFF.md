# Handoff

Contracts worth preserving in this folder.

## Copy rules

1. **No hyphens, en dashes or em dashes anywhere in student facing copy.** House rule, same as `s3/slaic`. Use commas, colons and semicolons, or rephrase. This is why the app writes "post secondary", "mid career", "work study", "O Level".
2. **Nothing states or implies that a student cannot do something.** No "you do not qualify", no "not eligible", no "closed", no "locked", no "unfortunately". If a destination is far away, the card says how far and what would move it.
3. **Never lead a destination with its aggregate.** Order is: what it is actually like, then what it leads to, then what is met and not met, then what would move it, then, last, what it asks for at the end.
4. **Setbacks always carry at least two onward moves.** Applies to every chance card of type `setback`.
5. **Second person, short sentences, plain register.** No exhortation, no motivational voice, no exclamation marks.

## Structural contracts

These are not style preferences and breaking one breaks the design.

- **`locked` must never exist** as a reach state, a CSS class, or a data value.
- **Every destination that is not `open` must produce at least one route and at least one move.** Enforced by `runInvariantSweep()`. Run `?dev=1` after any edit to `data/pathways.json` or `data/progressions.json`.
- **Performance rules are never evaluated.** If you find yourself writing code that reads a `performance` entry and compares it to anything, stop.
- **Doors is an append only Set of named doors, never a number.** `run.doors` holds ids from `journey.json` → `doorsCatalog`, rendered as chips. There is no code path that removes from it, which makes "doors never decrease" structural rather than defended. Do not render a door count and do not reintroduce an integer.
- **No numeral from the ledger ever renders in Journey.** Skills, network and portfolio draw as short bars; dispositions as bars; doors as named chips. A visible number is a score, and a score can be read across a desk.
- **`--g1`, `--g2`, `--g3` are used for subject levels and nothing else**, and they must stay equal in visual weight. The moment one reads as better than another, the app is teaching what it was built to stop teaching.
- **Adding a subject or raising a level must never increase any distance.** Enforced by the monotonicity sweep. If you add a rule type to `rules.js`, its distance function must be non increasing as the plan grows.
- **Distance is never rendered.** Not as a number, a bar, a position, or a sort order.
- **The doors list never re-sorts.** Fixed alphabetical by `railName`. Re-sorting on every tap is disorienting and reintroduces a ranking.
- **Every chance card has at least 2 responses, and any response with `needsAsk` carries a `stretch` outcome.** A response whose ask is unmet stays fully tappable and routes to the stretch text, which must build the disposition it asked for. This is what keeps "nothing is ever locked" true inside the cards.
- **Every turn stage offers at least two 1 point choices on every path.** The attention budget is 2 points per turn; if a stage drifted to all 2 point choices a player would be forced into a single pick, which is a fork wearing a turn's clothes. Forks are single pick on purpose and marked `format: "fork"`.
- **Every age offers at least 8 eligible chance cards on every path,** counting flag and band gates. Enforced by `runJourneySweep()`, which also plays 12 fixed strategy simulations end to end and asserts every one finishes with at least 3 doors.
- **`conflictsWith` on a subject renders a caution, never a lock.** The anti duplication rule (pure History beside Humanities with History) is advice about what a school will allow, not something this app enforces.
- **The branches converge from age 34.** Do not add late variants. The merge is the argument.
- **The want is answered, never graded.** The ending opens by answering the thing the player said they wanted at 15. "Not sure yet" is a first class want with its own ending line, not a fallback.
- **Nothing is pinned to the top of the page.** The header scrolls away. If you pin something there again, re run the clipping sweep first.
- **Every setback chance card keeps its `onwardMoves`, with the amounts intact.** The specific dollar figures are the reason a setback reads as survivable rather than frightening.
- **Profile cards and typical path cards must remain visibly different.** Different border, different marker, different label. A student must never mistake a pattern for a person.

## Annual update cadence

Do this once a year, ideally in the month MOE publishes admission criteria for the coming intake.

1. Work `OPEN_QUESTIONS.md` section 1 top to bottom against primary sources.
2. Update the figure, set `status` to `confirmed`, and bump `accessed` in that file's `_meta`.
3. Update the SkillsFuture amounts and take up figures in `data/lifelong.json`.
4. Check `data/subjects.json` against the current SEAB syllabus list and against what your school actually runs.
5. Run `?dev=1` and confirm the sweep still passes.
6. Re read `data/journey.json` and `data/chances.json` for anything that has dated.

If the oldest `accessed` date goes past 90 days the app tells users itself, which is the backstop, not the plan.

## Adding a destination

Add to `data/pathways.json` → `destinations`, with:

- `structural`, rules the engine can evaluate from subjects and levels. Mark anything advisory as `soft: true` so it shows in the checklist without affecting reach state.
- `performance`, whatever it asks for at the end, with `status` and a `sourceRef`.
- `routesIfNotHere`, ids from `data/progressions.json`. Leave it empty only if the destination is genuinely always open, and the engine will substitute the universal routes anyway.
- `feels`, which is the most important field and the one people skip. What is it actually like to be there.

Then run `?dev=1`.

## Testing

No test framework. The checks that matter:

```bash
python3 -m http.server 8000     # from the repo root
# http://localhost:8000/pathways/?dev=1
#   → "Reach invariant: PASS"   (dead ends, row status, railName, monotonicity)
#   → "Journey sweep: PASS"     (stages resolve per path, 2+ responses per card,
#                                stretch on every needsAsk, 2+ one point choices
#                                per turn, 8+ cards per age, 12 sims finish 3+ doors)
#   → "Copy budget: PASS"       (field caps, dashes, first paint)
```

All three must say PASS. The copy budget also catches the no dashes rule automatically, which was previously maintained by hand across nine thousand words.

Then, manually: 375px viewport, a keyboard only pass with every control reachable and visibly focused, and a read of every new string against the copy rules above.
