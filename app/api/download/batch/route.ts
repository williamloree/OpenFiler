import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { access } from "fs/promises";
import { createReadStream } from "fs";
import archiver from "archiver";
import { PassThrough } from "stream";
import { requireSession } from "@/lib/auth/require-session";

const ALLOWED_FOLDERS = ["image", "document", "video"];

function hasPathTraversal(name: string): boolean {
  return name.includes("..") || name.includes("/") || name.includes("\\") || name.startsWith(".");
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request);
    if (!session) {
      return NextResponse.json(
        { message: "Authentification requise.", error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { files } = await request.json();

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { message: "Aucun fichier sélectionné.", error: "NO_FILES" },
        { status: 400 }
      );
    }

    if (files.length > 100) {
      return NextResponse.json(
        { message: "Trop de fichiers (max 100).", error: "TOO_MANY_FILES" },
        { status: 400 }
      );
    }

    // Validate all files before starting the archive
    const validFiles: Array<{ folder: string; name: string; path: string }> = [];

    for (const file of files) {
      const { folder, name } = file;

      if (!folder || !name) {
        return NextResponse.json(
          { message: "Paramètres manquants pour un fichier.", error: "MISSING_PARAMETERS" },
          { status: 400 }
        );
      }

      if (!ALLOWED_FOLDERS.includes(folder) || hasPathTraversal(name)) {
        return NextResponse.json(
          { message: "Paramètres invalides.", error: "INVALID_PARAMETERS" },
          { status: 400 }
        );
      }

      const filePath = join(process.cwd(), "upload", folder, name);

      try {
        await access(filePath);
      } catch {
        return NextResponse.json(
          { message: `Fichier non trouvé: ${name}`, error: "FILE_NOT_FOUND" },
          { status: 404 }
        );
      }

      validFiles.push({ folder, name, path: filePath });
    }

    // Create ZIP archive
    const archive = archiver("zip", { zlib: { level: 5 } });
    const passthrough = new PassThrough();

    archive.pipe(passthrough);

    for (const file of validFiles) {
      archive.append(createReadStream(file.path), {
        name: `${file.folder}/${file.name}`,
      });
    }

    archive.finalize();

    // Convert Node stream to Web ReadableStream
    const readable = new ReadableStream({
      start(controller) {
        passthrough.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        passthrough.on("end", () => {
          controller.close();
        });
        passthrough.on("error", (err) => {
          controller.error(err);
        });
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="openfiler-download.zip"',
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Erreur lors de la création de l'archive.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
