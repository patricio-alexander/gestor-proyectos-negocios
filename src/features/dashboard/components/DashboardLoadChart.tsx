"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Modal, useOverlayState } from "@heroui/react";
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

type Bucket = "10s" | "1m" | "1h" | "1d";

export type AppLoadPoint = {
  t: string;
  requests: number;
  bytes: number;
  errors: number;
  latency_p95_ms: number | null;
  usage_breakdown: Array<{ module: string; section: string; requests: number }>;
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

/** Total + colores por app (GET/POST/PUT/etc. van juntos en requests). */
const TOTAL_COLOR = "#111827";
const APP_COLORS = [
  "#FF2D95", // magenta
  "#00E5FF", // cyan
  "#A3FF12", // lima
  "#FFB000", // ámbar
  "#9B5CFF", // violeta
  "#FF4D3D", // coral
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

function chipStyle(active: boolean, accent?: string) {
  return {
    borderColor: accent || "var(--gp-card-border)",
    backgroundColor: active
      ? accent
        ? `${accent}22`
        : "var(--gp-surface-muted)"
      : "transparent",
    color: "var(--gp-text)",
  };
}

export function DashboardLoadChart() {
  const [bucket, setBucket] = useState<Bucket>("10s");
  const [appId, setAppId] = useState<number>(0);
  const [selectedPoint, setSelectedPoint] = useState<{
    appName: string;
    point: AppLoadPoint;
  } | null>(null);
  const detailModal = useOverlayState();

  // Siempre pedimos todas las series: el filtro es solo visual.
  const query = useQuery({
    queryKey: queryKeys.apps.load(bucket, "all"),
    queryFn: () => fetchJson<AppLoadResponse>(`/api/apps/load?bucket=${bucket}`),
    refetchInterval: REFRESH_MS[bucket],
  });

  const series = query.data?.series ?? [];
  const apps = useMemo(
    () => series.filter((item) => item.app_id !== 0),
    [series],
  );
  const total = useMemo(
    () => series.find((item) => item.app_id === 0) ?? null,
    [series],
  );

  const visibleSeries = useMemo(() => {
    if (appId === 0) {
      // Todas: línea total + una línea de color por app
      return [...(total ? [total] : []), ...apps];
    }
    // Una app: solo su línea (todas las peticiones de esa app)
    return apps.filter((item) => item.app_id === appId);
  }, [appId, total, apps]);

  const timeline =
    visibleSeries[0]?.points.map((point) => point.t) ??
    total?.points.map((point) => point.t) ??
    [];

  const chartData = timeline.map((t, index) => {
    const row: Record<string, string | number> = { t };
    for (const item of visibleSeries) {
      row[`req_${item.app_id}`] = item.points[index]?.requests ?? 0;
    }
    return row;
  });

  const hasTraffic = visibleSeries.some((item) =>
    item.points.some((point) => point.requests > 0),
  );
  const bucketLabel =
    BUCKET_OPTIONS.find((item) => item.value === bucket)?.label ?? bucket;

  const openPointDetail = (appName: string, point: AppLoadPoint | undefined) => {
    if (!point) return;
    setSelectedPoint({ appName, point });
    detailModal.open();
  };

  return (
    <Card className={`${gp.card} px-5 py-4`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--gp-text)]">
            Tráfico en tiempo real
          </h2>
          <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
            Todas las peticiones (GET, POST, PUT, DELETE…) en una línea. En
            “Todas” ves el total más una línea de color por app.
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
          {apps.map((item, index) => (
            <button
              key={item.app_id}
              type="button"
              onClick={() => setAppId(item.app_id)}
              className="rounded-md border px-2 py-1 text-xs font-medium"
              style={chipStyle(
                item.app_id === appId,
                APP_COLORS[index % APP_COLORS.length],
              )}
            >
              <span
                className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                style={{ backgroundColor: APP_COLORS[index % APP_COLORS.length] }}
              />
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
        <p className={`${gp.subtitle} py-10 text-center text-sm`}>
          Cargando tráfico…
        </p>
      ) : !hasTraffic ? (
        <p className={`${gp.subtitle} py-10 text-center text-sm`}>
          Todavía no hay tráfico reportado. Las apps enlazadas guardan un punto
          cada 10 segundos cuando reciben peticiones.
        </p>
      ) : (
        <div className="h-80">
          <p className="mb-2 text-xs font-medium text-[var(--gp-text-muted)]">
            Peticiones / {bucketLabel}
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--gp-border)"
                vertical={false}
              />
              <XAxis
                dataKey="t"
                tickFormatter={(value) => formatTick(String(value), bucket)}
                tick={{ fill: "var(--gp-text-muted)", fontSize: 11 }}
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--gp-text-muted)", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={(value) => formatTick(String(value), bucket)}
                formatter={(value, name) => [
                  `${Number(value ?? 0)} peticiones`,
                  String(name),
                ]}
              />
              <Legend />
              {visibleSeries.map((item, index) => {
                const isTotal = item.app_id === 0;
                const appColorIndex = apps.findIndex(
                  (app) => app.app_id === item.app_id,
                );
                const stroke = isTotal
                  ? TOTAL_COLOR
                  : APP_COLORS[
                      (appColorIndex >= 0 ? appColorIndex : index) %
                        APP_COLORS.length
                    ];
                return (
                  <Line
                    key={item.app_id}
                    type="monotone"
                    dataKey={`req_${item.app_id}`}
                    name={isTotal ? "Todas las peticiones" : item.app_name}
                    stroke={stroke}
                    strokeWidth={isTotal ? 3 : 3}
                    strokeDasharray={isTotal ? "6 3" : undefined}
                    dot={(dotProps) => {
                      const pointIndex = (dotProps as unknown as { index?: number }).index ?? -1;
                      return (
                        <circle
                          cx={dotProps.cx}
                          cy={dotProps.cy}
                          r={isTotal ? 3 : 4}
                          fill={stroke}
                          stroke="var(--gp-card-bg)"
                          strokeWidth={2}
                          style={{ cursor: "pointer" }}
                          onClick={() => openPointDetail(item.app_name, item.points[pointIndex])}
                        />
                      );
                    }}
                    activeDot={{
                      r: 7,
                      fill: stroke,
                      stroke: "#FFFFFF",
                      strokeWidth: 2,
                      cursor: "pointer",
                    }}
                    isAnimationActive={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <Modal state={detailModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-lg">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  Uso de módulos · {selectedPoint?.appName || "App"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {selectedPoint && (
                  <>
                    <p className="mb-4 text-sm text-[var(--gp-text-muted)]">
                      {formatTick(selectedPoint.point.t, bucket)} ·{" "}
                      <strong>{selectedPoint.point.requests}</strong> peticiones ·{" "}
                      {selectedPoint.point.errors} error(es)
                      {selectedPoint.point.latency_p95_ms != null
                        ? ` · p95 ${selectedPoint.point.latency_p95_ms} ms`
                        : ""}
                    </p>
                    {selectedPoint.point.usage_breakdown.length ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]">
                          Módulos/secciones más usados en este intervalo
                        </p>
                        {selectedPoint.point.usage_breakdown.map((row) => (
                          <div
                            key={`${row.module}-${row.section}`}
                            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                            style={{ borderColor: "var(--gp-border)" }}
                          >
                            <div>
                              <p className="text-sm font-medium text-[var(--gp-text)]">
                                {row.module}
                              </p>
                              <p className="text-xs text-[var(--gp-text-muted)]">
                                {row.section}
                              </p>
                            </div>
                            <span className="rounded-full bg-[var(--gp-surface-muted)] px-2 py-1 text-xs font-semibold">
                              {row.requests} usos
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--gp-text-muted)]">
                        Este punto todavía no tiene desglose por módulo. Se llenará con
                        las nuevas peticiones recibidas después de actualizar las apps.
                      </p>
                    )}
                  </>
                )}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Card>
  );
}
