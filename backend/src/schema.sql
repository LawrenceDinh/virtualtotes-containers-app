CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS containers (
  id INTEGER PRIMARY KEY,
  userId INTEGER NOT NULL,
  name TEXT NOT NULL,
  photoPath TEXT,
  qrCode TEXT,
  parentContainerId INTEGER,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parentContainerId) REFERENCES containers(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY,
  userId INTEGER NOT NULL,
  name TEXT NOT NULL,
  photoPath TEXT,
  qrCode TEXT,
  parentContainerId INTEGER,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parentContainerId) REFERENCES containers(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS recent_objects (
  id INTEGER PRIMARY KEY,
  userId INTEGER NOT NULL,
  objectType TEXT NOT NULL CHECK (objectType IN ('container', 'item')),
  objectId INTEGER NOT NULL,
  openedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_containers_user_id
  ON containers(userId);

CREATE INDEX IF NOT EXISTS idx_containers_parent_container_id
  ON containers(parentContainerId);

CREATE INDEX IF NOT EXISTS idx_containers_qr_code
  ON containers(qrCode)
  WHERE qrCode IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_containers_qr_code_unique
  ON containers(qrCode)
  WHERE qrCode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_items_user_id
  ON items(userId);

CREATE INDEX IF NOT EXISTS idx_items_parent_container_id
  ON items(parentContainerId);

CREATE INDEX IF NOT EXISTS idx_items_qr_code
  ON items(qrCode)
  WHERE qrCode IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_items_qr_code_unique
  ON items(qrCode)
  WHERE qrCode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recent_objects_user_id_opened_at
  ON recent_objects(userId, openedAt DESC);

-- Phase-1 QR strategy:
-- 1. Application logic still validates QR ownership and duplicate intent.
-- 2. Schema-level indexes block duplicates within each table.
-- 3. Cross-table triggers block the same QR from being linked to both a
--    container and an item, even if future code paths bypass app validation.
CREATE TRIGGER IF NOT EXISTS trg_containers_qr_code_unique_across_items_insert
BEFORE INSERT ON containers
WHEN NEW.qrCode IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM items
    WHERE qrCode = NEW.qrCode
  )
BEGIN
  SELECT RAISE(ABORT, 'QR code is already linked to another object');
END;

CREATE TRIGGER IF NOT EXISTS trg_containers_qr_code_unique_across_items_update
BEFORE UPDATE OF qrCode ON containers
WHEN NEW.qrCode IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM items
    WHERE qrCode = NEW.qrCode
  )
BEGIN
  SELECT RAISE(ABORT, 'QR code is already linked to another object');
END;

CREATE TRIGGER IF NOT EXISTS trg_items_qr_code_unique_across_containers_insert
BEFORE INSERT ON items
WHEN NEW.qrCode IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM containers
    WHERE qrCode = NEW.qrCode
  )
BEGIN
  SELECT RAISE(ABORT, 'QR code is already linked to another object');
END;

CREATE TRIGGER IF NOT EXISTS trg_items_qr_code_unique_across_containers_update
BEFORE UPDATE OF qrCode ON items
WHEN NEW.qrCode IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM containers
    WHERE qrCode = NEW.qrCode
  )
BEGIN
  SELECT RAISE(ABORT, 'QR code is already linked to another object');
END;
