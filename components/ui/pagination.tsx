import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className = "",
}: PaginationProps) {
  return (
    <div className={`ui-pagination-buttons ${className}`}>
      <button
        type="button"
        aria-label="Vorherige Seite"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <button
        type="button"
        className="ui-pagination-current"
        aria-label={`Aktuelle Seite ${page}`}
        aria-current="page"
      >
        {page}
      </button>
      <button
        type="button"
        aria-label="Nächste Seite"
        disabled={page === pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}
