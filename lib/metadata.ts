import { db } from "./auth/server";

export function getFilePrivacy(folder: string, filename: string): boolean {
  const row = db.prepare(
    `SELECT "isPrivate" FROM "file_metadata" WHERE "folder" = ? AND "filename" = ?`
  ).get(folder, filename) as { isPrivate: number } | undefined;
  return row?.isPrivate === 1;
}

export function setFilePrivacy(folder: string, filename: string, isPrivate: boolean): void {
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO "file_metadata" ("folder", "filename", "isPrivate", "createdAt", "updatedAt")
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT("folder", "filename") DO UPDATE SET "isPrivate" = ?, "updatedAt" = ?`
  ).run(folder, filename, isPrivate ? 1 : 0, now, now, isPrivate ? 1 : 0, now);
}

export function getAllPrivateFiles(): Set<string> {
  const rows = db.prepare(
    `SELECT "folder", "filename" FROM "file_metadata" WHERE "isPrivate" = 1`
  ).all() as { folder: string; filename: string }[];
  return new Set(rows.map((r) => `${r.folder}/${r.filename}`));
}

export function removeFileMetadata(folder: string, filename: string): void {
  db.prepare(
    `DELETE FROM "file_metadata" WHERE "folder" = ? AND "filename" = ?`
  ).run(folder, filename);
}
