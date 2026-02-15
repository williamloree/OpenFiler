import type { SidebarProps } from "@/types";
import { formatSize } from "../app/dashboard";
import { Button } from "./ui/Button";

const FOLDERS = [
  { key: "all", label: "Tous les fichiers", icon: "📁" },
  { key: "image", label: "Images", icon: "📸" },
  { key: "video", label: "Videos", icon: "🎬" },
  { key: "document", label: "Documents", icon: "📄" },
] as const;

export function Sidebar({
  currentFolder,
  selectFolder,
  stats,
  storagePct,
  userName,
  trashCount,
  onOpenSettings,
  onSignOut,
}: SidebarProps) {
  return (
    <aside className="flex h-screen w-65 min-w-65 flex-col bg-[#0f1724] text-slate-400">
      {/* Header */}
      <div className="border-b border-white/8 px-5 pt-5 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-white">
          OpenFiler
        </h1>
        <span className="text-xs font-medium text-blue-400">File Browser</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        <div className="px-5 pb-1.5 pt-2 text-[10px] font-semibold tracking-widest text-slate-600 uppercase">
          Buckets
        </div>
        {FOLDERS.map(({ key, label, icon }) => (
          <div
            key={key}
            className={`flex cursor-pointer items-center gap-3 border-l-3 px-5 py-2.5 text-sm transition-all ${
              currentFolder === key
                ? "border-blue-400 bg-[#243348] text-white"
                : "border-transparent hover:bg-[#1a2538]"
            }`}
            onClick={() => selectFolder(key)}
          >
            <span className="w-5 text-center text-base">{icon}</span>
            <span className="nav-text">{label}</span>
            <span className="ml-auto rounded-full bg-blue-400/15 px-2 py-0.5 text-xs font-semibold text-blue-400">
              {key === "all"
                ? stats.totalFiles
                : (stats.folders[key]?.count ?? 0)}
            </span>
          </div>
        ))}

        <div className="mt-4 px-5 pb-1.5 pt-2 text-[10px] font-semibold tracking-widest text-slate-600 uppercase">
          Gestion
        </div>
        <div
          className={`flex cursor-pointer items-center gap-3 border-l-3 px-5 py-2.5 text-sm transition-all ${
            currentFolder === "trash"
              ? "border-blue-400 bg-[#243348] text-white"
              : "border-transparent hover:bg-[#1a2538]"
          }`}
          onClick={() => selectFolder("trash")}
        >
          <span className="w-5 text-center text-base">🗑️</span>
          <span className="nav-text">Corbeille</span>
          <span className="ml-auto rounded-full bg-blue-400/15 px-2 py-0.5 text-xs font-semibold text-blue-400">
            {trashCount}
          </span>
        </div>

        <div className="mt-4 px-5 pb-1.5 pt-2 text-[10px] font-semibold tracking-widest text-slate-600 uppercase">
          Analytiques
        </div>
        <div
          className={`flex cursor-pointer items-center gap-3 border-l-3 px-5 py-2.5 text-sm transition-all ${
            currentFolder === "tracking"
              ? "border-blue-400 bg-[#243348] text-white"
              : "border-transparent hover:bg-[#1a2538]"
          }`}
          onClick={() => selectFolder("tracking")}
        >
          <span className="w-5 text-center text-base">📊</span>
          <span className="nav-text">Suivi</span>
        </div>

        <div className="mt-4 px-5 pb-1.5 pt-2 text-[10px] font-semibold tracking-widest text-slate-600 uppercase">
          Sécurité
        </div>
        <div
          className={`flex cursor-pointer items-center gap-3 border-l-3 px-5 py-2.5 text-sm transition-all ${
            currentFolder === "security"
              ? "border-blue-400 bg-[#243348] text-white"
              : "border-transparent hover:bg-[#1a2538]"
          }`}
          onClick={() => selectFolder("security")}
        >
          <span className="w-5 text-center text-base">🛡️</span>
          <span className="nav-text">Protection</span>
        </div>
      </nav>

      {/* Stats */}
      <div className="border-t border-white/8 px-5 py-4">
        <div className="flex justify-between py-1 text-xs">
          <span className="text-slate-600">Fichiers</span>
          <span className="font-semibold text-slate-400">
            {stats.totalFiles}
          </span>
        </div>
        <div className="flex justify-between py-1 text-xs">
          <span className="text-slate-600">Taille totale</span>
          <span className="font-semibold text-slate-400">
            {formatSize(stats.totalSize)}
          </span>
        </div>
        <div className="mt-2.5 h-1 overflow-hidden rounded-sm bg-white/10">
          <div
            className="h-full rounded-sm bg-blue-400 transition-all duration-300"
            style={{ width: `${storagePct}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3">
          <span className="max-w-30 truncate text-xs text-slate-400">
            {userName}
          </span>
          <div className="flex gap-2">
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
