"use client";

import Link from "next/link";
import { Card, Spinner } from "@heroui/react";
import Briefcase from "@gravity-ui/icons/Briefcase";
import ChartLine from "@gravity-ui/icons/ChartLine";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import CreditCard from "@gravity-ui/icons/CreditCard";
import Smartphone from "@gravity-ui/icons/Smartphone";
import AntennaSignal from "@gravity-ui/icons/AntennaSignal";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { useDashboardOverview } from "../hooks/useDashboardOverview";
import { DashboardOperationalPanels } from "./DashboardOperationalPanels";
import { DashboardLoadChart } from "./DashboardLoadChart";
import { DashboardHealthCandles } from "./DashboardHealthCandles";
import { StatCard } from "@/src/shared/components/StatCard";
import {
  StatusBadge,
  subscriptionStatusTone,
} from "@/src/shared/components/StatusBadge";
import { gp } from "@/src/shared/ui/theme";
import { formatDate, daysUntil } from "@/src/shared/utils/format-display";
import { NavIcon } from "@/src/shared/config/dashboard-nav-icons";
import type { App } from "@/src/features/apps/types";

const QUICK_LINKS = [
  { href: "/dashboard/apps", label: "Gestionar apps" },
  { href: "/dashboard/kanban", label: "Apps web" },
  { href: "/dashboard/mobile-apps", label: "Apps móvil" },
  { href: "/dashboard/modules", label: "Módulos" },
  { href: "/dashboard/subscriptions", label: "Suscripciones" },
  { href: "/dashboard/events", label: "Eventos" },
];

const APP_PRIORITY = ["eddeli", "store", "tienda"];
// Turnos se añadirá aquí al registrarse su endpoint y entitlement en el gestor.

function appPriority(app: App) {
  const searchable = `${app.name ?? ""} ${app.path ?? ""}`.toLowerCase();
  const index = APP_PRIORITY.findIndex((key) => searchable.includes(key));
  return index === -1 ? APP_PRIORITY.length : index;
}

function syncLabel(app: App, state: string | undefined) {
  if (app.kind === "mobile") return { label: "Móvil", tone: "info" as const };
  if (state === "online") return { label: "En línea", tone: "success" as const };
  if (state === "offline") return { label: "Sin conexión", tone: "danger" as const };
  if (state === "no_secret") return { label: "Sin secreto", tone: "warning" as const };
  return { label: "Sin configurar", tone: "neutral" as const };
}

function appKindLabel(app: App) {
  if (app.kind === "mobile") return "Móvil";
  if (app.kind === "template") return "Plantilla";
  return "Web";
}

