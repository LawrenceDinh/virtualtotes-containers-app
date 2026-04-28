const { createHttpError } = require("./validation");

const containerPathSelectColumns = `
  id,
  userId,
  name,
  parentContainerId
`;

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
    parentContainerId: container.parentContainerId
  };

  while (currentContainer) {
    if (visitedContainerIds.has(currentContainer.id)) {
      throw createHttpError(409, "Container ancestry is invalid");
    }

    visitedContainerIds.add(currentContainer.id);
    pathSegments.push({
      id: currentContainer.id,
      name: currentContainer.name
    });

    if (currentContainer.parentContainerId === null) {
      break;
    }

    currentContainer = lookupContainer.get(currentContainer.parentContainerId);

    if (!currentContainer || currentContainer.userId !== container.userId) {
      throw createHttpError(409, "Container ancestry is invalid");
    }
  }

  pathSegments.reverse();
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
        {
          id: item.id,
          name: item.name
        }
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
    ...containerPathInfo.path,
    {
      id: item.id,
      name: item.name
    }
  ];

  return {
    currentParentContainer,
    fullPath: path.map((segment) => segment.name).join(" > "),
    path,
    topLevel: false
  };
}

module.exports = {
  getContainerPathInfo,
  getItemPathInfo
};
