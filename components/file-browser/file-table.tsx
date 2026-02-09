"use client";

import { FileInfo, SortField, SortDir } from "./types";
import { formatSize, formatDate, getFolderIcon } from "./utils";

interface FileTableProps {
  files: FileInfo[];
  selectedFiles: Set<string>;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onToggleSelect: (name: string) => void;
  onToggleSelectAll: () => void;
  onPreview: (file: FileInfo) => void;
  onDelete: (file: FileInfo) => void;
  onToggleVisibility: (folder: string, name: string, isPrivate: boolean) => void;
  onUpload: () => void;
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  return (
    <span className="fb-sort-icon">
      {sortField === field ? (sortDir === "asc" ? "\u25B2" : "\u25BC") : "\u25B2\u25BC"}
    </span>
  );
}

export function FileTable({
  files,
  selectedFiles,
  sortField,
  sortDir,
  onSort,
  onToggleSelect,
  onToggleSelectAll,
  onPreview,
  onDelete,
  onToggleVisibility,
  onUpload,
}: FileTableProps) {
  if (files.length === 0) {
    return (
      <div className="fb-empty-state">
        <div className="fb-empty-icon">&#128194;</div>
        <h3>Aucun fichier</h3>
        <p>Ce dossier est vide. Uploadez des fichiers pour commencer.</p>
        <button className="fb-btn fb-btn-primary" style={{ marginTop: 16 }} onClick={onUpload}>
          &#8679; Upload
        </button>
      </div>
    );
  }

  return (
    <div className="fb-table-container">
      <table className="fb-table">
        <thead>
          <tr>
            <th className="fb-td-checkbox">
              <input
                type="checkbox"
                checked={selectedFiles.size === files.length && files.length > 0}
                onChange={onToggleSelectAll}
              />
            </th>
            <th onClick={() => onSort("name")}>
              Nom <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
            </th>
            <th onClick={() => onSort("folder")}>
              Type <SortIcon field="folder" sortField={sortField} sortDir={sortDir} />
            </th>
            <th onClick={() => onSort("size")}>
              Taille <SortIcon field="size" sortField={sortField} sortDir={sortDir} />
            </th>
            <th onClick={() => onSort("modified")}>
              Modifié <SortIcon field="modified" sortField={sortField} sortDir={sortDir} />
            </th>
            <th>Visibilité</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={`${file.folder}/${file.name}`}>
              <td className="fb-td-checkbox">
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.name)}
                  onChange={() => onToggleSelect(file.name)}
                />
              </td>
              <td>
                <div className="fb-file-name-cell">
                  <div className={`fb-file-icon ${file.folder}`}>{getFolderIcon(file.folder)}</div>
                  <div className="fb-file-name" title={file.name}>{file.name}</div>
                </div>
              </td>
              <td><span className="fb-file-folder">{file.folder}</span></td>
              <td>{formatSize(file.size)}</td>
              <td>{formatDate(file.modified)}</td>
              <td>
                <label className="fb-visibility-label">
                  <input
                    type="checkbox"
                    checked={file.isPrivate}
                    onChange={(e) => onToggleVisibility(file.folder, file.name, e.target.checked)}
                  />
                  <span style={{ color: file.isPrivate ? "var(--fb-danger)" : "var(--fb-text-secondary)" }}>
                    {file.isPrivate ? "\u{1F512} Privé" : "\u{1F513} Public"}
                  </span>
                </label>
              </td>
              <td>
                <div className="fb-file-actions">
                  <button className="fb-action-btn" onClick={() => onPreview(file)} title="Aperçu">
                    &#128065;&#65039;
                  </button>
                  <button
                    className="fb-action-btn"
                    onClick={() => window.open(`/api/download/${file.folder}/${encodeURIComponent(file.name)}`, "_blank")}
                    title="Télécharger"
                  >
                    &#128229;
                  </button>
                  <button className="fb-action-btn delete" onClick={() => onDelete(file)} title="Supprimer">
                    &#128465;&#65039;
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
