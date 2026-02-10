import type { BatchBarProps } from "@/types";
import { Button } from "./ui/Button";

export function BatchBar({ selectedCount, onDownload, onDelete, onClear }: BatchBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 bg-blue-500 px-6 py-2.5 text-sm text-white">
      <span>
        <strong>{selectedCount}</strong> fichier(s) sélectionné(s)
      </span>
      <Button variant="sm" onClick={onDownload}>
        Télécharger (.zip)
      </Button>
      <Button variant="sm" onClick={onDelete}>
        Supprimer la sélection
      </Button>
      <Button variant="sm" onClick={onClear}>
        Annuler
      </Button>
    </div>
  );
}
