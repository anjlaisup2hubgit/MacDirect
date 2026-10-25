# iMCQ - Master MVP Blueprint & Claude Code Execution File

---

## 1. Project Details & Identity
* **Project Name:** `iMCQ`
* **Core Description:** An interactive campus map for Macquarie University showing society locations, with AI-assisted navigation, student task and event management, food options, society discovery, user accounts, and society-led event posting.
* **Target Audience:** Society leaders, new students unfamiliar with campus, and the general student population.
* **Unique Selling Proposition (USP):** Solves campus fragmentation with a mobile-first, unified platform combining interactive map clustering, AI assistance ("macqAI"), task planning, and society engagement. Students follow the societies they care about, and society leaders post events straight to the campus feed.
* **Branding Tone & Style:** Modern mobile app UI featuring Macquarie University's official color palette (Macquarie Red `#A6192E`, clean white space, high-contrast typography, rounded bottom navigation bar with iconography, and floating search controls).

---

## 2. Technical Stack & Tooling Selection
| Layer | Choice | Purpose / Configuration |
| :--- | :--- | :--- |
| **Database & Auth** | `Supabase (Postgres + Auth)` | `Storage for societies, events, follows and leader requests; email/password login; row-level security enforces who can read and write` |
| **Language & Runtime** | `JavaScript / Node.js (Express)` | `Static file serving, campus map API and macqAI endpoint` |
| **Frontend** | `Vanilla HTML/CSS/JS + supabase-js (CDN)` | `Browser talks to Supabase directly using the public URL and publishable key` |
| **Package Manager** | `Standard npm` | `Managing backend dependencies` |
| **Connectors & Tools** | `Leaflet.js + Leaflet.markercluster + REST APIs` | `Interactive map rendering with clustered pin support and floating overlays` |

Secrets: `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are public by design. `SUPABASE_SECRET_KEY` and any AI keys live only in `.env` and are never committed or sent to the browser.

---

## 2a. Users & Roles
| Role | How they get it | Can do |
| :--- | :--- | :--- |
| **Guest** | Taps "Continue as guest" on the login page | Browse the map, events, food and societies. Follow, event plan, tasks and posting show "Log in to use this". Nothing is saved. |
| **Student** | Signs up with email and password | Everything a guest can, plus follow societies and use the event plan and task plan. |
| **Society leader** | Requests a society at sign-up; an admin approves | Everything a student can, plus post, edit and delete events for their own society. |
| **Admin** | Set up by the project owner | Approves or rejects leader requests (MVP: by editing the request status in the Supabase dashboard). |

### Planned data model (Supabase)
* `profiles(id, display_name, role)` where role is `student` or `admin`; a leader is a user with an approved `society_leaders` row
* `societies(id, name, category, description, building, contact, website)`
* `society_leaders(user_id, society_id, status)` where status is `pending`, `approved` or `rejected`
* `follows(user_id, society_id)`
* `events(id, society_id, title, category, date, time, building, description, created_by)`
* Row-level security: anyone can read societies and events; users manage only their own follows; only approved leaders can insert events for their own society.

---

## 3. UI/UX Sitemap & Design Specs
* **Primary Views:** `5 Bottom-Nav Views` plus a login page.
* **Login (`/login.html`):** Email and password sign-up and login, a "I lead a society" option with a society picker, and a "Continue as guest" button. Logged-in state shows in the User Settings popup (name, role, Log out, or Log in for guests). Visitors with no session and no guest choice are sent here first.
* **Page Inventory & Details (Bottom Navigation Bar):**
  1. **View 1: Your Task Plan (`/index.html` or `/task-plan.html`)** - Icon: User profile / avatar badge. Manages individual student tasks and daily schedules mapped to campus locations. Login required to save.
  2. **View 2: What's Happening (`/events.html`)** - Icon: Calendar with star. Shows campus events from the database, with a "Following" filter and badge. Approved leaders also see a "Post event" form for their society.
  3. **View 3: Add Event Plan (`/event-plan.html`)** - Icon: Clipboard with pencil. Personal agenda tracker and custom checklist for bookmarked events. Login required.
  4. **View 4: Food and Drinks (`/food.html`)** - Icon: Drink cup and burger. Map overlay and directory showing campus dining options, food outlets, and special offers.
  5. **View 5: On-Campus Societies (`/societies.html`)** - Icon: Group of people. Directory and discovery hub for clubs and student organizations, with a Follow/Following button on each society and a "Following" filter.
* **Screen Overlays & Floating Map UI Elements:**
  * **Top Search Bar:** Floating search input with magnifying glass icon and placeholder: `"Where are you heading?"`
  * **Interactive Map Area:** Full-screen Leaflet map centered on Macquarie University Campus with custom red map markers and clustered purple numerical badges (showing pin counts like 2, 3, 4, 6, 8).
  * **macqAI Floating Bar:** Floating search/prompt widget near the bottom reading `"Ask macqAI a question"`, accompanied by an Info icon button `(i)`.
* **Design Assets & Styling:**
  * Primary Accent / Marker Color: Dark Red `#8B0000` / `#A6192E`
  * Cluster Marker Badges: Purple `#6B21A8` with bold white numbers
  * Navigation Bar: Clean white bottom bar with high-contrast black line-art icons and titles. Icons come from `MCQ iMap Assets Design.svg`, share one line weight, and are inlined in `public/js/components/nav.js` using `currentColor` so the active page turns Macquarie Red.

