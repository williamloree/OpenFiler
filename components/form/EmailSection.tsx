"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function EmailSection({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState(currentEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const result = await authClient.changeEmail({ newEmail });
      if (result.error) {
        setMessage(result.error.message ?? "Erreur lors de la mise à jour");
      } else {
        setMessage("Email mis à jour");
      }
    } catch {
      setMessage("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white p-6">
      <h2 className="text-lg font-semibold mb-4">Email</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="settings-email"
            className="block text-sm font-medium mb-1"
          >
            Adresse email
          </label>
          <input
            id="settings-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        {message && (
          <p
            className={`text-sm ${message.includes("Erreur") ? "text-danger" : "text-green-600"}`}
          >
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || newEmail === currentEmail}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "..." : "Modifier l'email"}
        </button>
      </form>
    </section>
  );
}
