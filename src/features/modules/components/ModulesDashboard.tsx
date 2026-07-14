"use client";

import type { ComponentType } from "react";
import { Card } from "@heroui/react";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import Layers from "@gravity-ui/icons/Layers";
import AntennaSignal from "@gravity-ui/icons/AntennaSignal";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import type { ModuleStats } from "../lib/module-stats";
import { gp } from "@/src/shared/ui/theme";

type ModulesDashboardProps = {
  stats: ModuleStats;
};

export function ModulesDashboard({ stats }: ModulesDashboardProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard
          icon={Cubes3Overlap}
          label="Módulos"
          value={stats.totalModules}
          hint={`${stats.activeModules} activos`}
        />
        <StatCard
          icon={Layers}
          label="Secciones"
          value={stats.totalSections}
          hint={`En ${stats.appsWithModules} app${stats.appsWithModules === 1 ? "" : "s"}`}
        />
        <StatCard
          icon={AntennaSignal}
          label="Límites remotos"
          value={stats.limitedSections}
          hint="Secciones con tope"
          featured
        />
        <StatCard
          icon={CircleCheck}
          label="Activos"
          value={stats.activeModules}
          hint={
            stats.totalModules > 0
              ? `${Math.round((stats.activeModules / stats.totalModules) * 100)}% del total`
              : "Sin módulos"
          }
        />
      </div>

      {stats.byApp.length > 0 && (
        <Card className={`${gp.card} px-3 py-2.5`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--gp-text-muted)]">
              Por app
            </p>
            {stats.byApp.map((app) => (
              <span
                key={app.appName}
                className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
                style={{
                  borderColor: "var(--gp-card-border)",
                  backgroundColor: "var(--gp-surface-muted)",
                }}
              >
                <span className="font-medium text-[var(--gp-text)]">
                  {app.appName}
                </span>
                <span className="text-[10px] text-[var(--gp-text-muted)]">
                  {app.moduleCount} mod · {app.sectionCount} sec
                </span>
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  featured = false,
}: {
  icon: ComponentType<{ width?: number; height?: number }>;
  label: string;
  value: number;
  hint: string;
  featured?: boolean;
}) {
  return (
    <Card
      className="gp-card gp-card-interactive overflow-hidden p-0"
      style={
        featured
          ? {
              borderColor: "var(--gp-input-focus)",
              backgroundColor: "var(--gp-badge-bg)",
            }
          : undefined
      }
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className={gp.iconBoxSm}>
          <Icon width={14} height={14} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-[var(--gp-text-muted)]">
            {label}
          </p>
          <p className="text-lg font-semibold leading-tight text-[var(--gp-text)]">
            {value.toLocaleString("es-PE")}
          </p>
          <p className="truncate text-[10px] text-[var(--gp-text-muted)]">
            {hint}
          </p>
        </div>
      </div>
    </Card>
  );
}
