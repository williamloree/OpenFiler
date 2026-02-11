import type { TrackingTableProps, TrackingSortField } from "@/types";
import { formatDate, getFolderIcon } from "@/app/dashboard";

function SortIndicator({
  field,
  sortField,
  sortDir,
}: {
  field: TrackingSortField;
  sortField: TrackingSortField;
  sortDir: "asc" | "desc";
}) {
  if (sortField !== field) return null;
  return <>{sortDir === "asc" ? " ▲" : " ▼"}</>;
}

export function TrackingTable({
  files,
  selectedFiles,
  sortField,
  sortDir,
  onSort,
  onToggleSelectAll,
  onToggleSelect,
  onSelect,
}: TrackingTableProps) {
  const thClass =
    "sticky top-0 z-5 cursor-pointer border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400 hover:text-slate-700";

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className="sticky top-0 z-5 w-10 border-b border-slate-200 bg-slate-50 p-2.5 px-4">
            <input
              type="checkbox"
              checked={selectedFiles.size === files.length && files.length > 0}
              onChange={onToggleSelectAll}
              className="h-3.5 w-3.5 cursor-pointer accent-blue-500"
            />
          </th>
          <th onClick={() => onSort("filename")} className={thClass}>
            Nom
            <SortIndicator
              field="filename"
              sortField={sortField}
              sortDir={sortDir}
            />
          </th>
          <th onClick={() => onSort("folder")} className={thClass}>
            Type
            <SortIndicator
              field="folder"
              sortField={sortField}
              sortDir={sortDir}
            />
          </th>
          <th onClick={() => onSort("totalViews")} className={thClass}>
            Vues
            <SortIndicator
              field="totalViews"
              sortField={sortField}
              sortDir={sortDir}
            />
          </th>
          <th onClick={() => onSort("uniqueViewers")} className={thClass}>
            Visiteurs uniques
            <SortIndicator
              field="uniqueViewers"
              sortField={sortField}
              sortDir={sortDir}
            />
          </th>
          <th onClick={() => onSort("downloadCount")} className={thClass}>
            Téléchargements
            <SortIndicator
              field="downloadCount"
              sortField={sortField}
              sortDir={sortDir}
            />
          </th>
          <th onClick={() => onSort("lastViewedAt")} className={thClass}>
            Dernier accès
            <SortIndicator
              field="lastViewedAt"
              sortField={sortField}
              sortDir={sortDir}
            />
          </th>
        </tr>
      </thead>
      <tbody>
        {files.map((file) => {
          const key = `${file.folder}/${file.filename}`;
          return (
            <tr
              key={key}
              className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50/70"
              onClick={() => onSelect(file.folder, file.filename)}
            >
              <td
                className="w-10 px-4 py-2.5 align-middle"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(key)}
                  onChange={() => onToggleSelect(key)}
                  className="h-3.5 w-3.5 cursor-pointer accent-blue-500"
                />
              </td>
              <td className="px-4 py-2.5 text-sm font-medium text-slate-800">
                {file.filename}
              </td>
              <td className="px-4 py-2.5 text-sm text-slate-500">
                {getFolderIcon(file.folder)} {file.folder}
              </td>
              <td className="px-4 py-2.5 text-sm font-semibold text-slate-600">
                {file.totalViews}
              </td>
              <td className="px-4 py-2.5 text-sm text-slate-500">
                {file.uniqueViewers}
              </td>
              <td className="px-4 py-2.5 text-sm text-slate-500">
                {file.downloadCount}
              </td>
              <td className="px-4 py-2.5 text-xs text-slate-500">
                {file.lastViewedAt ? formatDate(file.lastViewedAt) : "-"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
