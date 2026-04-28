# VirtualTotes — Prototype Containers App

Self-hosted personal inventory prototype (containers + items) designed for private LAN use and rapid local development.

**Contents**
- **Backend:** [backend/package.json](backend/package.json) and [backend/src/server.js](backend/src/server.js) (Node.js API, services, tests).
- **Frontend:** [frontend/index.html](frontend/index.html) and [frontend/app.js](frontend/app.js) (vanilla JS single-page app).

**Quick Start**
- **Requirements:** Node.js 18+ and npm.
- **Install & test:**

```bash
cd backend
npm install
npm test
# start the server (defaults to http://0.0.0.0:3000)
npm start
```

- **Open the app:** visit `http://localhost:3000` in your browser after the server starts.

**Development Workflows**
- **Run a single test file:** `node --test src/http.integration.test.js` (useful when `npm test` behaves differently).
- **Run frontend smoke checks:** `npm run test:frontend-smoke` from `backend`.
- **Lint / formatting:** this prototype does not enforce a specific formatter or linter by default.

**Key Files & Services**
- **Server entry:** [backend/src/server.js](backend/src/server.js) — HTTP routing, body parsing, and route dispatch.
- **Authentication:** [backend/src/auth.js](backend/src/auth.js) — password hashing, session cookie handling.
- **Photos:** [backend/src/photos.js](backend/src/photos.js) — validate/store/serve photos (private API route).
- **Recent objects:** [backend/src/recent-objects.js](backend/src/recent-objects.js) — track recent opens for the home view.
- **Frontend controller:** [frontend/app.js](frontend/app.js) — routing, views, and client-side interactions.

**Architecture Overview**
- **Storage:** SQLite database at `./data/inventory.sqlite` (configurable via `DATABASE_PATH`). Photo files stored under `./photos` (see `PHOTO_PATH`).
- **Object model:** Containers and items are separate tables; only containers may contain other objects. See `backend/src/schema.sql` for schema.
- **Private photo serving:** Photos are not served from a public directory; they are fetched via `GET /api/photos/:objectType/:id` and require authentication.

**Security & Operational Notes**
- **Do not expose to the public internet:** This app is intended for private LAN use only.
- **Session secret:** Change the default `SESSION_SECRET` before real deployment (set via `backend/.env` or environment variable `SESSION_SECRET`).
- **Passwords:** Passwords are stored hashed (see `backend/src/auth.js`).
- **Files excluded:** Photo binaries, backups, and local DB files are intentionally ignored by `.gitignore`.

**What Was Committed / What Was Excluded**
- **Committed (examples):** backend source and tests, frontend static files, `package.json`, `.gitignore`, and this `README.md`.
- **Excluded (intentionally):** `AGENTS.md`, `updates/*` (notes/transcripts), `data/`, `photos/`, `backups/`, `.env`, and `node_modules/`.

**Testing & Troubleshooting**
- If `npm test` fails on your machine, try running the failing file directly with `node --test <file>` to get a clearer failure trace.
- The codebase includes unit tests, HTTP integration tests, and a jsdom-based frontend smoke test. Use these to validate behavior after local changes.

**Contribution & Support**
- This project is a personal Phase-1 prototype. If you want help with a specific change (tests, a bugfix, or a small feature), open an issue or ask for a focused patch.

**License**
- This repository contains prototype code — add an explicit license if you plan to share or publish it.

**Contact**
- Repository: https://github.com/LawrenceDinh/prototype-containers-app

