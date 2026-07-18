"use client";

import { useMemo, useState } from "react";
import { Button, Spinner, useOverlayState } from "@heroui/react";
import ArrowsRotateRight from "@gravity-ui/icons/ArrowsRotateRight";
import ClockArrowRotateLeft from "@gravity-ui/icons/ClockArrowRotateLeft";
import { useEvents } from "@/src/features/events/hooks/useEvents";
import { useEventTypes } from "@/src/features/events/hooks/useEventTypes";
import type { EventRecord } from "@/src/features/events/types";
import { ManagerHeader } from "@/src/shared/components/TableSearchBar";
import { gp } from "@/src/shared/ui/theme";
import { useRealtimeStatus } from "@/src/shared/providers/RealtimeProvider";
import { EventDetailModal } from "./EventDetailModal";
import { EventsList } from "./EventsList";
import { EventsOverview } from "./EventsOverview";
import { EventTypesManager } from "./EventTypesManager";

const RANGES = [
  { key: "1D", label: "Hoy" },
  { key: "1S", label: "7 días" },
  { key: "1M", label: "30 días" },
  { key: "3M", label: "90 días" },
  { key: "TODO", label: "Todo" },
] as const;

type TabKey = "activity" | "types";

export function EventsPageView() {
  const [range, setRange] = useState("TODO");
  const [tab, setTab] = useState<TabKey>("activity");
  const [detailEvent, setDetailEvent] = useState<EventRecord | null>(null);
  const detailState = useOverlayState();

  const { events, apps, loading, isFetching, refetch } = useEvents(range);
  const realtimeStatus = useRealtimeStatus();
  const {
    types: eventTypes,
    loading: typesLoading,
    create: createType,
    remove: deleteType,
    refetch: refetchTypes,
  } = useEventTypes();

  const appNames = useMemo(
    () => new Map(apps.map((app) => [app.app_id, app.app_name])),
    [apps],
  );

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
    <div className={gp.pageGap8}>
      <ManagerHeader
        title="Monitoreo de Eventos"
        description="Actividad en tiempo real, errores y catálogo de tipos desde tus aplicaciones"
        Icon={ClockArrowRotateLeft}
        action={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                realtimeStatus === "connected"
                  ? "bg-emerald-500/15 text-emerald-600"
                  : realtimeStatus === "connecting"
                    ? "bg-amber-500/15 text-amber-600"
                    : "bg-red-500/15 text-red-600"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  realtimeStatus === "connected"
                    ? "bg-emerald-500 animate-pulse"
                    : realtimeStatus === "connecting"
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
              />
              {realtimeStatus === "connected"
                ? "En vivo"
                : realtimeStatus === "connecting"
                  ? "Conectando…"
                  : "Sin realtime"}
            </span>
            {isFetching && (
              <span className="text-xs text-[var(--gp-text-muted)]">Actualizando…</span>
            )}
            <Button size="sm" variant="ghost" onPress={refetch}>
              <ArrowsRotateRight width={16} height={16} />
              Actualizar
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "activity", label: "Actividad" },
              { key: "types", label: "Tipos de evento" },
            ] as const
          ).map((item) => (
            <Button
              key={item.key}
              size="sm"
              variant={tab === item.key ? "primary" : "ghost"}
              onPress={() => setTab(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        {tab === "activity" && (
          <div className="flex flex-wrap gap-1.5">
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
        )}
      </div>

      {tab === "activity" ? (
        <>
          <EventsOverview events={events} apps={apps} typesCount={eventTypes.length} />
          <EventsList events={events} appNames={appNames} onSelect={openDetail} />
        </>
      ) : (
        <EventTypesManager
          types={eventTypes}
          loading={typesLoading}
          onCreate={createType}
          onDelete={deleteType}
          onRefetch={refetchTypes}
        />
      )}

      <EventDetailModal
        event={detailEvent}
        appName={detailEvent ? appNames.get(detailEvent.app_id) : undefined}
        state={detailState}
      />
    </div>
  );
}
