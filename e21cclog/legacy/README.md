# Older versions of the E21CC Log

Kept read only, so nothing is lost and each can be compared with the Log as it is now. None of them saves. The Log itself lives at [`../`](../) (`e21cclog/`), under one lasting key.

| Folder | Version | Address | What it reads |
|---|---|---|---|
| `v1/` | Version 1, September 2026 | `e21cclog/legacy/v1/` (old address `logs/`) | its own old log; a button brings newer entries across |
| `v2/` | Version 2, 28 October 2026 | `e21cclog/legacy/v2/` (old address `logsv2/`) | its own old log; a button brings newer entries across |
| `v3/` | Version 3, the pilot, 29 October to 8 November 2026 | `e21cclog/legacy/v3/` | the live log itself, read only; its console forwards to the live one |

`bridge.js` puts each into legacy mode: a banner, no saving, no writing pages, and for v3 no offline copy. Each folder's `LEGACY.md` lists the edits made when it was frozen.

The test version built beside the pilot (`e21cclog/next/`, November 2026) was folded into Version 4 on 8 November. Its address forwards to the Log; its history is in pull requests #110 to #119.
