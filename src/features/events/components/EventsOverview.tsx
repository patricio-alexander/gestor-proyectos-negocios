"use client";

import { useMemo, useState } from "react";
import { Button, Card } from "@heroui/react";
import ChevronLeft from "@gravity-ui/icons/ChevronLeft";
import ChartColumn from "@gravity-ui/icons/ChartColumn";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import CircleExclamation from "@gravity-ui/icons/CircleExclamation";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
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
import type { ModuleUsageStats } from "@/src/features/events/hooks/useEvents";
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
  modules: ModuleUsageStats[];
  typesCount: number;
};

function shortLabel(text: string, max = 22) {
  return text.length > max ? `${text.slice(0, max - 2)}…` : text;
}

type BarRow = {
  shortName: string;
  count: number;
  [key: string]: string | number;
};

function VerticalBars({
  data,
  total,
  nameKey,
  fullNameKey,
}: {
  data: BarRow[];
  total: number;
  nameKey: string;
  fullNameKey: string;
}) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-[var(--gp-text-muted)]">
        Sin datos en este rango
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 28)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey={nameKey}
          width={108}
          tick={{ fontSize: 11, fill: "var(--gp-text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--gp-surface-muted)" }}
          contentStyle={{
            background: "var(--gp-card-bg)",
            border: "1px solid var(--gp-card-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value, _name, props) => {
            const count = typeof value === "number" ? value : 0;
            const label = String(props?.payload?.[fullNameKey] ?? "Ítem");
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
  );
}

export function EventsOverview({
  events,
  apps,
  modules,
  typesCount,
}: EventsOverviewProps) {
  const successCount = events.filter((e) => !isFailedEventKey(e.type?.key)).length;
  const failedCount = events.length - successCount;
  const totalFromApps = apps.reduce(
    (sum, app) => sum + app.types.reduce((s, t) => s + t.count, 0),
    0,
  );
  const totalSectionViews = modules.reduce(
    (sum, app) => sum + app.modules.reduce((s, m) => s + m.count, 0),
    0,
  );

  const [selectedByApp, setSelectedByApp] = useState<Record<number, string | null>>(
    {},
  );

  const moduleCards = useMemo(() => {
    return modules.map((app) => {
      const selectedKey = selectedByApp[app.app_id] ?? null;
      const selected = selectedKey
        ? app.modules.find((m) => m.module_key === selectedKey) ?? null
        : null;
      const total = app.modules.reduce((s, m) => s + m.count, 0);
      const moduleData = [...app.modules]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((m) => ({
          module_key: m.module_key,
          module_name: m.module_name,
          count: m.count,
          shortName: shortLabel(m.module_name),
        }));
      const sectionData: BarRow[] = selected
        ? [...selected.sections]
            .sort((a, b) => b.count - a.count)
            .slice(0, 12)
            .map((s) => ({
              section_key: s.section_key,
              section_name: s.section_name,
              count: s.count,
              shortName: shortLabel(s.section_name),
            }))
        : [];
      return { app, selected, total, moduleData, sectionData };
    });
  }, [modules, selectedByApp]);

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
          icon={Cubes3Overlap}
          label="Por módulo"
          value={totalSectionViews}
          hint="Eventos clasificados a módulos"
          featured={totalSectionViews > 0}
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
      </div>

      <div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--gp-text)]">
              Actividad por módulo
            </h2>
            <p className="mt-0.5 text-xs text-[var(--gp-text-muted)]">
              Clasificado desde los eventos que ya llegan por webhook. Tocá un módulo para ver secciones.
            </p>
          </div>
          <span className={gp.badge}>{typesCount} tipos</span>
        </div>

        {moduleCards.length === 0 ? (
          <Card className={`${gp.card} px-5 py-10 text-center`}>
            <Cubes3Overlap width={32} height={32} className="mx-auto mb-3 text-[var(--gp-text-muted)]" />
            <p className="text-sm font-medium text-[var(--gp-text)]">
              Sin eventos clasificables en este rango
            </p>
            <p className={`${gp.subtitle} mt-1 text-sm`}>
              Cuando las apps envíen webhooks, se agrupan aquí por módulo y sección.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {moduleCards.map(({ app, selected, total, moduleData, sectionData }) => (
              <Card key={app.app_id} className={`${gp.card} px-5 py-4`}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--gp-text)]">
                      {app.app_name}
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--gp-text-muted)]">
                      {selected
                        ? `${selected.module_name} · ${selected.count.toLocaleString("es-PE")} eventos`
                        : `${total.toLocaleString("es-PE")} eventos · ${app.modules.length} módulos`}
                    </p>
                  </div>
                  {selected ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() =>
                        setSelectedByApp((prev) => ({ ...prev, [app.app_id]: null }))
                      }
                    >
                      <ChevronLeft width={14} height={14} />
                      Módulos
                    </Button>
                  ) : (
                    <span className={gp.badge}>{app.modules.length}</span>
                  )}
                </div>

                {selected ? (
                  <VerticalBars
                    data={sectionData}
                    total={selected.count}
                    nameKey="shortName"
                    fullNameKey="section_name"
                  />
                ) : (
                  <>
                    <VerticalBars
                      data={moduleData}
                      total={total}
                      nameKey="shortName"
                      fullNameKey="module_name"
                    />
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {moduleData.map((m) => (
                        <button
                          key={m.module_key}
                          type="button"
                          onClick={() =>
                            setSelectedByApp((prev) => ({
                              ...prev,
                              [app.app_id]: m.module_key,
                            }))
                          }
                          className="rounded-full border border-[var(--gp-border)] bg-[var(--gp-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--gp-text)] transition-colors hover:border-[var(--gp-primary)] hover:text-[var(--gp-primary)]"
                        >
                          {m.module_name}
                          <span className="ml-1 text-[var(--gp-text-muted)]">
                            {m.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
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
        <div>
          <h2 className="mb-3 text-sm font-semibold text-[var(--gp-text)]">
            Eventos por tipo
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {apps.map((app) => {
              const total = app.types.reduce((s, t) => s + t.count, 0);
              const data = [...app.types]
                .sort((a, b) => b.count - a.count)
                .slice(0, 8)
                .map((t) => ({
                  ...t,
                  shortName: shortLabel(t.type_name),
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

                  <VerticalBars
                    data={data}
                    total={total}
                    nameKey="shortName"
                    fullNameKey="type_name"
                  />
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
