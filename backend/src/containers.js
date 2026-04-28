const {
  createHttpError,
  validateContainerDeletion,
  validateContainerMove,
  validateObjectPayload,
  validateOwnedObject
} = require("./validation");
const { getContainerPathInfo } = require("./paths");
const { deleteStoredPhotoIfPresent } = require("./photos");

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

  return {
    container: getContainerById(database, Number(result.lastInsertRowid))
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

  return {
    container,
    fullPath,
    path,
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

  return {
    container: updatedContainer,
    fullPath,
    path
  };
}

function deleteContainer(database, containerId, userId) {
  const container = validateContainerDeletion(database, containerId, userId);
  const promoteAndDeleteContainer = database.transaction(() => {
    database
      .prepare(
        `
          UPDATE containers
          SET
            parentContainerId = ?,
            updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE userId = ? AND parentContainerId = ?
        `
      )
      .run(container.parentContainerId, userId, container.id);

    database
      .prepare(
        `
          UPDATE items
          SET
            parentContainerId = ?,
            updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE userId = ? AND parentContainerId = ?
        `
      )
      .run(container.parentContainerId, userId, container.id);

    database
      .prepare("DELETE FROM containers WHERE id = ? AND userId = ?")
      .run(container.id, userId);
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
