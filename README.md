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

**Contribution & Support**
- This project is a personal Phase-1 prototype. If you want help with a specific change (tests, a bugfix, or a small feature), open an issue or ask for a focused patch.

**License**
- This repository contains prototype code — add an explicit license if you plan to share or publish it.

**Contact**
- Repository: https://github.com/LawrenceDinh/prototype-containers-app

