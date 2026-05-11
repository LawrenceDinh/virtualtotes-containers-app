const { config } = require("./config");
const { createSqliteBackup } = require("./backups");
const { deleteStoredPhotoIfPresent } = require("./photos");
const {
  getParentLocationSnapshot,
  recordRecentActivity
} = require("./recent-objects");
const { createHttpError } = require("./validation");

const DELETE_ALL_ITEMS_PHRASE = "DELETE ALL ITEMS";
const DELETE_ALL_CONTAINERS_PHRASE = "DELETE ALL CONTAINERS";

function requireDebugBulkDeleteEnabled() {
  if (!config.enableDebugBulkDelete) {
    throw createHttpError(404, "Not found");
  }
}

function getOwnedCounts(database, userId) {
  return {
    containers: database
      .prepare("SELECT COUNT(*) AS count FROM containers WHERE userId = ?")
      .get(userId).count,
    items: database
      .prepare("SELECT COUNT(*) AS count FROM items WHERE userId = ?")
      .get(userId).count
  };
}

function getBulkDeleteItemsPreview(database, userId) {
  requireDebugBulkDeleteEnabled();

  const counts = getOwnedCounts(database, userId);

  return {
    affectedContainers: 0,
    affectedItems: counts.items,
    confirmationPhrase: DELETE_ALL_ITEMS_PHRASE,
    containersDeleted: false,
    containersPreserved: true,
    itemsDeleted: true,
    itemsPreserved: false,
    operation: "deleteAllItems",
    survivingItemsMovedToTopLevel: false
  };
}

function getBulkDeleteContainersPreview(database, userId) {
  requireDebugBulkDeleteEnabled();

  const counts = getOwnedCounts(database, userId);

  return {
    affectedContainers: counts.containers,
    affectedItems: counts.items,
    confirmationPhrase: DELETE_ALL_CONTAINERS_PHRASE,
    containersDeleted: true,
    containersPreserved: false,
    itemsDeleted: false,
    itemsPreserved: true,
    operation: "deleteAllContainers",
    survivingItemsMovedToTopLevel: true
  };
}

function deletePhotos(photoPaths) {
  for (const photoPath of photoPaths) {
    if (photoPath) {
      deleteStoredPhotoIfPresent(photoPath);
    }
  }
}

async function deleteAllItems(database, userId, options = {}) {
  requireDebugBulkDeleteEnabled();

  const preview = getBulkDeleteItemsPreview(database, userId);
  if (preview.affectedItems === 0) {
    return {
      backup: null,
      deletedContainers: 0,
      deletedItems: 0,
      movedItemsToTopLevel: 0,
      success: true
    };
  }

  const backup = await (options.createBackup || createSqliteBackup)("items");
  const deleteItemsTransaction = database.transaction(() => {
    const items = database
      .prepare(
        `
          SELECT id, name, photoPath, parentContainerId
          FROM items
          WHERE userId = ?
          ORDER BY id ASC
        `
      )
      .all(userId);

    for (const item of items) {
      recordRecentActivity(database, userId, {
        actionType: "deleted",
        fromLocation: getParentLocationSnapshot(database, item.parentContainerId),
        objectId: item.id,
        objectName: item.name,
        objectType: "item"
      });
    }

    database
      .prepare(
        "DELETE FROM recent_objects WHERE userId = ? AND objectType = 'item'"
      )
      .run(userId);

    if (options.failAfterRecentCleanup) {
      throw new Error("Simulated bulk item delete failure");
    }

    database.prepare("DELETE FROM items WHERE userId = ?").run(userId);

    if (options.failAfterDelete) {
      throw new Error("Simulated bulk item delete failure");
    }

    return items;
  });

  const deletedItems = deleteItemsTransaction();
  deletePhotos(deletedItems.map((item) => item.photoPath));

  return {
    backup,
    deletedContainers: 0,
    deletedItems: deletedItems.length,
    movedItemsToTopLevel: 0,
    success: true
  };
}

async function deleteAllContainers(database, userId, options = {}) {
  requireDebugBulkDeleteEnabled();

  const preview = getBulkDeleteContainersPreview(database, userId);
  if (preview.affectedContainers === 0) {
    return {
      backup: null,
      deletedContainers: 0,
      deletedItems: 0,
      movedItemsToTopLevel: 0,
      success: true
    };
  }

  const backup = await (options.createBackup || createSqliteBackup)("containers");
  const deleteContainersTransaction = database.transaction(() => {
    const containers = database
      .prepare(
        `
          SELECT id, name, photoPath, parentContainerId
          FROM containers
          WHERE userId = ?
          ORDER BY id ASC
        `
      )
      .all(userId);
    const movedItemsCount = database
      .prepare("SELECT COUNT(*) AS count FROM items WHERE userId = ?")
      .get(userId).count;

    for (const container of containers) {
      recordRecentActivity(database, userId, {
        actionType: "deleted",
        fromLocation: getParentLocationSnapshot(
          database,
          container.parentContainerId
        ),
        objectId: container.id,
        objectName: container.name,
        objectType: "container"
      });
    }

    database
      .prepare(
        `
          UPDATE items
          SET
            parentContainerId = NULL,
            updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE userId = ?
        `
      )
      .run(userId);

    if (options.failAfterItemMove) {
      throw new Error("Simulated bulk container delete failure");
    }

    database
      .prepare(
        `
          UPDATE containers
          SET
            parentContainerId = NULL,
            updatedAt = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE userId = ?
        `
      )
      .run(userId);

    database
      .prepare(
        "DELETE FROM recent_objects WHERE userId = ? AND objectType = 'container'"
      )
      .run(userId);
    database.prepare("DELETE FROM containers WHERE userId = ?").run(userId);

    if (options.failAfterDelete) {
      throw new Error("Simulated bulk container delete failure");
    }

    return {
      containers,
      movedItemsCount
    };
  });

  const { containers, movedItemsCount } = deleteContainersTransaction();
  deletePhotos(containers.map((container) => container.photoPath));

  return {
    backup,
    deletedContainers: containers.length,
    deletedItems: 0,
    movedItemsToTopLevel: movedItemsCount,
    success: true
  };
}

module.exports = {
  DELETE_ALL_CONTAINERS_PHRASE,
  DELETE_ALL_ITEMS_PHRASE,
  deleteAllContainers,
  deleteAllItems,
  getBulkDeleteContainersPreview,
  getBulkDeleteItemsPreview
};
