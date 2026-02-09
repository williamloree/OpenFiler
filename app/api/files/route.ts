import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readdir, stat, access, unlink } from "fs/promises";
import { getAllPrivateFiles, removeFileMetadata } from "@/lib/metadata";
import { ensureUploadDirs } from "@/lib/ensure-dirs";

export async function GET(request: NextRequest) {
  try {
    ensureUploadDirs();
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder");

    const folders = folder ? [folder] : ["image", "document", "video"];
    const allFiles: Array<{
      name: string;
      folder: string;
      size: number;
      created: Date;
      modified: Date;
      url: string;
      isPrivate: boolean;
    }> = [];
    const privateFiles = await getAllPrivateFiles();

    for (const folderName of folders) {
      const folderPath = join(process.cwd(), "upload", folderName);

      try {
        const files = await readdir(folderPath);
        const fileInfos = await Promise.all(
          files.map(async (filename: string) => {
            const filePath = join(folderPath, filename);
            const stats = await stat(filePath);
            return {
              name: filename,
              folder: folderName,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              url: `/api/preview/${folderName}/${filename}`,
              isPrivate: privateFiles.has(`${folderName}/${filename}`),
            };
          })
        );
        allFiles.push(...fileInfos);
      } catch {
        // folder not accessible
      }
    }

    return NextResponse.json({ files: allFiles, count: allFiles.length });
  } catch {
    return NextResponse.json(
      { message: "Erreur lors de la récupération de la liste des fichiers.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { name, type } = await request.json();

    if (!name || !type) {
      return NextResponse.json(
        { message: "Nom du fichier et type requis.", error: "MISSING_PARAMETERS" },
        { status: 400 }
      );
    }

    const folder = type.startsWith("image/")
      ? "image"
      : type.startsWith("application/")
        ? "document"
        : type.startsWith("video/")
          ? "video"
          : null;

    if (!folder) {
      return NextResponse.json(
        { message: "Type de fichier non reconnu.", error: "INVALID_FILE_TYPE" },
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

    await unlink(filePath);
    await removeFileMetadata(folder, name);

    return NextResponse.json({ message: "Fichier supprimé avec succès.", filename: name });
  } catch {
    return NextResponse.json(
      { message: "Erreur lors de la suppression du fichier.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
