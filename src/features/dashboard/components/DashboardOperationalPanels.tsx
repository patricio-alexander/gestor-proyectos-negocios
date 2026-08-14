"use client";

import Link from "next/link";
import { Card } from "@heroui/react";
import AntennaSignal from "@gravity-ui/icons/AntennaSignal";
import CircleExclamation from "@gravity-ui/icons/CircleExclamation";
import Smartphone from "@gravity-ui/icons/Smartphone";
import { gp } from "@/src/shared/ui/theme";
import type { DashboardOverview } from "../hooks/useDashboardOverview";

type Props = {
  data: DashboardOverview;
};

function HealthRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  const colors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    neutral: "bg-slate-400",
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-[var(--gp-text-muted)]">
        <span className={`h-2.5 w-2.5 rounded-full ${colors[tone]}`} />
        {label}
      </span>
      <strong className="tabular-nums text-sm text-[var(--gp-text)]">{value}</strong>
    </div>
  );
}

export function DashboardOperationalPanels({ data }: Props) {
  const unready =
    data.syncHealth.offline +
    data.syncHealth.not_configured +
    data.syncHealth.no_secret;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className={`${gp.card} px-5 py-4`}>
        <div className="mb-4 flex items-center gap-2">
          <span className={gp.iconBoxSm}>
            <AntennaSignal width={16} height={16} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--gp-text)]">
              Salud de sincronización
            </h2>
            <p className="text-xs text-[var(--gp-text-muted)]">
              Comunicación del gestor con cada app.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <HealthRow label="En línea" value={data.syncHealth.online} tone="success" />
          <HealthRow label="Sin conexión" value={data.syncHealth.offline} tone="danger" />
          <HealthRow
            label="Sin configurar"
            value={data.syncHealth.not_configured}
            tone="warning"
          />
          <HealthRow label="Sin secreto" value={data.syncHealth.no_secret} tone="warning" />
        </div>
        <Link
          href="/dashboard/apps"
          className="mt-4 inline-block text-xs font-medium text-[var(--gp-badge-text)] hover:underline"
        >
          Revisar aplicaciones →
        </Link>
      </Card>

      <Card className={`${gp.card} px-5 py-4`}>
        <div className="mb-4 flex items-center gap-2">
          <span className={gp.iconBoxSm}>
            <Smartphone width={16} height={16} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--gp-text)]">
              Cobertura del ecosistema
            </h2>
            <p className="text-xs text-[var(--gp-text-muted)]">
              Productos y dispositivos conectados.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <HealthRow label="Apps web" value={data.webApps} tone="neutral" />
          <HealthRow label="Apps móviles" value={data.mobileApps} tone="neutral" />
          <HealthRow label="Dispositivos en línea" value={data.onlineDevices} tone="success" />
          <HealthRow label="Módulos disponibles" value={data.modules} tone="neutral" />
        </div>
        <Link
          href="/dashboard/mobile-apps"
          className="mt-4 inline-block text-xs font-medium text-[var(--gp-badge-text)] hover:underline"
        >
          Gestionar apps móviles →
        </Link>
      </Card>

      <Card className={`${gp.card} px-5 py-4`}>
        <div className="mb-4 flex items-center gap-2">
          <span className={gp.iconBoxSm}>
            <CircleExclamation width={16} height={16} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[var(--gp-text)]">
              Alertas operativas
            </h2>
            <p className="text-xs text-[var(--gp-text-muted)]">
              Prioridades que requieren atención.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <HealthRow label="Apps con sync pendiente" value={unready} tone={unready ? "danger" : "success"} />
          <HealthRow
            label="Suscripciones por vencer"
            value={data.expiringSubscriptions.length}
            tone={data.expiringSubscriptions.length ? "warning" : "success"}
          />
          <HealthRow
            label="Apps en mantenimiento"
            value={data.appList.filter((app) => app.maintenance).length}
            tone="warning"
          />
        </div>
        <Link
          href="/dashboard/subscriptions"
          className="mt-4 inline-block text-xs font-medium text-[var(--gp-badge-text)] hover:underline"
        >
          Ver suscripciones →
        </Link>
      </Card>
    </div>
  );
}
