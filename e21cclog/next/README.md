# E21CC Log, next version

This folder holds the next version of the E21CC Log, built beside the pilot so the pilot stays as it is. It started as an exact copy of the pilot app (November 2026) and grows one backlog item at a time.

| | Pilot | Next |
|---|---|---|
| Address | `e21cclog/` | `e21cclog/next/` |
| Student log key | `e21cclog` | `e21cclog.next` |
| Teacher console key | `e21cclog.teacher` | `e21cclog.next.teacher` |
| Offline copy | `e21cclog-` caches, scope `e21cclog/` | `e21cclognext-` caches, scope `e21cclog/next/` |
| Label in the app | v3 | Next |

The two never read or clear each other's data, and the pilot's offline copy ignores `next/`. A teacher or student can open both in one browser. When next is ready to replace the pilot, its log moves under the lasting key, as v1 to v3 did.

## How it is built
- `BACKLOG.md` lists the work in order: each item has a status, what it needs first, a spec, what done looks like, and its tests. The decisions behind it were made with Harman in November 2026.
- `LOOP.md` holds the rules for the scheduled build runs: three times a day a fresh session takes the next ready item, builds it here, and opens one PR titled `Next: <id> <title>`. Harman reviews and merges; runs never merge.
- Anything that needs a decision goes back to Harman as `needs Harman` in the backlog, never as a guess.

## Trying it
Open `e21cclog/next/index.html` for the student app and `e21cclog/next/teacher.html` for the console. Everything else works as in the pilot; see `../README.md` for how the Log works.

## Tests
`e21cclog/next/tests/run.sh` runs every suite against `e21cclog/next/` (`FULL=1` adds the full colour sweep and the route audit). Install once with `npm ci` in `e21cclog/next/tests`. Before any push, also run `node pathways/tools/verify.mjs` from the repository root, as `CLAUDE.md` asks.

Next's own checks: `t12` shows the pilot's offline copy never stands in for next and next has its own; `t15` shows next's fresh start clears only next's keys and the pilot opens its own log, unchanged, beside it.
