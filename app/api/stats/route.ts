import { NextResponse } from "next/server";
import { join } from "path";
import { readdir, stat } from "fs/promises";

export async function GET() {
  try {
    const folders = ["image", "document", "video"];
    const stats: Record<string, { count: number; size: number }> = {};
    let totalFiles = 0;
    let totalSize = 0;

    for (const folderName of folders) {
      const folderPath = join(process.cwd(), "upload", folderName);
      let count = 0;
      let size = 0;

      try {
        const files = await readdir(folderPath);
        for (const filename of files) {
          const filePath = join(folderPath, filename);
          const fileStat = await stat(filePath);
          if (fileStat.isFile()) {
            count++;
            size += fileStat.size;
          }
        }
      } catch {
        // folder doesn't exist yet
      }

      stats[folderName] = { count, size };
      totalFiles += count;
      totalSize += size;
    }

    return NextResponse.json({ totalFiles, totalSize, folders: stats });
  } catch (e) {
    console.error("[OpenFiler] Stats error:", e);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des statistiques.", error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
