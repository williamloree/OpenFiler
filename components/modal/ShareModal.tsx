"use client";

import { useState, useEffect, useCallback } from "react";
import type { FileInfo, ShareLink } from "@/types";
import { formatDate } from "@/app/dashboard/file-browser";
import { Button } from "../ui/Button";

interface ShareModalProps {
  file: FileInfo;
  onClose: () => void;
}

export function ShareModal({ file, onClose }: ShareModalProps) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [expiresIn, setExpiresIn] = useState("24h");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/share?folder=${encodeURIComponent(file.folder)}&filename=${encodeURIComponent(file.name)}`
      );
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links);
      }
    } catch (e) {
      console.error("[OpenFiler] Fetch share links error:", e);
    }
  }, [file.folder, file.name]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder: file.folder,
          filename: file.name,
          expiresIn,
        }),
      });
      if (res.ok) {
        fetchLinks();
      }
    } catch (e) {
      console.error("[OpenFiler] Create share link error:", e);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/share", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setLinks((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (e) {
      console.error("[OpenFiler] Delete share link error:", e);
    }
  }

  function copyLink(link: ShareLink) {
    const url = window.location.origin + "/s/" + link.token;
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function formatExpiry(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return "Expiré";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "< 1h";
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  }

  return (
    <div className="fb-modal-overlay" onClick={onClose}>
      <div
        className="fb-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520 }}
      >
        <div className="fb-modal-header">
          <div style={{ overflow: "hidden", flex: 1 }}>
            <h3>Partager &quot;{file.name}&quot;</h3>
          </div>
          <button className="fb-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="fb-modal-body" style={{ padding: "16px 20px" }}>
          {/* Create new link */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: 6,
                border: "1px solid var(--fb-border)",
                fontSize: 14,
                background: "white",
              }}
            >
              <option value="1h">1 heure</option>
              <option value="24h">24 heures</option>
              <option value="7d">7 jours</option>
              <option value="30d">30 jours</option>
            </select>
            <Button variant="primary" onClick={handleCreate} disabled={loading}>
              {loading ? "..." : "Créer un lien"}
            </Button>
          </div>

          {/* Existing links */}
          {links.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {links.map((link) => (
                <div
                  key={link.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--fb-border)",
                    fontSize: 13,
                  }}
                >
                  <code
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontSize: 12,
                      color: "var(--fb-text-secondary)",
                    }}
                  >
                    /s/{link.token.slice(0, 16)}...
                  </code>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--fb-text-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatExpiry(link.expiresAt)} | {formatDate(link.createdAt)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => copyLink(link)}
                    style={{ fontSize: 12, padding: "2px 8px" }}
                  >
                    {copiedId === link.id ? "Copié !" : "Copier"}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(link.id)}
                    style={{ fontSize: 12, padding: "2px 8px" }}
                  >
                    Supprimer
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--fb-text-secondary)", fontSize: 13, margin: 0 }}>
              Aucun lien de partage actif.
            </p>
          )}
        </div>

        <div className="fb-modal-footer">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
