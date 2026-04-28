const crypto = require("crypto");

const { config } = require("./config");
const { withDatabase } = require("./database");

const SESSION_COOKIE_NAME = "inventory_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const SCRYPT_KEY_LENGTH = 64;
const sessionStore = new Map();

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto
    .scryptSync(password, salt, SCRYPT_KEY_LENGTH)
    .toString("hex");

  return `scrypt:${salt}:${derivedKey}`;
}

function verifyPassword(password, storedHash) {
  const [algorithm, salt, expectedHash] = String(storedHash || "").split(":");

  if (algorithm !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const actualBuffer = crypto.scryptSync(password, salt, expectedBuffer.length);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function cleanupExpiredSessions() {
  const now = Date.now();

  for (const [sessionId, session] of sessionStore.entries()) {
    if (session.expiresAt <= now) {
      sessionStore.delete(sessionId);
    }
  }
}

function serializeCookie(name, value, options = {}) {
  const segments = [`${name}=${value}`];

  if (options.httpOnly) {
    segments.push("HttpOnly");
  }

  if (options.maxAge !== undefined) {
    segments.push(`Max-Age=${options.maxAge}`);
  }

  if (options.path) {
    segments.push(`Path=${options.path}`);
  }

  if (options.sameSite) {
    segments.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure) {
    segments.push("Secure");
  }

  if (options.expires) {
    segments.push(`Expires=${options.expires.toUTCString()}`);
  }

  return segments.join("; ");
}

function parseCookies(cookieHeader) {
  const cookies = {};

  if (!cookieHeader) {
    return cookies;
  }

  for (const cookiePart of cookieHeader.split(";")) {
    const separatorIndex = cookiePart.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name = cookiePart.slice(0, separatorIndex).trim();
    const value = cookiePart.slice(separatorIndex + 1).trim();

    if (!name) {
      continue;
    }

    cookies[name] = decodeURIComponent(value);
  }

  return cookies;
}

function signSessionId(sessionId) {
  return crypto
    .createHmac("sha256", config.sessionSecret)
    .update(sessionId)
    .digest("hex");
}

function parseSignedSessionId(rawValue) {
  if (!rawValue) {
    return null;
  }

  const separatorIndex = rawValue.indexOf(".");

  if (separatorIndex === -1) {
    return null;
  }

  const sessionId = rawValue.slice(0, separatorIndex);
  const providedSignature = rawValue.slice(separatorIndex + 1);
  const expectedSignature = signSessionId(sessionId);
  const providedBuffer = Buffer.from(providedSignature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (
    !providedBuffer.length ||
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  return sessionId;
}

function getSessionCookieOptions() {
  const isSecureCookie = config.localServerAddress.startsWith("https://");

  return {
    httpOnly: true,
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    path: "/",
    sameSite: "Lax",
    secure: isSecureCookie
  };
}

function getCookieSessionId(request) {
  const cookies = parseCookies(request.headers.cookie);
  return parseSignedSessionId(cookies[SESSION_COOKIE_NAME]);
}

function createSessionCookie(user) {
  cleanupExpiredSessions();

  const sessionId = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_DURATION_MS;

  sessionStore.set(sessionId, {
    expiresAt,
    userId: user.id
  });

  const signedValue = `${sessionId}.${signSessionId(sessionId)}`;

  return serializeCookie(
    SESSION_COOKIE_NAME,
    encodeURIComponent(signedValue),
    getSessionCookieOptions()
  );
}

function clearSessionCookie() {
  return serializeCookie(SESSION_COOKIE_NAME, "", {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "Lax",
    secure: config.localServerAddress.startsWith("https://")
  });
}

function destroySession(request) {
  const sessionId = getCookieSessionId(request);

  if (sessionId) {
    sessionStore.delete(sessionId);
  }
}

function getAuthenticatedUser(request) {
  cleanupExpiredSessions();

  const sessionId = getCookieSessionId(request);

  if (!sessionId) {
    return null;
  }

  const session = sessionStore.get(sessionId);

  if (!session || session.expiresAt <= Date.now()) {
    sessionStore.delete(sessionId);
    return null;
  }

  const user = withDatabase((database) =>
    database
      .prepare("SELECT id, username FROM users WHERE id = ?")
      .get(session.userId)
  );

  if (!user) {
    sessionStore.delete(sessionId);
    return null;
  }

  return {
    id: user.id,
    username: user.username
  };
}

function requireAuthenticatedUser(request) {
  const user = getAuthenticatedUser(request);

  if (!user) {
    throw createHttpError(401, "Authentication required");
  }

  return user;
}

function authenticateCredentials(username, password) {
  const normalizedUsername = String(username || "").trim();

  if (!normalizedUsername || typeof password !== "string" || !password) {
    return null;
  }

  return withDatabase((database) => {
    const user = database
      .prepare("SELECT id, username, passwordHash FROM users WHERE username = ?")
      .get(normalizedUsername);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return null;
    }

    return {
      id: user.id,
      username: user.username
    };
  });
}

function ensureBootstrapUser() {
  return withDatabase((database) => {
    const existingUserCount = database
      .prepare("SELECT COUNT(*) AS count FROM users")
      .get().count;

    if (existingUserCount > 0) {
      if (existingUserCount > 1) {
        console.log("Warning: More than one user exists. Phase 1 expects one private account.");
      }

      return;
    }

    if (!config.bootstrapUsername || !config.bootstrapPassword) {
      console.log(
        "Warning: No bootstrap account configured. Set BOOTSTRAP_USERNAME and BOOTSTRAP_PASSWORD before using login."
      );
      return;
    }

    const passwordHash = hashPassword(config.bootstrapPassword);

    database
      .prepare("INSERT INTO users (username, passwordHash) VALUES (?, ?)")
      .run(config.bootstrapUsername, passwordHash);

    console.log(`Bootstrap user created: ${config.bootstrapUsername}`);
  });
}

module.exports = {
  authenticateCredentials,
  clearSessionCookie,
  createHttpError,
  createSessionCookie,
  destroySession,
  ensureBootstrapUser,
  getAuthenticatedUser,
  hashPassword,
  requireAuthenticatedUser,
  verifyPassword
};
