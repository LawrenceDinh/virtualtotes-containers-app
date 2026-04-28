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

Inventory overview
------------------

- Objects: the app manages two primary object types: **containers** and **items**. Containers may contain items and other containers; items cannot contain anything.
- Data model: each object stores standard metadata: `id`, `userId`, `name`, `photoPath`, `qrCode`, `parentContainerId`, `createdAt`, and `updatedAt`.
- Top-level vs nested: both containers and items can exist at the top level (no parent) or nested under a container. The UI shows a `fullPath` for nested objects to make location clear.
- Recent objects: the backend records recently opened objects and the main view surfaces them for quick access.
- Photos: photos are stored on disk (paths stored in the DB) and served via authenticated API endpoints; photo files are not embedded in the database.
- QR workflow: a QR code maps to exactly one object; scanning an unknown QR opens a create-or-link flow so you can onboard physical items quickly.
- Move behavior: items can be moved to/from top-level and between containers. Container moves are validated to prevent circular nesting.

Container delete behavior
-------------------------

- Deleting a container does **not** recursively delete its descendants. Instead, direct child containers and items are promoted to the deleted container's parent (or become top-level if the deleted container was top-level). Grandchildren remain nested under their existing parents.
- The operation is executed inside a single database transaction to avoid partial states.
- When a container is deleted the container row is removed, and the container's photo file (if present) is deleted from storage. The QR link for the deleted container is also removed.
- Practical effect: deleting a container keeps its contents accessible but restructures them one level up — use this action with care if you expect to remove many objects.

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
Copyright © 2026 Luat "Lawrence" Dinh. All rights reserved.

This repository is provided for portfolio and review purposes only. No permission is granted to copy, modify, distribute, or use this code commercially without written permission.



