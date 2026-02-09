"use client";

import { FOLDER_NAMES } from "./types";

interface ToolbarProps {
  currentFolder: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectFolder: (folder: string) => void;
  onRefresh: () => void;
  onUpload: () => void;
}

export function Toolbar({ currentFolder, search, onSearchChange, onSelectFolder, onRefresh, onUpload }: ToolbarProps) {
  return (
    <div className="fb-toolbar">
      <div className="fb-breadcrumb">
        <a onClick={() => onSelectFolder("all")}>OpenFiler</a>
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
        <button className="fb-btn fb-btn-outline" onClick={onRefresh}>
          &#8635; Rafraîchir
        </button>
        <button className="fb-btn fb-btn-primary" onClick={onUpload}>
          &#8679; Upload
        </button>
      </div>
    </div>
  );
}
