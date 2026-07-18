import type { EventRecord } from "@/src/features/events/types";

/** Eventos emitidos por el servidor realtime hacia el dashboard. */
export const REALTIME_EVENTS = {
  dashboardRefresh: "dashboard:refresh",
} as const;

export type DashboardRefreshPayload = {
  source: "webhook" | "manual";
  app_id?: number;
  app_hash?: string;
  event_id?: number;
  event_type?: string | null;
  received_at?: string;
  /** Evento completo para actualización instantánea del cache (webhook app-events). */
  event?: EventRecord;
};
