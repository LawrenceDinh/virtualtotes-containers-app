const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const test = require("node:test");

const Database = require("better-sqlite3");

const {
  createChildContainer,
  createTopLevelContainer,
  deleteContainer,
  editContainer,
  getContainerDetail,
  listParentContainerOptions,
  listTopLevelContainers,
  moveContainer
} = require("./containers");
const { config } = require("./config");

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
          (3, 2, 'Other User Bin', 'qr-other-user-bin', NULL),
          (4, 1, 'Empty Bin', NULL, NULL)
      `
    )
    .run();

  database
    .prepare(
      `
        INSERT INTO items (id, userId, name, qrCode, parentContainerId)
        VALUES
          (1, 1, 'Packing Tape', 'qr-packing-tape', 1),
          (2, 1, 'Zip Ties', NULL, 2),
          (3, 2, 'Other User Item', 'qr-other-user-item', 3)
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

function withTemporaryPhotoPath(callback) {
  const originalPhotoPath = config.photoPath;
  const temporaryPhotoPath = fs.mkdtempSync(
    path.join(os.tmpdir(), "containers-app-container-delete-")
  );

  config.photoPath = temporaryPhotoPath;

  try {
    callback(temporaryPhotoPath);
  } finally {
    config.photoPath = originalPhotoPath;
    fs.rmSync(temporaryPhotoPath, {
      force: true,
      recursive: true
    });
  }
}

test("create top-level container, create child container, and list top-level containers", () => {
  const database = createTestDatabase();

  try {
    const topLevelResult = createTopLevelContainer(database, 1, {
      name: "  Seasonal Storage  ",
      qrCode: "  qr-seasonal-storage  "
    });
    const childResult = createChildContainer(database, 1, 1, {
      name: "  Holiday Lights  ",
      qrCode: "qr-holiday-lights"
    });
    const topLevelContainers = listTopLevelContainers(database, 1);

    assert.equal(topLevelResult.container.parentContainerId, null);
    assert.equal(topLevelResult.container.name, "Seasonal Storage");
    assert.equal(topLevelResult.container.qrCode, "qr-seasonal-storage");

    assert.equal(childResult.container.parentContainerId, 1);
    assert.equal(childResult.container.name, "Holiday Lights");

    assert.deepEqual(
      topLevelContainers.containers.map((container) => container.name),
      ["Empty Bin", "Garage Tote", "Seasonal Storage"]
    );

    assertHttpError(
      () =>
        createChildContainer(database, 3, 1, {
          name: "Bad Child",
          qrCode: "qr-bad-child"
        }),
      404,
      "parent container not found"
    );
  } finally {
    database.close();
  }
});

test("getContainerDetail returns container info, path, children, and counts", () => {
  const database = createTestDatabase();

  try {
    const rootDetail = getContainerDetail(database, 1, 1);
    const childDetail = getContainerDetail(database, 2, 1);

    assert.equal(rootDetail.container.name, "Garage Tote");
    assert.equal(rootDetail.fullPath, "Garage Tote");
    assert.deepEqual(
      rootDetail.path.map((segment) => segment.name),
      ["Garage Tote"]
    );
    assert.deepEqual(
      rootDetail.childContainers.map((container) => container.name),
      ["Shelf Bin"]
    );
    assert.deepEqual(
      rootDetail.childItems.map((item) => item.name),
      ["Packing Tape"]
    );
    assert.equal(rootDetail.itemCount, 1);
    assert.equal(rootDetail.subcontainerCount, 1);

    assert.equal(childDetail.fullPath, "Shelf Bin > Garage Tote");
    assert.deepEqual(
      childDetail.childItems.map((item) => item.name),
      ["Zip Ties"]
    );
    assert.equal(childDetail.itemCount, 1);
    assert.equal(childDetail.subcontainerCount, 0);
  } finally {
    database.close();
  }
});

