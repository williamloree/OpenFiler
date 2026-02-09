import type { BatchBarProps } from "@/types";
import { Button } from "./ui/Button";

export function BatchBar({ selectedCount, onDownload, onDelete, onClear }: BatchBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fb-batch-bar">
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
