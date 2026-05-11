const { getContainerPathInfo, getItemPathInfo } = require("./paths");
const { validateOwnedObject } = require("./validation");

const DEFAULT_RECENT_OBJECT_LIMIT = 20;
const DEFAULT_RECENT_ACTIVITY_LIMIT = 10;
const MAX_RECENT_ACTIVITY_LIMIT = 100;

const ACTIVITY_LABEL_BY_ACTION = Object.freeze({
  created: "Created",
  deleted: "Deleted",
  moved: "Moved"
});

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
    path: pathInfo.path,
    pathContext: pathInfo.topLevel ? "Top level" : pathInfo.fullPath,
    photoPath: object.photoPath,
    photoUrl,
    topLevel: pathInfo.topLevel
  };
}

function getParentLocationSnapshot(database, parentContainerId) {
  if (!parentContainerId) {
    return "Top level";
  }

  const parentContainer = database
    .prepare("SELECT id, userId, name, photoPath, parentContainerId FROM containers WHERE id = ?")
    .get(parentContainerId);

  if (!parentContainer) {
    return "Unknown location";
  }

  return getContainerPathInfo(database, parentContainer).fullPath;
}

function getActivityObject(database, activity) {
  if (activity.actionType === "deleted" || !activity.objectId) {
    return null;
  }

  return getObjectForRecentEntry(
    database,
    activity.userId,
    activity.objectType,
    activity.objectId
  );
}

function getObjectsByType(database, userId, objectType, objectIds) {
  const uniqueObjectIds = Array.from(new Set(objectIds)).filter((objectId) =>
    Number.isInteger(objectId)
  );

  if (uniqueObjectIds.length === 0) {
    return new Map();
  }

  const tableName = objectType === "container" ? "containers" : "items";
  const placeholders = uniqueObjectIds.map(() => "?").join(", ");
  const rows = database
    .prepare(
      `
        SELECT id, userId, name, photoPath, qrCode, parentContainerId
        FROM ${tableName}
        WHERE userId = ? AND id IN (${placeholders})
      `
    )
    .all(userId, ...uniqueObjectIds);

  return new Map(rows.map((row) => [row.id, row]));
}

function getActivityObjectMaps(database, userId, activities) {
  const containerIds = [];
  const itemIds = [];

  for (const activity of activities) {
    if (activity.actionType === "deleted" || !activity.objectId) {
      continue;
    }

    if (activity.objectType === "container") {
      containerIds.push(activity.objectId);
    } else if (activity.objectType === "item") {
      itemIds.push(activity.objectId);
    }
  }

  return {
    containers: getObjectsByType(database, userId, "container", containerIds),
    items: getObjectsByType(database, userId, "item", itemIds)
  };
}

function getActivityObjectFromMaps(activity, objectMaps) {
  if (activity.actionType === "deleted" || !activity.objectId) {
    return null;
  }

  const objectMap =
    activity.objectType === "container" ? objectMaps.containers : objectMaps.items;

  return objectMap.get(activity.objectId) || null;
}

function formatActivityLabel(actionType, objectType) {
  const actionLabel = ACTIVITY_LABEL_BY_ACTION[actionType] || "Updated";
  return `${actionLabel} ${objectType}`;
}

function formatRecentActivity(database, activity, objectMaps = null) {
  const object = objectMaps
    ? getActivityObjectFromMaps(activity, objectMaps)
    : getActivityObject(database, activity);
  const photoUrl = object && object.photoPath
    ? `/api/photos/${activity.objectType}/${activity.objectId}?v=${encodeURIComponent(object.photoPath)}`
    : null;

  return {
    actionType: activity.actionType,
    activityLabel: formatActivityLabel(activity.actionType, activity.objectType),
    canNavigate: Boolean(object),
    fromLocation: activity.fromLocation,
    isDeleted: activity.actionType === "deleted",
    name: activity.objectName,
    objectId: activity.objectId,
    objectType: activity.objectType,
    occurredAt: activity.createdAt,
    openedAt: activity.createdAt,
    photoPath: object ? object.photoPath : null,
    photoUrl,
    toLocation: activity.toLocation,
    topLevel: object
      ? (activity.objectType === "container"
          ? getContainerPathInfo(database, object).topLevel
          : getItemPathInfo(database, object).topLevel)
      : false
  };
}

function normalizeRecentObjectLimit(limit) {
  return Number.isInteger(limit) && limit > 0
    ? limit
    : DEFAULT_RECENT_OBJECT_LIMIT;
}

function normalizeRecentActivityLimit(limit) {
  if (!Number.isInteger(limit) || limit <= 0) {
    return DEFAULT_RECENT_ACTIVITY_LIMIT;
  }

  return Math.min(limit, MAX_RECENT_ACTIVITY_LIMIT);
}

function normalizeRecentActivityOffset(offset) {
  return Number.isInteger(offset) && offset >= 0 ? offset : 0;
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

function recordRecentActivity(database, userId, activity) {
  database
    .prepare(
      `
        INSERT INTO recent_activity (
          userId,
          actionType,
          objectType,
          objectId,
          objectName,
          fromLocation,
          toLocation
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      userId,
      activity.actionType,
      activity.objectType,
      activity.objectId || null,
      activity.objectName,
      activity.fromLocation || null,
      activity.toLocation || null
    );
}

function listRecentActivity(database, userId, options = {}) {
  const limit = normalizeRecentActivityLimit(options.limit);
  const offset = normalizeRecentActivityOffset(options.offset);
  const totalCount = database
    .prepare(
      `
        SELECT COUNT(*) AS count
        FROM recent_activity
        WHERE userId = ? AND actionType != 'opened'
      `
    )
    .get(userId).count;
  const activities = database
    .prepare(
      `
        SELECT
          id,
          userId,
          actionType,
          objectType,
          objectId,
          objectName,
          fromLocation,
          toLocation,
          createdAt
        FROM recent_activity
        WHERE userId = ? AND actionType != 'opened'
        ORDER BY createdAt DESC, id DESC
        LIMIT ?
        OFFSET ?
      `
    )
    .all(userId, limit, offset);
  const objectMaps = getActivityObjectMaps(database, userId, activities);
  const recentObjects = activities.map((activity) =>
    formatRecentActivity(database, activity, objectMaps)
  );

  return {
    limit,
    offset,
    recentObjects,
    returnedCount: recentObjects.length,
    totalCount
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
  DEFAULT_RECENT_ACTIVITY_LIMIT,
  DEFAULT_RECENT_OBJECT_LIMIT,
  MAX_RECENT_ACTIVITY_LIMIT,
  getParentLocationSnapshot,
  listRecentActivity,
  listRecentObjects,
  recordRecentActivity,
  recordRecentObjectOpen
};
