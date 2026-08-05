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
- **The combination is a starting position, never a starting personality.** A run carries the subjects the student picked, and those subjects may do exactly two things: append choices (`needsSubject`, capped at two a turn) and bias which chance cards turn up (`card.subjects`, a preference over the pool and never a gate). They must never set a path, open or withhold a door, change the ending, or produce a label about the kind of person the student is. A named archetype is the thing this design refuses: a type handed to a fourteen year old sticks, and sticking is the whole problem.
- **No combination may play a smaller game than no combination at all.** Enforced by the sweep across eight fixtures including an all G1 plan: with the same choices and the same seed, no plan may finish with fewer doors than an empty one. This is the subject engine's monotonicity rule applied to the story.
- **Lower secondary subjects must never reach a `countAtLevel`.** `reach()` filters them out through `upperPlan()` before any rule runs. Lower secondary Science is ONE subject that becomes one to three upper secondary ones, and Geography and History are taken by everybody rather than chosen, so counting them would tell a Sec 1 student they already satisfy "four subjects at G3" before they have chosen a single upper secondary subject. Filtering at that one choke point is why the invariant sweep, the monotonicity sweep and all three modes agree.
- **English, Mother Tongue and Maths carry `phase: "both"` and live under ONE key across all five years.** That is deliberate and load bearing: the English level a student raises at the end of Sec 1 is the same fact the polytechnic rule reads at Sec 4, with no translation layer in between. Do not split them into lower and upper rows.
- **`raisableFrom` is the Humanities rule, encoded.** English, Mother Tongue, Maths and Science can be raised from Sec 1; the Humanities not until Sec 2. The UI must never offer a move the junctures do not allow, because a student will go and ask for it.
- **The horizon is an inference and is labelled as one.** Projected rows carry no level chips and are never written to state. A tappable projected row would let a Sec 1 student build an upper secondary plan the engine then treats as real, which reopens the counting hole through the interface.
- **The Humanities collapse in `project()` is highest level wins, declared order only as a tiebreak.** Picking by declared order first means a student holding History at G2 who then adds Geography at G1 watches the projected Humanities row drop, the count fall, and a door move away from them for telling the truth. `projectionSweep()` tests additions as well as raises for exactly this reason.
- **A Journey raise only ever raises, never adds, and never rolls dice.** Adding a subject would be the app choosing a combination on a student's behalf. A probability roll would be the game simulating a school's judgement of a child. The deck carries the disappointment instead, in cards written for it.
- **The want is answered, never graded.** The ending opens by answering the thing the player said they wanted at 15. "Not sure yet" is a first class want with its own ending line, not a fallback.
- **Nothing is pinned to the top of the page.** The header scrolls away. If you pin something there again, re run the clipping sweep first.
- **Every setback chance card keeps its `onwardMoves`, with the amounts intact.** The specific dollar figures are the reason a setback reads as survivable rather than frightening.
- **Profile cards and typical path cards must remain visibly different.** Different border, different marker, different label. A student must never mistake a pattern for a person.
- **Icons are decorative without exception.** Every one renders `aria-hidden` beside text that already carries the meaning, and `icon()` returns `''` for an unknown name rather than throwing, so a renamed door costs a glyph and never a screen. They draw in `currentColor` only: hard-code a fill and the icon stops inheriting the contrast of the text it sits beside, which is the whole reason there is no per-icon contrast test.
- **Colour carries exactly four meanings and never decorates.** Subject levels (`--g1/--g2/--g3`, three hues of equal weight). Distance to a destination (`--open/--within/--longer/--other`, four states, no red). The compass (`--compass`, the three ECG questions, one hue for all three because they are one frame; the icons tell them apart). And action (`--accent`, the thing you could do next). Before adding a hue, check it against every token already in `tokens.css`: the wheel is nearly full and a fifth meaning would make the other four less reliable, which is what happened when the compass borrowed `--accent` and the same colour meant both "the question you are answering" and "the thing to tap".
- **`--accent` is a fill and a display colour; `--accent-dk` is the text colour.** `--accent` is 4.0:1 on paper, which clears AA for large text and fails it for small. Any accent coloured word at body size takes `--accent-dk`, and a filled accent button uses `--accent-dk` so its paper label clears 4.5:1. Same rule behind `--open-ink`, which exists because `--open` on its own wash is 4.2:1.
- **Subject count is load only from Sec 3.** At Sec 1 and Sec 2 the timetable is set and every subject on it is compulsory, so a game that hands a thirteen year old fewer points for a list nobody let them choose is describing a constraint as if it were a decision. `pointsFor()` gates the subject term on age 15 and up. What is real at every school age is the rest of the week, which comes from the student's declared activities.
- **Doing more must never leave a student worse off.** `loadOf()` makes the game honest about time and `activityYield()` pays the week back into every school year, at rates set so the paying in always covers the taking away. Enforced exhaustively: for every subset of activities and every activity not in it, adding that activity must not reduce total capacity across the school stages. If you change a `week` value, a yield rate or the points bands, `?dev=1` will tell you whether the invariant still holds. This is the reach engine's monotonicity rule applied to a student's week.
- **`activities.json` must never tell a student they are doing too much, ask whether they are sure, or describe a commitment as a cost with nothing on the other side of it.** `work` is the next thing that would make it count, never a deficiency. A student carrying four evenings is usually carrying them for a reason and sometimes for a reason nobody offered them a choice about.
- **The activities list is on the private side of the parent page's line, and the line says so.** A student can tick that they look after somebody at home or help in a family business. Surfacing that to the adult standing next to them would teach students not to tick it, which costs the app the truest thing it knows about their week.
- **A Journey repaint of the screen you are already on keeps the scroll and returns focus to the control you pressed.** Only a genuinely new screen goes to the top and announces its heading. Every screen declares an identity to `settle()`; if you add one, give it a key, and give it an `h1[tabindex="-1"]` to land on. `#app` sets `overflow-anchor: none` so the browser does not second guess the restored position.
- **The eight destinations have no icons, and neither do the three levels.** A mortar board against a spanner would encode the prestige ordering the destination list was built to refuse, and a glyph per level would rank three hues that must stay equal in weight. Both lists stay typographic. This is the same rule as `--g1/--g2/--g3`, applied to drawings.

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
#                                per turn, 8+ cards per age, 136 sims across 8
#                                combinations, none playing a smaller game than
#                                an empty plan)
#   → "Projection sweep: PASS" (reach after projection is monotone over adds and raises)
#   → "Activity monotonicity: PASS" (adding any activity to any subset never
#                                reduces what a run can accumulate)
#   → "Copy budget: PASS"       (field caps, dashes, first paint)
```

All four must say PASS. The copy budget also catches the no dashes rule automatically, which was previously maintained by hand across nine thousand words.

Then, manually: 375px viewport, a keyboard only pass with every control reachable and visibly focused, and a read of every new string against the copy rules above.
