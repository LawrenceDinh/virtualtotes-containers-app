const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { once } = require("events");
const { spawn } = require("child_process");
const net = require("net");
const test = require("node:test");
const Database = require("better-sqlite3");

const { hashPassword } = require("./auth");

function getCookieHeaderValue(setCookieHeader) {
  return String(setCookieHeader || "").split(";")[0];
}

function createJsonHeaders(cookie) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (cookie) {
    headers.Cookie = cookie;
  }

  return headers;
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(address.port);
      });
    });
  });
}

async function waitForServerReady(baseUrl, serverProcess, output, timeoutMs = 10000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (serverProcess.exitCode !== null) {
      throw new Error(
        `Server exited before becoming ready.\n${output.stdout}\n${output.stderr}`.trim()
      );
    }

    try {
      const response = await fetch(`${baseUrl}/api/health`);

      if (response.ok) {
        return;
      }
    } catch (error) {
      // Poll until the server is listening or the timeout expires.
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }

  throw new Error(
    `Server did not become ready within ${timeoutMs}ms.\n${output.stdout}\n${output.stderr}`.trim()
  );
}

async function startTestServer() {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "containers-app-http-")
  );
  return startTestServerWithPaths({
    databasePath: path.join(temporaryDirectory, "inventory.sqlite"),
    ownedDirectory: temporaryDirectory,
    photoPath: path.join(temporaryDirectory, "photos")
  });
}

