import { useState, useEffect } from "react";
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
  const [isHovered, setIsHovered] = useState(false);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isHovered) {
      const timer = setTimeout(() => {
        setIsHovered(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isHovered]);

  const isPreviewable =
    file.folder === "image" ||
    file.folder === "video" ||
    (file.folder === "document" && file.name.toLowerCase().endsWith(".pdf"));

  const handleHover = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isPreviewCell = target.closest(".fb-td-preview");

    if (isPreviewCell && isPreviewable) {
      if (!isHovered) {
        setIsHovered(true);
        setIsLoading(true);
      }
      setPreviewPos({ x: e.clientX, y: e.clientY });
    } else if (isHovered) {
      setIsHovered(false);
    }
  };

  return (
    <tr
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleHover}
    >
      <td className="fb-td-checkbox">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
        />
      </td>
      <td className="fb-td-preview">
        <div className="fb-file-name-cell" style={{ position: "relative" }}>
          {isPreviewable && isHovered && (
            <div
              style={{
                position: "fixed",
                top: previewPos.y,
                left: previewPos.x,
                transform: previewPos.y > 200 ? "translate(10px, calc(-100% - 10px))" : "translate(10px, 10px)",
                zIndex: 9999,
                backgroundColor: "white",
                padding: "4px",
                borderRadius: "6px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                border: "1px solid #e5e7eb",
                pointerEvents: "none",
              }}
            >
              {isLoading && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "white",
                    zIndex: 10,
                    borderRadius: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      border: "2px solid #e5e7eb",
                      borderTopColor: "#3b82f6",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}
              {file.folder === "image" && (
                <img
                  src={file.url}
                  alt={file.name}
                  onLoad={() => setIsLoading(false)}
                  style={{
                    maxWidth: "160px",
                    maxHeight: "160px",
                    minWidth: "50px",
                    minHeight: "50px",
                    objectFit: "cover",
                    borderRadius: "4px",
                    display: "block",
                  }}
                />
              )}
              {file.folder === "video" && (
                <video
                  src={file.url}
                  autoPlay
                  muted
                  loop
                  onLoadedData={() => setIsLoading(false)}
                  style={{
                    maxWidth: "200px",
                    maxHeight: "200px",
                    borderRadius: "4px",
                    display: "block",
                  }}
                />
              )}
              {file.folder === "document" && (
                <iframe
                  src={file.url + "#toolbar=0&navpanes=0&scrollbar=0"}
                  onLoad={() => setIsLoading(false)}
                  style={{
                    width: "200px",
                    height: "200px",
                    border: "none",
                    borderRadius: "4px",
                    backgroundColor: "white",
                  }}
                />
              )}
            </div>
          )}
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
      <td className="fb-td-preview"><span className="fb-file-folder">{file.folder}</span></td>
      <td className="fb-td-preview">{formatSize(file.size)}</td>
      <td className="fb-td-preview">{formatDate(file.modified)}</td>
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
