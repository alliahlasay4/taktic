import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemName = 'items',
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  if (totalItems === 0) return null;

  const startItem = (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers to show (e.g. 1 ... 4 5 6 ... 10)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      const leftBound = Math.max(2, safeCurrentPage - 1);
      const rightBound = Math.min(totalPages - 1, safeCurrentPage + 1);

      if (leftBound > 2) {
        pages.push('ellipsis-left');
      }

      for (let i = leftBound; i <= rightBound; i++) {
        pages.push(i);
      }

      if (rightBound < totalPages - 1) {
        pages.push('ellipsis-right');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] ${className}`}
      aria-label="Pagination Navigation"
    >
      {/* Left side: Item counter & Page Size Selector */}
      <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
        <span>
          Showing <strong className="text-[var(--text-primary)] font-semibold">{startItem}</strong>–
          <strong className="text-[var(--text-primary)] font-semibold">{endItem}</strong> of{' '}
          <strong className="text-[var(--text-primary)] font-semibold">{totalItems}</strong> {itemName}
        </span>

        {onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 1 && totalItems > pageSizeOptions[0] && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-[var(--border-subtle)]">
            <span className="text-[11px] text-[var(--text-muted)]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              aria-label={`Select number of ${itemName} per page`}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-terracotta)] cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Page Navigation Controls */}
      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          {/* First Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safeCurrentPage === 1}
            aria-label="Go to first page"
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>

          {/* Previous Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage === 1}
            aria-label="Go to previous page"
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 mx-1">
            {pageNumbers.map((p, idx) => {
              if (typeof p === 'string') {
                return (
                  <span key={`${p}-${idx}`} className="px-1 text-[var(--text-muted)] select-none">
                    …
                  </span>
                );
              }

              const isCurrent = p === safeCurrentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  aria-current={isCurrent ? 'page' : undefined}
                  aria-label={`Go to page ${p}`}
                  className={`min-w-[30px] h-[30px] flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'bg-[var(--accent-terracotta)] text-white shadow-2xs'
                      : 'border border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage === totalPages}
            aria-label="Go to next page"
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {/* Last Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={safeCurrentPage === totalPages}
            aria-label="Go to last page"
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      )}
    </div>
  );
};
