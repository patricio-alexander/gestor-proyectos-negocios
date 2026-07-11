"use client";

import type { ComponentType } from "react";
import { Button, Card } from "@heroui/react";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import AntennaSignal from "@gravity-ui/icons/AntennaSignal";
import Layers from "@gravity-ui/icons/Layers";
import type { Module } from "../types";
import { countLimitedSections } from "../lib/module-stats";
import { gp } from "@/src/shared/ui/theme";
import { SectionLimitBadge } from "./SectionLimitBadge";
import { apiUrl } from "@/src/utils/apiUrl";
import { formatDate } from "@/src/shared/utils/format-display";

const MAX_VISIBLE_SECTIONS = 3;

type ModuleCardProps = {
  module: Module;
  onManageSections: (module: Module) => void;
  onEdit: (module: Module) => void;
  onDelete: (module: Module) => void;
};

export function ModuleCard({
  module: mod,
  onManageSections,
  onEdit,
  onDelete,
}: ModuleCardProps) {
  const limitedSections = countLimitedSections(mod);
  const visibleSections = mod.sections.slice(0, MAX_VISIBLE_SECTIONS);
  const hiddenSections = mod.sections.length - visibleSections.length;

  return (
    <Card className="gp-card gp-card-interactive flex h-full flex-col overflow-hidden p-0">
      <div className="relative">
        {mod.image_url ? (
          <img
            src={apiUrl(mod.image_url)}
            alt={mod.name}
            className="h-72 w-full object-cover"
          />
        ) : (
          <div className="flex h-72 w-full items-center justify-center bg-zinc-100">
            <div className="flex flex-col items-center gap-1.5">
              <Cubes3Overlap
                width={32}
                height={32}
                className="text-zinc-300"
              />
              <span className="text-[11px] font-medium text-zinc-300">
                Sin imagen
              </span>
            </div>
          </div>
        )}
        <div className="absolute right-2 top-2 flex gap-0.5">
          <Button
            size="sm"
            variant="ghost"
            aria-label={`Editar ${mod.name}`}
            onPress={() => onEdit(mod)}
            className="bg-white/80 backdrop-blur-xs hover:bg-white/95"
          >
            <Pencil width={14} height={14} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="bg-white/80 text-red-500 backdrop-blur-xs hover:bg-white/95"
            aria-label={`Eliminar ${mod.name}`}
            onPress={() => onDelete(mod)}
          >
            <TrashBin width={14} height={14} />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-[var(--gp-text)]">
              {mod.name}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {mod.app_name && (
                <span className={gp.badge}>{mod.app_name}</span>
              )}
              <ModuleStatusBadge active={mod.is_active} />
            </div>
            {mod.description && (
              <p className="mt-1.5 line-clamp-2 text-xs text-[var(--gp-text-muted)]">
                {mod.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <ModuleStatBlock
            icon={Layers}
            label="Secciones"
            value={mod.sections.length}
          />
          <ModuleStatBlock
            icon={AntennaSignal}
            label="Con límite"
            value={limitedSections}
            featured={limitedSections > 0}
          />
        </div>

        {mod.is_trial && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800">
              <span>Periodo de prueba</span>
              {mod.start_trial && mod.end_trial ? (
                <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  Activo
                </span>
              ) : (
                <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                  Sin iniciar
                </span>
              )}
            </div>
            {mod.start_trial && mod.end_trial ? (
              <div className="mt-1 flex items-center gap-3 text-xs text-amber-700">
                <span>Inicio: {formatDate(mod.start_trial)}</span>
                <span className="text-amber-300">|</span>
                <span>Fin: {formatDate(mod.end_trial)}</span>
              </div>
            ) : (
              <p className="mt-1 text-xs text-amber-700">
                {mod.limit_days_trial
                  ? `${mod.limit_days_trial} días configurados — iniciar vía endpoint`
                  : "Sin límite de días configurado"}
              </p>
            )}
          </div>
        )}

        {mod.sections.length > 0 ? (
          <div className="mt-4 flex-1 space-y-2">
            <p className="text-xs font-medium text-[var(--gp-text-muted)]">
              Vista previa
            </p>
            <div className="space-y-1.5">
              {visibleSections.map((sec) => (
                <div
                  key={sec.id}
                  className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2"
                  style={{
                    borderColor: "var(--gp-card-border)",
                    backgroundColor: "var(--gp-surface-muted)",
                  }}
                >
                  <span className="truncate text-xs font-medium text-[var(--gp-text)]">
                    {sec.name}
                  </span>
                  <SectionLimitBadge limit={sec.max_records_limit} />
                </div>
              ))}
              {hiddenSections > 0 && (
                <p className="text-xs text-[var(--gp-text-muted)]">
                  +{hiddenSections} sección{hiddenSections === 1 ? "" : "es"}{" "}
                  más
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-4 flex-1 text-xs text-[var(--gp-text-muted)]">
            Sin secciones. Agregá una para configurar límites remotos.
          </p>
        )}

        <div
          className="mt-5 border-t pt-4"
          style={{ borderColor: "var(--gp-border)" }}
        >
          <Button
            size="sm"
            className="w-full"
            style={{
              backgroundColor: "var(--gp-primary)",
              color: "var(--gp-primary-text)",
            }}
            onPress={() => onManageSections(mod)}
          >
            <Layers width={14} height={14} />
            Gestionar secciones
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ModuleStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{
        backgroundColor: active
          ? "rgba(34, 197, 94, 0.15)"
          : "var(--gp-surface-muted)",
        color: active ? "#16a34a" : "var(--gp-text-muted)",
      }}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

function ModuleStatBlock({
  icon: Icon,
  label,
  value,
  featured = false,
}: {
  icon: ComponentType<{ width?: number; height?: number }>;
  label: string;
  value: number;
  featured?: boolean;
}) {
  return (
    <div
      className="rounded-xl border px-3 py-3"
      style={{
        borderColor: featured
          ? "var(--gp-input-focus)"
          : "var(--gp-card-border)",
        backgroundColor: featured
          ? "var(--gp-badge-bg)"
          : "var(--gp-surface-muted)",
      }}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--gp-text-muted)]">
        <Icon width={12} height={12} />
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold text-[var(--gp-text)]">
        {value.toLocaleString("es-PE")}
      </p>
    </div>
  );
}
