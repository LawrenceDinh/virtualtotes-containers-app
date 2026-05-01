const ui = {
  addEntryButton: document.querySelector("[data-add-entry]"),
  appNav: document.querySelector("[data-app-nav]"),
  containerActionNote: document.querySelector("[data-container-action-note]"),
  containerAddContainerButton: document.querySelector("[data-container-add-container]"),
  containerAddItemButton: document.querySelector("[data-container-add-item]"),
  containerChildContainersEmptyNode: document.querySelector(
    "[data-container-child-containers-empty]"
  ),
  containerChildContainersNode: document.querySelector(
    "[data-container-child-containers]"
  ),
  containerChildItemsEmptyNode: document.querySelector(
    "[data-container-child-items-empty]"
  ),
  containerChildItemsNode: document.querySelector("[data-container-child-items]"),
  containerChildrenSummaryNode: document.querySelector(
    "[data-container-children-summary]"
  ),
  containerDeleteButton: document.querySelector("[data-container-delete]"),
  containerDeleteAllDestinationField: document.querySelector(
    "[data-container-delete-all-destination-field]"
  ),
  containerDeleteCancelButton: document.querySelector(
    "[data-container-delete-cancel]"
  ),
  containerDeleteChildListNode: document.querySelector(
    "[data-container-delete-child-list]"
  ),
  containerDeleteConfirmButton: document.querySelector(
    "[data-container-delete-confirm]"
  ),
  containerDeleteCustomListNode: document.querySelector(
    "[data-container-delete-custom-list]"
  ),
  containerDeleteDestinationSelect: document.querySelector(
    "[data-container-delete-destination-select]"
  ),
  containerDeleteModeButtons: Array.from(
    document.querySelectorAll("[data-container-delete-mode]")
  ),
  containerDeletePanel: document.querySelector("[data-container-delete-panel]"),
  containerEditButton: document.querySelector("[data-container-edit]"),
  containerEmptyNode: document.querySelector("[data-top-level-containers-empty]"),
  containerFullPathNode: document.querySelector("[data-container-full-path]"),
  containerItemCountNode: document.querySelector("[data-container-item-count]"),
  containerItemsSummaryNode: document.querySelector("[data-container-items-summary]"),
  containerMoveBackLink: document.querySelector("[data-container-move-back-link]"),
  containerMoveButton: document.querySelector("[data-container-move]"),
  containerMoveCancelButton: document.querySelector("[data-container-move-cancel]"),
  containerMoveCurrentLocationNode: document.querySelector(
    "[data-container-move-current-location]"
  ),
  containerMoveDestinationSelect: document.querySelector(
    "[data-container-move-destination-select]"
  ),
  containerMoveErrorNode: document.querySelector("[data-container-move-error]"),
  containerMoveForm: document.querySelector("[data-container-move-form]"),
  containerMoveNoteNode: document.querySelector("[data-container-move-note]"),
  containerMovePage: document.querySelector("[data-container-move-page]"),
  containerMoveSubmitButton: document.querySelector("[data-container-move-submit]"),
  containerMoveSummaryNode: document.querySelector("[data-container-move-summary]"),
  containerMoveTitleNode: document.querySelector("[data-container-move-title]"),
  containerPage: document.querySelector("[data-container-page]"),
  containerPageNameNode: document.querySelector("[data-container-page-name]"),
  containerPageSummaryNode: document.querySelector(
    "[data-container-page-summary]"
  ),
  containerPhotoImageNode: document.querySelector("[data-container-photo-image]"),
  containerPhotoInput: document.querySelector("[data-container-photo-input]"),
  containerPhotoPickButton: document.querySelector("[data-container-photo-pick]"),
  containerPhotoRemoveButton: document.querySelector(
    "[data-container-photo-remove]"
  ),
  containerPhotoStatusNode: document.querySelector("[data-container-photo-status]"),
  containerListNode: document.querySelector("[data-top-level-containers]"),
  containerQrStatusNode: document.querySelector("[data-container-qr-status]"),
  containerSubcontainerCountNode: document.querySelector(
    "[data-container-subcontainer-count]"
  ),
  containerSummaryNode: document.querySelector(
    "[data-top-level-containers-summary]"
  ),
  entryNoteNode: document.querySelector("[data-entry-note]"),
  homeSections: document.querySelector("[data-home-sections]"),
  homeView: document.querySelector("[data-home-view]"),
  inventoryContainerCountNode: document.querySelector(
    "[data-inventory-container-count]"
  ),
  inventoryContainersEmptyNode: document.querySelector(
    "[data-inventory-containers-empty]"
  ),
  inventoryContainersListNode: document.querySelector(
    "[data-inventory-containers]"
  ),
  inventoryContainersSummaryNode: document.querySelector(
    "[data-inventory-containers-summary]"
  ),
  inventoryItemCountNode: document.querySelector("[data-inventory-item-count]"),
  inventoryItemPathsEmptyNode: document.querySelector(
    "[data-inventory-item-paths-empty]"
  ),
  inventoryItemPathsListNode: document.querySelector(
    "[data-inventory-item-paths]"
  ),
  inventoryItemsEmptyNode: document.querySelector("[data-inventory-items-empty]"),
  inventoryItemsListNode: document.querySelector("[data-inventory-items]"),
  inventoryItemsSummaryNode: document.querySelector(
    "[data-inventory-items-summary]"
  ),
  inventoryOverviewLink: document.querySelector("[data-inventory-overview-link]"),
  inventoryOverviewPage: document.querySelector("[data-inventory-overview-page]"),
  inventoryOverviewSummaryNode: document.querySelector(
    "[data-inventory-overview-summary]"
  ),
  inventoryContainerPathsEmptyNode: document.querySelector(
    "[data-inventory-container-paths-empty]"
  ),
  inventoryContainerPathsListNode: document.querySelector(
    "[data-inventory-container-paths]"
  ),
  inventoryPathsSummaryNode: document.querySelector(
    "[data-inventory-paths-summary]"
  ),
  inventoryStatsSummaryNode: document.querySelector(
    "[data-inventory-stats-summary]"
  ),
  itemActionNote: document.querySelector("[data-item-action-note]"),
  itemDeleteButton: document.querySelector("[data-item-delete]"),
  itemEditButton: document.querySelector("[data-item-edit]"),
  itemEmptyNode: document.querySelector("[data-top-level-items-empty]"),
  itemListNode: document.querySelector("[data-top-level-items]"),
  itemMoveBackLink: document.querySelector("[data-item-move-back-link]"),
  itemMoveCancelButton: document.querySelector("[data-item-move-cancel]"),
  itemMoveCurrentLocationNode: document.querySelector(
    "[data-item-move-current-location]"
  ),
  itemMoveDestinationSelect: document.querySelector(
    "[data-item-move-destination-select]"
  ),
  itemMoveErrorNode: document.querySelector("[data-item-move-error]"),
  itemMoveForm: document.querySelector("[data-item-move-form]"),
  itemMoveNoteNode: document.querySelector("[data-item-move-note]"),
  itemLocationNode: document.querySelector("[data-item-location-status]"),
  itemMoveButton: document.querySelector("[data-item-move]"),
  itemMovePage: document.querySelector("[data-item-move-page]"),
  itemMoveSubmitButton: document.querySelector("[data-item-move-submit]"),
  itemMoveSummaryNode: document.querySelector("[data-item-move-summary]"),
  itemMoveTitleNode: document.querySelector("[data-item-move-title]"),
  itemPage: document.querySelector("[data-item-page]"),
  itemPageNameNode: document.querySelector("[data-item-page-name]"),
  itemPageSummaryNode: document.querySelector("[data-item-page-summary]"),
  itemPhotoImageNode: document.querySelector("[data-item-photo-image]"),
  itemPhotoInput: document.querySelector("[data-item-photo-input]"),
  itemPhotoPickButton: document.querySelector("[data-item-photo-pick]"),
  itemPhotoRemoveButton: document.querySelector("[data-item-photo-remove]"),
  itemPhotoStatusNode: document.querySelector("[data-item-photo-status]"),
  itemQrStatusNode: document.querySelector("[data-item-qr-status]"),
  itemSummaryNode: document.querySelector("[data-top-level-items-summary]"),
  loginButton: document.querySelector("[data-login-button]"),
  loginErrorNode: document.querySelector("[data-login-error]"),
  loginForm: document.querySelector("[data-login-form]"),
  loginPanel: document.querySelector("[data-login-panel]"),
  logoutButton: document.querySelector("[data-logout-button]"),
  objectForm: document.querySelector("[data-object-form]"),
  objectFormBackLink: document.querySelector("[data-object-form-back-link]"),
  objectFormCancelButton: document.querySelector("[data-object-form-cancel]"),
  objectFormErrorNode: document.querySelector("[data-object-form-error]"),
  objectFormKickerNode: document.querySelector("[data-object-form-kicker]"),
  objectFormNoteNode: document.querySelector("[data-object-form-note]"),
  objectFormPage: document.querySelector("[data-object-form-page]"),
  objectFormQrActions: document.querySelector("[data-object-form-qr-actions]"),
  objectFormQrInput: document.querySelector("[data-object-form-qr-input]"),
  objectFormQrInputLabel: document.querySelector(
    "[data-object-form-qr-input-label]"
  ),
  objectFormQrLabelNode: document.querySelector("[data-object-form-qr-label]"),
  objectFormQrNoteNode: document.querySelector("[data-object-form-qr-note]"),
  objectFormQrPanel: document.querySelector("[data-object-form-qr-panel]"),
  objectFormQrRemoveButton: document.querySelector(
    "[data-object-form-qr-remove]"
  ),
  objectFormQrStatusNode: document.querySelector("[data-object-form-qr-status]"),
  objectFormQrSubmitButton: document.querySelector(
    "[data-object-form-qr-submit]"
  ),
  objectFormQrValueNode: document.querySelector("[data-object-form-qr-value]"),
  objectFormSubmitButton: document.querySelector("[data-object-form-submit]"),
  objectFormSummaryNode: document.querySelector("[data-object-form-summary]"),
  objectFormTitleNode: document.querySelector("[data-object-form-title]"),
  objectFormPhotoImageNode: document.querySelector("[data-object-form-photo-image]"),
  objectFormPhotoInput: document.querySelector("[data-object-form-photo-input]"),
  objectFormPhotoPickButton: document.querySelector(
    "[data-object-form-photo-pick]"
  ),
  objectFormPhotoRemoveButton: document.querySelector(
    "[data-object-form-photo-remove]"
  ),
  objectFormPhotoStatusNode: document.querySelector(
    "[data-object-form-photo-status]"
  ),
  objectNameInput: document.querySelector("[data-object-name-input]"),
  objectTypeFieldset: document.querySelector("[data-object-type-fieldset]"),
  objectTypeInputs: Array.from(
    document.querySelectorAll("[data-object-type-input]")
  ),
  parentContainerSelect: document.querySelector("[data-parent-container-select]"),
  passwordInput: document.querySelector("[data-password-input]"),
  recentEmptyNode: document.querySelector("[data-recent-empty]"),
  recentListNode: document.querySelector("[data-recent-objects]"),
  recentSummaryNode: document.querySelector("[data-recent-summary]"),
  recentToggleButton: document.querySelector("[data-recent-toggle]"),
  rowTemplate: document.querySelector("#object-row-template"),
  scanEntryButton: document.querySelector("[data-scan-entry]"),
  scanBackLink: document.querySelector("[data-scan-back-link]"),
  scanErrorNode: document.querySelector("[data-scan-error]"),
  scanManualForm: document.querySelector("[data-scan-manual-form]"),
  scanManualInput: document.querySelector("[data-scan-manual-input]"),
  scanManualSubmitButton: document.querySelector("[data-scan-manual-submit]"),
  scanPage: document.querySelector("[data-scan-page]"),
  scanRetryButton: document.querySelector("[data-scan-retry]"),
  scanStatusNode: document.querySelector("[data-scan-status]"),
  scanSummaryNode: document.querySelector("[data-scan-summary]"),
  scanVideo: document.querySelector("[data-scan-video]"),
  searchEmptyNode: document.querySelector("[data-search-empty]"),
  searchForm: document.querySelector("[data-search-form]"),
  searchInput: document.querySelector("[data-search-input]"),
  searchResultsNode: document.querySelector("[data-search-results]"),
  searchSection: document.querySelector("[data-search-section]"),
  searchSummaryNode: document.querySelector("[data-search-summary]"),
  sessionStatusNode: document.querySelector("[data-session-status]"),
  unknownQrBackLink: document.querySelector("[data-unknown-qr-back-link]"),
  unknownQrCodeNode: document.querySelector("[data-unknown-qr-code]"),
  unknownQrCreateContainerButton: document.querySelector(
    "[data-unknown-qr-create-container]"
  ),
  unknownQrCreateItemButton: document.querySelector(
    "[data-unknown-qr-create-item]"
  ),
  unknownQrEmptyNode: document.querySelector("[data-unknown-qr-empty]"),
  unknownQrErrorNode: document.querySelector("[data-unknown-qr-error]"),
  unknownQrLinkNoteNode: document.querySelector("[data-unknown-qr-link-note]"),
  unknownQrPage: document.querySelector("[data-unknown-qr-page]"),
  unknownQrResultsNode: document.querySelector("[data-unknown-qr-results]"),
  unknownQrSearchForm: document.querySelector("[data-unknown-qr-search-form]"),
  unknownQrSearchInput: document.querySelector("[data-unknown-qr-search-input]"),
  unknownQrSearchSubmitButton: document.querySelector(
    "[data-unknown-qr-search-submit]"
  ),
  unknownQrSummaryNode: document.querySelector("[data-unknown-qr-summary]"),
  unknownQrTitleNode: document.querySelector("[data-unknown-qr-title]"),
  usernameInput: document.querySelector("[data-username-input]"),
  navBackButton: document.querySelector("[data-nav-back]"),
  navForwardButton: document.querySelector("[data-nav-forward]"),
  navHomeButton: document.querySelector("[data-nav-home]")
};

let currentContainerDetail = null;
let currentContainerDeleteState = null;
let currentContainerMoveState = null;
let currentItemDetail = null;
let currentItemMoveState = null;
let currentObjectFormState = null;
let currentObjectFormPhotoPreviewUrl = null;
let currentQrScanState = null;
let currentRecentActivityObjects = [];
let currentRecentActivityExpanded = false;
let currentUnknownQrState = null;

const RECENT_ACTIVITY_COLLAPSED_LIMIT = 5;

function createRequestError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw createRequestError(
      response.status,
      payload && payload.error
        ? payload.error
        : `Request failed with status ${response.status}`
    );
  }

  return payload;
}

