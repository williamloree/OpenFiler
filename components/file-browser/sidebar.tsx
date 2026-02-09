"use client";

import { Stats, FOLDER_NAMES } from "./types";
import { formatSize } from "./utils";

interface SidebarProps {
  stats: Stats;
  currentFolder: string;
  userName: string;
  onSelectFolder: (folder: string) => void;
  onSignOut: () => void;
}

export function Sidebar({ stats, currentFolder, userName, onSelectFolder, onSignOut }: SidebarProps) {
  const storagePct = Math.min((stats.totalSize / (1024 * 1024 * 1024)) * 100, 100);

  return (
    <aside className="fb-sidebar">
      <div className="fb-sidebar-header">
        <h1>OpenFiler</h1>
        <span>File Browser</span>
      </div>
      <nav className="fb-sidebar-nav">
        <div className="fb-sidebar-label">Buckets</div>
        {(["all", "image", "video", "document"] as const).map((folder) => (
          <div
            key={folder}
            className={`fb-nav-item ${currentFolder === folder ? "active" : ""}`}
            onClick={() => onSelectFolder(folder)}
          >
            <span className="fb-nav-icon">
              {folder === "all" ? "\u{1F4C1}" : folder === "image" ? "\u{1F4F7}" : folder === "video" ? "\u{1F3A5}" : "\u{1F4C4}"}
            </span>
            <span className="fb-nav-text">{FOLDER_NAMES[folder]}</span>
            <span className="fb-nav-badge">
              {folder === "all" ? stats.totalFiles : stats.folders[folder]?.count ?? 0}
            </span>
          </div>
        ))}
      </nav>
      <div className="fb-sidebar-stats">
        <div className="fb-stat-row">
          <span className="fb-stat-label">Fichiers</span>
          <span className="fb-stat-value">{stats.totalFiles}</span>
        </div>
        <div className="fb-stat-row">
          <span className="fb-stat-label">Taille totale</span>
          <span className="fb-stat-value">{formatSize(stats.totalSize)}</span>
        </div>
        <div className="fb-storage-bar">
          <div className="fb-storage-fill" style={{ width: `${storagePct}%` }} />
        </div>
        <div className="fb-sidebar-user">
          <span className="fb-user-name">{userName}</span>
          <button className="fb-signout-btn" onClick={onSignOut}>
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );
}
