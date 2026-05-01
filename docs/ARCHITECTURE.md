# Architecture — VirtualTotes (Phase 1)

Overview
--------
VirtualTotes is a small, LAN-first personal inventory prototype composed of a minimal Node.js backend and a single-page frontend. Data is stored in SQLite and photos are stored on disk; the app is intended for private, single-user deployments.

Components
----------
- Backend: `backend/src/` — CommonJS Node.js modules that implement REST-style endpoints, business logic, validation, and simple session-based authentication.
- Frontend: `frontend/` — a single-page vanilla JS app (`index.html`, `app.js`, `style.css`) that drives the UI and calls the backend API.
- Database: SQLite file (default path `./data/inventory.sqlite`). Schema is in `backend/src/schema.sql`.
- Photo storage: filesystem directory (default `./photos`); the DB stores photo file paths and photos are served through authenticated API endpoints.
- Authentication: single private account model with password hashing and server-issued session cookie. Session cookie options are set to reasonably conservative defaults for LAN use.
- QR flow: Each object (container or item) may have an associated `qrCode`. Scanning a QR triggers lookup to open, link, or create an object. QR uniqueness is enforced by the backend.
- Search: supported by simple SQL queries against the SQLite DB (see `backend/src/search.js`).
- Inventory overview: `backend/src/inventory-overview.js` returns owned object counts, item/container lists, and relationship paths for the overview page.
- Recent activity: `backend/src/recent-objects.js` stores recent create, move, and delete activity with object name/location snapshots. Legacy opened-object tracking remains separate and is not shown as activity.
- Container deletion: `backend/src/containers.js` requires an explicit content strategy for non-empty container deletion and moves only direct children inside a transaction.
- Backup/restore: local scripts `backend/src/backup-local.js` and `backend/src/restore-local.js` copy the DB and photos into a timestamped `backups/` folder and produce a `manifest.json`.

Runtime configuration
---------------------
Primary env vars (see `backend/.env.example`):

- `DATABASE_PATH` — path to the SQLite file (default `./data/inventory.sqlite`).
- `PHOTO_PATH` — directory where photos are stored (default `./photos`).
- `SESSION_SECRET` — cryptographic secret for signing sessions; replace for real deployments.
- `LOCAL_SERVER_ADDRESS` — full address used for some internal URL calculations (default `http://0.0.0.0:3000`).
- `BOOTSTRAP_USERNAME` / `BOOTSTRAP_PASSWORD` — optional credentials used to create the first account if the users table is empty.

Startup & deployment
--------------------
1. Install dependencies: `cd backend && npm install`.
2. Configure environment: copy `backend/.env.example` → `backend/.env` and set values.
3. Ensure `data/` and `photos/` directories exist and are writable by the service user.
4. Start: `cd backend && npm start` (app listens on configured `LOCAL_SERVER_ADDRESS`).

Security notes
--------------
- Do not expose the server to the public internet without additional hardening. The app assumes a private LAN by default.
- Set a strong `SESSION_SECRET` before any non-test use.
- Protect backups and the `photos/` directory because they contain private data.

Where to look in the code
-------------------------
- API surface and services: `backend/src/*` (auth, containers, items, photos, qr, search, recent-objects, inventory-overview).
- Schema and migrations: `backend/src/schema.sql`.
- Backup/restore: `backend/src/backup-local.js`, `backend/src/restore-local.js`.
