const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const test = require("node:test");

const Database = require("better-sqlite3");

const { config } = require("./config");
const { getInventoryOverview } = require("./inventory-overview");
const {
  deleteAllContainers,
  deleteAllItems,
  getBulkDeleteContainersPreview,
  getBulkDeleteItemsPreview
} = require("./debug-bulk-delete");

const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");

function createTestDatabase() {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  database.exec(schemaSql);

  database
    .prepare(
      `
        INSERT INTO users (id, username, passwordHash)
        VALUES
          (1, 'owner', 'hash'),
          (2, 'other', 'hash')
      `
    )
    .run();

  database
    .prepare(
      `
        INSERT INTO containers (id, userId, name, photoPath, qrCode, parentContainerId)
        VALUES
          (1, 1, 'Outer Tote', NULL, 'qr-outer', NULL),
          (2, 1, 'Inner Box', NULL, 'qr-inner', 1),
          (3, 2, 'Other Tote', NULL, 'qr-other-container', NULL)
      `
    )
    .run();

  database
    .prepare(
      `
        INSERT INTO items (id, userId, name, photoPath, qrCode, parentContainerId)
        VALUES
          (1, 1, 'Loose Battery', NULL, 'qr-loose', NULL),
          (2, 1, 'Tape', NULL, 'qr-tape', 1),
          (3, 1, 'Miata', NULL, 'qr-miata', 2),
          (4, 2, 'Other Item', NULL, 'qr-other-item', 3)
      `
    )
    .run();

  database
    .prepare(
      `
        INSERT INTO recent_objects (userId, objectType, objectId)
        VALUES
          (1, 'item', 1),
          (1, 'item', 2),
          (1, 'container', 1),
          (1, 'container', 2),
          (2, 'item', 4),
          (2, 'container', 3)
      `
    )
    .run();

  return database;
}

function withDebugFlag(enabled, callback) {
  const previousValue = config.enableDebugBulkDelete;
  config.enableDebugBulkDelete = enabled;
  let result;

  try {
    result = callback();
  } catch (error) {
    config.enableDebugBulkDelete = previousValue;
    throw error;
  }

  if (result && typeof result.then === "function") {
    return result.finally(() => {
      config.enableDebugBulkDelete = previousValue;
    });
  }

  config.enableDebugBulkDelete = previousValue;
  return result;
}

function countRows(database, tableName, userId = 1) {
  return database
    .prepare(`SELECT COUNT(*) AS count FROM ${tableName} WHERE userId = ?`)
    .get(userId).count;
}

