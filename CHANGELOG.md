
Claude recorded changes and reasoning using the format.

# HANDOFF (read this first; rewrite it at the end of every session)

## How to resume in a new AI chat
Paste this as your first message, then attach nothing else:
> Read README.md, CLAUDE.md and the HANDOFF section at the top of CHANGELOG.md. Continue from "Next step". Ask me before changing the plan.

## Rules for whoever (or whatever) edits this file
1. At the end of every session, update the HANDOFF section below. Do not leave it stale.
2. Add a dated entry (Date / Change / Reasoning) under it for what changed. Newest entries go last, as now.
3. Never write passwords, keys or real user emails here. Name where a secret lives instead (`.env`).
4. Mark each plan step Done, Partly or Not started, and say how it was verified.

## Project in one paragraph
iMCQ is a mobile-first Macquarie University campus map (Node/Express serving static HTML/JS, Leaflet map, popups over `index.html`). Goal of the current work: users log in, guests browse through a guest view, society leaders post society events, and users follow societies. Backend is Supabase (Postgres + Auth + row-level security). The browser talks to Supabase directly; Express serves pages, the map, and `GET /api/config` (public URL and publishable key from `.env`).

## Decisions already made (do not re-ask)
* Backend: Supabase, not MySQL/Docker. The README says so.
* Name: iMCQ everywhere (package name `imcq`).
* Leaders: choose a society at sign-up, an admin approves by editing `society_leaders.status` in the Supabase dashboard. No admin screen for the MVP.
* Guests: can browse everything; follow, event plan, tasks and posting show "Log in to ...".
* Roles: `profiles.role` is `student` or `admin`. A leader is a user with an approved `society_leaders` row.

## Plan status
| Step | What | Status |
| :--- | :--- | :--- |
| 0 | README + rename to iMCQ | Done |
| 1 | `database/schema.sql` and `seed.sql` | Done. Run on Supabase; societies (12) and events (5) read back correctly as a logged-out visitor. |
| 2 | Login page, guest entry, `js/lib/auth.js`, settings account block | Done. Guest path tested in browser. Sign-up and leader request were tested by the project owner (a pending `society_leaders` row appeared). |
| 3 | Guest gating (`auth.requireLogin()`, Add event plan gate) | Done. Tested as guest and logged in. |
| 4 | Follow societies (Follow/Following button, "Following" filter) | Not started. **Next step.** |
| 5 | Leader flow: "Post event" form on What's Happening for approved leaders, edit/delete own events | Not started. |
| 6 | Events and societies read from Supabase instead of `data/*.json`; remove `routes/societies.js`, `routes/events.js` | Not started. |

