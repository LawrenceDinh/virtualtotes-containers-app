const {
  createHttpError,
  validateContainerDeletion,
  validateContainerMove,
  validateObjectPayload,
  validateOwnedObject,
  validateParentContainerAssignment
} = require("./validation");
const { getContainerPathInfo, getContainerRelationshipPaths } = require("./paths");
const { deleteStoredPhotoIfPresent } = require("./photos");
const {
  getParentLocationSnapshot,
  recordRecentActivity
} = require("./recent-objects");

const containerSelectColumns = `
  id,
  userId,
  name,
  photoPath,
  qrCode,
  parentContainerId,
  createdAt,
  updatedAt
`;

const itemSelectColumns = `
  id,
  userId,
  name,
  photoPath,
  qrCode,
  parentContainerId,
  createdAt,
  updatedAt
`;

function requirePlainObject(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createHttpError(400, "Request body must be an object");
  }
}

function hasOwnProperty(object, propertyName) {
  return Object.prototype.hasOwnProperty.call(object, propertyName);
}

function getContainerById(database, containerId) {
  return database
    .prepare(`SELECT ${containerSelectColumns} FROM containers WHERE id = ?`)
    .get(containerId);
}

function createContainer(database, userId, payload, parentContainerId) {
  const normalizedPayload = {
    ...payload,
    parentContainerId
  };
  const validatedPayload = validateObjectPayload(
    database,
    "container",
    normalizedPayload,
    {
      userId
    }
  );
  const result = database
    .prepare(
      `
        INSERT INTO containers (
          userId,
          name,
          photoPath,
          qrCode,
          parentContainerId
        )
        VALUES (?, ?, NULL, ?, ?)
      `
    )
    .run(
      userId,
      validatedPayload.name,
      validatedPayload.qrCode,
      validatedPayload.parentContainerId
    );

  const container = getContainerById(database, Number(result.lastInsertRowid));
  recordRecentActivity(database, userId, {
    actionType: "created",
    objectId: container.id,
    objectName: container.name,
    objectType: "container",
    toLocation: getParentLocationSnapshot(database, container.parentContainerId)
  });

  return {
    container
  };
}

function createTopLevelContainer(database, userId, payload) {
  requirePlainObject(payload);

  if (
    hasOwnProperty(payload, "parentContainerId") &&
    payload.parentContainerId !== null &&
    payload.parentContainerId !== undefined &&
    payload.parentContainerId !== ""
  ) {
    throw createHttpError(
      400,
      "Top-level container creation cannot include parentContainerId"
    );
  }

  return createContainer(database, userId, payload, null);
}

function createChildContainer(database, parentContainerId, userId, payload) {
  requirePlainObject(payload);

  if (
    hasOwnProperty(payload, "parentContainerId") &&
    payload.parentContainerId !== null &&
    Number(payload.parentContainerId) !== parentContainerId
  ) {
    throw createHttpError(
      400,
      "Child container creation must use the parent container from the route"
    );
  }

  return createContainer(database, userId, payload, parentContainerId);
}

function listTopLevelContainers(database, userId) {
  return {
    containers: database
      .prepare(
        `
          SELECT ${containerSelectColumns}
          FROM containers
          WHERE userId = ? AND parentContainerId IS NULL
          ORDER BY name COLLATE NOCASE ASC, id ASC
        `
      )
      .all(userId)
  };
}

function listParentContainerOptions(database, userId) {
  const containers = database
    .prepare(
      `
        SELECT ${containerSelectColumns}
        FROM containers
        WHERE userId = ?
      `
    )
    .all(userId)
    .map((container) => {
      const pathInfo = getContainerPathInfo(database, container);

      return {
        id: container.id,
        name: container.name,
        parentContainerId: container.parentContainerId,
        fullPath: pathInfo.fullPath,
        topLevel: pathInfo.topLevel
      };
    })
    .sort((left, right) =>
      left.fullPath.localeCompare(right.fullPath, undefined, {
        numeric: true,
        sensitivity: "base"
      })
    );

  return {
    containers
  };
}

