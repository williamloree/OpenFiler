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
