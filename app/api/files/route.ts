import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readdir, stat, access, unlink, rename } from "fs/promises";
import { getAllPrivateFiles, removeFileMetadata, getFilePrivacy, setFilePrivacy } from "@/lib/metadata";
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

    // Sort by modified desc by default
    allFiles.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    const total = allFiles.length;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get("limit") ?? "50", 10)));
    const start = (page - 1) * limit;
    const paginatedFiles = allFiles.slice(start, start + limit);

    return NextResponse.json({ files: paginatedFiles, total, page, limit });
  } catch {
    return NextResponse.json(
      { message: "Erreur lors de la récupération de la liste des fichiers.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

const ALLOWED_FOLDERS = ["image", "document", "video"];

function hasPathTraversal(name: string): boolean {
  return name.includes("..") || name.includes("/") || name.includes("\\") || name.startsWith(".");
}

export async function PATCH(request: NextRequest) {
  try {
    const { folder, oldName, newName } = await request.json();

    if (!folder || !oldName || !newName) {
      return NextResponse.json({ message: "Paramètres manquants.", error: "MISSING_PARAMETERS" }, { status: 400 });
    }

    if (!ALLOWED_FOLDERS.includes(folder) || hasPathTraversal(oldName) || hasPathTraversal(newName)) {
      return NextResponse.json({ message: "Paramètres invalides.", error: "INVALID_PARAMETERS" }, { status: 400 });
    }

    const folderPath = join(process.cwd(), "upload", folder);
    const oldPath = join(folderPath, oldName);
    const newPath = join(folderPath, newName);

    try {
      await access(oldPath);
    } catch {
      return NextResponse.json({ message: "Fichier non trouvé.", error: "FILE_NOT_FOUND" }, { status: 404 });
    }

    // Check new name doesn't already exist
    try {
      await access(newPath);
      return NextResponse.json({ message: "Un fichier avec ce nom existe déjà.", error: "FILE_EXISTS" }, { status: 409 });
    } catch {
      // Good — file doesn't exist
    }

    await rename(oldPath, newPath);

    // Transfer metadata
    const wasPrivate = await getFilePrivacy(folder, oldName);
    await removeFileMetadata(folder, oldName);
    if (wasPrivate) {
      await setFilePrivacy(folder, newName, true);
    }

    return NextResponse.json({ message: "Fichier renommé.", oldName, newName });
  } catch {
    return NextResponse.json({ message: "Erreur lors du renommage.", error: "INTERNAL_ERROR" }, { status: 500 });
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
