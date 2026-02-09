import type { ItemProps } from "@/types";
import { formatSize, formatDate, getFolderIcon } from "@/app/dashboard/file-browser";
import { Button } from "./ui/Button";

export function Item({
  file,
  selected,
  isRenaming,
  renameValue,
  onSelect,
  onToggleVisibility,
  onPreview,
  onStartRename,
  onRenameChange,
  onRenameConfirm,
  onRenameCancel,
  onDownload,
  onDelete,
}: ItemProps) {
  return (
    <tr>
      <td className="fb-td-checkbox">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
        />
      </td>
      <td>
        <div className="fb-file-name-cell">
          <div className={`fb-file-icon ${file.folder}`}>{getFolderIcon(file.folder)}</div>
          {isRenaming ? (
            <input
              autoFocus
              type="text"
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onRenameConfirm();
                if (e.key === "Escape") onRenameCancel();
              }}
              onBlur={onRenameConfirm}
              className="fb-file-name"
              style={{ border: "1px solid var(--fb-primary)", borderRadius: 4, padding: "2px 6px", outline: "none", width: "100%" }}
            />
          ) : (
            <div className="fb-file-name" title={file.name}>{file.name}</div>
          )}
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
            onChange={(e) => onToggleVisibility(e.target.checked)}
          />
          <span style={{ color: file.isPrivate ? "var(--fb-danger)" : "var(--fb-text-secondary)" }}>
            {file.isPrivate ? "🔒 Privé" : "🔓 Public"}
          </span>
        </label>
      </td>
      <td>
        <div className="fb-file-actions">
          <Button variant="ghost" onClick={onPreview} title="Aperçu">
            👁️
          </Button>
          <Button variant="ghost" onClick={onStartRename} title="Renommer">
            📝
          </Button>
          <Button variant="ghost" onClick={onDownload} title="Télécharger">
            📥
          </Button>
          <Button variant="danger" onClick={onDelete} title="Supprimer">
            🗑️
          </Button>
        </div>
      </td>
    </tr>
  );
}
