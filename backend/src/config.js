const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const envFilePath = path.join(repoRoot, "backend", ".env");

function parseEnvFile(contents) {
  const values = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function loadFileEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const contents = fs.readFileSync(filePath, "utf8");
  return parseEnvFile(contents);
}

function resolveRepoPath(inputPath) {
  return path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(repoRoot, inputPath);
}

function normalizeServerAddress(input) {
  const value = input || "http://0.0.0.0:3000";
  const parsedUrl = new URL(value);

  return parsedUrl.toString().replace(/\/$/, "");
}

function normalizeOptionalValue(input) {
  if (typeof input !== "string") {
    return null;
  }

  const value = input.trim();
  return value ? value : null;
}

function getServerBinding(address) {
  const parsedUrl = new URL(address);
  const port = parsedUrl.port ? Number(parsedUrl.port) : 3000;

  return {
    host: parsedUrl.hostname,
    port
  };
}

const fileEnv = loadFileEnv(envFilePath);
const env = {
  ...fileEnv,
  ...process.env
};

const config = {
  repoRoot,
  databasePath: resolveRepoPath(env.DATABASE_PATH || "./data/inventory.sqlite"),
  photoPath: resolveRepoPath(env.PHOTO_PATH || "./photos"),
  sessionSecret: env.SESSION_SECRET || "change-me-before-real-use",
  localServerAddress: normalizeServerAddress(
    env.LOCAL_SERVER_ADDRESS || "http://0.0.0.0:3000"
  ),
  bootstrapUsername: normalizeOptionalValue(env.BOOTSTRAP_USERNAME),
  bootstrapPassword: normalizeOptionalValue(env.BOOTSTRAP_PASSWORD)
};

module.exports = {
  config,
  envFilePath,
  getServerBinding
};
