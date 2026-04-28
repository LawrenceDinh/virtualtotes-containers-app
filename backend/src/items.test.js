const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");

const Database = require("better-sqlite3");

const {
  createItemInContainer,
  createTopLevelItem,
  deleteItem,
  editItem,
  getItemDetail,
  listTopLevelItems,
  moveItem
} = require("./items");

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
          (3, 1, 'Desk Drawer', NULL, NULL),
          (4, 2, 'Other User Bin', 'qr-other-user-bin', NULL)
      `
    )
    .run();

  database
    .prepare(
      `
        INSERT INTO items (id, userId, name, qrCode, parentContainerId)
        VALUES
          (1, 1, 'Loose Batteries', 'qr-loose-batteries', NULL),
          (2, 1, 'Packing Tape', 'qr-packing-tape', 1),
          (3, 2, 'Other User Item', 'qr-other-user-item', 4)
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

test("create top-level item, create item in container, and list top-level items", () => {
  const database = createTestDatabase();

  try {
    const topLevelResult = createTopLevelItem(database, 1, {
      name: "  Extension Cord  ",
      qrCode: "  qr-extension-cord  "
    });
    const childResult = createItemInContainer(database, 1, 1, {
      name: "  Label Maker  ",
      qrCode: "qr-label-maker"
    });
    const topLevelItems = listTopLevelItems(database, 1);

    assert.equal(topLevelResult.item.parentContainerId, null);
    assert.equal(topLevelResult.item.name, "Extension Cord");
    assert.equal(topLevelResult.item.qrCode, "qr-extension-cord");

    assert.equal(childResult.item.parentContainerId, 1);
    assert.equal(childResult.item.name, "Label Maker");

    assert.deepEqual(
      topLevelItems.items.map((item) => item.name),
      ["Extension Cord", "Loose Batteries"]
    );

    assertHttpError(
      () =>
        createItemInContainer(database, 4, 1, {
          name: "Nope",
          qrCode: "qr-nope"
        }),
      404,
      "parent container not found"
    );
  } finally {
    database.close();
  }
});

test("getItemDetail returns item info, top-level status, full path, and current parent container", () => {
  const database = createTestDatabase();

  try {
    const topLevelDetail = getItemDetail(database, 1, 1);
    const nestedDetail = getItemDetail(database, 2, 1);

    assert.equal(topLevelDetail.item.name, "Loose Batteries");
    assert.equal(topLevelDetail.topLevel, true);
    assert.equal(topLevelDetail.fullPath, "Loose Batteries");
    assert.equal(topLevelDetail.currentParentContainer, null);

    assert.equal(nestedDetail.item.name, "Packing Tape");
    assert.equal(nestedDetail.topLevel, false);
    assert.equal(nestedDetail.fullPath, "Packing Tape > Garage Tote");
    assert.equal(nestedDetail.currentParentContainer.id, 1);
    assert.equal(nestedDetail.currentParentContainer.name, "Garage Tote");
  } finally {
    database.close();
  }
});

test("editItem updates name and qrCode while enforcing ownership and endpoint boundaries", () => {
  const database = createTestDatabase();

  try {
    const result = editItem(database, 2, 1, {
      name: "  Shipping Tape  ",
      qrCode: "  qr-shipping-tape  "
    });

    assert.equal(result.item.name, "Shipping Tape");
    assert.equal(result.item.qrCode, "qr-shipping-tape");
    assert.equal(result.item.parentContainerId, 1);

    assertHttpError(
      () =>
        editItem(database, 2, 1, {
          name: "Still Wrong",
          parentContainerId: 3
        }),
      400,
      "move item endpoint"
    );

    assertHttpError(
      () =>
        editItem(database, 3, 1, {
          name: "Nope",
          qrCode: "qr-nope"
        }),
      404,
      "not found"
    );
  } finally {
    database.close();
  }
});

test("editItem preserves the existing qrCode when qrCode is omitted", () => {
  const database = createTestDatabase();

  try {
    const result = editItem(database, 2, 1, {
      name: "  Renamed Packing Tape  "
    });

    assert.equal(result.item.name, "Renamed Packing Tape");
    assert.equal(result.item.qrCode, "qr-packing-tape");
  } finally {
    database.close();
  }
});

test("moveItem supports all phase-1 movement paths and enforces route boundaries", () => {
  const database = createTestDatabase();

  try {
    const intoContainer = moveItem(database, 1, 1, {
      parentContainerId: 1
    });

    assert.equal(intoContainer.topLevel, false);
    assert.equal(intoContainer.fullPath, "Loose Batteries > Garage Tote");
    assert.equal(intoContainer.currentParentContainer.id, 1);

    const intoDifferentContainer = moveItem(database, 1, 1, {
      parentContainerId: 2
    });

    assert.equal(intoDifferentContainer.topLevel, false);
    assert.equal(
      intoDifferentContainer.fullPath,
      "Loose Batteries > Shelf Bin > Garage Tote"
    );
    assert.equal(intoDifferentContainer.currentParentContainer.id, 2);

    const backToTopLevel = moveItem(database, 2, 1, {
      parentContainerId: null
    });

    assert.equal(backToTopLevel.topLevel, true);
    assert.equal(backToTopLevel.fullPath, "Packing Tape");
    assert.equal(backToTopLevel.currentParentContainer, null);

    assertHttpError(
      () =>
        moveItem(database, 2, 1, {
          name: "Wrong Field",
          parentContainerId: null
        }),
      400,
      "only accepts parentContainerId"
    );

    assertHttpError(
      () => moveItem(database, 2, 1, {}),
      400,
      "parentContainerId is required"
    );
  } finally {
    database.close();
  }
});

test("deleteItem deletes owned items and enforces ownership", () => {
  const database = createTestDatabase();

  try {
    assert.deepEqual(deleteItem(database, 1, 1), {
      success: true
    });
    assert.equal(
      database
        .prepare("SELECT COUNT(*) AS count FROM items WHERE id = 1")
        .get().count,
      0
    );

    assertHttpError(
      () => deleteItem(database, 3, 1),
      404,
      "not found"
    );
  } finally {
    database.close();
  }
});