function formatCount(count, singularLabel, pluralLabel) {
  return count === 1 ? `1 ${singularLabel}` : `${count} ${pluralLabel}`;
}

function getObjectLabel(objectType) {
  return objectType === "container" ? "Container" : "Item";
}

function getLowerObjectLabel(objectType) {
  return objectType === "container" ? "container" : "item";
}

function buildObjectPath(objectType, objectId) {
  return objectType === "container"
    ? `/containers/${objectId}`
    : `/items/${objectId}`;
}

function buildCreatePath(objectType, parentContainerId, qrCode = null) {
  const basePath = objectType === "container" ? "/containers/new" : "/items/new";
  const searchParams = new URLSearchParams();

  if (parentContainerId) {
    searchParams.set("parentContainerId", String(parentContainerId));
  }

  if (qrCode) {
    searchParams.set("qrCode", qrCode);
  }

  const queryString = searchParams.toString();

  if (!queryString) {
    return basePath;
  }

  return `${basePath}?${queryString}`;
}

function buildEditPath(objectType, objectId) {
  const basePath = objectType === "container" ? "/containers" : "/items";
  return `${basePath}/${objectId}/edit`;
}

function getRecentObjectContext(recentObject) {
  const contextParts = [];

  if (recentObject.actionType === "moved") {
    contextParts.push(
      `${recentObject.fromLocation || "Unknown location"} → ${recentObject.toLocation || "Unknown location"}`
    );
  } else if (recentObject.toLocation) {
    contextParts.push(`In ${recentObject.toLocation}`);
  } else if (recentObject.fromLocation) {
    contextParts.push(`Was in ${recentObject.fromLocation}`);
  }

  const activityTime = recentObject.occurredAt || recentObject.openedAt;

  if (!activityTime) {
    contextParts.push("Recent activity");
    return contextParts.join(" • ");
  }

  const openedAt = new Date(activityTime);

  if (Number.isNaN(openedAt.getTime())) {
    contextParts.push("Recent activity");
    return contextParts.join(" • ");
  }

  contextParts.push(
    openedAt.toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short"
    })
  );

  return contextParts.join(" • ");
}

function buildPathSegmentHref(segment) {
  return buildObjectPath(segment.objectType, segment.id);
}

function renderPathLinks(targetNode, pathSegments, fallbackText) {
  targetNode.replaceChildren();

  if (!Array.isArray(pathSegments) || pathSegments.length === 0) {
    targetNode.textContent = fallbackText;
    return;
  }

  pathSegments.forEach((segment, index) => {
    if (index > 0) {
      const separatorNode = document.createElement("span");
      separatorNode.className = "path-separator";
      separatorNode.textContent = " > ";
      targetNode.append(separatorNode);
    }

    const linkNode = document.createElement("a");
    linkNode.className = "path-link";
    linkNode.href = buildPathSegmentHref(segment);
    linkNode.dataset.pathLink = "";

    const thumbnailNode = document.createElement("span");
    thumbnailNode.className = `path-segment-thumbnail path-segment-thumbnail-${segment.objectType}`;
    thumbnailNode.dataset.pathSegmentIcon = segment.objectType;
    thumbnailNode.setAttribute("aria-hidden", "true");

    const thumbnailUrl = buildPhotoUrl(
      segment.objectType,
      segment.id,
      segment.photoPath
    );

    if (thumbnailUrl) {
      const imageNode = document.createElement("img");
      imageNode.alt = "";
      imageNode.loading = "lazy";
      imageNode.src = thumbnailUrl;
      thumbnailNode.append(imageNode);
    }

    const labelNode = document.createElement("span");
    labelNode.textContent = segment.name;

    linkNode.append(thumbnailNode, labelNode);
    targetNode.append(linkNode);
  });
}

function renderPathRows(targetNode, relationshipPaths, fallbackText) {
  targetNode.replaceChildren();

  if (!Array.isArray(relationshipPaths) || relationshipPaths.length === 0) {
    renderPathLinks(targetNode, null, fallbackText);
    return;
  }

  relationshipPaths.forEach((relationshipPath) => {
    const rowNode = document.createElement("span");
    rowNode.className = "detail-path-row";
    renderPathLinks(rowNode, relationshipPath.path, relationshipPath.fullPath);
    targetNode.append(rowNode);
  });
}

function createObjectRow({
  badge,
  context,
  href,
  name,
  pathSegments = null,
  showContext = true,
  thumbnailAlt = "",
  thumbnailPlaceholder = "",
  thumbnailUrl = null
}) {
  const row = ui.rowTemplate.content.firstElementChild.cloneNode(true);
  const link = row.querySelector("[data-object-link]");
  const objectCopyNode = row.querySelector(".object-copy");
  const nameNode = row.querySelector(".object-name");
  const contextNode = row.querySelector(".object-context");

  if (href) {
    link.href = href;
  } else {
    const rowNode = document.createElement("div");
    rowNode.className = `${link.className} object-row-inactive`;
    link.replaceWith(rowNode);
    rowNode.append(...Array.from(link.childNodes));
  }

  if (Array.isArray(pathSegments) && pathSegments.length > 0) {
    const rowNode = document.createElement("div");
    rowNode.className = link.className;
    link.replaceWith(rowNode);
    rowNode.append(...Array.from(link.childNodes));

    const nameLinkNode = document.createElement("a");
    nameLinkNode.className = "object-name-link";
    nameLinkNode.href = href;
    nameLinkNode.dataset.objectLink = "";
    nameLinkNode.textContent = name;
    nameNode.replaceChildren(nameLinkNode);
    renderPathLinks(contextNode, pathSegments, context);
  }

  if (thumbnailUrl || thumbnailPlaceholder) {
    const thumbnailNode = document.createElement("div");
    thumbnailNode.className = "object-thumbnail";
    thumbnailNode.dataset.objectThumbnail = "";

    if (thumbnailUrl) {
      const imageNode = document.createElement("img");
      imageNode.alt = thumbnailAlt;
      imageNode.className = "object-thumbnail-image";
      imageNode.loading = "lazy";
      imageNode.src = thumbnailUrl;
      thumbnailNode.append(imageNode);
    } else {
      const placeholderNode = document.createElement("span");
      placeholderNode.className = "object-thumbnail-placeholder";
      placeholderNode.textContent = thumbnailPlaceholder;
      thumbnailNode.append(placeholderNode);
    }

    const rowShell = row.querySelector(".object-row");
    rowShell.insertBefore(thumbnailNode, rowShell.firstElementChild);
  }

  if (!Array.isArray(pathSegments) || pathSegments.length === 0) {
    nameNode.textContent = name;
    contextNode.textContent = context;
  }

  contextNode.hidden = !showContext;
  objectCopyNode.hidden = false;
  row.querySelector(".object-badge").textContent = badge;

  return row;
}

function buildThumbnailOptions(
  objectType,
  objectId,
  name,
  photoPath,
  photoUrl = null,
  placeholder = "No photo"
) {
  return {
    thumbnailAlt: `${name} photo`,
    thumbnailPlaceholder: placeholder,
    thumbnailUrl: photoUrl || buildPhotoUrl(objectType, objectId, photoPath)
  };
}

function renderObjectList(listNode, emptyNode, rows, emptyMessage) {
  listNode.replaceChildren(...rows);
  const isEmpty = rows.length === 0;

  listNode.hidden = isEmpty;
  emptyNode.hidden = !isEmpty;
  emptyNode.textContent = emptyMessage;
}

function updateCountSummary(summaryNode, count, singularLabel, pluralLabel) {
  summaryNode.textContent = formatCount(count, singularLabel, pluralLabel);
}

function clearObjectFormPhotoPreviewUrl() {
  if (currentObjectFormPhotoPreviewUrl) {
    URL.revokeObjectURL(currentObjectFormPhotoPreviewUrl);
    currentObjectFormPhotoPreviewUrl = null;
  }
}

function getCurrentRoute() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const searchParams = new URLSearchParams(window.location.search);
  let match = normalizedPath.match(/^\/containers\/(\d+)$/);

  if (normalizedPath === "/") {
    return {
      name: "home"
    };
  }

  if (normalizedPath === "/inventory-overview") {
    return {
      name: "inventory-overview"
    };
  }

  if (normalizedPath === "/objects/new") {
    return {
      name: "object-form",
      mode: "create",
      objectType: searchParams.get("type"),
      parentContainerId: searchParams.get("parentContainerId"),
      qrCode: searchParams.get("qrCode")
    };
  }

  if (normalizedPath === "/containers/new") {
    return {
      name: "object-form",
      mode: "create",
      objectType: "container",
      parentContainerId: searchParams.get("parentContainerId"),
      qrCode: searchParams.get("qrCode")
    };
  }

  if (normalizedPath === "/items/new") {
    return {
      name: "object-form",
      mode: "create",
      objectType: "item",
      parentContainerId: searchParams.get("parentContainerId"),
      qrCode: searchParams.get("qrCode")
    };
  }

  if (normalizedPath === "/scan") {
    return {
      name: "scan"
    };
  }

  if (normalizedPath === "/qr/unknown") {
    return {
      code: searchParams.get("code"),
      name: "unknown-qr"
    };
  }

  match = normalizedPath.match(/^\/containers\/(\d+)\/edit$/);

  if (match) {
    return {
      name: "object-form",
      mode: "edit",
      objectId: Number(match[1]),
      objectType: "container"
    };
  }

  match = normalizedPath.match(/^\/containers\/(\d+)\/move$/);

  if (match) {
    return {
      containerId: Number(match[1]),
      name: "container-move"
    };
  }

  match = normalizedPath.match(/^\/items\/(\d+)\/edit$/);

  if (match) {
    return {
      name: "object-form",
      mode: "edit",
      objectId: Number(match[1]),
      objectType: "item"
    };
  }

  match = normalizedPath.match(/^\/items\/(\d+)\/move$/);

  if (match) {
    return {
      name: "item-move",
      itemId: Number(match[1])
    };
  }

  match = normalizedPath.match(/^\/containers\/(\d+)$/);

  if (match) {
    return {
      containerId: Number(match[1]),
      name: "container"
    };
  }

  match = normalizedPath.match(/^\/items\/(\d+)$/);

  if (match) {
    return {
      itemId: Number(match[1]),
      name: "item"
    };
  }

  return {
    name: "home"
  };
}

function setActiveView(viewName) {
  if (viewName !== "scan") {
    stopQrScan();
  }

  const panels = [
    ui.homeView,
    ui.searchSection,
    ui.inventoryOverviewPage,
    ui.containerMovePage,
    ui.itemMovePage,
    ui.objectFormPage,
    ui.scanPage,
    ui.unknownQrPage,
    ui.containerPage,
    ui.itemPage
  ];

  for (const panel of panels) {
    panel.hidden = true;
  }

  const panelByViewName = {
    container: ui.containerPage,
    "container-move": ui.containerMovePage,
    home: ui.homeView,
    "inventory-overview": ui.inventoryOverviewPage,
    item: ui.itemPage,
    "item-move": ui.itemMovePage,
    "object-form": ui.objectFormPage,
    scan: ui.scanPage,
    "unknown-qr": ui.unknownQrPage
  };
  const activePanel = panelByViewName[viewName] || ui.homeView;

  activePanel.hidden = false;
}

function showSearchPlaceholder() {
  ui.searchSection.hidden = true;
  ui.searchResultsNode.replaceChildren();
  ui.searchEmptyNode.hidden = true;
  ui.searchSummaryNode.textContent = "Search containers and items by name.";
}

function getSearchResultContext(result) {
  if (result.topLevel || result.pathContext === "Top level") {
    return "Top level";
  }

  return result.pathContext || "Location unavailable";
}

function resetHomeData() {
  ui.searchInput.value = "";
  ui.entryNoteNode.textContent =
    "Scan a QR code to open a linked object, or add a new item or container from here.";
  ui.containerSummaryNode.textContent = "Loading containers...";
  ui.itemSummaryNode.textContent = "Loading items...";
  ui.recentSummaryNode.textContent = "Loading recent activity...";
  ui.recentToggleButton.hidden = true;
  ui.recentToggleButton.textContent = "Show more";
  ui.recentListNode.classList.remove("recent-activity-list-expanded");
  currentRecentActivityExpanded = false;
  currentRecentActivityObjects = [];
  ui.inventoryStatsSummaryNode.textContent = "Loading inventory stats...";
  ui.inventoryContainerCountNode.textContent = "0";
  ui.inventoryItemCountNode.textContent = "0";
  renderObjectList(
    ui.containerListNode,
    ui.containerEmptyNode,
    [],
    "No top-level containers yet."
  );
  renderObjectList(
    ui.itemListNode,
    ui.itemEmptyNode,
    [],
    "No top-level items yet."
  );
  renderObjectList(
    ui.recentListNode,
    ui.recentEmptyNode,
    [],
    "Open a container or item to see it here."
  );
  showSearchPlaceholder();
}

function resetInventoryOverviewPage() {
  ui.inventoryOverviewSummaryNode.textContent = "Loading inventory overview...";
  ui.inventoryItemsSummaryNode.textContent = "Loading items...";
  ui.inventoryContainersSummaryNode.textContent = "Loading containers...";
  ui.inventoryPathsSummaryNode.textContent = "Loading relationship paths...";
  renderObjectList(
    ui.inventoryItemsListNode,
    ui.inventoryItemsEmptyNode,
    [],
    "No items yet."
  );
  renderObjectList(
    ui.inventoryContainersListNode,
    ui.inventoryContainersEmptyNode,
    [],
    "No containers yet."
  );
  renderPathList(
    ui.inventoryItemPathsListNode,
    ui.inventoryItemPathsEmptyNode,
    [],
    "No item paths yet."
  );
  renderPathList(
    ui.inventoryContainerPathsListNode,
    ui.inventoryContainerPathsEmptyNode,
    [],
    "No container paths yet."
  );
}

function resetScanPage() {
  hideScanError();
  ui.scanBackLink.href = "/";
  ui.scanSummaryNode.textContent =
    "Point your phone camera at a QR code to open an item or container.";
  ui.scanStatusNode.textContent = "Starting camera...";
  ui.scanManualInput.value = "";
  ui.scanManualSubmitButton.disabled = false;
  ui.scanManualSubmitButton.textContent = "Open";
  ui.scanRetryButton.disabled = false;
  ui.scanVideo.removeAttribute("src");
  ui.scanVideo.srcObject = null;
}

