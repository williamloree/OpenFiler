"use client";

interface BatchBarProps {
  count: number;
  onDelete: () => void;
  onCancel: () => void;
}

export function BatchBar({ count, onDelete, onCancel }: BatchBarProps) {
  if (count === 0) return null;

  return (
    <div className="fb-batch-bar">
      <span>
        <strong>{count}</strong> fichier(s) sélectionné(s)
      </span>
      <button className="fb-btn fb-btn-sm" onClick={onDelete}>
        Supprimer la sélection
      </button>
      <button className="fb-btn fb-btn-sm" onClick={onCancel}>
        Annuler
      </button>
    </div>
  );
}
