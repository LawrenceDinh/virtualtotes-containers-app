const { getContainerPathInfo, getItemPathInfo } = require("./paths");

function escapeLikePattern(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function sortResults(left, right) {
  const normalizedLeftName = left.name.toLowerCase();
  const normalizedRightName = right.name.toLowerCase();

  if (normalizedLeftName < normalizedRightName) {
    return -1;
  }

  if (normalizedLeftName > normalizedRightName) {
    return 1;
  }

  if (left.objectType < right.objectType) {
    return -1;
  }

  if (left.objectType > right.objectType) {
    return 1;
  }

  return left.objectId - right.objectId;
}

function formatContainerSearchResult(database, container) {
  const pathInfo = getContainerPathInfo(database, container);

  return {
    objectId: container.id,
    objectType: "container",
    name: container.name,
    pathContext: pathInfo.topLevel ? "Top level" : pathInfo.fullPath,
    topLevel: pathInfo.topLevel
  };
}

function formatItemSearchResult(database, item) {
  const pathInfo = getItemPathInfo(database, item);

  return {
    objectId: item.id,
    objectType: "item",
    name: item.name,
    pathContext: pathInfo.topLevel ? "Top level" : pathInfo.fullPath,
    topLevel: pathInfo.topLevel
  };
}

function searchObjects(database, userId, query) {
  const normalizedQuery = String(query || "").trim();

  if (!normalizedQuery) {
    return {
      query: normalizedQuery,
      results: []
    };
  }

  const searchPattern = `%${escapeLikePattern(normalizedQuery)}%`;
  const matchingContainers = database
    .prepare(
      `
        SELECT id, userId, name, parentContainerId
        FROM containers
        WHERE userId = ? AND name LIKE ? ESCAPE '\\'
      `
    )
    .all(userId, searchPattern);
  const matchingItems = database
    .prepare(
      `
        SELECT id, userId, name, parentContainerId
        FROM items
        WHERE userId = ? AND name LIKE ? ESCAPE '\\'
      `
    )
    .all(userId, searchPattern);
  const results = [
    ...matchingContainers.map((container) =>
      formatContainerSearchResult(database, container)
    ),
    ...matchingItems.map((item) => formatItemSearchResult(database, item))
  ].sort(sortResults);

  return {
    query: normalizedQuery,
    results
  };
}

module.exports = {
  searchObjects
};
