# Notes for Claude

- Paths has two sites. Read `PATHWAYS_VERSIONS.md` first.
  - Classic Paths in `pathways/` (v4.4, live at `pathways.html`). Keep it working; change it only when asked.
  - The new site in `pathways5/` (v5, working title, name to come). Build new features here.
- Leave `legacy/` untouched apart from keeping links working.
- Before every push, run the verify script for each site you changed: `node pathways/tools/verify.mjs` and `node pathways5/tools/verify.mjs`. Every sweep must say PASS.
