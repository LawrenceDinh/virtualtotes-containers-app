const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");

const Database = require("better-sqlite3");

const {
  DEFAULT_RECENT_ACTIVITY_LIMIT,
  DEFAULT_RECENT_OBJECT_LIMIT,
  listRecentActivity,
  listRecentObjects,
  MAX_RECENT_ACTIVITY_LIMIT,
  recordRecentActivity,
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
        path: recentObject.path,
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
          path: [
            {
              id: 2,
              name: "Packing Tape",
              objectType: "item",
              photoPath: "item-2.jpg"
            },
            {
              id: 1,
              name: "Garage Tote",
              objectType: "container",
              photoPath: "container-1.jpg"
            }
          ],
          pathContext: "Packing Tape > Garage Tote",
          photoPath: "item-2.jpg",
          photoUrl: "/api/photos/item/2?v=item-2.jpg",
          topLevel: false
        },
        {
          objectType: "container",
          objectId: 1,
          name: "Garage Tote",
          path: [
            {
              id: 1,
              name: "Garage Tote",
              objectType: "container",
              photoPath: "container-1.jpg"
            }
          ],
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
    assert.equal(
      database.prepare("SELECT COUNT(*) AS count FROM recent_activity").get().count,
      0
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
        path: [
          {
            id: 1,
            name: "Garage Tote",
            objectType: "container",
            photoPath: "container-1.jpg"
          }
        ],
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

test("recordRecentActivity lists newest activity and keeps deleted snapshots", () => {
  const database = createTestDatabase();

  try {
    recordRecentActivity(database, 1, {
      actionType: "created",
      objectId: 1,
      objectName: "Loose Batteries",
      objectType: "item",
      toLocation: "Top level"
    });
    recordRecentActivity(database, 1, {
      actionType: "moved",
      fromLocation: "Garage Tote",
      objectId: 2,
      objectName: "Packing Tape",
      objectType: "item",
      toLocation: "Shelf Bin > Garage Tote"
    });
    recordRecentActivity(database, 1, {
      actionType: "opened",
      objectId: 2,
      objectName: "Packing Tape",
      objectType: "item"
    });
    recordRecentActivity(database, 1, {
      actionType: "deleted",
      fromLocation: "Shelf Bin > Garage Tote",
      objectId: 3,
      objectName: "Cable Ties",
      objectType: "item"
    });
    recordRecentActivity(database, 2, {
      actionType: "created",
      objectId: 4,
      objectName: "Other User Item",
      objectType: "item",
      toLocation: "Top level"
    });

    database.prepare("DELETE FROM items WHERE id = 3").run();

    const result = listRecentActivity(database, 1);

    assert.deepEqual(
      result.recentObjects.map((activity) => ({
        actionType: activity.actionType,
        activityLabel: activity.activityLabel,
        canNavigate: activity.canNavigate,
        fromLocation: activity.fromLocation,
        isDeleted: activity.isDeleted,
        name: activity.name,
        objectId: activity.objectId,
        objectType: activity.objectType,
        toLocation: activity.toLocation
      })),
      [
        {
          actionType: "deleted",
          activityLabel: "Deleted item",
          canNavigate: false,
          fromLocation: "Shelf Bin > Garage Tote",
          isDeleted: true,
          name: "Cable Ties",
          objectId: 3,
          objectType: "item",
          toLocation: null
        },
        {
          actionType: "moved",
          activityLabel: "Moved item",
          canNavigate: true,
          fromLocation: "Garage Tote",
          isDeleted: false,
          name: "Packing Tape",
          objectId: 2,
          objectType: "item",
          toLocation: "Shelf Bin > Garage Tote"
        },
        {
          actionType: "created",
          activityLabel: "Created item",
          canNavigate: true,
          fromLocation: null,
          isDeleted: false,
          name: "Loose Batteries",
          objectId: 1,
          objectType: "item",
          toLocation: "Top level"
        }
      ]
    );
  } finally {
    database.close();
  }
});

test("listRecentActivity paginates activity entries and returns scoped totals", () => {
  const database = createTestDatabase();

  try {
    for (let index = 1; index <= 12; index += 1) {
      recordRecentActivity(database, 1, {
        actionType: "created",
        objectId: index <= 4 ? index : null,
        objectName: `Owner Activity ${index}`,
        objectType: index % 2 === 0 ? "item" : "container",
        toLocation: "Top level"
      });
    }

    for (let index = 1; index <= 3; index += 1) {
      recordRecentActivity(database, 2, {
        actionType: "created",
        objectId: 4,
        objectName: `Other Activity ${index}`,
        objectType: "item",
        toLocation: "Top level"
      });
    }

    const firstPage = listRecentActivity(database, 1, {
      limit: 5,
      offset: 0
    });
    const secondPage = listRecentActivity(database, 1, {
      limit: 5,
      offset: 5
    });
    const defaultPage = listRecentActivity(database, 1);
    const cappedPage = listRecentActivity(database, 1, {
      limit: MAX_RECENT_ACTIVITY_LIMIT + 50,
      offset: 0
    });

    assert.equal(defaultPage.limit, DEFAULT_RECENT_ACTIVITY_LIMIT);
    assert.equal(firstPage.limit, 5);
    assert.equal(firstPage.offset, 0);
    assert.equal(firstPage.returnedCount, 5);
    assert.equal(firstPage.totalCount, 12);
    assert.equal(secondPage.offset, 5);
    assert.equal(secondPage.returnedCount, 5);
    assert.equal(secondPage.totalCount, 12);
    assert.equal(cappedPage.limit, MAX_RECENT_ACTIVITY_LIMIT);
    assert.deepEqual(
      firstPage.recentObjects.map((activity) => activity.name),
      [
        "Owner Activity 12",
        "Owner Activity 11",
        "Owner Activity 10",
        "Owner Activity 9",
        "Owner Activity 8"
      ]
    );
    assert.deepEqual(
      secondPage.recentObjects.map((activity) => activity.name),
      [
        "Owner Activity 7",
        "Owner Activity 6",
        "Owner Activity 5",
        "Owner Activity 4",
        "Owner Activity 3"
      ]
    );
    assert.equal(
      firstPage.recentObjects.some((activity) =>
        activity.name.startsWith("Other Activity")
      ),
      false
    );
  } finally {
    database.close();
  }
});
