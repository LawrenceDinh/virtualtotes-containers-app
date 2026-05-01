const { createHttpError } = require("./validation");

const containerPathSelectColumns = `
  id,
  userId,
  name,
  photoPath,
  parentContainerId
`;

function formatContainerPathSegment(container) {
  const segment = {
    id: container.id,
    name: container.name,
    objectType: "container"
  };

  if (container.photoPath) {
    segment.photoPath = container.photoPath;
  }

  return segment;
}

function formatItemPathSegment(item) {
  const segment = {
    id: item.id,
    name: item.name,
    objectType: "item"
  };

  if (item.photoPath) {
    segment.photoPath = item.photoPath;
  }

  return segment;
}

function formatRelationshipPath(objectType, objectId, pathInfo) {
  return {
    objectId,
    objectType,
    fullPath: pathInfo.fullPath,
    path: pathInfo.path,
    topLevel: pathInfo.topLevel
  };
}

function getContainerPathSegments(database, container) {
  const pathSegments = [];
  const visitedContainerIds = new Set();
  const lookupContainer = database.prepare(
    `SELECT ${containerPathSelectColumns} FROM containers WHERE id = ?`
  );
  let currentContainer = {
    id: container.id,
    userId: container.userId,
    name: container.name,
    photoPath: container.photoPath,
    parentContainerId: container.parentContainerId
  };

  while (currentContainer) {
    if (visitedContainerIds.has(currentContainer.id)) {
      throw createHttpError(409, "Container ancestry is invalid");
    }

    visitedContainerIds.add(currentContainer.id);
    pathSegments.push(formatContainerPathSegment(currentContainer));

    if (currentContainer.parentContainerId === null) {
      break;
    }

    currentContainer = lookupContainer.get(currentContainer.parentContainerId);

    if (!currentContainer || currentContainer.userId !== container.userId) {
      throw createHttpError(409, "Container ancestry is invalid");
    }
  }

  return pathSegments;
}

function getContainerPathInfo(database, container) {
  const path = getContainerPathSegments(database, container);

  return {
    topLevel: container.parentContainerId === null,
    fullPath: path.map((segment) => segment.name).join(" > "),
    path
  };
}

function getItemPathInfo(database, item) {
  if (item.parentContainerId === null) {
    return {
      currentParentContainer: null,
      fullPath: item.name,
      path: [
        formatItemPathSegment(item)
      ],
      topLevel: true
    };
  }

  const currentParentContainer = database
    .prepare(
      `
        SELECT
          id,
          userId,
          name,
          photoPath,
          qrCode,
          parentContainerId,
          createdAt,
          updatedAt
        FROM containers
        WHERE id = ?
      `
    )
    .get(item.parentContainerId);

  if (!currentParentContainer || currentParentContainer.userId !== item.userId) {
    throw createHttpError(409, "Item ancestry is invalid");
  }

  const containerPathInfo = getContainerPathInfo(database, currentParentContainer);
  const path = [
    formatItemPathSegment(item),
    ...containerPathInfo.path
  ];

  return {
    currentParentContainer,
    fullPath: path.map((segment) => segment.name).join(" > "),
    path,
    topLevel: false
  };
}

function getContainerRelationshipPaths(database, container) {
  const relationshipPaths = [
    formatRelationshipPath(
      "container",
      container.id,
      getContainerPathInfo(database, container)
    )
  ];
  const visitedContainerIds = new Set([container.id]);
  const childContainersStatement = database.prepare(
    `
      SELECT ${containerPathSelectColumns}
      FROM containers
      WHERE userId = ? AND parentContainerId = ?
      ORDER BY name COLLATE NOCASE ASC, id ASC
    `
  );
  const childItemsStatement = database.prepare(
    `
      SELECT
        id,
        userId,
        name,
        photoPath,
        parentContainerId
      FROM items
      WHERE userId = ? AND parentContainerId = ?
      ORDER BY name COLLATE NOCASE ASC, id ASC
    `
  );

  function appendDescendantPaths(parentContainerId) {
    const childContainers = childContainersStatement.all(
      container.userId,
      parentContainerId
    );

    for (const childContainer of childContainers) {
      if (visitedContainerIds.has(childContainer.id)) {
        throw createHttpError(409, "Container ancestry is invalid");
      }

      visitedContainerIds.add(childContainer.id);
      relationshipPaths.push(
        formatRelationshipPath(
          "container",
          childContainer.id,
          getContainerPathInfo(database, childContainer)
        )
      );
      appendDescendantPaths(childContainer.id);
    }

    const childItems = childItemsStatement.all(container.userId, parentContainerId);

    for (const childItem of childItems) {
      relationshipPaths.push(
        formatRelationshipPath(
          "item",
          childItem.id,
          getItemPathInfo(database, childItem)
        )
      );
    }
  }

  appendDescendantPaths(container.id);

  return relationshipPaths;
}

module.exports = {
  getContainerRelationshipPaths,
  getContainerPathInfo,
  getItemPathInfo
};
