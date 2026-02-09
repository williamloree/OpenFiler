import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { access, readFile } from "fs/promises";
import { ALLOWED_FOLDERS } from "@/lib/upload-config";
import { getFilePrivacy } from "@/lib/metadata";
import { requireSession } from "@/lib/auth/require-session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ folder: string; name: string }> }
) {
  try {
    const { folder, name } = await params;

    if (!name || !folder) {
      return NextResponse.json(
        { message: "Nom du fichier et dossier requis.", error: "MISSING_PARAMETERS" },
        { status: 400 }
      );
    }

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json(
        { message: "Dossier non valide.", error: "INVALID_FOLDER" },
        { status: 400 }
      );
    }

    const filePath = join(process.cwd(), "upload", folder, name);

    try {
      await access(filePath);
    } catch {
      return NextResponse.json(
        { message: "Fichier non trouvé.", error: "FILE_NOT_FOUND" },
        { status: 404 }
      );
    }

    const isPrivate = await getFilePrivacy(folder, name);
    if (isPrivate) {
      const session = await requireSession();
      if (!session) {
        return NextResponse.json(
          { message: "Ce fichier est privé. Une session valide est requise.", error: "UNAUTHORIZED" },
          { status: 401 }
        );
      }
    }

    const fileBuffer = await readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"`,
        "Content-Type": "application/octet-stream",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Erreur lors du téléchargement du fichier.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
