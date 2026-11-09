# Rules for a scheduled build run

**Paused.** Harman paused the scheduled runs on 7 November 2026, and on 8 November the test version was folded into the Log as Version 4. No scheduled task runs these rules now; they resume only when Harman says so. Until then a session building a backlog item follows them by hand.

You are a fresh session started by a scheduled task. Your job is to build exactly one backlog item of the E21CC Log and open one pull request for Harman Johll (Principal, Beatty Secondary School) to review. You work alone: nobody answers questions during the run, so anything that needs a decision goes back as `needs Harman`, never as a guess.

## 1. Read first
- `CLAUDE.md` at the repository root.
- `e21cclog/README.md`, then `e21cclog/BACKLOG.md` in full.
- The parts of `e21cclog/assets/app.js`, `core.js`, `store.js` and `teacher.html` your item touches. Reuse what exists; the item specs name the functions to start from.

## 2. Stop early when
- `e21cclog/BACKLOG.md` does not exist on main: stop, change nothing.
- Three or more open pull requests in `harmanjohll/genapp` have titles starting `Log:` (list them with the GitHub tools): stop, change nothing. Harman has enough to review.
- No item qualifies (step 3): stop, change nothing.

## 3. Pick the item
Take the first item in `BACKLOG.md`, in order, that:
- has status `ready`;
- has every item it needs at status `done`;
- has no open pull request whose title starts `Log: <its id>`.

If a closed pull request that was not merged exists for that item, do not build it: read that pull request's comments and review, set the item to `needs Harman` with the reason in one line, open a pull request with only that change (title `Log: <id> question`), and stop.

If the item is clearly too big for one run, split it in `BACKLOG.md` into parts (`A1a`, `A1b`), each with its own spec and done line, and build only the first part.

## 4. Build
- Change files only inside `e21cclog/`, and never `e21cclog/legacy/` (the read only archive) or `e21cclog/next/` (forwarding only). Never touch Paths (`pathways/` and its old addresses) or anything else in the repository. Before pushing, `git diff --name-only origin/main` must list only `e21cclog/` paths.
- Follow the existing code: plain JavaScript, no frameworks, no build step, no new dependencies, no network calls to new services. Everything stays on the device unless the item says otherwise.
- Keep the Log's lasting keys (`e21cclog`, `e21cclog.teacher` and their companions). Never change `FRESH_START` in `assets/store.js`: it would clear every student's log.
- Accessibility as in the rest of the Log: labelled controls, keyboard reachable, visible focus, touch targets of at least 44 px, contrast that passes the colour sweep in all four looks, light and dark.
- Words students and teachers see: plain, short sentences, the school's own terms (GROW, ACT, I can statements, CCA, NEXUS@BTY), Beattyian capitalised, and no hyphens or dashes of any kind (rephrase instead). Call it the E21CC Log or the Log, never another name (the t9 name check enforces this).
- Feelings and check in data (section E) stays on the device: never in a sharing payload, an export a teacher can read, or the teacher console.
- Add a line for the item to `APP_VERSION.notes` in `e21cclog/assets/core.js` when students or teachers would notice the change.

## 5. Test
- Add a test suite for the item: `e21cclog/tests/tNN.js`, numbered after the highest existing one, written like the others (launch through `fixtures/launch.js`, `check(name, ok, info)`, print `ALL PASS`), and add it to the list in `e21cclog/tests/run.sh`.
- Run `npm ci` in `e21cclog/tests` if `node_modules` is missing, then `FULL=1 e21cclog/tests/run.sh`: every line must say pass.
- Look at your screens: take a screenshot of each new screen at 390 by 844 and 1280 by 800 and check it reads well.

If a check fails and you cannot fix it within the item, do not hide it: open the pull request as a draft and say exactly what fails.

## 6. Open the pull request
- Set the item's status to `done` in `BACKLOG.md` in the same pull request.
- Commit on your session's branch with a clear message, push, and open one pull request against `main` titled `Log: <id> <title>` (for example `Log: C1 Sharpen the reflection`).
- The body, in plain words: what changed for students and teachers; how to try it (which page, which steps); the tests added and the results of both runs; anything Harman should decide or check.
- Never merge, never push to `main` or to another session's branch, never force push.

## 7. When a decision is needed
If the spec leaves a choice that changes what students or teachers experience, or touches data protection, do not choose: set the item to `needs Harman` with the exact question (and your suggested answer), open a pull request with only that change titled `Log: <id> question`, and stop. Small implementation choices are yours to make; say what you chose in the pull request.
