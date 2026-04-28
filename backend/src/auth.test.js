const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const test = require("node:test");

const { config } = require("./config");
const { initializeDatabase, withDatabase } = require("./database");
const {
  authenticateCredentials,
  createSessionCookie,
  destroySession,
  ensureBootstrapUser,
  getAuthenticatedUser,
  hashPassword,
  requireAuthenticatedUser,
  verifyPassword
} = require("./auth");

function withTemporaryDatabaseConfig(callback) {
  const originalDatabasePath = config.databasePath;
  const originalBootstrapUsername = config.bootstrapUsername;
  const originalBootstrapPassword = config.bootstrapPassword;
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "containers-app-auth-")
  );

  config.databasePath = path.join(temporaryDirectory, "inventory.sqlite");

  try {
    initializeDatabase();
    callback({
      setBootstrapCredentials(username, password) {
        config.bootstrapUsername = username;
        config.bootstrapPassword = password;
      },
      temporaryDirectory
    });
  } finally {
    config.databasePath = originalDatabasePath;
    config.bootstrapUsername = originalBootstrapUsername;
    config.bootstrapPassword = originalBootstrapPassword;
    fs.rmSync(temporaryDirectory, {
      force: true,
      recursive: true
    });
  }
}

function getCookieHeaderValue(setCookieHeader) {
  return String(setCookieHeader).split(";")[0];
}

test("hashPassword and verifyPassword round-trip valid credentials", () => {
  const passwordHash = hashPassword("test-password");

  assert.match(passwordHash, /^scrypt:/);
  assert.equal(verifyPassword("test-password", passwordHash), true);
  assert.equal(verifyPassword("wrong-password", passwordHash), false);
});

test("ensureBootstrapUser creates one login and authenticateCredentials verifies it", () => {
  withTemporaryDatabaseConfig(({ setBootstrapCredentials }) => {
    setBootstrapCredentials("tester", "testpass");

    ensureBootstrapUser();
    ensureBootstrapUser();

    const users = withDatabase((database) =>
      database
        .prepare("SELECT id, username, passwordHash FROM users ORDER BY id ASC")
        .all()
    );

    assert.equal(users.length, 1);
    assert.equal(users[0].username, "tester");
    assert.equal(verifyPassword("testpass", users[0].passwordHash), true);

    assert.deepEqual(authenticateCredentials("tester", "testpass"), {
      id: users[0].id,
      username: "tester"
    });
    assert.equal(authenticateCredentials("tester", "wrong"), null);
    assert.equal(authenticateCredentials("missing", "testpass"), null);
  });
});

test("session cookie creation authenticates requests until the session is destroyed", () => {
  withTemporaryDatabaseConfig(({ setBootstrapCredentials }) => {
    setBootstrapCredentials("tester", "testpass");
    ensureBootstrapUser();

    const user = authenticateCredentials("tester", "testpass");
      const rawSetCookie = createSessionCookie(user);
      const cookieHeader = getCookieHeaderValue(rawSetCookie);

      // Ensure SameSite is Lax so same-site resource requests (images/thumbnails)
      // include the session cookie in common desktop/browser modes.
      assert.match(rawSetCookie, /SameSite=Lax/);
    const request = {
      headers: {
        cookie: cookieHeader
      }
    };

    assert.deepEqual(getAuthenticatedUser(request), user);
    assert.deepEqual(requireAuthenticatedUser(request), user);

    destroySession(request);

    assert.equal(getAuthenticatedUser(request), null);
    assert.throws(
      () => requireAuthenticatedUser(request),
      (error) => {
        assert.equal(error.statusCode, 401);
        assert.match(error.message, /authentication required/i);
        return true;
      }
    );
  });
});
