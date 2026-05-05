Contributing & Deploy Notes
===========================

Thank you for your interest in VirtualTotes. This guide explains how to contribute, run the project locally, and deploy it safely on a private LAN host.

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
- Do not commit sensitive files (see Security section below). Open an Issue when a change may affect private data or deployment safety.

2. Development (local)
----------------------
- Requirements: Node.js 18+ (LTS recommended).
- Quick start:

```bash
git clone <repo-url>
cd virtualtotes-containers-app/backend
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
  - Copy `backend/.env.example` to `backend/.env` and set required env values (do not commit `.env`).
  - Ensure `data/` and `photos/` directories exist and are writable by the service user.
  - Start the service with `npm start`, or install as a system service (systemd/PM2) and configure monitoring.
  - Regularly run backups (see `RUNBOOK.md`).

4. Security & sensitive files
-----------------------------
- Do NOT commit or push runtime data, environment files, backups, private local artifacts, or any files containing secrets.
- The repository contains a `.gitignore` configured to exclude common private and local-only files; verify staged files before committing.
- If a secret is accidentally committed, rotate it immediately and inform the maintainers.

5. Commit messages
------------------
- Use short, imperative summaries (e.g. `feat: add search endpoint`) and a fuller description in the message body when needed.
- Avoid generic messages such as `Initial commit` for substantive commits.
- You can use the supplied commit template `.gitmessage` as a starting point; to enable it locally:

```bash
git config commit.template .gitmessage
```

This helps maintain a clear history and makes releases easier to construct.

6. Support
----------
- Open an Issue for questions or to request repository-level changes.

Thank you for helping improve VirtualTotes.
