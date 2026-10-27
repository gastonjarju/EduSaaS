# Alumni Features — Smoke Tests

**Module:** Alumni Relations (issue #8; PRs #11–#15)
**Purpose:** A short pass to confirm the alumni features work end to end. Run it before merging changes to the alumni pages, after deploying, and after re-seeding a shared database. It is not exhaustive; the PR descriptions list the full QA for each stage.
**Time:** about 20 minutes.

---

## 1. Setup

```bash
npm install
npm run db:migrate
npm run db:seed          # resets the two demo schools; safe to re-run
npm run build
MOCK_AUTH=1 npm start    # or: MOCK_AUTH=1 npm run dev
```

Use Chrome, Edge or Firefox; Safari may not open `*.localhost` subdomains. Run the tests at desktop width, then repeat the ones marked 📱 at phone width (about 375px, via DevTools' device toolbar).

| School | URL (port 3000) |
|---|---|
| St. Peter's Technical (The Gambia) | http://stpeterstechnical.localhost:3000/alumni |
| Kriste Mambo High School (Zimbabwe) | http://kristemambo.localhost:3000/alumni |

**Test data** (created by `npm run db:seed`):

| Who | How to sign in | Notes |
|---|---|---|
| Aisha Bojang (alumna, St. Peter's, Class of 2015) | Dev bar, or join with `+220 300 0001` | Verified, has LinkedIn |
| Mariama Touray (school admin, St. Peter's) | Dev bar, or join with `+220 300 0000` | Sees everything, can export |
| Musa Jallow (alumnus, St. Peter's, Class of 2012) | Dev bar | Not in Class of 2015 |
| Liberty Mupotsa (alumnus, Kriste Mambo, Class of 2017) | Dev bar on Kriste Mambo, or `0771 000 004` with 🇿🇼 +263 | Real LinkedIn link |

- **One-time code:** always `1234` while `MOCK_AUTH=1`. Nothing is sent.
- **Dev sign-in bar:** the yellow bar at the top of school pages. It appears only with `MOCK_AUTH=1`.
- **New test accounts:** use numbers you don't need, e.g. 🇬🇲 `771 50xx`. They aren't removed by re-seeding, but the same number can sign back in or rejoin.

---

## 2. Summary

Copy this table into the PR or release notes and fill in the Result column.

| ID | Test | Status | Result |
|---|---|---|---|
| SMOKE-01 | User can create an alumni account (phone) | Ready | |
| SMOKE-02 | User can create an alumni account (email) | Ready | |
| SMOKE-03 | User can sign in and sign out | Partly built — see notes | |
| SMOKE-04 | Admin can create and publish events | Ready | |
| SMOKE-05 | Users can sign up (RSVP) for events | Ready | |
| SMOKE-06 | Users can find classmates in the directory | Ready | |
| SMOKE-07 | Private profile fields stay private | Ready | |
| SMOKE-08 | Class members can post in their class feed | Ready | |
| SMOKE-09 | Users can share an event | Ready | |
| SMOKE-10 | Schools can't see each other's alumni or events | Ready | |
| SMOKE-11 | Signed-out visitors can't see members-only pages | Ready | |
| SMOKE-12 | Admin can export the alumni list | Ready | |
| SMOKE-13 | Admin can verify and reject alumni | Ready | |

---

## 3. Tests

### SMOKE-01 — User can create an alumni account (phone) 📱

**Steps**
1. Sign out in the dev bar, then open `/alumni/join` on St. Peter's.
2. Leave 🇬🇲 +220 selected and enter a new number, e.g. `771 5001`. Click **Send code via SMS**.
3. Enter `1234` → **Verify & continue**.
4. Enter name `Smoke Tester`, graduation year **2015**, role `Tester`, city `Banjul`, LinkedIn `linkedin.com/in/smoke-tester` → **Join directory**.

**Expected**
- Step 2 shows "Enter the code we sent to +2207715001".
- Step 3 shows step 2 of the form with "✓ Verified +2207715001".
- After joining, you land on your new profile: "Smoke Tester", "Class of 2015", **Pending verification**, and a LinkedIn button.
- The dev bar says "Signed in as Smoke Tester".
- `/alumni?q=Smoke` lists you, and `/alumni/class/2015` lets you post.

### SMOKE-02 — User can create an alumni account (email)

**Steps**
1. Sign out, then open `/alumni/join` on Kriste Mambo and choose **Email**.
2. Enter `Smoke.Email@Example.com` → **Send code by email** → `1234`.
3. Enter name `Smoke Email`, graduation year **1985** → **Join directory**.

**Expected**
- The code step shows the address in lowercase: `smoke.email@example.com`.
- The profile is created, with no "Message on WhatsApp" button when someone else views it (no phone).
- `/alumni/class/1985` exists, with "1 member" if you're the first in that year.

### SMOKE-03 — User can sign in and sign out

**Steps**
1. Signed out, open `/alumni/join` on St. Peter's and enter the number from SMOKE-01 → `1234`.
2. Reload the page.
3. Open http://kristemambo.localhost:3000/alumni.
4. Click **Sign out** in the dev bar.
5. Open `/alumni`.

**Expected**
- Step 1 lands on your profile with "Welcome back, Smoke. This number is already registered, so we've signed you in." No second account is created.
- Step 2: still signed in.
- Step 3: signed out there; each school has its own sign-in.
- Steps 4–5: signed out, and `/alumni` redirects to `/alumni/join`.

> **Gap:** there is no sign-out button for real users yet. Signing out is only possible from the dev bar, which exists only with `MOCK_AUTH=1`. Sign-out needs to be built together with real sign-in (Twilio SMS codes and an auth library; see `architectureDesign.md` Open Questions).

### SMOKE-04 — Admin can create and publish events 📱

**Steps**
1. Sign in as Aisha Bojang (alumna) and open `/admin/events`.
2. Sign in as Mariama Touray (admin). Click **Admin** in the header.
3. Click **+ New event**. Enter title `Smoke Event`, a start date and time next month at 10:00, choose **In person**, location `Main hall` → **Save draft**.
4. As Aisha, open `/alumni/events`.
5. As the admin, open the event from the calendar → **Publish**.
6. As Aisha, open `/alumni/events`, then the event → **Going**.
7. As the admin, reopen the event: change the title to `Smoke Event (edited)` → **Save changes**, then **Unpublish**.
8. On Kriste Mambo, as its admin (Tafadzwa Makoni), create and publish an event at 16:00.

**Expected**
- Step 1: 404. Alumni can't reach the admin screens and have no **Admin** link.
- Step 2: the Events admin screen opens on the current month. Tablets and up show a calendar; phones show a list. Drafts show as **Draft** (e.g. "Sports Day (draft)" in March 2027).
- Step 3: lands on the event's edit page with "✓ Draft saved", and it appears on the calendar with a dashed border.
- Step 4: the draft is **not** listed.
- Step 5: "✓ Published — it's now on the events page."
- Step 6: listed at 10:00 · Main hall, and the RSVP saves. The admin's edit page then shows "1 going".
- Step 7: alumni see the new title after saving; after unpublishing, it disappears from `/alumni/events`.
- Step 8: shows 16:00 on Kriste Mambo's events page; times are in each school's own time zone.
- Choosing **Online** without a link, or an end time before the start, shows an error, and what you typed is kept.

### SMOKE-05 — Users can sign up (RSVP) for events 📱

**Steps**
1. Sign in as Aisha Bojang and open **Homecoming Reunion** from `/alumni/events`.
2. Note the "N going · N maybe" line, then click **Going**.
3. Reload.
4. Click **Maybe**.
5. Sign out and open the same event.
6. Open **Founders' Day** (a past event) while signed in.

**Expected**
- Step 2: Going turns green, "✓ RSVP saved: Going" shows, and the going count goes up by 1.
- Step 3: Going is still selected.
- Step 4: Maybe is selected, and the counts move from going to maybe.
- Step 5: no RSVP buttons; **Join the alumni network to RSVP** is shown instead.
- Step 6: no RSVP buttons.

### SMOKE-06 — Users can find classmates in the directory 📱

**Steps**
1. Sign in as Aisha Bojang and open `/alumni`.
2. Search `bojang`.
3. Clear the search, choose **Class of 2015** → **Search**.
4. Go to the next page and back.
5. Click a card, then click **View Class of … group →** on the profile.

**Expected**
- The directory shows "60 alumni of St. Peter's…", with 20 cards per page in A–Z order.
- Step 2 shows only Bojangs. Step 3 shows "8 alumni match your search".
- Paging keeps the filters.
- Step 5 opens the profile, then the class feed.

### SMOKE-07 — Private profile fields stay private

**Steps**
1. Sign in as Aisha Bojang and search for `Ndey Bojang`, who hides their city (Lamin) from other alumni.
2. Set Location to that alumnus's real city (Lamin) → **Search**.
3. Switch to Mariama Touray (admin) and repeat steps 1–2.
4. On any profile, View Page Source and search for `+220`.

**Expected**
- Steps 1–2, as an alumna: no city on the card or profile, and the alumnus is **not** in the Lamin results.
- Step 3, as the admin: the city is shown and the alumnus **is** in the Lamin results.
- Step 4: no phone numbers in the page. "Message on WhatsApp" works through a redirect instead.

### SMOKE-08 — Class members can post in their class feed 📱

**Steps**
1. Sign in as Aisha Bojang and open `/alumni/class/2015`.
2. Post `Smoke test post`.
3. Switch to Musa Jallow (Class of 2012) and open `/alumni/class/2015`.
4. Switch to the admin and open `/alumni/class/2015`.

**Expected**
- Step 2: the post appears at the top immediately and is still there after a reload.
- Step 3: "This group is only open to Class of 2015 members", with no posts and no composer.
- Step 4: the admin can read the posts but has no composer.

### SMOKE-09 — Users can share an event

**Steps**
1. Open any event (signed in or out).
2. Click **Copy link**, then paste the link into a new tab.
3. Click **Share**, if your browser shows it (phones, macOS).

**Expected**
- Step 2: "✓ Link copied — paste it anywhere to share", the link is shown, and the pasted link opens the same event.
- Step 3: the system share menu opens with "You're invited! 🎉 <event> at <school> on <date>." and the link.

### SMOKE-10 — Schools can't see each other's alumni or events

**Steps**
1. On Kriste Mambo, sign in as Liberty Mupotsa and open your profile. Copy its URL.
2. Change the host in that URL to `stpeterstechnical.localhost` and open it.
3. On Kriste Mambo, open `/alumni/join` and enter Aisha Bojang's number `+220 300 0001` → `1234`.

**Expected**
- Step 2: 404. A profile from another school can't be opened.
- Step 3: "This contact is already registered with another school's alumni network."
- Each school's directory shows only its own 60 alumni (plus any test accounts).

### SMOKE-11 — Signed-out visitors can't see members-only pages

**Steps** (signed out on St. Peter's): open `/alumni`, any `/alumni/profile/<id>`, `/alumni/class/2015`, `/alumni/export`, `/alumni/events`, and http://nosuchschool.localhost:3000.

**Expected**
- `/alumni`, profile and class pages redirect to `/alumni/join`.
- `/alumni/export` is a 404.
- `/alumni/events` loads; events are public.
- The unknown school shows "School not found" (HTTP 404).

### SMOKE-12 — Admin can export the alumni list

**Steps**
1. Sign in as Mariama Touray (admin) and open `/alumni`.
2. Click **Export list** and open the CSV.
3. Sign in as Aisha Bojang and open `/alumni`.

**Expected**
- Step 2: `stpeterstechnical-alumni.csv` has one row per St. Peter's alumnus, with name, year, class, city, profession, verification status, phone and email. Phone numbers start with `'+220…`; the `'` stops spreadsheets treating them as formulas. No Kriste Mambo alumni are in it.
- Non-verified alumni show **Pending verification** or **Unverified** badges in the admin directory.
- Step 3: an alumna sees no Export list button.

---

### SMOKE-13 — Admin can verify and reject alumni 📱

**Steps**
1. As Aisha Bojang, open `/admin/alumni`.
2. As Mariama Touray (admin), open `/alumni`, then click **Review pending (N)**.
3. On the **Pending** tab, click **Verify** on the first person.
4. Click **Reject** on the next person, then open the **Rejected** tab.
5. As Aisha, search the directory for the rejected person, then try their profile URL.
6. Sign out, open `/alumni/join` and verify the rejected person's phone number with `1234`.
7. As the admin, click **Verify** on them in the **Rejected** tab.
8. On **Pending**, tick two people → **Verify selected (2)**.
9. On **All**, tick **Select all**, then **Select all 60 in this tab**, then untick one row.

**Expected**
- Step 1: 404.
- Step 2: the admin Alumni screen opens on **Pending**, oldest sign-ups first. Tab counts add up to **All (60)**. Each row shows name, class, phone or email and joined date.
- Step 3: the person leaves the Pending tab, the Pending count drops by 1, and their profile shows **✓ Verified**.
- Step 4: the person is listed under **Rejected (1)**.
- Step 5: not in the directory, and their profile URL is a 404.
- Step 6: "The school hasn't approved your alumni profile. Please contact the school." They aren't signed in.
- Step 7: they're back in the directory as verified.
- Step 8: "✓ 2 alumni verified." Both leave Pending, and the checkboxes clear.
- Step 9: the button reads **Verify selected (60)**; after unticking a row it reads **(24)**, back to this page only. Don't press it.
- With nothing ticked, the bulk buttons are disabled.
- Rejecting **more than 10** at once asks first: "Reject N alumni? …" with **Yes, reject N** / **Cancel**. Cancel, or changing the selection, rejects nothing. Rejecting 10 or fewer, and any Verify, happen straight away.

## 4. Known gaps

These need building before the corresponding smoke tests can fully pass:

| Gap | Affects |
|---|---|
| Real sign-in (Twilio SMS codes) and a sign-out button for users | SMOKE-01, -02, -03 run only in mock mode |
| Event cover images and deleting events | Not covered |
| Profile editing, photo upload | Not covered |
