
# CHANGELOG (read this first; rewrite it at the end of every session)

## How to resume in a new AI chat
Paste this as your first message, then attach nothing else:
> Read README.md, CLAUDE.md and CHANGELOG.md. Continue from "Next step". Ask me before changing the plan.

## Rules for whoever (or whatever) edits this file
1. At the end of every session, rewrite this file so it describes the current state. Do not leave it stale.
2. This file holds current state only, with no running log of past changes. History lives in `git log`.
3. Never write passwords, keys or real user emails here. Name where a secret lives instead (`.env`).
4. Mark each plan step Done, Partly or Not started, and say how it was verified.

## Project in one paragraph
iMCQ is a mobile-first Macquarie University campus map (Node/Express serving static HTML/JS, Leaflet map, popups over `index.html`). Goal of the current work: users log in, guests browse through a guest view, and users follow societies. Leader event posting is paused and currently has no UI (`auth.saveEvent`/`deleteEvent` remain, unused). Backend is Supabase (Postgres + Auth + row-level security). The browser talks to Supabase directly; Express serves pages, the map, and `GET /api/config` (public URL and publishable key from `.env`).

## Decisions already made (do not re-ask)
* Backend: Supabase, not MySQL/Docker. The README says so.
* Name: iMCQ everywhere (package name `imcq`).
* Leaders: choose a society at sign-up, an admin approves by editing `society_leaders.status` in the Supabase dashboard. No admin screen for the MVP.
* Guests: can browse the map, societies and food; follow, event plan and the Calendar show "Log in to ..." (the Calendar is login-only). Leader event posting is paused and currently has no UI (`auth.saveEvent`/`deleteEvent` remain, unused).
* Roles: `profiles.role` is `student` or `admin`. A leader is a user with an approved `society_leaders` row.

## Plan status
| Step | What | Status |
| :--- | :--- | :--- |
| 0 | README + rename to iMCQ | Done |
| 1 | `database/schema.sql` and `seed.sql` | Done. Run on Supabase; societies (12) and events (5) read back correctly as a logged-out visitor. |
| 2 | Login page, guest entry, `js/lib/auth.js`, settings account block | Done. Guest path tested in browser. Sign-up and leader request were tested by the project owner (a pending `society_leaders` row appeared). |
| 3 | Guest gating (`auth.requireLogin()`, Add event plan gate) | Done. Tested as guest and logged in. |
| 4 | Follow societies (Follow/Following button, "Following" filter) | Done. Follow/unfollow round-tripped to Supabase as a logged-in user; guest sees "Log in to follow societies". |
| 5 | Leader flow: "Post event" form on the Calendar for approved leaders, edit/delete own events | Done, then the form and Edit/Delete buttons were removed from the UI (step 7). `auth.saveEvent`/`deleteEvent` and the database rules remain, currently unused by any page. |
| 6 | Events and societies read from Supabase instead of `data/*.json`; remove `routes/societies.js`, `routes/events.js` | Done. Societies, events and the map's "Societies held here" list load from Supabase; JSON routes and files deleted. Checked as a guest (12 societies, 5 events, building panel). |
| 7 | Settings: Display name linked to `profiles.display_name` (logged in only), Text size removed, Language select (English, 简体中文, Español, Tiếng Việt), leader post form removed, macqAI renamed mcqAI | Done. Checked as a guest in a browser. Display name saving (logged in) not tested. |
| 8 | Vietnamese (`vi`) added to `i18n.js` and the events month title | Done. Key coverage checked against `zh` and `es` by script; not yet viewed in a browser. |
| 9 | Language select on `login.html` (changing it reloads the page) | Done. Syntax checked only; not yet viewed in a browser (none available in the last session). |
| 10 | Login language reload keeps typed email and display name (sessionStorage, never the password); `vi` wording: society leader is "Chủ nhiệm CLB" | Done. `node --check` on both files; zh, es and vi still have the same 85 keys (script). NOT checked in a browser (none installed). |
| 11 | Event plans in Supabase: `event_plans` table (private RLS), `auth.listMyPlans/savePlan/deletePlan`, Add event plan and the Calendar switched from `localStorage` | Done. SQL run on Supabase; the project owner added a plan logged in and it survived a page refresh. Guest view and a second device not tested. |
| 12 | Remove button on your own plans in the Calendar (`auth.deletePlan`) | Done. The project owner removed a plan logged in and it worked. |
| 13 | Settings (logged in): Followed societies list with Unfollow, and Clear my event plans (`auth.clearPlans`, in-page confirm box, refreshes the Calendar); zh/es/vi strings added | Done. Both features tested logged in by the project owner. zh/es/vi wording not viewed in a browser. |
| 13 | Leader event posting: Post event form and Edit/Delete on own-society event cards in the Calendar (uses `auth.saveEvent/deleteEvent/approvedSocieties`) | Partly. `node --check` passes; NOT tested in a browser or with a real approved leader account. |

