"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@heroui/react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchJson } from "@/src/shared/lib/api-client";
import { queryKeys } from "@/src/shared/lib/query-keys";
import { gp } from "@/src/shared/ui/theme";
import { CHART_COLORS } from "../lib/chart-data";

type Bucket = "10s" | "1m" | "1h" | "1d";

export type AppLoadPoint = {
  t: string;
  requests: number;
  bytes: number;
  errors: number;
  latency_p95_ms: number | null;
};

export type AppLoadSeries = {
  app_id: number;
  app_name: string;
  points: AppLoadPoint[];
};

type AppLoadResponse = {
  bucket: Bucket;
  from: string;
  to: string;
  series: AppLoadSeries[];
};

const LINE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.cyan,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.bright,
  CHART_COLORS.danger,
];

const BUCKET_OPTIONS: { value: Bucket; label: string }[] = [
  { value: "10s", label: "10 s" },
  { value: "1m", label: "Minuto" },
  { value: "1h", label: "Hora" },
  { value: "1d", label: "Día" },
];

const REFRESH_MS: Record<Bucket, number> = {
  "10s": 10_000,
  "1m": 15_000,
  "1h": 60_000,
  "1d": 120_000,
};

const TOOLTIP_STYLE = {
  backgroundColor: "var(--gp-card-bg)",
  border: "1px solid var(--gp-card-border)",
  borderRadius: "0.5rem",
  color: "var(--gp-text)",
  fontSize: "12px",
};

function formatTick(iso: string, bucket: Bucket) {
  const date = new Date(iso);
  if (bucket === "1d") {
    return date.toLocaleDateString("es-EC", { day: "2-digit", month: "short" });
  }
  if (bucket === "1h") {
    return date.toLocaleString("es-EC", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
    });
  }
  return date.toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    second: bucket === "10s" ? "2-digit" : undefined,
  });
}

function chipStyle(active: boolean) {
  return {
    borderColor: "var(--gp-card-border)",
    backgroundColor: active ? "var(--gp-surface-muted)" : "transparent",
    color: "var(--gp-text)",
  };
}

export function DashboardLoadChart() {
  const [bucket, setBucket] = useState<Bucket>("10s");
  const [appId, setAppId] = useState<number>(0);

  const query = useQuery({
    queryKey: queryKeys.apps.load(bucket, appId || "all"),
    queryFn: () =>
      fetchJson<AppLoadResponse>(
        `/api/apps/load?bucket=${bucket}${appId ? `&app_id=${appId}` : ""}`,
      ),
    refetchInterval: REFRESH_MS[bucket],
  });

  const series = query.data?.series ?? [];
  const apps = series.filter((item) => item.app_id !== 0);
  const visibleSeries = useMemo(() => {
    if (appId === 0) {
      const total = series.find((item) => item.app_id === 0);
      return total ? [total] : series.filter((item) => item.app_id !== 0);
    }
    return series.filter((item) => item.app_id === appId);
  }, [series, appId]);

  const timeline = visibleSeries[0]?.points.map((point) => point.t) ?? [];
  const chartData = timeline.map((t, index) => {
    const row: Record<string, string | number> = { t };
    for (const item of visibleSeries) {
      row[`req_${item.app_id}`] = item.points[index]?.requests ?? 0;
      row[`mb_${item.app_id}`] = Number(
        ((item.points[index]?.bytes ?? 0) / (1024 * 1024)).toFixed(3),
      );
    }
    return row;
  });

  const hasTraffic = visibleSeries.some((item) =>
    item.points.some((point) => point.requests > 0 || point.bytes > 0),
  );
  const bucketLabel = BUCKET_OPTIONS.find((item) => item.value === bucket)?.label ?? bucket;

  return (
    <Card className={`${gp.card} px-5 py-4`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--gp-text)]">
            Tráfico en tiempo real
          </h2>
          <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
            Pulso de peticiones de EdDeli, Store y Tienda. Sube con actividad y baja
            cuando el intervalo está quieto.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAppId(0)}
            className="rounded-md border px-2 py-1 text-xs font-medium"
            style={chipStyle(appId === 0)}
          >
            Todas
          </button>
          {apps.map((item) => (
            <button
              key={item.app_id}
              type="button"
              onClick={() => setAppId(item.app_id)}
              className="rounded-md border px-2 py-1 text-xs font-medium"
              style={chipStyle(item.app_id === appId)}
            >
              {item.app_name}
            </button>
          ))}
          {BUCKET_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setBucket(option.value)}
              className="rounded-md border px-2 py-1 text-xs font-medium"
              style={chipStyle(option.value === bucket)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {query.isLoading ? (
        <p className={`${gp.subtitle} py-10 text-center text-sm`}>Cargando tráfico…</p>
      ) : !hasTraffic ? (
        <p className={`${gp.subtitle} py-10 text-center text-sm`}>
          Todavía no hay tráfico reportado. Las apps enlazadas empiezan a guardar
          un punto cada 10 segundos cuando reciben peticiones.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72">
            <p className="mb-2 text-xs font-medium text-[var(--gp-text-muted)]">
              Peticiones / {bucketLabel}
            </p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gp-border)" vertical={false} />
                <XAxis
                  dataKey="t"
                  tickFormatter={(value) => formatTick(String(value), bucket)}
                  tick={{ fill: "var(--gp-text-muted)", fontSize: 11 }}
                  minTickGap={24}
                />
                <YAxis allowDecimals={false} tick={{ fill: "var(--gp-text-muted)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelFormatter={(value) => formatTick(String(value), bucket)}
                />
                <Legend />
                {visibleSeries.map((item, index) => (
                  <Line
                    key={item.app_id}
                    type="monotone"
                    dataKey={`req_${item.app_id}`}
                    name={item.app_name}
                    stroke={LINE_COLORS[index % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="h-72">
            <p className="mb-2 text-xs font-medium text-[var(--gp-text-muted)]">
              Datos transferidos / {bucketLabel}
            </p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gp-border)" vertical={false} />
                <XAxis
                  dataKey="t"
                  tickFormatter={(value) => formatTick(String(value), bucket)}
                  tick={{ fill: "var(--gp-text-muted)", fontSize: 11 }}
                  minTickGap={24}
                />
                <YAxis tick={{ fill: "var(--gp-text-muted)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelFormatter={(value) => formatTick(String(value), bucket)}
                  formatter={(value) => [`${Number(value ?? 0).toFixed(3)} MB`, "Datos"]}
                />
                <Legend />
                {visibleSeries.map((item, index) => (
                  <Line
                    key={item.app_id}
                    type="monotone"
                    dataKey={`mb_${item.app_id}`}
                    name={item.app_name}
                    stroke={LINE_COLORS[index % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
}
