# iMCQ - Macquarie University campus map

iMCQ is a mobile-first campus map for Macquarie University students. It shows buildings, lets students find and follow societies. Leader event posting is paused and currently has no UI (`auth.saveEvent`/`deleteEvent` remain, unused).

Current progress and the next task live in [CHANGELOG.md](CHANGELOG.md).

**Branches:** `main` is the full app. `pre-database` is the earlier version from before the Supabase database, login and users were added (commit `5c1faf9`). It is kept for a separate developer to work from. Get it with `git fetch origin` then `git checkout pre-database`.

## 1. Overview

* **Audience:** new students unfamiliar with campus, society leaders, and the general student population.
* **What it does:** one place for the campus map, building search, events, food options and societies. An AI assistant ("mcqAI") is planned.
* **Look and feel:** modern mobile app with a rounded bottom navigation bar, floating search controls and Macquarie's red as the accent colour.

## 2. Running locally

You need Node.js 20.6 or later. `server.js` uses `process.loadEnvFile`, which older versions lack. `package.json` does not enforce a version.

```bash
cp .env.example .env   # then fill in the Supabase values
npm install
npm start              # http://localhost:3000 (set PORT to change)
```

* `.env` is gitignored. `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are public by design (the browser uses them). `SUPABASE_SECRET_KEY` and any AI keys must stay in `.env` and never reach the browser.
* New visitors are sent to `/login.html` first. Log in, sign up, or choose "Continue as guest". Log in and Log out are in the User settings popup.

## 3. What works now

* **Map:** a Leaflet map (a JavaScript map library) on OpenStreetMap tiles, centred on Wally's Walk and locked to a 1.8 km circle around campus.
* **Buildings:** named footprints come from `GET /api/map`, built from `data/map.geojson` (GeoJSON, a standard map data format). Tapping one outlines it and opens an info panel with name, address, description and website.
* **Search bar:** one bar reading "Search buildings or ask mcqAI". Typing filters building names (up to 8 matches) and zooms to the one you pick. "Ask mcqAI" does nothing yet.
* **Accounts:** email and password sign-up and login, guest mode, and an "I lead a society" request at sign-up.
* **Guest gating:** actions that need an account show "Log in to use this".
* **Languages:** English, 简体中文, Español and Tiếng Việt, chosen on the login page or in User settings and stored in `localStorage`. Changing it reloads the page. Society, event and food content from the database stays in English.
* **Views:** five popups over the map (below). Societies and events are read from Supabase; only food is still static JSON.

For what is being built next, see [CHANGELOG.md](CHANGELOG.md). Not built yet: mcqAI answers.

## 4. Users and roles

| Role | How they get it | Can do |
| :--- | :--- | :--- |
| Guest | "Continue as guest" on the login page | Browse the map, events, food and societies. Nothing is saved. |
| Student | Signs up with email and password | Everything a guest can, plus follow societies and keep an event plan. |
| Society leader | Requests a society at sign-up; an admin approves | Everything a student can. Posting events from the app is not available yet; the database rules still allow it. |
| Admin | Set up by the project owner | Approves or rejects leader requests by editing the request status in the Supabase dashboard (no admin screen yet). |

## 5. Screens and design

The five views open as popups on the map page (`index.html`). The nav labels below match `public/js/components/nav.js`.

| Nav label | Opens | Login needed | Status |
| :--- | :--- | :--- | :--- |
| User settings | Account details, display name (logged in), language, Log in / Log out | No | Working |
| What's Happening | Campus events in a month calendar and day list | No | Working |
| Add event plan | Personal agenda for bookmarked events | Yes | Working, saved in the browser only (`localStorage`) |
| Food and drinks | Directory of campus dining options | No | Working with JSON data |
| On-campus Societies | Directory of societies, with Follow buttons | To follow | Working |

**Colours**

* Macquarie Red `#A6192E` for the accent and active nav item.
* Dark red `#8B0000` for accents.

**Icons.** The bottom-nav icons share one line weight and are inlined in `public/js/components/nav.js` using `currentColor`, so the active item turns Macquarie Red. The source artwork is [docs/MCQ iMap Assets Design.svg](docs/MCQ%20iMap%20Assets%20Design.svg).

## 6. Tech stack

| Layer | Choice | Purpose |
| :--- | :--- | :--- |
| Database and auth | Supabase (Postgres + Auth) | Stores societies, events, follows and leader requests; email and password login. Row-level security (rules in the database that decide who can read and write each row) protects the data. |
| Backend | Node.js with Express | Serves the pages, the map API and `GET /api/config` (public Supabase URL and publishable key). |
| Frontend | Plain HTML, CSS and JavaScript, plus supabase-js from a CDN | The browser talks to Supabase directly using the publishable key. |
| Map | Leaflet | Map rendering. |
| Packages | npm | Backend dependencies (only Express so far). |

## 7. Data model

The SQL is in `database/schema.sql` (tables, security rules, sign-up trigger) and `database/seed.sql` (sample data). Neither runs automatically: paste them into the Supabase SQL editor.

* `profiles(id, display_name, role)` where role is `student` or `admin`. A leader is a user with an approved `society_leaders` row.
* `societies(id, name, category, description, building, contact, website)`
* `society_leaders(user_id, society_id, status)` where status is `pending`, `approved` or `rejected`.
* `follows(user_id, society_id)`
* `events(id, society_id, title, category, date, time, building, description, created_by)`

Security rules: anyone can read societies and events; users manage only their own follows; only approved leaders can add events for their own society.

## 8. File structure

```text
MCQ iMap/
├── .env.example           # Template of required environment variables
├── CHANGELOG.md           # Current status and next step
├── CLAUDE.md              # Behavioural guidelines for AI assistants
├── package.json
├── server.js              # Backend entry point and routes
├── data/
│   ├── map.geojson        # OpenStreetMap campus data
│   └── food.json          # Food and drinks directory (static)
├── database/
│   ├── schema.sql         # Supabase tables and row-level security
│   └── seed.sql           # Sample societies and events
├── docs/                  # Design assets, assignment brief, screenshots
├── routes/                # Express handlers behind /api/...
│   └── food.js
└── public/
    ├── index.html         # The map page; all views open as popups here
    ├── login.html         # Login, sign-up and guest entry
    ├── css/style.css      # Mobile-first styles
    └── js/
        ├── components/    # nav.js, search-bar.js, popup.js, card.js
        ├── pages/         # map.js, events.js, event-plan.js, food.js, societies.js, settings.js, login.js
        └── lib/           # api.js (fetch wrapper), auth.js (Supabase client, session, guest mode), i18n.js (languages)
```

## 9. Roadmap

1. **mcqAI:** real answers and question logging.
