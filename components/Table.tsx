import { FileInfo, SortField, SortDir } from "@/app/dashboard/file-browser";
import { Item } from "./Item";

interface TableProps {
  files: FileInfo[];
  selectedFiles: Set<string>;
  sortField: SortField;
  sortDir: SortDir;
  renamingFile: FileInfo | null;
  renameValue: string;
  onSort: (field: SortField) => void;
  onToggleSelectAll: () => void;
  onSelect: (filename: string) => void;
  onToggleVisibility: (folder: string, name: string, isPrivate: boolean) => void;
  onPreview: (file: FileInfo) => void;
  onStartRename: (file: FileInfo) => void;
  onRenameChange: (value: string) => void;
  onRenameConfirm: (file: FileInfo) => void;
  onRenameCancel: () => void;
  onDownload: (file: FileInfo) => void;
  onDelete: (file: FileInfo) => void;
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField === field) {
    return <span className="fb-sort-icon">{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>;
  }
  return <span className="fb-sort-icon">{"\u25B2\u25BC"}</span>;
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
}: TableProps) {
  return (
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
          />
        ))}
      </tbody>
    </table>
  );
}
