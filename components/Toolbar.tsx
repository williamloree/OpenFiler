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
    <div className="fb-toolbar">
      <div className="fb-breadcrumb">
        <a onClick={() => selectFolder("all")}>OpenFiler</a>
        <span className="fb-sep">/</span>
        <span>{FOLDER_NAMES[currentFolder]}</span>
      </div>
      <div className="fb-toolbar-actions">
        <div className="fb-search-box">
          <input
            type="text"
            placeholder="Rechercher un fichier..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={onRefresh}>
          🔄️ Rafraîchir
        </Button>
        <Button variant="primary" onClick={onOpenUpload}>
          📥 Upload
        </Button>
      </div>
    </div>
  );
}
