const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");

const Database = require("better-sqlite3");

const { getContainerPathInfo, getItemPathInfo } = require("./paths");

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
        INSERT INTO containers (id, userId, name, qrCode, parentContainerId)
        VALUES
          (1, 1, 'Garage Tote', 'qr-garage-tote', NULL),
          (2, 1, 'Shelf Bin', 'qr-shelf-bin', 1),
          (3, 1, 'Desk Drawer', NULL, NULL)
      `
    )
    .run();

  database
    .prepare(
      `
        INSERT INTO items (id, userId, name, qrCode, parentContainerId)
        VALUES
          (1, 1, 'Loose Batteries', 'qr-loose-batteries', NULL),
          (2, 1, 'Packing Tape', 'qr-packing-tape', 2)
      `
    )
    .run();

  return database;
}

test("shared path generation handles top-level and nested containers", () => {
  const database = createTestDatabase();

  try {
    const topLevelContainer = database
      .prepare("SELECT id, userId, name, parentContainerId FROM containers WHERE id = 1")
      .get();
    const nestedContainer = database
      .prepare("SELECT id, userId, name, parentContainerId FROM containers WHERE id = 2")
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

    assert.equal(nestedPath.topLevel, false);
    assert.equal(nestedPath.fullPath, "Shelf Bin > Garage Tote");
    assert.deepEqual(
      nestedPath.path.map((segment) => segment.name),
      ["Shelf Bin", "Garage Tote"]
    );
  } finally {
    database.close();
  }
});

test("shared path generation handles top-level and nested items", () => {
  const database = createTestDatabase();

  try {
    const topLevelItem = database
      .prepare("SELECT id, userId, name, parentContainerId FROM items WHERE id = 1")
      .get();
    const nestedItem = database
      .prepare("SELECT id, userId, name, parentContainerId FROM items WHERE id = 2")
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
    assert.equal(nestedPath.currentParentContainer.name, "Shelf Bin");
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
      .prepare("SELECT id, userId, name, parentContainerId FROM containers WHERE id = 2")
      .get();
    const movedItem = database
      .prepare("SELECT id, userId, name, parentContainerId FROM items WHERE id = 2")
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
