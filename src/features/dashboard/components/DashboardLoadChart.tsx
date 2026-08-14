"use client";

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
  minutes: number;
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

const TOOLTIP_STYLE = {
  backgroundColor: "var(--gp-card-bg)",
  border: "1px solid var(--gp-card-border)",
  borderRadius: "0.5rem",
  color: "var(--gp-text)",
  fontSize: "12px",
};

function formatTick(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DashboardLoadChart() {
  const query = useQuery({
    queryKey: queryKeys.apps.load(60),
    queryFn: () => fetchJson<AppLoadResponse>("/api/apps/load?minutes=60"),
    refetchInterval: 30_000,
  });

  const series = query.data?.series ?? [];
  const timeline = series[0]?.points.map((point) => point.t) ?? [];
  const chartData = timeline.map((t, index) => {
    const row: Record<string, string | number> = { t };
    for (const item of series) {
      row[`req_${item.app_id}`] = item.points[index]?.requests ?? 0;
      row[`mb_${item.app_id}`] = Number(
        ((item.points[index]?.bytes ?? 0) / (1024 * 1024)).toFixed(3),
      );
    }
    return row;
  });

  const hasTraffic = series.some((item) =>
    item.points.some((point) => point.requests > 0 || point.bytes > 0),
  );

  return (
    <Card className={`${gp.card} px-5 py-4`}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[var(--gp-text)]">
          Tráfico por minuto
        </h2>
        <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
          Peticiones y datos transferidos de las apps enlazadas. Sube con más
          actividad y baja cuando el intervalo está más quieto.
        </p>
      </div>

      {query.isLoading ? (
        <p className={`${gp.subtitle} py-10 text-center text-sm`}>Cargando tráfico…</p>
      ) : !hasTraffic ? (
        <p className={`${gp.subtitle} py-10 text-center text-sm`}>
          Todavía no hay tráfico reportado. Las apps enlazadas empezarán a enviar
          un punto por minuto cuando reciban peticiones.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72">
            <p className="mb-2 text-xs font-medium text-[var(--gp-text-muted)]">
              Peticiones / minuto
            </p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gp-border)" vertical={false} />
                <XAxis dataKey="t" tickFormatter={formatTick} tick={{ fill: "var(--gp-text-muted)", fontSize: 11 }} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--gp-text-muted)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelFormatter={(value) => formatTick(String(value))}
                />
                <Legend />
                {series.map((item, index) => (
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
              Datos transferidos / minuto
            </p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gp-border)" vertical={false} />
                <XAxis dataKey="t" tickFormatter={formatTick} tick={{ fill: "var(--gp-text-muted)", fontSize: 11 }} minTickGap={24} />
                <YAxis tick={{ fill: "var(--gp-text-muted)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelFormatter={(value) => formatTick(String(value))}
                  formatter={(value) => [`${Number(value ?? 0).toFixed(3)} MB`, "Datos"]}
                />
                <Legend />
                {series.map((item, index) => (
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
