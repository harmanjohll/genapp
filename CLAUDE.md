# Notes for Claude

- Paths is one app again: 6.0 in `pathways/`, opened by `pathways.html`. Read `PATHWAYS_VERSIONS.md` first, and build here.
  - v4.4 is frozen in `legacy/pathways-v4/`. `pathways5/` only forwards to `pathways/`.
- Leave `legacy/` untouched apart from keeping links working.
- Before every push that touches Paths, run `node pathways/tools/verify.mjs`. Every sweep must say PASS.
- The E21CC Log is in `e21cclog/` (Version 4); read `e21cclog/README.md` and `e21cclog/BACKLOG.md` first. `e21cclog/next/` only forwards, and older versions are read only in `e21cclog/legacy/`. Its tests: `e21cclog/tests/run.sh`.
- `README.md` at the root lists every app and its address. Folders are live addresses: do not move or rename one without leaving a page that forwards.