async function startTestServerWithPaths({
  databasePath,
  ownedDirectory = null,
  photoPath
}) {
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const output = {
    stderr: "",
    stdout: ""
  };
  const serverProcess = spawn(process.execPath, ["src/server.js"], {
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env,
      BOOTSTRAP_PASSWORD: "testpass",
      BOOTSTRAP_USERNAME: "tester",
      DATABASE_PATH: databasePath,
      LOCAL_SERVER_ADDRESS: baseUrl,
      NODE_ENV: "test",
      PHOTO_PATH: photoPath,
      SESSION_SECRET: "integration-test-secret"
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  serverProcess.stdout.setEncoding("utf8");
  serverProcess.stderr.setEncoding("utf8");
  serverProcess.stdout.on("data", (chunk) => {
    output.stdout += chunk;
  });
  serverProcess.stderr.on("data", (chunk) => {
    output.stderr += chunk;
  });

  try {
    await waitForServerReady(baseUrl, serverProcess, output);

    return {
      baseUrl,
      databasePath,
      cleanup: async () => {
        if (serverProcess.exitCode === null) {
          serverProcess.kill("SIGTERM");
          await once(serverProcess, "exit");
        }

        if (ownedDirectory) {
          fs.rmSync(ownedDirectory, {
            force: true,
            recursive: true
          });
        }
      },
      output
    };
  } catch (error) {
    if (serverProcess.exitCode === null) {
      serverProcess.kill("SIGTERM");
      await once(serverProcess, "exit");
    }

    if (ownedDirectory) {
      fs.rmSync(ownedDirectory, {
        force: true,
        recursive: true
      });
    }
    throw error;
  }
}

function seedUser(databasePath, { password, username }) {
  const database = new Database(databasePath);

  try {
    const result = database
      .prepare("INSERT INTO users (username, passwordHash) VALUES (?, ?)")
      .run(username, hashPassword(password));

    return result.lastInsertRowid;
  } finally {
    database.close();
  }
}

async function runNodeScript(scriptPath, envOverrides = {}) {
  const output = {
    stderr: "",
    stdout: ""
  };
  const scriptProcess = spawn(process.execPath, [scriptPath], {
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env,
      ...envOverrides
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  scriptProcess.stdout.setEncoding("utf8");
  scriptProcess.stderr.setEncoding("utf8");
  scriptProcess.stdout.on("data", (chunk) => {
    output.stdout += chunk;
  });
  scriptProcess.stderr.on("data", (chunk) => {
    output.stderr += chunk;
  });

  const [exitCode] = await once(scriptProcess, "exit");

  if (exitCode !== 0) {
    throw new Error(
      `Script ${scriptPath} failed with exit code ${exitCode}.\n${output.stdout}\n${output.stderr}`.trim()
    );
  }

  return output;
}

async function requestJson(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const body = await response.json().catch(() => null);

  return {
    body,
    response
  };
}

async function requestBuffer(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const body = Buffer.from(await response.arrayBuffer());

  return {
    body,
    response
  };
}

async function requestRawGet(baseUrl, pathname) {
  const { hostname, port } = new URL(baseUrl);

  return new Promise((resolve, reject) => {
    const socket = net.createConnection(
      {
        host: hostname,
        port: Number(port)
      },
      () => {
        socket.write(
          `GET ${pathname} HTTP/1.1\r\nHost: ${hostname}\r\nConnection: close\r\n\r\n`
        );
      }
    );
    let responseText = "";

    socket.setEncoding("utf8");
    socket.on("data", (chunk) => {
      responseText += chunk;
    });
    socket.on("end", () => {
      const [rawHeaders = "", body = ""] = responseText.split("\r\n\r\n");
      const headerLines = rawHeaders.split("\r\n");
      const statusLine = headerLines.shift() || "";
      const statusMatch = statusLine.match(/^HTTP\/1\.1 (\d{3})/);
      const headers = new Map();

      for (const line of headerLines) {
        const separatorIndex = line.indexOf(":");

        if (separatorIndex === -1) {
          continue;
        }

        const headerName = line.slice(0, separatorIndex).trim().toLowerCase();
        const headerValue = line.slice(separatorIndex + 1).trim();
        headers.set(headerName, headerValue);
      }

      resolve({
        body,
        headers,
        status: statusMatch ? Number(statusMatch[1]) : 0
      });
    });
    socket.on("error", reject);
  });
}

async function loginAndGetSessionCookie(baseUrl) {
  const loginResult = await requestJson(baseUrl, "/api/auth/login", {
    body: JSON.stringify({
      password: "testpass",
      username: "tester"
    }),
    headers: createJsonHeaders(),
    method: "POST"
  });
  const sessionCookie = getCookieHeaderValue(
    loginResult.response.headers.get("set-cookie")
  );

  assert.equal(loginResult.response.status, 200);
  assert.equal(loginResult.body.user.username, "tester");
  assert.match(sessionCookie, /^[^=]+=.+/);

  return sessionCookie;
}

test("HTTP integration covers auth and the core top-level container/item happy path", async () => {
  const server = await startTestServer();

  try {
    const unauthenticatedTopLevel = await requestJson(
      server.baseUrl,
      "/api/containers/top-level"
    );

    assert.equal(unauthenticatedTopLevel.response.status, 401);
    assert.equal(
      unauthenticatedTopLevel.body.error,
      "Authentication required"
    );

    const sessionCookie = await loginAndGetSessionCookie(server.baseUrl);

    const currentSession = await requestJson(
      server.baseUrl,
      "/api/auth/current-session",
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(currentSession.response.status, 200);
    assert.equal(currentSession.body.user.username, "tester");

    const createContainer = await requestJson(server.baseUrl, "/api/containers", {
      body: JSON.stringify({
        name: "Garage Tote"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });
    const containerId = createContainer.body.container.id;

    assert.equal(createContainer.response.status, 201);
    assert.equal(createContainer.body.container.name, "Garage Tote");
    assert.equal(createContainer.body.container.parentContainerId, null);

    const createItem = await requestJson(server.baseUrl, "/api/items", {
      body: JSON.stringify({
        name: "Packing Tape"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });
    const itemId = createItem.body.item.id;

    assert.equal(createItem.response.status, 201);
    assert.equal(createItem.body.item.name, "Packing Tape");
    assert.equal(createItem.body.item.parentContainerId, null);

    const containerDetail = await requestJson(
      server.baseUrl,
      `/api/containers/${containerId}`,
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(containerDetail.response.status, 200);
    assert.equal(containerDetail.body.container.id, containerId);
    assert.equal(containerDetail.body.container.name, "Garage Tote");
    assert.equal(containerDetail.body.fullPath, "Garage Tote");
    assert.equal(containerDetail.body.itemCount, 0);
    assert.equal(containerDetail.body.subcontainerCount, 0);

    const itemDetail = await requestJson(
      server.baseUrl,
      `/api/items/${itemId}`,
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(itemDetail.response.status, 200);
    assert.equal(itemDetail.body.item.id, itemId);
    assert.equal(itemDetail.body.item.name, "Packing Tape");
    assert.equal(itemDetail.body.topLevel, true);
    assert.equal(itemDetail.body.fullPath, "Packing Tape");
    assert.equal(itemDetail.body.currentParentContainer, null);

    const logoutResult = await requestJson(server.baseUrl, "/api/auth/logout", {
      headers: {
        Cookie: sessionCookie
      },
      method: "POST"
    });

    assert.equal(logoutResult.response.status, 200);
    assert.equal(logoutResult.body.success, true);

    const loggedOutSession = await requestJson(
      server.baseUrl,
      "/api/auth/current-session",
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(loggedOutSession.response.status, 401);
    assert.equal(loggedOutSession.body.error, "Authentication required");
  } finally {
    await server.cleanup();
  }
});

test("HTTP integration returns authenticated inventory overview with owned paths", async () => {
  const server = await startTestServer();

  try {
    const unauthenticatedOverview = await requestJson(
      server.baseUrl,
      "/api/inventory-overview"
    );

    assert.equal(unauthenticatedOverview.response.status, 401);
    assert.equal(
      unauthenticatedOverview.body.error,
      "Authentication required"
    );

    const sessionCookie = await loginAndGetSessionCookie(server.baseUrl);

    const createContainer = await requestJson(server.baseUrl, "/api/containers", {
      body: JSON.stringify({
        name: "Garage Tote"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });
    const parentContainerId = createContainer.body.container.id;

    const createChildContainer = await requestJson(
      server.baseUrl,
      `/api/containers/${parentContainerId}/children`,
      {
        body: JSON.stringify({
          name: "Inner Bin"
        }),
        headers: createJsonHeaders(sessionCookie),
        method: "POST"
      }
    );
    const childContainerId = createChildContainer.body.container.id;

    const createTopLevelItem = await requestJson(server.baseUrl, "/api/items", {
      body: JSON.stringify({
        name: "Loose Batteries"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });
    const topLevelItemId = createTopLevelItem.body.item.id;

    const createNestedItem = await requestJson(
      server.baseUrl,
      `/api/containers/${childContainerId}/items`,
      {
        body: JSON.stringify({
          name: "Screwdriver"
        }),
        headers: createJsonHeaders(sessionCookie),
        method: "POST"
      }
    );
    const nestedItemId = createNestedItem.body.item.id;

    const otherUserId = seedUser(server.databasePath, {
      password: "otherpass",
      username: "other"
    });
    const database = new Database(server.databasePath);

    try {
      database
        .prepare("INSERT INTO containers (userId, name) VALUES (?, ?)")
        .run(otherUserId, "Other Tote");
      database
        .prepare("INSERT INTO items (userId, name) VALUES (?, ?)")
        .run(otherUserId, "Other Item");
    } finally {
      database.close();
    }

    const overview = await requestJson(server.baseUrl, "/api/inventory-overview", {
      headers: {
        Cookie: sessionCookie
      }
    });

    assert.equal(overview.response.status, 200);
    assert.deepEqual(overview.body.counts, {
      containers: 2,
      items: 2
    });
    assert.deepEqual(
      overview.body.containers.map((container) => container.name),
      ["Garage Tote", "Inner Bin"]
    );
    assert.deepEqual(
      overview.body.items.map((item) => item.name),
      ["Loose Batteries", "Screwdriver"]
    );

    const parentContainer = overview.body.containers.find(
      (container) => container.id === parentContainerId
    );
    const childContainer = overview.body.containers.find(
      (container) => container.id === childContainerId
    );
    const topLevelItem = overview.body.items.find(
      (item) => item.id === topLevelItemId
    );
    const nestedItem = overview.body.items.find((item) => item.id === nestedItemId);

    assert.equal(parentContainer.topLevel, true);
    assert.equal(parentContainer.fullPath, "Garage Tote");
    assert.equal(childContainer.topLevel, false);
    assert.equal(childContainer.fullPath, "Inner Bin > Garage Tote");
    assert.equal(topLevelItem.topLevel, true);
    assert.equal(topLevelItem.fullPath, "Loose Batteries");
    assert.equal(nestedItem.topLevel, false);
    assert.equal(nestedItem.fullPath, "Screwdriver > Inner Bin > Garage Tote");
    assert.deepEqual(
      overview.body.relationshipPaths.map((relationshipPath) => relationshipPath.path),
      [
        "Top Level > Garage Tote",
        "Top Level > Inner Bin > Garage Tote",
        "Top Level > Loose Batteries",
        "Top Level > Screwdriver > Inner Bin > Garage Tote"
      ]
    );
    assert.equal(
      overview.body.containers.some((container) => container.name === "Other Tote"),
      false
    );
    assert.equal(
      overview.body.items.some((item) => item.name === "Other Item"),
      false
    );
  } finally {
    await server.cleanup();
  }
});

test("HTTP integration deletes non-empty containers by promoting direct children", async () => {
  const server = await startTestServer();

  try {
    const sessionCookie = await loginAndGetSessionCookie(server.baseUrl);
    const createParent = await requestJson(server.baseUrl, "/api/containers", {
      body: JSON.stringify({
        name: "Container Parent"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });
    const parentId = createParent.body.container.id;
    const createContainerA = await requestJson(
      server.baseUrl,
      `/api/containers/${parentId}/children`,
      {
        body: JSON.stringify({
          name: "Container A"
        }),
        headers: createJsonHeaders(sessionCookie),
        method: "POST"
      }
    );
    const containerAId = createContainerA.body.container.id;
    const createContainerB = await requestJson(
      server.baseUrl,
      `/api/containers/${containerAId}/children`,
      {
        body: JSON.stringify({
          name: "Container B",
          qrCode: "qr-container-b"
        }),
        headers: createJsonHeaders(sessionCookie),
        method: "POST"
      }
    );
    const containerBId = createContainerB.body.container.id;
    const createContainerC = await requestJson(
      server.baseUrl,
      `/api/containers/${containerBId}/children`,
      {
        body: JSON.stringify({
          name: "Nested Grandchild Container"
        }),
        headers: createJsonHeaders(sessionCookie),
        method: "POST"
      }
    );
    const containerCId = createContainerC.body.container.id;
    const createItem1 = await requestJson(
      server.baseUrl,
      `/api/containers/${containerAId}/items`,
      {
        body: JSON.stringify({
          name: "Item 1",
          qrCode: "qr-item-1"
        }),
        headers: createJsonHeaders(sessionCookie),
        method: "POST"
      }
    );
    const item1Id = createItem1.body.item.id;
    const createItem2 = await requestJson(
      server.baseUrl,
      `/api/containers/${containerBId}/items`,
      {
        body: JSON.stringify({
          name: "Item 2"
        }),
        headers: createJsonHeaders(sessionCookie),
        method: "POST"
      }
    );
    const item2Id = createItem2.body.item.id;
    const itemPhotoUpload = await requestJson(
      server.baseUrl,
      `/api/items/${item1Id}/photo`,
      {
        body: Buffer.from("item-one-photo"),
        headers: {
          "Content-Type": "image/png",
          Cookie: sessionCookie
        },
        method: "POST"
      }
    );

    assert.equal(itemPhotoUpload.response.status, 200);

    const deleteContainerA = await requestJson(
      server.baseUrl,
      `/api/containers/${containerAId}`,
      {
        headers: {
          Cookie: sessionCookie
        },
        method: "DELETE"
      }
    );

    assert.equal(deleteContainerA.response.status, 200);
    assert.deepEqual(deleteContainerA.body, {
      success: true
    });

    const deletedContainer = await requestJson(
      server.baseUrl,
      `/api/containers/${containerAId}`,
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(deletedContainer.response.status, 404);

    const parentDetail = await requestJson(
      server.baseUrl,
      `/api/containers/${parentId}`,
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(parentDetail.response.status, 200);
    assert.deepEqual(
      parentDetail.body.childContainers.map((container) => container.id),
      [containerBId]
    );
    assert.deepEqual(
      parentDetail.body.childItems.map((item) => item.id),
      [item1Id]
    );
    assert.equal(parentDetail.body.childContainers[0].qrCode, "qr-container-b");
    assert.equal(parentDetail.body.childItems[0].qrCode, "qr-item-1");
    assert.equal(
      parentDetail.body.childItems[0].photoPath,
      itemPhotoUpload.body.item.photoPath
    );

    const promotedContainerDetail = await requestJson(
      server.baseUrl,
      `/api/containers/${containerBId}`,
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(promotedContainerDetail.response.status, 200);
    assert.equal(promotedContainerDetail.body.container.parentContainerId, parentId);
    assert.deepEqual(
      promotedContainerDetail.body.childContainers.map((container) => container.id),
      [containerCId]
    );
    assert.deepEqual(
      promotedContainerDetail.body.childItems.map((item) => item.id),
      [item2Id]
    );

    const item2Detail = await requestJson(server.baseUrl, `/api/items/${item2Id}`, {
      headers: {
        Cookie: sessionCookie
      }
    });

    assert.equal(item2Detail.response.status, 200);
    assert.equal(item2Detail.body.item.parentContainerId, containerBId);
  } finally {
    await server.cleanup();
  }
});

test("HTTP integration treats foreign objects as not found across read, parent, qr, and photo paths", async () => {
  const server = await startTestServer();

  try {
    const ownerCookie = await loginAndGetSessionCookie(server.baseUrl);
    const ownerContainer = await requestJson(server.baseUrl, "/api/containers", {
      body: JSON.stringify({
        name: "Garage Tote"
      }),
      headers: createJsonHeaders(ownerCookie),
      method: "POST"
    });
    const ownerContainerId = ownerContainer.body.container.id;

    const ownerItem = await requestJson(server.baseUrl, "/api/items", {
      body: JSON.stringify({
        name: "Packing Tape"
      }),
      headers: createJsonHeaders(ownerCookie),
      method: "POST"
    });
    const ownerItemId = ownerItem.body.item.id;

    const uploadedPhoto = await requestJson(
      server.baseUrl,
      `/api/containers/${ownerContainerId}/photo`,
      {
        body: Buffer.from("owner-photo"),
        headers: {
          "Content-Type": "image/png",
          Cookie: ownerCookie
        },
        method: "POST"
      }
    );

    assert.equal(uploadedPhoto.response.status, 200);

    seedUser(server.databasePath, {
      password: "otherpass",
      username: "other-user"
    });

    const otherLogin = await requestJson(server.baseUrl, "/api/auth/login", {
      body: JSON.stringify({
        password: "otherpass",
        username: "other-user"
      }),
      headers: createJsonHeaders(),
      method: "POST"
    });
    const otherCookie = getCookieHeaderValue(
      otherLogin.response.headers.get("set-cookie")
    );

    assert.equal(otherLogin.response.status, 200);

    const foreignContainerDetail = await requestJson(
      server.baseUrl,
      `/api/containers/${ownerContainerId}`,
      {
        headers: {
          Cookie: otherCookie
        }
      }
    );

    assert.equal(foreignContainerDetail.response.status, 404);
    assert.deepEqual(foreignContainerDetail.body, {
      error: "Container not found"
    });

    const foreignItemDetail = await requestJson(
      server.baseUrl,
      `/api/items/${ownerItemId}`,
      {
        headers: {
          Cookie: otherCookie
        }
      }
    );

    assert.equal(foreignItemDetail.response.status, 404);
    assert.deepEqual(foreignItemDetail.body, {
      error: "Item not found"
    });

    const foreignParentAssignment = await requestJson(
      server.baseUrl,
      `/api/containers/${ownerContainerId}/items`,
      {
        body: JSON.stringify({
          name: "Should Not See Parent"
        }),
        headers: createJsonHeaders(otherCookie),
        method: "POST"
      }
    );

    assert.equal(foreignParentAssignment.response.status, 404);
    assert.deepEqual(foreignParentAssignment.body, {
      error: "Parent container not found"
    });

    const foreignQrMutation = await requestJson(server.baseUrl, "/api/qr/link", {
      body: JSON.stringify({
        objectId: ownerItemId,
        objectType: "item",
        qrCode: "qr-foreign-attempt"
      }),
      headers: createJsonHeaders(otherCookie),
      method: "POST"
    });

    assert.equal(foreignQrMutation.response.status, 404);
    assert.deepEqual(foreignQrMutation.body, {
      error: "Item not found"
    });

    const foreignPhotoFetch = await requestJson(
      server.baseUrl,
      `/api/photos/container/${ownerContainerId}`,
      {
        headers: {
          Cookie: otherCookie
        }
      }
    );

    assert.equal(foreignPhotoFetch.response.status, 404);
    assert.deepEqual(foreignPhotoFetch.body, {
      error: "Container not found"
    });
  } finally {
    await server.cleanup();
  }
});

test("HTTP integration blocks frontend traversal attempts and preserves valid file and SPA serving", async () => {
  const server = await startTestServer();

  try {
    const traversalAttempt = await requestRawGet(
      server.baseUrl,
      "/../frontend-secrets/secret.txt"
    );

    assert.equal(traversalAttempt.status, 404);
    assert.equal(
      traversalAttempt.headers.get("content-type"),
      "application/json; charset=utf-8"
    );
    assert.deepEqual(JSON.parse(traversalAttempt.body), {
      error: "Not found"
    });

    const styleFile = await requestBuffer(server.baseUrl, "/style.css");

    assert.equal(styleFile.response.status, 200);
    assert.equal(
      styleFile.response.headers.get("content-type"),
      "text/css; charset=utf-8"
    );
    assert.match(styleFile.body.toString("utf8"), /:root\s*\{/);

    const spaFallback = await requestBuffer(server.baseUrl, "/containers/123");

    assert.equal(spaFallback.response.status, 200);
    assert.equal(
      spaFallback.response.headers.get("content-type"),
      "text/html; charset=utf-8"
    );
    assert.match(spaFallback.body.toString("utf8"), /Personal Inventory App/);
  } finally {
    await server.cleanup();
  }
});

test("HTTP integration covers QR open, link, replace, remove, and duplicate rejection", async () => {
  const server = await startTestServer();

  try {
    const sessionCookie = await loginAndGetSessionCookie(server.baseUrl);

    const createContainer = await requestJson(server.baseUrl, "/api/containers", {
      body: JSON.stringify({
        name: "Garage Tote",
        qrCode: "qr-garage-tote"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });
    const containerId = createContainer.body.container.id;

    assert.equal(createContainer.response.status, 201);
    assert.deepEqual(createContainer.body, {
      container: {
        createdAt: createContainer.body.container.createdAt,
        id: containerId,
        name: "Garage Tote",
        parentContainerId: null,
        photoPath: null,
        qrCode: "qr-garage-tote",
        updatedAt: createContainer.body.container.updatedAt,
        userId: createContainer.body.container.userId
      }
    });
    assert.equal(createContainer.body.container.userId, 1);

    const createNestedItem = await requestJson(
      server.baseUrl,
      `/api/containers/${containerId}/items`,
      {
        body: JSON.stringify({
          name: "Packing Tape",
          qrCode: "qr-packing-tape"
        }),
        headers: createJsonHeaders(sessionCookie),
        method: "POST"
      }
    );
    const nestedItemId = createNestedItem.body.item.id;

    assert.equal(createNestedItem.response.status, 201);
    assert.equal(createNestedItem.body.item.qrCode, "qr-packing-tape");
    assert.equal(createNestedItem.body.item.parentContainerId, containerId);

    const createTopLevelItem = await requestJson(server.baseUrl, "/api/items", {
      body: JSON.stringify({
        name: "Label Maker"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });
    const topLevelItemId = createTopLevelItem.body.item.id;

    assert.equal(createTopLevelItem.response.status, 201);
    assert.equal(createTopLevelItem.body.item.qrCode, null);
    assert.equal(createTopLevelItem.body.item.parentContainerId, null);

    const openContainerQr = await requestJson(
      server.baseUrl,
      "/api/qr/open?code=qr-garage-tote",
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(openContainerQr.response.status, 200);
    assert.deepEqual(openContainerQr.body, {
      matchType: "container",
      objectId: containerId,
      objectType: "container"
    });

    const openItemQr = await requestJson(
      server.baseUrl,
      "/api/qr/open?code=qr-packing-tape",
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(openItemQr.response.status, 200);
    assert.deepEqual(openItemQr.body, {
      matchType: "item",
      objectId: nestedItemId,
      objectType: "item"
    });

    const openUnknownQr = await requestJson(
      server.baseUrl,
      "/api/qr/open?code=qr-unknown",
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(openUnknownQr.response.status, 200);
    assert.deepEqual(openUnknownQr.body, {
      matchType: "nothing",
      objectId: null,
      objectType: null
    });

    const linkQr = await requestJson(server.baseUrl, "/api/qr/link", {
      body: JSON.stringify({
        objectId: topLevelItemId,
        objectType: "item",
        qrCode: "qr-label-maker"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });

    assert.equal(linkQr.response.status, 200);
    assert.equal(linkQr.body.item.id, topLevelItemId);
    assert.equal(linkQr.body.item.qrCode, "qr-label-maker");
    assert.equal(linkQr.body.item.parentContainerId, null);

    const duplicateQr = await requestJson(server.baseUrl, "/api/qr/link", {
      body: JSON.stringify({
        objectId: topLevelItemId,
        objectType: "item",
        qrCode: "qr-garage-tote"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });

    assert.equal(duplicateQr.response.status, 409);
    assert.deepEqual(duplicateQr.body, {
      error: "Object already has a QR code. Use replace QR."
    });

    const replaceQr = await requestJson(server.baseUrl, "/api/qr/replace", {
      body: JSON.stringify({
        objectId: topLevelItemId,
        objectType: "item",
        qrCode: "qr-label-maker-v2"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });

    assert.equal(replaceQr.response.status, 200);
    assert.equal(replaceQr.body.item.id, topLevelItemId);
    assert.equal(replaceQr.body.item.qrCode, "qr-label-maker-v2");

    const duplicateReplacement = await requestJson(
      server.baseUrl,
      "/api/qr/replace",
      {
        body: JSON.stringify({
          objectId: topLevelItemId,
          objectType: "item",
          qrCode: "qr-packing-tape"
        }),
        headers: createJsonHeaders(sessionCookie),
        method: "POST"
      }
    );

    assert.equal(duplicateReplacement.response.status, 409);
    assert.deepEqual(duplicateReplacement.body, {
      error: "QR code is already linked to another object"
    });

    const removeQr = await requestJson(server.baseUrl, "/api/qr/remove", {
      body: JSON.stringify({
        objectId: topLevelItemId,
        objectType: "item"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });

    assert.equal(removeQr.response.status, 200);
    assert.equal(removeQr.body.item.id, topLevelItemId);
    assert.equal(removeQr.body.item.qrCode, null);

    const openRemovedQr = await requestJson(
      server.baseUrl,
      "/api/qr/open?code=qr-label-maker-v2",
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(openRemovedQr.response.status, 200);
    assert.deepEqual(openRemovedQr.body, {
      matchType: "nothing",
      objectId: null,
      objectType: null
    });
  } finally {
    await server.cleanup();
  }
});

test("HTTP integration covers unknown QR lookup, create-with-QR flows, link-to-existing, and duplicate conflicts", async () => {
  const server = await startTestServer();

  try {
    const sessionCookie = await loginAndGetSessionCookie(server.baseUrl);

    const openUnknownQr = await requestJson(
      server.baseUrl,
      "/api/qr/open?code=qr-unknown-container",
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(openUnknownQr.response.status, 200);
    assert.deepEqual(openUnknownQr.body, {
      matchType: "nothing",
      objectId: null,
      objectType: null
    });

    const createContainerWithScannedQr = await requestJson(
      server.baseUrl,
      "/api/containers",
      {
        body: JSON.stringify({
          name: "Garage Tote",
          qrCode: "qr-unknown-container"
        }),
        headers: createJsonHeaders(sessionCookie),
        method: "POST"
      }
    );
    const createdContainerId = createContainerWithScannedQr.body.container.id;

    assert.equal(createContainerWithScannedQr.response.status, 201);
    assert.equal(
      createContainerWithScannedQr.body.container.qrCode,
      "qr-unknown-container"
    );

    const openCreatedContainerQr = await requestJson(
      server.baseUrl,
      "/api/qr/open?code=qr-unknown-container",
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(openCreatedContainerQr.response.status, 200);
    assert.deepEqual(openCreatedContainerQr.body, {
      matchType: "container",
      objectId: createdContainerId,
      objectType: "container"
    });

    const createItemWithScannedQr = await requestJson(server.baseUrl, "/api/items", {
      body: JSON.stringify({
        name: "Packing Tape",
        qrCode: "qr-unknown-item"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });
    const createdItemId = createItemWithScannedQr.body.item.id;

    assert.equal(createItemWithScannedQr.response.status, 201);
    assert.equal(createItemWithScannedQr.body.item.qrCode, "qr-unknown-item");

    const openCreatedItemQr = await requestJson(
      server.baseUrl,
      "/api/qr/open?code=qr-unknown-item",
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(openCreatedItemQr.response.status, 200);
    assert.deepEqual(openCreatedItemQr.body, {
      matchType: "item",
      objectId: createdItemId,
      objectType: "item"
    });

    const createExistingObject = await requestJson(server.baseUrl, "/api/items", {
      body: JSON.stringify({
        name: "Label Maker"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });
    const existingItemId = createExistingObject.body.item.id;

    assert.equal(createExistingObject.response.status, 201);
    assert.equal(createExistingObject.body.item.qrCode, null);

    const openUnknownLinkQr = await requestJson(
      server.baseUrl,
      "/api/qr/open?code=qr-link-existing",
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(openUnknownLinkQr.response.status, 200);
    assert.deepEqual(openUnknownLinkQr.body, {
      matchType: "nothing",
      objectId: null,
      objectType: null
    });

    const linkUnknownQrToExistingObject = await requestJson(
      server.baseUrl,
      "/api/qr/link",
      {
        body: JSON.stringify({
          objectId: existingItemId,
          objectType: "item",
          qrCode: "qr-link-existing"
        }),
        headers: createJsonHeaders(sessionCookie),
        method: "POST"
      }
    );

    assert.equal(linkUnknownQrToExistingObject.response.status, 200);
    assert.equal(linkUnknownQrToExistingObject.body.item.id, existingItemId);
    assert.equal(
      linkUnknownQrToExistingObject.body.item.qrCode,
      "qr-link-existing"
    );

    const openLinkedUnknownQr = await requestJson(
      server.baseUrl,
      "/api/qr/open?code=qr-link-existing",
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(openLinkedUnknownQr.response.status, 200);
    assert.deepEqual(openLinkedUnknownQr.body, {
      matchType: "item",
      objectId: existingItemId,
      objectType: "item"
    });

    const duplicateQrConflict = await requestJson(server.baseUrl, "/api/items", {
      body: JSON.stringify({
        name: "Duplicate Attempt",
        qrCode: "qr-link-existing"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });

    assert.equal(duplicateQrConflict.response.status, 409);
    assert.deepEqual(duplicateQrConflict.body, {
      error: "QR code is already linked to another object"
    });
  } finally {
    await server.cleanup();
  }
});

test("HTTP integration covers photo upload, private serving, replacement, removal, and unauthorized access", async () => {
  const server = await startTestServer();

  try {
    const sessionCookie = await loginAndGetSessionCookie(server.baseUrl);
    const createItem = await requestJson(server.baseUrl, "/api/items", {
      body: JSON.stringify({
        name: "Packing Tape"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });
    const itemId = createItem.body.item.id;

    const unauthorizedPhotoFetch = await requestJson(
      server.baseUrl,
      `/api/photos/item/${itemId}`
    );

    assert.equal(unauthorizedPhotoFetch.response.status, 401);
    assert.deepEqual(unauthorizedPhotoFetch.body, {
      error: "Authentication required"
    });

    const firstPhotoBytes = Buffer.from("first-photo-png");
    const firstUpload = await requestJson(
      server.baseUrl,
      `/api/items/${itemId}/photo`,
      {
        body: firstPhotoBytes,
        headers: {
          "Content-Type": "image/png",
          Cookie: sessionCookie
        },
        method: "POST"
      }
    );
    const firstPhotoPath = firstUpload.body.item.photoPath;

    assert.equal(firstUpload.response.status, 200);
    assert.equal(firstUpload.body.item.id, itemId);
    assert.equal(firstUpload.body.item.photoPath, firstPhotoPath);
    assert.match(firstPhotoPath, /^item-\d+-.*\.png$/);

    const firstFetch = await requestBuffer(
      server.baseUrl,
      `/api/photos/item/${itemId}`,
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(firstFetch.response.status, 200);
    assert.equal(firstFetch.response.headers.get("content-type"), "image/png");
    assert.equal(
      firstFetch.response.headers.get("cache-control"),
      "private, max-age=0, must-revalidate"
    );
    assert.deepEqual(firstFetch.body, firstPhotoBytes);

    const replacementPhotoBytes = Buffer.from("replacement-photo-jpeg");
    const replaceUpload = await requestJson(
      server.baseUrl,
      `/api/items/${itemId}/photo`,
      {
        body: replacementPhotoBytes,
        headers: {
          "Content-Type": "image/jpeg",
          Cookie: sessionCookie
        },
        method: "POST"
      }
    );
    const replacementPhotoPath = replaceUpload.body.item.photoPath;

    assert.equal(replaceUpload.response.status, 200);
    assert.equal(replaceUpload.body.item.id, itemId);
    assert.notEqual(replacementPhotoPath, firstPhotoPath);
    assert.match(replacementPhotoPath, /^item-\d+-.*\.jpg$/);

    const replacementFetch = await requestBuffer(
      server.baseUrl,
      `/api/photos/item/${itemId}`,
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(replacementFetch.response.status, 200);
    assert.equal(
      replacementFetch.response.headers.get("content-type"),
      "image/jpeg"
    );
    assert.deepEqual(replacementFetch.body, replacementPhotoBytes);

    const removePhoto = await requestJson(
      server.baseUrl,
      `/api/items/${itemId}/photo`,
      {
        headers: {
          Cookie: sessionCookie
        },
        method: "DELETE"
      }
    );

    assert.equal(removePhoto.response.status, 200);
    assert.equal(removePhoto.body.item.id, itemId);
    assert.equal(removePhoto.body.item.photoPath, null);

    const removedPhotoFetch = await requestJson(
      server.baseUrl,
      `/api/photos/item/${itemId}`,
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(removedPhotoFetch.response.status, 404);
    assert.deepEqual(removedPhotoFetch.body, {
      error: "Photo not found"
    });

    const logoutResult = await requestJson(server.baseUrl, "/api/auth/logout", {
      headers: {
        Cookie: sessionCookie
      },
      method: "POST"
    });

    assert.equal(logoutResult.response.status, 200);
    assert.equal(logoutResult.body.success, true);

    const unauthorizedAfterLogout = await requestJson(
      server.baseUrl,
      `/api/photos/item/${itemId}`,
      {
        headers: {
          Cookie: sessionCookie
        }
      }
    );

    assert.equal(unauthorizedAfterLogout.response.status, 401);
    assert.deepEqual(unauthorizedAfterLogout.body, {
      error: "Authentication required"
    });
  } finally {
    await server.cleanup();
  }
});

test("HTTP integration includes object photos in recent objects", async () => {
  const server = await startTestServer();

  try {
    const sessionCookie = await loginAndGetSessionCookie(server.baseUrl);
    const createContainer = await requestJson(server.baseUrl, "/api/containers", {
      body: JSON.stringify({
        name: "Garage Tote"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });
    const createItem = await requestJson(server.baseUrl, "/api/items", {
      body: JSON.stringify({
        name: "Packing Tape"
      }),
      headers: createJsonHeaders(sessionCookie),
      method: "POST"
    });
    const containerId = createContainer.body.container.id;
    const itemId = createItem.body.item.id;

    const containerUpload = await requestJson(
      server.baseUrl,
      `/api/containers/${containerId}/photo`,
      {
        body: Buffer.from("container-photo"),
        headers: {
          "Content-Type": "image/jpeg",
          Cookie: sessionCookie
        },
        method: "POST"
      }
    );
    const itemUpload = await requestJson(
      server.baseUrl,
      `/api/items/${itemId}/photo`,
      {
        body: Buffer.from("item-photo"),
        headers: {
          "Content-Type": "image/png",
          Cookie: sessionCookie
        },
        method: "POST"
      }
    );

    assert.equal(containerUpload.response.status, 200);
    assert.equal(itemUpload.response.status, 200);

    await requestJson(server.baseUrl, `/api/containers/${containerId}`, {
      headers: {
        Cookie: sessionCookie
      }
    });
    await requestJson(server.baseUrl, `/api/items/${itemId}`, {
      headers: {
        Cookie: sessionCookie
      }
    });

    const recentObjects = await requestJson(server.baseUrl, "/api/recent-objects", {
      headers: {
        Cookie: sessionCookie
      }
    });

    assert.equal(recentObjects.response.status, 200);

    const recentContainer = recentObjects.body.recentObjects.find(
      (recentObject) =>
        recentObject.objectType === "container" &&
        recentObject.objectId === containerId
    );
    const recentItem = recentObjects.body.recentObjects.find(
      (recentObject) =>
        recentObject.objectType === "item" && recentObject.objectId === itemId
    );

    assert.equal(recentContainer.photoPath, containerUpload.body.container.photoPath);
    assert.equal(
      recentContainer.photoUrl,
      `/api/photos/container/${containerId}?v=${encodeURIComponent(containerUpload.body.container.photoPath)}`
    );
    assert.equal(recentItem.photoPath, itemUpload.body.item.photoPath);
    assert.equal(
      recentItem.photoUrl,
      `/api/photos/item/${itemId}?v=${encodeURIComponent(itemUpload.body.item.photoPath)}`
    );
  } finally {
    await server.cleanup();
  }
});

test("HTTP integration covers restore flow and restart verification for login, objects, QR, and photos", async () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "containers-app-restore-")
  );
  const originalDatabasePath = path.join(temporaryDirectory, "original.sqlite");
  const originalPhotoPath = path.join(temporaryDirectory, "original-photos");
  const backupRootPath = path.join(temporaryDirectory, "backups");
  const restoredDatabasePath = path.join(temporaryDirectory, "restored.sqlite");
  const restoredPhotoPath = path.join(temporaryDirectory, "restored-photos");
  let originalServer = null;
  let restoredServer = null;

  try {
    originalServer = await startTestServerWithPaths({
      databasePath: originalDatabasePath,
      photoPath: originalPhotoPath
    });

    const sessionCookie = await loginAndGetSessionCookie(originalServer.baseUrl);
    const createContainer = await requestJson(
      originalServer.baseUrl,
      "/api/containers",
      {
        body: JSON.stringify({
          name: "Garage Tote",
          qrCode: "qr-garage-tote"
        }),
        headers: createJsonHeaders(sessionCookie),
        method: "POST"
      }
    );
    const containerId = createContainer.body.container.id;

    assert.equal(createContainer.response.status, 201);

    const createItem = await requestJson(
      originalServer.baseUrl,
      `/api/containers/${containerId}/items`,
      {
        body: JSON.stringify({
          name: "Packing Tape",
          qrCode: "qr-packing-tape"
        }),
        headers: createJsonHeaders(sessionCookie),
        method: "POST"
      }
    );
    const itemId = createItem.body.item.id;

    assert.equal(createItem.response.status, 201);

    const photoBytes = Buffer.from("persisted-photo-png");
    const uploadPhoto = await requestJson(
      originalServer.baseUrl,
      `/api/items/${itemId}/photo`,
      {
        body: photoBytes,
        headers: {
          "Content-Type": "image/png",
          Cookie: sessionCookie
        },
        method: "POST"
      }
    );

    assert.equal(uploadPhoto.response.status, 200);
    assert.match(uploadPhoto.body.item.photoPath, /^item-\d+-.*\.png$/);

    const backupOutput = await runNodeScript("src/backup-local.js", {
      BACKUP_PATH: backupRootPath,
      DATABASE_PATH: originalDatabasePath,
      PHOTO_PATH: originalPhotoPath
    });
    const backupMatch = backupOutput.stdout.match(/Created backup at (.+)\n?$/);

    assert.ok(backupMatch, "Expected backup helper to report a backup path");

    await originalServer.cleanup();
    originalServer = null;

    await runNodeScript("src/restore-local.js", {
      DATABASE_PATH: restoredDatabasePath,
      PHOTO_PATH: restoredPhotoPath,
      RESTORE_BACKUP_PATH: backupMatch[1]
    });

    restoredServer = await startTestServerWithPaths({
      databasePath: restoredDatabasePath,
      photoPath: restoredPhotoPath
    });

    const restoredSessionCookie = await loginAndGetSessionCookie(
      restoredServer.baseUrl
    );

    const currentSession = await requestJson(
      restoredServer.baseUrl,
      "/api/auth/current-session",
      {
        headers: {
          Cookie: restoredSessionCookie
        }
      }
    );

    assert.equal(currentSession.response.status, 200);
    assert.equal(currentSession.body.user.username, "tester");

    const restoredContainer = await requestJson(
      restoredServer.baseUrl,
      `/api/containers/${containerId}`,
      {
        headers: {
          Cookie: restoredSessionCookie
        }
      }
    );

    assert.equal(restoredContainer.response.status, 200);
    assert.equal(restoredContainer.body.container.name, "Garage Tote");
    assert.equal(restoredContainer.body.container.qrCode, "qr-garage-tote");
    assert.equal(restoredContainer.body.itemCount, 1);

    const restoredItem = await requestJson(
      restoredServer.baseUrl,
      `/api/items/${itemId}`,
      {
        headers: {
          Cookie: restoredSessionCookie
        }
      }
    );

    assert.equal(restoredItem.response.status, 200);
    assert.equal(restoredItem.body.item.name, "Packing Tape");
    assert.equal(restoredItem.body.item.qrCode, "qr-packing-tape");
    assert.equal(restoredItem.body.currentParentContainer.id, containerId);
    assert.equal(restoredItem.body.topLevel, false);

    const restoredQrOpen = await requestJson(
      restoredServer.baseUrl,
      "/api/qr/open?code=qr-packing-tape",
      {
        headers: {
          Cookie: restoredSessionCookie
        }
      }
    );

    assert.equal(restoredQrOpen.response.status, 200);
    assert.deepEqual(restoredQrOpen.body, {
      matchType: "item",
      objectId: itemId,
      objectType: "item"
    });

    const restoredPhoto = await requestBuffer(
      restoredServer.baseUrl,
      `/api/photos/item/${itemId}`,
      {
        headers: {
          Cookie: restoredSessionCookie
        }
      }
    );

    assert.equal(restoredPhoto.response.status, 200);
    assert.equal(restoredPhoto.response.headers.get("content-type"), "image/png");
    assert.deepEqual(restoredPhoto.body, photoBytes);
  } finally {
    if (originalServer) {
      await originalServer.cleanup();
    }

    if (restoredServer) {
      await restoredServer.cleanup();
    }

    fs.rmSync(temporaryDirectory, {
      force: true,
      recursive: true
    });
  }
});
