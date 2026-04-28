const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { config } = require("./config");
const {
  createHttpError,
  validateOwnedObject,
  validateUploadMetadata
} = require("./validation");

const PHOTO_EXTENSION_BY_MIME_TYPE = Object.freeze({
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
});

const PHOTO_CONTENT_TYPE_BY_EXTENSION = Object.freeze({
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
});

function getObjectTableName(objectType) {
  if (objectType === "container") {
    return "containers";
  }

  if (objectType === "item") {
    return "items";
  }

  throw createHttpError(400, "Unsupported object type");
}

function getObjectRecord(database, objectType, objectId, userId) {
  validateOwnedObject(database, objectType, objectId, userId);

  return database
    .prepare(`SELECT * FROM ${getObjectTableName(objectType)} WHERE id = ?`)
    .get(objectId);
}

function resolveStoredPhotoPath(photoPath) {
  if (typeof photoPath !== "string" || !photoPath.trim()) {
    throw createHttpError(404, "Photo not found");
  }

  const normalizedPhotoPath = path.normalize(photoPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const resolvedPhotoPath = path.resolve(config.photoPath, normalizedPhotoPath);
  const normalizedPhotoRoot = path.resolve(config.photoPath);

  if (
    resolvedPhotoPath !== normalizedPhotoRoot &&
    !resolvedPhotoPath.startsWith(`${normalizedPhotoRoot}${path.sep}`)
  ) {
    throw createHttpError(404, "Photo not found");
  }

  return resolvedPhotoPath;
}

function deleteStoredPhotoIfPresent(photoPath) {
  if (!photoPath) {
    return;
  }

  const resolvedPhotoPath = resolveStoredPhotoPath(photoPath);

  if (fs.existsSync(resolvedPhotoPath)) {
    fs.unlinkSync(resolvedPhotoPath);
  }
}

function updateObjectPhotoPath(database, objectType, objectId, photoPath) {
  database
    .prepare(
      `
        UPDATE ${getObjectTableName(objectType)}
        SET
          photoPath = ?,
          updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ?
      `
    )
    .run(photoPath, objectId);

  return database
    .prepare(`SELECT * FROM ${getObjectTableName(objectType)} WHERE id = ?`)
    .get(objectId);
}

function createStoredPhotoFilename(objectType, objectId, mimeType) {
  const extension = PHOTO_EXTENSION_BY_MIME_TYPE[mimeType];

  if (!extension) {
    throw createHttpError(415, "Upload type is not allowed");
  }

  return `${objectType}-${objectId}-${Date.now()}-${crypto.randomUUID()}${extension}`;
}

function storeObjectPhoto(database, objectType, objectId, userId, upload) {
  const object = getObjectRecord(database, objectType, objectId, userId);

  if (!upload || typeof upload !== "object" || Array.isArray(upload)) {
    throw createHttpError(400, "Upload metadata is required");
  }

  if (!Buffer.isBuffer(upload.buffer)) {
    throw createHttpError(400, "Upload body is required");
  }

  const metadata = validateUploadMetadata({
    mimeType: upload.mimeType,
    sizeInBytes: upload.buffer.length
  });
  const storedPhotoPath = createStoredPhotoFilename(
    objectType,
    object.id,
    metadata.mimeType
  );
  const resolvedPhotoPath = resolveStoredPhotoPath(storedPhotoPath);

  fs.writeFileSync(resolvedPhotoPath, upload.buffer);

  try {
    const updatedObject = updateObjectPhotoPath(
      database,
      objectType,
      object.id,
      storedPhotoPath
    );

    if (object.photoPath && object.photoPath !== storedPhotoPath) {
      deleteStoredPhotoIfPresent(object.photoPath);
    }

    return {
      [objectType]: updatedObject
    };
  } catch (error) {
    deleteStoredPhotoIfPresent(storedPhotoPath);
    throw error;
  }
}

function removeObjectPhoto(database, objectType, objectId, userId) {
  const object = getObjectRecord(database, objectType, objectId, userId);
  const updatedObject = updateObjectPhotoPath(database, objectType, object.id, null);

  if (object.photoPath) {
    deleteStoredPhotoIfPresent(object.photoPath);
  }

  return {
    [objectType]: updatedObject
  };
}

function getObjectPhotoFile(database, objectType, objectId, userId) {
  const object = getObjectRecord(database, objectType, objectId, userId);

  if (!object.photoPath) {
    throw createHttpError(404, "Photo not found");
  }

  const filePath = resolveStoredPhotoPath(object.photoPath);

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    throw createHttpError(404, "Photo not found");
  }

  return {
    contentType:
      PHOTO_CONTENT_TYPE_BY_EXTENSION[path.extname(filePath).toLowerCase()] ||
      "application/octet-stream",
    filePath
  };
}

module.exports = {
  PHOTO_CONTENT_TYPE_BY_EXTENSION,
  PHOTO_EXTENSION_BY_MIME_TYPE,
  deleteStoredPhotoIfPresent,
  getObjectPhotoFile,
  removeObjectPhoto,
  storeObjectPhoto
};