export function DashboardOverview() {
  const { user } = useAuth();
  const { data, loading } = useDashboardOverview();
  const label = user?.display_name || user?.username || "Administrador";
  const priorityApps = [...data.appList]
    .sort((a, b) => appPriority(a) - appPriority(b))
    .slice(0, 8);

  if (loading) {
    return (
      <div className={`${gp.page} items-center justify-center`}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={gp.pageGap8}>
      <div>
        <div className="flex items-center gap-3">
          <ChartLine width={28} height={28} className="gp-icon-box-text" />
          <h1 className={gp.titleLg}>Hola, {label}</h1>
        </div>
        <p className={gp.subtitleBlock}>
          Centro de control de tus productos, módulos y aplicaciones conectadas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <StatCard
          icon={Briefcase}
          label="Aplicaciones"
          value={data.apps}
          hint="Web y móviles registradas"
        />
        <StatCard
          icon={ChartLine}
          label="Apps web"
          value={data.webApps}
          hint="EdDeli, Store, Tienda y otras"
        />
        <StatCard
          icon={Smartphone}
          label="Apps móviles"
          value={data.mobileApps}
          hint={`${data.onlineDevices} dispositivo(s) en línea`}
        />
        <StatCard
          icon={Cubes3Overlap}
          label="Módulos"
          value={data.modules}
          hint="Disponibles en el catálogo"
        />
        <StatCard
          icon={CreditCard}
          label="Suscripciones"
          value={data.subscriptions.active}
          hint={`${data.subscriptions.total} registradas`}
          featured={data.subscriptions.active > 0}
        />
        <StatCard
          icon={AntennaSignal}
          label="Sync en línea"
          value={data.syncHealth.online}
          hint={`${data.syncHealth.offline} con incidencia`}
          featured={data.syncHealth.offline === 0 && data.syncHealth.online > 0}
        />
      </div>

      <DashboardOperationalPanels data={data} />

      <DashboardLoadChart />
      <DashboardHealthCandles />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className={`${gp.card} overflow-hidden xl:col-span-2`}>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--gp-text)]">
                Aplicaciones conectadas
              </h2>
              <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
                EdDeli, Store y Tienda aparecen primero. Turnos se integrará aquí cuando
                esté registrada como aplicación.
              </p>
            </div>
            <Link
              href="/dashboard/apps"
              className="text-xs font-medium text-[var(--gp-badge-text)] hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          {priorityApps.length === 0 ? (
            <p className={`${gp.subtitle} px-5 py-10 text-center text-sm`}>
              Todavía no hay aplicaciones registradas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[690px] text-sm">
                <thead>
                  <tr
                    className="border-y text-left text-xs uppercase tracking-wider text-[--gp-text-muted]"
                    style={{ borderColor: "var(--gp-card-border)" }}
                  >
                    <th className="px-5 py-3 font-medium">Aplicación</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Módulos</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 text-right font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {priorityApps.map((app) => {
                    const sync = syncLabel(app, data.syncByAppId[app.id]?.state);
                    return (
                      <tr
                        key={app.id}
                        className="border-b last:border-0"
                        style={{ borderColor: "var(--gp-card-border)" }}
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium text-[var(--gp-text)]">
                            {app.name || "Sin nombre"}
                          </p>
                          <p className="text-xs text-[var(--gp-text-muted)]">
                            {app.owner_name || app.ruc || "Sin responsable asignado"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-[var(--gp-text-muted)]">
                          {appKindLabel(app)}
                        </td>
                        <td className="px-4 py-3 text-[var(--gp-text-muted)]">
                          {app.plan?.name || "Sin plan"}
                        </td>
                        <td className="px-4 py-3 text-[var(--gp-text-muted)]">
                          {app.modules?.length ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {app.maintenance ? (
                              <StatusBadge label="Mantenimiento" tone="warning" />
                            ) : null}
                            <StatusBadge label={sync.label} tone={sync.tone} />
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href="/dashboard/apps"
                            className="text-xs font-medium text-[var(--gp-badge-text)] hover:underline"
                          >
                            Gestionar
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className={`${gp.card} px-5 py-4`}>
          <h2 className="mb-4 text-sm font-semibold text-[var(--gp-text)]">
            Accesos rápidos
          </h2>
          <div className="grid gap-2">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${gp.cardInteractive} flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium`}
                style={{ color: "var(--gp-text)" }}
              >
                <span className={gp.iconBoxSm}>
                  <NavIcon href={item.href} width={16} height={16} />
                </span>
                {item.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AlertPanel
          title="Suscripciones por vencer (30 días)"
          empty="No hay suscripciones por vencer pronto."
          items={data.expiringSubscriptions.map((sub) => ({
            id: sub.id,
            primary: `${sub.app_name} · ${sub.plan_name}`,
            secondary: `${daysUntil(sub.expires_at)} días restantes`,
            status: sub.status,
          }))}
          href="/dashboard/subscriptions"
        />
        <AlertPanel
          title="Suscripciones recientes"
          empty="Aún no hay suscripciones activadas."
          items={data.recentSubscriptions.map((sub) => ({
            id: sub.id,
            primary: `${sub.app_name || "—"} · ${sub.plan_name || "Plan"}`,
            secondary: `Vence ${formatDate(sub.expires_at)}`,
            status: sub.status,
          }))}
          href="/dashboard/subscriptions"
        />
      </div>
    </div>
  );
}

function AlertPanel({
  title,
  empty,
  items,
  href,
}: {
  title: string;
  empty: string;
  items: { id: number; primary: string; secondary: string; status: string }[];
  href: string;
}) {
  return (
    <Card className={`${gp.card} px-5 py-4`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--gp-text)]">{title}</h2>
        <Link
          href={href}
          className="text-xs font-medium text-[var(--gp-badge-text)] hover:underline"
        >
          Gestionar
        </Link>
      </div>
      {items.length === 0 ? (
        <p className={`${gp.subtitle} text-sm`}>{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              style={{
                borderColor: "var(--gp-card-border)",
                backgroundColor: "var(--gp-surface-muted)",
              }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--gp-text)]">
                  {item.primary}
                </p>
                <p className="text-xs text-[var(--gp-text-muted)]">{item.secondary}</p>
              </div>
              <StatusBadge
                label={
                  item.status === "ACTIVE"
                    ? "Activa"
                    : item.status === "EXPIRED"
                      ? "Vencida"
                      : "Cancelada"
                }
                tone={subscriptionStatusTone(item.status)}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
