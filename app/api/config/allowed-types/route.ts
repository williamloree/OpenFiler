import { NextResponse } from "next/server";
import { ALLOWED_MIME_TYPES, MAX_FILES_PER_FIELD } from "@/lib/upload-config";

export async function GET() {
  return NextResponse.json({
    ...ALLOWED_MIME_TYPES,
    limits: {
      fileSize: "64MB",
      maxFiles: MAX_FILES_PER_FIELD,
    },
  });
}
