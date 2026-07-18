"use client";

import { Card } from "@heroui/react";
import ChartColumn from "@gravity-ui/icons/ChartColumn";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import CircleExclamation from "@gravity-ui/icons/CircleExclamation";
import Layers from "@gravity-ui/icons/Layers";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StatCard } from "@/src/shared/components/StatCard";
import { gp } from "@/src/shared/ui/theme";
import type { EventRecord } from "@/src/features/events/types";
import { isFailedEventKey } from "../lib/event-display";

const CHART_COLORS = [
  "#2563eb", "#f97316", "#22c55e", "#8b5cf6", "#06b6d4",
  "#ec4899", "#eab308", "#14b8a6", "#6366f1", "#ef4444",
];

type AppStats = {
  app_id: number;
  app_name: string;
  types: Array<{ type_name: string; count: number }>;
};

type EventsOverviewProps = {
  events: EventRecord[];
  apps: AppStats[];
  typesCount: number;
};

export function EventsOverview({ events, apps, typesCount }: EventsOverviewProps) {
  const successCount = events.filter((e) => !isFailedEventKey(e.type?.key)).length;
  const failedCount = events.length - successCount;
  const totalFromApps = apps.reduce(
    (sum, app) => sum + app.types.reduce((s, t) => s + t.count, 0),
    0,
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Layers}
          label="Eventos"
          value={totalFromApps || events.length}
          hint={`${apps.length} app${apps.length === 1 ? "" : "s"} con actividad`}
          featured={(totalFromApps || events.length) > 0}
        />
        <StatCard
          icon={CircleCheck}
          label="Exitosos"
          value={successCount}
          hint={events.length ? `${Math.round((successCount / events.length) * 100)}% del listado` : undefined}
        />
        <StatCard
          icon={CircleExclamation}
          label="Fallidos"
          value={failedCount}
          hint={failedCount > 0 ? "Revisar errores recientes" : "Sin fallos en el rango"}
        />
        <StatCard
          icon={ChartColumn}
          label="Tipos registrados"
          value={typesCount}
          hint="Catálogo de eventos"
        />
      </div>

      {apps.length === 0 ? (
        <Card className={`${gp.card} px-5 py-10 text-center`}>
          <ChartColumn width={32} height={32} className="mx-auto mb-3 text-[var(--gp-text-muted)]" />
          <p className="text-sm font-medium text-[var(--gp-text)]">Sin actividad en este rango</p>
          <p className={`${gp.subtitle} mt-1 text-sm`}>
            Los eventos de tus apps aparecerán aquí cuando lleguen por webhook o API.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {apps.map((app) => {
            const total = app.types.reduce((s, t) => s + t.count, 0);
            const data = [...app.types]
              .sort((a, b) => b.count - a.count)
              .slice(0, 8)
              .map((t) => ({
                ...t,
                shortName: t.type_name.length > 22 ? `${t.type_name.slice(0, 20)}…` : t.type_name,
              }));

            return (
              <Card key={app.app_id} className={`${gp.card} px-5 py-4`}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--gp-text)]">{app.app_name}</h3>
                    <p className="mt-0.5 text-xs text-[var(--gp-text-muted)]">
                      {total.toLocaleString("es-PE")} eventos · top {data.length} tipos
                    </p>
                  </div>
                  <span className={gp.badge}>{app.types.length} tipos</span>
                </div>

                <ResponsiveContainer width="100%" height={Math.max(160, data.length * 28)}>
                  <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="shortName"
                      width={108}
                      tick={{ fontSize: 11, fill: "var(--gp-text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--gp-elevated)" }}
                      contentStyle={{
                        background: "var(--gp-card-bg)",
                        border: "1px solid var(--gp-card-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value, _name, props) => {
                        const count = typeof value === "number" ? value : 0;
                        const label = props?.payload?.type_name ?? "Tipo";
                        const pct = total ? ((count / total) * 100).toFixed(1) : "0";
                        return [`${count} (${pct}%)`, label];
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                      {data.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
