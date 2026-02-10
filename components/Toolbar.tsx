import type { ToolbarProps } from "@/types";
import { Button } from "./ui/Button";

const FOLDER_NAMES: Record<string, string> = {
  all: "Tous les fichiers",
  image: "Images",
  video: "Videos",
  document: "Documents",
};

export function Toolbar({
  currentFolder,
  selectFolder,
  search,
  onSearchChange,
  onRefresh,
  onOpenUpload,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center gap-1.5 text-sm text-slate-400">
        <a
          onClick={() => selectFolder("all")}
          className="cursor-pointer text-blue-500 hover:underline"
        >
          OpenFiler
        </a>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600">{FOLDER_NAMES[currentFolder]}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <svg
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un fichier..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-60 rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-300 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <Button variant="outline" onClick={onRefresh}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Rafraîchir
        </Button>
        <Button variant="primary" onClick={onOpenUpload}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload
        </Button>
      </div>
    </div>
  );
}
