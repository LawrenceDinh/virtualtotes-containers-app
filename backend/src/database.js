const fs = require("fs");
const path = require("path");

const Database = require("better-sqlite3");

const { config } = require("./config");

const schemaPath = path.join(__dirname, "schema.sql");

function ensureDatabaseDirectory() {
  fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
}

function openDatabase() {
  ensureDatabaseDirectory();

  const database = new Database(config.databasePath);
  database.pragma("foreign_keys = ON");

  return database;
}

function initializeDatabase() {
  const database = openDatabase();
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  try {
    database.exec(schemaSql);
  } finally {
    database.close();
  }
}

function withDatabase(callback) {
  const database = openDatabase();

  try {
    return callback(database);
  } finally {
    database.close();
  }
}

module.exports = {
  initializeDatabase,
  openDatabase,
  schemaPath,
  withDatabase
};