function resetUnknownQrPage() {
  currentUnknownQrState = null;
  hideUnknownQrError();
  ui.unknownQrBackLink.href = "/scan";
  ui.unknownQrTitleNode.textContent = "QR Not Linked Yet";
  ui.unknownQrSummaryNode.textContent =
    "This code is not linked to an item or container yet.";
  ui.unknownQrCodeNode.textContent = "";
  ui.unknownQrSearchInput.value = "";
  ui.unknownQrLinkNoteNode.textContent =
    "Search for the object you want to link to this QR code.";
  ui.unknownQrSearchSubmitButton.disabled = false;
  ui.unknownQrSearchSubmitButton.textContent = "Search";
  ui.unknownQrCreateContainerButton.disabled = false;
  ui.unknownQrCreateContainerButton.textContent = "Create Container";
  ui.unknownQrCreateItemButton.disabled = false;
  ui.unknownQrCreateItemButton.textContent = "Create Item";
  renderObjectList(
    ui.unknownQrResultsNode,
    ui.unknownQrEmptyNode,
    [],
    "Search for an existing item or container to link this QR code."
  );
}

function buildPhotoUrl(objectType, objectId, photoPath) {
  if (!photoPath) {
    return null;
  }

  return `/api/photos/${objectType}/${objectId}?v=${encodeURIComponent(photoPath)}`;
}

async function uploadObjectPhoto(objectType, objectId, file) {
  const objectPath = objectType === "container" ? "containers" : "items";

  return fetchJson(`/api/${objectPath}/${objectId}/photo`, {
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream"
    },
    method: "POST"
  });
}

async function removeObjectPhoto(objectType, objectId) {
  const objectPath = objectType === "container" ? "containers" : "items";

  return fetchJson(`/api/${objectPath}/${objectId}/photo`, {
    method: "DELETE"
  });
}

function renderPhotoPanel({
  disabled = false,
  emptyMessage,
  imageNode,
  objectId,
  objectType,
  photoPath,
  pickButton,
  removeButton,
  statusNode
}) {
  const photoUrl = buildPhotoUrl(objectType, objectId, photoPath);

  if (photoUrl) {
    imageNode.hidden = false;
    imageNode.src = photoUrl;
    statusNode.textContent = "Photo attached.";
  } else {
    imageNode.hidden = true;
    imageNode.removeAttribute("src");
    statusNode.textContent = emptyMessage;
  }

  pickButton.disabled = disabled;
  pickButton.textContent = photoPath ? "Replace Photo" : "Attach Photo";
  removeButton.disabled = disabled || !photoPath;
}

function getQrStatus(qrCode) {
  return qrCode ? "QR linked to this object." : "No QR linked yet.";
}

function getObjectFormQrActionLabel(formState) {
  return formState.qrCode ? "Replace QR" : "Link QR";
}

function setObjectFormQrControlsDisabled(disabled) {
  ui.objectFormQrInput.disabled = disabled;
  ui.objectFormQrSubmitButton.disabled = disabled;
  ui.objectFormQrRemoveButton.disabled = disabled || !currentObjectFormState?.qrCode;
}

function renderObjectFormQrPanel() {
  const formState = currentObjectFormState;

  ui.objectFormQrPanel.hidden = !formState;
  ui.objectFormQrValueNode.hidden = true;
  ui.objectFormQrInputLabel.hidden = true;
  ui.objectFormQrInput.hidden = true;
  ui.objectFormQrNoteNode.hidden = true;
  ui.objectFormQrActions.hidden = true;

  if (!formState) {
    ui.objectFormQrLabelNode.textContent = "QR";
    ui.objectFormQrStatusNode.textContent = "No QR linked yet.";
    ui.objectFormQrValueNode.textContent = "";
    ui.objectFormQrInput.value = "";
    return;
  }

  if (formState.mode === "create" && formState.prefillQrCode) {
    ui.objectFormQrLabelNode.textContent = "Scanned QR";
    ui.objectFormQrStatusNode.textContent =
      "This object will be created with this QR code already linked.";
    ui.objectFormQrValueNode.hidden = false;
    ui.objectFormQrValueNode.textContent = formState.prefillQrCode;
    ui.objectFormQrInput.value = "";
    return;
  }

  if (formState.mode === "edit") {
    ui.objectFormQrLabelNode.textContent = "QR";
    ui.objectFormQrStatusNode.textContent = getQrStatus(formState.qrCode);
    ui.objectFormQrValueNode.hidden = !formState.qrCode;
    ui.objectFormQrValueNode.textContent = formState.qrCode || "";
    ui.objectFormQrInputLabel.hidden = false;
    ui.objectFormQrInput.hidden = false;
    ui.objectFormQrInput.placeholder = formState.qrCode
      ? "Enter a new QR code"
      : "Enter a QR code to link";
    ui.objectFormQrNoteNode.hidden = false;
    ui.objectFormQrNoteNode.textContent = formState.qrCode
      ? "Replace the current QR code or remove it if this object should not be linked."
      : "Link a QR code to this object using the existing QR backend.";
    ui.objectFormQrActions.hidden = false;
    ui.objectFormQrSubmitButton.textContent = getObjectFormQrActionLabel(formState);
    setObjectFormQrControlsDisabled(false);
    return;
  }

  ui.objectFormQrPanel.hidden = true;
}

function updateObjectFormQrCode(qrCode) {
  if (!currentObjectFormState) {
    return;
  }

  currentObjectFormState.qrCode = qrCode || null;
  ui.objectFormQrInput.value = "";
  renderObjectFormQrPanel();
}

function getObjectFormQrErrorMessage(error) {
  if (!error || !error.message) {
    return "Could not update the QR code right now.";
  }

  if (error.status === 409 && error.message.includes("already linked")) {
    return "That QR code is already linked to another object. Use a different code.";
  }

  if (error.status === 409 && error.message.includes("already has a QR code")) {
    return "This object already has a QR code. Use Replace QR instead.";
  }

  if (error.status === 409 && error.message.includes("does not have a QR code")) {
    return "This object does not have a QR code yet. Use Link QR first.";
  }

  return error.message;
}

function resetContainerPage() {
  currentContainerDetail = null;
  resetContainerDeleteFlow();
  ui.containerPageNameNode.textContent = "Loading container...";
  ui.containerPageSummaryNode.textContent = "Loading container details...";
  ui.containerFullPathNode.textContent = "Loading path...";
  ui.containerQrStatusNode.textContent = "No QR linked yet.";
  ui.containerItemCountNode.textContent = "0";
  ui.containerSubcontainerCountNode.textContent = "0";
  ui.containerChildrenSummaryNode.textContent = "Loading child containers...";
  ui.containerItemsSummaryNode.textContent = "Loading child items...";
  ui.containerActionNote.textContent =
    "Add contents, edit details, move this container, or delete it when it is empty.";
  renderPhotoPanel({
    emptyMessage: "No photo added yet.",
    imageNode: ui.containerPhotoImageNode,
    objectId: null,
    objectType: "container",
    photoPath: null,
    pickButton: ui.containerPhotoPickButton,
    removeButton: ui.containerPhotoRemoveButton,
    statusNode: ui.containerPhotoStatusNode
  });
  renderObjectList(
    ui.containerChildContainersNode,
    ui.containerChildContainersEmptyNode,
    [],
    "No child containers yet."
  );
  renderObjectList(
    ui.containerChildItemsNode,
    ui.containerChildItemsEmptyNode,
    [],
    "No child items yet."
  );
}

function resetContainerMovePage() {
  currentContainerMoveState = null;
  ui.containerMoveBackLink.href = "/";
  ui.containerMoveBackLink.textContent = "Back";
  ui.containerMoveTitleNode.textContent = "Loading move flow...";
  ui.containerMoveSummaryNode.textContent = "Loading container details...";
  ui.containerMoveCurrentLocationNode.textContent =
    "Loading current location...";
  ui.containerMoveDestinationSelect.innerHTML = '<option value="">Top Level</option>';
  ui.containerMoveNoteNode.textContent =
    "Choose another container or move this container back to Top Level.";
  ui.containerMoveSubmitButton.disabled = false;
  ui.containerMoveSubmitButton.textContent = "Move Container";
  ui.containerMoveCancelButton.disabled = false;
  hideContainerMoveError();
}

function resetItemPage() {
  currentItemDetail = null;
  ui.itemPageNameNode.textContent = "Loading item...";
  ui.itemPageSummaryNode.textContent = "Loading item details...";
  ui.itemLocationNode.textContent = "Loading location...";
  ui.itemQrStatusNode.textContent = "No QR linked yet.";
  ui.itemActionNote.textContent =
    "Edit form is available now, move item has a dedicated flow, and delete item is available.";
  renderPhotoPanel({
    emptyMessage: "No photo added yet.",
    imageNode: ui.itemPhotoImageNode,
    objectId: null,
    objectType: "item",
    photoPath: null,
    pickButton: ui.itemPhotoPickButton,
    removeButton: ui.itemPhotoRemoveButton,
    statusNode: ui.itemPhotoStatusNode
  });
}

function resetItemMovePage() {
  currentItemMoveState = null;
  ui.itemMoveBackLink.href = "/";
  ui.itemMoveBackLink.textContent = "Back";
  ui.itemMoveTitleNode.textContent = "Loading move flow...";
  ui.itemMoveSummaryNode.textContent = "Loading item details...";
  ui.itemMoveCurrentLocationNode.textContent = "Loading current location...";
  ui.itemMoveDestinationSelect.innerHTML = '<option value="">Top Level</option>';
  ui.itemMoveNoteNode.textContent =
    "Choose a container or move the item back to Top Level.";
  ui.itemMoveSubmitButton.disabled = false;
  ui.itemMoveSubmitButton.textContent = "Move Item";
  ui.itemMoveCancelButton.disabled = false;
  hideItemMoveError();
}

function resetObjectForm() {
  clearObjectFormPhotoPreviewUrl();
  currentObjectFormState = null;
  ui.objectFormBackLink.href = "/";
  ui.objectFormBackLink.textContent = "Back";
  ui.objectFormKickerNode.textContent = "Object Form";
  ui.objectFormTitleNode.textContent = "Loading form...";
  ui.objectFormSummaryNode.textContent = "Loading form details...";
  ui.objectFormNoteNode.textContent =
    "Choose a name and location, then save the object.";
  ui.objectNameInput.value = "";
  ui.parentContainerSelect.innerHTML = '<option value="">Top Level</option>';
  ui.objectFormQrPanel.hidden = true;
  ui.objectFormQrLabelNode.textContent = "QR";
  ui.objectFormQrStatusNode.textContent = "No QR linked yet.";
  ui.objectFormQrInputLabel.hidden = true;
  ui.objectFormQrInput.hidden = true;
  ui.objectFormQrInput.value = "";
  ui.objectFormQrNoteNode.hidden = true;
  ui.objectFormQrActions.hidden = true;
  ui.objectFormQrValueNode.textContent = "";
  ui.objectFormQrValueNode.hidden = true;
  ui.objectFormSubmitButton.disabled = false;
  ui.objectFormSubmitButton.textContent = "Save";
  ui.objectFormCancelButton.disabled = false;
  ui.objectTypeFieldset.hidden = true;
  ui.objectFormPhotoInput.value = "";
  renderPhotoPanel({
    disabled: true,
    emptyMessage: "Save this object first to add a photo.",
    imageNode: ui.objectFormPhotoImageNode,
    objectId: null,
    objectType: "item",
    photoPath: null,
    pickButton: ui.objectFormPhotoPickButton,
    removeButton: ui.objectFormPhotoRemoveButton,
    statusNode: ui.objectFormPhotoStatusNode
  });
  hideObjectFormError();

  for (const input of ui.objectTypeInputs) {
    input.checked = false;
  }
}

function hideLoginError() {
  ui.loginErrorNode.hidden = true;
  ui.loginErrorNode.textContent = "";
}

function showLoginError(message) {
  ui.loginErrorNode.hidden = false;
  ui.loginErrorNode.textContent = message;
}

function hideContainerMoveError() {
  ui.containerMoveErrorNode.hidden = true;
  ui.containerMoveErrorNode.textContent = "";
}

function showContainerMoveError(message) {
  ui.containerMoveErrorNode.hidden = false;
  ui.containerMoveErrorNode.textContent = message;
}

function hideItemMoveError() {
  ui.itemMoveErrorNode.hidden = true;
  ui.itemMoveErrorNode.textContent = "";
}

function showItemMoveError(message) {
  ui.itemMoveErrorNode.hidden = false;
  ui.itemMoveErrorNode.textContent = message;
}

function hideObjectFormError() {
  ui.objectFormErrorNode.hidden = true;
  ui.objectFormErrorNode.textContent = "";
}

function showObjectFormError(message) {
  ui.objectFormErrorNode.hidden = false;
  ui.objectFormErrorNode.textContent = message;
}

function hideScanError() {
  ui.scanErrorNode.hidden = true;
  ui.scanErrorNode.textContent = "";
}

function showScanError(message) {
  ui.scanErrorNode.hidden = false;
  ui.scanErrorNode.textContent = message;
}

function hideUnknownQrError() {
  ui.unknownQrErrorNode.hidden = true;
  ui.unknownQrErrorNode.textContent = "";
}

function showUnknownQrError(message) {
  ui.unknownQrErrorNode.hidden = false;
  ui.unknownQrErrorNode.textContent = message;
}

function getUnknownQrLinkErrorMessage(error) {
  if (!error || !error.message) {
    return "Could not link this QR code right now.";
  }

  if (error.status === 409 && error.message.includes("already linked")) {
    return "This QR code is already linked to another object. Open the linked object or use a different QR code.";
  }

  if (error.status === 409 && error.message.includes("already has a QR code")) {
    return "That object already has a QR code. Remove or replace its existing QR code before linking this one.";
  }

  return error.message;
}

function stopQrScan() {
  if (!currentQrScanState) {
    return;
  }

  if (currentQrScanState.scanTimerId) {
    window.clearTimeout(currentQrScanState.scanTimerId);
  }

  if (currentQrScanState.stream) {
    for (const track of currentQrScanState.stream.getTracks()) {
      track.stop();
    }
  }

  currentQrScanState = null;
  ui.scanVideo.pause();
  ui.scanVideo.removeAttribute("src");
  ui.scanVideo.srcObject = null;
}

function showSignedOutState(message) {
  ui.loginPanel.hidden = false;
  ui.homeSections.hidden = true;
  ui.appNav.hidden = true;
  ui.logoutButton.hidden = true;
  ui.sessionStatusNode.textContent = "Sign in required";
  ui.passwordInput.value = "";
  resetHomeData();
  resetContainerPage();
  resetContainerMovePage();
  resetItemPage();
  resetItemMovePage();
  resetScanPage();
  resetUnknownQrPage();
  resetObjectForm();
  setActiveView("home");

  if (message) {
    showLoginError(message);
  } else {
    hideLoginError();
  }
}

