# VirtualTotes — Prototype Containers App

Self-hosted personal inventory prototype (containers + items) intended for private LAN use.

Contents
- `backend/` — Node.js server, API routes, tests.
- `frontend/` — Vanilla JS single-page app and static assets.

Quick start (development)

Requirements: Node.js 18+ (or compatible LTS)

```bash
cd backend
npm install
npm test
# start the server
npm start
```

Notes
- Photos, backups, and runtime DB files are intentionally excluded from the repository (see `.gitignore`).
- This repository contains local-development and test artifacts; do not expose the server to the public internet without reviewing security and configuration.

If you need me to add a short contributing or runbook, say so and I will draft it without including internal or sensitive notes.
