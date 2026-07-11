"use client";

import Link from "next/link";
import { Card, Spinner } from "@heroui/react";
import Briefcase from "@gravity-ui/icons/Briefcase";
import CreditCard from "@gravity-ui/icons/CreditCard";
import ShieldKeyhole from "@gravity-ui/icons/ShieldKeyhole";
import Key from "@gravity-ui/icons/Key";
import ChartLine from "@gravity-ui/icons/ChartLine";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { useDashboardOverview } from "../hooks/useDashboardOverview";
import { StatCard } from "@/src/shared/components/StatCard";
import {
  StatusBadge,
  subscriptionStatusTone,
} from "@/src/shared/components/StatusBadge";
import { gp } from "@/src/shared/ui/theme";
import { formatDate, daysUntil } from "@/src/shared/utils/format-display";
import { NavIcon } from "@/src/shared/config/dashboard-nav-icons";
import { DashboardCharts } from "./DashboardCharts";
import { DashboardFinancialKpis } from "./DashboardFinancialKpis";
import Picture from "@gravity-ui/icons/Picture";
import Database from "@gravity-ui/icons/Database";

function formatMB(mb: number | null): string {
  if (mb == null) return "—";
  return `${mb.toFixed(1)} MB`;
}

const QUICK_LINKS = [
  { href: "/dashboard/apps", label: "Aplicaciones" },
  { href: "/dashboard/plans", label: "Planes" },
  { href: "/dashboard/modules", label: "Módulos" },
  { href: "/dashboard/offers", label: "Ofertas" },
  { href: "/dashboard/licenses", label: "Licencias" },
  { href: "/dashboard/subscriptions", label: "Suscripciones" },
  { href: "/dashboard/api-keys", label: "API Keys" },
];

export function DashboardOverview() {
  const { user } = useAuth();
  const { data, loading } = useDashboardOverview();
  const label = user?.display_name || user?.username || "Administrador";

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
          Resumen del control plane: licencias, suscripciones, ofertas y acceso
          remoto de tus aplicaciones cliente.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Briefcase}
          label="Aplicaciones"
          value={data.apps}
          hint={`${data.plans} planes · ${data.modules} módulos`}
        />
        <StatCard
          icon={CreditCard}
          label="Suscripciones activas"
          value={data.subscriptions.active}
          hint={`${data.subscriptions.total} en total`}
          featured={data.subscriptions.active > 0}
        />
        <StatCard
          icon={ShieldKeyhole}
          label="Licencias disponibles"
          value={data.licenses.available}
          hint={`${data.licenses.used} usadas`}
        />
        <StatCard
          icon={Key}
          label="API Keys activas"
          value={data.apiKeys.active}
          hint={`${data.apiKeys.total} generadas`}
        />
      </div>

      <DashboardFinancialKpis financial={data.financial} />

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Database width={18} height={18} className="text-[--gp-text-muted]" />
          <h2 className="text-sm font-semibold text-[--gp-text]">
            Almacenamiento por aplicación
          </h2>
        </div>
        {data.appList.filter(
          (a) => a.images_size != null || a.database_size != null,
        ).length === 0 ? (
          <Card className={`${gp.card} px-5 py-4`}>
            <p className={`${gp.subtitle} py-4 text-center text-sm`}>
              No hay datos de almacenamiento disponibles.
            </p>
          </Card>
        ) : (
          <div className={gp.card}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-[--gp-text-muted]"
                  style={{ borderColor: "var(--gp-card-border)" }}>
                  <th className="px-4 py-3 font-medium">Aplicación</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Picture width={13} height={13} />
                      Imágenes
                    </span>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Database width={13} height={13} />
                      Base de datos
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.appList
                  .filter((a) => a.images_size != null || a.database_size != null)
                  .map((app) => (
                    <tr
                      key={app.id}
                      className="border-b last:border-0"
                      style={{ borderColor: "var(--gp-card-border)" }}
                    >
                      <td className="px-4 py-3 font-medium text-[--gp-text]">
                        {app.name || "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[--gp-text]">
                        {formatMB(app.images_size)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[--gp-text]">
                        {formatMB(app.database_size)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DashboardCharts data={data} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className={`${gp.card} lg:col-span-2 px-5 py-4`}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--gp-text)]">
              Suscripciones recientes
            </h2>
            <Link
              href="/dashboard/subscriptions"
              className="text-xs font-medium text-[var(--gp-badge-text)] hover:underline"
            >
              Ver todas
            </Link>
          </div>
          {data.recentSubscriptions.length === 0 ? (
            <p className={`${gp.subtitle} py-6 text-center text-sm`}>
              Aún no hay suscripciones activadas.
            </p>
          ) : (
            <div className="space-y-2">
              {data.recentSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5"
                  style={{
                    borderColor: "var(--gp-card-border)",
                    backgroundColor: "var(--gp-surface-muted)",
                  }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--gp-text)]">
                      {sub.app_name || "—"} · {sub.plan_name || "Plan"}
                    </p>
                    <p className="text-xs text-[var(--gp-text-muted)]">
                      Vence {formatDate(sub.expires_at)}
                    </p>
                  </div>
                  <StatusBadge
                    label={
                      sub.status === "ACTIVE"
                        ? "Activa"
                        : sub.status === "EXPIRED"
                          ? "Vencida"
                          : "Cancelada"
                    }
                    tone={subscriptionStatusTone(sub.status)}
                  />
                </div>
              ))}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <AlertPanel
          title="Por vencer (30 días)"
          empty="No hay suscripciones por vencer pronto."
          items={data.expiringSubscriptions.map((sub) => ({
            id: sub.id,
            primary: `${sub.app_name} · ${sub.plan_name}`,
            secondary: `${daysUntil(sub.expires_at)} días restantes`,
          }))}
          href="/dashboard/subscriptions"
        />
        <AlertPanel
          title="Ofertas por finalizar (14 días)"
          empty="No hay ofertas próximas a vencer."
          items={data.expiringOffers.map((offer) => ({
            id: offer.id,
            primary: offer.name,
            secondary: `Vence ${formatDate(offer.expires_at)}`,
          }))}
          href="/dashboard/offers"
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
  items: { id: number; primary: string; secondary: string }[];
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
              className="rounded-lg border px-3 py-2"
              style={{
                borderColor: "var(--gp-card-border)",
                backgroundColor: "var(--gp-surface-muted)",
              }}
            >
              <p className="text-sm font-medium text-[var(--gp-text)]">
                {item.primary}
              </p>
              <p className="text-xs text-[var(--gp-text-muted)]">
                {item.secondary}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
