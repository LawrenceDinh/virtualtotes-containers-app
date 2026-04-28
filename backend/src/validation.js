const DEFAULT_ALLOWED_UPLOAD_MIME_TYPES = Object.freeze([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const DEFAULT_MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getObjectTableName(objectType) {
  if (objectType === "container") {
    return "containers";
  }

  if (objectType === "item") {
    return "items";
  }

  throw createHttpError(400, "Unsupported object type");
}

function getObjectLabel(objectType) {
  return objectType === "container" ? "Container" : "Item";
}

function normalizeOptionalTextField(value, fieldName) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw createHttpError(400, `${fieldName} must be a string`);
  }

  const normalizedValue = value.trim();
  return normalizedValue ? normalizedValue : null;
}

function validateRequiredTextField(value, fieldName) {
  const normalizedValue = normalizeOptionalTextField(value, fieldName);

  if (!normalizedValue) {
    throw createHttpError(400, `${fieldName} is required`);
  }

  return normalizedValue;
}

function normalizeNullableInteger(value, fieldName) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalizedValue =
    typeof value === "string" ? value.trim() : value;
  const numericValue = Number(normalizedValue);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw createHttpError(400, `${fieldName} must be a positive integer`);
  }

  return numericValue;
}

function validatePositiveInteger(value, fieldName) {
  const normalizedValue = normalizeNullableInteger(value, fieldName);

  if (normalizedValue === null) {
    throw createHttpError(400, `${fieldName} is required`);
  }

  return normalizedValue;
}

function validateOwnedObject(database, objectType, objectId, userId) {
  const tableName = getObjectTableName(objectType);
  const normalizedObjectId = validatePositiveInteger(objectId, "objectId");
  const normalizedUserId = validatePositiveInteger(userId, "userId");
  const object = database
    .prepare(`SELECT * FROM ${tableName} WHERE id = ?`)
    .get(normalizedObjectId);

  if (!object) {
    throw createHttpError(404, `${getObjectLabel(objectType)} not found`);
  }

  if (object.userId !== normalizedUserId) {
    throw createHttpError(404, `${getObjectLabel(objectType)} not found`);
  }

  return object;
}

function validateParentContainerAssignment(database, parentContainerId, userId) {
  const normalizedParentContainerId = normalizeNullableInteger(
    parentContainerId,
    "parentContainerId"
  );

  if (normalizedParentContainerId === null) {
    return null;
  }

  const normalizedUserId = validatePositiveInteger(userId, "userId");
  const parentContainer = database
    .prepare("SELECT * FROM containers WHERE id = ?")
    .get(normalizedParentContainerId);

  if (!parentContainer) {
    throw createHttpError(404, "Parent container not found");
  }

  if (parentContainer.userId !== normalizedUserId) {
    throw createHttpError(404, "Parent container not found");
  }

  return parentContainer;
}

function findQrCodeMatch(database, qrCode) {
  return database
    .prepare(
      `
        SELECT id, userId, 'container' AS objectType
        FROM containers
        WHERE qrCode = ?

        UNION ALL

        SELECT id, userId, 'item' AS objectType
        FROM items
        WHERE qrCode = ?

        LIMIT 1
      `
    )
    .get(qrCode, qrCode);
}

function validateQrUniqueness(database, qrCode, options = {}) {
  const normalizedQrCode = normalizeOptionalTextField(qrCode, "qrCode");

  if (normalizedQrCode === null) {
    return null;
  }

  const currentObjectType = options.currentObjectType || null;
  const currentObjectId =
    options.currentObjectId === null || options.currentObjectId === undefined
      ? null
      : validatePositiveInteger(options.currentObjectId, "currentObjectId");
  const qrCodeMatch = findQrCodeMatch(database, normalizedQrCode);

  if (!qrCodeMatch) {
    return normalizedQrCode;
  }

  if (
    currentObjectType === qrCodeMatch.objectType &&
    currentObjectId === qrCodeMatch.id
  ) {
    return normalizedQrCode;
  }

  throw createHttpError(409, "QR code is already linked to another object");
}

