const {
  createHttpError,
  validateObjectPayload,
  validateOwnedObject,
  validateParentContainerAssignment
} = require("./validation");
const { getItemPathInfo } = require("./paths");

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

function getItemById(database, itemId) {
  return database
    .prepare(`SELECT ${itemSelectColumns} FROM items WHERE id = ?`)
    .get(itemId);
}

function buildItemDetail(database, item) {
  const { currentParentContainer, fullPath, topLevel } = getItemPathInfo(
    database,
    item
  );

  return {
    item,
    topLevel,
    fullPath,
    currentParentContainer
  };
}

function createItem(database, userId, payload, parentContainerId) {
  const normalizedPayload = {
    ...payload,
    parentContainerId
  };
  const validatedPayload = validateObjectPayload(database, "item", normalizedPayload, {
    userId
  });
  const result = database
    .prepare(
      `
        INSERT INTO items (
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
    item: getItemById(database, Number(result.lastInsertRowid))
  };
}

function createTopLevelItem(database, userId, payload) {
  requirePlainObject(payload);

  if (
    hasOwnProperty(payload, "parentContainerId") &&
    payload.parentContainerId !== null &&
    payload.parentContainerId !== undefined &&
    payload.parentContainerId !== ""
  ) {
    throw createHttpError(
      400,
      "Top-level item creation cannot include parentContainerId"
    );
  }

  return createItem(database, userId, payload, null);
}

function createItemInContainer(database, parentContainerId, userId, payload) {
  requirePlainObject(payload);

  if (
    hasOwnProperty(payload, "parentContainerId") &&
    payload.parentContainerId !== null &&
    Number(payload.parentContainerId) !== parentContainerId
  ) {
    throw createHttpError(
      400,
      "Container item creation must use the parent container from the route"
    );
  }

  return createItem(database, userId, payload, parentContainerId);
}

function listTopLevelItems(database, userId) {
  return {
    items: database
      .prepare(
        `
          SELECT ${itemSelectColumns}
          FROM items
          WHERE userId = ? AND parentContainerId IS NULL
          ORDER BY name COLLATE NOCASE ASC, id ASC
        `
      )
      .all(userId)
  };
}

function getItemDetail(database, itemId, userId) {
  const item = validateOwnedObject(database, "item", itemId, userId);
  return buildItemDetail(database, item);
}

function editItem(database, itemId, userId, payload) {
  requirePlainObject(payload);

  if (hasOwnProperty(payload, "parentContainerId")) {
    throw createHttpError(
      400,
      "Use the move item endpoint to change parentContainerId"
    );
  }

  const item = validateOwnedObject(database, "item", itemId, userId);
  const validatedPayload = validateObjectPayload(
    database,
    "item",
    {
      name: payload.name,
      parentContainerId: item.parentContainerId,
      qrCode: hasOwnProperty(payload, "qrCode")
        ? payload.qrCode
        : item.qrCode
    },
    {
      currentObjectId: item.id,
      userId
    }
  );

  database
    .prepare(
      `
        UPDATE items
        SET
          name = ?,
          qrCode = ?,
          updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ?
      `
    )
    .run(validatedPayload.name, validatedPayload.qrCode, item.id);

  return {
    item: getItemById(database, item.id)
  };
}

function moveItem(database, itemId, userId, payload) {
  requirePlainObject(payload);

  if (hasOwnProperty(payload, "name") || hasOwnProperty(payload, "qrCode")) {
    throw createHttpError(400, "Move item only accepts parentContainerId");
  }

  if (!hasOwnProperty(payload, "parentContainerId")) {
    throw createHttpError(400, "parentContainerId is required");
  }

  const item = validateOwnedObject(database, "item", itemId, userId);
  const destinationParent = validateParentContainerAssignment(
    database,
    payload.parentContainerId,
    userId
  );

  database
    .prepare(
      `
        UPDATE items
        SET
          parentContainerId = ?,
          updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ?
      `
    )
    .run(destinationParent ? destinationParent.id : null, item.id);

  const updatedItem = getItemById(database, item.id);
  return buildItemDetail(database, updatedItem);
}

function deleteItem(database, itemId, userId) {
  const item = validateOwnedObject(database, "item", itemId, userId);

  database.prepare("DELETE FROM items WHERE id = ?").run(item.id);

  return {
    success: true
  };
}

module.exports = {
  createItemInContainer,
  createTopLevelItem,
  deleteItem,
  editItem,
  getItemDetail,
  listTopLevelItems,
  moveItem
};
