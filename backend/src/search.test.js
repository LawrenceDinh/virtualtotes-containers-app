const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");

const Database = require("better-sqlite3");

const { searchObjects } = require("./search");

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
        INSERT INTO containers (id, userId, name, qrCode, parentContainerId)
        VALUES
          (1, 1, 'Garage Tote', 'qr-garage-tote', NULL),
          (2, 1, 'Shelf Bin', 'qr-shelf-bin', 1),
          (3, 1, 'Cable Box', NULL, NULL),
          (4, 2, 'Other User Box', 'qr-other-user-box', NULL)
      `
    )
    .run();

  database
    .prepare(
      `
        INSERT INTO items (id, userId, name, qrCode, parentContainerId)
        VALUES
          (1, 1, 'Packing Tape', 'qr-packing-tape', 1),
          (2, 1, 'Cable Charger', 'qr-cable-charger', 2),
          (3, 1, 'Loose Batteries', NULL, NULL),
          (4, 2, 'Other User Charger', NULL, 4)
      `
    )
    .run();

  return database;
}

test("searchObjects returns both containers and items with path context and top-level state", () => {
  const database = createTestDatabase();

  try {
    const results = searchObjects(database, 1, "cable");

    assert.deepEqual(results, {
      query: "cable",
      results: [
        {
          objectId: 3,
          objectType: "container",
          name: "Cable Box",
          pathContext: "Top level",
          topLevel: true
        },
        {
          objectId: 2,
          objectType: "item",
          name: "Cable Charger",
          pathContext: "Garage Tote > Shelf Bin > Cable Charger",
          topLevel: false
        }
      ]
    });
  } finally {
    database.close();
  }
});

test("searchObjects returns top-level context and respects ownership", () => {
  const database = createTestDatabase();

  try {
    const results = searchObjects(database, 1, "batteries");

    assert.deepEqual(results, {
      query: "batteries",
      results: [
        {
          objectId: 3,
          objectType: "item",
          name: "Loose Batteries",
          pathContext: "Top level",
          topLevel: true
        }
      ]
    });
  } finally {
    database.close();
  }
});

test("searchObjects returns an empty result set for blank queries", () => {
  const database = createTestDatabase();

  try {
    assert.deepEqual(searchObjects(database, 1, "   "), {
      query: "",
      results: []
    });
  } finally {
    database.close();
  }
});
