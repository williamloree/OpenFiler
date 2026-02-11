import type { TrackingDetailTableProps } from "@/types";
import { formatDate } from "@/app/dashboard";

export function TrackingDetailTable({ views }: TrackingDetailTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
            Action
          </th>
          <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
            Utilisateur
          </th>
          <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
            IP
          </th>
          <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
            Navigateur
          </th>
          <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
            Source
          </th>
          <th className="sticky top-0 z-5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-xs font-semibold text-slate-400">
            Date
          </th>
        </tr>
      </thead>
      <tbody>
        {views.map((view) => (
          <tr
            key={view.id}
            className="border-b border-slate-100 transition-colors hover:bg-slate-50/70"
          >
            <td className="px-4 py-2.5 text-sm">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  view.action === "download"
                    ? "bg-green-100 text-green-700"
                    : view.action === "share_view"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {view.action === "preview"
                  ? "Aperçu"
                  : view.action === "download"
                    ? "Téléchargement"
                    : "Lien partagé"}
              </span>
            </td>
            <td className="px-4 py-2.5 text-xs text-slate-500">
              {view.userId ?? "Anonyme"}
            </td>
            <td className="px-4 py-2.5 text-xs text-slate-500">
              {view.ipAddress ?? "-"}
            </td>
            <td className="max-w-40 truncate px-4 py-2.5 text-xs text-slate-500">
              {view.userAgent ?? "-"}
            </td>
            <td className="max-w-32 truncate px-4 py-2.5 text-xs text-slate-500">
              {view.referer ?? "-"}
            </td>
            <td className="px-4 py-2.5 text-xs text-slate-500">
              {formatDate(view.viewedAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
