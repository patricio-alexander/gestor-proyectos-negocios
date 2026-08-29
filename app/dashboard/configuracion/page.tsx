"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Database from "@gravity-ui/icons/Database";
import Gear from "@gravity-ui/icons/Gear";
import { BackupsManager } from "@/src/features/backups/components/BackupsManager";
import { gp } from "@/src/shared/ui/theme";

const TABS = [
  {
    id: "general",
    label: "General",
    href: "/dashboard/configuracion",
  },
  {
    id: "backups",
    label: "Backups",
    href: "/dashboard/configuracion?tab=backups",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

function resolveTab(raw: string | null): TabId {
  if (raw === "backups") return "backups";
  return "general";
}

function ConfigContent() {
  const searchParams = useSearchParams();
  const tab = resolveTab(searchParams.get("tab"));

  return (
    <div className={`${gp.page} gap-6`}>
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[var(--gp-text-muted)]">
          <Gear width={18} height={18} />
          <span className="text-xs font-medium uppercase tracking-wide">
            Sistema
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--gp-text)]">
          Configuración
        </h1>
        <p className="text-sm text-[var(--gp-text-muted)]">
          Ajustes del gestor Raptor Solutions. Por ahora backups JSON; luego
          sumaremos más opciones aquí.
        </p>
      </header>

      <div className="flex flex-wrap gap-1 border-b border-[var(--gp-border)]">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-[var(--gp-primary)] text-[var(--gp-text)]"
                  : "border-transparent text-[var(--gp-text-muted)] hover:text-[var(--gp-text)]"
              }`}
            >
              {item.id === "backups" ? (
                <Database width={14} height={14} />
              ) : (
                <Gear width={14} height={14} />
              )}
              {item.label}
            </Link>
          );
        })}
      </div>

      {tab === "general" ? (
        <div className={gp.cardPadded}>
          <h2 className={gp.titleLg}>General</h2>
          <p className="mt-2 text-sm text-[var(--gp-text-muted)]">
            Aquí irán preferencias del gestor (marca, notificaciones, sync,
            etc.). Mientras tanto usá la pestaña <strong>Backups</strong> para
            exportar, importar o recargar la base desde JSON.
          </p>
        </div>
      ) : (
        <BackupsManager embedded />
      )}
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense
      fallback={
        <div className={`${gp.page} text-sm text-[var(--gp-text-muted)]`}>
          Cargando configuración…
        </div>
      }
    >
      <ConfigContent />
    </Suspense>
  );
}
