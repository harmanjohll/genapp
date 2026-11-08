# Notes for Claude

- Paths has two sites. Read `PATHWAYS_VERSIONS.md` first.
  - Classic Paths in `pathways/` (v4.4, live at `pathways.html`). Keep it working; change it only when asked.
  - The new site in `pathways5/` (v5, working title, name to come). Build new features here.
- Leave `legacy/` untouched apart from keeping links working.
- Before every push, run the verify script for each site you changed: `node pathways/tools/verify.mjs` and `node pathways5/tools/verify.mjs`. Every sweep must say PASS.
- The E21CC Log is in `e21cclog/` (Version 4); read `e21cclog/README.md` and `e21cclog/BACKLOG.md` first. `e21cclog/next/` only forwards, and older versions are read only in `e21cclog/legacy/`. Its tests: `e21cclog/tests/run.sh`.
- `README.md` at the root lists every app and its address. Folders are live addresses: do not move or rename one without leaving a page that forwards.
