import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { access, unlink, rename as fsRename, copyFile } from "fs/promises";
import { db } from "@/lib/auth/server";
import { ensureUploadDirs } from "@/lib/ensure-dirs";

const TRASH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface TrashRow {
  id: number;
  originalFolder: string;
  filename: string;
  trashName: string;
  size: number;
  deletedBy: string | null;
  deletedAt: string;
}

function autoPurge() {
  const cutoff = new Date(Date.now() - TRASH_MAX_AGE_MS).toISOString();
  const expired = db.prepare(
    `SELECT * FROM "trash" WHERE "deletedAt" < ?`
  ).all(cutoff) as TrashRow[];

  for (const row of expired) {
    const trashPath = join(process.cwd(), "upload", ".trash", row.trashName);
    try {
      require("fs").unlinkSync(trashPath);
    } catch {
      // file may already be gone
    }
  }

  if (expired.length > 0) {
    db.prepare(`DELETE FROM "trash" WHERE "deletedAt" < ?`).run(cutoff);
  }
}

export async function GET() {
  try {
    ensureUploadDirs();
    autoPurge();

    const items = db.prepare(
      `SELECT * FROM "trash" ORDER BY "deletedAt" DESC`
    ).all() as TrashRow[];

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json(
      { message: "Erreur lors de la récupération de la corbeille.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureUploadDirs();
    const { action, id } = await request.json();

    if (action === "restore") {
      if (!id) {
        return NextResponse.json(
          { message: "ID requis.", error: "MISSING_PARAMETERS" },
          { status: 400 }
        );
      }

      const row = db.prepare(`SELECT * FROM "trash" WHERE "id" = ?`).get(id) as TrashRow | undefined;
      if (!row) {
        return NextResponse.json(
          { message: "Élément non trouvé dans la corbeille.", error: "NOT_FOUND" },
          { status: 404 }
        );
      }

      const trashPath = join(process.cwd(), "upload", ".trash", row.trashName);
      const restorePath = join(process.cwd(), "upload", row.originalFolder, row.filename);

      try {
        await access(trashPath);
      } catch {
        db.prepare(`DELETE FROM "trash" WHERE "id" = ?`).run(id);
        return NextResponse.json(
          { message: "Fichier introuvable dans la corbeille.", error: "FILE_NOT_FOUND" },
          { status: 404 }
        );
      }

      await fsRename(trashPath, restorePath).catch(async () => {
        await copyFile(trashPath, restorePath);
        await unlink(trashPath);
      });

      db.prepare(`DELETE FROM "trash" WHERE "id" = ?`).run(id);

      return NextResponse.json({ message: "Fichier restauré.", filename: row.filename });
    }

    if (action === "delete") {
      if (!id) {
        return NextResponse.json(
          { message: "ID requis.", error: "MISSING_PARAMETERS" },
          { status: 400 }
        );
      }

      const row = db.prepare(`SELECT * FROM "trash" WHERE "id" = ?`).get(id) as TrashRow | undefined;
      if (!row) {
        return NextResponse.json(
          { message: "Élément non trouvé dans la corbeille.", error: "NOT_FOUND" },
          { status: 404 }
        );
      }

      const trashPath = join(process.cwd(), "upload", ".trash", row.trashName);
      try {
        await unlink(trashPath);
      } catch {
        // file may already be gone
      }

      db.prepare(`DELETE FROM "trash" WHERE "id" = ?`).run(id);

      return NextResponse.json({ message: "Fichier supprimé définitivement.", filename: row.filename });
    }

    if (action === "empty") {
      const allItems = db.prepare(`SELECT * FROM "trash"`).all() as TrashRow[];

      for (const row of allItems) {
        const trashPath = join(process.cwd(), "upload", ".trash", row.trashName);
        try {
          await unlink(trashPath);
        } catch {
          // file may already be gone
        }
      }

      db.prepare(`DELETE FROM "trash"`).run();

      return NextResponse.json({ message: "Corbeille vidée.", count: allItems.length });
    }

    return NextResponse.json(
      { message: "Action non reconnue.", error: "INVALID_ACTION" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { message: "Erreur lors de l'opération sur la corbeille.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