function getContainerDetail(database, containerId, userId) {
  const container = validateOwnedObject(database, "container", containerId, userId);
  const childContainers = database
    .prepare(
      `
        SELECT ${containerSelectColumns}
        FROM containers
        WHERE userId = ? AND parentContainerId = ?
        ORDER BY name COLLATE NOCASE ASC, id ASC
      `
    )
    .all(userId, container.id);
  const childItems = database
    .prepare(
      `
        SELECT ${itemSelectColumns}
        FROM items
        WHERE userId = ? AND parentContainerId = ?
        ORDER BY name COLLATE NOCASE ASC, id ASC
      `
    )
    .all(userId, container.id);
  const { fullPath, path } = getContainerPathInfo(database, container);
  const relationshipPaths = getContainerRelationshipPaths(database, container);

  return {
    container,
    fullPath,
    path,
    relationshipPaths,
    childContainers,
    childItems,
    itemCount: childItems.length,
    subcontainerCount: childContainers.length
  };
}

function editContainer(database, containerId, userId, payload) {
  requirePlainObject(payload);

  if (hasOwnProperty(payload, "parentContainerId")) {
    throw createHttpError(
      400,
      "Use the move container endpoint to change parentContainerId"
    );
  }

  const container = validateOwnedObject(database, "container", containerId, userId);
  const validatedPayload = validateObjectPayload(
    database,
    "container",
    {
      name: payload.name,
      parentContainerId: container.parentContainerId,
      qrCode: hasOwnProperty(payload, "qrCode")
        ? payload.qrCode
        : container.qrCode
    },
    {
      currentObjectId: container.id,
      userId
    }
  );

  database
    .prepare(
      `
        UPDATE containers
        SET
          name = ?,
          qrCode = ?,
          updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ?
      `
    )
    .run(validatedPayload.name, validatedPayload.qrCode, container.id);

  return {
    container: getContainerById(database, container.id)
  };
}

function moveContainer(database, containerId, userId, payload) {
  requirePlainObject(payload);

  if (hasOwnProperty(payload, "name") || hasOwnProperty(payload, "qrCode")) {
    throw createHttpError(
      400,
      "Move container only accepts parentContainerId"
    );
  }

  if (!hasOwnProperty(payload, "parentContainerId")) {
    throw createHttpError(400, "parentContainerId is required");
  }

  const { container, destinationParent } = validateContainerMove(
    database,
    containerId,
    payload.parentContainerId,
    userId
  );
  const fromLocation = getParentLocationSnapshot(
    database,
    container.parentContainerId
  );
  const toLocation = getParentLocationSnapshot(
    database,
    destinationParent ? destinationParent.id : null
  );

  database
    .prepare(
      `
        UPDATE containers
        SET
          parentContainerId = ?,
          updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ?
      `
    )
    .run(destinationParent ? destinationParent.id : null, container.id);

  const updatedContainer = getContainerById(database, container.id);
  const { fullPath, path } = getContainerPathInfo(database, updatedContainer);
  recordRecentActivity(database, userId, {
    actionType: "moved",
    fromLocation,
    objectId: container.id,
    objectName: container.name,
    objectType: "container",
    toLocation
  });

  return {
    container: updatedContainer,
    fullPath,
    path
  };
}

function getDirectContainerChildren(database, containerId, userId) {
  return database
    .prepare(
      `
        SELECT ${containerSelectColumns}
        FROM containers
        WHERE userId = ? AND parentContainerId = ?
        ORDER BY name COLLATE NOCASE ASC, id ASC
      `
    )
    .all(userId, containerId);
}

function getDirectItemChildren(database, containerId, userId) {
  return database
    .prepare(
      `
        SELECT ${itemSelectColumns}
        FROM items
        WHERE userId = ? AND parentContainerId = ?
        ORDER BY name COLLATE NOCASE ASC, id ASC
      `
    )
    .all(userId, containerId);
}

function getDeleteDestinationParentContainerId(
  database,
  container,
  userId,
  destinationParentContainerId
) {
  const destinationParent = validateParentContainerAssignment(
    database,
    destinationParentContainerId,
    userId
  );

  if (destinationParent && destinationParent.id === container.id) {
    throw createHttpError(409, "Deleted container cannot be used as a destination");
  }

  return destinationParent ? destinationParent.id : null;
}

function getDirectChildKey(objectType, objectId) {
  return `${objectType}:${objectId}`;
}

