"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (newPassword !== confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 8) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setLoading(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
      });
      if (result.error) {
        setMessage(result.error.message ?? "Erreur lors de la mise à jour");
      } else {
        setMessage("Mot de passe mis à jour");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setMessage("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white p-6">
      <h2 className="text-lg font-semibold mb-4">Mot de passe</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="settings-current-password"
            className="block text-sm font-medium mb-1"
          >
            Mot de passe actuel
          </label>
          <input
            id="settings-current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label
            htmlFor="settings-new-password"
            className="block text-sm font-medium mb-1"
          >
            Nouveau mot de passe
          </label>
          <input
            id="settings-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label
            htmlFor="settings-confirm-password"
            className="block text-sm font-medium mb-1"
          >
            Confirmer le nouveau mot de passe
          </label>
          <input
            id="settings-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            placeholder="••••••••"
          />
        </div>
        {message && (
          <p
            className={`text-sm ${message.includes("Erreur") || message.includes("correspondent") || message.includes("caractères") ? "text-danger" : "text-green-600"}`}
          >
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={
            loading || !currentPassword || !newPassword || !confirmPassword
          }
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "..." : "Modifier le mot de passe"}
        </button>
      </form>
    </section>
  );
}
