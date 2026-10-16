# Request to MOE IT: the Competency Development Log in students' OneDrive

From Beatty Secondary School. One page.

## Purpose

Every Beattyian keeps a Competency Development Log from Secondary 1 to graduation: reflections on lessons, CCA and camps, claims about MOE's 21st Century Competencies, and the evidence for them in the student's own words. Today the log lives in the student's browser, and teachers see only what a student sends. That is fragile over four or five years: a cleared browser or a new laptop loses it. We want the log to live in the student's own OneDrive, so it survives devices, and so the teachers a student chooses can read it and reply in the margin.

## What the app is

A static web page with no server of its own: `https://harmanjohll.github.io/genapp/logs/`. It would register as a single page application with one redirect URI, that address. Sign in uses Microsoft's MSAL library, saved with the app (no CDN), with redirect sign in.

## Permissions requested (delegated, never application)

| Who | Scope | Why |
| --- | --- | --- |
| Students | `User.Read` | To know whose log it is |
| Students | `Files.ReadWrite.AppFolder` | To read and write only the app's own folder in the student's OneDrive, nothing else |
| Teachers | `Files.Read.All` | To open a copy a student shared with them |
| Teachers | `Files.ReadWrite.All` | To write margin notes into the one notes file the student shared with write access |

We understand that since 2025 Microsoft's default consent policy stops users approving `Files.Read.All` and `Files.ReadWrite.All`, so the teacher scopes need admin consent.

## Data flow

1. The log is one file, `log.json`, in the student's app folder. The student's browser keeps a cached copy.
2. When a student shares a section with a teacher, the app writes a filtered copy for that teacher and shares it with them (`invite`, sign in required, read only). OneDrive shares whole files, so a teacher never receives sections the student did not choose.
3. Each teacher also gets one notes file with write access. Their notes go there; the student's app reads them and shows them in the margin.
4. Teachers find students' copies through a roster the students submit through the teacher's existing Microsoft Form, because Microsoft is retiring the "shared with me" API in November 2026.
5. The only server involved is the school's coach relay (a Cloudflare Worker). It receives an entry's text without the student's name or email, forwards it to Anthropic's API under the school's key, and returns the coach's read. It stores nothing.

## The four questions only MOE IT can answer

1. Do Secondary students have OneDrive for the web on their Student iCON Microsoft 365 accounts, or only the desktop Office apps?
2. Will the tenant allow this app registration, with user consent for the student scopes and admin consent for the teacher scopes?
3. Can a file in a student's OneDrive be shared with a staff account, given that students and staff may sit in separate tenants?
4. Can staff start a Teams chat with a student across those accounts? Phase 1 uses Teams chat links to return notes.

## To verify before building

Two technical points we have not been able to confirm against Microsoft's current documentation: whether `Files.ReadWrite.AppFolder` is supported for work or school OneDrive accounts in this tenant, and whether `invite` works on files inside the app folder. A one day test with a pilot account would settle both.

## What happens without Phase 2

Nothing breaks. The log keeps working in the browser with export files as the backup, shares reach teachers through their forms and Teams links, and notes come back by link. Phase 2 removes the fragility and the copying.