function assertContainerMoveIsNotCircular(database, container, destinationParent) {
  if (!destinationParent) {
    return;
  }

  if (destinationParent.id === container.id) {
    throw createHttpError(409, "Container cannot be moved inside itself");
  }

  const lookupContainer = database.prepare(
    "SELECT id, parentContainerId FROM containers WHERE id = ?"
  );
  const visitedContainerIds = new Set();
  let currentContainer = destinationParent;

  while (currentContainer) {
    if (visitedContainerIds.has(currentContainer.id)) {
      throw createHttpError(409, "Container ancestry is invalid");
    }

    visitedContainerIds.add(currentContainer.id);

    if (currentContainer.id === container.id) {
      throw createHttpError(
        409,
        "Container cannot be moved inside one of its descendants"
      );
    }

    if (currentContainer.parentContainerId === null) {
      return;
    }

    currentContainer = lookupContainer.get(currentContainer.parentContainerId);
  }

  throw createHttpError(409, "Destination container ancestry is invalid");
}

function validateContainerMove(
  database,
  containerId,
  destinationParentContainerId,
  userId
) {
  const container = validateOwnedObject(database, "container", containerId, userId);
  const destinationParent = validateParentContainerAssignment(
    database,
    destinationParentContainerId,
    userId
  );

  assertContainerMoveIsNotCircular(database, container, destinationParent);

  return {
    container,
    destinationParent
  };
}

function validateContainerDeletion(database, containerId, userId) {
  const container = validateOwnedObject(database, "container", containerId, userId);
  const childContainerCount = database
    .prepare("SELECT COUNT(*) AS count FROM containers WHERE parentContainerId = ?")
    .get(container.id).count;
  const childItemCount = database
    .prepare("SELECT COUNT(*) AS count FROM items WHERE parentContainerId = ?")
    .get(container.id).count;

  if (childContainerCount > 0 || childItemCount > 0) {
    throw createHttpError(409, "Container must be empty before deletion");
  }

  return container;
}

function validateObjectPayload(database, objectType, payload, options = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createHttpError(400, "Request body must be an object");
  }

  getObjectTableName(objectType);

  const normalizedUserId = validatePositiveInteger(options.userId, "userId");
  const currentObjectId =
    options.currentObjectId === null || options.currentObjectId === undefined
      ? null
      : validatePositiveInteger(options.currentObjectId, "currentObjectId");
  const name = validateRequiredTextField(payload.name, "name");
  const parentContainer = validateParentContainerAssignment(
    database,
    payload.parentContainerId,
    normalizedUserId
  );
  const qrCode = validateQrUniqueness(database, payload.qrCode, {
    currentObjectId,
    currentObjectType: objectType
  });

  if (objectType === "container" && currentObjectId !== null) {
    const container = validateOwnedObject(
      database,
      "container",
      currentObjectId,
      normalizedUserId
    );

    assertContainerMoveIsNotCircular(database, container, parentContainer);
  }

  return {
    name,
    parentContainer,
    parentContainerId: parentContainer ? parentContainer.id : null,
    qrCode
  };
}

function validateUploadMetadata(file, options = {}) {
  if (!file || typeof file !== "object" || Array.isArray(file)) {
    throw createHttpError(400, "Upload metadata is required");
  }

  const allowedMimeTypes = Array.isArray(options.allowedMimeTypes)
    ? options.allowedMimeTypes
    : DEFAULT_ALLOWED_UPLOAD_MIME_TYPES;
  const maxSizeBytes = Number.isInteger(options.maxSizeBytes)
    ? options.maxSizeBytes
    : DEFAULT_MAX_UPLOAD_SIZE_BYTES;
  const mimeType = validateRequiredTextField(
    file.mimeType || file.contentType,
    "mimeType"
  ).toLowerCase();
  const sizeInBytes = validatePositiveInteger(
    file.sizeInBytes ?? file.size,
    "sizeInBytes"
  );

  if (!allowedMimeTypes.includes(mimeType)) {
    throw createHttpError(415, "Upload type is not allowed");
  }

  if (sizeInBytes > maxSizeBytes) {
    throw createHttpError(413, "Upload is too large");
  }

  return {
    mimeType,
    sizeInBytes
  };
}

module.exports = {
  DEFAULT_ALLOWED_UPLOAD_MIME_TYPES,
  DEFAULT_MAX_UPLOAD_SIZE_BYTES,
  createHttpError,
  findQrCodeMatch,
  validateContainerDeletion,
  validateContainerMove,
  validateObjectPayload,
  validateOwnedObject,
  validateParentContainerAssignment,
  validateQrUniqueness,
  validateRequiredTextField,
  validateUploadMetadata
};
