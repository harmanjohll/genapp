# Haze Ops

Live NEA readings, matched to the MOE school haze measures for that band.

- Readings: 24-hr PSI and 1-hr PM2.5 from NEA via data.gov.sg (`api-open.data.gov.sg/v2/real-time/api/psi` and `/pm25`, with a fallback to the v1 feed). The app checks every 10 minutes while open; NEA updates hourly.
- Band: whichever of PSI or PM2.5 is higher sets the band (the guidelines say "OR"). Region defaults to Central; "Highest" takes the worst region.
- Alerts: tap "Turn on alerts". When the band changes, the app shows a banner and a system notification. Alerts fire while the app is open (a background tab or the installed app counts). Alerts with the app fully closed need a push server, which this static site does not have.
- Content: transcribed exactly from the MOE haze guidelines graphic, plus the MOE press conference slides of 16 Oct 2026. Source typos are kept as published.
- Drill: enter any reading to preview the measures, for staff briefings or when the feed is down.

Files: `index.html` (whole app), `sw.js` (offline shell, mobile notifications), `manifest.webmanifest`, `assets/`.
