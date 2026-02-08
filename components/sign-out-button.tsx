"use client";

import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
    >
      Sign out
    </button>
  );
}
