# School sign in for the E21CC Log: the steps

Version 6, 12 November 2026. Replaces `PHASE2-REQUEST.md`: Beatty's own ICT can register the app, so MOE IT is not needed.

What it does, in one line: each Beattyian keeps the log in their own OneDrive, gives a teacher a key to chosen entries, and the teacher replies in the margin.

It stays off until step B is done. Until then the Log works as it does today, with links in Teams.

## Who does what
| Step | Who | Time |
| --- | --- | --- |
| A. Register two apps in Microsoft Entra | School ICT (an admin) | 20 minutes |
| B. Put the three IDs into the Log | Harman, or whoever edits the repository | 5 minutes |
| C. The one day test | ICT and one pilot teacher, with one test student account | 1 hour, on one day |
| D. The small group pilot | One teacher, one class, one occasion | 2 to 3 weeks |
| E. Turning it off, if needed | Whoever did step B | 2 minutes |

---

## A. For ICT: register the two apps

Why two: students get access to their own files only; the teachers' console gets access to files students share with them. A token carries every permission given to its app, so one app for both would hand students the teachers' wider permission.

You need: an account with the role Global Administrator or Cloud Application Administrator in the school's tenant (`btyss.moe.edu.sg`).

### A1. The students' app
1. Open https://entra.microsoft.com and sign in with the admin account.
2. In the menu on the left: **Entra ID**, then **App registrations**. (Older menus: **Identity**, **Applications**, **App registrations**.)
3. Press **New registration**.
4. Fill in:
   - **Name:** `E21CC Log`
   - **Supported account types:** **Accounts in this organizational directory only** (single tenant).
   - **Redirect URI:** choose the platform **Single page application (SPA)**, and type exactly:
     `https://harmanjohll.github.io/genapp/e21cclog/index.html`
5. Press **Register**.
6. On the page that opens (**Overview**), copy two values into a note:
   - **Application (client) ID**: this is `clientId`.
   - **Directory (tenant) ID**: this is `tenantId`.
7. In the menu on the left: **API permissions**.
   - `User.Read` is already listed.
   - Press **Add a permission**, then **Microsoft Graph**, then **Delegated permissions**.
   - Tick: `openid`, `profile`, `offline_access`, and `Files.ReadWrite`. Press **Add permissions**.
   - Do not add `Files.ReadWrite.All` here.
