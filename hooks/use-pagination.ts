export function pageWindow(total: number, pageSize: number, page: number) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * pageSize;

  return {
    pageCount,
    currentPage,
    offset,
    rangeStart: total ? offset + 1 : 0,
    rangeEnd: Math.min(offset + pageSize, total),
  };
}
