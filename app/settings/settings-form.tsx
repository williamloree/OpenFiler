"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";

export function SettingsForm({
  currentName,
  currentEmail,
}: {
  currentName: string;
  currentEmail: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">Settings</span>
          <Link
            href="/"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Retour
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-10 space-y-8">
        <ProfileSection currentName={currentName} />
        <EmailSection currentEmail={currentEmail} />
        <PasswordSection />
      </div>
    </div>
  );
}

function ProfileSection({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await authClient.updateUser({ name });
      if (result.error) {
        setMessage(result.error.message ?? "Erreur lors de la mise à jour");
      } else {
        setMessage("Nom mis à jour");
      }
    } catch {
      setMessage("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white p-6">
      <h2 className="text-lg font-semibold mb-4">Profil</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nom
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        {message && (
          <p className={`text-sm ${message.includes("Erreur") ? "text-danger" : "text-green-600"}`}>
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || name === currentName}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "..." : "Enregistrer"}
        </button>
      </form>
    </section>
  );
}

function EmailSection({ currentEmail }: { currentEmail: string }) {
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
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
        {message && (
          <p className={`text-sm ${message.includes("Erreur") ? "text-danger" : "text-green-600"}`}>
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

function PasswordSection() {
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
          <label htmlFor="current-password" className="block text-sm font-medium mb-1">
            Mot de passe actuel
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium mb-1">
            Nouveau mot de passe
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">
            Confirmer le nouveau mot de passe
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            placeholder="••••••••"
          />
        </div>
        {message && (
          <p className={`text-sm ${message.includes("Erreur") || message.includes("correspondent") || message.includes("caractères") ? "text-danger" : "text-green-600"}`}>
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "..." : "Modifier le mot de passe"}
        </button>
      </form>
    </section>
  );
}