test("listParentContainerOptions returns owned containers with full path labels", () => {
  const database = createTestDatabase();

  try {
    const result = listParentContainerOptions(database, 1);

    assert.deepEqual(result.containers, [
      {
        id: 4,
        name: "Empty Bin",
        parentContainerId: null,
        fullPath: "Empty Bin",
        topLevel: true
      },
      {
        id: 1,
        name: "Garage Tote",
        parentContainerId: null,
        fullPath: "Garage Tote",
        topLevel: true
      },
      {
        id: 2,
        name: "Shelf Bin",
        parentContainerId: 1,
        fullPath: "Shelf Bin > Garage Tote",
        topLevel: false
      }
    ]);
  } finally {
    database.close();
  }
});

test("editContainer updates name and qrCode while enforcing ownership and endpoint boundaries", () => {
  const database = createTestDatabase();

  try {
    const result = editContainer(database, 1, 1, {
      name: "  Garage Shelf Tote  ",
      qrCode: "  qr-garage-shelf-tote  "
    });

    assert.equal(result.container.name, "Garage Shelf Tote");
    assert.equal(result.container.qrCode, "qr-garage-shelf-tote");
    assert.equal(result.container.parentContainerId, null);

    assertHttpError(
      () =>
        editContainer(database, 1, 1, {
          name: "Still Wrong",
          parentContainerId: 4
        }),
      400,
      "move container endpoint"
    );

    assertHttpError(
      () =>
        editContainer(database, 3, 1, {
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

test("editContainer preserves the existing qrCode when qrCode is omitted", () => {
  const database = createTestDatabase();

  try {
    const result = editContainer(database, 1, 1, {
      name: "  Renamed Garage Tote  "
    });

    assert.equal(result.container.name, "Renamed Garage Tote");
    assert.equal(result.container.qrCode, "qr-garage-tote");
  } finally {
    database.close();
  }
});

test("moveContainer updates parentContainerId and blocks circular nesting", () => {
  const database = createTestDatabase();

  try {
    assertHttpError(
      () =>
        moveContainer(database, 1, 1, {
          parentContainerId: 2
        }),
      409,
      "descendants"
    );

    const movedToTopLevel = moveContainer(database, 2, 1, {
      parentContainerId: null
    });

    assert.equal(movedToTopLevel.container.parentContainerId, null);
    assert.equal(movedToTopLevel.fullPath, "Shelf Bin");

    const movedIntoEmptyBin = moveContainer(database, 2, 1, {
      parentContainerId: 4
    });

    assert.equal(movedIntoEmptyBin.container.parentContainerId, 4);
    assert.equal(movedIntoEmptyBin.fullPath, "Shelf Bin > Empty Bin");

    assertHttpError(
      () =>
        moveContainer(database, 2, 1, {
          name: "Wrong Field",
          parentContainerId: null
        }),
      400,
      "only accepts parentContainerId"
    );

    assertHttpError(
      () => moveContainer(database, 2, 1, {}),
      400,
      "parentContainerId is required"
    );
  } finally {
    database.close();
  }
});

test("deleteContainer deletes empty containers", () => {
  const database = createTestDatabase();

  try {
    assert.deepEqual(deleteContainer(database, 4, 1), {
      success: true
    });
    assert.equal(
      database
        .prepare("SELECT COUNT(*) AS count FROM containers WHERE id = 4")
        .get().count,
      0
    );

  } finally {
    database.close();
  }
});

test("deleteContainer promotes direct children of a top-level container", () => {
  const database = createTestDatabase();

  try {
    database
      .prepare("UPDATE containers SET photoPath = ? WHERE id = ?")
      .run("child-container.jpg", 2);
    database
      .prepare("UPDATE items SET photoPath = ? WHERE id = ?")
      .run("child-item.jpg", 1);

    assert.deepEqual(deleteContainer(database, 1, 1), {
      success: true
    });

    assert.equal(
      database
        .prepare("SELECT COUNT(*) AS count FROM containers WHERE id = 1")
        .get().count,
      0
    );
    assert.deepEqual(
      database
        .prepare(
          "SELECT parentContainerId, qrCode, photoPath FROM containers WHERE id = 2"
        )
        .get(),
      {
        parentContainerId: null,
        qrCode: "qr-shelf-bin",
        photoPath: "child-container.jpg"
      }
    );
    assert.deepEqual(
      database
        .prepare(
          "SELECT parentContainerId, qrCode, photoPath FROM items WHERE id = 1"
        )
        .get(),
      {
        parentContainerId: null,
        qrCode: "qr-packing-tape",
        photoPath: "child-item.jpg"
      }
    );
    assert.equal(
      database.prepare("SELECT parentContainerId FROM items WHERE id = 2").get()
        .parentContainerId,
      2
    );
    assert.equal(
      database.prepare("SELECT parentContainerId FROM containers WHERE id = 3").get()
        .parentContainerId,
      null
    );
  } finally {
    database.close();
  }
});

test("deleteContainer promotes direct children of a nested container only one level", () => {
  const database = createTestDatabase();

  try {
    database
      .prepare(
        `
          INSERT INTO containers (id, userId, name, qrCode, parentContainerId)
          VALUES
            (5, 1, 'Small Parts Box', 'qr-small-parts-box', 2),
            (6, 1, 'Tiny Bags', 'qr-tiny-bags', 5)
        `
      )
      .run();
    database
      .prepare(
        `
          INSERT INTO items (id, userId, name, qrCode, parentContainerId)
          VALUES
            (4, 1, 'Direct Child Item', 'qr-direct-child-item', 2),
            (5, 1, 'Grandchild Item', 'qr-grandchild-item', 5)
        `
      )
      .run();

    assert.deepEqual(deleteContainer(database, 2, 1), {
      success: true
    });

    assert.equal(
      database
        .prepare("SELECT COUNT(*) AS count FROM containers WHERE id = 2")
        .get().count,
      0
    );
    assert.equal(
      database.prepare("SELECT parentContainerId FROM containers WHERE id = 5").get()
        .parentContainerId,
      1
    );
    assert.equal(
      database.prepare("SELECT parentContainerId FROM items WHERE id = 2").get()
        .parentContainerId,
      1
    );
    assert.equal(
      database.prepare("SELECT parentContainerId FROM items WHERE id = 4").get()
        .parentContainerId,
      1
    );
    assert.equal(
      database.prepare("SELECT parentContainerId FROM containers WHERE id = 6").get()
        .parentContainerId,
      5
    );
    assert.equal(
      database.prepare("SELECT parentContainerId FROM items WHERE id = 5").get()
        .parentContainerId,
      5
    );
  } finally {
    database.close();
  }
});

test("deleteContainer removes only the deleted container photo", () => {
  withTemporaryPhotoPath((photoPath) => {
    const database = createTestDatabase();

    try {
      fs.writeFileSync(path.join(photoPath, "deleted-container.jpg"), "deleted");
      fs.writeFileSync(path.join(photoPath, "child-container.jpg"), "child");
      database
        .prepare("UPDATE containers SET photoPath = ? WHERE id = ?")
        .run("deleted-container.jpg", 1);
      database
        .prepare("UPDATE containers SET photoPath = ? WHERE id = ?")
        .run("child-container.jpg", 2);

      assert.deepEqual(deleteContainer(database, 1, 1), {
        success: true
      });

      assert.equal(fs.existsSync(path.join(photoPath, "deleted-container.jpg")), false);
      assert.equal(fs.existsSync(path.join(photoPath, "child-container.jpg")), true);
      assert.equal(
        database.prepare("SELECT photoPath FROM containers WHERE id = 2").get()
          .photoPath,
        "child-container.jpg"
      );
    } finally {
      database.close();
    }
  });
});

test("deleteContainer enforces ownership", () => {
  const database = createTestDatabase();

  try {
    assertHttpError(
      () => deleteContainer(database, 3, 1),
      404,
      "not found"
    );

    assert.equal(
      database
        .prepare("SELECT COUNT(*) AS count FROM containers WHERE id = 3")
        .get().count,
      1
    );
  } finally {
    database.close();
  }
});
