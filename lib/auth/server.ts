import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const db = new Database(process.env.DATABASE_URL ?? "./openfiler.db");

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
    : ["http://localhost:3000"],
});
