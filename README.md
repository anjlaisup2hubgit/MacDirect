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
  3. **View 3: Your Event Plan (`/event-plan.html`)** - Icon: Clipboard with target icon. Personal agenda tracker and custom checklist for bookmarked events.
  4. **View 4: Food and Drinks (`/food.html`)** - Icon: Drink cup and burger. Map overlay and directory showing campus dining options, food outlets, and special offers.
  5. **View 5: On-Campus Societies (`/societies.html`)** - Icon: Group of people. Directory and discovery hub for university clubs and student organizations.
* **Screen Overlays & Floating Map UI Elements:**
  * **Top Search Bar:** Floating search input with magnifying glass icon and placeholder: `"Where are you heading?"`
  * **Interactive Map Area:** Full-screen Leaflet map centered on Macquarie University Campus with custom red map markers and clustered purple numerical badges (showing pin counts like 2, 3, 4, 6, 8).
  * **macqAI Floating Bar:** Floating search/prompt widget near the bottom reading `"Ask macqAI a question"`, accompanied by an Info icon button `(i)`.
* **Design Assets & Styling:**
  * Primary Accent / Marker Color: Dark Red `#8B0000` / `#A6192E`
  * Cluster Marker Badges: Purple `#6B21A8` with bold white numbers
  * Navigation Bar: Clean white bottom bar with high-contrast black line-art icons and titles

---

## 4. System & Agentic Architecture
* **File Structure & Layout:**
  ```text
  /mcq-imap
  ├── .env                   # [HUMAN ONLY - DB credentials & config]
  ├── CHANGELOG.md           # [Agent progress tracking file]
  ├── docker-compose.yml     # [Container configuration for Node & MySQL]
  ├── package.json           # [Node project manifest]
  ├── server.js              # [Backend entry point & REST API routes]
  ├── database/
  │   └── init.sql           # [Database creation script & sample data]
  └── public/                # [Frontend static assets]
      ├── index.html         # [Page 1: Map & Task Plan View]
      ├── events.html        # [Page 2: What's Happening]
      ├── event-plan.html    # [Page 3: Your Event Plan]
      ├── food.html          # [Page 4: Food and Drinks]
      ├── societies.html     # [Page 5: On-Campus Societies]
      ├── css/
      │   └── style.css      # [Mobile-first UI and floating overlay styles]
      └── js/
          ├── map.js         # [Leaflet map initialization, clustering & pins]
          ├── macqai.js      # [AI assistant chat overlay & queries]
          ├── events.js      # [Event rendering and filtering]
          └── societies.js   # [Society discovery logic]