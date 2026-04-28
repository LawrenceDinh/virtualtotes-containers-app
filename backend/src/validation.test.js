const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");

const Database = require("better-sqlite3");

const {
  DEFAULT_MAX_UPLOAD_SIZE_BYTES,
  validateContainerDeletion,
  validateContainerMove,
  validateObjectPayload,
  validateOwnedObject,
  validateQrUniqueness,
  validateUploadMetadata
} = require("./validation");

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
          (2, 1, 'Shelf Bin', 'qr-container-owner-child', 1),
          (3, 2, 'Other User Bin', 'qr-container-other-user', NULL),
          (4, 1, 'Empty Bin', NULL, NULL)
      `
    )
    .run();

  database
    .prepare(
      `
        INSERT INTO items (id, userId, name, qrCode, parentContainerId)
        VALUES
          (1, 1, 'Packing Tape', 'qr-item-owner', 1),
          (2, 2, 'Other User Item', 'qr-item-other-user', NULL)
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

test("validateOwnedObject enforces existence and ownership", () => {
  const database = createTestDatabase();

  try {
    assert.equal(validateOwnedObject(database, "container", 1, 1).name, "Garage Tote");
    assert.equal(validateOwnedObject(database, "item", 1, 1).name, "Packing Tape");

    assertHttpError(
      () => validateOwnedObject(database, "container", 3, 1),
      404,
      "not found"
    );

    assertHttpError(
      () => validateOwnedObject(database, "item", 99, 1),
      404,
      "not found"
    );
  } finally {
    database.close();
  }
});

test("validateObjectPayload enforces required fields, parent ownership, and parent existence", () => {
  const database = createTestDatabase();

  try {
    const payload = validateObjectPayload(
      database,
      "item",
      {
        name: "  Battery Charger  ",
        parentContainerId: "1",
        qrCode: "  qr-new-item  "
      },
      {
        userId: 1
      }
    );

    assert.deepEqual(payload, {
      name: "Battery Charger",
      parentContainer: {
        id: 1,
        userId: 1,
        name: "Garage Tote",
        photoPath: null,
        qrCode: "qr-container-owner-root",
        parentContainerId: null,
        createdAt: payload.parentContainer.createdAt,
        updatedAt: payload.parentContainer.updatedAt
      },
      parentContainerId: 1,
      qrCode: "qr-new-item"
    });

    assertHttpError(
      () =>
        validateObjectPayload(
          database,
          "item",
          {
            name: "   "
          },
          {
            userId: 1
          }
        ),
      400,
      "name is required"
    );

    assertHttpError(
      () =>
        validateObjectPayload(
          database,
          "item",
          {
            name: "Batteries",
            parentContainerId: 999
          },
          {
            userId: 1
          }
        ),
      404,
      "parent container not found"
    );

    assertHttpError(
      () =>
        validateObjectPayload(
          database,
          "item",
          {
            name: "Batteries",
            parentContainerId: 3
          },
          {
            userId: 1
          }
        ),
      404,
      "parent container not found"
    );
  } finally {
    database.close();
  }
});

test("validateQrUniqueness blocks duplicate qr codes across containers and items", () => {
  const database = createTestDatabase();

  try {
    assert.equal(validateQrUniqueness(database, "  qr-unique  "), "qr-unique");
    assert.equal(
      validateQrUniqueness(database, " qr-container-owner-root ", {
        currentObjectType: "container",
        currentObjectId: 1
      }),
      "qr-container-owner-root"
    );

    assertHttpError(
      () => validateQrUniqueness(database, "qr-container-owner-root"),
      409,
      "already linked"
    );

    assertHttpError(
      () => validateQrUniqueness(database, "qr-item-owner"),
      409,
      "already linked"
    );
  } finally {
    database.close();
  }
});

test("validateContainerMove prevents circular moves and validateContainerDeletion enforces ownership", () => {
  const database = createTestDatabase();

  try {
    const moveResult = validateContainerMove(database, 2, null, 1);
    assert.equal(moveResult.container.id, 2);
    assert.equal(moveResult.destinationParent, null);

    assertHttpError(
      () => validateContainerMove(database, 1, 1, 1),
      409,
      "inside itself"
    );

    assertHttpError(
      () => validateContainerMove(database, 1, 2, 1),
      409,
      "descendants"
    );

    assert.equal(validateContainerDeletion(database, 1, 1).id, 1);
    assert.equal(validateContainerDeletion(database, 4, 1).id, 4);
    assertHttpError(
      () => validateContainerDeletion(database, 3, 1),
      404,
      "not found"
    );
  } finally {
    database.close();
  }
});

test("validateUploadMetadata enforces allowed photo types and size limits", () => {
  assert.deepEqual(
    validateUploadMetadata({
      mimeType: "image/jpeg",
      sizeInBytes: 2048
    }),
    {
      mimeType: "image/jpeg",
      sizeInBytes: 2048
    }
  );

  assertHttpError(
    () =>
      validateUploadMetadata({
        mimeType: "text/plain",
        sizeInBytes: 100
      }),
    415,
    "not allowed"
  );

  assertHttpError(
    () =>
      validateUploadMetadata({
        mimeType: "image/png",
        sizeInBytes: DEFAULT_MAX_UPLOAD_SIZE_BYTES + 1
      }),
    413,
    "too large"
  );
});
