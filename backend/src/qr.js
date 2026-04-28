const {
  createHttpError,
  findQrCodeMatch,
  validateOwnedObject,
  validateQrUniqueness,
  validateRequiredTextField
} = require("./validation");

function getObjectTableName(objectType) {
  if (objectType === "container") {
    return "containers";
  }

  if (objectType === "item") {
    return "items";
  }

  throw createHttpError(400, "Unsupported object type");
}

function getOwnedObject(database, objectType, objectId, userId) {
  return validateOwnedObject(database, objectType, objectId, userId);
}

function getObjectById(database, objectType, objectId) {
  return database
    .prepare(`SELECT * FROM ${getObjectTableName(objectType)} WHERE id = ?`)
    .get(objectId);
}

function updateObjectQrCode(database, objectType, objectId, qrCode) {
  database
    .prepare(
      `
        UPDATE ${getObjectTableName(objectType)}
        SET
          qrCode = ?,
          updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ?
      `
    )
    .run(qrCode, objectId);

  return getObjectById(database, objectType, objectId);
}

function buildQrResponse(matchType, objectRecord = null) {
  return {
    matchType,
    objectId: objectRecord ? objectRecord.id : null,
    objectType: objectRecord ? objectRecord.objectType : null
  };
}

function openByQr(database, userId, qrCode) {
  const normalizedQrCode = validateRequiredTextField(qrCode, "qrCode");
  const qrMatch = findQrCodeMatch(database, normalizedQrCode);

  if (!qrMatch || qrMatch.userId !== userId) {
    return buildQrResponse("nothing");
  }

  return buildQrResponse(qrMatch.objectType, qrMatch);
}

function linkQr(database, userId, payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createHttpError(400, "Request body must be an object");
  }

  const object = getOwnedObject(
    database,
    payload.objectType,
    payload.objectId,
    userId
  );

  if (object.qrCode) {
    throw createHttpError(409, "Object already has a QR code. Use replace QR.");
  }

  const normalizedQrCode = validateQrUniqueness(database, payload.qrCode, {
    currentObjectId: object.id,
    currentObjectType: payload.objectType
  });

  return {
    [payload.objectType]: updateObjectQrCode(
      database,
      payload.objectType,
      object.id,
      normalizedQrCode
    )
  };
}

function replaceQr(database, userId, payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createHttpError(400, "Request body must be an object");
  }

  const object = getOwnedObject(
    database,
    payload.objectType,
    payload.objectId,
    userId
  );

  if (!object.qrCode) {
    throw createHttpError(409, "Object does not have a QR code yet. Use link QR.");
  }

  const normalizedQrCode = validateQrUniqueness(database, payload.qrCode, {
    currentObjectId: object.id,
    currentObjectType: payload.objectType
  });

  return {
    [payload.objectType]: updateObjectQrCode(
      database,
      payload.objectType,
      object.id,
      normalizedQrCode
    )
  };
}

function removeQr(database, userId, payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createHttpError(400, "Request body must be an object");
  }

  const object = getOwnedObject(
    database,
    payload.objectType,
    payload.objectId,
    userId
  );

  return {
    [payload.objectType]: updateObjectQrCode(
      database,
      payload.objectType,
      object.id,
      null
    )
  };
}

module.exports = {
  linkQr,
  openByQr,
  removeQr,
  replaceQr
};
