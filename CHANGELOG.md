
Claude recorded changes and reasoning using the format.

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
