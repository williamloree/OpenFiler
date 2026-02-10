import { useState, useEffect } from "react";
import type { ItemProps } from "@/types";
import { formatSize, formatDate, getFolderIcon } from "@/app/dashboard";
import { Button } from "./ui/Button";

const folderIconBg: Record<string, string> = {
  image: "bg-blue-100 text-blue-600",
  video: "bg-pink-100 text-pink-600",
  document: "bg-amber-100 text-amber-600",
};

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
  onShare,
}: ItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isHovered) {
      const timer = setTimeout(() => setIsHovered(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isHovered]);

  const isPreviewable =
    file.folder === "image" ||
    file.folder === "video" ||
    (file.folder === "document" && file.name.toLowerCase().endsWith(".pdf"));

  const handleHover = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isPreviewCell = target.closest("[data-preview-cell]");

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
      className="border-b border-slate-100 transition-colors hover:bg-slate-50/70"
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleHover}
    >
      {/* Checkbox */}
      <td className="w-10 px-4 py-2.5 align-middle">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="h-3.5 w-3.5 cursor-pointer accent-blue-500"
        />
      </td>

      {/* Name */}
      <td className="px-4 py-2.5 align-middle" data-preview-cell>
        <div className="relative flex items-center gap-2.5">
          {/* Hover preview tooltip */}
          {isPreviewable && isHovered && (
            <div
              className="pointer-events-none fixed z-9999 rounded-lg border border-slate-200 bg-white p-1 shadow-xl"
              style={{
                top: previewPos.y,
                left: previewPos.x,
                transform:
                  previewPos.y > 200
                    ? "translate(10px, calc(-100% - 10px))"
                    : "translate(10px, 10px)",
              }}
            >
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
                </div>
              )}
              {file.folder === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt={file.name}
                  onLoad={() => setIsLoading(false)}
                  className="block max-h-40 min-h-12 min-w-12 max-w-40 rounded object-cover"
                />
              )}
              {file.folder === "video" && (
                <video
                  src={file.url}
                  autoPlay
                  muted
                  loop
                  onLoadedData={() => setIsLoading(false)}
                  className="block max-h-50 max-w-50 rounded"
                />
              )}
              {file.folder === "document" && (
                <iframe
                  src={file.url + "#toolbar=0&navpanes=0&scrollbar=0"}
                  onLoad={() => setIsLoading(false)}
                  className="h-50 w-50 rounded border-none bg-white"
                />
              )}
            </div>
          )}

          {/* File icon */}
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm ${folderIconBg[file.folder] ?? "bg-slate-100 text-slate-500"}`}
          >
            {getFolderIcon(file.folder)}
          </div>

          {/* Name / rename input */}
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
              className="w-full truncate rounded-md border border-blue-300 px-2 py-1 text-sm font-medium text-slate-800 outline-none ring-2 ring-blue-100"
            />
          ) : (
            <span
              className="max-w-88 truncate text-sm font-medium text-slate-800"
              title={file.name}
            >
              {file.name}
            </span>
          )}
        </div>
      </td>

      {/* Type */}
      <td className="px-4 py-2.5 align-middle" data-preview-cell>
        <span className="text-xs capitalize text-slate-400">{file.folder}</span>
      </td>

      {/* Size */}
      <td className="px-4 py-2.5 align-middle" data-preview-cell>
        <span className="text-xs text-slate-500">{formatSize(file.size)}</span>
      </td>

      {/* Modified */}
      <td className="px-4 py-2.5 align-middle" data-preview-cell>
        <span className="text-xs text-slate-500">
          {formatDate(file.modified)}
        </span>
      </td>

      {/* Visibility */}
      <td className="px-4 py-2.5 align-middle">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs whitespace-nowrap">
          <input
            type="checkbox"
            checked={file.isPrivate}
            onChange={(e) => onToggleVisibility(e.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer accent-red-500"
          />
          <span className={file.isPrivate ? "text-red-500" : "text-slate-400"}>
            {file.isPrivate ? "🔒 Privé" : "🔓 Public"}
          </span>
        </label>
      </td>

      {/* Actions */}
      <td className="px-4 py-2.5 align-middle">
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={onPreview} title="Aperçu">
            👁️
          </Button>
          <Button variant="ghost" onClick={onStartRename} title="Renommer">
            📝
          </Button>
          <Button variant="ghost" onClick={onShare} title="Partager">
            🔗
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
