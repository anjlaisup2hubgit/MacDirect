
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
* Guests: can browse everything; follow and event plan show "Log in to ...". Leader event posting is paused and currently has no UI (`auth.saveEvent`/`deleteEvent` remain, unused).
* Roles: `profiles.role` is `student` or `admin`. A leader is a user with an approved `society_leaders` row.

## Plan status
| Step | What | Status |
| :--- | :--- | :--- |
| 0 | README + rename to iMCQ | Done |
| 1 | `database/schema.sql` and `seed.sql` | Done. Run on Supabase; societies (12) and events (5) read back correctly as a logged-out visitor. |
| 2 | Login page, guest entry, `js/lib/auth.js`, settings account block | Done. Guest path tested in browser. Sign-up and leader request were tested by the project owner (a pending `society_leaders` row appeared). |
| 3 | Guest gating (`auth.requireLogin()`, Add event plan gate) | Done. Tested as guest and logged in. |
| 4 | Follow societies (Follow/Following button, "Following" filter) | Done. Follow/unfollow round-tripped to Supabase as a logged-in user; guest sees "Log in to follow societies". |
| 5 | Leader flow: "Post event" form on What's Happening for approved leaders, edit/delete own events | Done, then the form and Edit/Delete buttons were removed from the UI (step 7). `auth.saveEvent`/`deleteEvent` and the database rules remain, currently unused by any page. |
| 6 | Events and societies read from Supabase instead of `data/*.json`; remove `routes/societies.js`, `routes/events.js` | Done. Societies, events and the map's "Societies held here" list load from Supabase; JSON routes and files deleted. Checked as a guest (12 societies, 5 events, building panel). |
| 7 | Settings: Display name linked to `profiles.display_name` (logged in only), Text size removed, Language select (English, 简体中文, Español, Tiếng Việt), leader post form removed, macqAI renamed mcqAI | Done. Checked as a guest in a browser. Display name saving (logged in) not tested. |
| 8 | Vietnamese (`vi`) added to `i18n.js` and the events month title | Done. Key coverage checked against `zh` and `es` by script; not yet viewed in a browser. |
| 9 | Language select on `login.html` (changing it reloads the page) | Done. Syntax checked only; not yet viewed in a browser (none available in the last session). |
| 10 | Login language reload keeps typed email and display name (sessionStorage, never the password); `vi` wording: society leader is "Chủ nhiệm CLB" | Done. `node --check` on both files; zh, es and vi still have the same 85 keys (script). NOT checked in a browser (none installed). |
| 11 | Event plans in Supabase: `event_plans` table (private RLS), `auth.listMyPlans/savePlan/deletePlan`, Add event plan and What's Happening switched from `localStorage` | Done. SQL run on Supabase; the project owner added a plan logged in and it survived a page refresh. Guest view and a second device not tested. |
| 12 | Remove button on your own plans in What's Happening (`auth.deletePlan`) | Done. The project owner removed a plan logged in and it worked. |
| 13 | Settings (logged in): Followed societies list with Unfollow, and Clear my event plans (`auth.clearPlans`, confirm dialog); zh/es/vi strings added | Partly. `node --check` passes; as a guest the section is hidden and there are no console errors. Logged-in behaviour NOT tested: ask the project owner to try it. |

## Next step
Steps 0-12 are done; step 13 needs a logged-in check by the project owner. Remaining items are the gaps below and mcqAI answers (README roadmap). Society map pins were dropped by the project owner; do not propose them. Ask which to take next.

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
2026-10-26, after Step 13 (Settings: followed societies, clear plans). The bottom nav was also restyled in the Macquarie theme (CSS only).

### 2026-10-26 (tester risks, step 10)
* **Change:** `login.js` saves email and display name to sessionStorage (`imcq-login-*`) just before the language reload, restores them on load and removes them; the password is never stored. `vi` strings 'Leader of', 'Leader request pending/declined for', 'I lead a society', 'Societies held here' reworded.
* **Reasoning:** the reload wiped typed input. Not restored: the sign-up/log-in tab (page reopens on Log in, so a typed display name sits in a hidden field until the user clicks Sign up) and any shown message. Not checked in a browser.

### 2026-10-26
* **Change:** Display name linked to `profiles`, Text size and its CSS removed, language switching added (`i18n.js`), leader post/edit/delete UI removed from What's Happening, macqAI renamed mcqAI (including CSS class names `mcqai-*`).
* **Reasoning:** project owner request. Language reloads the page because it is the simplest way to rebuild every popup; English text as keys keeps the dictionary small.

### 2026-10-26 (tester findings 5-7)
* **Change:** Building panel, Category options (values stay English), "e.g. 1CC", "a society" now use `t()` with zh/es entries; events month title uses the language locale; `requireLogin` callers pass full sentences; login.js arrow parameter renamed `tab`.
* **Reasoning:** remove untranslated visible English and a shadowed global `t`. Checked as a guest in headless Chrome (en, zh, es); month title and logged-in flows not checked.
