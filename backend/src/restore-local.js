const fs = require("fs");
const path = require("path");

const { config } = require("./config");

function resolveRestoreSource() {
  const input = process.env.RESTORE_BACKUP_PATH;

  if (!input) {
    throw new Error("RESTORE_BACKUP_PATH is required");
  }

  return path.isAbsolute(input)
    ? input
    : path.resolve(config.repoRoot, input);
}

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function main() {
  const backupDir = resolveRestoreSource();
  const backupDatabasePath = path.join(backupDir, "inventory.sqlite");
  const backupPhotosPath = path.join(backupDir, "photos");

  if (!fs.existsSync(backupDir) || !fs.statSync(backupDir).isDirectory()) {
    throw new Error(`Backup directory not found at ${backupDir}`);
  }

  if (!fs.existsSync(backupDatabasePath)) {
    throw new Error(`Backup database file not found at ${backupDatabasePath}`);
  }

  ensureParentDirectory(config.databasePath);
  fs.copyFileSync(backupDatabasePath, config.databasePath);

  fs.rmSync(config.photoPath, {
    force: true,
    recursive: true
  });

  if (fs.existsSync(backupPhotosPath)) {
    fs.cpSync(backupPhotosPath, config.photoPath, { recursive: true });
  } else {
    fs.mkdirSync(config.photoPath, { recursive: true });
  }

  process.stdout.write(
    `Restored backup from ${backupDir} to ${config.databasePath} and ${config.photoPath}\n`
  );
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
