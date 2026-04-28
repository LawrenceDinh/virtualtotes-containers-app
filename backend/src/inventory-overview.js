const { getContainerPathInfo, getItemPathInfo } = require("./paths");

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

function formatContainerOverview(database, container) {
  const pathInfo = getContainerPathInfo(database, container);

  return {
    id: container.id,
    name: container.name,
    parentContainerId: container.parentContainerId,
    fullPath: pathInfo.fullPath,
    path: pathInfo.path,
    topLevel: pathInfo.topLevel
  };
}

function formatItemOverview(database, item) {
  const pathInfo = getItemPathInfo(database, item);

  return {
    id: item.id,
    name: item.name,
    parentContainerId: item.parentContainerId,
    fullPath: pathInfo.fullPath,
    path: pathInfo.path,
    topLevel: pathInfo.topLevel
  };
}

function buildRelationshipPath(objectType, object) {
  return {
    objectId: object.id,
    objectType,
    path: `Top Level > ${object.fullPath}`,
    pathSegments: object.path
  };
}

function getInventoryOverview(database, userId) {
  const containers = database
    .prepare(
      `
        SELECT ${containerSelectColumns}
        FROM containers
        WHERE userId = ?
      `
    )
    .all(userId)
    .map((container) => formatContainerOverview(database, container))
    .sort((left, right) =>
      left.fullPath.localeCompare(right.fullPath, undefined, {
        numeric: true,
        sensitivity: "base"
      })
    );

  const items = database
    .prepare(
      `
        SELECT ${itemSelectColumns}
        FROM items
        WHERE userId = ?
      `
    )
    .all(userId)
    .map((item) => formatItemOverview(database, item))
    .sort((left, right) =>
      left.fullPath.localeCompare(right.fullPath, undefined, {
        numeric: true,
        sensitivity: "base"
      })
    );

  return {
    counts: {
      containers: containers.length,
      items: items.length
    },
    containers,
    items,
    relationshipPaths: [
      ...containers.map((container) =>
        buildRelationshipPath("container", container)
      ),
      ...items.map((item) => buildRelationshipPath("item", item))
    ].sort((left, right) =>
      left.path.localeCompare(right.path, undefined, {
        numeric: true,
        sensitivity: "base"
      })
    )
  };
}

module.exports = {
  getInventoryOverview
};
