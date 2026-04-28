const fs = require("fs");
const http = require("http");
const path = require("path");
const pkg = require(path.join(__dirname, "..", "package.json"));

const { config, getServerBinding } = require("./config");
const { initializeDatabase, withDatabase } = require("./database");
const {
  authenticateCredentials,
  clearSessionCookie,
  createHttpError,
  createSessionCookie,
  destroySession,
  ensureBootstrapUser,
  requireAuthenticatedUser
} = require("./auth");
const {
  createChildContainer,
  createTopLevelContainer,
  deleteContainer,
  editContainer,
  getContainerDetail,
  listParentContainerOptions,
  listTopLevelContainers,
  moveContainer
} = require("./containers");
const {
  createItemInContainer,
  createTopLevelItem,
  deleteItem,
  editItem,
  getItemDetail,
  listTopLevelItems,
  moveItem
} = require("./items");
const {
  getObjectPhotoFile,
  removeObjectPhoto,
  storeObjectPhoto
} = require("./photos");
const { linkQr, openByQr, removeQr, replaceQr } = require("./qr");
const {
  listRecentObjects,
  recordRecentObjectOpen
} = require("./recent-objects");
const { searchObjects } = require("./search");

const frontendDir = path.join(config.repoRoot, "frontend");
const frontendRoot = fs.realpathSync(frontendDir);
const frontendIndexPath = path.join(frontendRoot, "index.html");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8"
  ,
  ".png": "image/png",
  ".webp": "image/webp"
};

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);

  response.writeHead(statusCode, {
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(body);
}

function sendJsonWithHeaders(response, statusCode, payload, headers) {
  const body = JSON.stringify(payload, null, 2);

  response.writeHead(statusCode, {
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": "application/json; charset=utf-8",
    ...headers
  });
  response.end(body);
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType =
    contentTypes[extension] || "application/octet-stream";

  response.writeHead(200, {
    "Content-Type": contentType
  });

  fs.createReadStream(filePath).pipe(response);
}

function isPathInsideDirectory(directoryPath, candidatePath) {
  const relativePath = path.relative(directoryPath, candidatePath);

  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))
  );
}

function getRawRequestPath(requestUrl) {
  const rawUrl = typeof requestUrl === "string" && requestUrl ? requestUrl : "/";
  const querySeparatorIndex = rawUrl.indexOf("?");

  if (querySeparatorIndex === -1) {
    return rawUrl;
  }

  return rawUrl.slice(0, querySeparatorIndex) || "/";
}

function serveFrontend(response, requestPath) {
  let decodedPath;

  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch (error) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  const requestedPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const resolvedPath = path.resolve(frontendRoot, `.${requestedPath}`);

  if (!isPathInsideDirectory(frontendRoot, resolvedPath)) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
    const realFilePath = fs.realpathSync(resolvedPath);

    if (!isPathInsideDirectory(frontendRoot, realFilePath)) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }

    sendFile(response, realFilePath);
    return;
  }

  sendFile(response, frontendIndexPath);
}

function readJsonBody(request) {
  const maxBodySize = 16 * 1024;

  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalSize = 0;

    request.on("data", (chunk) => {
      totalSize += chunk.length;

      if (totalSize > maxBodySize) {
        reject(createHttpError(413, "Request body too large"));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => {
      const rawBody = Buffer.concat(chunks).toString("utf8");

      if (!rawBody) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(createHttpError(400, "Invalid JSON body"));
      }
    });

    request.on("error", (error) => {
      reject(error);
    });
  });
}

function normalizeUploadMimeType(contentTypeHeader) {
  if (typeof contentTypeHeader !== "string") {
    return "";
  }

  return contentTypeHeader.split(";")[0].trim().toLowerCase();
}

