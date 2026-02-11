import type { TrashTableProps } from "@/types";
import { formatSize, formatDate, getFolderIcon } from "@/app/dashboard";
import { Button } from "../ui/Button";

export function TrashTable({
  items,
  selectedItems,
  onToggleSelectAll,
  onToggleSelect,
  onRestore,
  onDelete,
}: TrashTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className="sticky top-0 z-5 w-10 border-b border-slate-200 bg-slate-50 p-2.5 px-4">
            <input
              type="checkbox"
              checked={selectedItems.size === items.length && items.length > 0}
              onChange={onToggleSelectAll}
              className="h-3.5 w-3.5 cursor-pointer accent-blue-500"
            />
          </th>
          <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
            Nom
          </th>
          <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
            Dossier d&apos;origine
          </th>
          <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
            Taille
          </th>
          <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
            Supprimé le
          </th>
          <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr
            key={item.id}
            className="border-b border-slate-100 transition-colors hover:bg-slate-50/70"
          >
            <td className="w-10 px-4 py-2.5 align-middle">
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={() => onToggleSelect(item.id)}
                className="h-3.5 w-3.5 cursor-pointer accent-blue-500"
              />
            </td>
            <td className="px-4 py-2.5 text-sm font-medium text-slate-800">
              {item.filename}
            </td>
            <td className="px-4 py-2.5 text-sm text-slate-500">
              {getFolderIcon(item.originalFolder)} {item.originalFolder}
            </td>
            <td className="px-4 py-2.5 text-xs text-slate-500">
              {formatSize(item.size)}
            </td>
            <td className="px-4 py-2.5 text-xs text-slate-500">
              {formatDate(item.deletedAt)}
            </td>
            <td className="px-4 py-2.5">
              <div className="flex gap-1">
                <Button variant="outline" onClick={() => onRestore(item)}>
                  Restaurer
                </Button>
                <Button variant="danger" onClick={() => onDelete(item)}>
                  Supprimer
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
