export function parseMaxRecordsLimit(
  value: unknown,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (value === undefined) {
    return { ok: true, value: null };
  }
  if (value === null || value === "") {
    return { ok: true, value: null };
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return {
      ok: false,
      error: "El límite máximo de registros debe ser un entero mayor o igual a 0",
    };
  }

  return { ok: true, value: parsed };
}

export function formatMaxRecordsLimit(limit: number | null | undefined): string {
  if (limit == null) return "Ilimitado";
  return limit.toLocaleString("es-PE");
}
