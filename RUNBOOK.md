RUNBOOK — Backup & Restore (VirtualTotes)
=======================================

This short runbook explains the supported backup and restore workflows for VirtualTotes.
Use the provided scripts in `backend/` for consistent backups and restores.

Important: always stop the web service (or ensure it is quiescent) before restoring.

Basic backup (script)
---------------------
The project includes a simple backup script in `backend/src/backup-local.js`. From the repository root:

```bash
cd backend
npm run backup
```

Default behavior:
- Creates a timestamped directory under `backups/` (repo-root) by default.
- Copies a consistent SQLite backup (`inventory.sqlite`) and the `photos/` directory.
- Writes `manifest.json` into the backup directory describing included files.

Custom backup path
------------------
To change where backups are written, set `BACKUP_PATH` (absolute or repo-relative):

```bash
BACKUP_PATH=/path/to/backups npm run backup
```

The script will print a message like: "Created backup at <backup-dir>".

Verify backup
-------------
- List backups: `ls -l backups/`
- Inspect manifest: `cat backups/<stamp>/manifest.json`
- (Optional) Check SQLite integrity locally: `sqlite3 data/inventory.sqlite "PRAGMA integrity_check;"` (requires sqlite3 installed)

Restore (script)
-----------------
Restore requires the `RESTORE_BACKUP_PATH` environment variable pointing to a backup directory (absolute or repo-relative). Example:

```bash
cd backend
# example using backup created at backups/2026-04-22T06-07-56Z
RESTORE_BACKUP_PATH=backups/2026-04-22T06-07-56Z npm run restore
```

Notes on restore:
- The restore script copies `inventory.sqlite` and the `photos/` directory from the specified backup into the configured data and photo paths.
- The restore operation will overwrite the active database and photo files. Stop the server before restoring.

Manual backup & restore (when scripts are not available)
-----------------------------------------------------
If you need a manual procedure (for example, for scripting or to run with different tooling):

1. Stop the service.
2. Create a timestamped directory:

```bash
mkdir -p backups/$(date -u +%Y-%m-%dT%H-%M-%SZ)
```

3. Copy database (use filesystem-level copy or sqlite backup API):

```bash
cp data/inventory.sqlite backups/<stamp>/inventory.sqlite
```

4. Copy photos directory:

```bash
rsync -a photos/ backups/<stamp>/photos/
```

5. Optionally create a manifest.json describing the backup contents.

To restore manually:

1. Stop the service.
2. Overwrite the database and photos from the chosen backup:

```bash
cp backups/<stamp>/inventory.sqlite data/inventory.sqlite
rm -rf photos/*
rsync -a backups/<stamp>/photos/ photos/
```

3. Start the service and verify the application data via the UI.

Scheduling backups (example)
---------------------------
Use the system cron or a scheduler to run nightly backups. Example crontab entry (runs at 03:00 UTC):

```cron
0 3 * * * cd /path/to/repo/backend && npm run backup >> /var/log/virtualtotes-backup.log 2>&1
```

Retention and housekeeping
-------------------------
Remove old backups with a simple `find` command (retain backups for 30 days):

```bash
find backups -maxdepth 1 -mindepth 1 -type d -mtime +30 -exec rm -rf {} +
```

Security and safety notes
-------------------------
- Keep backups on a separate disk or an external host where possible.
- Ensure file permissions prevent unauthorized access to backups and photos.
- Test restores periodically on a non-production host to validate procedures.

Troubleshooting
---------------
- If a backup fails because the database file is missing, confirm `config.DATABASE_PATH` and that the service created the DB.
- If a restore fails due to missing files, inspect the backup `manifest.json` and ensure the `inventory.sqlite` file and `photos/` folder exist.

Contact
-------
Open an issue in the repository for questions or to request enhancements to these scripts.
