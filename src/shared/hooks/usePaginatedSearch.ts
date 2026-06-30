"use client";

import { useEffect, useMemo, useState } from "react";

export function usePaginatedSearch<T>(
  items: T[],
  filterFn: (item: T, query: string) => boolean,
  pageSize = 10,
) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => items.filter((item) => filterFn(item, search)),
    [items, search, filterFn],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return {
    search,
    setSearch,
    page: safePage,
    setPage,
    filtered,
    paginated,
    total: filtered.length,
    pageSize,
  };
}
