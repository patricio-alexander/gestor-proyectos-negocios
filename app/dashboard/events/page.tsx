"use client";

import {
  Button,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import { appToast } from "@/src/shared/utils/app-toast";
import ClockArrowRotateLeft from "@gravity-ui/icons/ClockArrowRotateLeft";
import Plus from "@gravity-ui/icons/Plus";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Eye from "@gravity-ui/icons/Eye";
import ArrowDownFromLine from "@gravity-ui/icons/ArrowDownFromLine";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useEvents } from "@/src/features/events/hooks/useEvents";
import { useEventTypes } from "@/src/features/events/hooks/useEventTypes";
import type { EventRecord } from "@/src/features/events/types";
import { ManagerHeader } from "@/src/shared/components/TableSearchBar";
import { TablePagination } from "@/src/shared/components/TablePagination";
import { usePaginatedSearch } from "@/src/shared/hooks/usePaginatedSearch";
import { gp } from "@/src/shared/ui/theme";

const COLORS = [
  "#2563eb", "#f97316", "#22c55e", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#eab308", "#14b8a6", "#6366f1",
];

const RANGES = [
  { key: "1D", label: "1D" },
  { key: "1S", label: "1S" },
  { key: "1M", label: "1M" },
  { key: "3M", label: "3M" },
  { key: "TODO", label: "Todo" },
];

const PAGE_SIZE = 15;

function matchesEvent(event: EventRecord, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    event.name.toLowerCase().includes(q) ||
    (event.type?.name ?? "").toLowerCase().includes(q) ||
    String(event.app_id).includes(q)
  );
}