## Next step
Step 4. Add a Follow/Following button to society cards (`public/js/components/card.js` `societyCard`, wired in `public/js/pages/societies.js`). Call `auth.requireLogin('follow societies')` first. Write to the `follows` table through `supabase-js` (RLS allows only the user's own rows). Add a "Following" chip filter. `auth.js` does not yet expose the Supabase client; add a small accessor or a `follow`/`unfollow`/`myFollows` helper there.

## Where things are
* Pages are popups over the map: `public/index.html` plus `public/js/pages/*.js` (societies, events, event-plan, food, settings). Popups are built with `createPopup` in `public/js/components/popup.js`.
* Auth: `public/js/lib/auth.js` (global `auth`: `ready`, `user`, `profile`, `leaderships`, `onChange`, `signIn`, `signUp`, `signOut`, `continueAsGuest`, `requireLogin`, `listSocieties`). Login UI: `public/login.html`, `public/js/pages/login.js`.
* Database: `database/schema.sql` (tables, RLS, grants, sign-up trigger), `database/seed.sql`. Not applied automatically; run in the Supabase SQL editor.
* Server: `server.js` loads `.env` and serves `/api/map`, `/api/config`, and the JSON-backed `/api/societies`, `/api/events`, `/api/food`, `/api/tasks`.
* Secrets: `.env` (gitignored). `.env.example` lists the variable names.

## Running and testing
* `npm install` then `npm start`. Default port 3000; if busy the dev preview used 3001.
* Visitors with no session and no guest choice are redirected to `/login.html`. To test as a guest, use "Continue as guest". `localhost` and `127.0.0.1` have separate browser storage, which is a quick way to get a logged-out session without signing anyone out.
* Do not create accounts on the live Supabase project from automated tests; ask the project owner to sign up manually.

## Known gaps and gotchas
* Event plans and the Add event plan form still save to `localStorage`, not Supabase.
* The Display name field in User Settings is browser-only and not linked to `profiles.display_name`.
* Tasks have no screen yet (so no gating); `routes/tasks.js` and `data/tasks.json` are placeholder data.
* Sample events seed as the first admin (`created_by` must be a real user), so run `seed.sql` events only after an admin exists. Do not re-run the societies insert (names are unique).
* Event times in Supabase are `time` values (`12:00:00`); the UI expects strings like `12:00pm`, so format when Step 6 lands.
* If email confirmation is on in Supabase, sign-up needs a confirm-then-login round trip; the leader request is filed on first login from sign-up metadata.
* Stale/unused: `Dockerfile`, `docker-compose.yml`, `db.js`, `routes/macqai.js`, `scripts/import-geojson.js` (MySQL-era leftovers).
* `.claude/launch.json` server name is still `mcq-imap`.

## Last updated
2026-10-25, after Step 3.


# Date
2026-10-24

# Change
## Done
* Added an Express server that serves `public/` and `GET /api/map`.
* Added a Leaflet campus map locked to a 1.8 km circle around Wally's Walk.
* Added building footprints that open an info panel when tapped.
* Added a "Where are you heading?" search that zooms to a building.
* Added a bottom nav with five items and a red active state.
* Replaced the nav icons with the set from `MCQ iMap Assets Design.svg`.
* Set the Food and drinks and Societies icon strokes to match the other three.
* Renamed "Your event plan" to "Add event plan".
* Added a macqAI bar with a placeholder reply.
* Documented the current build status in `README.md`.
* Set the local address to `http://localhost:3001`.

## Not built yet
* Fill `events.html` with the What's Happening page.
* Fill `event-plan.html` with the Add event plan page.
* Fill `food.html` with the Food and drinks page.
* Fill `societies.html` with the On-campus Societies page.
* Fill `tasks.js` with the task plan logic.
* Add a task plan page for the first nav item.
* Add `events.js` to render and filter events.
* Add `food.js` to render and filter food outlets.
* Add `societies.js` to render society discovery.
* Add `card.js` as the shared event, society and food card.
* Add society pins on the map.
* Add red map markers.
* Add purple numbered cluster badges.
* Add `Leaflet.markercluster` to the map page.
* Add `routes/events.js` for event endpoints.
* Add `routes/societies.js` for society endpoints.
* Add `routes/food.js` for food outlet endpoints.
* Add `routes/tasks.js` for task endpoints.
* Add `routes/macqai.js` for the macqAI endpoint.
* Add query logging for macqAI questions.
* Replace the macqAI placeholder reply with real answers.
* Mount the route files in `server.js`.
* Add `db.js` as the shared MySQL pool.
* Add `database/schema.sql` for table definitions.
* Add `database/seed.sql` for sample data.
* Add `scripts/import-geojson.js` to load `data/map.geojson` into MySQL.
* Install `mysql2`, `cors` and `dotenv`.
* Add a `.env` file with database credentials.
* Fill `Dockerfile` and `docker-compose.yml` for Node and MySQL.
* Add a map logo and marker images to `public/images/`.

# Reasoning
* The server and map came first because every page depends on them.
* The icon strokes were uneven, so the nav looked inconsistent.
* The label now matches the new design.
* The README status section tells readers which pages are still blank.
* The unbuilt list mirrors the empty files and the blueprint in `README.md`.
* Port 3000 was taken on this machine, so the app runs on 3001.

# Date
2026-10-25

# Change
## Done
* Renamed the app to iMCQ in the README, page title, server log and `package.json`.
* Rewrote the README MVP for Supabase auth, guest/student/leader/admin roles, society follows and leader event posting.

# Reasoning
* The app's name is iMCQ, and the README still described MySQL and Docker, which no longer match the plan.
* The README is the blueprint, so it needs to describe the roles and data model before they are built.
* The Supabase key and the old asset filename were left as they are because they are real identifiers.

# Date
2026-10-25

# Change
## Done
* Wrote `database/schema.sql`: profiles, societies, society_leaders, follows and events, with row-level security, a sign-up trigger and grants.
* Wrote `database/seed.sql` with the 12 sample societies and 5 sample events.

## Not built yet
* The SQL has not been run against Supabase.

# Reasoning
* Row-level security enforces the roles, so the browser can talk to Supabase directly.
* Events are seeded under the first admin because `created_by` must be a real user.

# Date
2026-10-25

# Change
## Done
* Added `public/login.html` and `js/pages/login.js`: log in, sign up (with an optional "I lead a society" request) and "Continue as guest".
* Added `js/lib/auth.js`: Supabase session, profile and leader status, guest mode, and a redirect to the login page for visitors with neither.
* Added a `GET /api/config` route and `.env` loading to `server.js`, so the browser gets the Supabase URL and publishable key and never the secret key.
* Added an account block to the User Settings popup: name, role and Log out, or a Log in button for guests.

## Not built yet
* Sign-up and leader requests are untested because the schema had not been run on Supabase yet.
* Guest gating on follow, event plan and tasks (Step 3).

# Reasoning
* Keys come from `.env` through `/api/config` so they are not hard-coded in the pages.
* The leader request is stored in sign-up metadata and filed after the first sign-in, because email confirmation means there is no session at sign-up.

# Date
2026-10-25

# Change
## Done
* Added `auth.requireLogin(action)`, which shows a "Log in to ..." dialog to guests.
* Add event plan now shows a "Log in to add event plans" block to guests instead of the form.

## Not built yet
* Follow buttons (Step 4), which will call `requireLogin`.
* Gating for tasks, which have no screen yet.

# Reasoning
* Gating the form up front is clearer than letting a guest fill it in and then refusing.
* Add event plan is the only save action that exists today, so it is the only one gated.
