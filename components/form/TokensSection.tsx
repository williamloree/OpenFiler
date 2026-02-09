"use client";

import { useState, useEffect, useCallback } from "react";
import type { ApiToken } from "@/types";

export function TokensSection() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch("/api/tokens");
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setCreatedToken(null);
    try {
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedToken(data.token);
        setNewName("");
        fetchTokens();
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/tokens", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setTokens((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      /* ignore */
    }
  }

  function copyToken() {
    if (createdToken) {
      navigator.clipboard.writeText(createdToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white p-6">
      <h2 className="text-lg font-semibold mb-4">Tokens API</h2>

      {createdToken && (
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3">
          <p className="text-sm font-medium text-green-800 mb-2">
            Token créé — copiez-le maintenant, il ne sera plus affiché :
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white rounded border border-green-200 px-2 py-1.5 break-all select-all">
              {createdToken}
            </code>
            <button
              onClick={copyToken}
              className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-100"
            >
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleCreate} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nom du token"
          required
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading || !newName.trim()}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? "..." : "Créer"}
        </button>
      </form>

      {tokens.length > 0 ? (
        <div className="space-y-2">
          {tokens.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{t.name}</div>
                <div className="text-xs text-gray-500 font-mono">{t.token}</div>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                className="shrink-0 ml-2 rounded-lg border border-border px-2 py-1 text-xs text-danger transition-colors hover:bg-red-50"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Aucun token API.</p>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Utilisez un token pour uploader via API :{" "}
        <code className="bg-gray-100 px-1 rounded">
          Authorization: Bearer &lt;token&gt;
        </code>
      </p>
    </section>
  );
}
