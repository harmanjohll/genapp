# Notes for Claude

- The E21CC Log (`e21cclog/`) and Paths (`pathways/`) are separate apps: work on one never touches the other or needs its checks. The one shared fact is Beatty's subject offering, copied in `e21cclog/school/beatty.json` and `pathways/data/offer.json`; change both together.
- Name apps, never version numbers, in shared files (this one and the root `README.md`). Each app keeps its versions in its own log; a reader of one app should never meet another app's numbers.
- Paths lives in `pathways/`, opened by `pathways.html`. Read `pathways/README.md` and `PATHWAYS_VERSIONS.md` first, and build there.
  - Earlier builds are frozen in `legacy/`. `pathways2/` to `pathways5/` only forward.
- Leave `legacy/` untouched apart from keeping links working.
- Before every push that touches Paths, run `node pathways/tools/verify.mjs`. Every sweep must say PASS.
- The E21CC Log is in `e21cclog/`; read `e21cclog/README.md` and `e21cclog/BACKLOG.md` first. `e21cclog/next/` only forwards, and older versions are read only in `e21cclog/legacy/`. Its tests: `e21cclog/tests/run.sh`.
- `README.md` at the root lists every app and its address. Folders are live addresses: do not move or rename one without leaving a page that forwards.
