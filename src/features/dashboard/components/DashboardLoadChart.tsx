"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Modal, useOverlayState } from "@heroui/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchJson } from "@/src/shared/lib/api-client";
import { queryKeys } from "@/src/shared/lib/query-keys";
import { gp } from "@/src/shared/ui/theme";
import {
  type AppLoadPoint,
  type AppLoadResponse,
  type AppLoadSeries,
  type Bucket,
  type ErrorRow,
  type UsageRow,
} from "../lib/app-load-types";

export type { AppLoadPoint, AppLoadSeries, Bucket, ErrorRow, UsageRow };

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

type ChartRow = {
  t: string;
  label: string;
  values: Record<string, number>;
  points: Record<string, AppLoadPoint>;
};

type SelectedSlice = {
  label: string;
  items: Array<{
    appId: number;
    appName: string;
    color: string;
    point: AppLoadPoint;
  }>;
};

function formatTick(iso: string, bucket: Bucket) {
  const date = new Date(iso);
  if (bucket === "1d") {
    return date.toLocaleDateString("es-EC", { day: "2-digit", month: "short" });
  }
  if (bucket === "1h") {
    return date.toLocaleString("es-EC", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  }
  return date.toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    second: bucket === "10s" ? "2-digit" : undefined,
    hourCycle: "h23",
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

function seriesKey(appId: number) {
  return `a${appId}`;
}

function okCount(point: AppLoadPoint) {
  return Math.max(0, point.requests - point.errors);
}

/** Arriba de 0 = solo OK. Si hay un error, la línea pasa bajo 0. */
function signedTraffic(point: AppLoadPoint) {
  if (point.errors > 0) return -point.errors;
  return okCount(point);
}

function seriesHasTraffic(item: AppLoadSeries) {
  return item.points.some(
    (point) => (point.requests ?? 0) > 0 || (point.errors ?? 0) > 0,
  );
}

function formatMb(bytes: number) {
  const mb = bytes / (1024 * 1024);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  if (mb < 0.01) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${mb.toFixed(2)} MB`;
}

function formatTrafficVolume(bytesIn: number, bytesOut: number) {
  const total = Math.max(0, bytesIn) + Math.max(0, bytesOut);
  if (total <= 0) return "0 MB";
  const parts: string[] = [];
  if (bytesIn > 0) parts.push(`↑ ${formatMb(bytesIn)}`);
  if (bytesOut > 0) parts.push(`↓ ${formatMb(bytesOut)}`);
  return `${parts.join(" · ")} · total ${formatMb(total)}`;
}

function niceMax(value: number) {
  const abs = Math.abs(value);
  if (abs <= 1) return 1;
  const mag = 10 ** Math.floor(Math.log10(abs));
  return Math.ceil(abs / mag) * mag;
}

function errorTone(status: number) {
  if (status >= 500) return { bg: "#fee2e2", color: "#991b1b" };
  if (status === 404) return { bg: "#ffedd5", color: "#9a3412" };
  if (status === 401 || status === 403) return { bg: "#fef3c7", color: "#92400e" };
  return { bg: "#fee2e2", color: "#7f1d1d" };
}

function methodTone(method?: string) {
  const m = String(method || "").toUpperCase();
  if (m === "GET") return { bg: "#dcfce7", color: "#166534" };
  if (m === "POST") return { bg: "#dbeafe", color: "#1e40af" };
  if (m === "PUT" || m === "PATCH") return { bg: "#fef3c7", color: "#92400e" };
  if (m === "DELETE") return { bg: "#fee2e2", color: "#991b1b" };
  return { bg: "var(--gp-surface-muted)", color: "var(--gp-text-muted)" };
}

function PointHit({
  cx,
  cy,
  stroke,
  payload,
  dataKey,
  onPick,
  active = false,
}: {
  cx?: number;
  cy?: number;
  stroke?: string;
  payload?: ChartRow;
  dataKey?: string;
  onPick: (row: ChartRow, key: string) => void;
  active?: boolean;
}) {
  if (cx == null || cy == null || !payload || !dataKey) return null;
  const color = stroke || "#fff";
  const value = payload.values?.[dataKey];
  // Sin tráfico en ese instante: no estorba ni se puede clickear.
  if (value == null || value === 0) return null;

  return (
    <g
      style={{ cursor: "pointer" }}
      onClick={(e) => {
        e.stopPropagation();
        onPick(payload, String(dataKey));
      }}
    >
      {/* Zona de hit amplia y exacta por serie */}
      <circle cx={cx} cy={cy} r={16} fill="transparent" />
      {active ? (
        <>
          <circle cx={cx} cy={cy} r={12} fill={color} opacity={0.16} />
          <circle cx={cx} cy={cy} r={8} fill={color} opacity={0.32} />
        </>
      ) : null}
      <circle
        cx={cx}
        cy={cy}
        r={active ? 5.5 : 3.2}
        fill={color}
        stroke="#fff"
        strokeWidth={active ? 2 : 1.25}
        style={{ filter: active ? `drop-shadow(0 0 6px ${color})` : undefined }}
      />
    </g>
  );
}

function LoadTooltip({
  active,
  payload,
  onOpen,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string;
    value?: number;
    color?: string;
    payload?: ChartRow;
  }>;
  onOpen: (row: ChartRow, key?: string) => void;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  // Solo apps con valor distinto de 0 en ese instante.
  const entries = payload.filter((item) => Number(item.value ?? 0) !== 0);
  if (!entries.length) return null;

  return (
    <div
      className="min-w-[196px] rounded-lg border px-2.5 py-2 shadow-lg"
      style={{
        backgroundColor: "var(--gp-card-bg)",
        borderColor: "var(--gp-card-border)",
        color: "var(--gp-text)",
      }}
    >
      <p className="text-[10px] text-[var(--gp-text-muted)]">{row.label}</p>
      {entries.map((item) => {
        const key = String(item.dataKey || "");
        const point = row.points[key];
        const ok = point ? okCount(point) : 0;
        const errors = point?.errors ?? 0;
        const signed = item.value ?? 0;
        return (
          <button
            key={key}
            type="button"
            className="mt-1 w-full rounded-md px-1 py-1 text-left text-xs hover:bg-[var(--gp-surface-muted)]"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(row, key);
            }}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </span>
              <span
                className="font-semibold tabular-nums"
                style={{ color: signed < 0 ? "#f87171" : undefined }}
              >
                {signed > 0 ? `+${signed}` : signed}
              </span>
            </span>
            <span className="mt-0.5 block pl-3.5 text-[10px] text-[var(--gp-text-muted)]">
              {ok} OK · {errors} error{errors === 1 ? "" : "es"} ·{" "}
              {formatTrafficVolume(point?.bytes_in ?? 0, point?.bytes_out ?? 0)}
            </span>
          </button>
        );
      })}
      <p className="mt-1.5 text-[10px] text-[var(--gp-text-muted)]">
        Clic en la app del tooltip o en su punto de la línea
      </p>
    </div>
  );
}

export function DashboardLoadChart() {
  const [bucket, setBucket] = useState<Bucket>("10s");
  const [appId, setAppId] = useState<number>(0);
  const [selected, setSelected] = useState<SelectedSlice | null>(null);
  const detailModal = useOverlayState();

  const query = useQuery({
    queryKey: queryKeys.apps.load(bucket, "all"),
    queryFn: () => fetchJson<AppLoadResponse>(`/api/apps/load?bucket=${bucket}`),
    refetchInterval: REFRESH_MS[bucket],
    staleTime: 8_000,
    placeholderData: (prev) => prev,
  });

  const series = query.data?.series ?? [];
  const apps = useMemo(
    () => series.filter((item) => item.app_id !== 0),
    [series],
  );
  /** Solo apps con tráfico real en la ventana (oculta Scheduly/etc. en cero). */
  const liveApps = useMemo(() => apps.filter(seriesHasTraffic), [apps]);

  useEffect(() => {
    if (appId !== 0 && !liveApps.some((item) => item.app_id === appId)) {
      setAppId(0);
    }
  }, [appId, liveApps]);

  const visibleSeries = useMemo(() => {
    if (appId === 0) return liveApps;
    return liveApps.filter((item) => item.app_id === appId);
  }, [appId, liveApps]);

  const rows = useMemo<ChartRow[]>(() => {
    const first = visibleSeries[0];
    if (!first) return [];
    return first.points.map((point, index) => {
      const values: Record<string, number> = {};
      const points: Record<string, AppLoadPoint> = {};
      for (const item of visibleSeries) {
        const current = item.points[index];
        if (!current) continue;
        const key = seriesKey(item.app_id);
        values[key] = signedTraffic(current);
        points[key] = current;
      }
      return {
        t: point.t,
        label: formatTick(point.t, bucket),
        values,
        points,
      };
    });
  }, [bucket, visibleSeries]);

  const chartData = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        ...row.values,
      })),
    [rows],
  );

  const hasTraffic = liveApps.length > 0;
  const yMax = useMemo(() => {
    let maxAbs = 1;
    for (const row of rows) {
      for (const value of Object.values(row.values)) {
        maxAbs = Math.max(maxAbs, Math.abs(value));
      }
    }
    return niceMax(maxAbs);
  }, [rows]);
  const bucketLabel =
    BUCKET_OPTIONS.find((item) => item.value === bucket)?.label ?? bucket;
  const xInterval = Math.max(0, Math.ceil(rows.length / 6) - 1);

  const colorOf = (item: AppLoadSeries) => {
    const index = liveApps.findIndex((app) => app.app_id === item.app_id);
    return APP_COLORS[(index >= 0 ? index : 0) % APP_COLORS.length];
  };

  const openSlice = (row: ChartRow, key?: string) => {
    if (!key) return; // solo clic exacto por serie
    const items = visibleSeries
      .filter((item) => seriesKey(item.app_id) === key)
      .map((item) => {
        const itemKey = seriesKey(item.app_id);
        return {
          appId: item.app_id,
          appName: item.app_name,
          color: colorOf(item),
          point: row.points[itemKey],
        };
      })
      .filter((item) => item.point && signedTraffic(item.point) !== 0);
    if (!items.length) return;
    setSelected({ label: row.label, items });
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
            El 0 es el punto de partida. Arriba: solo OK. Con error, la línea
            baja de 0. Clic en el punto o en la app del tooltip. Apps en cero no
            se muestran.
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
          {liveApps.map((item, index) => (
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
                style={{
                  backgroundColor: APP_COLORS[index % APP_COLORS.length],
                }}
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

      {query.isLoading && !query.data ? (
        <p className={`${gp.subtitle} py-10 text-center text-sm`}>
          Cargando tráfico…
        </p>
      ) : !hasTraffic ? (
        <p className={`${gp.subtitle} py-10 text-center text-sm`}>
          Todavía no hay tráfico. EdDeli, Store y Tienda envían un punto cada 10
          s cuando el backend está enlazado al gestor (GESTOR_SYNC_SECRET).
        </p>
      ) : (
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--gp-text-muted)]">
            OK / errores · {bucketLabel}
            {apps.length > liveApps.length
              ? ` · ocultas ${apps.length - liveApps.length} en cero`
              : ""}
          </p>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="var(--gp-border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  interval={xInterval}
                  tick={{ fill: "var(--gp-text-muted)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={28}
                />
                <YAxis
                  tick={{ fill: "var(--gp-text-muted)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  allowDecimals={false}
                  domain={[-yMax, yMax]}
                  tickFormatter={(value: number) =>
                    value > 0 ? `+${value}` : String(value)
                  }
                />
                <ReferenceLine
                  y={0}
                  stroke="var(--gp-text)"
                  strokeOpacity={0.55}
                  strokeWidth={1.5}
                />
                <Tooltip
                  shared
                  cursor={{
                    stroke: "var(--gp-text)",
                    strokeOpacity: 0.45,
                    strokeDasharray: "4 3",
                  }}
                  wrapperStyle={{ pointerEvents: "auto", outline: "none" }}
                  content={<LoadTooltip onOpen={openSlice} />}
                />
                {visibleSeries.map((item) => {
                  const color = colorOf(item);
                  const key = seriesKey(item.app_id);
                  return (
                    <Line
                      key={item.app_id}
                      type="monotone"
                      dataKey={key}
                      name={item.app_name}
                      stroke={color}
                      strokeWidth={2.4}
                      isAnimationActive={false}
                      connectNulls={false}
                      dot={(dotProps) => (
                        <PointHit
                          cx={dotProps.cx}
                          cy={dotProps.cy}
                          stroke={color}
                          payload={dotProps.payload as ChartRow}
                          dataKey={key}
                          onPick={openSlice}
                        />
                      )}
                      activeDot={(dotProps) => (
                        <PointHit
                          cx={dotProps.cx}
                          cy={dotProps.cy}
                          stroke={color}
                          payload={dotProps.payload as ChartRow}
                          dataKey={key}
                          onPick={openSlice}
                          active
                        />
                      )}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[var(--gp-text-muted)]">
            <span>0 = sin saldo</span>
            <span className="text-emerald-400">↑ solo OK</span>
            <span className="text-red-400">↓ 1 error o más</span>
            {visibleSeries.map((item) => (
              <span
                key={item.app_id}
                className="inline-flex items-center gap-1.5"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: colorOf(item) }}
                />
                {item.app_name}
              </span>
            ))}
          </div>
        </div>
      )}

      <Modal state={detailModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  {selected?.items.length === 1
                    ? `Detalle · ${selected.items[0].appName}`
                    : "Detalle de peticiones"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {selected ? (
                  <div className="space-y-5">
                    <p className="text-sm text-[var(--gp-text-muted)]">
                      {selected.label}
                    </p>
                    {selected.items.map((item) => (
                      <div key={item.appId} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--gp-text)]">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.appName}
                          </p>
                          <p className="text-xs text-[var(--gp-text-muted)]">
                            <span className="text-emerald-400">
                              {okCount(item.point)} OK
                            </span>
                            {" · "}
                            <span
                              className={
                                item.point.errors ? "text-red-400" : undefined
                              }
                            >
                              {item.point.errors} error
                              {item.point.errors === 1 ? "" : "es"}
                            </span>
                            {" · "}
                            <strong className="text-[var(--gp-text)]">
                              {formatTrafficVolume(
                                item.point.bytes_in ?? 0,
                                item.point.bytes_out ?? 0,
                              )}
                            </strong>
                            {item.point.latency_p95_ms != null
                              ? ` · p95 ${Math.round(item.point.latency_p95_ms)} ms`
                              : ""}
                          </p>
                        </div>
                        {item.point.error_breakdown?.length ? (
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-medium text-[var(--gp-text-muted)]">
                              Errores
                            </p>
                            {item.point.error_breakdown.map((err, idx) => {
                              const tone = errorTone(err.status);
                              return (
                                <div
                                  key={`${err.path}-${err.status}-${idx}`}
                                  className="rounded-md border px-2.5 py-1.5 text-xs"
                                  style={{
                                    borderColor: "var(--gp-card-border)",
                                    backgroundColor: "var(--gp-surface-muted)",
                                  }}
                                >
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span
                                      className="rounded px-1.5 py-0.5 font-semibold"
                                      style={{
                                        backgroundColor: tone.bg,
                                        color: tone.color,
                                      }}
                                    >
                                      {err.status}
                                    </span>
                                    {err.method ? (
                                      <span
                                        className="rounded px-1.5 py-0.5 font-semibold"
                                        style={methodTone(err.method)}
                                      >
                                        {err.method}
                                      </span>
                                    ) : null}
                                    <span className="font-medium text-[var(--gp-text)]">
                                      {err.kind}
                                    </span>
                                    <span className="text-[var(--gp-text-muted)]">
                                      ×{err.count}
                                    </span>
                                  </div>
                                  {(err.module || err.section) && (
                                    <p className="mt-1 text-[11px] text-[var(--gp-text-muted)]">
                                      {[err.module, err.section].filter(Boolean).join(" · ")}
                                    </p>
                                  )}
                                  <p className="mt-0.5 font-mono text-[10px] text-[var(--gp-text-faint)]">
                                    {err.path}
                                  </p>
                                  {err.message ? (
                                    <p className="mt-0.5 text-[11px] text-[var(--gp-text-muted)]">
                                      {err.message}
                                    </p>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                        {item.point.usage_breakdown?.length ? (
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-medium text-[var(--gp-text-muted)]">
                              Módulos y secciones
                            </p>
                            {item.point.usage_breakdown.slice(0, 10).map((u, idx) => (
                              <div
                                key={`${u.module}-${u.section}-${u.method}-${idx}`}
                                className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs"
                                style={{
                                  borderColor: "var(--gp-card-border)",
                                  backgroundColor: "var(--gp-surface-muted)",
                                }}
                              >
                                <span className="min-w-0">
                                  <span className="block font-medium text-[var(--gp-text)]">
                                    {u.module}
                                  </span>
                                  <span className="block truncate text-[11px] text-[var(--gp-text-muted)]">
                                    {u.section}
                                    {u.method ? ` · ${u.method}` : ""}
                                  </span>
                                </span>
                                <span className="shrink-0 text-right tabular-nums">
                                  <span className="block font-semibold text-[var(--gp-text)]">
                                    {u.requests} req
                                  </span>
                                  <span className="block text-[10px] text-[var(--gp-text-muted)]">
                                    {formatTrafficVolume(
                                      u.bytes_in ?? 0,
                                      u.bytes_out ?? 0,
                                    )}
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[var(--gp-text-faint)]">
                            Sin desglose por módulo en este intervalo (solo totales OK/errores).
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={() => detailModal.close()}>
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
