import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readFile } from "fs/promises";
import { db } from "@/lib/auth/server";
import { lookup } from "@/lib/mime";
import { logFileView } from "@/lib/tracking";

interface ShareRow {
  id: string;
  token: string;
  folder: string;
  filename: string;
  expiresAt: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { message: "Token requis.", error: "MISSING_TOKEN" },
        { status: 400 }
      );
    }

    const link = db
      .prepare("SELECT id, token, folder, filename, expiresAt FROM share_link WHERE token = ?")
      .get(token) as ShareRow | undefined;

    if (!link) {
      return NextResponse.json(
        { message: "Lien invalide ou expiré.", error: "LINK_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (new Date(link.expiresAt) < new Date()) {
      // Clean up expired link
      db.prepare("DELETE FROM share_link WHERE id = ?").run(link.id);
      return NextResponse.json(
        { message: "Ce lien a expiré.", error: "LINK_EXPIRED" },
        { status: 410 }
      );
    }

    const filePath = join(process.cwd(), "upload", link.folder, link.filename);

    try {
      const fileBuffer = await readFile(filePath);
      const contentType = lookup(link.filename);

      try {
        logFileView({
          folder: link.folder,
          filename: link.filename,
          action: "share_view",
          userId: null,
          ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
          userAgent: request.headers.get("user-agent") ?? null,
          referer: request.headers.get("referer") ?? null,
        });
      } catch (trackingErr) {
        console.error("[OpenFiler] Tracking error (share_view):", trackingErr);
      }

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${encodeURIComponent(link.filename)}"`,
          "Cache-Control": "private, max-age=300",
        },
      });
    } catch {
      return NextResponse.json(
        { message: "Fichier non trouvé.", error: "FILE_NOT_FOUND" },
        { status: 404 }
      );
    }
  } catch (e) {
    console.error("[OpenFiler] Share serve error:", e);
    return NextResponse.json(
      { message: "Erreur lors de la récupération du fichier.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