function showLoadError(summaryNode, listNode, emptyNode, message) {
  summaryNode.textContent = "Unavailable";
  renderObjectList(listNode, emptyNode, [], message);
}

function showSignedInState(user) {
  hideLoginError();
  ui.loginPanel.hidden = true;
  ui.homeSections.hidden = false;
  ui.appNav.hidden = false;
  ui.logoutButton.hidden = false;
  ui.sessionStatusNode.textContent = `Signed in as ${user.username}`;
  setActiveView("home");
}

async function loadSession() {
  const data = await fetchJson("/api/auth/current-session");
  return data.user;
}

async function loadTopLevelContainers() {
  const data = await fetchJson("/api/containers/top-level");
  const rows = data.containers.map((container) =>
    createObjectRow({
      badge: "Container",
      context: "Top-level container",
      href: buildObjectPath("container", container.id),
      name: container.name,
      ...buildThumbnailOptions(
        "container",
        container.id,
        container.name,
        container.photoPath
      )
    })
  );

  updateCountSummary(
    ui.containerSummaryNode,
    data.containers.length,
    "top-level container",
    "top-level containers"
  );
  renderObjectList(
    ui.containerListNode,
    ui.containerEmptyNode,
    rows,
    "No top-level containers yet."
  );
}

async function loadTopLevelItems() {
  const data = await fetchJson("/api/items/top-level");
  const rows = data.items.map((item) =>
    createObjectRow({
      badge: "Item",
      context: "Top-level item",
      href: buildObjectPath("item", item.id),
      name: item.name,
      ...buildThumbnailOptions("item", item.id, item.name, item.photoPath)
    })
  );

  updateCountSummary(
    ui.itemSummaryNode,
    data.items.length,
    "top-level item",
    "top-level items"
  );
  renderObjectList(
    ui.itemListNode,
    ui.itemEmptyNode,
    rows,
    "No top-level items yet."
  );
}

async function loadRecentObjects() {
  const data = await fetchJson("/api/recent-objects");
  currentRecentActivityObjects = Array.isArray(data.recentObjects)
    ? data.recentObjects
    : [];
  currentRecentActivityExpanded = false;
  renderRecentActivity();
}

function renderRecentActivity() {
  const visibleRecentObjects = currentRecentActivityExpanded
    ? currentRecentActivityObjects
    : currentRecentActivityObjects.slice(0, RECENT_ACTIVITY_COLLAPSED_LIMIT);
  const rows = visibleRecentObjects.map((recentObject) =>
    createObjectRow({
      badge: recentObject.objectType === "container" ? "Container" : "Item",
      context: getRecentObjectContext(recentObject),
      href: recentObject.canNavigate === false
        ? null
        : buildObjectPath(recentObject.objectType, recentObject.objectId),
      name: recentObject.activityLabel
        ? `${recentObject.activityLabel}: ${recentObject.name}`
        : recentObject.name,
      ...buildThumbnailOptions(
        recentObject.objectType,
        recentObject.objectId,
        recentObject.name,
        recentObject.photoPath,
        recentObject.photoUrl
      )
    })
  );
  const hasMoreRecentActivity =
    currentRecentActivityObjects.length > RECENT_ACTIVITY_COLLAPSED_LIMIT;

  ui.recentSummaryNode.textContent = currentRecentActivityObjects.length
    ? `Showing ${visibleRecentObjects.length} of ${formatCount(
        currentRecentActivityObjects.length,
        "recent activity",
        "recent activities"
      )}`
    : "No recent activity yet.";
  renderObjectList(
    ui.recentListNode,
    ui.recentEmptyNode,
    rows,
    "Open a container or item to see it here."
  );
  ui.recentListNode.classList.toggle(
    "recent-activity-list-expanded",
    currentRecentActivityExpanded && hasMoreRecentActivity
  );
  ui.recentToggleButton.hidden = !hasMoreRecentActivity;
  ui.recentToggleButton.textContent = currentRecentActivityExpanded
    ? "Show less"
    : "Show more";
}

async function loadInventoryStats() {
  const data = await fetchJson("/api/inventory-overview");

  ui.inventoryContainerCountNode.textContent = String(data.counts.containers);
  ui.inventoryItemCountNode.textContent = String(data.counts.items);
  ui.inventoryStatsSummaryNode.textContent = `${formatCount(
    data.counts.containers,
    "container",
    "containers"
  )} and ${formatCount(data.counts.items, "item", "items")} tracked.`;
}

function getOverviewObjectContext(object) {
  return object.topLevel ? "Top level" : object.fullPath;
}

function renderPathList(listNode, emptyNode, paths, emptyMessage) {
  const rows = paths.map((relationshipPath) => {
    const row = document.createElement("li");
    const pathNode = document.createElement("p");
    const pathContentNode = document.createElement("span");
    const typeNode = document.createElement("span");

    pathNode.className = "path-row";
    pathContentNode.className = "path-content";
    pathContentNode.textContent = "Top Level";

    if (
      Array.isArray(relationshipPath.pathSegments) &&
      relationshipPath.pathSegments.length > 0
    ) {
      const separatorNode = document.createElement("span");
      separatorNode.className = "path-separator";
      separatorNode.textContent = " > ";
      const linksNode = document.createElement("span");

      renderPathLinks(
        linksNode,
        relationshipPath.pathSegments,
        relationshipPath.path.replace(/^Top Level > /, "")
      );
      pathContentNode.append(separatorNode, linksNode);
    } else if (relationshipPath.path) {
      pathContentNode.textContent = relationshipPath.path;
    }

    typeNode.className = "object-badge";
    typeNode.textContent =
      relationshipPath.objectType === "container" ? "Container" : "Item";
    pathNode.append(pathContentNode, typeNode);
    row.append(pathNode);
    return row;
  });
  const isEmpty = rows.length === 0;

  listNode.replaceChildren(...rows);
  listNode.hidden = isEmpty;
  emptyNode.hidden = !isEmpty;
  emptyNode.textContent = emptyMessage;
}

function renderInventoryOverview(data) {
  const itemRows = data.items.map((item) =>
    createObjectRow({
      badge: "Item",
      context: "",
      href: buildObjectPath("item", item.id),
      name: item.name,
      showContext: false,
      ...buildThumbnailOptions("item", item.id, item.name, item.photoPath, null, "Item")
    })
  );
  const containerRows = data.containers.map((container) =>
    createObjectRow({
      badge: "Container",
      context: "",
      href: buildObjectPath("container", container.id),
      name: container.name,
      showContext: false,
      ...buildThumbnailOptions(
        "container",
        container.id,
        container.name,
        container.photoPath,
        null,
        "Container"
      )
    })
  );
  const itemPaths = data.relationshipPaths.filter(
    (relationshipPath) => relationshipPath.objectType === "item"
  );
  const containerPaths = data.relationshipPaths.filter(
    (relationshipPath) => relationshipPath.objectType === "container"
  );

  ui.inventoryOverviewSummaryNode.textContent = `${formatCount(
    data.counts.containers,
    "container",
    "containers"
  )} and ${formatCount(data.counts.items, "item", "items")} in inventory.`;
  updateCountSummary(
    ui.inventoryItemsSummaryNode,
    data.items.length,
    "item",
    "items"
  );
  updateCountSummary(
    ui.inventoryContainersSummaryNode,
    data.containers.length,
    "container",
    "containers"
  );
  updateCountSummary(
    ui.inventoryPathsSummaryNode,
    data.relationshipPaths.length,
    "path",
    "paths"
  );
  renderObjectList(
    ui.inventoryItemsListNode,
    ui.inventoryItemsEmptyNode,
    itemRows,
    "No items yet."
  );
  renderObjectList(
    ui.inventoryContainersListNode,
    ui.inventoryContainersEmptyNode,
    containerRows,
    "No containers yet."
  );
  renderPathList(
    ui.inventoryItemPathsListNode,
    ui.inventoryItemPathsEmptyNode,
    itemPaths,
    "No item paths yet."
  );
  renderPathList(
    ui.inventoryContainerPathsListNode,
    ui.inventoryContainerPathsEmptyNode,
    containerPaths,
    "No container paths yet."
  );
}

async function runSearch(query) {
  ui.searchSection.hidden = false;
  ui.searchSummaryNode.textContent = `Searching for "${query}"...`;

  const data = await fetchJson(`/api/search?q=${encodeURIComponent(query)}`);
  const rows = data.results.map((result) =>
    createObjectRow({
      badge: result.objectType === "container" ? "Container" : "Item",
      context: getSearchResultContext(result),
      href: buildObjectPath(result.objectType, result.objectId),
      name: result.name,
      pathSegments: result.topLevel ? null : result.path
    })
  );

  ui.searchSummaryNode.textContent =
    rows.length === 0
      ? `No matches for "${query}"`
      : rows.length === 1
        ? "1 match"
        : `${rows.length} matches`;
  renderObjectList(
    ui.searchResultsNode,
    ui.searchEmptyNode,
    rows,
    `No containers or items matched "${query}".`
  );
}

async function handleSearchSubmit(event) {
  event.preventDefault();

  const query = ui.searchInput.value.trim();

  if (!query) {
    showSearchPlaceholder();
    return;
  }

  try {
    await runSearch(query);
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    ui.searchSection.hidden = false;
    ui.searchSummaryNode.textContent = "Search unavailable";
    renderObjectList(ui.searchResultsNode, ui.searchEmptyNode, [], error.message);
  }
}

function handleSearchInput() {
  if (!ui.searchInput.value.trim()) {
    showSearchPlaceholder();
  }
}

function handleSearchResultsClick(event) {
  const link = event.target.closest("[data-object-link]");

  if (!link) {
    return;
  }

  event.preventDefault();
  navigateTo(link.getAttribute("href"));
}

function handlePathLinkClick(event) {
  const link = event.target.closest("[data-path-link]");

  if (!link) {
    return;
  }

  event.preventDefault();
  navigateTo(link.getAttribute("href"));
}

function handleScanEntryClick() {
  navigateTo("/scan");
}

function handleAddEntryClick() {
  window.location.assign("/objects/new");
}

function handleInventoryOverviewLinkClick() {
  navigateTo("/inventory-overview");
}

function handleRecentToggleClick() {
  currentRecentActivityExpanded = !currentRecentActivityExpanded;
  renderRecentActivity();
}

async function renderHomeView() {
  setActiveView("home");
  resetHomeData();

  const results = await Promise.allSettled([
    loadTopLevelContainers(),
    loadTopLevelItems(),
    loadRecentObjects(),
    loadInventoryStats()
  ]);

  const authError = results.find(
    (result) => result.status === "rejected" && result.reason.status === 401
  );

  if (authError) {
    showSignedOutState("Session expired. Sign in again.");
    return;
  }

  const [containersResult, itemsResult, recentResult, inventoryStatsResult] = results;

  if (containersResult.status === "rejected") {
    showLoadError(
      ui.containerSummaryNode,
      ui.containerListNode,
      ui.containerEmptyNode,
      "Could not load top-level containers."
    );
  }

  if (itemsResult.status === "rejected") {
    showLoadError(
      ui.itemSummaryNode,
      ui.itemListNode,
      ui.itemEmptyNode,
      "Could not load top-level items."
    );
  }

  if (recentResult.status === "rejected") {
    showLoadError(
      ui.recentSummaryNode,
      ui.recentListNode,
      ui.recentEmptyNode,
      "Could not load recent activity."
    );
  }

  if (inventoryStatsResult.status === "rejected") {
    ui.inventoryStatsSummaryNode.textContent = "Could not load inventory stats.";
    ui.inventoryContainerCountNode.textContent = "-";
    ui.inventoryItemCountNode.textContent = "-";
  }
}

async function renderInventoryOverviewPage() {
  setActiveView("inventory-overview");
  resetInventoryOverviewPage();

  try {
    const data = await fetchJson("/api/inventory-overview");
    renderInventoryOverview(data);
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    ui.inventoryOverviewSummaryNode.textContent =
      "Could not load inventory overview.";
    renderObjectList(
      ui.inventoryItemsListNode,
      ui.inventoryItemsEmptyNode,
      [],
      "Items are unavailable."
    );
    renderObjectList(
      ui.inventoryContainersListNode,
      ui.inventoryContainersEmptyNode,
      [],
      "Containers are unavailable."
    );
    renderPathList(
      ui.inventoryItemPathsListNode,
      ui.inventoryItemPathsEmptyNode,
      [],
      "Item paths are unavailable."
    );
    renderPathList(
      ui.inventoryContainerPathsListNode,
      ui.inventoryContainerPathsEmptyNode,
      [],
      "Container paths are unavailable."
    );
  }
}

function renderContainerDetail(detail) {
  const childContainerRows = detail.childContainers.map((container) =>
    createObjectRow({
      badge: "Container",
      context: "Nested container",
      href: buildObjectPath("container", container.id),
      name: container.name,
      ...buildThumbnailOptions(
        "container",
        container.id,
        container.name,
        container.photoPath,
        null,
        "Container"
      )
    })
  );
  const childItemRows = detail.childItems.map((item) =>
    createObjectRow({
      badge: "Item",
      context: "Item in this container",
      href: buildObjectPath("item", item.id),
      name: item.name,
      ...buildThumbnailOptions(
        "item",
        item.id,
        item.name,
        item.photoPath,
        null,
        "Item"
      )
    })
  );

  currentContainerDetail = detail;
  ui.containerPageNameNode.textContent = detail.container.name;
  ui.containerPageSummaryNode.textContent = `${formatCount(
    detail.subcontainerCount,
    "child container",
    "child containers"
  )} and ${formatCount(detail.itemCount, "item", "items")}.`;
  renderPathRows(
    ui.containerFullPathNode,
    detail.relationshipPaths,
    detail.fullPath
  );
  ui.containerQrStatusNode.textContent = getQrStatus(detail.container.qrCode);
  ui.containerItemCountNode.textContent = String(detail.itemCount);
  ui.containerSubcontainerCountNode.textContent = String(
    detail.subcontainerCount
  );
  ui.containerChildrenSummaryNode.textContent = formatCount(
    detail.subcontainerCount,
    "child container",
    "child containers"
  );
  ui.containerItemsSummaryNode.textContent = formatCount(
    detail.itemCount,
    "child item",
    "child items"
  );
  ui.containerActionNote.textContent =
    "Add item, add container, and edit container open the shared form. Move container has a dedicated flow, and delete stays separate.";
  renderPhotoPanel({
    emptyMessage: "No photo added yet.",
    imageNode: ui.containerPhotoImageNode,
    objectId: detail.container.id,
    objectType: "container",
    photoPath: detail.container.photoPath,
    pickButton: ui.containerPhotoPickButton,
    removeButton: ui.containerPhotoRemoveButton,
    statusNode: ui.containerPhotoStatusNode
  });
  renderObjectList(
    ui.containerChildContainersNode,
    ui.containerChildContainersEmptyNode,
    childContainerRows,
    "No child containers yet."
  );
  renderObjectList(
    ui.containerChildItemsNode,
    ui.containerChildItemsEmptyNode,
    childItemRows,
    "No child items yet."
  );
}

