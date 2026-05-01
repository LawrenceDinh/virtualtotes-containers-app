const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");

const Database = require("better-sqlite3");

const {
  getContainerPathInfo,
  getContainerRelationshipPaths,
  getItemPathInfo
} = require("./paths");

const schemaSql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");

function createTestDatabase() {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  database.exec(schemaSql);

  database
    .prepare(
      `
        INSERT INTO users (id, username, passwordHash)
        VALUES (1, 'owner', 'hash')
      `
    )
    .run();

  database
    .prepare(
      `
        INSERT INTO containers (id, userId, name, photoPath, qrCode, parentContainerId)
        VALUES
          (1, 1, 'Garage Tote', 'garage-tote.jpg', 'qr-garage-tote', NULL),
          (2, 1, 'Shelf Bin', 'shelf-bin.jpg', 'qr-shelf-bin', 1),
          (3, 1, 'Desk Drawer', NULL, NULL, NULL)
      `
    )
    .run();

  database
    .prepare(
      `
        INSERT INTO items (id, userId, name, photoPath, qrCode, parentContainerId)
        VALUES
          (1, 1, 'Loose Batteries', NULL, 'qr-loose-batteries', NULL),
          (2, 1, 'Packing Tape', 'packing-tape.jpg', 'qr-packing-tape', 2)
      `
    )
    .run();

  return database;
}

test("shared path generation handles top-level and nested containers", () => {
  const database = createTestDatabase();

  try {
    const topLevelContainer = database
      .prepare("SELECT id, userId, name, photoPath, parentContainerId FROM containers WHERE id = 1")
      .get();
    const nestedContainer = database
      .prepare("SELECT id, userId, name, photoPath, parentContainerId FROM containers WHERE id = 2")
      .get();

    const topLevelPath = getContainerPathInfo(database, topLevelContainer);
    const nestedPath = getContainerPathInfo(database, nestedContainer);

    assert.equal(topLevelPath.topLevel, true);
    assert.equal(topLevelPath.fullPath, "Garage Tote");
    assert.deepEqual(
      topLevelPath.path.map((segment) => segment.name),
      ["Garage Tote"]
    );
    assert.deepEqual(
      topLevelPath.path.map((segment) => segment.objectType),
      ["container"]
    );
    assert.deepEqual(
      topLevelPath.path.map((segment) => segment.photoPath),
      ["garage-tote.jpg"]
    );

    assert.equal(nestedPath.topLevel, false);
    assert.equal(nestedPath.fullPath, "Shelf Bin > Garage Tote");
    assert.deepEqual(
      nestedPath.path.map((segment) => segment.name),
      ["Shelf Bin", "Garage Tote"]
    );
    assert.deepEqual(
      nestedPath.path.map((segment) => segment.photoPath),
      ["shelf-bin.jpg", "garage-tote.jpg"]
    );
  } finally {
    database.close();
  }
});

test("shared path generation handles top-level and nested items", () => {
  const database = createTestDatabase();

  try {
    const topLevelItem = database
      .prepare("SELECT id, userId, name, photoPath, parentContainerId FROM items WHERE id = 1")
      .get();
    const nestedItem = database
      .prepare("SELECT id, userId, name, photoPath, parentContainerId FROM items WHERE id = 2")
      .get();

    const topLevelPath = getItemPathInfo(database, topLevelItem);
    const nestedPath = getItemPathInfo(database, nestedItem);

    assert.equal(topLevelPath.topLevel, true);
    assert.equal(topLevelPath.fullPath, "Loose Batteries");
    assert.equal(topLevelPath.currentParentContainer, null);
    assert.deepEqual(
      topLevelPath.path.map((segment) => segment.objectType),
      ["item"]
    );

    assert.equal(nestedPath.topLevel, false);
    assert.equal(nestedPath.fullPath, "Packing Tape > Shelf Bin > Garage Tote");
    assert.deepEqual(
      nestedPath.path.map((segment) => segment.objectType),
      ["item", "container", "container"]
    );
    assert.deepEqual(
      nestedPath.path.map((segment) => segment.photoPath),
      ["packing-tape.jpg", "shelf-bin.jpg", "garage-tote.jpg"]
    );
    assert.equal(nestedPath.currentParentContainer.name, "Shelf Bin");
  } finally {
    database.close();
  }
});

test("shared relationship paths include container descendants", () => {
  const database = createTestDatabase();

  try {
    const topLevelContainer = database
      .prepare("SELECT id, userId, name, photoPath, parentContainerId FROM containers WHERE id = 1")
      .get();
    const nestedContainer = database
      .prepare("SELECT id, userId, name, photoPath, parentContainerId FROM containers WHERE id = 2")
      .get();

    assert.deepEqual(
      getContainerRelationshipPaths(database, topLevelContainer).map(
        (relationshipPath) => relationshipPath.fullPath
      ),
      [
        "Garage Tote",
        "Shelf Bin > Garage Tote",
        "Packing Tape > Shelf Bin > Garage Tote"
      ]
    );
    assert.deepEqual(
      getContainerRelationshipPaths(database, nestedContainer).map(
        (relationshipPath) => relationshipPath.fullPath
      ),
      ["Shelf Bin > Garage Tote", "Packing Tape > Shelf Bin > Garage Tote"]
    );
  } finally {
    database.close();
  }
});

test("shared path generation recalculates after container and item moves", () => {
  const database = createTestDatabase();

  try {
    database
      .prepare("UPDATE containers SET parentContainerId = ? WHERE id = ?")
      .run(3, 2);
    database
      .prepare("UPDATE items SET parentContainerId = ? WHERE id = ?")
      .run(1, 2);

    const movedContainer = database
      .prepare("SELECT id, userId, name, photoPath, parentContainerId FROM containers WHERE id = 2")
      .get();
    const movedItem = database
      .prepare("SELECT id, userId, name, photoPath, parentContainerId FROM items WHERE id = 2")
      .get();

    assert.equal(
      getContainerPathInfo(database, movedContainer).fullPath,
      "Shelf Bin > Desk Drawer"
    );
    assert.equal(
      getItemPathInfo(database, movedItem).fullPath,
      "Packing Tape > Garage Tote"
    );
  } finally {
    database.close();
  }
});
