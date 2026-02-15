import { db } from "./auth/server";
import { auth } from "./auth/server";

const DEFAULT_NAME = "Admin";
const DEFAULT_EMAIL = "admin@openfiler.local";
const DEFAULT_PASSWORD = "admin1234";

function ensureTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "user" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "emailVerified" INTEGER NOT NULL DEFAULT 0,
      "image" TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "session" (
      "id" TEXT PRIMARY KEY,
      "expiresAt" TEXT NOT NULL,
      "token" TEXT NOT NULL UNIQUE,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "userId" TEXT NOT NULL REFERENCES "user"("id")
    );
    CREATE TABLE IF NOT EXISTS "account" (
      "id" TEXT PRIMARY KEY,
      "accountId" TEXT NOT NULL,
      "providerId" TEXT NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "user"("id"),
      "accessToken" TEXT,
      "refreshToken" TEXT,
      "idToken" TEXT,
      "accessTokenExpiresAt" TEXT,
      "refreshTokenExpiresAt" TEXT,
      "scope" TEXT,
      "password" TEXT,
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "verification" (
      "id" TEXT PRIMARY KEY,
      "identifier" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "expiresAt" TEXT NOT NULL,
      "createdAt" TEXT,
      "updatedAt" TEXT
    );
    CREATE TABLE IF NOT EXISTS "api_token" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "token" TEXT NOT NULL UNIQUE,
      "userId" TEXT NOT NULL REFERENCES "user"("id"),
      "createdAt" TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "file_metadata" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "folder" TEXT NOT NULL,
      "filename" TEXT NOT NULL,
      "isPrivate" INTEGER NOT NULL DEFAULT 0,
      "userId" TEXT REFERENCES "user"("id"),
      "createdAt" TEXT NOT NULL,
      "updatedAt" TEXT NOT NULL,
      UNIQUE("folder", "filename")
    );
    CREATE TABLE IF NOT EXISTS "trash" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "originalFolder" TEXT NOT NULL,
      "filename" TEXT NOT NULL,
      "trashName" TEXT NOT NULL UNIQUE,
      "size" INTEGER NOT NULL DEFAULT 0,
      "deletedBy" TEXT REFERENCES "user"("id"),
      "deletedAt" TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "share_link" (
      "id" TEXT PRIMARY KEY,
      "token" TEXT NOT NULL UNIQUE,
      "folder" TEXT NOT NULL,
      "filename" TEXT NOT NULL,
      "userId" TEXT NOT NULL REFERENCES "user"("id"),
      "expiresAt" TEXT NOT NULL,
      "createdAt" TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "file_view" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "folder" TEXT NOT NULL,
      "filename" TEXT NOT NULL,
      "action" TEXT NOT NULL DEFAULT 'preview',
      "userId" TEXT,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "referer" TEXT,
      "viewedAt" TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "idx_file_view_file" ON "file_view" ("folder", "filename");
    CREATE INDEX IF NOT EXISTS "idx_file_view_date" ON "file_view" ("viewedAt");
    CREATE TABLE IF NOT EXISTS "login_attempt" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "ipAddress" TEXT NOT NULL,
      "email" TEXT,
      "userAgent" TEXT,
      "success" INTEGER NOT NULL DEFAULT 0,
      "attemptedAt" TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "idx_login_attempt_ip" ON "login_attempt" ("ipAddress", "attemptedAt");
    CREATE TABLE IF NOT EXISTS "banned_ip" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "ipAddress" TEXT NOT NULL UNIQUE,
      "reason" TEXT,
      "bannedAt" TEXT NOT NULL,
      "expiresAt" TEXT,
      "permanent" INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS "idx_banned_ip_address" ON "banned_ip" ("ipAddress");
  `);
}

export async function seedDefaultUser() {
  try {
    ensureTables();

    const row = db.prepare("SELECT COUNT(*) as count FROM user").get() as { count: number };
    if (row.count > 0) return;

    await auth.api.signUpEmail({
      body: { name: DEFAULT_NAME, email: DEFAULT_EMAIL, password: DEFAULT_PASSWORD },
    });
    console.log(`[OpenFiler] Default user created — ${DEFAULT_EMAIL} / ${DEFAULT_PASSWORD}`);
  } catch (e) {
    console.error("[OpenFiler] Failed to seed default user:", e);
  }
}