function showContainerError(error) {
  currentContainerDetail = null;
  ui.containerPageNameNode.textContent =
    error.status === 404 ? "Container not found" : "Container unavailable";
  ui.containerPageSummaryNode.textContent =
    error.status === 404
      ? "This container could not be found."
      : "Could not load container details.";
  ui.containerFullPathNode.textContent = "Unavailable";
  ui.containerQrStatusNode.textContent = "Unavailable";
  ui.containerItemCountNode.textContent = "0";
  ui.containerSubcontainerCountNode.textContent = "0";
  ui.containerChildrenSummaryNode.textContent = "Unavailable";
  ui.containerItemsSummaryNode.textContent = "Unavailable";
  ui.containerActionNote.textContent =
    "Return home and open another container.";
  renderPhotoPanel({
    disabled: true,
    emptyMessage: "Unavailable",
    imageNode: ui.containerPhotoImageNode,
    objectId: null,
    objectType: "container",
    photoPath: null,
    pickButton: ui.containerPhotoPickButton,
    removeButton: ui.containerPhotoRemoveButton,
    statusNode: ui.containerPhotoStatusNode
  });
  renderObjectList(
    ui.containerChildContainersNode,
    ui.containerChildContainersEmptyNode,
    [],
    "Child containers are unavailable."
  );
  renderObjectList(
    ui.containerChildItemsNode,
    ui.containerChildItemsEmptyNode,
    [],
    "Child items are unavailable."
  );
}

async function renderContainerPage(containerId) {
  setActiveView("container");
  resetContainerPage();

  try {
    const detail = await fetchJson(`/api/containers/${containerId}`);
    renderContainerDetail(detail);
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    showContainerError(error);
  }
}

function renderItemDetail(detail) {
  currentItemDetail = detail;
  ui.itemPageNameNode.textContent = detail.item.name;
  ui.itemPageSummaryNode.textContent = detail.topLevel
    ? "Top-level item."
    : `Currently inside ${detail.currentParentContainer.name}.`;
  renderPathLinks(ui.itemLocationNode, detail.path, detail.fullPath);
  ui.itemQrStatusNode.textContent = getQrStatus(detail.item.qrCode);
  ui.itemActionNote.textContent =
    "Edit details, move this item, or delete it from here.";
  renderPhotoPanel({
    emptyMessage: "No photo added yet.",
    imageNode: ui.itemPhotoImageNode,
    objectId: detail.item.id,
    objectType: "item",
    photoPath: detail.item.photoPath,
    pickButton: ui.itemPhotoPickButton,
    removeButton: ui.itemPhotoRemoveButton,
    statusNode: ui.itemPhotoStatusNode
  });
}

function showItemError(error) {
  currentItemDetail = null;
  ui.itemPageNameNode.textContent =
    error.status === 404 ? "Item not found" : "Item unavailable";
  ui.itemPageSummaryNode.textContent =
    error.status === 404
      ? "This item could not be found."
      : "Could not load item details.";
  ui.itemLocationNode.textContent = "Unavailable";
  ui.itemQrStatusNode.textContent = "Unavailable";
  ui.itemActionNote.textContent = "Return home and open another item.";
  renderPhotoPanel({
    disabled: true,
    emptyMessage: "Unavailable",
    imageNode: ui.itemPhotoImageNode,
    objectId: null,
    objectType: "item",
    photoPath: null,
    pickButton: ui.itemPhotoPickButton,
    removeButton: ui.itemPhotoRemoveButton,
    statusNode: ui.itemPhotoStatusNode
  });
}

async function renderItemPage(itemId) {
  setActiveView("item");
  resetItemPage();

  try {
    const detail = await fetchJson(`/api/items/${itemId}`);
    renderItemDetail(detail);
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    showItemError(error);
  }
}

async function loadParentContainerOptions() {
  const data = await fetchJson("/api/containers/options");
  return data.containers;
}

function findDescendantContainerIds(containers, containerId) {
  const descendants = new Set();
  const childrenByParentId = new Map();

  for (const container of containers) {
    const parentId = container.parentContainerId;

    if (parentId === null) {
      continue;
    }

    if (!childrenByParentId.has(parentId)) {
      childrenByParentId.set(parentId, []);
    }

    childrenByParentId.get(parentId).push(container.id);
  }

  const pendingIds = [containerId];

  while (pendingIds.length > 0) {
    const currentId = pendingIds.pop();
    const childIds = childrenByParentId.get(currentId) || [];

    for (const childId of childIds) {
      if (descendants.has(childId)) {
        continue;
      }

      descendants.add(childId);
      pendingIds.push(childId);
    }
  }

  return descendants;
}

function populateSelectWithContainerOptions(
  selectNode,
  options,
  selectedParentContainerId
) {
  const optionNodes = [
    new Option("Top Level", "")
  ];

  for (const option of options) {
    const label = option.topLevel ? option.name : option.fullPath;
    optionNodes.push(new Option(label, String(option.id)));
  }

  selectNode.replaceChildren(...optionNodes);
  selectNode.value =
    selectedParentContainerId === null || selectedParentContainerId === undefined
      ? ""
      : String(selectedParentContainerId);
}

function populateParentContainerSelect(options, selectedParentContainerId) {
  populateSelectWithContainerOptions(
    ui.parentContainerSelect,
    options,
    selectedParentContainerId
  );
}

function getSelectedObjectType() {
  const selectedInput = ui.objectTypeInputs.find((input) => input.checked);
  return selectedInput ? selectedInput.value : null;
}

function setSelectedObjectType(objectType) {
  for (const input of ui.objectTypeInputs) {
    input.checked = input.value === objectType;
  }
}

function updateObjectFormCopy() {
  if (!currentObjectFormState) {
    return;
  }

  const objectType =
    currentObjectFormState.fixedObjectType || getSelectedObjectType();
  const objectLabel = objectType ? getObjectLabel(objectType) : "Object";
  const actionLabel =
    currentObjectFormState.mode === "edit" ? "Edit" : "Create";
  const lowerObjectLabel = objectType ? getLowerObjectLabel(objectType) : "object";

  ui.objectFormKickerNode.textContent = `${actionLabel} ${objectLabel}`;
  ui.objectFormTitleNode.textContent =
    currentObjectFormState.mode === "edit"
      ? `Edit ${objectLabel}`
      : objectType
        ? `Create ${objectLabel}`
        : "Create Object";
  ui.objectFormSummaryNode.textContent =
    currentObjectFormState.mode === "edit"
      ? `Update this ${lowerObjectLabel} name and location.`
      : objectType
        ? `Add a ${lowerObjectLabel} and choose its location.`
        : "Choose whether you are creating an item or a container.";
  ui.objectFormSubmitButton.textContent =
    currentObjectFormState.mode === "edit"
      ? `Save ${objectLabel}`
      : objectType
        ? `Create ${objectLabel}`
        : "Save";

  if (currentObjectFormState.prefillQrCode) {
    ui.objectFormNoteNode.textContent =
      "This object will be created with the scanned QR code already linked.";
  } else if (currentObjectFormState.mode === "edit") {
    ui.objectFormNoteNode.textContent =
      "Update this object name or location, and manage its QR code here when needed.";
  } else {
    ui.objectFormNoteNode.textContent =
      "Choose a name and location, then save the object.";
  }
}

function renderObjectFormPhotoPanel() {
  if (!currentObjectFormState) {
    renderPhotoPanel({
      disabled: true,
      emptyMessage: "Photo controls are unavailable.",
      imageNode: ui.objectFormPhotoImageNode,
      objectId: null,
      objectType: "item",
      photoPath: null,
      pickButton: ui.objectFormPhotoPickButton,
      removeButton: ui.objectFormPhotoRemoveButton,
      statusNode: ui.objectFormPhotoStatusNode
    });
    return;
  }

  if (currentObjectFormState.mode === "create") {
    if (currentObjectFormState.pendingPhotoFile) {
      if (!currentObjectFormPhotoPreviewUrl) {
        currentObjectFormPhotoPreviewUrl = URL.createObjectURL(
          currentObjectFormState.pendingPhotoFile
        );
      }

      ui.objectFormPhotoImageNode.hidden = false;
      ui.objectFormPhotoImageNode.src = currentObjectFormPhotoPreviewUrl;
      ui.objectFormPhotoImageNode.alt =
        `${currentObjectFormState.pendingPhotoFile.name} preview`;
    } else {
      ui.objectFormPhotoImageNode.hidden = true;
      ui.objectFormPhotoImageNode.removeAttribute("src");
      ui.objectFormPhotoImageNode.alt = "";
    }

    ui.objectFormPhotoPickButton.disabled = false;
    ui.objectFormPhotoPickButton.textContent =
      currentObjectFormState.pendingPhotoFile ? "Replace Photo" : "Attach Photo";
    ui.objectFormPhotoRemoveButton.disabled =
      !currentObjectFormState.pendingPhotoFile;
    ui.objectFormPhotoStatusNode.textContent =
      currentObjectFormState.pendingPhotoFile
        ? `Photo selected: ${currentObjectFormState.pendingPhotoFile.name}`
        : "Choose a photo now, or add one later.";
    return;
  }

  renderPhotoPanel({
    emptyMessage: "No photo added yet.",
    imageNode: ui.objectFormPhotoImageNode,
    objectId: currentObjectFormState.objectId,
    objectType: currentObjectFormState.objectType,
    photoPath: currentObjectFormState.photoPath,
    pickButton: ui.objectFormPhotoPickButton,
    removeButton: ui.objectFormPhotoRemoveButton,
    statusNode: ui.objectFormPhotoStatusNode
  });
}

function buildFormBackPath(formState) {
  if (formState.mode === "edit") {
    return buildObjectPath(formState.objectType, formState.objectId);
  }

  if (formState.prefillQrCode) {
    const searchParams = new URLSearchParams({
      code: formState.prefillQrCode
    });
    return `/qr/unknown?${searchParams.toString()}`;
  }

  if (formState.prefillParentContainerId) {
    return buildObjectPath("container", formState.prefillParentContainerId);
  }

  return "/";
}

function normalizeParentContainerId(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number(value);
}

function navigateTo(path) {
  window.location.assign(path);
}

function buildItemMovePath(itemId) {
  return `/items/${itemId}/move`;
}

function buildContainerMovePath(containerId) {
  return `/containers/${containerId}/move`;
}

async function renderObjectForm(route) {
  setActiveView("object-form");
  resetObjectForm();

  try {
    const parentOptions = await loadParentContainerOptions();
    let formState;
    let selectedParentContainerId = normalizeParentContainerId(
      route.parentContainerId
    );

    if (route.mode === "edit") {
      if (route.objectType === "container") {
        const detail = await fetchJson(`/api/containers/${route.objectId}`);
        const blockedContainerIds = findDescendantContainerIds(
          parentOptions,
          detail.container.id
        );
        const filteredParentOptions = parentOptions.filter(
          (container) =>
            container.id !== detail.container.id &&
            !blockedContainerIds.has(container.id)
        );

        formState = {
          fixedObjectType: "container",
          initialName: detail.container.name,
          initialParentContainerId: detail.container.parentContainerId,
          mode: "edit",
          objectId: detail.container.id,
          objectType: "container",
          parentOptions: filteredParentOptions,
          photoPath: detail.container.photoPath,
          qrCode: detail.container.qrCode,
          prefillParentContainerId: null,
          returnPath: buildObjectPath("container", detail.container.id)
        };
        selectedParentContainerId = detail.container.parentContainerId;
      } else {
        const detail = await fetchJson(`/api/items/${route.objectId}`);

        formState = {
          fixedObjectType: "item",
          initialName: detail.item.name,
          initialParentContainerId: detail.item.parentContainerId,
          mode: "edit",
          objectId: detail.item.id,
          objectType: "item",
          parentOptions,
          photoPath: detail.item.photoPath,
          qrCode: detail.item.qrCode,
          prefillParentContainerId: null,
          returnPath: buildObjectPath("item", detail.item.id)
        };
        selectedParentContainerId = detail.item.parentContainerId;
      }
    } else {
      const fixedObjectType =
        route.objectType === "container" || route.objectType === "item"
          ? route.objectType
          : null;
      const prefillQrCode = route.qrCode ? route.qrCode.trim() : null;

      formState = {
        fixedObjectType,
        initialName: "",
        initialParentContainerId: selectedParentContainerId,
        mode: "create",
        objectId: null,
        objectType: fixedObjectType,
        parentOptions,
        pendingPhotoFile: null,
        photoPath: null,
        qrCode: prefillQrCode,
        prefillQrCode,
        prefillParentContainerId: selectedParentContainerId,
        returnPath: buildFormBackPath({
          mode: "create",
          prefillQrCode,
          prefillParentContainerId: selectedParentContainerId
        })
      };
    }

    currentObjectFormState = formState;
    ui.objectFormBackLink.href = formState.returnPath;
    ui.objectFormBackLink.textContent =
      formState.returnPath === "/" ? "Back to Home" : "Back";
    ui.objectNameInput.value = formState.initialName;
    ui.objectTypeFieldset.hidden = Boolean(formState.fixedObjectType);

    if (formState.fixedObjectType) {
      setSelectedObjectType(formState.fixedObjectType);
    } else if (route.objectType === "item" || route.objectType === "container") {
      setSelectedObjectType(route.objectType);
    } else {
      setSelectedObjectType("item");
    }

    updateObjectFormCopy();
    renderObjectFormPhotoPanel();
    renderObjectFormQrPanel();
    populateParentContainerSelect(formState.parentOptions, selectedParentContainerId);

    ui.objectNameInput.focus();
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    ui.objectFormKickerNode.textContent = "Object Form";
    ui.objectFormTitleNode.textContent = "Form unavailable";
    ui.objectFormSummaryNode.textContent = "Could not load the create/edit form.";
    showObjectFormError(error.message);
  }
}

