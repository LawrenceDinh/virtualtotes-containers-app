const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const test = require("node:test");

const Database = require("better-sqlite3");

const { config } = require("./config");
const {
  getObjectPhotoFile,
  removeObjectPhoto,
  storeObjectPhoto
} = require("./photos");

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
          (1, 1, 'Garage Tote', 'qr-garage-tote', NULL)
      `
    )
    .run();

  database
    .prepare(
      `
        INSERT INTO items (id, userId, name, qrCode, parentContainerId)
        VALUES
          (1, 1, 'Packing Tape', 'qr-packing-tape', NULL)
      `
    )
    .run();

  return database;
}

function withTemporaryPhotoPath(callback) {
  const originalPhotoPath = config.photoPath;
  const temporaryPhotoPath = fs.mkdtempSync(
    path.join(os.tmpdir(), "containers-app-photos-")
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

test("storeObjectPhoto writes files, replaces old files, serves them, and removes them", () => {
  withTemporaryPhotoPath((photoPath) => {
    const database = createTestDatabase();

    try {
      const firstUpload = storeObjectPhoto(database, "container", 1, 1, {
        buffer: Buffer.from("first-photo"),
        mimeType: "image/png"
      });
      const firstPhotoPath = firstUpload.container.photoPath;

      assert.ok(firstPhotoPath);
      assert.equal(
        database
          .prepare("SELECT photoPath FROM containers WHERE id = 1")
          .get().photoPath,
        firstPhotoPath
      );
      assert.ok(fs.existsSync(path.join(photoPath, firstPhotoPath)));

      const secondUpload = storeObjectPhoto(database, "container", 1, 1, {
        buffer: Buffer.from("second-photo"),
        mimeType: "image/jpeg"
      });
      const secondPhotoPath = secondUpload.container.photoPath;

      assert.ok(secondPhotoPath);
      assert.notEqual(secondPhotoPath, firstPhotoPath);
      assert.equal(
        database
          .prepare("SELECT photoPath FROM containers WHERE id = 1")
          .get().photoPath,
        secondPhotoPath
      );
      assert.equal(fs.existsSync(path.join(photoPath, firstPhotoPath)), false);

      const photoFile = getObjectPhotoFile(database, "container", 1, 1);

      assert.equal(photoFile.contentType, "image/jpeg");
      assert.equal(fs.readFileSync(photoFile.filePath).toString("utf8"), "second-photo");

      const removedPhoto = removeObjectPhoto(database, "container", 1, 1);

      assert.equal(removedPhoto.container.photoPath, null);
      assert.equal(fs.existsSync(path.join(photoPath, secondPhotoPath)), false);
    } finally {
      database.close();
    }
  });
});
