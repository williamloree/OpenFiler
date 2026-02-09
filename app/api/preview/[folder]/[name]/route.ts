import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { access, readFile } from "fs/promises";
import { ALLOWED_FOLDERS } from "@/lib/upload-config";
import { getFilePrivacy } from "@/lib/metadata";
import { requireSession } from "@/lib/auth/require-session";
import { lookup } from "@/lib/mime";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folder: string; name: string }> }
) {
  try {
    const { folder, name } = await params;

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return NextResponse.json(
        { message: "Dossier non valide.", error: "INVALID_FOLDER" },
        { status: 400 }
      );
    }

    if (name.includes("..") || name.includes("/") || name.includes("\\") || name.startsWith(".")) {
      return NextResponse.json(
        { message: "Nom de fichier non valide.", error: "INVALID_FILENAME" },
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
      const session = await requireSession(request);
      if (!session) {
        return NextResponse.json(
          { message: "Ce fichier est privé. Une session valide est requise.", error: "UNAUTHORIZED" },
          { status: 401 }
        );
      }
    }

    const fileBuffer = await readFile(filePath);
    const contentType = lookup(name);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": isPrivate
          ? "private, no-store, no-cache, must-revalidate"
          : "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Erreur lors de la récupération du fichier.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
