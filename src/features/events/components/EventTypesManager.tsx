"use client";

import { useMemo, useState } from "react";
import { Button, Card, Spinner } from "@heroui/react";
import ArrowDownFromLine from "@gravity-ui/icons/ArrowDownFromLine";
import Plus from "@gravity-ui/icons/Plus";
import TrashBin from "@gravity-ui/icons/TrashBin";
import type { EventTypeRecord } from "@/src/features/events/types";
import { TablePagination } from "@/src/shared/components/TablePagination";
import { usePaginatedSearch } from "@/src/shared/hooks/usePaginatedSearch";
import { gp } from "@/src/shared/ui/theme";
import { appToast } from "@/src/shared/utils/app-toast";
import { isFailedEventKey } from "../lib/event-display";

const PAGE_SIZE = 12;

type EventTypesManagerProps = {
  types: EventTypeRecord[];
  loading: boolean;
  onCreate: (input: { key: string; name: string; description?: string }) => Promise<EventTypeRecord>;
  onDelete: (id: number) => Promise<void>;
  onRefetch: () => void;
};

function matchesType(type: EventTypeRecord, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    type.key.toLowerCase().includes(q) ||
    type.name.toLowerCase().includes(q) ||
    (type.description ?? "").toLowerCase().includes(q)
  );
}

