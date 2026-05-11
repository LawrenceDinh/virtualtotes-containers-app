const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const { config } = require("./config");

function resolveBackupRoot() {
  return config.backupPath || path.join(config.repoRoot, "backups");
}

function formatTimestamp(date) {
  return date
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z")
    .replace(/:/g, "-");
}

function buildManifest({ createdAt, backupDir, databaseTargetPath, photosTargetPath }) {
  return {
    createdAt,
    backupDir,
    includes: [
      {
        type: "sqlite-database",
        sourcePath: config.databasePath,
        backupPath: databaseTargetPath
      },
      {
        type: "photos-directory",
        sourcePath: config.photoPath,
        backupPath: photosTargetPath
      }
    ]
  };
}

async function main() {
  if (!fs.existsSync(config.databasePath)) {
    throw new Error(`Database file not found at ${config.databasePath}`);
  }

  const backupRoot = resolveBackupRoot();
  const createdAt = new Date().toISOString();
  const stamp = formatTimestamp(new Date());
  const backupDir = path.join(backupRoot, stamp);
  const databaseTargetPath = path.join(backupDir, "inventory.sqlite");
  const photosTargetPath = path.join(backupDir, "photos");
  const manifestPath = path.join(backupDir, "manifest.json");

  fs.mkdirSync(backupDir, { recursive: true });

  const database = new Database(config.databasePath, { readonly: true });

  try {
    await database.backup(databaseTargetPath);
  } finally {
    database.close();
  }

  if (fs.existsSync(config.photoPath)) {
    fs.cpSync(config.photoPath, photosTargetPath, { recursive: true });
  } else {
    fs.mkdirSync(photosTargetPath, { recursive: true });
  }

  const manifest = buildManifest({
    createdAt,
    backupDir,
    databaseTargetPath,
    photosTargetPath
  });

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  process.stdout.write(`Created backup at ${backupDir}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
