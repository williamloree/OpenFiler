import type { PaginationProps } from "@/types";
import { Button } from "./ui/Button";

export function Pagination({ totalFiles, pageLimit, page, onPageChange }: PaginationProps) {
  if (totalFiles <= pageLimit) return null;

  const totalPages = Math.ceil(totalFiles / pageLimit);

  return (
    <div className="flex items-center justify-center gap-3 bg-blue-500 px-6 py-2.5 text-sm text-white">
      <Button
        variant="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Précédent
      </Button>
      <span className="text-sm">
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
