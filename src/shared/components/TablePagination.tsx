"use client";

type TablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div className="gp-table-pagination flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="gp-subtitle text-sm">
        {total === 0
          ? "Sin resultados"
          : `Mostrando ${from}–${to} de ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="gp-pagination-btn"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Anterior
        </button>
        <span className="gp-subtitle min-w-[7rem] text-center text-sm">
          Página {safePage} de {totalPages}
        </span>
        <button
          type="button"
          className="gp-pagination-btn"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
