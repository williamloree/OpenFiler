import { NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { mkdir, writeFile, statfs } from "fs/promises";
import { getSlugifiedFilename } from "@/lib/slug";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_FILES_PER_FIELD, getFolderForMimeType } from "@/lib/upload-config";
import { detectMimeType, detectedTypeMatchesFolder } from "@/lib/magic-bytes";
import { db } from "@/lib/auth/server";
import { requireSession } from "@/lib/auth/require-session";

const DISK_BUFFER = 100 * 1024 * 1024; // 100 MB safety buffer

interface UploadedFile {
  name: string;
  defaultName: string;
  type: string;
  size: number;
  path: string;
  fieldname: string;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    // Auth: Bearer token or session
    const authHeader = request.headers.get("authorization");
    let authenticated = false;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const row = db.prepare("SELECT id FROM api_token WHERE token = ?").get(token);
      authenticated = !!row;
    }

    if (!authenticated) {
      const session = await requireSession(request);
      authenticated = !!session;
    }

    if (!authenticated) {
      return NextResponse.json({ error: "UNAUTHORIZED", message: "Token ou session requis." }, { status: 401 });
    }
    const formData = await request.formData();
    const files: UploadedFile[] = [];
    const fieldCounts: Record<string, number> = {};

    const entries = Array.from(formData.entries());

    if (entries.length === 0) {
      return NextResponse.json(
        { message: "Aucun fichier n'a été uploadé.", error: "NO_FILES" },
        { status: 400 }
      );
    }

    // Check disk space before writing
    const totalUploadSize = entries.reduce((sum, [, value]) => {
      return sum + (value instanceof File ? value.size : 0);
    }, 0);

    try {
      const uploadDir = join(process.cwd(), "upload");
      await mkdir(uploadDir, { recursive: true });
      const stats = await statfs(uploadDir);
      const freeSpace = stats.bfree * stats.bsize;

      if (freeSpace < totalUploadSize + DISK_BUFFER) {
        return NextResponse.json(
          { message: "Espace disque insuffisant.", error: "DISK_FULL" },
          { status: 507 }
        );
      }
    } catch {
      // statfs not available on this platform — skip check
    }

    for (const [fieldname, value] of entries) {
      if (!(value instanceof File)) continue;

      const file = value;
      const folder = getFolderForMimeType(file.type) ?? fieldname;

      // Validate MIME type
      const allowedTypes = ALLOWED_MIME_TYPES[folder];
      if (!allowedTypes || !allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            message: `Type de fichier non autorisé pour le champ "${folder}". Type reçu: ${file.type}`,
            error: "INVALID_FILE_TYPE",
          },
          { status: 400 }
        );
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: "Le fichier est trop volumineux (maximum 64MB).", error: "FILE_TOO_LARGE" },
          { status: 400 }
        );
      }

      // Check max files per field
      fieldCounts[folder] = (fieldCounts[folder] || 0) + 1;
      if (fieldCounts[folder] > (MAX_FILES_PER_FIELD[folder] || 10)) {
        return NextResponse.json(
          { message: "Trop de fichiers uploadés.", error: "TOO_MANY_FILES" },
          { status: 400 }
        );
      }

      const filename = `${Date.now()}_${getSlugifiedFilename(file.name)}`;
      const folderPath = join(process.cwd(), "upload", folder);
      await mkdir(folderPath, { recursive: true });

      const buffer = Buffer.from(await file.arrayBuffer());

      // Validate actual file content via magic bytes
      const detectedMime = detectMimeType(buffer);
      if (detectedMime && !detectedTypeMatchesFolder(detectedMime, folder)) {
        return NextResponse.json(
          {
            message: `Le contenu du fichier "${file.name}" ne correspond pas au type déclaré.`,
            error: "INVALID_FILE_CONTENT",
          },
          { status: 400 }
        );
      }

      await writeFile(join(folderPath, filename), buffer);

      files.push({
        name: filename,
        defaultName: file.name,
        type: file.type,
        size: file.size,
        path: `/${folder}`,
        fieldname: folder,
        url: `/api/preview/${folder}/${filename}`,
      });
    }

    if (files.length === 0) {
      return NextResponse.json(
        { message: "Aucun fichier n'a été uploadé.", error: "NO_FILES" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: `${files.length} fichier(s) uploadé(s) avec succès.`,
        files,
        count: files.length,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("[OpenFiler] Upload error:", e);
    return NextResponse.json(
      { message: "Erreur lors de l'enregistrement des fichiers.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
