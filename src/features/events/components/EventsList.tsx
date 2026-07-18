"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card } from "@heroui/react";
import Eye from "@gravity-ui/icons/Eye";
import Magnifier from "@gravity-ui/icons/Magnifier";
import type { EventRecord } from "@/src/features/events/types";
import { StatusBadge } from "@/src/shared/components/StatusBadge";
import { TablePagination } from "@/src/shared/components/TablePagination";
import { usePaginatedSearch } from "@/src/shared/hooks/usePaginatedSearch";
import { gp } from "@/src/shared/ui/theme";
import {
  eventOutcomeTone,
  formatEventDateTime,
  formatRelativeTime,
  isFailedEventKey,
  sourceLabel,
  summarizeMetadata,
} from "../lib/event-display";

const PAGE_SIZE = 15;

type OutcomeFilter = "all" | "ok" | "failed";
type SourceFilter = "all" | "webhook" | "api";

type EventsListProps = {
  events: EventRecord[];
  appNames: Map<number, string>;
  onSelect: (event: EventRecord) => void;
};

function matchesSearch(event: EventRecord, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    event.name.toLowerCase().includes(q) ||
    (event.type?.name ?? "").toLowerCase().includes(q) ||
    (event.type?.key ?? "").toLowerCase().includes(q) ||
    String(event.app_id).includes(q)
  );
}

export function EventsList({ events, appNames, onSelect }: EventsListProps) {
  const [outcome, setOutcome] = useState<OutcomeFilter>("all");
  const [source, setSource] = useState<SourceFilter>("all");

  const scopedEvents = useMemo(
    () =>
      events.filter((event) => {
        if (outcome === "ok" && isFailedEventKey(event.type?.key)) return false;
        if (outcome === "failed" && !isFailedEventKey(event.type?.key)) return false;
        if (source !== "all" && event.source !== source) return false;
        return true;
      }),
    [events, outcome, source],
  );

  const {
    search,
    setSearch,
    page,
    setPage,
    paginated,
    total,
  } = usePaginatedSearch(scopedEvents, matchesSearch, PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [outcome, source, setPage]);

  return (
    <Card className={`${gp.card} overflow-hidden`}>
      <div className="border-b px-5 py-4" style={{ borderColor: "var(--gp-card-border)" }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--gp-text)]">Registro de eventos</h3>
            <p className="mt-0.5 text-xs text-[var(--gp-text-muted)]">
              {total.toLocaleString("es-PE")} en el listado · últimos {events.length} cargados
            </p>
          </div>
          <div className="gp-search-wrap max-w-md flex-1">
            <Magnifier width={16} height={16} className="gp-search-icon" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, tipo, key o app…"
              className={`${gp.input} gp-search-input`}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
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
              variant={outcome === item.key ? "primary" : "ghost"}
              onPress={() => setOutcome(item.key)}
            >
              {item.label}
            </Button>
          ))}
          <span className="mx-1 hidden h-6 w-px bg-[var(--gp-card-border)] sm:inline-block" />
          {(
            [
              { key: "all", label: "Todas las fuentes" },
              { key: "webhook", label: "Webhook" },
              { key: "api", label: "API" },
            ] as const
          ).map((item) => (
            <Button
              key={item.key}
              size="sm"
              variant={source === item.key ? "primary" : "ghost"}
              onPress={() => setSource(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm font-medium text-[var(--gp-text)]">No hay eventos registrados</p>
          <p className={`${gp.subtitle} mt-1 text-sm`}>
            Cuando las apps envíen eventos, aparecerán aquí en tiempo real.
          </p>
        </div>
      ) : (
        <div className={gp.tableWrap}>
          <table className={gp.table}>
            <thead>
              <tr>
                <th>Estado</th>
                <th>Evento</th>
                <th>Tipo</th>
                <th>App</th>
                <th>Fuente</th>
                <th>Metadata</th>
                <th>Cuándo</th>
                <th className="text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <p className={gp.subtitle}>No hay eventos que coincidan con los filtros.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((event) => {
                  const tone = eventOutcomeTone(event);
                  return (
                    <tr
                      key={event.id}
                      className="cursor-pointer transition-opacity hover:opacity-85"
                      onClick={() => onSelect(event)}
                    >
                      <td>
                        <StatusBadge label={tone === "danger" ? "Fallido" : "OK"} tone={tone} />
                      </td>
                      <td>
                        <p className="max-w-[200px] truncate font-medium text-[var(--gp-text)]">
                          {event.name}
                        </p>
                        <p className="font-mono text-[10px] text-[var(--gp-text-muted)]">
                          #{event.id}
                        </p>
                      </td>
                      <td>
                        <p className="max-w-[160px] truncate text-sm">{event.type?.name ?? "—"}</p>
                        {event.type?.key && (
                          <p className="max-w-[160px] truncate font-mono text-[10px] text-[var(--gp-text-muted)]">
                            {event.type.key}
                          </p>
                        )}
                      </td>
                      <td className="text-sm">
                        {appNames.get(event.app_id) ?? `#${event.app_id}`}
                      </td>
                      <td>
                        <StatusBadge label={sourceLabel(event.source)} tone="info" />
                      </td>
                      <td className="max-w-[140px] truncate font-mono text-xs text-[var(--gp-text-muted)]">
                        {summarizeMetadata(event.metadata)}
                      </td>
                      <td className="whitespace-nowrap">
                        <p className="text-sm text-[var(--gp-text)]">
                          {formatRelativeTime(event.created_at)}
                        </p>
                        <p className="text-[10px] text-[var(--gp-text-muted)]">
                          {formatEventDateTime(event.created_at)}
                        </p>
                      </td>
                      <td className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => onSelect(event)}
                          aria-label="Ver detalle"
                        >
                          <Eye width={14} height={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <TablePagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}
    </Card>
  );
}
