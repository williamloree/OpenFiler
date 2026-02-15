import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/require-session";
import {
  getBannedIps,
  getRecentAttempts,
  banIp,
  unbanIp,
} from "@/lib/security";

// GET - List banned IPs and recent attempts
export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "bans";

  if (type === "attempts") {
    const limit = parseInt(searchParams.get("limit") || "100");
    const attempts = getRecentAttempts(limit);
    return NextResponse.json({ attempts });
  }

  // Default: return banned IPs
  const bannedIps = getBannedIps();
  return NextResponse.json({ bannedIps });
}

// POST - Ban an IP manually
export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ipAddress, reason, permanent, durationHours } = await request.json();

    if (!ipAddress) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 },
      );
    }

    let expiresAt: string | null = null;
    if (!permanent && durationHours) {
      expiresAt = new Date(
        Date.now() + durationHours * 60 * 60 * 1000,
      ).toISOString();
    }

    banIp(
      ipAddress,
      reason || "Manually banned by admin",
      permanent || false,
      expiresAt,
    );

    return NextResponse.json({
      message: `IP ${ipAddress} has been banned`,
      ipAddress,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

// DELETE - Unban an IP
export async function DELETE(request: NextRequest) {
  const session = await requireSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ipAddress = searchParams.get("ip");

  if (!ipAddress) {
    return NextResponse.json(
      { error: "IP address is required" },
      { status: 400 },
    );
  }

  unbanIp(ipAddress);

  return NextResponse.json({
    message: `IP ${ipAddress} has been unbanned`,
    ipAddress,
  });
}
