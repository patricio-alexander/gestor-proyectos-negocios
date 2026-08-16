import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { prisma } from "@/src/shared/lib/prisma";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";

const APP_PRIORITY = ["eddeli", "store", "tienda"];

type Bucket = "10s" | "1m" | "1h" | "1d";

const BUCKETS: Record<
  Bucket,
  { stepMs: number; windowMs: number; source: "sample" | "minute" }
> = {
  "10s": { stepMs: 10_000, windowMs: 15 * 60_000, source: "sample" },
  "1m": { stepMs: 60_000, windowMs: 6 * 60 * 60_000, source: "sample" },
  "1h": { stepMs: 60 * 60_000, windowMs: 7 * 24 * 60 * 60_000, source: "minute" },
  "1d": { stepMs: 24 * 60 * 60_000, windowMs: 90 * 24 * 60 * 60_000, source: "minute" },
};

function toNumber(value: bigint | number | null | undefined) {
  if (value == null) return 0;
  const n = typeof value === "bigint" ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function appPriority(name: string | null) {
  const searchable = String(name ?? "").toLowerCase();
  const index = APP_PRIORITY.findIndex((key) => searchable.includes(key));
  return index === -1 ? APP_PRIORITY.length : index;
}

function parseBucket(raw: string | null): Bucket {
  const value = String(raw || "10s").toLowerCase();
  if (value === "10s" || value === "1m" || value === "1h" || value === "1d") return value;
  return "10s";
}

function alignUtc(date: Date, stepMs: number) {
  return new Date(Math.floor(date.getTime() / stepMs) * stepMs);
}

function bucketStart(date: Date, bucket: Bucket) {
  const copy = new Date(date);
  if (bucket === "10s") return alignUtc(copy, 10_000);
  if (bucket === "1m") {
    copy.setUTCSeconds(0, 0);
    return copy;
  }
  if (bucket === "1h") {
    copy.setUTCMinutes(0, 0, 0);
    return copy;
  }
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

type UsageRow = { module: string; section: string; requests: number };

function normalizeUsage(value: unknown): UsageRow[] {
  if (!Array.isArray(value)) return [];
  const totals = new Map<string, UsageRow>();
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const module = String(item.module || "Sistema").trim() || "Sistema";
    const section = String(item.section || "Otros servicios").trim() || "Otros servicios";
    const requests = toNumber(item.requests as number | bigint | null);
    if (!requests) continue;
    const key = `${module}::${section}`;
    const previous = totals.get(key);
    totals.set(key, { module, section, requests: (previous?.requests || 0) + requests });
  }
  return [...totals.values()].sort((a, b) => b.requests - a.requests).slice(0, 12);
}

export async function GET(request: NextRequest) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const bucket = parseBucket(request.nextUrl.searchParams.get("bucket"));
    const config = BUCKETS[bucket];
    const appIdRaw = Number(request.nextUrl.searchParams.get("app_id") || "");
    const appId = Number.isFinite(appIdRaw) && appIdRaw > 0 ? appIdRaw : null;

    const to = alignUtc(new Date(), config.stepMs);
    const from = new Date(to.getTime() - config.windowMs + config.stepMs);

    const [rows, catalogApps] = await Promise.all([
      config.source === "sample"
        ? prisma.appLoadSample.findMany({
            where: {
              interval_start: { gte: from, lte: to },
              ...(appId ? { app_id: appId } : {}),
            },
            include: {
              app: { select: { id: true, name: true, path: true, kind: true } },
            },
            orderBy: [{ interval_start: "asc" }],
          })
        : prisma.appLoadMinute.findMany({
            where: {
              interval_start: { gte: from, lte: to },
              ...(appId ? { app_id: appId } : {}),
            },
            include: {
              app: { select: { id: true, name: true, path: true, kind: true } },
            },
            orderBy: [{ interval_start: "asc" }],
          }),
      // Siempre listamos las apps web del catálogo para que el gráfico
      // muestre una línea de color por app, aunque alguna aún no reporte.
      prisma.apps.findMany({
        where: {
          deleted_at: null,
          NOT: { kind: "mobile" },
          ...(appId ? { id: appId } : {}),
        },
        select: { id: true, name: true, path: true, kind: true },
        orderBy: { id: "asc" },
      }),
    ]);

    const byApp = new Map<
      number,
      {
        app_id: number;
        app_name: string;
        points: Map<
          number,
          {
            values: number[];
            health_deltas: number[];
            bytes: number;
            errors: number;
            latency_p95_ms: number | null;
            usage_breakdown: UsageRow[];
          }
        >;
      }
    >();

    for (const app of catalogApps) {
      byApp.set(app.id, {
        app_id: app.id,
        app_name: app.name || `App #${app.id}`,
        points: new Map(),
      });
    }

    for (const row of rows) {
      if (row.app.kind === "mobile") continue;
      let series = byApp.get(row.app_id);
      if (!series) {
        series = {
          app_id: row.app_id,
          app_name: row.app.name || `App #${row.app_id}`,
          points: new Map(),
        };
        byApp.set(row.app_id, series);
      }
      const key = bucketStart(row.interval_start, bucket).getTime();
      const prev = series.points.get(key) || {
        values: [] as number[],
        health_deltas: [] as number[],
        bytes: 0,
        errors: 0,
        latency_p95_ms: null as number | null,
        usage_breakdown: [] as UsageRow[],
      };
      prev.values.push(row.requests);
      // Salud del intervalo: respuestas OK empujan hacia arriba; cada error
      // resta un punto. La vela representa la evolución acumulada de ese saldo.
      prev.health_deltas.push(Math.max(0, row.requests - row.errors) - row.errors);
      prev.bytes += toNumber(row.bytes_in) + toNumber(row.bytes_out);
      prev.errors += row.errors;
      if (row.latency_p95_ms != null) {
        prev.latency_p95_ms =
          prev.latency_p95_ms == null
            ? row.latency_p95_ms
            : Math.max(prev.latency_p95_ms, row.latency_p95_ms);
      }
      prev.usage_breakdown = normalizeUsage([
        ...prev.usage_breakdown,
        ...(Array.isArray(row.usage_breakdown) ? row.usage_breakdown : []),
      ]);
      series.points.set(key, prev);
    }

    const timeline: number[] = [];
    for (let t = from.getTime(); t <= to.getTime(); t += config.stepMs) {
      timeline.push(t);
    }

    const appSeries = [...byApp.values()]
      .sort((a, b) => {
        const pa = appPriority(a.app_name);
        const pb = appPriority(b.app_name);
        if (pa !== pb) return pa - pb;
        return a.app_name.localeCompare(b.app_name, "es");
      })
      .map((item) => ({
        app_id: item.app_id,
        app_name: item.app_name,
        points: timeline.map((t) => {
          const point = item.points.get(t);
          const values = point?.values ?? [0];
          const healthDeltas = point?.health_deltas ?? [0];
          const requests = values.reduce((sum, value) => sum + value, 0);
          const healthPath = healthDeltas.reduce<number[]>(
            (path, delta) => [...path, path[path.length - 1] + delta],
            [0],
          );
          return {
            t: new Date(t).toISOString(),
            requests,
            open: values[0] ?? 0,
            high: Math.max(...values),
            low: Math.min(...values),
            close: values[values.length - 1] ?? 0,
            health_open: healthPath[0],
            health_high: Math.max(...healthPath),
            health_low: Math.min(...healthPath),
            health_close: healthPath[healthPath.length - 1],
            bytes: point?.bytes ?? 0,
            errors: point?.errors ?? 0,
            latency_p95_ms: point?.latency_p95_ms ?? null,
            usage_breakdown: point?.usage_breakdown ?? [],
          };
        }),
      }));

    const totalPoints = timeline.map((t, index) => {
      const opens = appSeries.map((item) => item.points[index].open);
      const highs = appSeries.map((item) => item.points[index].high);
      const lows = appSeries.map((item) => item.points[index].low);
      const closes = appSeries.map((item) => item.points[index].close);
      const healthOpens = appSeries.map((item) => item.points[index].health_open);
      const healthHighs = appSeries.map((item) => item.points[index].health_high);
      const healthLows = appSeries.map((item) => item.points[index].health_low);
      const healthCloses = appSeries.map((item) => item.points[index].health_close);
      return {
        t: new Date(t).toISOString(),
        requests: appSeries.reduce((sum, item) => sum + item.points[index].requests, 0),
        open: opens.reduce((sum, value) => sum + value, 0),
        high: highs.reduce((sum, value) => sum + value, 0),
        low: lows.reduce((sum, value) => sum + value, 0),
        close: closes.reduce((sum, value) => sum + value, 0),
        health_open: healthOpens.reduce((sum, value) => sum + value, 0),
        health_high: healthHighs.reduce((sum, value) => sum + value, 0),
        health_low: healthLows.reduce((sum, value) => sum + value, 0),
        health_close: healthCloses.reduce((sum, value) => sum + value, 0),
        bytes: appSeries.reduce((sum, item) => sum + item.points[index].bytes, 0),
        errors: appSeries.reduce((sum, item) => sum + item.points[index].errors, 0),
        latency_p95_ms: appSeries.reduce<number | null>((max, item) => {
          const value = item.points[index].latency_p95_ms;
          if (value == null) return max;
          return max == null ? value : Math.max(max, value);
        }, null),
        usage_breakdown: normalizeUsage(
          appSeries.flatMap((item) => item.points[index].usage_breakdown),
        ),
      };
    });

    return NextResponse.json({
      bucket,
      from: from.toISOString(),
      to: to.toISOString(),
      series: [
        {
          app_id: 0,
          app_name: "Todas las apps",
          points: totalPoints,
        },
        ...appSeries,
      ],
    });
  } catch (err) {
    return serviceErrorResponse(err, "Error al leer métricas de carga");
  }
}