export function EventTypesManager({
  types,
  loading,
  onCreate,
  onDelete,
  onRefetch,
}: EventTypesManagerProps) {
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [typeKey, setTypeKey] = useState("");
  const [typeName, setTypeName] = useState("");
  const [typeDesc, setTypeDesc] = useState("");
  const [importResult, setImportResult] = useState<{ ok: number; errors: number } | null>(null);
  const [kindFilter, setKindFilter] = useState<"all" | "ok" | "failed">("all");

  const scopedTypes = useMemo(() => {
    if (kindFilter === "all") return types;
    if (kindFilter === "failed") return types.filter((t) => isFailedEventKey(t.key));
    return types.filter((t) => !isFailedEventKey(t.key));
  }, [types, kindFilter]);

  const {
    search,
    setSearch,
    page,
    setPage,
    paginated,
    total,
  } = usePaginatedSearch(scopedTypes, matchesType, PAGE_SIZE);

  const okCount = types.filter((t) => !isFailedEventKey(t.key)).length;
  const failedCount = types.length - okCount;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate({
        key: typeKey.trim(),
        name: typeName.trim(),
        description: typeDesc.trim() || undefined,
      });
      setTypeKey("");
      setTypeName("");
      setTypeDesc("");
      setShowForm(false);
      appToast.success("Tipo de evento creado");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al crear tipo");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await onDelete(id);
      appToast.success("Tipo eliminado");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al eliminar tipo");
    }
  }

  async function handleImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) throw new Error("El CSV debe tener encabezado y al menos una fila");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const keyIdx = headers.indexOf("key");
      const nameIdx = headers.indexOf("name");
      if (keyIdx === -1 || nameIdx === -1) {
        throw new Error("El CSV debe tener columnas 'key' y 'name'");
      }
      let ok = 0;
      let errors = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        const key = cols[keyIdx];
        const name = cols[nameIdx];
        const description = cols[headers.indexOf("description")] ?? "";
        if (!key || !name) {
          errors++;
          continue;
        }
        try {
          await onCreate({ key, name, description: description || undefined });
          ok++;
        } catch {
          errors++;
        }
      }
      setImportResult({ ok, errors });
      if (errors === 0) appToast.success(`${ok} tipos importados`);
      else appToast.warning(`${ok} importados, ${errors} con errores`);
      onRefetch();
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al importar CSV");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,340px)_1fr]">
      <Card className={`${gp.card} px-5 py-4`}>
        <h3 className="text-sm font-semibold text-[var(--gp-text)]">Catálogo de tipos</h3>
        <p className={`${gp.subtitle} mt-1 text-sm`}>
          {types.length} tipos · {okCount} OK · {failedCount} fallidos
        </p>

        <div className="mt-4 space-y-3">
          <Button
            size="sm"
            variant={showForm ? "primary" : "ghost"}
            onPress={() => setShowForm((v) => !v)}
          >
            <Plus width={14} height={14} />
            {showForm ? "Ocultar formulario" : "Nuevo tipo"}
          </Button>

          {showForm && (
            <form onSubmit={handleCreate} className="space-y-3 rounded-lg bg-[var(--gp-elevated)] p-3">
              <label className={gp.label}>
                Key
                <input
                  value={typeKey}
                  onChange={(e) => setTypeKey(e.target.value)}
                  required
                  placeholder="order.created"
                  className={gp.input}
                />
              </label>
              <label className={gp.label}>
                Nombre
                <input
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  required
                  placeholder="Pedido creado"
                  className={gp.input}
                />
              </label>
              <label className={gp.label}>
                Descripción
                <input
                  value={typeDesc}
                  onChange={(e) => setTypeDesc(e.target.value)}
                  placeholder="Opcional"
                  className={gp.input}
                />
              </label>
              <Button
                type="submit"
                size="sm"
                isDisabled={submitting}
                style={{ backgroundColor: "var(--gp-primary)", color: "var(--gp-primary-text)" }}
              >
                {submitting ? <Spinner size="sm" /> : "Guardar tipo"}
              </Button>
            </form>
          )}

          <div className="rounded-lg border border-dashed border-[var(--gp-card-border)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]">
              Importar CSV
            </p>
            <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
              Columnas: key, name, description
            </p>
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md bg-[var(--gp-elevated)] px-3 py-2 text-sm hover:opacity-80">
              <ArrowDownFromLine width={16} height={16} />
              {importing ? "Importando…" : "Seleccionar archivo"}
              <input
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={handleImportCsv}
                disabled={importing}
              />
            </label>
            {importResult && (
              <p className="mt-2 text-xs text-[var(--gp-text-muted)]">
                {importResult.ok} importados
                {importResult.errors > 0 ? ` · ${importResult.errors} errores` : ""}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className={`${gp.card} overflow-hidden`}>
        <div className="border-b px-5 py-4" style={{ borderColor: "var(--gp-card-border)" }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por key o nombre…"
              className={`${gp.input} max-w-md`}
            />
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: "all", label: "Todos" },
                  { key: "ok", label: "OK" },
                  { key: "failed", label: "Fallidos" },
                ] as const
              ).map((item) => (
                <Button
                  key={item.key}
                  size="sm"
                  variant={kindFilter === item.key ? "primary" : "ghost"}
                  onPress={() => setKindFilter(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="sm" />
          </div>
        ) : types.length === 0 ? (
          <p className={`${gp.subtitle} px-5 py-10 text-center text-sm`}>No hay tipos registrados</p>
        ) : (
          <>
            <ul className="divide-y" style={{ borderColor: "var(--gp-card-border)" }}>
              {paginated.map((t) => (
                <li
                  key={t.id}
                  className="flex items-start justify-between gap-3 px-5 py-3 transition-colors hover:bg-[var(--gp-elevated)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-[var(--gp-text)]">{t.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          isFailedEventKey(t.key)
                            ? "bg-red-500/15 text-red-600"
                            : "bg-emerald-500/15 text-emerald-600"
                        }`}
                      >
                        {isFailedEventKey(t.key) ? "failed" : "ok"}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-[var(--gp-text-muted)]">{t.key}</p>
                    {t.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--gp-text-muted)]">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-md p-1.5 text-[var(--gp-text-muted)] hover:bg-red-500/10 hover:text-red-500"
                    onClick={() => handleDelete(t.id)}
                    aria-label={`Eliminar ${t.key}`}
                  >
                    <TrashBin width={14} height={14} />
                  </button>
                </li>
              ))}
            </ul>
            <TablePagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
