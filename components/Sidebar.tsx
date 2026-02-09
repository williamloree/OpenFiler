import type { SidebarProps } from "@/types";
import { formatSize } from "../app/dashboard/file-browser";
import { Button } from "./ui/Button";

const FOLDER_NAMES: Record<string, string> = {
  all: "Tous les fichiers",
  image: "Images",
  video: "Videos",
  document: "Documents",
};

export function Sidebar({
  currentFolder,
  selectFolder,
  stats,
  storagePct,
  userName,
  onOpenSettings,
  onSignOut,
}: SidebarProps) {
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
            onClick={() => selectFolder(folder)}
          >
            <span className="fb-nav-icon">
              {folder === "all"
                ? "📁"
                : folder === "image"
                  ? "📸"
                  : folder === "video"
                    ? "🎬"
                    : "📄"}
            </span>
            <span className="fb-nav-text">{FOLDER_NAMES[folder]}</span>
            <span className="fb-nav-badge">
              {folder === "all"
                ? stats.totalFiles
                : (stats.folders[folder]?.count ?? 0)}
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
          <div
            className="fb-storage-fill"
            style={{ width: `${storagePct}%` }}
          />
        </div>
        <div className="fb-sidebar-user">
          <span className="fb-user-name">{userName}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="sidebar" onClick={onOpenSettings}>
              Settings
            </Button>
            <Button variant="sidebar" onClick={onSignOut}>
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