function getContainerDeleteMoves(database, container, userId, payload = {}) {
  requirePlainObject(payload);

  const childContainers = getDirectContainerChildren(database, container.id, userId);
  const childItems = getDirectItemChildren(database, container.id, userId);
  const children = [
    ...childContainers.map((childContainer) => ({
      object: childContainer,
      objectType: "container"
    })),
    ...childItems.map((childItem) => ({
      object: childItem,
      objectType: "item"
    }))
  ];

  const contentStrategy = payload.contentStrategy || (
    children.length === 0 ? "parent" : null
  );

  if (!contentStrategy) {
    throw createHttpError(400, "contentStrategy is required");
  }

  if (contentStrategy === "parent") {
    return children.map((child) => ({
      ...child,
      destinationParentContainerId: container.parentContainerId
    }));
  }

  if (contentStrategy === "topLevel") {
    return children.map((child) => ({
      ...child,
      destinationParentContainerId: null
    }));
  }

  if (contentStrategy === "container") {
    if (
      !hasOwnProperty(payload, "destinationParentContainerId") ||
      payload.destinationParentContainerId === null ||
      payload.destinationParentContainerId === ""
    ) {
      throw createHttpError(400, "destinationParentContainerId is required");
    }

    const destinationParentContainerId = getDeleteDestinationParentContainerId(
      database,
      container,
      userId,
      payload.destinationParentContainerId
    );

    return children.map((child) => ({
      ...child,
      destinationParentContainerId
    }));
  }

  if (contentStrategy !== "custom") {
    throw createHttpError(400, "contentStrategy is invalid");
  }

  if (!Array.isArray(payload.childDestinations)) {
    throw createHttpError(400, "childDestinations is required");
  }

  const childrenByKey = new Map(
    children.map((child) => [
      getDirectChildKey(child.objectType, child.object.id),
      child
    ])
  );
  const seenChildKeys = new Set();
  const moves = [];

  for (const childDestination of payload.childDestinations) {
    requirePlainObject(childDestination);

    if (
      childDestination.objectType !== "container" &&
      childDestination.objectType !== "item"
    ) {
      throw createHttpError(400, "child objectType is invalid");
    }

    const objectId = Number(childDestination.objectId);
    const childKey = getDirectChildKey(childDestination.objectType, objectId);
    const child = childrenByKey.get(childKey);

    if (!Number.isInteger(objectId) || objectId <= 0 || !child) {
      throw createHttpError(400, "childDestinations must include only direct children");
    }

    if (seenChildKeys.has(childKey)) {
      throw createHttpError(400, "childDestinations contains duplicate children");
    }

    if (!hasOwnProperty(childDestination, "parentContainerId")) {
      throw createHttpError(400, "child destination parentContainerId is required");
    }

    seenChildKeys.add(childKey);
    moves.push({
      ...child,
      destinationParentContainerId: getDeleteDestinationParentContainerId(
        database,
        container,
        userId,
        childDestination.parentContainerId
      )
    });
  }

  if (seenChildKeys.size !== children.length) {
    throw createHttpError(
      400,
      "Every direct child must have a destination before deleting"
    );
  }

  return moves;
}

function validateContainerDeleteMoves(database, container, userId, moves) {
  for (const move of moves) {
    if (move.objectType === "container") {
      validateContainerMove(
        database,
        move.object.id,
        move.destinationParentContainerId,
        userId
      );
      continue;
    }

    validateParentContainerAssignment(
      database,
      move.destinationParentContainerId,
      userId
    );
  }
}

function deleteContainer(database, containerId, userId, payload = {}) {
  const container = validateContainerDeletion(database, containerId, userId);
  const fromLocation = getParentLocationSnapshot(
    database,
    container.parentContainerId
  );
  const moves = getContainerDeleteMoves(database, container, userId, payload);

  validateContainerDeleteMoves(database, container, userId, moves);

  const promoteAndDeleteContainer = database.transaction(() => {
    const updateContainerParent = database.prepare(
      `
        UPDATE containers
        SET
          parentContainerId = ?,
          updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND userId = ?
      `
    );
    const updateItemParent = database.prepare(
      `
        UPDATE items
        SET
          parentContainerId = ?,
          updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND userId = ?
      `
    );

    for (const move of moves) {
      const updateParent =
        move.objectType === "container" ? updateContainerParent : updateItemParent;
      updateParent.run(move.destinationParentContainerId, move.object.id, userId);
    }

    database
      .prepare("DELETE FROM containers WHERE id = ? AND userId = ?")
      .run(container.id, userId);

    recordRecentActivity(database, userId, {
      actionType: "deleted",
      fromLocation,
      objectId: container.id,
      objectName: container.name,
      objectType: "container"
    });
  });

  promoteAndDeleteContainer();

  if (container.photoPath) {
    deleteStoredPhotoIfPresent(container.photoPath);
  }

  return {
    success: true
  };
}

module.exports = {
  createChildContainer,
  createTopLevelContainer,
  deleteContainer,
  editContainer,
  getContainerDetail,
  listParentContainerOptions,
  listTopLevelContainers,
  moveContainer
};
