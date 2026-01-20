import type { HTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export interface PaginationProps extends HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  boundaryCount?: number;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  showPageNumbers?: boolean;
  showInfo?: boolean;
  totalItems?: number;
  pageSize?: number;
  disabled?: boolean;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  boundaryCount = 1,
  showFirstLast = true,
  showPrevNext = true,
  showPageNumbers = true,
  showInfo = true,
  totalItems,
  pageSize,
  disabled = false,
  className,
  ...props
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  // Generate page numbers to display
  const generatePageNumbers = () => {
    const totalNumbers = siblingCount * 2 + 3;
    const totalBlocks = totalNumbers + 2;

    if (totalPages > totalBlocks) {
      const startPage = Math.max(2, currentPage - siblingCount);
      const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

      let pages: (number | 'ellipsis')[] = [];

      // Add first page
      if (startPage > boundaryCount + 1) {
        pages = Array.from(
          { length: boundaryCount },
          (_, i) => i + 1
        );
        pages.push('ellipsis');
      } else {
        pages = Array.from(
          { length: Math.min(boundaryCount * 2 + 1, totalPages) },
          (_, i) => i + 1
        );
      }

      // Add middle pages
      if (startPage > boundaryCount + 1 && endPage < totalPages - boundaryCount) {
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        for (let i = totalPages - boundaryCount + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else if (endPage < totalPages - boundaryCount) {
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (startPage > boundaryCount + 1) {
        pages.push('ellipsis');
        for (let i = totalPages - boundaryCount * 2; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = startPage; i <= totalPages; i++) {
          pages.push(i);
        }
      }

      return pages;
    }

    return Array.from({ length: totalPages }, (_, i) => i + 1);
  };

  const pageNumbers = generatePageNumbers();

  const getItemRange = () => {
    if (!totalItems || !pageSize) return null;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    return `${start}-${end} of ${totalItems}`;
  };

  const handlePageClick = (page: number) => {
    if (page === currentPage || disabled) return;
    onPageChange(page);
  };

  const PaginationButton = ({ 
    page, 
    children,
    isActive = false,
    isEllipsis = false
  }: {
    page: number | 'ellipsis';
    children: React.ReactNode;
    isActive?: boolean;
    isEllipsis?: boolean;
  }) => (
    <button
      type="button"
      onClick={() => page !== 'ellipsis' && handlePageClick(page)}
      disabled={disabled || page === 'ellipsis' || isActive}
      className={cn(
        'flex items-center justify-center min-w-[40px] h-10 px-3 text-sm font-medium transition-all duration-200 rounded-md touch-target',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'hover:bg-secondary text-foreground',
        disabled && 'opacity-50 cursor-not-allowed',
        isEllipsis && 'cursor-default hover:bg-transparent'
      )}
      aria-current={isActive ? 'page' : undefined}
      aria-label={page === 'ellipsis' ? 'More pages' : `Go to page ${page}`}
    >
      {children}
    </button>
  );

  return (
    <div className={cn('flex items-center justify-between', className)} {...props}>
      {/* Page Info */}
      {showInfo && getItemRange() && (
        <div className="text-sm text-muted-foreground hidden sm:block">
          Showing {getItemRange()}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex items-center space-x-1" aria-label="Pagination">
        {/* First Page */}
        {showFirstLast && totalPages > 1 && (
          <PaginationButton page={1}>
            <span className="sr-only">First page</span>
            <span className="hidden sm:inline">First</span>
            <span className="inline sm:hidden">1</span>
          </PaginationButton>
        )}

        {/* Previous Page */}
        {showPrevNext && (
          <PaginationButton page={currentPage - 1}>
            <span className="sr-only">Previous page</span>
            <ChevronLeft className="w-4 h-4" />
          </PaginationButton>
        )}

        {/* Page Numbers */}
        {showPageNumbers && pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center min-w-[40px] h-10 px-3"
                aria-hidden="true"
              >
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </span>
            );
          }

          return (
            <PaginationButton
              key={page}
              page={page}
              isActive={page === currentPage}
            >
              {page}
            </PaginationButton>
          );
        })}

        {/* Next Page */}
        {showPrevNext && (
          <PaginationButton page={currentPage + 1}>
            <span className="sr-only">Next page</span>
            <ChevronRight className="w-4 h-4" />
          </PaginationButton>
        )}

        {/* Last Page */}
        {showFirstLast && totalPages > 1 && (
          <PaginationButton page={totalPages}>
            <span className="sr-only">Last page</span>
            <span className="hidden sm:inline">Last</span>
            <span className="inline sm:hidden">{totalPages}</span>
          </PaginationButton>
        )}
      </nav>

      {/* Mobile Info */}
      {showInfo && (
        <div className="text-sm text-muted-foreground sm:hidden">
          Page {currentPage} of {totalPages}
        </div>
      )}
    </div>
  );
};

export default Pagination;