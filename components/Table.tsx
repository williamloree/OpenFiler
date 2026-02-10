import type { SortField, SortDir, TableProps } from "@/types";
import { Item } from "./Item";

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField === field) {
    return <span className="ml-1 text-[10px] text-blue-400">{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>;
  }
  return <span className="ml-1 text-[10px] opacity-30">{"\u25B2\u25BC"}</span>;
}

export function Table({
  files,
  selectedFiles,
  sortField,
  sortDir,
  renamingFile,
  renameValue,
  onSort,
  onToggleSelectAll,
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
}: TableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className="w-10 border-b border-slate-200 bg-slate-50 p-2.5 px-4">
            <input
              type="checkbox"
              checked={selectedFiles.size === files.length && files.length > 0}
              onChange={onToggleSelectAll}
              className="h-3.5 w-3.5 cursor-pointer accent-blue-500"
            />
          </th>
          <th
            onClick={() => onSort("name")}
            className="cursor-pointer select-none border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold whitespace-nowrap text-slate-400 transition-colors hover:text-slate-700"
          >
            Nom <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
          </th>
          <th
            onClick={() => onSort("folder")}
            className="cursor-pointer select-none border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold whitespace-nowrap text-slate-400 transition-colors hover:text-slate-700"
          >
            Type <SortIcon field="folder" sortField={sortField} sortDir={sortDir} />
          </th>
          <th
            onClick={() => onSort("size")}
            className="cursor-pointer select-none border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold whitespace-nowrap text-slate-400 transition-colors hover:text-slate-700"
          >
            Taille <SortIcon field="size" sortField={sortField} sortDir={sortDir} />
          </th>
          <th
            onClick={() => onSort("modified")}
            className="cursor-pointer select-none border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold whitespace-nowrap text-slate-400 transition-colors hover:text-slate-700"
          >
            Modifié <SortIcon field="modified" sortField={sortField} sortDir={sortDir} />
          </th>
          <th className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
            Visibilité
          </th>
          <th className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {files.map((file) => (
          <Item
            key={`${file.folder}/${file.name}`}
            file={file}
            selected={selectedFiles.has(file.name)}
            isRenaming={renamingFile?.name === file.name && renamingFile?.folder === file.folder}
            renameValue={renameValue}
            onSelect={() => onSelect(file.name)}
            onToggleVisibility={(isPrivate) => onToggleVisibility(file.folder, file.name, isPrivate)}
            onPreview={() => onPreview(file)}
            onStartRename={() => onStartRename(file)}
            onRenameChange={onRenameChange}
            onRenameConfirm={() => onRenameConfirm(file)}
            onRenameCancel={onRenameCancel}
            onDownload={() => onDownload(file)}
            onDelete={() => onDelete(file)}
            onShare={() => onShare(file)}
          />
        ))}
      </tbody>
    </table>
  );
}
