"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Modal, useOverlayState } from "@heroui/react";
import { fetchJson } from "@/src/shared/lib/api-client";
import { queryKeys } from "@/src/shared/lib/query-keys";
import { gp } from "@/src/shared/ui/theme";

type Bucket = "10s" | "1m" | "1h" | "1d";

export type UsageRow = {
  module: string;
  section: string;
  method?: string;
  requests: number;
};

export type AppLoadPoint = {
  t: string;
  requests: number;
  bytes: number;
  errors: number;
  latency_p95_ms: number | null;
  usage_breakdown: UsageRow[];
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

const TOTAL_COLOR = "#111827";
const APP_COLORS = [
  "#FF2D95",
  "#00E5FF",
  "#A3FF12",
  "#FFB000",
  "#9B5CFF",
  "#FF4D3D",
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

const PAD = { l: 42, r: 14, t: 14, b: 30 };

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

function seriesColor(item: AppLoadSeries, apps: AppLoadSeries[]) {
  if (item.app_id === 0) return TOTAL_COLOR;
  const index = apps.findIndex((app) => app.app_id === item.app_id);
  return APP_COLORS[(index >= 0 ? index : 0) % APP_COLORS.length];
}

function niceMax(value: number) {
  if (value <= 1) return 1;
  const mag = 10 ** Math.floor(Math.log10(value));
  const n = Math.ceil(value / mag);
  return n * mag;
}

function methodTone(method?: string) {
  const m = String(method || "").toUpperCase();
  if (m === "GET") return { bg: "#dcfce7", color: "#166534" };
  if (m === "POST") return { bg: "#dbeafe", color: "#1e40af" };
  if (m === "PUT" || m === "PATCH") return { bg: "#fef3c7", color: "#92400e" };
  if (m === "DELETE") return { bg: "#fee2e2", color: "#991b1b" };
  return { bg: "var(--gp-surface-muted)", color: "var(--gp-text-muted)" };
}

type Hovered = {
  series: AppLoadSeries;
  point: AppLoadPoint;
  x: number;
  y: number;
};

export function DashboardLoadChart() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 280 });
  const [bucket, setBucket] = useState<Bucket>("10s");
  const [appId, setAppId] = useState<number>(0);
  const [hovered, setHovered] = useState<Hovered | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{
    appName: string;
    point: AppLoadPoint;
  } | null>(null);
  const detailModal = useOverlayState();

  const query = useQuery({
    queryKey: queryKeys.apps.load(bucket, "all"),
    queryFn: () => fetchJson<AppLoadResponse>(`/api/apps/load?bucket=${bucket}`),
    refetchInterval: REFRESH_MS[bucket],
  });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const sync = () => setSize({ w: Math.max(320, el.clientWidth), h: Math.max(220, el.clientHeight) });
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    if (appId === 0) return [...(total ? [total] : []), ...apps];
    return apps.filter((item) => item.app_id === appId);
  }, [appId, total, apps]);

  const innerW = size.w - PAD.l - PAD.r;
  const innerH = size.h - PAD.t - PAD.b;
  const pointCount = visibleSeries[0]?.points.length ?? 0;
  const maxY = useMemo(() => {
    const raw = Math.max(
      0,
      ...visibleSeries.flatMap((item) => item.points.map((p) => p.requests)),
    );
    return niceMax(raw);
  }, [visibleSeries]);

  const xAt = (index: number) =>
    PAD.l + (pointCount <= 1 ? innerW / 2 : (index / (pointCount - 1)) * innerW);
  const yAt = (value: number) => PAD.t + innerH - (maxY === 0 ? 0 : (value / maxY) * innerH);

  const yTicks = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => Math.round((maxY * i) / steps));
  }, [maxY]);

  const xTicks = useMemo(() => {
    if (pointCount === 0) return [];
    const want = Math.min(6, pointCount);
    const step = Math.max(1, Math.floor((pointCount - 1) / (want - 1)));
    const indexes = new Set<number>();
    for (let i = 0; i < pointCount; i += step) indexes.add(i);
    indexes.add(pointCount - 1);
    return [...indexes];
  }, [pointCount]);

  const hasTraffic = visibleSeries.some((item) =>
    item.points.some((point) => point.requests > 0),
  );
  const bucketLabel =
    BUCKET_OPTIONS.find((item) => item.value === bucket)?.label ?? bucket;

  const pickNearest = (clientX: number, clientY: number): Hovered | null => {
    const el = wrapRef.current;
    if (!el || pointCount === 0) return null;
    const rect = el.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * size.w;
    const sy = ((clientY - rect.top) / rect.height) * size.h;
    if (sx < PAD.l - 8 || sx > size.w - PAD.r + 8) return null;

    let bestIndex = 0;
    let bestXd = Infinity;
    for (let i = 0; i < pointCount; i += 1) {
      const d = Math.abs(xAt(i) - sx);
      if (d < bestXd) {
        bestXd = d;
        bestIndex = i;
      }
    }

    let best: Hovered | null = null;
    let bestYd = Infinity;
    for (const item of visibleSeries) {
      const point = item.points[bestIndex];
      if (!point) continue;
      const x = xAt(bestIndex);
      const y = yAt(point.requests);
      const d = Math.abs(y - sy);
      if (!best || d < bestYd || (d === bestYd && point.requests > best.point.requests)) {
        bestYd = d;
        best = { series: item, point, x, y };
      }
    }
    return best;
  };

  const openDetail = (item: AppLoadSeries, point: AppLoadPoint) => {
    setSelectedPoint({ appName: item.app_name, point });
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
            Hover en un punto: cuántas peticiones. Clic: método (GET/POST…) y
            módulo/sección.
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
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--gp-text-muted)]">
            Peticiones / {bucketLabel}
          </p>
          <div
            ref={wrapRef}
            className="relative h-80 w-full"
            onMouseLeave={() => setHovered(null)}
          >
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${size.w} ${size.h}`}
              role="img"
              aria-label="Tráfico de peticiones"
              onMouseMove={(e) => setHovered(pickNearest(e.clientX, e.clientY))}
              onClick={(e) => {
                const hit = pickNearest(e.clientX, e.clientY);
                if (hit) openDetail(hit.series, hit.point);
              }}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                if (!touch) return;
                const hit = pickNearest(touch.clientX, touch.clientY);
                setHovered(hit);
              }}
              style={{ cursor: hovered ? "pointer" : "default" }}
            >
              {yTicks.map((tick) => {
                const y = yAt(tick);
                return (
                  <g key={`y-${tick}`}>
                    <line
                      x1={PAD.l}
                      x2={size.w - PAD.r}
                      y1={y}
                      y2={y}
                      stroke="var(--gp-border)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={PAD.l - 6}
                      y={y + 3}
                      textAnchor="end"
                      fill="var(--gp-text-muted)"
                      fontSize="11"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}
              {xTicks.map((index) => {
                const t = visibleSeries[0]?.points[index]?.t;
                if (!t) return null;
                return (
                  <text
                    key={`x-${index}`}
                    x={xAt(index)}
                    y={size.h - 8}
                    textAnchor="middle"
                    fill="var(--gp-text-muted)"
                    fontSize="11"
                  >
                    {formatTick(t, bucket)}
                  </text>
                );
              })}

              {hovered && (
                <line
                  x1={hovered.x}
                  x2={hovered.x}
                  y1={PAD.t}
                  y2={PAD.t + innerH}
                  stroke="var(--gp-text-muted)"
                  strokeOpacity={0.35}
                  strokeDasharray="4 4"
                />
              )}

              {visibleSeries.map((item) => {
                const color = seriesColor(item, apps);
                const d = item.points
                  .map((point, index) => `${index === 0 ? "M" : "L"} ${xAt(index)} ${yAt(point.requests)}`)
                  .join(" ");
                const dashed = item.app_id === 0;
                return (
                  <g key={item.app_id}>
                    <path
                      d={d}
                      fill="none"
                      stroke={color}
                      strokeWidth={item.app_id === 0 ? 3 : 2.5}
                      strokeDasharray={dashed ? "6 3" : undefined}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {item.points.map((point, index) =>
                      point.requests > 0 ? (
                        <circle
                          key={`${item.app_id}-${point.t}`}
                          cx={xAt(index)}
                          cy={yAt(point.requests)}
                          r={
                            hovered?.series.app_id === item.app_id &&
                            hovered.point.t === point.t
                              ? 6
                              : 3.5
                          }
                          fill={color}
                          stroke="var(--gp-card-bg)"
                          strokeWidth={2}
                        />
                      ) : null,
                    )}
                  </g>
                );
              })}
            </svg>

            {hovered && (
              <div
                className="pointer-events-none absolute z-10 min-w-[140px] rounded-lg border px-2.5 py-2 shadow-lg"
                style={{
                  left: Math.min(size.w - 170, Math.max(8, hovered.x + 10)),
                  top: Math.max(8, hovered.y - 52),
                  backgroundColor: "var(--gp-card-bg)",
                  borderColor: "var(--gp-card-border)",
                  color: "var(--gp-text)",
                }}
              >
                <p className="text-[10px] text-[var(--gp-text-muted)]">
                  {formatTick(hovered.point.t, bucket)}
                </p>
                <p className="text-xs font-semibold">{hovered.series.app_name}</p>
                <p className="text-sm font-bold">
                  {hovered.point.requests}{" "}
                  <span className="text-xs font-medium text-[var(--gp-text-muted)]">
                    peticiones
                  </span>
                </p>
                <p className="mt-0.5 text-[10px] text-[var(--gp-text-muted)]">
                  Clic para ver método y módulo
                </p>
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--gp-text-muted)]">
            {visibleSeries.map((item) => (
              <span key={item.app_id} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: seriesColor(item, apps) }}
                />
                {item.app_id === 0 ? "Todas las peticiones" : item.app_name}
              </span>
            ))}
          </div>
        </div>
      )}

      <Modal state={detailModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-lg">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  Detalle · {selectedPoint?.appName || "App"}
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
                          Tipo de petición y módulo
                        </p>
                        {selectedPoint.point.usage_breakdown.map((row) => {
                          const tone = methodTone(row.method);
                          return (
                          <div
                            key={`${row.method || "*"}-${row.module}-${row.section}`}
                            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                            style={{ borderColor: "var(--gp-border)" }}
                          >
                            <div className="min-w-0">
                              <div className="mb-1 flex items-center gap-2">
                                <span
                                  className="rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
                                  style={{ backgroundColor: tone.bg, color: tone.color }}
                                >
                                  {row.method || "N/D"}
                                </span>
                                <p className="truncate text-sm font-medium text-[var(--gp-text)]">
                                  {row.module}
                                </p>
                              </div>
                              <p className="text-xs text-[var(--gp-text-muted)]">
                                {row.section}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-[var(--gp-surface-muted)] px-2 py-1 text-xs font-semibold">
                              {row.requests}
                            </span>
                          </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--gp-text-muted)]">
                        Este intervalo no tiene desglose. Los puntos nuevos (tras
                        recargar las apps) incluirán GET/POST y el módulo.
                      </p>
                    )}
                  </>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" slot="close">
                  Cerrar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Card>
  );
}
