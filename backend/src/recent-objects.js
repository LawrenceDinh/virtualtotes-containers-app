const { getContainerPathInfo, getItemPathInfo } = require("./paths");
const { validateOwnedObject } = require("./validation");

const DEFAULT_RECENT_OBJECT_LIMIT = 20;

function getRecentObjectById(database, recentObjectId) {
  return database
    .prepare(
      `
        SELECT id, userId, objectType, objectId, openedAt
        FROM recent_objects
        WHERE id = ?
      `
    )
    .get(recentObjectId);
}

function getObjectForRecentEntry(database, userId, objectType, objectId) {
  try {
    return validateOwnedObject(database, objectType, objectId, userId);
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }

    throw error;
  }
}

function formatRecentObject(database, recentObject, object) {
  const pathInfo =
    recentObject.objectType === "container"
      ? getContainerPathInfo(database, object)
      : getItemPathInfo(database, object);
  const photoUrl = object.photoPath
    ? `/api/photos/${recentObject.objectType}/${recentObject.objectId}?v=${encodeURIComponent(object.photoPath)}`
    : null;

  return {
    objectId: recentObject.objectId,
    objectType: recentObject.objectType,
    name: object.name,
    openedAt: recentObject.openedAt,
    pathContext: pathInfo.topLevel ? "Top level" : pathInfo.fullPath,
    photoPath: object.photoPath,
    photoUrl,
    topLevel: pathInfo.topLevel
  };
}

function normalizeRecentObjectLimit(limit) {
  return Number.isInteger(limit) && limit > 0
    ? limit
    : DEFAULT_RECENT_OBJECT_LIMIT;
}

function recordRecentObjectOpen(database, userId, objectType, objectId, options = {}) {
  const limit = normalizeRecentObjectLimit(options.limit);
  const object = validateOwnedObject(database, objectType, objectId, userId);
  const recordOpenTransaction = database.transaction(() => {
    database
      .prepare(
        `
          DELETE FROM recent_objects
          WHERE userId = ? AND objectType = ? AND objectId = ?
        `
      )
      .run(userId, objectType, object.id);

    const insertResult = database
      .prepare(
        `
          INSERT INTO recent_objects (userId, objectType, objectId)
          VALUES (?, ?, ?)
        `
      )
      .run(userId, objectType, object.id);

    database
      .prepare(
        `
          DELETE FROM recent_objects
          WHERE id IN (
            SELECT id
            FROM recent_objects
            WHERE userId = ?
            ORDER BY openedAt DESC, id DESC
            LIMIT -1 OFFSET ?
          )
        `
      )
      .run(userId, limit);

    return getRecentObjectById(database, Number(insertResult.lastInsertRowid));
  });

  const recentObject = recordOpenTransaction();
  return {
    recentObject: formatRecentObject(database, recentObject, object)
  };
}

function listRecentObjects(database, userId, options = {}) {
  const limit = normalizeRecentObjectLimit(options.limit);
  const recentRows = database
    .prepare(
      `
        SELECT id, userId, objectType, objectId, openedAt
        FROM recent_objects
        WHERE userId = ?
        ORDER BY openedAt DESC, id DESC
      `
    )
    .all(userId);
  const seenObjects = new Set();
  const staleRecentObjectIds = [];
  const duplicateRecentObjectIds = [];
  const recentObjects = [];

  for (const recentRow of recentRows) {
    const objectKey = `${recentRow.objectType}:${recentRow.objectId}`;

    if (seenObjects.has(objectKey)) {
      duplicateRecentObjectIds.push(recentRow.id);
      continue;
    }

    const object = getObjectForRecentEntry(
      database,
      userId,
      recentRow.objectType,
      recentRow.objectId
    );

    if (!object) {
      staleRecentObjectIds.push(recentRow.id);
      continue;
    }

    seenObjects.add(objectKey);
    recentObjects.push(formatRecentObject(database, recentRow, object));

    if (recentObjects.length >= limit) {
      break;
    }
  }

  if (staleRecentObjectIds.length > 0) {
    const deleteStaleEntry = database.prepare(
      "DELETE FROM recent_objects WHERE id = ?"
    );
    const deleteStaleEntries = database.transaction((recentObjectIds) => {
      for (const recentObjectId of recentObjectIds) {
        deleteStaleEntry.run(recentObjectId);
      }
    });

    deleteStaleEntries(staleRecentObjectIds);
  }

  if (duplicateRecentObjectIds.length > 0) {
    const deleteDuplicateEntry = database.prepare(
      "DELETE FROM recent_objects WHERE id = ?"
    );
    const deleteDuplicateEntries = database.transaction((recentObjectIds) => {
      for (const recentObjectId of recentObjectIds) {
        deleteDuplicateEntry.run(recentObjectId);
      }
    });

    deleteDuplicateEntries(duplicateRecentObjectIds);
  }

  return {
    limit,
    recentObjects
  };
}

module.exports = {
  DEFAULT_RECENT_OBJECT_LIMIT,
  listRecentObjects,
  recordRecentObjectOpen
};
