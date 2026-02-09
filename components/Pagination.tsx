import type { PaginationProps } from "@/types";
import { Button } from "./ui/Button";

export function Pagination({ totalFiles, pageLimit, page, onPageChange }: PaginationProps) {
  if (totalFiles <= pageLimit) return null;

  const totalPages = Math.ceil(totalFiles / pageLimit);

  return (
    <div className="fb-batch-bar" style={{ justifyContent: "center" }}>
      <Button
        variant="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Précédent
      </Button>
      <span style={{ fontSize: 14 }}>
        Page {page} sur {totalPages}
      </span>
      <Button
        variant="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Suivant
      </Button>
    </div>
  );
}
