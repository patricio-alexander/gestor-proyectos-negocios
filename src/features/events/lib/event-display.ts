import type { EventRecord } from "@/src/features/events/types";

export function isFailedEventKey(key?: string | null): boolean {
  if (!key) return false;
  return key.endsWith("_failed") || key.includes(".fail");
}

export function eventOutcomeTone(event: EventRecord): "success" | "danger" {
  return isFailedEventKey(event.type?.key) ? "danger" : "success";
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 45) return "hace un momento";
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString("es-PY", {
    day: "numeric",
    month: "short",
  });
}

export function formatEventDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-PY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function summarizeMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata) return "—";
  const raw = JSON.stringify(metadata);
  return raw.length > 48 ? `${raw.slice(0, 48)}…` : raw;
}

export function sourceLabel(source: EventRecord["source"]): string {
  return source === "webhook" ? "Webhook" : "API";
}
