import { NextResponse } from "next/server";
import { access, constants } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/auth/server";

export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  // Database check
  try {
    db.prepare("SELECT 1").get();
    checks.database = "ok";
  } catch {
    checks.database = "error";
    healthy = false;
  }

  // Upload directory check
  try {
    const uploadDir = join(process.cwd(), "upload");
    await access(uploadDir, constants.W_OK);
    checks.storage = "ok";
  } catch {
    checks.storage = "error";
    healthy = false;
  }

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "unhealthy",
      checks,
      service: "openfiler",
      version: "2.0.0",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