function countRecentObjects(database, objectType, userId = 1) {
  return database
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM recent_objects
        WHERE userId = ? AND objectType = ?
      `
    )
    .get(userId, objectType).count;
}

function createBackupStub(filename = "before_bulk_delete_test.sqlite") {
  return async () => ({
    filename
  });
}

test("debug bulk delete rejects preview and delete when feature flag is off", async () => {
  const database = createTestDatabase();

  try {
    await withDebugFlag(false, async () => {
      assert.throws(
        () => getBulkDeleteItemsPreview(database, 1),
        /Not found/
      );
      await assert.rejects(
        () => deleteAllItems(database, 1, { createBackup: createBackupStub() }),
        /Not found/
      );
      assert.throws(
        () => getBulkDeleteContainersPreview(database, 1),
        /Not found/
      );
      await assert.rejects(
        () =>
          deleteAllContainers(database, 1, {
            createBackup: createBackupStub()
          }),
        /Not found/
      );
    });

    assert.equal(countRows(database, "items"), 3);
    assert.equal(countRows(database, "containers"), 2);
  } finally {
    database.close();
  }
});

test("debug bulk delete previews item and container effects", () => {
  const database = createTestDatabase();

  try {
    withDebugFlag(true, () => {
      assert.deepEqual(getBulkDeleteItemsPreview(database, 1), {
        affectedContainers: 0,
        affectedItems: 3,
        confirmationPhrase: "DELETE ALL ITEMS",
        containersDeleted: false,
        containersPreserved: true,
        itemsDeleted: true,
        itemsPreserved: false,
        operation: "deleteAllItems",
        survivingItemsMovedToTopLevel: false
      });
      assert.deepEqual(getBulkDeleteContainersPreview(database, 1), {
        affectedContainers: 2,
        affectedItems: 3,
        confirmationPhrase: "DELETE ALL CONTAINERS",
        containersDeleted: true,
        containersPreserved: false,
        itemsDeleted: false,
        itemsPreserved: true,
        operation: "deleteAllContainers",
        survivingItemsMovedToTopLevel: true
      });
    });
  } finally {
    database.close();
  }
});

test("debug bulk delete items removes all owned items and leaves containers intact", async () => {
  const database = createTestDatabase();

  try {
    const result = await withDebugFlag(true, () =>
      deleteAllItems(database, 1, {
        createBackup: createBackupStub("before_bulk_delete_items_test.sqlite")
      })
    );

    assert.deepEqual(result, {
      backup: {
        filename: "before_bulk_delete_items_test.sqlite"
      },
      deletedContainers: 0,
      deletedItems: 3,
      movedItemsToTopLevel: 0,
      success: true
    });
    assert.equal(countRows(database, "items"), 0);
    assert.equal(countRows(database, "containers"), 2);
    assert.equal(countRows(database, "items", 2), 1);
    assert.equal(countRecentObjects(database, "item"), 0);
    assert.equal(countRecentObjects(database, "container"), 2);
    assert.deepEqual(
      getInventoryOverview(database, 1).relationshipPaths.map(
        (relationshipPath) => relationshipPath.path
      ),
      ["Inner Box > Outer Tote > Top Level", "Outer Tote > Top Level"]
    );

    const repeatedResult = await withDebugFlag(true, () =>
      deleteAllItems(database, 1, {
        createBackup: async () => {
          throw new Error("backup should not run for no-op item delete");
        }
      })
    );
    assert.deepEqual(repeatedResult, {
      backup: null,
      deletedContainers: 0,
      deletedItems: 0,
      movedItemsToTopLevel: 0,
      success: true
    });
  } finally {
    database.close();
  }
});

test("debug bulk delete containers preserves items and moves them to Top Level", async () => {
  const database = createTestDatabase();

  try {
    const result = await withDebugFlag(true, () =>
      deleteAllContainers(database, 1, {
        createBackup: createBackupStub("before_bulk_delete_containers_test.sqlite")
      })
    );

    assert.deepEqual(result, {
      backup: {
        filename: "before_bulk_delete_containers_test.sqlite"
      },
      deletedContainers: 2,
      deletedItems: 0,
      movedItemsToTopLevel: 3,
      success: true
    });
    assert.equal(countRows(database, "containers"), 0);
    assert.equal(countRows(database, "items"), 3);
    assert.equal(countRows(database, "containers", 2), 1);
    assert.equal(countRecentObjects(database, "container"), 0);
    assert.equal(countRecentObjects(database, "item"), 2);
    assert.deepEqual(
      database
        .prepare(
          `
            SELECT name, parentContainerId
            FROM items
            WHERE userId = ?
            ORDER BY id ASC
          `
        )
        .all(1),
      [
        {
          name: "Loose Battery",
          parentContainerId: null
        },
        {
          name: "Tape",
          parentContainerId: null
        },
        {
          name: "Miata",
          parentContainerId: null
        }
      ]
    );
    assert.deepEqual(
      getInventoryOverview(database, 1).relationshipPaths.map(
        (relationshipPath) => relationshipPath.path
      ),
      [
        "Loose Battery > Top Level",
        "Miata > Top Level",
        "Tape > Top Level"
      ]
    );

    const repeatedResult = await withDebugFlag(true, () =>
      deleteAllContainers(database, 1, {
        createBackup: async () => {
          throw new Error("backup should not run for no-op container delete");
        }
      })
    );
    assert.deepEqual(repeatedResult, {
      backup: null,
      deletedContainers: 0,
      deletedItems: 0,
      movedItemsToTopLevel: 0,
      success: true
    });
  } finally {
    database.close();
  }
});

test("debug bulk delete rolls back item and container transactions on failure", async () => {
  const itemDatabase = createTestDatabase();
  const containerDatabase = createTestDatabase();

  try {
    await withDebugFlag(true, async () => {
      await assert.rejects(
        () =>
          deleteAllItems(itemDatabase, 1, {
            createBackup: createBackupStub(),
            failAfterRecentCleanup: true
          }),
        /Simulated bulk item delete failure/
      );
      await assert.rejects(
        () =>
          deleteAllContainers(containerDatabase, 1, {
            createBackup: createBackupStub(),
            failAfterItemMove: true
          }),
        /Simulated bulk container delete failure/
      );
    });

    assert.equal(countRows(itemDatabase, "items"), 3);
    assert.equal(countRecentObjects(itemDatabase, "item"), 2);
    assert.equal(countRows(containerDatabase, "containers"), 2);
    assert.deepEqual(
      containerDatabase
        .prepare("SELECT id, parentContainerId FROM items WHERE userId = ? ORDER BY id")
        .all(1),
      [
        {
          id: 1,
          parentContainerId: null
        },
        {
          id: 2,
          parentContainerId: 1
        },
        {
          id: 3,
          parentContainerId: 2
        }
      ]
    );
  } finally {
    itemDatabase.close();
    containerDatabase.close();
  }
});

test("debug bulk delete backup failure prevents destructive changes", async () => {
  const database = createTestDatabase();

  try {
    await withDebugFlag(true, async () => {
      await assert.rejects(
        () =>
          deleteAllItems(database, 1, {
            createBackup: async () => {
              throw new Error("backup failed");
            }
          }),
        /backup failed/
      );
    });

    assert.equal(countRows(database, "items"), 3);
    assert.equal(countRows(database, "containers"), 2);
  } finally {
    database.close();
  }
});

test("debug bulk delete creates a SQLite backup before destructive work", async () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "containers-app-backup-test-")
  );
  const databasePath = path.join(temporaryDirectory, "inventory.sqlite");
  const backupRoot = path.join(temporaryDirectory, "backups");
  const database = new Database(databasePath);
  const previousDatabasePath = config.databasePath;
  const previousBackupPath = config.backupPath;

  database.pragma("foreign_keys = ON");
  database.exec(schemaSql);
  database
    .prepare("INSERT INTO users (id, username, passwordHash) VALUES (1, 'owner', 'hash')")
    .run();
  database
    .prepare("INSERT INTO items (id, userId, name, qrCode) VALUES (1, 1, 'Tape', 'qr-tape')")
    .run();
  config.databasePath = databasePath;
  config.backupPath = backupRoot;

  try {
    const result = await withDebugFlag(true, () => deleteAllItems(database, 1));

    assert.equal(result.deletedItems, 1);
    assert.match(
      result.backup.filename,
      /^before_bulk_delete_items_\d{8}_\d{6}\.sqlite$/
    );
    assert.equal(
      fs.existsSync(path.join(backupRoot, result.backup.filename)),
      true
    );
  } finally {
    config.databasePath = previousDatabasePath;
    config.backupPath = previousBackupPath;
    database.close();
    fs.rmSync(temporaryDirectory, {
      force: true,
      recursive: true
    });
  }
});
