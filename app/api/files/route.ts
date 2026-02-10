import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { readdir, stat, access, rename as fsRename, copyFile, unlink } from "fs/promises";
import { getAllPrivateFiles, removeFileMetadata, getFilePrivacy, setFilePrivacy } from "@/lib/metadata";
import { ensureUploadDirs } from "@/lib/ensure-dirs";
import { db } from "@/lib/auth/server";

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
    const privateFiles = getAllPrivateFiles();

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
  } catch (e) {
    console.error("[OpenFiler] Files list error:", e);
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

    await fsRename(oldPath, newPath);

    // Transfer metadata
    const wasPrivate = getFilePrivacy(folder, oldName);
    removeFileMetadata(folder, oldName);
    if (wasPrivate) {
      setFilePrivacy(folder, newName, true);
    }

    return NextResponse.json({ message: "Fichier renommé.", oldName, newName });
  } catch (e) {
    console.error("[OpenFiler] Rename error:", e);
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

    // Soft delete: move to .trash/ instead of permanent deletion
    const fileStat = await stat(filePath);
    const trashName = `${Date.now()}_${folder}_${name}`;
    const trashPath = join(process.cwd(), "upload", ".trash", trashName);

    await fsRename(filePath, trashPath).catch(async () => {
      // Cross-device fallback: copy + delete
      await copyFile(filePath, trashPath);
      await unlink(filePath);
    });

    db.prepare(
      `INSERT INTO "trash" ("originalFolder", "filename", "trashName", "size", "deletedAt")
       VALUES (?, ?, ?, ?, ?)`
    ).run(folder, name, trashName, fileStat.size, new Date().toISOString());

    removeFileMetadata(folder, name);

    return NextResponse.json({ message: "Fichier déplacé dans la corbeille.", filename: name });
  } catch (e) {
    console.error("[OpenFiler] Delete error:", e);
    return NextResponse.json(
      { message: "Erreur lors de la suppression du fichier.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