async function renderItemMovePage(itemId) {
  setActiveView("item-move");
  resetItemMovePage();

  try {
    const [detail, parentOptions] = await Promise.all([
      fetchJson(`/api/items/${itemId}`),
      loadParentContainerOptions()
    ]);

    currentItemMoveState = {
      itemId: detail.item.id,
      returnPath: buildObjectPath("item", detail.item.id)
    };

    ui.itemMoveBackLink.href = currentItemMoveState.returnPath;
    ui.itemMoveBackLink.textContent = "Back";
    ui.itemMoveTitleNode.textContent = `Move ${detail.item.name}`;
    ui.itemMoveSummaryNode.textContent =
      "Choose a new destination for this item.";
    ui.itemMoveCurrentLocationNode.textContent = detail.topLevel
      ? "Top Level"
      : detail.fullPath;

    populateSelectWithContainerOptions(
      ui.itemMoveDestinationSelect,
      parentOptions,
      detail.item.parentContainerId
    );

    if (detail.topLevel) {
      ui.itemMoveNoteNode.textContent =
        "This item is currently at Top Level. Choose a container to move it inside.";
    } else {
      ui.itemMoveNoteNode.textContent =
        "Choose another container or move this item back to Top Level.";
    }
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    ui.itemMoveTitleNode.textContent = "Move unavailable";
    ui.itemMoveSummaryNode.textContent = "Could not load this move screen.";
    showItemMoveError(error.message);
  }
}

async function renderContainerMovePage(containerId) {
  setActiveView("container-move");
  resetContainerMovePage();

  try {
    const [detail, parentOptions] = await Promise.all([
      fetchJson(`/api/containers/${containerId}`),
      loadParentContainerOptions()
    ]);
    const blockedContainerIds = findDescendantContainerIds(
      parentOptions,
      detail.container.id
    );
    const allowedParentOptions = parentOptions.filter(
      (container) =>
        container.id !== detail.container.id &&
        !blockedContainerIds.has(container.id)
    );

    currentContainerMoveState = {
      containerId: detail.container.id,
      returnPath: buildObjectPath("container", detail.container.id)
    };

    ui.containerMoveBackLink.href = currentContainerMoveState.returnPath;
    ui.containerMoveBackLink.textContent = "Back";
    ui.containerMoveTitleNode.textContent = `Move ${detail.container.name}`;
    ui.containerMoveSummaryNode.textContent =
      "Choose a new destination for this container.";
    ui.containerMoveCurrentLocationNode.textContent = detail.fullPath;

    populateSelectWithContainerOptions(
      ui.containerMoveDestinationSelect,
      allowedParentOptions,
      detail.container.parentContainerId
    );

    if (detail.path.length === 1) {
      ui.containerMoveNoteNode.textContent =
        "This container is currently at Top Level. Choose another container to place it inside.";
    } else {
      ui.containerMoveNoteNode.textContent =
        "Choose another container or move this container back to Top Level.";
    }
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    ui.containerMoveTitleNode.textContent = "Move unavailable";
    ui.containerMoveSummaryNode.textContent =
      "Could not load this move screen.";
    showContainerMoveError(error.message);
  }
}

function buildUnknownQrPath(code) {
  const searchParams = new URLSearchParams({
    code
  });
  return `/qr/unknown?${searchParams.toString()}`;
}

function createUnknownQrResultRow(result) {
  const row = document.createElement("li");
  const article = document.createElement("article");
  const copy = document.createElement("div");
  const nameNode = document.createElement("p");
  const contextNode = document.createElement("p");
  const badgeNode = document.createElement("span");
  const actionButton = document.createElement("button");

  article.className = "object-action-row";
  copy.className = "object-copy";
  nameNode.className = "object-name";
  contextNode.className = "object-context";
  badgeNode.className = "object-badge";
  actionButton.className = "secondary-button";
  actionButton.type = "button";
  actionButton.textContent = "Link This QR";
  actionButton.dataset.objectId = String(result.objectId);
  actionButton.dataset.objectType = result.objectType;
  actionButton.dataset.unknownQrLinkButton = "true";

  nameNode.textContent = result.name;
  contextNode.textContent = result.pathContext;
  badgeNode.textContent =
    result.objectType === "container" ? "Container" : "Item";

  copy.append(nameNode, contextNode);
  article.append(copy, badgeNode, actionButton);
  row.append(article);

  return row;
}

async function handleQrCodeOpen(qrCode) {
  const normalizedQrCode = qrCode.trim();
  const result = await fetchJson(
    `/api/qr/open?code=${encodeURIComponent(normalizedQrCode)}`
  );

  if (result.matchType === "container" && result.objectId) {
    navigateTo(buildObjectPath("container", result.objectId));
    return;
  }

  if (result.matchType === "item" && result.objectId) {
    navigateTo(buildObjectPath("item", result.objectId));
    return;
  }

  navigateTo(buildUnknownQrPath(normalizedQrCode));
}

function scheduleNextQrDetection() {
  if (!currentQrScanState) {
    return;
  }

  currentQrScanState.scanTimerId = window.setTimeout(
    runQrDetectionCycle,
    250
  );
}

async function runQrDetectionCycle() {
  if (!currentQrScanState || currentQrScanState.detecting) {
    scheduleNextQrDetection();
    return;
  }

  const { detector, video } = currentQrScanState;

  if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    scheduleNextQrDetection();
    return;
  }

  currentQrScanState.detecting = true;

  try {
    const barcodes = await detector.detect(video);
    const qrCode = barcodes.find((barcode) => barcode.rawValue)?.rawValue;

    if (qrCode) {
      ui.scanStatusNode.textContent = "Opening object...";
      stopQrScan();
      await handleQrCodeOpen(qrCode);
      return;
    }
  } catch (error) {
    ui.scanStatusNode.textContent =
      "Camera is running. If scanning does not start, use manual entry below.";
  } finally {
    if (currentQrScanState) {
      currentQrScanState.detecting = false;
    }
  }

  scheduleNextQrDetection();
}

async function startQrScan() {
  stopQrScan();
  hideScanError();
  ui.scanRetryButton.disabled = true;
  ui.scanStatusNode.textContent = "Starting camera...";

  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
    ui.scanStatusNode.textContent =
      "Camera access is unavailable in this browser. Use manual entry below.";
    ui.scanRetryButton.disabled = false;
    return;
  }

  if (typeof window.BarcodeDetector !== "function") {
    ui.scanStatusNode.textContent =
      "This browser cannot scan QR codes directly. Use manual entry below.";
    ui.scanRetryButton.disabled = false;
    return;
  }

  try {
    const supportedFormats =
      typeof window.BarcodeDetector.getSupportedFormats === "function"
        ? await window.BarcodeDetector.getSupportedFormats()
        : [];
    const detector = supportedFormats.includes("qr_code")
      ? new window.BarcodeDetector({
          formats: ["qr_code"]
        })
      : new window.BarcodeDetector();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: {
          ideal: "environment"
        }
      }
    });

    ui.scanVideo.srcObject = stream;
    await ui.scanVideo.play();

    currentQrScanState = {
      detecting: false,
      detector,
      scanTimerId: null,
      stream,
      video: ui.scanVideo
    };

    ui.scanStatusNode.textContent = "Camera ready. Hold the QR code inside the frame.";
    ui.scanRetryButton.disabled = false;
    scheduleNextQrDetection();
  } catch (error) {
    ui.scanStatusNode.textContent =
      "Could not start the camera. Use manual entry below if needed.";
    showScanError(error.message || "Could not start the camera.");
    ui.scanRetryButton.disabled = false;
  }
}

async function renderScanPage() {
  setActiveView("scan");
  resetScanPage();
  await startQrScan();
}

async function renderUnknownQrPage(code) {
  setActiveView("unknown-qr");
  resetUnknownQrPage();

  const qrCode = typeof code === "string" ? code.trim() : "";

  if (!qrCode) {
    ui.unknownQrTitleNode.textContent = "QR Code Missing";
    ui.unknownQrSummaryNode.textContent =
      "Return to the scan screen and scan or enter a QR code first.";
    showUnknownQrError("A QR code is required to use this screen.");
    return;
  }

  currentUnknownQrState = {
    qrCode
  };
  ui.unknownQrCodeNode.textContent = qrCode;
  ui.unknownQrSummaryNode.textContent =
    "Keep this scanned code visible while you create a new object or link it to an existing one.";
  ui.unknownQrCreateContainerButton.textContent = "Create Container With This QR";
  ui.unknownQrCreateItemButton.textContent = "Create Item With This QR";
  ui.unknownQrLinkNoteNode.textContent =
    `QR code "${qrCode}" is ready to link. Search for the existing object you want to attach it to.`;
  ui.unknownQrSearchInput.focus();
}

function openPhotoPicker(inputNode) {
  inputNode.click();
}

async function refreshObjectFormPhotoState() {
  if (!currentObjectFormState || currentObjectFormState.mode !== "edit") {
    return;
  }

  if (currentObjectFormState.objectType === "container") {
    const detail = await fetchJson(`/api/containers/${currentObjectFormState.objectId}`);
    currentObjectFormState.photoPath = detail.container.photoPath;
  } else {
    const detail = await fetchJson(`/api/items/${currentObjectFormState.objectId}`);
    currentObjectFormState.photoPath = detail.item.photoPath;
  }

  renderObjectFormPhotoPanel();
}

async function handleContainerPhotoInputChange() {
  const file = ui.containerPhotoInput.files && ui.containerPhotoInput.files[0];

  if (!currentContainerDetail || !file) {
    return;
  }

  ui.containerPhotoPickButton.disabled = true;
  ui.containerPhotoRemoveButton.disabled = true;
  ui.containerActionNote.textContent = "Uploading photo...";

  try {
    await uploadObjectPhoto("container", currentContainerDetail.container.id, file);
    await renderContainerPage(currentContainerDetail.container.id);
    ui.containerActionNote.textContent = "Photo saved.";
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    ui.containerActionNote.textContent = error.message;
    renderPhotoPanel({
      emptyMessage: currentContainerDetail.container.photoPath
        ? "Photo attached."
        : "No photo added yet.",
      imageNode: ui.containerPhotoImageNode,
      objectId: currentContainerDetail.container.id,
      objectType: "container",
      photoPath: currentContainerDetail.container.photoPath,
      pickButton: ui.containerPhotoPickButton,
      removeButton: ui.containerPhotoRemoveButton,
      statusNode: ui.containerPhotoStatusNode
    });
  } finally {
    ui.containerPhotoInput.value = "";
  }
}

async function handleContainerPhotoRemoveClick() {
  if (!currentContainerDetail || !currentContainerDetail.container.photoPath) {
    return;
  }

  ui.containerPhotoPickButton.disabled = true;
  ui.containerPhotoRemoveButton.disabled = true;
  ui.containerActionNote.textContent = "Removing photo...";

  try {
    await removeObjectPhoto("container", currentContainerDetail.container.id);
    await renderContainerPage(currentContainerDetail.container.id);
    ui.containerActionNote.textContent = "Photo removed.";
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    ui.containerActionNote.textContent = error.message;
  }
}

async function handleItemPhotoInputChange() {
  const file = ui.itemPhotoInput.files && ui.itemPhotoInput.files[0];

  if (!currentItemDetail || !file) {
    return;
  }

  ui.itemPhotoPickButton.disabled = true;
  ui.itemPhotoRemoveButton.disabled = true;
  ui.itemActionNote.textContent = "Uploading photo...";

  try {
    await uploadObjectPhoto("item", currentItemDetail.item.id, file);
    await renderItemPage(currentItemDetail.item.id);
    ui.itemActionNote.textContent = "Photo saved.";
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    ui.itemActionNote.textContent = error.message;
  } finally {
    ui.itemPhotoInput.value = "";
  }
}

async function handleItemPhotoRemoveClick() {
  if (!currentItemDetail || !currentItemDetail.item.photoPath) {
    return;
  }

  ui.itemPhotoPickButton.disabled = true;
  ui.itemPhotoRemoveButton.disabled = true;
  ui.itemActionNote.textContent = "Removing photo...";

  try {
    await removeObjectPhoto("item", currentItemDetail.item.id);
    await renderItemPage(currentItemDetail.item.id);
    ui.itemActionNote.textContent = "Photo removed.";
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    ui.itemActionNote.textContent = error.message;
  }
}

async function handleObjectFormPhotoInputChange() {
  const file = ui.objectFormPhotoInput.files && ui.objectFormPhotoInput.files[0];

  if (
    currentObjectFormState &&
    currentObjectFormState.mode === "create"
  ) {
    clearObjectFormPhotoPreviewUrl();
    currentObjectFormState.pendingPhotoFile = file || null;
    renderObjectFormPhotoPanel();
    ui.objectFormPhotoInput.value = "";
    return;
  }

  if (
    !currentObjectFormState ||
    currentObjectFormState.mode !== "edit" ||
    !file
  ) {
    return;
  }

  ui.objectFormPhotoPickButton.disabled = true;
  ui.objectFormPhotoRemoveButton.disabled = true;
  ui.objectFormPhotoStatusNode.textContent = "Uploading photo...";

  try {
    await uploadObjectPhoto(
      currentObjectFormState.objectType,
      currentObjectFormState.objectId,
      file
    );
    await refreshObjectFormPhotoState();
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    showObjectFormError(error.message);
    renderObjectFormPhotoPanel();
  } finally {
    ui.objectFormPhotoInput.value = "";
  }
}

async function handleObjectFormPhotoRemoveClick() {
  if (
    currentObjectFormState &&
    currentObjectFormState.mode === "create"
  ) {
    clearObjectFormPhotoPreviewUrl();
    currentObjectFormState.pendingPhotoFile = null;
    ui.objectFormPhotoInput.value = "";
    renderObjectFormPhotoPanel();
    return;
  }

  if (
    !currentObjectFormState ||
    currentObjectFormState.mode !== "edit" ||
    !currentObjectFormState.photoPath
  ) {
    return;
  }

  ui.objectFormPhotoPickButton.disabled = true;
  ui.objectFormPhotoRemoveButton.disabled = true;
  ui.objectFormPhotoStatusNode.textContent = "Removing photo...";

  try {
    await removeObjectPhoto(
      currentObjectFormState.objectType,
      currentObjectFormState.objectId
    );
    await refreshObjectFormPhotoState();
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    showObjectFormError(error.message);
    renderObjectFormPhotoPanel();
  }
}

