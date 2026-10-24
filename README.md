# MCQ iMap - Master MVP Blueprint & Claude Code Execution File

---

## 1. Project Details & Identity
* **Project Name:** `MCQ iMap`
* **Core Description:** An interactive campus map displaying Macquarie University society locations alongside AI-assisted navigation, student task and event management, food options, and society discovery.
* **Target Audience:** Society leaders, new students unfamiliar with campus, and the general student population.
* **Unique Selling Proposition (USP):** Solves campus fragmentation with a mobile-first, unified platform combining interactive map clustering, AI assistance ("macqAI"), task planning, and society engagement.
* **Branding Tone & Style:** Modern mobile app UI featuring Macquarie University's official color palette (Macquarie Red `#A6192E`, clean white space, high-contrast typography, rounded bottom navigation bar with iconography, and floating search controls).

---

## 2. Technical Stack & Tooling Selection
| Layer | Choice | Purpose / Configuration |
| :--- | :--- | :--- |
| **Database Architecture** | `MySQL` | `Relational storage for societies, events, tasks, map coordinates, and AI query logs` |
| **Language & Runtime** | `JavaScript / Node.js (Express)` | `Fast backend API routing and static file serving` |
| **Containerization & Setup** | `Docker Compose` | `Isolated containerized MySQL database and Node environment` |
| **Package Manager** | `Standard npm` | `Managing backend dependencies (express, mysql2, cors, dotenv)` |
| **Connectors & Tools** | `Leaflet.js + Leaflet.markercluster + REST APIs` | `Interactive map rendering with clustered pin support and floating overlays` |

---

## 3. UI/UX Sitemap & Design Specs
* **Total Page Limit:** `5 Primary Bottom-Nav Views`
* **Page Inventory & Details (Bottom Navigation Bar):**
  1. **View 1: Your Task Plan (`/index.html` or `/task-plan.html`)** - Icon: User profile / avatar badge. Manages individual student tasks and daily schedules mapped to campus locations.
  2. **View 2: What's Happening (`/events.html`)** - Icon: Calendar with star. Shows real-time campus activities, news updates, and scheduled events.
  3. **View 3: Add Event Plan (`/event-plan.html`)** - Icon: Clipboard with pencil. Personal agenda tracker and custom checklist for bookmarked events.
  4. **View 4: Food and Drinks (`/food.html`)** - Icon: Drink cup and burger. Map overlay and directory showing campus dining options, food outlets, and special offers.
  5. **View 5: On-Campus Societies (`/societies.html`)** - Icon: Group of people. Directory and discovery hub for university clubs and student organizations.
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
* **Building info:** Named building footprints are served by `GET /api/map`, built from `data/map.geojson`. Tapping a building outlines it in blue and opens a bottom info panel with name, address, description and website. Tapping the map or the close button dismisses it.
* **Search bar:** "Where are you heading?" filters building names (up to 8 matches). Choosing a result zooms to the building and opens its panel.
* **Bottom navigation:** Five items — Your task plan, What's Happening, Add event plan, Food and drinks, On-campus Societies — with the new icon set and a red active state.
* **macqAI bar:** Floating input and info button. The info button toggles a short description; submitting a question shows "macqAI is coming soon."

**Not built yet (empty placeholder files)**
* Pages: `events.html`, `event-plan.html`, `food.html`, `societies.html` and their page scripts, so the nav links to these currently open blank pages.
* Task plan page script (`tasks.js`), and the map-level society pins and purple clusters.
* Backend: `routes/*`, MySQL (`db.js`, schema, seed) and the macqAI endpoint. The server currently only serves static files and `/api/map`, and `express` is the only installed dependency.

## 3b. Running Locally
```bash
npm install
npm start   # http://localhost:3001
```

---

## 4. System & Agentic Architecture
* **File Structure & Layout:**
  ```text
  /mcq-imap
  ├── .env                   # [HUMAN ONLY - DB credentials & config]
  ├── .env.example           # [Template of required env variables]
  ├── .gitignore             # [Ignores .env and node_modules/]
  ├── CHANGELOG.md           # [Agent progress tracking file]
  ├── CLAUDE.md              # [Agent behavioural guidelines]
  ├── README.md              # [This blueprint]
  ├── Dockerfile             # [Node service image, used by docker-compose]
  ├── docker-compose.yml     # [Container configuration for Node & MySQL]
  ├── package.json           # [Node project manifest]
  ├── server.js              # [Backend entry point, middleware & route mounting]
  ├── db.js                  # [Shared mysql2 connection pool]
  ├── data/
  │   └── map.geojson        # [OSM campus map data (UTF-8 GeoJSON, 2,248 features)]
  ├── database/
  │   ├── schema.sql         # [Table definitions]
  │   └── seed.sql           # [Sample data]
  ├── scripts/
  │   └── import-geojson.js  # [One-off loader: data/map.geojson -> MySQL]
  ├── docs/                  # [Assignment brief, wireframes, screenshots]
  ├── routes/                # [Backend REST API route handlers - not publicly served]
  │   ├── events.js          # [Events endpoints]
  │   ├── societies.js       # [Societies endpoints]
  │   ├── food.js            # [Food outlet endpoints]
  │   ├── tasks.js           # [Task plan endpoints]
  │   └── macqai.js          # [macqAI query endpoint & query logging]
  └── public/                # [Frontend static assets]
      ├── index.html         # [Page 1: Map & Task Plan View]
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
          │   ├── search-bar.js      # [Floating "Where are you heading?" search]
          │   ├── macqai-widget.js   # [macqAI floating bar & chat overlay]
          │   └── card.js            # [Event / society / food card]
          ├── pages/         # [One script per page]
          │   ├── map.js             # [Leaflet map initialization, clustering & pins]
          │   ├── tasks.js           # [Task plan logic]
          │   ├── events.js          # [Event rendering and filtering]
          │   ├── food.js            # [Food outlet rendering and filtering]
          │   └── societies.js       # [Society discovery logic]
          └── lib/
              └── api.js             # [fetch wrapper for /api calls]

# Upcoming Features

1. Tasks: the task plan, task locations and a daily schedule.
2. Events: What’s Happening, event filtering, the event plan and its checklist.
3. Food and societies: the food directory with a map overlay, and the societies directory with discovery and map pins.
4. Map: red markers and purple cluster badges.
5. macqAI: real answers and question logging.
6. Data and setup: saved data in MySQL and Docker Compose.
