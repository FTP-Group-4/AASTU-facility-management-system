import { useState, useMemo } from 'react';

interface UsePaginationProps {
  totalItems: number;
  pageSize: number;
  initialPage?: number;
  siblingCount?: number;
  boundaryCount?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirst: () => void;
  goToLast: () => void;
  getPaginationRange: () => (number | 'ellipsis')[];
  getItemRange: () => { start: number; end: number };
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function usePagination({
  totalItems,
  pageSize,
  initialPage = 1,
  siblingCount = 1,
  boundaryCount = 1,
}: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const totalPages = Math.ceil(totalItems / pageSize);

  const getPaginationRange = (): (number | 'ellipsis')[] => {
    const totalNumbers = siblingCount * 2 + 3;
    const totalBlocks = totalNumbers + 2;

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftBoundary = boundaryCount;
    const rightBoundary = totalPages - boundaryCount + 1;
    const leftSibling = Math.max(currentPage - siblingCount, leftBoundary + 1);
    const rightSibling = Math.min(currentPage + siblingCount, rightBoundary - 1);

    const showLeftEllipsis = leftSibling > leftBoundary + 1;
    const showRightEllipsis = rightSibling < rightBoundary - 1;

    const pages: (number | 'ellipsis')[] = [];

    // Add left boundary
    for (let i = 1; i <= leftBoundary; i++) {
      pages.push(i);
    }

    // Add left ellipsis
    if (showLeftEllipsis) {
      pages.push('ellipsis');
    }

    // Add sibling pages
    for (let i = leftSibling; i <= rightSibling; i++) {
      pages.push(i);
    }

    // Add right ellipsis
    if (showRightEllipsis) {
      pages.push('ellipsis');
    }

    // Add right boundary
    for (let i = rightBoundary; i <= totalPages; i++) {
      pages.push(i);
    }

    return pages;
  };

  const getItemRange = () => {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    return { start, end };
  };

  const setPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToFirst = () => {
    setCurrentPage(1);
  };

  const goToLast = () => {
    setCurrentPage(totalPages);
  };

  return {
    currentPage,
    totalPages,
    pageSize,
    setPage,
    nextPage,
    prevPage,
    goToFirst,
    goToLast,
    getPaginationRange,
    getItemRange,
    canGoNext: currentPage < totalPages,
    canGoPrev: currentPage > 1,
  };
}