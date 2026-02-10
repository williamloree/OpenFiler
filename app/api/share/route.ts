import { NextRequest, NextResponse } from "next/server";
import { randomUUID, randomBytes } from "crypto";
import { join } from "path";
import { access } from "fs/promises";
import { db } from "@/lib/auth/server";
import { requireSession } from "@/lib/auth/require-session";

const ALLOWED_FOLDERS = ["image", "document", "video"];
const EXPIRY_MAP: Record<string, number> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

interface ShareRow {
  id: string;
  token: string;
  folder: string;
  filename: string;
  expiresAt: string;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder");
    const filename = searchParams.get("filename");

    if (!folder || !filename) {
      return NextResponse.json(
        { message: "Paramètres manquants.", error: "MISSING_PARAMETERS" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const links = db
      .prepare(
        `SELECT id, token, folder, filename, expiresAt, createdAt
         FROM share_link
         WHERE folder = ? AND filename = ? AND userId = ? AND expiresAt > ?
         ORDER BY createdAt DESC`
      )
      .all(folder, filename, session.user.id, now) as ShareRow[];

    return NextResponse.json({ links });
  } catch (e) {
    console.error("[OpenFiler] Share list error:", e);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des liens.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request);
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { folder, filename, expiresIn } = await request.json();

    if (!folder || !filename || !expiresIn) {
      return NextResponse.json(
        { message: "Paramètres manquants.", error: "MISSING_PARAMETERS" },
        { status: 400 }
      );
    }

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json(
        { message: "Dossier non valide.", error: "INVALID_FOLDER" },
        { status: 400 }
      );
    }

    const expiryMs = EXPIRY_MAP[expiresIn];
    if (!expiryMs) {
      return NextResponse.json(
        { message: "Durée d'expiration non valide.", error: "INVALID_EXPIRY" },
        { status: 400 }
      );
    }

    // Verify file exists
    const filePath = join(process.cwd(), "upload", folder, filename);
    try {
      await access(filePath);
    } catch {
      return NextResponse.json(
        { message: "Fichier non trouvé.", error: "FILE_NOT_FOUND" },
        { status: 404 }
      );
    }

    const id = randomUUID();
    const token = "sh_" + randomBytes(24).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryMs).toISOString();
    const createdAt = now.toISOString();

    db.prepare(
      `INSERT INTO share_link (id, token, folder, filename, userId, expiresAt, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, token, folder, filename, session.user.id, expiresAt, createdAt);

    return NextResponse.json(
      { id, token, folder, filename, expiresAt, createdAt, url: `/s/${token}` },
      { status: 201 }
    );
  } catch (e) {
    console.error("[OpenFiler] Share create error:", e);
    return NextResponse.json(
      { message: "Erreur lors de la création du lien.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession(request);
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { message: "ID requis.", error: "MISSING_PARAMETERS" },
        { status: 400 }
      );
    }

    const result = db
      .prepare("DELETE FROM share_link WHERE id = ? AND userId = ?")
      .run(id, session.user.id);

    if (result.changes === 0) {
      return NextResponse.json(
        { message: "Lien non trouvé.", error: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[OpenFiler] Share delete error:", e);
    return NextResponse.json(
      { message: "Erreur lors de la suppression du lien.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
