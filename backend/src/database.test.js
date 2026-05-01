const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const test = require("node:test");

const { config } = require("./config");
const { initializeDatabase, openDatabase, withDatabase } = require("./database");

function withTemporaryDatabasePath(callback) {
  const originalDatabasePath = config.databasePath;
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "containers-app-db-")
  );
  const temporaryDatabasePath = path.join(temporaryDirectory, "inventory.sqlite");

  config.databasePath = temporaryDatabasePath;

  try {
    callback(temporaryDatabasePath);
  } finally {
    config.databasePath = originalDatabasePath;
    fs.rmSync(temporaryDirectory, {
      force: true,
      recursive: true
    });
  }
}

test("initializeDatabase creates the expected tables on disk", () => {
  withTemporaryDatabasePath((databasePath) => {
    initializeDatabase();

    assert.equal(fs.existsSync(databasePath), true);

    const tableNames = withDatabase((database) =>
      database
        .prepare(
          `
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            ORDER BY name ASC
          `
        )
        .all()
        .map((row) => row.name)
    );

    assert.deepEqual(tableNames, [
      "containers",
      "items",
      "recent_activity",
      "recent_objects",
      "users"
    ]);
  });
});

test("withDatabase persists rows across separate database connections", () => {
  withTemporaryDatabasePath(() => {
    initializeDatabase();

    withDatabase((database) => {
      database
        .prepare(
          `
            INSERT INTO users (id, username, passwordHash)
            VALUES (1, 'tester', 'hash')
          `
        )
        .run();

      database
        .prepare(
          `
            INSERT INTO containers (id, userId, name, qrCode, parentContainerId)
            VALUES (1, 1, 'Garage Tote', 'qr-garage', NULL)
          `
        )
        .run();
    });

    const reopenedDatabase = openDatabase();

    try {
      const container = reopenedDatabase
        .prepare(
          `
            SELECT id, userId, name, qrCode, parentContainerId
            FROM containers
            WHERE id = 1
          `
        )
        .get();

      assert.deepEqual(container, {
        id: 1,
        userId: 1,
        name: "Garage Tote",
        qrCode: "qr-garage",
        parentContainerId: null
      });
    } finally {
      reopenedDatabase.close();
    }
  });
});

test("database schema enforces qr uniqueness within and across containers and items", () => {
  withTemporaryDatabasePath(() => {
    initializeDatabase();

    withDatabase((database) => {
      database
        .prepare(
          `
            INSERT INTO users (id, username, passwordHash)
            VALUES (1, 'tester', 'hash')
          `
        )
        .run();

      database
        .prepare(
          `
            INSERT INTO containers (id, userId, name, qrCode, parentContainerId)
            VALUES (1, 1, 'Garage Tote', 'qr-garage', NULL)
          `
        )
        .run();

      assert.throws(
        () =>
          database
            .prepare(
              `
                INSERT INTO containers (id, userId, name, qrCode, parentContainerId)
                VALUES (2, 1, 'Shelf Bin', 'qr-garage', NULL)
              `
            )
            .run(),
        /UNIQUE constraint failed|QR code is already linked to another object/
      );

      assert.throws(
        () =>
          database
            .prepare(
              `
                INSERT INTO items (id, userId, name, qrCode, parentContainerId)
                VALUES (1, 1, 'Packing Tape', 'qr-garage', NULL)
              `
            )
            .run(),
        /QR code is already linked to another object/
      );

      database
        .prepare(
          `
            INSERT INTO items (id, userId, name, qrCode, parentContainerId)
            VALUES (2, 1, 'Label Maker', 'qr-label-maker', NULL)
          `
        )
        .run();

      assert.throws(
        () =>
          database
            .prepare(
              `
                UPDATE containers
                SET qrCode = 'qr-label-maker'
                WHERE id = 1
              `
            )
            .run(),
        /QR code is already linked to another object/
      );
    });
  });
});
