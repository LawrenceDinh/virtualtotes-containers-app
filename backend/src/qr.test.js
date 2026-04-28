const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");

const Database = require("better-sqlite3");

const { linkQr, openByQr, removeQr, replaceQr } = require("./qr");

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
          (1, 1, 'Garage Tote', 'qr-container-owner-root', NULL),
          (2, 1, 'Shelf Bin', NULL, 1),
          (3, 2, 'Other User Bin', 'qr-container-other-user', NULL)
      `
    )
    .run();

  database
    .prepare(
      `
        INSERT INTO items (id, userId, name, qrCode, parentContainerId)
        VALUES
          (1, 1, 'Packing Tape', 'qr-item-owner', 1),
          (2, 1, 'Label Maker', NULL, NULL),
          (3, 2, 'Other User Item', 'qr-item-other-user', NULL)
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

test("openByQr returns container, item, or nothing while respecting ownership", () => {
  const database = createTestDatabase();

  try {
    assert.deepEqual(openByQr(database, 1, " qr-container-owner-root "), {
      matchType: "container",
      objectId: 1,
      objectType: "container"
    });
    assert.deepEqual(openByQr(database, 1, "qr-item-owner"), {
      matchType: "item",
      objectId: 1,
      objectType: "item"
    });
    assert.deepEqual(openByQr(database, 1, "qr-container-other-user"), {
      matchType: "nothing",
      objectId: null,
      objectType: null
    });
    assert.deepEqual(openByQr(database, 1, "qr-not-linked-yet"), {
      matchType: "nothing",
      objectId: null,
      objectType: null
    });
  } finally {
    database.close();
  }
});

test("linkQr, replaceQr, and removeQr manage qr codes with uniqueness and ownership checks", () => {
  const database = createTestDatabase();

  try {
    const linkedItem = linkQr(database, 1, {
      objectType: "item",
      objectId: 2,
      qrCode: "  qr-label-maker  "
    });

    assert.equal(linkedItem.item.qrCode, "qr-label-maker");

    assertHttpError(
      () =>
        linkQr(database, 1, {
          objectType: "item",
          objectId: 2,
          qrCode: "qr-duplicate-attempt"
        }),
      409,
      "already has a qr code"
    );

    const replacedContainer = replaceQr(database, 1, {
      objectType: "container",
      objectId: 1,
      qrCode: "qr-garage-replaced"
    });

    assert.equal(replacedContainer.container.qrCode, "qr-garage-replaced");

    assertHttpError(
      () =>
        replaceQr(database, 1, {
          objectType: "container",
          objectId: 2,
          qrCode: "qr-no-existing-code"
        }),
      409,
      "does not have a qr code"
    );

    assertHttpError(
      () =>
        replaceQr(database, 1, {
          objectType: "container",
          objectId: 1,
          qrCode: "qr-item-owner"
        }),
      409,
      "already linked"
    );

    const removedContainerQr = removeQr(database, 1, {
      objectType: "container",
      objectId: 1
    });

    assert.equal(removedContainerQr.container.qrCode, null);

    assertHttpError(
      () =>
        linkQr(database, 1, {
          objectType: "container",
          objectId: 3,
          qrCode: "qr-nope"
        }),
      404,
      "not found"
    );
  } finally {
    database.close();
  }
});
