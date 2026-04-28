# VirtualTotes

VirtualTotes helps you organize, locate, and manage physical containers and the items they hold using QR codes and a simple web interface.

Why VirtualTotes
- Organize: group items into named containers and nested containers.
- Find quickly: scan a QR code or search by name to open an item or container.
- Track movements: move items between containers and keep visual context with photos.

Key features
- QR scanning and manual QR entry to open or link objects.
- Create, edit, and nest containers; create and edit items.
- Item relocation (top-level ⇄ container, container → container).
- Global search and recent-items view for fast lookup.
- Optional photo attachments to help visually identify objects.

How it works (user perspective)
1. Scan: scan a container or item QR code with your phone or use manual entry.
2. View: the app opens the relevant page showing contents, photos, and the object's path.
3. Update: add or edit names, photos, and QR links on the object page.
4. Move: choose a destination container to relocate the item or container.
5. Find: use search or the recent-items panel to locate things you need.

- **Open the app:** visit `http://localhost:3000` in your browser after the server starts.

Getting started (local)
- Requirements: Node.js 18+.
- Quick start:

```bash
cd backend
npm install
npm start
```

- Open your browser at `http://localhost:3000` and sign in to begin using the app.

Security & privacy
- Data and photos are stored locally on the host machine; do not expose the server to the public internet without reviewing security settings.
- Configure a strong session secret before deploying outside a trusted LAN.

Tech stack (high level)
- Node.js backend with a small HTTP API
- SQLite for local storage
- Vanilla JavaScript single-page frontend (no cloud required)

Support
- For issues or feature requests, open an issue in the repository: https://github.com/LawrenceDinh/prototype-containers-app

License
- Add a license to the repository if you plan to publish or redistribute the project.

For a short runbook (backup/restore steps) or a user guide, I can add a focused document on request.
# VirtualTotes

VirtualTotes is a self-hosted personal inventory application for tracking containers and items using QR-linked labels.

Overview
--------
VirtualTotes helps you organize physical belongings by placing items into named containers (and nested containers), attaching optional photos and QR labels, and locating objects quickly via scan or search. It is intended for single-user, private LAN deployment and emphasizes simple, auditable storage and operations.

Key features
------------
- QR scanning and manual QR entry to open or link objects
- Create, edit, and nest containers; create and edit items
- Move items between containers or to/from top-level
- Global search and recent-items view for fast lookup
- Attach and replace photos for containers and items

How it works (user perspective)
--------------------------------
1. Scan — scan a QR label or enter it manually.
2. View — the app opens the matched container or item page showing contents, path, and photo.
3. Update — edit name, photo, or QR link from the object page.
4. Move — select a destination container (or top level) and confirm the move.
5. Find — use search or the recent-items panel to locate objects.

Quick start (local)
-------------------
Requirements

- Node.js 18+ (LTS recommended)

Install and run

```bash
cd backend
npm install
npm start
```

Open your browser to:

		http://localhost:3000

Testing
-------
- Run the full test sequence from the `backend` folder:

```bash
cd backend
npm test
```

- A focused frontend smoke test is available:

```bash
npm run test:frontend-smoke
```

Project structure (high level)
-----------------------------
Simple tree (selected):

```
backend/
	src/            # Node.js server, services, and tests
	package.json    # start/test scripts
frontend/
	index.html
	app.js          # single-page frontend controller
	style.css
photos/           # (runtime) photo files stored on disk
data/             # (runtime) SQLite database file
```

Tech stack
----------
- Backend: Node.js (no framework) with a small HTTP API
- Storage: SQLite for structured data, filesystem for photos
- Frontend: Vanilla HTML/CSS/JavaScript (single-page app)

Security & privacy
------------------
- Designed for private LAN usage; do not expose to the public internet without reviewing security and hardening measures.
- Authentication is required for object routes. Passwords are hashed and session cookies are signed.
- Photos are served through authenticated API endpoints; photo files are not publicly exposed.

Backup & persistence
--------------------
- Data persists in a local SQLite file and photos are stored on disk. Regularly back up both the database file and the photos directory.
- The repository contains local scripts for backup/restore (`backend` scripts) — use these on the host running the service.

Known limitations
-----------------
- Single-user, LAN-only deployment (no cloud sync or multi-user features)
- No drag-and-drop UI or label printing workflows
- Sessions are in-memory and not preserved across server restarts by default
- The frontend is a single large JS controller (readability and maintenance tradeoffs)

Roadmap (selected)
-------------------
- Stabilize full test harness and expand frontend smoke coverage
- Improve mobile browser acceptance and camera-based QR scanning UX
- Small usability refinements for move and create flows

Out of scope for Phase 1
------------------------
- Cloud sync, sharing, public object pages, multi-user collaboration
- Label printing, analytics, offline-first sync, drag-and-drop UI

License
-------

## License

Copyright © 2026 Lawrence Dinh. All rights reserved.

This repository is provided for portfolio and review purposes only. No permission is granted to copy, modify, distribute, or use this code commercially without written permission.

If you want a short runbook (backup/restore steps) or a user guide added to the repository, I can create one next.

