import { auth } from "@/lib/auth/server";
import { toNextJsHandler } from "better-auth/next-js";
import {
  isIpBanned,
  recordLoginAttempt,
  checkAndBanIfNeeded,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

const authHandler = toNextJsHandler(auth);

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET(request: NextRequest) {
  return authHandler.GET(request);
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Only apply fail2ban to sign-in endpoint
  if (path.includes("/sign-in/email")) {
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get("user-agent");

    // Check if IP is banned
    const banStatus = isIpBanned(ipAddress);
    if (banStatus.banned) {
      const message = banStatus.permanent
        ? "Your IP has been permanently banned."
        : banStatus.expiresAt
          ? `Too many failed login attempts. Please try again after ${new Date(banStatus.expiresAt).toLocaleString()}.`
          : "Your IP has been temporarily banned.";

      return NextResponse.json(
        { error: message, bannedUntil: banStatus.expiresAt },
        { status: 429 },
      );
    }

    // Clone request to read body
    const clonedRequest = request.clone();
    let email: string | null = null;
    try {
      const body = await clonedRequest.json();
      email = body.email || null;
    } catch {
      // Body not parseable, continue
    }

    // Call the actual auth handler
    const response = await authHandler.POST(request);

    // Record the attempt
    const success = response.status === 200;
    recordLoginAttempt(ipAddress, email, success, userAgent);

    // If failed, check if we should ban
    if (!success) {
      const wasBanned = checkAndBanIfNeeded(ipAddress);
      if (wasBanned) {
        console.log(`[OpenFiler] IP ${ipAddress} has been banned for too many failed login attempts`);
      }
    }

    return response;
  }

  // For all other auth endpoints, pass through
  return authHandler.POST(request);
}
