import { db } from "./auth/server";

// Configuration
const MAX_ATTEMPTS = 5; // Max failed attempts before ban
const ATTEMPT_WINDOW_MINUTES = 15; // Time window to count attempts
const BAN_DURATION_MINUTES = 60; // Initial ban duration (1 hour)
const REPEATED_BAN_DURATION_HOURS = 24; // Ban duration for repeat offenders (24h)

interface LoginAttempt {
  id: number;
  ipAddress: string;
  email: string | null;
  userAgent: string | null;
  success: number;
  attemptedAt: string;
}

interface BannedIp {
  id: number;
  ipAddress: string;
  reason: string | null;
  bannedAt: string;
  expiresAt: string | null;
  permanent: number;
}

/**
 * Record a login attempt (success or failure)
 */
export function recordLoginAttempt(
  ipAddress: string,
  email: string | null,
  success: boolean,
  userAgent: string | null = null,
): void {
  db.prepare(
    `INSERT INTO "login_attempt" ("ipAddress", "email", "userAgent", "success", "attemptedAt")
     VALUES (?, ?, ?, ?, ?)`,
  ).run(ipAddress, email, userAgent, success ? 1 : 0, new Date().toISOString());
}

/**
 * Check if an IP address is currently banned
 */
export function isIpBanned(ipAddress: string): {
  banned: boolean;
  reason?: string;
  expiresAt?: string;
  permanent?: boolean;
} {
  const now = new Date().toISOString();

  // Clean up expired bans first
  db.prepare(
    `DELETE FROM "banned_ip"
     WHERE "permanent" = 0 AND "expiresAt" IS NOT NULL AND "expiresAt" < ?`,
  ).run(now);

  const ban = db
    .prepare(
      `SELECT * FROM "banned_ip"
       WHERE "ipAddress" = ?
       AND ("permanent" = 1 OR "expiresAt" IS NULL OR "expiresAt" > ?)`,
    )
    .get(ipAddress, now) as BannedIp | undefined;

  if (ban) {
    return {
      banned: true,
      reason: ban.reason || "Too many failed login attempts",
      expiresAt: ban.expiresAt || undefined,
      permanent: ban.permanent === 1,
    };
  }

  return { banned: false };
}

/**
 * Get recent failed login attempts for an IP
 */
export function getRecentFailedAttempts(
  ipAddress: string,
  minutes: number = ATTEMPT_WINDOW_MINUTES,
): LoginAttempt[] {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000).toISOString();

  return db
    .prepare(
      `SELECT * FROM "login_attempt"
       WHERE "ipAddress" = ?
       AND "success" = 0
       AND "attemptedAt" > ?
       ORDER BY "attemptedAt" DESC`,
    )
    .all(ipAddress, cutoff) as LoginAttempt[];
}

/**
 * Check if IP should be banned and ban it if necessary
 * Returns true if IP was just banned
 */
export function checkAndBanIfNeeded(ipAddress: string): boolean {
  const recentFailures = getRecentFailedAttempts(ipAddress);

  if (recentFailures.length >= MAX_ATTEMPTS) {
    // Check if this IP has been banned before
    const previousBans = db
      .prepare(`SELECT COUNT(*) as count FROM "banned_ip" WHERE "ipAddress" = ?`)
      .get(ipAddress) as { count: number };

    const isRepeatOffender = previousBans.count > 0;
    const durationMinutes = isRepeatOffender
      ? REPEATED_BAN_DURATION_HOURS * 60
      : BAN_DURATION_MINUTES;

    const expiresAt = new Date(
      Date.now() + durationMinutes * 60 * 1000,
    ).toISOString();

    const reason = isRepeatOffender
      ? `Repeated failed login attempts (${recentFailures.length} attempts in ${ATTEMPT_WINDOW_MINUTES} minutes)`
      : `Too many failed login attempts (${recentFailures.length} attempts in ${ATTEMPT_WINDOW_MINUTES} minutes)`;

    banIp(ipAddress, reason, false, expiresAt);
    return true;
  }

  return false;
}

/**
 * Ban an IP address
 */
export function banIp(
  ipAddress: string,
  reason: string = "Manual ban",
  permanent: boolean = false,
  expiresAt: string | null = null,
): void {
  // Remove existing ban if any
  db.prepare(`DELETE FROM "banned_ip" WHERE "ipAddress" = ?`).run(ipAddress);

  // Insert new ban
  db.prepare(
    `INSERT INTO "banned_ip" ("ipAddress", "reason", "bannedAt", "expiresAt", "permanent")
     VALUES (?, ?, ?, ?, ?)`,
  ).run(ipAddress, reason, new Date().toISOString(), expiresAt, permanent ? 1 : 0);
}

/**
 * Unban an IP address
 */
export function unbanIp(ipAddress: string): void {
  db.prepare(`DELETE FROM "banned_ip" WHERE "ipAddress" = ?`).run(ipAddress);
}

/**
 * Get all currently banned IPs
 */
export function getBannedIps(): BannedIp[] {
  const now = new Date().toISOString();

  // Clean up expired bans first
  db.prepare(
    `DELETE FROM "banned_ip"
     WHERE "permanent" = 0 AND "expiresAt" IS NOT NULL AND "expiresAt" < ?`,
  ).run(now);

  return db
    .prepare(
      `SELECT * FROM "banned_ip"
       ORDER BY "bannedAt" DESC`,
    )
    .all() as BannedIp[];
}

/**
 * Get recent login attempts (for admin view)
 */
export function getRecentAttempts(limit: number = 100): LoginAttempt[] {
  return db
    .prepare(
      `SELECT * FROM "login_attempt"
       ORDER BY "attemptedAt" DESC
       LIMIT ?`,
    )
    .all(limit) as LoginAttempt[];
}

/**
 * Clear old login attempts (older than 7 days)
 */
export function cleanupOldAttempts(): void {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`DELETE FROM "login_attempt" WHERE "attemptedAt" < ?`).run(cutoff);
}
