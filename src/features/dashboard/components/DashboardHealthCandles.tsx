"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@heroui/react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type UTCTimestamp,
} from "lightweight-charts";
import { fetchJson } from "@/src/shared/lib/api-client";
import { queryKeys } from "@/src/shared/lib/query-keys";
import { gp } from "@/src/shared/ui/theme";
import { CHART_COLORS } from "../lib/chart-data";

type Bucket = "10s" | "1m" | "1h" | "1d";
type Point = {
  t: string;
  requests: number;
  errors: number;
  health_open: number;
  health_high: number;
  health_low: number;
  health_close: number;
};
type Series = { app_id: number; app_name: string; points: Point[] };
type Response = { bucket: Bucket; series: Series[] };

const OPTIONS: { value: Bucket; label: string }[] = [
  { value: "10s", label: "10 s" },
  { value: "1m", label: "Minuto" },
  { value: "1h", label: "Hora" },
  { value: "1d", label: "Día" },
];
const REFRESH: Record<Bucket, number> = {
  "10s": 10_000,
  "1m": 15_000,
  "1h": 60_000,
  "1d": 120_000,
};

function style(active: boolean) {
  return {
    borderColor: "var(--gp-card-border)",
    backgroundColor: active ? "var(--gp-surface-muted)" : "transparent",
    color: "var(--gp-text)",
  };
}

export function DashboardHealthCandles() {
  const [bucket, setBucket] = useState<Bucket>("10s");
  const [appId, setAppId] = useState(0);
  const [hover, setHover] = useState<Point | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const query = useQuery({
    queryKey: ["apps", "health-candles", bucket, appId] as const,
    queryFn: () =>
      fetchJson<Response>(`/api/apps/load?bucket=${bucket}${appId ? `&app_id=${appId}` : ""}`),
    refetchInterval: REFRESH[bucket],
  });

  const all = query.data?.series ?? [];
  const apps = all.filter((item) => item.app_id !== 0);
  const active =
    all.find((item) => item.app_id === appId) ?? all.find((item) => item.app_id === 0);
  const points = active?.points ?? [];
  const hasData = points.some((point) => point.requests > 0 || point.errors > 0);

  const candles = useMemo(
    () =>
      points.map((point) => ({
        ...point,
        time: Math.floor(new Date(point.t).getTime() / 1000) as UTCTimestamp,
      })),
    [points],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasData) return undefined;
    const css = getComputedStyle(container);
    const color = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 260,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: color("--gp-text-muted", "#94a3b8"),
        fontSize: 11,
      },
      grid: {
        vertLines: { color: color("--gp-border", "#1f2937") },
        horzLines: { color: color("--gp-border", "#1f2937") },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: bucket !== "1d", fixLeftEdge: true },
      crosshair: { mode: 1 },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: CHART_COLORS.success,
      downColor: CHART_COLORS.danger,
      borderVisible: false,
      wickUpColor: CHART_COLORS.success,
      wickDownColor: CHART_COLORS.danger,
    });
    series.setData(
      candles.map((point) => ({
        time: point.time,
        open: point.health_open,
        high: point.health_high,
        low: point.health_low,
        close: point.health_close,
      })),
    );
    chart.timeScale().fitContent();
    chart.subscribeCrosshairMove((param) => {
      if (!param.time) return setHover(null);
      setHover(candles.find((point) => point.time === param.time) ?? null);
    });
    const resize = () => chart.applyOptions({ width: container.clientWidth });
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
    };
  }, [candles, hasData, bucket]);

  return (
    <Card className={`${gp.card} px-5 py-4`}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--gp-text)]">Velas de salud</h2>
          <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
            Peticiones OK elevan la vela; errores la hacen bajar. Muestra la salud de las apps en cada intervalo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setAppId(0)} className="rounded-md border px-2 py-1 text-xs font-medium" style={style(appId === 0)}>Todas</button>
          {apps.map((app) => (
            <button key={app.app_id} type="button" onClick={() => setAppId(app.app_id)} className="rounded-md border px-2 py-1 text-xs font-medium" style={style(appId === app.app_id)}>{app.app_name}</button>
          ))}
          {OPTIONS.map((option) => (
            <button key={option.value} type="button" onClick={() => setBucket(option.value)} className="rounded-md border px-2 py-1 text-xs font-medium" style={style(bucket === option.value)}>{option.label}</button>
          ))}
        </div>
      </div>
      {hover ? (
        <p className="mb-2 text-xs text-[var(--gp-text-muted)]">
          OK: {Math.max(0, hover.requests - hover.errors)} · Errores: {hover.errors} · Salud: {hover.health_close}
        </p>
      ) : null}
      {query.isLoading ? (
        <p className={`${gp.subtitle} py-10 text-center text-sm`}>Cargando salud…</p>
      ) : !hasData ? (
        <p className={`${gp.subtitle} py-10 text-center text-sm`}>Todavía no hay peticiones ni errores para formar velas.</p>
      ) : (
        <div ref={containerRef} style={{ width: "100%", minHeight: 260 }} />
      )}
    </Card>
  );
}
