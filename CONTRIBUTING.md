Contributing & Deploy Notes
===========================

Thank you for your interest in VirtualTotes. This short guide explains how to contribute, run the project locally, and deploy it safely on a private LAN host.

1. Contributing
---------------
- Report bugs or feature requests via GitHub Issues.
- For code changes: create a focused branch (e.g. `feature/brief-desc`), run tests, and open a pull request against `main`.
- Run tests before opening a PR:

```bash
cd backend
npm install
npm test
```

- Keep changes small and readable; avoid large refactors in a single PR.
- Do not commit sensitive files (see Security section below). If in doubt, ask via an Issue before committing.

2. Development (local)
----------------------
- Requirements: Node.js 18+ (LTS recommended).
- Quick start:

```bash
git clone <repo-url>
cd prototype-containers-app/backend
npm install
npm start
# app: http://localhost:3000
```

- Run the frontend smoke test:

```bash
cd backend
npm run test:frontend-smoke
```

3. Deploy (private LAN)
-----------------------
- VirtualTotes is designed for local, private LAN use. If you deploy, ensure the host is firewalled and not exposed to the public internet.
- Minimal deploy checklist:
  - Install Node.js 18+ on the host.
  - Clone this repository to the host.
  - Copy `backend/.env.example` → `backend/.env` and set required env values (do not commit `.env`).
  - Ensure `data/` and `photos/` directories exist and are writable by the service user.
  - Start the service with `npm start`, or install as a system service (systemd/PM2) and configure monitoring.
  - Regularly run backups (see `RUNBOOK.md`).

4. Security & sensitive files
-----------------------------
- Do NOT commit or push: `photos/`, `data/`, `backups/`, `.env`, `AGENTS.md`, `updates/`, `transcripts/`, or any files containing secrets.
- The repository contains a `.gitignore` configured to exclude those items; verify it before committing.
- If a secret is accidentally committed, rotate it immediately and inform the maintainers.

5. Support
----------
- Open an Issue for questions or to request repository-level changes.

Thank you for helping improve VirtualTotes.
