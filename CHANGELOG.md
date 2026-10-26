
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
iMCQ is a mobile-first Macquarie University campus map (Node/Express serving static HTML/JS, Leaflet map, popups over `index.html`). Goal of the current work: users log in, guests browse through a guest view, society leaders post society events, and users follow societies. Backend is Supabase (Postgres + Auth + row-level security). The browser talks to Supabase directly; Express serves pages, the map, and `GET /api/config` (public URL and publishable key from `.env`).

## Decisions already made (do not re-ask)
* Backend: Supabase, not MySQL/Docker. The README says so.
* Name: iMCQ everywhere (package name `imcq`).
* Leaders: choose a society at sign-up, an admin approves by editing `society_leaders.status` in the Supabase dashboard. No admin screen for the MVP.
* Guests: can browse everything; follow, event plan and posting show "Log in to ...".
* Roles: `profiles.role` is `student` or `admin`. A leader is a user with an approved `society_leaders` row.

## Plan status
| Step | What | Status |
| :--- | :--- | :--- |
| 0 | README + rename to iMCQ | Done |
| 1 | `database/schema.sql` and `seed.sql` | Done. Run on Supabase; societies (12) and events (5) read back correctly as a logged-out visitor. |
| 2 | Login page, guest entry, `js/lib/auth.js`, settings account block | Done. Guest path tested in browser. Sign-up and leader request were tested by the project owner (a pending `society_leaders` row appeared). |
| 3 | Guest gating (`auth.requireLogin()`, Add event plan gate) | Done. Tested as guest and logged in. |
| 4 | Follow societies (Follow/Following button, "Following" filter) | Done. Follow/unfollow round-tripped to Supabase as a logged-in user; guest sees "Log in to follow societies". |
| 5 | Leader flow: "Post event" form on What's Happening for approved leaders, edit/delete own events | Not started. **Next step.** |
| 6 | Events and societies read from Supabase instead of `data/*.json`; remove `routes/societies.js`, `routes/events.js` | Not started. |

## Next step
Step 5. Add a "Post event" form to What's Happening (`public/js/pages/events.js`) shown only when `auth.leaderships` has an approved row; insert into `events` with `society_id` (RLS enforces leader/admin), plus edit/delete on the leader's own events. Events still come from `/api/events` (JSON) until Step 6, so posted events will not show until then; consider doing Step 6 first or together.

## Where things are
* Pages are popups over the map: `public/index.html` plus `public/js/pages/*.js` (societies, events, event-plan, food, settings). Popups are built with `createPopup` in `public/js/components/popup.js`.
* Auth: `public/js/lib/auth.js` (global `auth`: `ready`, `user`, `profile`, `leaderships`, `onChange`, `signIn`, `signUp`, `signOut`, `continueAsGuest`, `requireLogin`, `listSocieties`, `myFollows`, `setFollow`). Login UI: `public/login.html`, `public/js/pages/login.js`.
* Database: `database/schema.sql` (tables, RLS, grants, sign-up trigger), `database/seed.sql`. Not applied automatically; run in the Supabase SQL editor.
* Server: `server.js` loads `.env` and serves `/api/map`, `/api/config`, and the JSON-backed `/api/societies`, `/api/events`, `/api/food`.
* Secrets: `.env` (gitignored). `.env.example` lists the variable names.

## Running and testing
* `npm install` then `npm start`. Default port 3000; if busy the dev preview used 3001.
* Visitors with no session and no guest choice are redirected to `/login.html`. To test as a guest, use "Continue as guest". `localhost` and `127.0.0.1` have separate browser storage, which is a quick way to get a logged-out session without signing anyone out.
* Do not create accounts on the live Supabase project from automated tests; ask the project owner to sign up manually.

## Known gaps and gotchas
* Follow uses society ids from `data/societies.json` as Supabase ids; this holds only while the seeded `societies` ids are 1-12 in the same order. Step 6 removes the assumption.
* Event plans and the Add event plan form still save to `localStorage`, not Supabase.
* The Display name field in User Settings is browser-only and not linked to `profiles.display_name`.
* The Task Plan view is dropped, and its route, data and the MySQL-era leftovers (Docker files, `db.js`, `macqai.js`, `import-geojson.js`) are deleted.
* The empty `events.html`, `event-plan.html`, `food.html` were deleted; the icon SVG now lives in `docs/`.
* Sample events seed as the first admin (`created_by` must be a real user), so run `seed.sql` events only after an admin exists. Do not re-run the societies insert (names are unique).
* Event times in Supabase are `time` values (`12:00:00`); the UI expects strings like `12:00pm`, so format when Step 6 lands.
* If email confirmation is on in Supabase, sign-up needs a confirm-then-login round trip; the leader request is filed on first login from sign-up metadata.
* `.claude/launch.json` server name is still `mcq-imap`.

## Last updated
2026-10-25, after Step 4.
