import { prisma } from "@/src/shared/lib/prisma";

/** Llega por JSON desde las apps: los numéricos pueden venir como texto. */
export type AppLoadSampleInput = {
  interval_start: string;
  requests?: number | string;
  bytes_in?: number | string;
  bytes_out?: number | string;
  errors?: number | string;
  latency_p95_ms?: number | string | null;
  usage_breakdown?: Array<{
    module?: string;
    section?: string;
    method?: string;
    requests?: number | string;
  }>;
  error_breakdown?: Array<{
    status?: number | string;
    kind?: string;
    method?: string;
    path?: string;
    message?: string;
    module?: string;
    section?: string;
    count?: number | string;
  }>;
};

export type UsageRow = {
  module: string;
  section: string;
  method: string;
  requests: number;
};

export type ErrorRow = {
  status: number;
  kind: string;
  method: string;
  path: string;
  message: string;
  module: string;
  section: string;
  count: number;
};

function toNonNegInt(value: unknown, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.round(n);
}

function truncateToTenSeconds(raw: string) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCMilliseconds(0);
  date.setUTCSeconds(Math.floor(date.getUTCSeconds() / 10) * 10);
  return date;
}

function truncateToMinute(date: Date) {
  const copy = new Date(date);
  copy.setUTCSeconds(0, 0);
  return copy;
}

function normalizeUsage(value: unknown): UsageRow[] {
  if (!Array.isArray(value)) return [];
  const totals = new Map<string, UsageRow>();
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const module = String(item.module || "Sistema").trim().slice(0, 100) || "Sistema";
    const section =
      String(item.section || "Otros servicios").trim().slice(0, 160) || "Otros servicios";
    const method = String(item.method || "").trim().toUpperCase().slice(0, 12);
    const requests = toNonNegInt(item.requests);
    if (!requests) continue;
    const key = `${module}::${section}::${method || "*"}`;
    const previous = totals.get(key);
    totals.set(key, {
      module,
      section,
      method,
      requests: (previous?.requests || 0) + requests,
    });
  }
  return [...totals.values()].sort((a, b) => b.requests - a.requests).slice(0, 40);
}

function fallbackKind(status: number) {
  if (status === 400) return "Petición inválida";
  if (status === 401) return "No autenticado";
  if (status === 403) return "Sin permiso";
  if (status === 404) return "No encontrado";
  if (status === 409) return "Conflicto";
  if (status === 422) return "Datos no válidos";
  if (status === 429) return "Demasiadas peticiones";
  if (status >= 500) return "Error del servidor";
  if (status >= 400) return "Error del cliente";
  return `HTTP ${status}`;
}

function normalizeErrors(value: unknown): ErrorRow[] {
  if (!Array.isArray(value)) return [];
  const totals = new Map<string, ErrorRow>();
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const status = toNonNegInt(item.status);
    if (status < 400) continue;
    const kind =
      String(item.kind || "").trim().slice(0, 80) || fallbackKind(status);
    const method = String(item.method || "").trim().toUpperCase().slice(0, 12);
    const path = String(item.path || "/").trim().slice(0, 160) || "/";
    const message =
      String(item.message || kind).trim().slice(0, 180) || kind;
    const module = String(item.module || "Sistema").trim().slice(0, 100) || "Sistema";
    const section =
      String(item.section || "Otros servicios").trim().slice(0, 160) || "Otros servicios";
    const count = Math.max(1, toNonNegInt(item.count, 1));
    const key = `${status}::${method}::${path}::${message}`;
    const previous = totals.get(key);
    totals.set(key, {
      status,
      kind,
      method,
      path,
      message,
      module,
      section,
      count: (previous?.count || 0) + count,
    });
  }
  return [...totals.values()].sort((a, b) => b.count - a.count).slice(0, 25);
}

function packBreakdown(usage: UsageRow[], errors: ErrorRow[]) {
  return { usage, errors };
}

