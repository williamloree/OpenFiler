import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "openfiler",
    version: "2.0.0",
  });
}