export default function EventsPage() {
  const [range, setRange] = useState("TODO");
  const { events, apps, loading, refetch } = useEvents(range);
  const { types: eventTypes, loading: typesLoading, create: createType, remove: deleteType, refetch: refetchTypes } = useEventTypes();
  const [submitting, setSubmitting] = useState(false);
  const [detailEvent, setDetailEvent] = useState<EventRecord | null>(null);

  const [typeKey, setTypeKey] = useState("");
  const [typeName, setTypeName] = useState("");
  const [typeDesc, setTypeDesc] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; errors: number } | null>(null);

  const detailState = useOverlayState();

  const {
    search,
    setSearch,
    page,
    setPage,
    paginated: paginatedEvents,
    total: filteredTotal,
  } = usePaginatedSearch(events, matchesEvent, PAGE_SIZE);

  async function handleCreateType(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createType({ key: typeKey.trim(), name: typeName.trim(), description: typeDesc.trim() || undefined });
      setTypeKey("");
      setTypeName("");
      setTypeDesc("");
      appToast.success("Tipo de evento creado");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al crear tipo");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteType(id: number) {
    try {
      await deleteType(id);
      appToast.success("Tipo de evento eliminado");
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
      if (lines.length < 2) throw new Error("El CSV debe tener un encabezado y al menos una fila");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const keyIdx = headers.indexOf("key");
      const nameIdx = headers.indexOf("name");
      if (keyIdx === -1 || nameIdx === -1) throw new Error("El CSV debe tener columnas 'key' y 'name'");
      let ok = 0;
      let errors = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        const key = cols[keyIdx];
        const name = cols[nameIdx];
        const description = cols[headers.indexOf("description")] ?? "";
        if (!key || !name) { errors++; continue; }
        try {
          await createType({ key, name, description: description || undefined });
          ok++;
        } catch { errors++; }
      }
      setImportResult({ ok, errors });
      if (errors === 0) appToast.success(`${ok} tipos importados`);
      else appToast.warning(`${ok} importados, ${errors} con errores`);
      refetchTypes();
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al importar CSV");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  function openDetail(event: EventRecord) {
    setDetailEvent(event);
    detailState.open();
  }

  if (loading) {
    return (
      <div className={`${gp.page} items-center justify-center`}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={gp.page}>
      <ManagerHeader
        title="Monitoreo de Eventos"
        description="Tracking y estadísticas de eventos del sistema"
        Icon={ClockArrowRotateLeft}
      />

      <div className="mb-4 flex items-center gap-1.5">
        {RANGES.map((r) => (
          <Button
            key={r.key}
            size="sm"
            variant={range === r.key ? "primary" : "ghost"}
            onPress={() => setRange(r.key)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {apps.length === 0 ? (
        <div className={gp.cardPadded}>
          <p className={gp.subtitle}>Sin datos de eventos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {apps.map((app) => {
            const total = app.types.reduce((s, t) => s + t.count, 0);
            const data = app.types.map((t) => ({
              ...t,
              pct: total ? parseFloat(((t.count / total) * 100).toFixed(1)) : 0,
            }));
            return (
              <div key={app.app_id} className={gp.cardPadded}>
                <h3 className="mb-1 text-sm font-semibold">{app.app_name}</h3>
                <p className={gp.subtitle}>{total} eventos</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="type_name" hide />
                    <YAxis domain={[0, 100]} tickFormatter={(v: any) => `${v}%`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(_: any, __: any, props: any) => [`${props.payload.pct}%`, props.payload.type_name]} />
                    <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                      {data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {data.map((d, i) => (
                    <span key={d.type_name} className="flex items-center gap-1.5 text-xs">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      {d.type_name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className={gp.cardPadded}>
          <h3 className="mb-3 text-sm font-semibold">Registrar Tipo de Evento</h3>
          <form onSubmit={handleCreateType} className="space-y-3">
            <label className={gp.label}>
              Key
              <input value={typeKey} onChange={(e) => setTypeKey(e.target.value)} required placeholder="ej: user_login" className={gp.input} />
            </label>
            <label className={gp.label}>
              Nombre
              <input value={typeName} onChange={(e) => setTypeName(e.target.value)} required placeholder="ej: Inicio de sesión" className={gp.input} />
            </label>
            <label className={gp.label}>
              Descripción
              <input value={typeDesc} onChange={(e) => setTypeDesc(e.target.value)} placeholder="Opcional" className={gp.input} />
            </label>
            <Button type="submit" isDisabled={submitting} style={{ backgroundColor: "var(--gp-primary)", color: "var(--gp-primary-text)" }}>
              {submitting ? <Spinner size="sm" /> : <><Plus width={14} height={14} /> Agregar tipo</>}
            </Button>
          </form>
          <hr className="my-4 border-[var(--gp-border)]" />
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--gp-text-faint)]">Importar desde CSV</h4>
          <p className="mb-2 text-xs text-[var(--gp-text-faint)]">Columnas: key, name, description (opcional)</p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[var(--gp-elevated)] px-3 py-2 text-sm hover:opacity-80">
            <ArrowDownFromLine width={16} height={16} />
            {importing ? "Importando…" : "Seleccionar archivo"}
            <input type="file" accept=".csv" className="sr-only" onChange={handleImportCsv} disabled={importing} />
          </label>
          {importResult && (
            <p className="mt-2 text-xs text-[var(--gp-text-faint)]">
              {importResult.ok} importados{importResult.errors > 0 ? `, ${importResult.errors} con errores` : ""}
            </p>
          )}
        </div>

        <div className={gp.cardPadded}>
          <h3 className="mb-3 text-sm font-semibold">Tipos disponibles ({eventTypes.length})</h3>
          {typesLoading ? (
            <Spinner size="sm" />
          ) : eventTypes.length === 0 ? (
            <p className={gp.subtitle}>No hay tipos registrados</p>
          ) : (
            <ul className="space-y-1">
              {eventTypes.map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-md bg-[var(--gp-elevated)] px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{t.name}</span>
                    <span className="ml-2 font-mono text-xs text-[var(--gp-text-faint)]">{t.key}</span>
                    {t.description && <p className="truncate text-xs text-[var(--gp-text-faint)]">{t.description}</p>}
                  </div>
                  <button type="button" className="shrink-0 p-1 text-[var(--gp-text-faint)] hover:text-red-500" onClick={() => handleDeleteType(t.id)}>
                    <TrashBin width={14} height={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-5">
        <div className={gp.cardPadded}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Eventos ({events.length})</h3>
            <div className="max-w-60">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, tipo o app…"
                className={gp.input}
              />
            </div>
          </div>
          {events.length === 0 ? (
            <p className={gp.subtitle}>No hay eventos registrados</p>
          ) : (
            <div className={gp.tableWrap}>
              <table className={gp.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tipo</th>
                    <th>Nombre</th>
                    <th>App</th>
                    <th>Metadata</th>
                    <th>Fecha</th>
                    <th className="text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center">
                        <p className={gp.subtitle}>No hay eventos que coincidan con la búsqueda.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedEvents.map((event) => (
                      <tr key={event.id} className="cursor-pointer hover:opacity-80" onClick={() => openDetail(event)}>
                        <td className="font-mono text-xs">{event.id}</td>
                        <td><span className={gp.badge}>{event.type?.name ?? "—"}</span></td>
                        <td className="font-medium">{event.name}</td>
                        <td>{event.app_id}</td>
                        <td className="max-w-[160px] truncate font-mono text-xs text-[var(--gp-text-faint)]">
                          {event.metadata ? JSON.stringify(event.metadata).slice(0, 50) : "—"}
                        </td>
                        <td className="whitespace-nowrap text-xs">{new Date(event.created_at).toLocaleString("es-PY")}</td>
                        <td className="text-right">
                          <Button size="sm" variant="ghost" onPress={() => openDetail(event)}>
                            <Eye width={14} height={14} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <TablePagination page={page} pageSize={PAGE_SIZE} total={filteredTotal} onPageChange={setPage} />
            </div>
          )}
        </div>
      </div>

      <Modal state={detailState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-lg">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Detalle del evento #{detailEvent?.id}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {detailEvent && (
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-[var(--gp-text-faint)]">ID</dt>
                      <dd className="font-mono">{detailEvent.id}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--gp-text-faint)]">Tipo</dt>
                      <dd><span className={gp.badge}>{detailEvent.type?.name ?? "—"}</span></dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--gp-text-faint)]">Key del tipo</dt>
                      <dd className="font-mono text-xs">{detailEvent.type?.key ?? "—"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--gp-text-faint)]">Nombre</dt>
                      <dd className="font-medium">{detailEvent.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--gp-text-faint)]">App ID</dt>
                      <dd>{detailEvent.app_id}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--gp-text-faint)]">Fecha</dt>
                      <dd>{new Date(detailEvent.created_at).toLocaleString("es-PY")}</dd>
                    </div>
                    <div>
                      <dt className="mb-1 text-[var(--gp-text-faint)]">Metadata</dt>
                      <dd className="rounded-md bg-[var(--gp-elevated)] p-3 font-mono text-xs whitespace-pre-wrap break-all">
                        {detailEvent.metadata ? JSON.stringify(detailEvent.metadata, null, 2) : "—"}
                      </dd>
                    </div>
                  </dl>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" slot="close">Cerrar</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