| 14 | Login page redesign (Work Sans, card, segmented tabs, 8px radius, translated error messages, language selector at bottom) | Done. Checked in headless Edge at 360px (en, zh, es, vi): no sideways scroll, tap targets >= 44px, translated error messages (via stubbed `auth.signIn`), guest button reaches the map. Real Supabase wrong-password and sign-up not run. |
| 15 | Navbar redesign + Work Sans on the whole map app (`index.html` loads the font; 12px labels, 36px icons, 8px rounded press/hover, `aria-current` on the open popup's button, centred 560px group at >= 600px; labels drop to 11px at <= 340px; form controls inherit the font) | Partly. Checked in the preview in en, zh, es, vi at 360px and 320px: every label <= 2 lines, no sideways scroll (320px needed the 11px rule), Societies button turns red. A tester measured the >= 600px layout in headless Edge (700px: group 560px wide, centred), but with the fallback font, not Work Sans. NOT checked: `aria-current` in a browser, a screenshot of the finished bar, other popups' look under Work Sans, widths 341-359px, the bold active label at 320px. |
| 16 | Calendar: "What's Happening" renamed Calendar (nav + popup title; nav "On-campus Societies" shortened to "Societies", popup title unchanged); login-only (guest gate: nav click shows the login prompt, deep link `/?events` shows an in-popup gate); shows only events of followed societies plus all own plans; empty-state hint when following none; refreshes on `events-changed` (fired by Follow/Unfollow); Month/Day buttons removed, replaced by a "Calendar view" select in User Settings (localStorage `imcq-cal-view`, default Month); Settings guest text mentions the calendar; zh/es/vi updated (109 keys each) | Partly. `node --check` passes on every changed JS file; zh, es, vi key counts equal (script); "What's Happening" no longer appears in `public/`. Checked in the preview as a guest (en): nav click shows "Log in to view the calendar.", the /?events deep link shows the in-popup gate, nav labels fit at 360px and 320px. NOT checked: anything logged in (followed-events filtering, Follow then Calendar refresh, the Settings view select), nav in zh/es/vi. |
| 17 | Society cover image: leaders upload ONE image per society (Supabase Storage bucket `society-images`, table `society_images`); shown on Societies cards. `auth.listSocietyImages/uploadSocietyImage/deleteSocietyImage`; "Society cover photo" section in the Add event plan popup (approved leaders only); `societyCard` image; zh/es/vi (113 keys each) | Partly. `node --check` passes on every changed JS file; key counts equal (script). Headless Edge as a guest: Societies popup renders 12 cards, no console errors, cover section hidden. NOT tested: the SQL (owner must run it by hand), upload/replace/remove, a real approved leader account, the card with an image, 320px layout with an image. |

## Next step
Steps 0-14 are done; steps 15, 16 and 17 are Partly (see their NOT checked lists). First job for step 17: the project owner runs the new "Society cover images" block of `database/schema.sql` in the Supabase SQL editor, approves a test leader, uploads an image and checks the Societies card (also at 320px). Then, for step 16: the project owner checks step 16 logged in (follow a society, see its events in Calendar; Settings Calendar view select), and the nav at 320px in zh, es, vi. Remaining items are the gaps below and mcqAI answers (README roadmap). Society map pins were dropped by the project owner; do not propose them. Ask which to take next.

## Where things are
* Pages are popups over the map: `public/index.html` plus `public/js/pages/*.js` (societies, events, event-plan, food, settings). Popups are built with `createPopup` in `public/js/components/popup.js`.
* Auth: `public/js/lib/auth.js` (global `auth`: `ready`, `user`, `profile`, `leaderships`, `onChange`, `signIn`, `signUp`, `signOut`, `continueAsGuest`, `requireLogin`, `listSocieties`, `myFollows`, `setFollow`, `approvedSocieties`, `listEvents`, `saveEvent`, `deleteEvent`, `updateDisplayName`, `listMyPlans`, `savePlan`, `deletePlan`). Language: `public/js/lib/i18n.js` (`t(key)`, `i18nLang()`, `setLang()`; keys are English text, dictionary has `zh`, `es` and `vi`). Login UI: `public/login.html`, `public/js/pages/login.js`.
* Database: `database/schema.sql` (tables, RLS, grants, sign-up trigger), `database/seed.sql`. Not applied automatically; run in the Supabase SQL editor.
* Server: `server.js` loads `.env` and serves `/api/map`, `/api/config` and the JSON-backed `/api/food`.
* Secrets: `.env` (gitignored). `.env.example` lists the variable names.

## Running and testing
* `npm install` then `npm start`. Default port 3000; if busy the dev preview used 3001.
* Visitors with no session and no guest choice are redirected to `/login.html`. To test as a guest, use "Continue as guest". `localhost` and `127.0.0.1` have separate browser storage, which is a quick way to get a logged-out session without signing anyone out.
* Do not create accounts on the live Supabase project from automated tests; ask the project owner to sign up manually.

## Known gaps and gotchas
* Cover images: the bucket is public, so anyone with an image URL can view it; there is no moderation (shows immediately). Deleting a society removes its `society_images` row but NOT the file in Storage (orphaned file; delete it in the dashboard). The SQL must be run by hand in Supabase; until then guests just see no images (the app does not break). Never tested with a real approved leader account. The section's messages use a local `flash()` in `event-plan.js` (the settings one is private). Uploading fires `society-images-changed`, which the Societies popup listens for.
* The Calendar popup keeps URL `/?events`, id `events-popup` and file `events.js`. Its nav click is wrapped in `events.js` to gate guests, and the deep link opens before that wrapper exists, so the popup also has its own in-popup gate. Nav label "Societies" is a separate i18n key from the popup title "On-campus Societies".
* Plans saved before step 11 stay in the browser's `localStorage` key `plannedEvents` and are no longer shown.
* The login page's language select also reloads; typed email and display name survive via sessionStorage, but the password, the active tab and any message do not.
* Language changes reload the page (`/?tasks`, reopening User Settings). Static HTML uses `data-i18n` attributes; JS-built UI calls `t('English text')`. Database content (societies, events, food, building names/descriptions/addresses) and card dates stay English/en-AU; the calendar month title follows the language. `auth.requireLogin(message)` takes the full English key (e.g. 'Log in to follow societies'), which must exist in the dictionary. Add new UI text to the `zh`, `es` and `vi` dictionaries or it shows in English.
* `auth.saveEvent`, `auth.deleteEvent` and `auth.approvedSocieties` are unused by the UI since the leader post form was removed. Leaders cannot post events from the app until a new UI is built.
* The Task Plan view is dropped, and its route, data and the MySQL-era leftovers (Docker files, `db.js`, the old AI route, `import-geojson.js`) are deleted.
* The empty `events.html`, `event-plan.html`, `food.html` were deleted; the icon SVG now lives in `docs/`.
* Sample events seed as the first admin (`created_by` must be a real user), so run `seed.sql` events only after an admin exists. Do not re-run the societies insert (names are unique).
* Event times in Supabase are `time` values (`12:00:00`); the UI expects strings like `12:00pm`, so format when Step 6 lands.
* If email confirmation is on in Supabase, sign-up needs a confirm-then-login round trip; the leader request is filed on first login from sign-up metadata.
* `.claude/launch.json` server name is still `mcq-imap`.

## Last updated
2026-10-26, after Step 17 (society cover image); before that Step 13 (Settings: followed societies, clear plans). The bottom nav was also restyled in the Macquarie theme (CSS only).

### 2026-10-26 (Calendar)
* **Change:** step 16 above: files `nav.js`, `events.js`, `event-plan.js`, `settings.js`, `societies.js`, `i18n.js`, orphaned `.cal-tabs` CSS removed, README table row and roadmap item 1 (done) updated.
* **Reasoning:** project owner decisions: Calendar is for logged-in users, shows followed societies' events plus own plans, view (Month/Day) is a setting. Old keys "What's Happening" and "Added! Find it in What's Happening." removed from all three dictionaries.

### 2026-10-26 (tester risks, step 10)
* **Change:** `login.js` saves email and display name to sessionStorage (`imcq-login-*`) just before the language reload, restores them on load and removes them; the password is never stored. `vi` strings 'Leader of', 'Leader request pending/declined for', 'I lead a society', 'Societies held here' reworded.
* **Reasoning:** the reload wiped typed input. Not restored: the sign-up/log-in tab (page reopens on Log in, so a typed display name sits in a hidden field until the user clicks Sign up) and any shown message. Not checked in a browser.

### 2026-10-26
* **Change:** Display name linked to `profiles`, Text size and its CSS removed, language switching added (`i18n.js`), leader post/edit/delete UI removed from the Calendar, macqAI renamed mcqAI (including CSS class names `mcqai-*`).
* **Reasoning:** project owner request. Language reloads the page because it is the simplest way to rebuild every popup; English text as keys keeps the dictionary small.

### 2026-10-26 (tester findings 5-7)
* **Change:** Building panel, Category options (values stay English), "e.g. 1CC", "a society" now use `t()` with zh/es entries; events month title uses the language locale; `requireLogin` callers pass full sentences; login.js arrow parameter renamed `tab`.
* **Reasoning:** remove untranslated visible English and a shadowed global `t`. Checked as a guest in headless Chrome (en, zh, es); month title and logged-in flows not checked.

### 2026-10-26 (login redesign)
* **Change:** `login.html`, `login.js`, "Login page" block of `style.css` and `i18n.js`. Key 'I lead a society (an admin will approve this)' replaced by 'I lead a society' + 'An admin will approve this'; new keys for the 4 mapped errors, 'Please wait...' and 'or'. Larger sizes are scoped to `.auth-card`. Raw Supabase `error.message` is no longer shown (matched on 'invalid login credentials', 'already registered', 'at least 6 characters').
* **Reasoning:** approved design. Gotcha: grid columns on `.auth-page`, `.auth-card` and `.event-form` need `minmax(0, 1fr)` or inputs overflow at 360px.

### 2026-10-26 (society cover image)
* **Change:** step 17 above: `database/schema.sql` (bucket, table, RLS, Storage policies, grants), `auth.js`, `event-plan.js`, `societies.js`, `card.js`, `style.css`, `i18n.js` (4 new keys per language), README roles and data model.
* **Reasoning:** owner-approved: Supabase Storage, public read, 5 MB, JPEG/PNG/WebP only, no moderation. Random file names avoid caching of replaced images; the old file is removed after the row is updated. Leader event posting was not brought back.
