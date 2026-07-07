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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        <Card className={`${gp.card} px-4 py-4`}>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--gp-text-muted)]">
            Por aplicación
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.byApp.map((app) => (
              <span
                key={app.appName}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: "var(--gp-card-border)",
                  backgroundColor: "var(--gp-surface-muted)",
                }}
              >
                <span className="font-medium text-[var(--gp-text)]">
                  {app.appName}
                </span>
                <span className="text-xs text-[var(--gp-text-muted)]">
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
      <div className="flex items-start gap-3 p-4">
        <div className={gp.iconBoxSm}>
          <Icon width={16} height={16} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--gp-text-muted)]">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-semibold text-[var(--gp-text)]">
            {value.toLocaleString("es-PE")}
          </p>
          <p className="mt-1 truncate text-xs text-[var(--gp-text-muted)]">
            {hint}
          </p>
        </div>
      </div>
    </Card>
  );
}
