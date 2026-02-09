import { mkdirSync } from "fs";
import { join } from "path";

let initialized = false;

export function ensureUploadDirs() {
  if (initialized) return;
  try {
    const uploadDir = join(process.cwd(), "upload");
    mkdirSync(uploadDir, { recursive: true });
    mkdirSync(join(uploadDir, "image"), { recursive: true });
    mkdirSync(join(uploadDir, "document"), { recursive: true });
    mkdirSync(join(uploadDir, "video"), { recursive: true });
    initialized = true;
  } catch {
    // ignore if already exists
  }
}
