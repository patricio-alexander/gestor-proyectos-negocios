import { NextResponse, type NextRequest } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { prisma } from "@/src/shared/lib/prisma";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";

const APP_PRIORITY = ["eddeli", "store", "tienda"];

function toNumber(value: bigint | number | null | undefined) {
  if (value == null) return 0;
  const n = typeof value === "bigint" ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function appPriority(name: string | null, path: string | null) {
  const searchable = `${name ?? ""} ${path ?? ""}`.toLowerCase();
  const index = APP_PRIORITY.findIndex((key) => searchable.includes(key));
  return index === -1 ? APP_PRIORITY.length : index;
}

function minuteIso(date: Date) {
  const copy = new Date(date);
  copy.setUTCSeconds(0, 0);
  return copy.toISOString();
}

export async function GET(request: NextRequest) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const minutesRaw = Number(request.nextUrl.searchParams.get("minutes") || 60);
    const minutes = Math.min(180, Math.max(15, Number.isFinite(minutesRaw) ? minutesRaw : 60));
    const to = new Date();
    to.setUTCSeconds(0, 0);
    const from = new Date(to.getTime() - (minutes - 1) * 60_000);

    const rows = await prisma.appLoadMinute.findMany({
      where: { interval_start: { gte: from, lte: to } },
      include: {
        app: { select: { id: true, name: true, path: true, kind: true } },
      },
      orderBy: [{ interval_start: "asc" }],
    });

    const byApp = new Map<
      number,
      {
        app_id: number;
        app_name: string;
        kind: string;
        points: Map<string, { requests: number; bytes: number; errors: number; latency_p95_ms: number | null }>;
      }
    >();

    for (const row of rows) {
      if (row.app.kind === "mobile") continue;
      let series = byApp.get(row.app_id);
      if (!series) {
        series = {
          app_id: row.app_id,
          app_name: row.app.name || `App #${row.app_id}`,
          kind: row.app.kind,
          points: new Map(),
        };
        byApp.set(row.app_id, series);
      }
      series.points.set(minuteIso(row.interval_start), {
        requests: row.requests,
        bytes: toNumber(row.bytes_in) + toNumber(row.bytes_out),
        errors: row.errors,
        latency_p95_ms: row.latency_p95_ms,
      });
    }

    const timeline: string[] = [];
    for (let i = 0; i < minutes; i += 1) {
      timeline.push(minuteIso(new Date(from.getTime() + i * 60_000)));
    }

    const series = [...byApp.values()]
      .sort((a, b) => {
        const pa = appPriority(a.app_name, null);
        const pb = appPriority(b.app_name, null);
        if (pa !== pb) return pa - pb;
        return a.app_name.localeCompare(b.app_name, "es");
      })
      .map((item) => ({
        app_id: item.app_id,
        app_name: item.app_name,
        points: timeline.map((t) => {
          const point = item.points.get(t);
          return {
            t,
            requests: point?.requests ?? 0,
            bytes: point?.bytes ?? 0,
            errors: point?.errors ?? 0,
            latency_p95_ms: point?.latency_p95_ms ?? null,
          };
        }),
      }));

    return NextResponse.json({
      minutes,
      from: from.toISOString(),
      to: to.toISOString(),
      series,
    });
  } catch (err) {
    return serviceErrorResponse(err, "Error al leer métricas de carga");
  }
}
