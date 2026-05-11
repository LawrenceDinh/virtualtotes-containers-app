const fs = require("fs");
const path = require("path");

const Database = require("better-sqlite3");

const { config } = require("./config");

function formatBulkBackupTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");

  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate())
  ].join("") + "_" + [
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds())
  ].join("");
}

async function createSqliteBackup(operationType, options = {}) {
  const databasePath = options.databasePath || config.databasePath;
  const backupRoot = options.backupRoot || config.backupPath;
  const timestamp = formatBulkBackupTimestamp(options.now || new Date());
  const filename = `before_bulk_delete_${operationType}_${timestamp}.sqlite`;
  const targetPath = path.join(backupRoot, filename);

  if (!fs.existsSync(databasePath)) {
    throw new Error("Database file not found");
  }

  fs.mkdirSync(backupRoot, { recursive: true });

  const database = new Database(databasePath, { readonly: true });

  try {
    await database.backup(targetPath);
  } finally {
    database.close();
  }

  return {
    filename
  };
}

module.exports = {
  createSqliteBackup,
  formatBulkBackupTimestamp
};