function readBinaryBody(request, maxBodySize = 10 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalSize = 0;

    request.on("data", (chunk) => {
      totalSize += chunk.length;

      if (totalSize > maxBodySize) {
        reject(createHttpError(413, "Upload is too large"));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    request.on("error", (error) => {
      reject(error);
    });
  });
}

async function handleAuthLogin(request, response) {
  const body = await readJsonBody(request);
  const user = authenticateCredentials(body.username, body.password);

  if (!user) {
    sendJson(response, 401, {
      error: "Invalid username or password"
    });
    return;
  }

  sendJsonWithHeaders(
    response,
    200,
    {
      user
    },
    {
      "Set-Cookie": createSessionCookie(user)
    }
  );
}

function handleAuthLogout(request, response) {
  destroySession(request);

  sendJsonWithHeaders(
    response,
    200,
    {
      success: true
    },
    {
      "Set-Cookie": clearSessionCookie()
    }
  );
}

function handleCurrentSession(request, response) {
  const user = requireAuthenticatedUser(request);

  sendJson(response, 200, {
    user
  });
}

async function handleCreateTopLevelContainer(request, response) {
  const user = requireAuthenticatedUser(request);
  const body = await readJsonBody(request);
  const result = withDatabase((database) =>
    createTopLevelContainer(database, user.id, body)
  );

  sendJson(response, 201, result);
}

async function handleCreateChildContainer(request, response, parentContainerId) {
  const user = requireAuthenticatedUser(request);
  const body = await readJsonBody(request);
  const result = withDatabase((database) =>
    createChildContainer(database, parentContainerId, user.id, body)
  );

  sendJson(response, 201, result);
}

function handleListTopLevelContainers(request, response) {
  const user = requireAuthenticatedUser(request);
  const result = withDatabase((database) =>
    listTopLevelContainers(database, user.id)
  );

  sendJson(response, 200, result);
}

function handleListParentContainerOptions(request, response) {
  const user = requireAuthenticatedUser(request);
  const result = withDatabase((database) =>
    listParentContainerOptions(database, user.id)
  );

  sendJson(response, 200, result);
}

function handleGetContainerDetail(request, response, containerId) {
  const user = requireAuthenticatedUser(request);
  const result = withDatabase((database) =>
    {
      const detail = getContainerDetail(database, containerId, user.id);
      recordRecentObjectOpen(database, user.id, "container", containerId);
      return detail;
    }
  );

  sendJson(response, 200, result);
}

async function handleEditContainer(request, response, containerId) {
  const user = requireAuthenticatedUser(request);
  const body = await readJsonBody(request);
  const result = withDatabase((database) =>
    editContainer(database, containerId, user.id, body)
  );

  sendJson(response, 200, result);
}

async function handleMoveContainer(request, response, containerId) {
  const user = requireAuthenticatedUser(request);
  const body = await readJsonBody(request);
  const result = withDatabase((database) =>
    moveContainer(database, containerId, user.id, body)
  );

  sendJson(response, 200, result);
}

function handleDeleteContainer(request, response, containerId) {
  const user = requireAuthenticatedUser(request);
  const result = withDatabase((database) =>
    deleteContainer(database, containerId, user.id)
  );

  sendJson(response, 200, result);
}

async function handleCreateTopLevelItem(request, response) {
  const user = requireAuthenticatedUser(request);
  const body = await readJsonBody(request);
  const result = withDatabase((database) =>
    createTopLevelItem(database, user.id, body)
  );

  sendJson(response, 201, result);
}

async function handleCreateItemInContainer(request, response, parentContainerId) {
  const user = requireAuthenticatedUser(request);
  const body = await readJsonBody(request);
  const result = withDatabase((database) =>
    createItemInContainer(database, parentContainerId, user.id, body)
  );

  sendJson(response, 201, result);
}

function handleListTopLevelItems(request, response) {
  const user = requireAuthenticatedUser(request);
  const result = withDatabase((database) =>
    listTopLevelItems(database, user.id)
  );

  sendJson(response, 200, result);
}

function handleGetItemDetail(request, response, itemId) {
  const user = requireAuthenticatedUser(request);
  const result = withDatabase((database) =>
    {
      const detail = getItemDetail(database, itemId, user.id);
      recordRecentObjectOpen(database, user.id, "item", itemId);
      return detail;
    }
  );

  sendJson(response, 200, result);
}

function handleListRecentObjects(request, response) {
  const user = requireAuthenticatedUser(request);
  const result = withDatabase((database) =>
    listRecentObjects(database, user.id)
  );

  sendJson(response, 200, result);
}

async function handleEditItem(request, response, itemId) {
  const user = requireAuthenticatedUser(request);
  const body = await readJsonBody(request);
  const result = withDatabase((database) =>
    editItem(database, itemId, user.id, body)
  );

  sendJson(response, 200, result);
}

async function handleMoveItem(request, response, itemId) {
  const user = requireAuthenticatedUser(request);
  const body = await readJsonBody(request);
  const result = withDatabase((database) =>
    moveItem(database, itemId, user.id, body)
  );

  sendJson(response, 200, result);
}

function handleDeleteItem(request, response, itemId) {
  const user = requireAuthenticatedUser(request);
  const result = withDatabase((database) =>
    deleteItem(database, itemId, user.id)
  );

  sendJson(response, 200, result);
}

function handleSearch(request, response, requestUrl) {
  const user = requireAuthenticatedUser(request);
  const result = withDatabase((database) =>
    searchObjects(database, user.id, requestUrl.searchParams.get("q"))
  );

  sendJson(response, 200, result);
}

function handleOpenByQr(request, response, requestUrl) {
  const user = requireAuthenticatedUser(request);
  const result = withDatabase((database) =>
    openByQr(database, user.id, requestUrl.searchParams.get("code"))
  );

  sendJson(response, 200, result);
}

async function handleLinkQr(request, response) {
  const user = requireAuthenticatedUser(request);
  const body = await readJsonBody(request);
  const result = withDatabase((database) =>
    linkQr(database, user.id, body)
  );

  sendJson(response, 200, result);
}

async function handleReplaceQr(request, response) {
  const user = requireAuthenticatedUser(request);
  const body = await readJsonBody(request);
  const result = withDatabase((database) =>
    replaceQr(database, user.id, body)
  );

  sendJson(response, 200, result);
}

async function handleRemoveQr(request, response) {
  const user = requireAuthenticatedUser(request);
  const body = await readJsonBody(request);
  const result = withDatabase((database) =>
    removeQr(database, user.id, body)
  );

  sendJson(response, 200, result);
}

async function handleStoreObjectPhoto(request, response, objectType, objectId) {
  const user = requireAuthenticatedUser(request);
  const buffer = await readBinaryBody(request);
  const mimeType = normalizeUploadMimeType(request.headers["content-type"]);
  const result = withDatabase((database) =>
    storeObjectPhoto(database, objectType, objectId, user.id, {
      buffer,
      mimeType
    })
  );

  sendJson(response, 200, result);
}

function handleRemoveObjectPhoto(request, response, objectType, objectId) {
  const user = requireAuthenticatedUser(request);
  const result = withDatabase((database) =>
    removeObjectPhoto(database, objectType, objectId, user.id)
  );

  sendJson(response, 200, result);
}

function handleGetObjectPhoto(request, response, objectType, objectId) {
  const user = requireAuthenticatedUser(request);
  const photoFile = withDatabase((database) =>
    getObjectPhotoFile(database, objectType, objectId, user.id)
  );

  response.writeHead(200, {
    "Cache-Control": "private, max-age=0, must-revalidate",
    "Content-Type": photoFile.contentType
  });
  fs.createReadStream(photoFile.filePath).pipe(response);
}

async function handleRequest(request, response) {
  if (!request.url) {
    sendJson(response, 400, { error: "Missing request URL" });
    return;
  }

  const requestUrl = new URL(request.url, config.localServerAddress);
  const createChildContainerMatch = requestUrl.pathname.match(
    /^\/api\/containers\/(\d+)\/children$/
  );
  const moveContainerMatch = requestUrl.pathname.match(
    /^\/api\/containers\/(\d+)\/move$/
  );
  const containerPhotoMatch = requestUrl.pathname.match(
    /^\/api\/containers\/(\d+)\/photo$/
  );
  const createContainerItemMatch = requestUrl.pathname.match(
    /^\/api\/containers\/(\d+)\/items$/
  );
  const containerDetailMatch = requestUrl.pathname.match(/^\/api\/containers\/(\d+)$/);
  const photoMatch = requestUrl.pathname.match(/^\/api\/photos\/(container|item)\/(\d+)$/);
  const moveItemMatch = requestUrl.pathname.match(/^\/api\/items\/(\d+)\/move$/);
  const itemPhotoMatch = requestUrl.pathname.match(/^\/api\/items\/(\d+)\/photo$/);
  const itemDetailMatch = requestUrl.pathname.match(/^\/api\/items\/(\d+)$/);

  if (request.method === "GET" && requestUrl.pathname === "/api/health") {
    sendJson(response, 200, {
      status: "ok",
      service: pkg && pkg.name ? pkg.name : "containers-app-backend",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/auth/login") {
    await handleAuthLogin(request, response);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/auth/logout") {
    handleAuthLogout(request, response);
    return;
  }

  if (
    request.method === "GET" &&
    requestUrl.pathname === "/api/auth/current-session"
  ) {
    handleCurrentSession(request, response);
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/search") {
    handleSearch(request, response, requestUrl);
    return;
  }

  if (
    request.method === "GET" &&
    requestUrl.pathname === "/api/recent-objects"
  ) {
    handleListRecentObjects(request, response);
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/qr/open") {
    handleOpenByQr(request, response, requestUrl);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/qr/link") {
    await handleLinkQr(request, response);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/qr/replace") {
    await handleReplaceQr(request, response);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/qr/remove") {
    await handleRemoveQr(request, response);
    return;
  }

  if (request.method === "GET" && photoMatch) {
    handleGetObjectPhoto(
      request,
      response,
      photoMatch[1],
      Number(photoMatch[2])
    );
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/containers") {
    await handleCreateTopLevelContainer(request, response);
    return;
  }

  if (
    request.method === "POST" &&
    createChildContainerMatch
  ) {
    await handleCreateChildContainer(
      request,
      response,
      Number(createChildContainerMatch[1])
    );
    return;
  }

  if (
    request.method === "POST" &&
    createContainerItemMatch
  ) {
    await handleCreateItemInContainer(
      request,
      response,
      Number(createContainerItemMatch[1])
    );
    return;
  }

  if (
    request.method === "POST" &&
    containerPhotoMatch
  ) {
    await handleStoreObjectPhoto(
      request,
      response,
      "container",
      Number(containerPhotoMatch[1])
    );
    return;
  }

  if (
    request.method === "DELETE" &&
    containerPhotoMatch
  ) {
    handleRemoveObjectPhoto(
      request,
      response,
      "container",
      Number(containerPhotoMatch[1])
    );
    return;
  }

  if (
    request.method === "GET" &&
    requestUrl.pathname === "/api/containers/options"
  ) {
    handleListParentContainerOptions(request, response);
    return;
  }

  if (
    request.method === "GET" &&
    requestUrl.pathname === "/api/containers/top-level"
  ) {
    handleListTopLevelContainers(request, response);
    return;
  }

  if (
    request.method === "GET" &&
    containerDetailMatch
  ) {
    handleGetContainerDetail(request, response, Number(containerDetailMatch[1]));
    return;
  }

  if (
    request.method === "PATCH" &&
    containerDetailMatch
  ) {
    await handleEditContainer(request, response, Number(containerDetailMatch[1]));
    return;
  }

  if (
    request.method === "POST" &&
    moveContainerMatch
  ) {
    await handleMoveContainer(request, response, Number(moveContainerMatch[1]));
    return;
  }

  if (
    request.method === "DELETE" &&
    containerDetailMatch
  ) {
    handleDeleteContainer(request, response, Number(containerDetailMatch[1]));
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/items") {
    await handleCreateTopLevelItem(request, response);
    return;
  }

  if (
    request.method === "POST" &&
    itemPhotoMatch
  ) {
    await handleStoreObjectPhoto(
      request,
      response,
      "item",
      Number(itemPhotoMatch[1])
    );
    return;
  }

  if (
    request.method === "DELETE" &&
    itemPhotoMatch
  ) {
    handleRemoveObjectPhoto(
      request,
      response,
      "item",
      Number(itemPhotoMatch[1])
    );
    return;
  }

  if (
    request.method === "GET" &&
    requestUrl.pathname === "/api/items/top-level"
  ) {
    handleListTopLevelItems(request, response);
    return;
  }

  if (
    request.method === "GET" &&
    itemDetailMatch
  ) {
    handleGetItemDetail(request, response, Number(itemDetailMatch[1]));
    return;
  }

  if (
    request.method === "PATCH" &&
    itemDetailMatch
  ) {
    await handleEditItem(request, response, Number(itemDetailMatch[1]));
    return;
  }

  if (
    request.method === "POST" &&
    moveItemMatch
  ) {
    await handleMoveItem(request, response, Number(moveItemMatch[1]));
    return;
  }

  if (
    request.method === "DELETE" &&
    itemDetailMatch
  ) {
    handleDeleteItem(request, response, Number(itemDetailMatch[1]));
    return;
  }

  if (requestUrl.pathname.startsWith("/api/")) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  if (request.method === "GET") {
    serveFrontend(response, getRawRequestPath(request.url));
    return;
  }

  sendJson(response, 404, { error: "Not found" });
}

ensureDirectory(path.dirname(config.databasePath));
ensureDirectory(config.photoPath);
initializeDatabase();
ensureBootstrapUser();

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    if (response.writableEnded) {
      return;
    }

    const statusCode = error.statusCode || 500;
    const message =
      statusCode === 500 ? "Internal server error" : error.message;

    sendJson(response, statusCode, {
      error: message
    });
  });
});

const { host, port } = getServerBinding(config.localServerAddress);

server.listen(port, host, () => {
  console.log(`Server listening on ${config.localServerAddress}`);
  console.log(`Database path: ${config.databasePath}`);
  console.log(`Photo path: ${config.photoPath}`);

  if (config.sessionSecret === "change-me-before-real-use") {
    console.log("Warning: SESSION_SECRET is using the default placeholder.");
  }
});