export function parseLoadBreakdown(value: unknown): {
  usage: UsageRow[];
  errors: ErrorRow[];
} {
  if (Array.isArray(value)) {
    return { usage: normalizeUsage(value), errors: [] };
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return {
      usage: normalizeUsage(obj.usage ?? obj.usage_breakdown),
      errors: normalizeErrors(obj.errors ?? obj.error_breakdown),
    };
  }
  return { usage: [], errors: [] };
}

function aggregatePacked(rows: Array<{ usage_breakdown: unknown }>) {
  const usage: UsageRow[] = [];
  const errors: ErrorRow[] = [];
  for (const row of rows) {
    const parsed = parseLoadBreakdown(row.usage_breakdown);
    usage.push(...parsed.usage);
    errors.push(...parsed.errors);
  }
  return packBreakdown(normalizeUsage(usage), normalizeErrors(errors));
}

export async function ingestAppLoadSample(
  appId: number,
  body: AppLoadSampleInput,
) {
  const intervalStart = truncateToTenSeconds(body.interval_start);
  if (!intervalStart) {
    throw Object.assign(new Error("interval_start inválido"), { statusCode: 400 });
  }

  const requests = toNonNegInt(body.requests);
  const bytesIn = BigInt(toNonNegInt(body.bytes_in));
  const bytesOut = BigInt(toNonNegInt(body.bytes_out));
  const errors = toNonNegInt(body.errors);
  const usageBreakdown = normalizeUsage(body.usage_breakdown);
  const errorBreakdown = normalizeErrors(body.error_breakdown);
  const packed = packBreakdown(usageBreakdown, errorBreakdown);
  const latency =
    body.latency_p95_ms == null || body.latency_p95_ms === ""
      ? null
      : toNonNegInt(body.latency_p95_ms);

  const sample = await prisma.appLoadSample.upsert({
    where: {
      app_id_interval_start: {
        app_id: appId,
        interval_start: intervalStart,
      },
    },
    create: {
      app_id: appId,
      interval_start: intervalStart,
      requests,
      bytes_in: bytesIn,
      bytes_out: bytesOut,
      errors,
      latency_p95_ms: latency,
      usage_breakdown: packed,
    },
    update: {
      requests,
      bytes_in: bytesIn,
      bytes_out: bytesOut,
      errors,
      latency_p95_ms: latency,
      usage_breakdown: packed,
    },
  });

  const minuteStart = truncateToMinute(intervalStart);
  const nextMinute = new Date(minuteStart.getTime() + 60_000);
  const minuteSamples = await prisma.appLoadSample.findMany({
    where: {
      app_id: appId,
      interval_start: { gte: minuteStart, lt: nextMinute },
    },
  });
  const minuteRequests = minuteSamples.reduce((sum, row) => sum + row.requests, 0);
  const minuteBytesIn = minuteSamples.reduce((sum, row) => sum + row.bytes_in, BigInt(0));
  const minuteBytesOut = minuteSamples.reduce((sum, row) => sum + row.bytes_out, BigInt(0));
  const minuteErrors = minuteSamples.reduce((sum, row) => sum + row.errors, 0);
  const latencies = minuteSamples
    .map((row) => row.latency_p95_ms)
    .filter((value): value is number => value != null);
  const minuteLatency = latencies.length
    ? Math.max(...latencies)
    : null;
  const minutePacked = aggregatePacked(minuteSamples);

  await prisma.appLoadMinute.upsert({
    where: {
      app_id_interval_start: {
        app_id: appId,
        interval_start: minuteStart,
      },
    },
    create: {
      app_id: appId,
      interval_start: minuteStart,
      requests: minuteRequests,
      bytes_in: minuteBytesIn,
      bytes_out: minuteBytesOut,
      errors: minuteErrors,
      latency_p95_ms: minuteLatency,
      usage_breakdown: minutePacked,
    },
    update: {
      requests: minuteRequests,
      bytes_in: minuteBytesIn,
      bytes_out: minuteBytesOut,
      errors: minuteErrors,
      latency_p95_ms: minuteLatency,
      usage_breakdown: minutePacked,
    },
  });

  return sample;
}