async function handleObjectFormQrSubmitClick() {
  if (!currentObjectFormState || currentObjectFormState.mode !== "edit") {
    return;
  }

  hideObjectFormError();

  const qrCode = ui.objectFormQrInput.value.trim();

  if (!qrCode) {
    showObjectFormError("Enter a QR code first.");
    return;
  }

  const endpoint = currentObjectFormState.qrCode ? "/api/qr/replace" : "/api/qr/link";
  const actionLabel = currentObjectFormState.qrCode ? "Replacing QR..." : "Linking QR...";

  setObjectFormQrControlsDisabled(true);
  ui.objectFormQrSubmitButton.textContent = actionLabel;

  try {
    const result = await fetchJson(endpoint, {
      body: JSON.stringify({
        objectId: currentObjectFormState.objectId,
        objectType: currentObjectFormState.objectType,
        qrCode
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const updatedObject = result[currentObjectFormState.objectType];

    updateObjectFormQrCode(updatedObject.qrCode);
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    showObjectFormError(getObjectFormQrErrorMessage(error));
    renderObjectFormQrPanel();
  }
}

async function handleObjectFormQrRemoveClick() {
  if (
    !currentObjectFormState ||
    currentObjectFormState.mode !== "edit" ||
    !currentObjectFormState.qrCode
  ) {
    return;
  }

  hideObjectFormError();
  setObjectFormQrControlsDisabled(true);
  ui.objectFormQrRemoveButton.textContent = "Removing QR...";

  try {
    const result = await fetchJson("/api/qr/remove", {
      body: JSON.stringify({
        objectId: currentObjectFormState.objectId,
        objectType: currentObjectFormState.objectType
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
    const updatedObject = result[currentObjectFormState.objectType];

    updateObjectFormQrCode(updatedObject.qrCode);
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    showObjectFormError(getObjectFormQrErrorMessage(error));
    renderObjectFormQrPanel();
  }
}

async function renderCurrentRoute() {
  const route = getCurrentRoute();

  if (route.name === "scan") {
    await renderScanPage();
    return;
  }

  if (route.name === "unknown-qr") {
    await renderUnknownQrPage(route.code);
    return;
  }

  if (route.name === "container-move") {
    await renderContainerMovePage(route.containerId);
    return;
  }

  if (route.name === "item-move") {
    await renderItemMovePage(route.itemId);
    return;
  }

  if (route.name === "object-form") {
    await renderObjectForm(route);
    return;
  }

  if (route.name === "inventory-overview") {
    await renderInventoryOverviewPage();
    return;
  }

  if (route.name === "container") {
    await renderContainerPage(route.containerId);
    return;
  }

  if (route.name === "item") {
    await renderItemPage(route.itemId);
    return;
  }

  await renderHomeView();
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  hideLoginError();
  ui.loginButton.disabled = true;
  ui.loginButton.textContent = "Logging In...";

  try {
    const result = await fetchJson("/api/auth/login", {
      body: JSON.stringify({
        password: ui.passwordInput.value,
        username: ui.usernameInput.value.trim()
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    showSignedInState(result.user);
    await renderCurrentRoute();
  } catch (error) {
    showSignedOutState(
      error.status === 401
        ? "Invalid username or password."
        : "Could not sign in right now."
    );
  } finally {
    ui.loginButton.disabled = false;
    ui.loginButton.textContent = "Log In";
  }
}

async function handleLogoutClick() {
  ui.logoutButton.disabled = true;

  try {
    await fetchJson("/api/auth/logout", {
      method: "POST"
    });
  } catch (error) {
    ui.logoutButton.disabled = false;
    ui.sessionStatusNode.textContent = "Could not log out right now.";
    return;
  }

  ui.logoutButton.disabled = false;
  showSignedOutState();
}

function handleContainerAddItemClick() {
  if (!currentContainerDetail) {
    return;
  }

  navigateTo(buildCreatePath("item", currentContainerDetail.container.id));
}

function handleContainerAddContainerClick() {
  if (!currentContainerDetail) {
    return;
  }

  navigateTo(buildCreatePath("container", currentContainerDetail.container.id));
}

function handleContainerEditClick() {
  if (!currentContainerDetail) {
    return;
  }

  navigateTo(buildEditPath("container", currentContainerDetail.container.id));
}

function handleContainerMoveClick() {
  if (!currentContainerDetail) {
    return;
  }

  navigateTo(buildContainerMovePath(currentContainerDetail.container.id));
}

function getNextPathAfterContainerDelete(detail) {
  if (detail.container.parentContainerId) {
    return buildObjectPath("container", detail.container.parentContainerId);
  }

  return "/";
}

function getContainerDeleteChildren(detail) {
  return [
    ...detail.childContainers.map((container) => ({
      id: container.id,
      name: container.name,
      objectType: "container",
      parentContainerId: container.parentContainerId
    })),
    ...detail.childItems.map((item) => ({
      id: item.id,
      name: item.name,
      objectType: "item",
      parentContainerId: item.parentContainerId
    }))
  ];
}

function resetContainerDeleteFlow() {
  currentContainerDeleteState = null;

  if (!ui.containerDeletePanel) {
    return;
  }

  ui.containerDeletePanel.hidden = true;
  ui.containerDeleteAllDestinationField.hidden = true;
  ui.containerDeleteCustomListNode.hidden = true;
  ui.containerDeleteChildListNode.replaceChildren();
  ui.containerDeleteCustomListNode.replaceChildren();
  ui.containerDeleteDestinationSelect.replaceChildren();
  ui.containerDeleteConfirmButton.disabled = false;
  ui.containerDeleteConfirmButton.textContent = "Confirm Delete";
}

function setContainerDeleteMode(mode) {
  if (!currentContainerDeleteState) {
    return;
  }

  currentContainerDeleteState.mode = mode;
  ui.containerDeleteAllDestinationField.hidden = mode !== "container";
  ui.containerDeleteCustomListNode.hidden = mode !== "custom";
  ui.containerActionNote.textContent =
    mode === "custom"
      ? "Choose a destination for every direct child before deleting."
      : "Review the direct children, then confirm deletion.";
}

function buildContainerDeleteOptionFilter(child = null) {
  return (containerOption) => {
    if (
      currentContainerDeleteState &&
      containerOption.id === currentContainerDeleteState.containerId
    ) {
      return false;
    }

    if (!child || child.objectType !== "container") {
      return true;
    }

    const blockedIds = findDescendantContainerIds(
      currentContainerDeleteState.parentOptions,
      child.id
    );
    return containerOption.id !== child.id && !blockedIds.has(containerOption.id);
  };
}

function populateContainerDeleteDestinationSelects() {
  if (!currentContainerDeleteState) {
    return;
  }

  const allDestinationOptions = currentContainerDeleteState.parentOptions.filter(
    (containerOption) =>
      buildContainerDeleteOptionFilter()(containerOption) &&
      !currentContainerDeleteState.sourceDescendantIds.has(containerOption.id)
  );
  populateSelectWithContainerOptions(
    ui.containerDeleteDestinationSelect,
    allDestinationOptions,
    null
  );

  ui.containerDeleteCustomListNode.replaceChildren(
    ...currentContainerDeleteState.children.map((child) => {
      const wrapper = document.createElement("label");
      wrapper.className = "delete-child-destination";

      const title = document.createElement("span");
      title.className = "delete-child-title";
      title.textContent = `${getObjectLabel(child.objectType)}: ${child.name}`;

      const select = document.createElement("select");
      select.className = "text-input";
      select.dataset.deleteChildObjectType = child.objectType;
      select.dataset.deleteChildObjectId = String(child.id);
      populateSelectWithContainerOptions(
        select,
        currentContainerDeleteState.parentOptions.filter(
          buildContainerDeleteOptionFilter(child)
        ),
        currentContainerDetail.container.parentContainerId
      );

      wrapper.append(title, select);
      return wrapper;
    })
  );
}

function renderContainerDeleteChildren(children) {
  if (children.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "This container has no direct contents.";
    ui.containerDeleteChildListNode.replaceChildren(emptyItem);
    return;
  }

  ui.containerDeleteChildListNode.replaceChildren(
    ...children.map((child) => {
      const listItem = document.createElement("li");
      listItem.textContent = `${getObjectLabel(child.objectType)}: ${child.name}`;
      return listItem;
    })
  );
}

function buildContainerDeletePayload() {
  const mode = currentContainerDeleteState?.mode;

  if (mode === "parent" || mode === "topLevel") {
    return {
      contentStrategy: mode
    };
  }

  if (mode === "container") {
    return {
      contentStrategy: "container",
      destinationParentContainerId: Number(
        ui.containerDeleteDestinationSelect.value
      )
    };
  }

  if (mode === "custom") {
    return {
      childDestinations: Array.from(
        ui.containerDeleteCustomListNode.querySelectorAll("select")
      ).map((select) => ({
        objectId: Number(select.dataset.deleteChildObjectId),
        objectType: select.dataset.deleteChildObjectType,
        parentContainerId: select.value ? Number(select.value) : null
      })),
      contentStrategy: "custom"
    };
  }

  return null;
}

function getNextPathAfterContainerDeleteWithMode(detail, payload) {
  if (payload.contentStrategy === "topLevel") {
    return "/";
  }

  if (payload.contentStrategy === "container") {
    return buildObjectPath("container", payload.destinationParentContainerId);
  }

  return getNextPathAfterContainerDelete(detail);
}

function getContainerDeleteErrorMessage(error) {
  if (!error || !error.message) {
    return "Could not delete this container right now.";
  }

  return error.message;
}

async function handleContainerDeleteClick() {
  if (!currentContainerDetail) {
    return;
  }

  ui.containerDeleteButton.disabled = true;
  ui.containerActionNote.textContent = "Loading delete options...";

  try {
    const parentOptions = await loadParentContainerOptions();
    const children = getContainerDeleteChildren(currentContainerDetail);
    currentContainerDeleteState = {
      children,
      containerId: currentContainerDetail.container.id,
      parentOptions,
      sourceDescendantIds: findDescendantContainerIds(
        parentOptions,
        currentContainerDetail.container.id
      )
    };

    renderContainerDeleteChildren(children);
    populateContainerDeleteDestinationSelects();
    ui.containerDeletePanel.hidden = false;
    setContainerDeleteMode("parent");
    ui.containerDeleteButton.disabled = false;
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    ui.containerDeleteButton.disabled = false;
    ui.containerActionNote.textContent = getContainerDeleteErrorMessage(error);
  }
}

function handleContainerDeleteCancelClick() {
  resetContainerDeleteFlow();
  ui.containerDeleteButton.disabled = false;
  ui.containerActionNote.textContent = "Container deletion canceled.";
}

async function handleContainerDeleteConfirmClick() {
  if (!currentContainerDetail || !currentContainerDeleteState) {
    return;
  }

  const { container } = currentContainerDetail;
  const payload = buildContainerDeletePayload();

  if (!payload) {
    ui.containerActionNote.textContent = "Choose how to move contents before deleting.";
    return;
  }

  if (
    !window.confirm(
      `Delete "${container.name}"? This will not delete its contents.`
    )
  ) {
    return;
  }

  ui.containerDeleteConfirmButton.disabled = true;
  ui.containerDeleteConfirmButton.textContent = "Deleting...";
  ui.containerActionNote.textContent = "Deleting container...";

  try {
    await fetchJson(`/api/containers/${container.id}`, {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json"
      },
      method: "DELETE"
    });

    navigateTo(getNextPathAfterContainerDeleteWithMode(
      currentContainerDetail,
      payload
    ));
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    ui.containerDeleteConfirmButton.disabled = false;
    ui.containerDeleteConfirmButton.textContent = "Confirm Delete";
    ui.containerActionNote.textContent = getContainerDeleteErrorMessage(error);
  }
}

function handleItemEditClick() {
  if (!currentItemDetail) {
    return;
  }

  navigateTo(buildEditPath("item", currentItemDetail.item.id));
}

function handleItemMoveClick() {
  if (!currentItemDetail) {
    return;
  }

  navigateTo(buildItemMovePath(currentItemDetail.item.id));
}

async function handleScanManualSubmit(event) {
  event.preventDefault();

  const qrCode = ui.scanManualInput.value.trim();

  if (!qrCode) {
    showScanError("Enter a QR code to open it.");
    return;
  }

  hideScanError();
  ui.scanManualSubmitButton.disabled = true;
  ui.scanManualSubmitButton.textContent = "Opening...";
  ui.scanStatusNode.textContent = "Looking up QR code...";

  try {
    await handleQrCodeOpen(qrCode);
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    showScanError(error.message);
    ui.scanStatusNode.textContent =
      "Could not open that QR code. Check the value and try again.";
    ui.scanManualSubmitButton.disabled = false;
    ui.scanManualSubmitButton.textContent = "Open";
  }
}

async function handleScanRetryClick() {
  await startQrScan();
}

function handleUnknownQrCreateContainerClick() {
  if (!currentUnknownQrState) {
    return;
  }

  navigateTo(buildCreatePath("container", null, currentUnknownQrState.qrCode));
}

function handleUnknownQrCreateItemClick() {
  if (!currentUnknownQrState) {
    return;
  }

  navigateTo(buildCreatePath("item", null, currentUnknownQrState.qrCode));
}

async function handleUnknownQrSearchSubmit(event) {
  event.preventDefault();

  if (!currentUnknownQrState) {
    return;
  }

  const query = ui.unknownQrSearchInput.value.trim();

  if (!query) {
    showUnknownQrError("Enter a name to search for an existing object.");
    return;
  }

  hideUnknownQrError();
  ui.unknownQrSearchSubmitButton.disabled = true;
  ui.unknownQrSearchSubmitButton.textContent = "Searching...";
  ui.unknownQrLinkNoteNode.textContent =
    `Searching for "${query}" to link QR code "${currentUnknownQrState.qrCode}"...`;

  try {
    const data = await fetchJson(`/api/search?q=${encodeURIComponent(query)}`);
    const rows = data.results.map(createUnknownQrResultRow);

    ui.unknownQrLinkNoteNode.textContent =
      rows.length === 1
        ? `1 result found for QR code "${currentUnknownQrState.qrCode}". Choose the object to link.`
        : `${rows.length} results found for QR code "${currentUnknownQrState.qrCode}". Choose the object to link.`;
    renderObjectList(
      ui.unknownQrResultsNode,
      ui.unknownQrEmptyNode,
      rows,
      `No containers or items matched "${query}". You can still create a new object with QR code "${currentUnknownQrState.qrCode}".`
    );
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    showUnknownQrError(error.message);
    ui.unknownQrLinkNoteNode.textContent =
      `Search is unavailable right now. You can still create a new object with QR code "${currentUnknownQrState.qrCode}".`;
    renderObjectList(
      ui.unknownQrResultsNode,
      ui.unknownQrEmptyNode,
      [],
      "Search is unavailable right now."
    );
  } finally {
    ui.unknownQrSearchSubmitButton.disabled = false;
    ui.unknownQrSearchSubmitButton.textContent = "Search";
  }
}

async function handleUnknownQrResultsClick(event) {
  const linkButton = event.target.closest("[data-unknown-qr-link-button]");

  if (!linkButton || !currentUnknownQrState) {
    return;
  }

  hideUnknownQrError();
  ui.unknownQrLinkNoteNode.textContent =
    `Linking QR code "${currentUnknownQrState.qrCode}"...`;

  const objectType = linkButton.dataset.objectType;
  const objectId = Number(linkButton.dataset.objectId);

  for (const button of ui.unknownQrResultsNode.querySelectorAll("button")) {
    button.disabled = true;
    if (button === linkButton) {
      button.textContent = "Linking...";
    }
  }

  try {
    await fetchJson("/api/qr/link", {
      body: JSON.stringify({
        objectId,
        objectType,
        qrCode: currentUnknownQrState.qrCode
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    navigateTo(buildObjectPath(objectType, objectId));
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    showUnknownQrError(getUnknownQrLinkErrorMessage(error));
    ui.unknownQrLinkNoteNode.textContent =
      `Could not link QR code "${currentUnknownQrState.qrCode}". Choose another object, or create a new one with this QR instead.`;

    for (const button of ui.unknownQrResultsNode.querySelectorAll("button")) {
      button.disabled = false;
      button.textContent = "Link This QR";
    }
  }
}

async function handleObjectFormSubmit(event) {
  event.preventDefault();

  if (!currentObjectFormState) {
    return;
  }

  hideObjectFormError();

  const objectType =
    currentObjectFormState.fixedObjectType || getSelectedObjectType();
  const name = ui.objectNameInput.value.trim();
  const parentContainerId = normalizeParentContainerId(
    ui.parentContainerSelect.value
  );
  const qrCode = currentObjectFormState.prefillQrCode || null;

  if (!objectType) {
    showObjectFormError("Choose whether you are creating an item or a container.");
    return;
  }

  if (!name) {
    showObjectFormError("name is required");
    return;
  }

  ui.objectFormSubmitButton.disabled = true;
  ui.objectFormCancelButton.disabled = true;
  ui.objectFormSubmitButton.textContent =
    currentObjectFormState.mode === "edit" ? "Saving..." : "Creating...";

  try {
    let result;

    if (currentObjectFormState.mode === "create") {
      const pendingPhotoFile = currentObjectFormState.pendingPhotoFile;
      let createdObjectId;

      if (objectType === "container") {
        result = parentContainerId
          ? await fetchJson(`/api/containers/${parentContainerId}/children`, {
              body: JSON.stringify({
                name,
                parentContainerId,
                qrCode
              }),
              headers: {
                "Content-Type": "application/json"
              },
              method: "POST"
            })
          : await fetchJson("/api/containers", {
              body: JSON.stringify({
                name,
                qrCode
              }),
              headers: {
                "Content-Type": "application/json"
              },
              method: "POST"
            });

        createdObjectId = result.container.id;
      } else {
        result = parentContainerId
          ? await fetchJson(`/api/containers/${parentContainerId}/items`, {
              body: JSON.stringify({
                name,
                parentContainerId,
                qrCode
              }),
              headers: {
                "Content-Type": "application/json"
              },
              method: "POST"
            })
          : await fetchJson("/api/items", {
              body: JSON.stringify({
                name,
                qrCode
              }),
              headers: {
                "Content-Type": "application/json"
              },
              method: "POST"
            });

        createdObjectId = result.item.id;
      }

      if (pendingPhotoFile) {
        ui.objectFormSubmitButton.textContent = "Uploading photo...";

        try {
          await uploadObjectPhoto(objectType, createdObjectId, pendingPhotoFile);
        } catch (photoError) {
          if (photoError.status === 401) {
            showSignedOutState("Session expired. Sign in again.");
            return;
          }

          currentObjectFormState = {
            fixedObjectType: objectType,
            initialName: name,
            initialParentContainerId: parentContainerId,
            mode: "edit",
            objectId: createdObjectId,
            objectType,
            parentOptions: currentObjectFormState.parentOptions,
            pendingPhotoFile: null,
            photoPath: null,
            qrCode: result[objectType].qrCode,
            prefillParentContainerId: null,
            returnPath: buildObjectPath(objectType, createdObjectId)
          };
          showObjectFormError(
            `Created ${getLowerObjectLabel(objectType)}, but photo upload failed. ${photoError.message}`
          );
          clearObjectFormPhotoPreviewUrl();
          ui.objectFormSubmitButton.disabled = false;
          ui.objectFormCancelButton.disabled = false;
          updateObjectFormCopy();
          renderObjectFormPhotoPanel();
          return;
        }
      }

      navigateTo(buildObjectPath(objectType, createdObjectId));
      return;
    }

    if (objectType === "container") {
      await fetchJson(`/api/containers/${currentObjectFormState.objectId}`, {
        body: JSON.stringify({
          name
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "PATCH"
      });

      if (
        parentContainerId !== currentObjectFormState.initialParentContainerId
      ) {
        await fetchJson(
          `/api/containers/${currentObjectFormState.objectId}/move`,
          {
            body: JSON.stringify({
              parentContainerId
            }),
            headers: {
              "Content-Type": "application/json"
            },
            method: "POST"
          }
        );
      }

      navigateTo(buildObjectPath("container", currentObjectFormState.objectId));
      return;
    }

    await fetchJson(`/api/items/${currentObjectFormState.objectId}`, {
      body: JSON.stringify({
        name
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "PATCH"
    });

    if (parentContainerId !== currentObjectFormState.initialParentContainerId) {
      await fetchJson(`/api/items/${currentObjectFormState.objectId}/move`, {
        body: JSON.stringify({
          parentContainerId
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
    }

    navigateTo(buildObjectPath("item", currentObjectFormState.objectId));
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    if (currentObjectFormState.mode === "edit") {
      showObjectFormError(
        `Could not save changes. ${error.message}`
      );
    } else {
      showObjectFormError(error.message);
    }

    ui.objectFormSubmitButton.disabled = false;
    ui.objectFormCancelButton.disabled = false;
    updateObjectFormCopy();
  }
}

function handleObjectFormCancelClick() {
  if (!currentObjectFormState) {
    navigateTo("/");
    return;
  }

  navigateTo(currentObjectFormState.returnPath);
}

function handleObjectTypeChange() {
  if (!currentObjectFormState || currentObjectFormState.fixedObjectType) {
    return;
  }

  hideObjectFormError();
  updateObjectFormCopy();
}

function getContainerMoveErrorMessage(error) {
  if (!error || !error.message) {
    return "Could not move this container right now.";
  }

  if (
    error.message.includes("inside itself") ||
    error.message.includes("descendants")
  ) {
    return "This move is not allowed. A container cannot be moved inside itself or inside one of its descendants.";
  }

  return error.message;
}

async function handleContainerMoveSubmit(event) {
  event.preventDefault();

  if (!currentContainerMoveState) {
    return;
  }

  hideContainerMoveError();
  ui.containerMoveSubmitButton.disabled = true;
  ui.containerMoveCancelButton.disabled = true;
  ui.containerMoveSubmitButton.textContent = "Moving...";

  const parentContainerId = normalizeParentContainerId(
    ui.containerMoveDestinationSelect.value
  );

  try {
    await fetchJson(`/api/containers/${currentContainerMoveState.containerId}/move`, {
      body: JSON.stringify({
        parentContainerId
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    navigateTo(currentContainerMoveState.returnPath);
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    showContainerMoveError(getContainerMoveErrorMessage(error));
    ui.containerMoveSubmitButton.disabled = false;
    ui.containerMoveCancelButton.disabled = false;
    ui.containerMoveSubmitButton.textContent = "Move Container";
  }
}

function handleContainerMoveCancelClick() {
  if (!currentContainerMoveState) {
    navigateTo("/");
    return;
  }

  navigateTo(currentContainerMoveState.returnPath);
}

async function handleItemMoveSubmit(event) {
  event.preventDefault();

  if (!currentItemMoveState) {
    return;
  }

  hideItemMoveError();
  ui.itemMoveSubmitButton.disabled = true;
  ui.itemMoveCancelButton.disabled = true;
  ui.itemMoveSubmitButton.textContent = "Moving...";

  const parentContainerId = normalizeParentContainerId(
    ui.itemMoveDestinationSelect.value
  );

  try {
    await fetchJson(`/api/items/${currentItemMoveState.itemId}/move`, {
      body: JSON.stringify({
        parentContainerId
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    navigateTo(currentItemMoveState.returnPath);
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    showItemMoveError(error.message);
    ui.itemMoveSubmitButton.disabled = false;
    ui.itemMoveCancelButton.disabled = false;
    ui.itemMoveSubmitButton.textContent = "Move Item";
  }
}

function handleItemMoveCancelClick() {
  if (!currentItemMoveState) {
    navigateTo("/");
    return;
  }

  navigateTo(currentItemMoveState.returnPath);
}

async function handleItemDeleteClick() {
  if (!currentItemDetail) {
    return;
  }

  if (!window.confirm(`Delete "${currentItemDetail.item.name}"?`)) {
    return;
  }

  ui.itemDeleteButton.disabled = true;
  ui.itemActionNote.textContent = "Deleting item...";

  try {
    await fetchJson(`/api/items/${currentItemDetail.item.id}`, {
      method: "DELETE"
    });

    const nextPath = currentItemDetail.currentParentContainer
      ? buildObjectPath("container", currentItemDetail.currentParentContainer.id)
      : "/";

    window.location.assign(nextPath);
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState("Session expired. Sign in again.");
      return;
    }

    ui.itemDeleteButton.disabled = false;
    ui.itemActionNote.textContent = error.message;
  }
}

async function initializeApp() {
  try {
    const user = await loadSession();
    showSignedInState(user);
    await renderCurrentRoute();
  } catch (error) {
    if (error.status === 401) {
      showSignedOutState();
      return;
    }

    showSignedOutState("Could not reach the inventory server.");
    ui.sessionStatusNode.textContent = "Server unavailable";
  }
}

ui.loginForm.addEventListener("submit", handleLoginSubmit);
document.addEventListener("click", handlePathLinkClick);
ui.logoutButton.addEventListener("click", handleLogoutClick);
ui.searchForm.addEventListener("submit", handleSearchSubmit);
ui.searchInput.addEventListener("input", handleSearchInput);
ui.searchResultsNode.addEventListener("click", handleSearchResultsClick);
ui.inventoryItemsListNode.addEventListener("click", handleSearchResultsClick);
ui.inventoryContainersListNode.addEventListener("click", handleSearchResultsClick);
ui.scanEntryButton.addEventListener("click", handleScanEntryClick);
ui.scanManualForm.addEventListener("submit", handleScanManualSubmit);
ui.scanRetryButton.addEventListener("click", handleScanRetryClick);
ui.addEntryButton.addEventListener("click", handleAddEntryClick);
ui.inventoryOverviewLink.addEventListener("click", handleInventoryOverviewLinkClick);
ui.recentToggleButton.addEventListener("click", handleRecentToggleClick);
ui.containerAddItemButton.addEventListener("click", handleContainerAddItemClick);
ui.containerAddContainerButton.addEventListener(
  "click",
  handleContainerAddContainerClick
);
ui.containerEditButton.addEventListener("click", handleContainerEditClick);
ui.containerMoveButton.addEventListener("click", handleContainerMoveClick);
ui.containerDeleteButton.addEventListener("click", handleContainerDeleteClick);
ui.containerDeleteCancelButton.addEventListener(
  "click",
  handleContainerDeleteCancelClick
);
ui.containerDeleteConfirmButton.addEventListener(
  "click",
  handleContainerDeleteConfirmClick
);
for (const button of ui.containerDeleteModeButtons) {
  button.addEventListener("click", () => {
    setContainerDeleteMode(button.dataset.containerDeleteMode);
  });
}
ui.containerPhotoPickButton.addEventListener("click", () =>
  openPhotoPicker(ui.containerPhotoInput)
);
ui.containerPhotoInput.addEventListener("change", handleContainerPhotoInputChange);
ui.containerPhotoRemoveButton.addEventListener(
  "click",
  handleContainerPhotoRemoveClick
);
ui.containerMoveForm.addEventListener("submit", handleContainerMoveSubmit);
ui.containerMoveCancelButton.addEventListener(
  "click",
  handleContainerMoveCancelClick
);
ui.itemEditButton.addEventListener("click", handleItemEditClick);
ui.itemMoveButton.addEventListener("click", handleItemMoveClick);
ui.itemDeleteButton.addEventListener("click", handleItemDeleteClick);
ui.itemPhotoPickButton.addEventListener("click", () =>
  openPhotoPicker(ui.itemPhotoInput)
);
ui.itemPhotoInput.addEventListener("change", handleItemPhotoInputChange);
ui.itemPhotoRemoveButton.addEventListener("click", handleItemPhotoRemoveClick);
ui.itemMoveForm.addEventListener("submit", handleItemMoveSubmit);
ui.itemMoveCancelButton.addEventListener("click", handleItemMoveCancelClick);
ui.unknownQrCreateContainerButton.addEventListener(
  "click",
  handleUnknownQrCreateContainerClick
);
ui.unknownQrCreateItemButton.addEventListener(
  "click",
  handleUnknownQrCreateItemClick
);
ui.unknownQrSearchForm.addEventListener("submit", handleUnknownQrSearchSubmit);
ui.unknownQrResultsNode.addEventListener("click", handleUnknownQrResultsClick);
ui.objectForm.addEventListener("submit", handleObjectFormSubmit);
ui.objectFormCancelButton.addEventListener("click", handleObjectFormCancelClick);
ui.objectFormPhotoPickButton.addEventListener("click", () =>
  openPhotoPicker(ui.objectFormPhotoInput)
);
ui.objectFormPhotoInput.addEventListener("change", handleObjectFormPhotoInputChange);
ui.objectFormPhotoRemoveButton.addEventListener(
  "click",
  handleObjectFormPhotoRemoveClick
);
ui.objectFormQrSubmitButton.addEventListener("click", handleObjectFormQrSubmitClick);
ui.objectFormQrRemoveButton.addEventListener("click", handleObjectFormQrRemoveClick);

for (const input of ui.objectTypeInputs) {
  input.addEventListener("change", handleObjectTypeChange);
}

if (ui.navBackButton) {
  ui.navBackButton.addEventListener("click", () => {
    try {
      window.history.back();
    } catch (e) {
      // no-op
    }
  });
}

if (ui.navForwardButton) {
  ui.navForwardButton.addEventListener("click", () => {
    try {
      window.history.forward();
    } catch (e) {
      // no-op
    }
  });
}

if (ui.navHomeButton) {
  ui.navHomeButton.addEventListener("click", () => {
    navigateTo("/");
  });
}

showSearchPlaceholder();
initializeApp();