---

## 3a. Current Build Status
**Working now**
* **Map home page (`/index.html`):** Leaflet map on OpenStreetMap tiles, centred on Wally's Walk and locked to a 1.8 km circle around campus (min zoom 15; dragging stops at the edge).
* **Building info:** Named building footprints are served by `GET /api/map`, built from `data/map.geojson`. Tapping a building outlines it in blue and opens a bottom info panel with name, address, description and website.
* **Search bar:** "Where are you heading?" filters building names (up to 8 matches) and zooms to the chosen building.
* **Bottom navigation:** Five items with the line-art icon set and a red active state.
* **macqAI bar:** Floating input and info button; submitting shows "macqAI is coming soon."
* **Placeholder data:** `/api/societies`, `/api/events`, `/api/food` and `/api/tasks` serve static JSON from `data/`. Page scripts for events, event plan, food, societies and user settings exist (settings are saved in `localStorage`).

**Not built yet**
* Accounts: the login page, guest entry and settings account block are built. Still to do: run the schema on Supabase (SQL in `database/`) and test sign-up end to end.
* Guest gating (`requireLogin()` prompts on follow, event plan and tasks).
* Following societies and leader event posting.
* Moving societies and events from JSON files to Supabase.
* Page HTML for events, event plan, food and societies is empty or missing.
* Task plan logic, map-level society pins and purple clusters, and the macqAI endpoint.

## 3b. Running Locally
```bash
npm install
npm start   # http://localhost:3000 (set PORT to change)
```

---

## 4. System & Agentic Architecture
* **File Structure & Layout:**
  ```text
  /imcq
  ├── .env                   # [HUMAN ONLY - Supabase secret key, AI keys & config]
  ├── .env.example           # [Template of required env variables]
  ├── .gitignore             # [Ignores .env and node_modules/]
  ├── CHANGELOG.md           # [Agent progress tracking file]
  ├── CLAUDE.md              # [Agent behavioural guidelines]
  ├── README.md              # [This blueprint]
  ├── package.json           # [Node project manifest]
  ├── server.js              # [Backend entry point, middleware & route mounting]
  ├── data/
  │   ├── map.geojson        # [OSM campus map data (UTF-8 GeoJSON)]
  │   └── *.json             # [Temporary seed data, replaced by Supabase tables]
  ├── database/
  │   ├── schema.sql         # [Supabase Postgres tables + row-level security]
  │   └── seed.sql           # [Sample societies and events]
  ├── scripts/
  │   └── import-geojson.js  # [One-off loader: data/map.geojson]
  ├── docs/                  # [Assignment brief, wireframes, screenshots]
  ├── routes/                # [Backend REST API route handlers - not publicly served]
  │   ├── food.js            # [Food outlet endpoints]
  │   ├── tasks.js           # [Task plan endpoints]
  │   └── macqai.js          # [macqAI query endpoint & query logging]
  └── public/                # [Frontend static assets]
      ├── index.html         # [Page 1: Map & Task Plan View]
      ├── login.html         # [Login, sign-up and guest entry; script: js/pages/login.js]
      ├── events.html        # [Page 2: What's Happening]
      ├── event-plan.html    # [Page 3: Your Event Plan]
      ├── food.html          # [Page 4: Food and Drinks]
      ├── societies.html     # [Page 5: On-Campus Societies]
      ├── css/
      │   └── style.css      # [Mobile-first UI and floating overlay styles]
      ├── images/            # [Nav icons, map markers, logo]
      └── js/
          ├── components/    # [Reusable UI shared across pages]
          │   ├── nav.js             # [Bottom navigation bar]
          │   ├── search-bar.js      # [Floating building search + "Ask macqAI" bar]
          │   ├── popup.js           # [Shared popup panel]
          │   └── card.js            # [Event / society / food card]
          ├── pages/         # [One script per page]
          │   ├── map.js             # [Leaflet map initialization, clustering & pins]
          │   ├── tasks.js           # [Task plan logic]
          │   ├── events.js          # [Event rendering, filtering & leader post form]
          │   ├── event-plan.js      # [Personal event plan]
          │   ├── food.js            # [Food outlet rendering and filtering]
          │   ├── societies.js       # [Society discovery and follow buttons]
          │   └── settings.js        # [User settings popup]
          └── lib/
              ├── api.js             # [fetch wrapper for /api calls]
              └── auth.js            # [Supabase client, session, role lookup, guest mode]
  ```

# Upcoming Features

1. **Accounts (next):** Supabase schema and security rules, login page, "Continue as guest", logged-in state in the nav.
2. **Guest gating:** a `requireLogin()` prompt on follow, event plan and task actions.
3. **Following:** Follow/Following on societies, a "Following" filter on societies and events.
4. **Society leaders:** leader request at sign-up, admin approval, and a post/edit/delete events form limited to their own society.
5. **Events from the database:** What's Happening reads from Supabase so posted events appear immediately.
6. **Tasks and food:** the task plan with locations and daily schedule, and the food directory with a map overlay.
7. **Map:** society pins with red markers and purple cluster badges.
8. **macqAI:** real answers and question logging.
