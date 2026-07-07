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
      <div
        className="h-1 shrink-0"
        style={{
          background: mod.is_active
            ? "linear-gradient(90deg, var(--gp-primary), var(--gp-input-focus))"
            : "var(--gp-border)",
        }}
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className={gp.iconBoxSm}>
              <Cubes3Overlap width={18} height={18} />
            </div>
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
            </div>
          </div>

          <div className="flex shrink-0 gap-0.5">
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Editar ${mod.name}`}
              onPress={() => onEdit(mod)}
            >
              <Pencil width={14} height={14} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500"
              aria-label={`Eliminar ${mod.name}`}
              onPress={() => onDelete(mod)}
            >
              <TrashBin width={14} height={14} />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
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

        {mod.sections.length > 0 ? (
          <div className="mt-5 flex-1 space-y-2">
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
                  +{hiddenSections} sección{hiddenSections === 1 ? "" : "es"} más
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-5 flex-1 text-xs text-[var(--gp-text-muted)]">
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
        borderColor: featured ? "var(--gp-input-focus)" : "var(--gp-card-border)",
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
