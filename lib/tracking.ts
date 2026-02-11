import { db } from "./auth/server";
import type { FileViewRecord, FileTrackingSummary, ViewAction } from "@/types";

export function logFileView(params: {
  folder: string;
  filename: string;
  action: ViewAction;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  referer?: string | null;
}): void {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO "file_view" ("folder", "filename", "action", "userId", "ipAddress", "userAgent", "referer", "viewedAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    params.folder,
    params.filename,
    params.action,
    params.userId ?? null,
    params.ipAddress ?? null,
    params.userAgent ?? null,
    params.referer ?? null,
    now
  );
}

export function getFileStats(
  folder: string,
  filename: string
): {
  totalViews: number;
  uniqueViewers: number;
  lastViewedAt: string | null;
  recentViews: FileViewRecord[];
} {
  const countRow = db
    .prepare(
      `SELECT
       COUNT(*) as totalViews,
       COUNT(DISTINCT COALESCE("userId", "ipAddress")) as uniqueViewers,
       MAX("viewedAt") as lastViewedAt
     FROM "file_view"
     WHERE "folder" = ? AND "filename" = ?`
    )
    .get(folder, filename) as {
    totalViews: number;
    uniqueViewers: number;
    lastViewedAt: string | null;
  };

  const recentViews = db
    .prepare(
      `SELECT * FROM "file_view"
     WHERE "folder" = ? AND "filename" = ?
     ORDER BY "viewedAt" DESC
     LIMIT 50`
    )
    .all(folder, filename) as FileViewRecord[];

  return { ...countRow, recentViews };
}

export function deleteFileViews(folder: string, filename: string): number {
  const result = db
    .prepare(
      `DELETE FROM "file_view" WHERE "folder" = ? AND "filename" = ?`
    )
    .run(folder, filename);
  return result.changes;
}

export function deleteAllFileViews(): number {
  const result = db.prepare(`DELETE FROM "file_view"`).run();
  return result.changes;
}

export function getAllFileStats(): FileTrackingSummary[] {
  return db
    .prepare(
      `SELECT
       "folder",
       "filename",
       COUNT(*) as totalViews,
       COUNT(DISTINCT COALESCE("userId", "ipAddress")) as uniqueViewers,
       SUM(CASE WHEN "action" = 'preview' THEN 1 ELSE 0 END) as previewCount,
       SUM(CASE WHEN "action" = 'download' THEN 1 ELSE 0 END) as downloadCount,
       SUM(CASE WHEN "action" = 'share_view' THEN 1 ELSE 0 END) as shareViewCount,
       MAX("viewedAt") as lastViewedAt
     FROM "file_view"
     GROUP BY "folder", "filename"
     ORDER BY totalViews DESC`
    )
    .all() as FileTrackingSummary[];
}
