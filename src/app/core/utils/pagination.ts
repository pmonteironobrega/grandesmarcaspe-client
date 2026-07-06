const DEFAULT_MAX_VISIBLE = 10;

export function buildPaginationWindow(
  currentPage: number,
  totalPages: number,
  maxVisible = DEFAULT_MAX_VISIBLE,
): number[] {
  if (totalPages <= 1) {
    return [];
  }

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const safeCurrent = Math.min(Math.max(currentPage, 1), totalPages);
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, safeCurrent - half);
  let end = start + maxVisible - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
