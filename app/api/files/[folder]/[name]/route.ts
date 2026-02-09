import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { access } from "fs/promises";

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

    const filePath = join(process.cwd(), "upload", folder, name);

    try {
      await access(filePath);
      return NextResponse.json({
        exists: true,
        url: `/api/preview/${folder}/${name}`,
        filename: name,
        folder,
      });
    } catch {
      return NextResponse.json(
        { message: "Fichier non trouvé.", error: "FILE_NOT_FOUND" },
        { status: 404 }
      );
    }
  } catch {
    return NextResponse.json(
      { message: "Erreur lors de la récupération des informations du fichier.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
