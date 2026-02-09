import { NextRequest } from "next/server";
import { auth } from "./server";

export async function requireSession(request?: NextRequest) {
  try {
    if (request) {
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      return session ?? null;
    }

    // Fallback for Server Components
    const { headers } = await import("next/headers");
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session ?? null;
  } catch {
    return null;
  }
}
