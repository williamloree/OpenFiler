import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { access } from "fs/promises";
import { setFilePrivacy } from "@/lib/metadata";
import { ALLOWED_FOLDERS } from "@/lib/upload-config";
import { requireSession } from "@/lib/auth/require-session";

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(request);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { folder, name, isPrivate } = await request.json();

    if (!folder || !name || typeof isPrivate !== "boolean") {
      return NextResponse.json(
        { message: "folder, name et isPrivate (boolean) sont requis.", error: "MISSING_PARAMETERS" },
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

    setFilePrivacy(folder, name, isPrivate);

    return NextResponse.json({
      message: `Visibilité mise à jour: ${isPrivate ? "privé" : "public"}.`,
      name,
      folder,
      isPrivate,
    });
  } catch (e) {
    console.error("[OpenFiler] Visibility error:", e);
    return NextResponse.json(
      { message: "Erreur lors de la mise à jour de la visibilité.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