8. Press **Grant admin consent for** (the school's name), then **Yes**. Every line should now show a green tick under **Status**.
9. In the menu on the left: **Authentication**. Check that:
   - The only platform is **Single page application**, with the one address from step 4.
   - Under **Implicit grant and hybrid flows**, both boxes are empty.
   - **Allow public client flows** is **No**.

### A2. The teachers' app (the console)
Repeat A1 with these differences:
1. **Name:** `E21CC Log console`
2. **Redirect URI** (Single page application):
   `https://harmanjohll.github.io/genapp/e21cclog/teacher.html`
3. Copy its **Application (client) ID**: this is `consoleClientId`. The tenant ID is the same.
4. **Delegated permissions:** `openid`, `profile`, `offline_access`, and `Files.ReadWrite.All`. (Teachers read files students share with them, and write their replies into one file per student.)
5. **Grant admin consent**, as before.

### A3. Limit both apps to the pilot (recommended)
For each app:
1. In the menu: **Entra ID**, then **Enterprise applications**. Open `E21CC Log` (then later `E21CC Log console`).
2. **Properties**: set **Assignment required?** to **Yes**. Press **Save**.
3. **Users and groups**: press **Add user/group**, and add the pilot:
   - `E21CC Log`: the pilot students and the pilot teacher (teachers also sign in to the Log to try it).
   - `E21CC Log console`: the pilot teacher only.

   Anyone not added sees a Microsoft message that they are not allowed, and the Log keeps working for them with links, as today.

### A4. Send three values to Harman
`tenantId`, `clientId` (E21CC Log), `consoleClientId` (E21CC Log console). They are not secret: they only name the apps, and the files they point to are public on the website anyway. No password or secret is created at any point.

### What the apps can and cannot do
| | Students' app | Teachers' app |
| --- | --- | --- |
| Reads the person's name and email | Yes | Yes |
| Writes | One folder, `E21CC Log`, in the student's own OneDrive | Only the notes file each student shares with that teacher |
| Reads | That folder | Only files a student shared with that teacher |
| Sends email, posts in Teams, reads mail or calendars | No | No |
| Has a server or database | No: it runs in the browser | No |
| Works for anyone outside the school | No: single tenant | No |

Honest note on the teachers' permission: `Files.ReadWrite.All` (delegated) lets the console reach any file the signed in teacher can already reach. The console's code only opens the files students share with it; the permission is wider than what it uses, because Microsoft has no narrower permission for "files shared with me".

---

## B. Put the three IDs into the Log
1. Open https://github.com/harmanjohll/genapp/blob/main/e21cclog/school/microsoft.json and sign in to GitHub.
2. Press the pencil (**Edit this file**).
3. Fill in the three values between the quotes, so it reads like this, with your own IDs:
   ```json
   {
     "about": "…leave this line as it is…",
     "tenantId": "11111111-2222-3333-4444-555555555555",
     "clientId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
     "consoleClientId": "cccccccc-dddd-eeee-ffff-000000000000",
     "folder": "E21CC Log"
   }
   ```
4. Press **Commit changes**, then **Commit changes** again.
5. Wait two to five minutes for the website to update.
6. Check: open https://harmanjohll.github.io/genapp/e21cclog/ in a private window. The welcome page should now show **Sign in with your school account** at the top. If it does not, wait a few more minutes and reload.

---

## C. The one day test (before any student)
With one pilot teacher account and one test student account (ICT can make one, or use a willing staff member's child account only with consent). Use two devices, or two browsers (one in a private window).

Tick each line as it works. Stop at the first line that fails, and note what the screen says.

**Student account, device 1**
1. [ ] Open the Log. Press **Sign in with your school account**. Microsoft's page opens.
2. [ ] Sign in. The Log opens a new log with the student's name, and goes to **My experiences**. Set a Sec level and one subject.
3. [ ] Open **Settings**, **Your data**. It says **Signed in as** the student, and **In step with OneDrive**.
4. [ ] In the student's OneDrive (office.com, OneDrive), a folder **E21CC Log** now holds **log.json**.
5. [ ] Write a GROW. Claim one statement and point to a sentence. Log it.

**Student account, device 2**
6. [ ] Open the Log and sign in with the same account. The GROW from step 5 is there.

**Sharing**
7. [ ] On device 1: **Settings**, **Sharing**. Under **Invite a mentor or another adult**, add the pilot teacher with their school email, role Subject teacher (or pick them from the staff list, if it is loaded). Turn on GROW for them.
8. [ ] Press **Send** for that teacher. The Log says **Tell (teacher) once**. Press **Open Teams chat**, send the message, then press **I sent it**.
9. [ ] In OneDrive, the folder **E21CC Log** now has **shares** and **notes** folders. Open **shares**, then the file's **Manage access**: only the teacher is listed.

**Teacher account**
10. [ ] Open the message in Teams. The console opens and asks for its PIN (set one, if it is the first time).
11. [ ] On the Inbox, press **Sign in with your school account**. After signing in, the card says **1 student shares with you through OneDrive**, and the GROW is in the Inbox.
12. [ ] Open the GROW. Under **Check this claim**, press **I saw this too**, write at least ten words of advice, and press **Save**.
13. [ ] Under **Replies to send**, press **Save to their log**. It says **Saved to (student)’s log**.

**Student account again**
14. [ ] On device 1 or 2, open the Log (or, in Settings, press **Keep in step now**). A message says a reply arrived. Home shows **From your teachers**, with **Affirmed** and the advice.
15. [ ] Press **Act on this feedback**. An ACT opens with the teacher's words as the feedback.

**Privacy**
16. [ ] Signed in as the teacher, open the student's OneDrive address directly (ICT can supply it). The teacher cannot see **log.json**.

If all sixteen pass, go to D. If any fail, send the line number and a screenshot to Harman; the most likely causes are below.

| What you see | Most likely cause | Fix |
| --- | --- | --- |
| "The school has not yet approved the Log for sign in" | Admin consent not granted | A1 step 8, or A2 step 5 |
| "The Log’s address is not registered for sign in" | Redirect address differs | A1 step 4 or A2 step 2, letter for letter, ending in `index.html` or `teacher.html` |
| "You are not allowed" (from Microsoft) | Not added to the app | A3 step 3 |
| No sign in button at all | IDs not in the file yet, or the site has not updated | Step B, then wait five minutes |
| Sharing says "OneDrive did not allow that" | The tenant blocks sharing with named people | ICT: SharePoint admin centre, **Policies**, **Sharing**: allow sharing with people in the organisation |
| The teacher's console does not show the student | The connect message was not opened | Step 10; or press **Look for students who shared** |

---

## D. The small group pilot
1. **One teacher, one class, one occasion.** For example, the end of a Chemistry unit. Not a weekly routine: the Log asks for a GROW when something ends, and the teacher checks every claim.
2. **In class, 15 minutes:** students open the Log on their device, sign in with the school account, set their Sec level and subjects, and pick their teacher. Show the class the demo first: https://harmanjohll.github.io/genapp/e21cclog/demo/
3. **The entry:** each student writes one GROW about the unit, claims one statement, points to their sentence, and shares it with the teacher. The first share asks them to send one Teams message.
4. **The teacher, within a week:** signs in to the console, opens each message once, checks every claim (a verdict and at least ten words), and presses **Save to their log**. Budget about three minutes a student.
5. **Back in class:** students read the reply, and write an ACT from it with **Act on this feedback**.
6. **Evidence, as in the README:**
   - The console's Class grid, **Copy for the pilot lead**, each week.
   - The three question pulse in week 3.
   - A 20 minute think aloud with five students.
   - The teacher's own minutes per student, and whether **What your class says** changed the next lesson.

---

## E. Turning it off
Edit `e21cclog/school/microsoft.json` again (step B) and empty the three IDs. Within minutes the sign in button goes. Every log stays on its device and in each student's OneDrive; students go back to links in Teams. Nothing is lost.

## Where the code is
| File | What it does |
| --- | --- |
| `school/microsoft.json` | The three IDs. Empty: off |
| `assets/m365.js` | Signing in (Microsoft's MSAL library, saved in `assets/vendor/`, MIT licence) and the OneDrive calls |
| `assets/cloud.js` | The student's side: keeping the log in step, sharing with a teacher, landing replies |
| `teacher.html` | The console's side, under "school sign in" |
| `tests/t35.js` | Tests it all against a stand in for Microsoft (`tests/fixtures/graph.js`) |
