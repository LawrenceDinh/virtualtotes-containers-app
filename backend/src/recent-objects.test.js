const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");

const Database = require("better-sqlite3");

const {
  DEFAULT_RECENT_OBJECT_LIMIT,
  listRecentObjects,
  recordRecentObjectOpen
} = require("./recent-objects");

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
          (2, 'other-user', 'hash')
      `
    )
    .run();

  database
    .prepare(
      `
        INSERT INTO containers (id, userId, name, photoPath, qrCode, parentContainerId)
        VALUES
          (1, 1, 'Garage Tote', 'container-1.jpg', 'qr-garage-tote', NULL),
          (2, 1, 'Shelf Bin', NULL, 'qr-shelf-bin', 1),
          (3, 1, 'Desk Drawer', NULL, NULL, NULL),
          (4, 2, 'Other User Bin', NULL, 'qr-other-user-bin', NULL)
      `
    )
    .run();

  database
    .prepare(
      `
        INSERT INTO items (id, userId, name, photoPath, qrCode, parentContainerId)
        VALUES
          (1, 1, 'Loose Batteries', NULL, 'qr-loose-batteries', NULL),
          (2, 1, 'Packing Tape', 'item-2.jpg', 'qr-packing-tape', 1),
          (3, 1, 'Cable Ties', NULL, NULL, 2),
          (4, 2, 'Other User Item', NULL, 'qr-other-user-item', 4)
      `
    )
    .run();

  return database;
}

function assertHttpError(callback, expectedStatusCode, expectedMessagePart) {
  assert.throws(callback, (error) => {
    assert.equal(error.statusCode, expectedStatusCode);

    if (expectedMessagePart) {
      assert.match(error.message, new RegExp(expectedMessagePart, "i"));
    }

    return true;
  });
}

test("recordRecentObjectOpen records container and item opens in most-recent-first order", () => {
  const database = createTestDatabase();

  try {
    recordRecentObjectOpen(database, 1, "container", 1);
    recordRecentObjectOpen(database, 1, "item", 2);

    const result = listRecentObjects(database, 1);

    assert.equal(result.limit, DEFAULT_RECENT_OBJECT_LIMIT);
    assert.deepEqual(
      result.recentObjects.map((recentObject) => ({
        objectType: recentObject.objectType,
        objectId: recentObject.objectId,
        name: recentObject.name,
        pathContext: recentObject.pathContext,
        photoPath: recentObject.photoPath,
        photoUrl: recentObject.photoUrl,
        topLevel: recentObject.topLevel
      })),
      [
        {
          objectType: "item",
          objectId: 2,
          name: "Packing Tape",
          pathContext: "Garage Tote > Packing Tape",
          photoPath: "item-2.jpg",
          photoUrl: "/api/photos/item/2?v=item-2.jpg",
          topLevel: false
        },
        {
          objectType: "container",
          objectId: 1,
          name: "Garage Tote",
          pathContext: "Top level",
          photoPath: "container-1.jpg",
          photoUrl: "/api/photos/container/1?v=container-1.jpg",
          topLevel: true
        }
      ]
    );
    assert.match(
      result.recentObjects[0].openedAt,
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  } finally {
    database.close();
  }
});

test("recordRecentObjectOpen deduplicates repeated opens by moving the object to the top", () => {
  const database = createTestDatabase();

  try {
    recordRecentObjectOpen(database, 1, "container", 1);
    recordRecentObjectOpen(database, 1, "item", 2);
    recordRecentObjectOpen(database, 1, "container", 1);

    const result = listRecentObjects(database, 1);
    const storedCount = database
      .prepare(
        `
          SELECT COUNT(*) AS count
          FROM recent_objects
          WHERE userId = 1 AND objectType = 'container' AND objectId = 1
        `
      )
      .get().count;

    assert.equal(storedCount, 1);
    assert.deepEqual(
      result.recentObjects.map((recentObject) => [
        recentObject.objectType,
        recentObject.objectId
      ]),
      [
        ["container", 1],
        ["item", 2]
      ]
    );
  } finally {
    database.close();
  }
});

test("recordRecentObjectOpen enforces ownership and trims the list to a fixed limit", () => {
  const database = createTestDatabase();

  try {
    assertHttpError(
      () => recordRecentObjectOpen(database, 1, "item", 4),
      404,
      "not found"
    );

    recordRecentObjectOpen(database, 1, "container", 1, { limit: 2 });
    recordRecentObjectOpen(database, 1, "item", 1, { limit: 2 });
    recordRecentObjectOpen(database, 1, "container", 2, { limit: 2 });

    const result = listRecentObjects(database, 1, { limit: 2 });
    const storedCount = database
      .prepare("SELECT COUNT(*) AS count FROM recent_objects WHERE userId = 1")
      .get().count;

    assert.equal(storedCount, 2);
    assert.deepEqual(
      result.recentObjects.map((recentObject) => [
        recentObject.objectType,
        recentObject.objectId
      ]),
      [
        ["container", 2],
        ["item", 1]
      ]
    );
  } finally {
    database.close();
  }
});

test("listRecentObjects removes stale and duplicate rows from older placeholder data", () => {
  const database = createTestDatabase();

  try {
    database
      .prepare(
        `
          INSERT INTO recent_objects (id, userId, objectType, objectId, openedAt)
          VALUES
            (1, 1, 'container', 1, '2026-01-01T00:00:03.000Z'),
            (2, 1, 'container', 1, '2026-01-01T00:00:02.000Z'),
            (3, 1, 'item', 999, '2026-01-01T00:00:01.000Z'),
            (4, 2, 'item', 4, '2026-01-01T00:00:04.000Z')
        `
      )
      .run();

    const result = listRecentObjects(database, 1);

    assert.deepEqual(result.recentObjects, [
      {
        objectId: 1,
        objectType: "container",
        name: "Garage Tote",
        openedAt: "2026-01-01T00:00:03.000Z",
        pathContext: "Top level",
        photoPath: "container-1.jpg",
        photoUrl: "/api/photos/container/1?v=container-1.jpg",
        topLevel: true
      }
    ]);

    assert.equal(
      database
        .prepare("SELECT COUNT(*) AS count FROM recent_objects WHERE userId = 1")
        .get().count,
      1
    );
  } finally {
    database.close();
  }
});
