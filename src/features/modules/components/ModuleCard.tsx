"use client";

import { Button, Card, Modal, useOverlayState } from "@heroui/react";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Eye from "@gravity-ui/icons/Eye";
import Layers from "@gravity-ui/icons/Layers";
import Briefcase from "@gravity-ui/icons/Briefcase";
import Persons from "@gravity-ui/icons/Persons";
import type { LifecycleStatus, Module } from "../types";
import {
  LIFECYCLE_STATUS_LABELS,
  normalizeLifecycleStatus,
} from "../types";
import { gp } from "@/src/shared/ui/theme";
import { apiUrl } from "@/src/utils/apiUrl";
import {
  LifecycleStatusSelect,
  LIFECYCLE_STATUS_STYLE,
} from "./LifecycleStatusSelect";
import { ModuleAppsPanel } from "./ModuleAppsPanel";

type ModuleCardProps = {
  module: Module;
  onManageSections: (module: Module) => void;
  onEdit: (module: Module) => void;
  onDelete: (module: Module) => void;
  onChangeStatus: (module: Module, status: LifecycleStatus) => void;
  onAppsChanged?: () => void;
};

export function ModuleCard({
  module: mod,
  onManageSections,
  onEdit,
  onDelete,
  onChangeStatus,
  onAppsChanged,
}: ModuleCardProps) {
  const detailsModal = useOverlayState();
  const appsModal = useOverlayState();
  const appsUsing = mod.apps_using ?? [];
  const appsCount = mod.apps_count ?? appsUsing.length;
  const status = normalizeLifecycleStatus(mod.status);
  const statusStyle = LIFECYCLE_STATUS_STYLE[status];
  const maintenanceSections = mod.sections.filter(
    (s) => normalizeLifecycleStatus(s.status) === "maintenance",
  );
  const maintenanceCount = maintenanceSections.length;

  return (
    <Card className="gp-card gp-card-interactive flex h-full flex-col overflow-hidden p-0">
      <div className="flex flex-1 flex-col gap-2.5 p-3.5">
        {/* Header: icon + name + status badge + actions */}
        <div className="flex items-start gap-3">
          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
            {mod.image_url ? (
              <img
                src={apiUrl(mod.image_url)}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Cubes3Overlap width={18} height={18} className="text-zinc-300" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-sm font-semibold text-[var(--gp-text)]">
                    {mod.name}
                  </h3>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-px text-[9px] font-semibold ${statusStyle.chip}`}
                  >
                    <span className={`size-1.5 rounded-full ${statusStyle.dot}`} />
                    {LIFECYCLE_STATUS_LABELS[status]}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--gp-text-muted)]">
                  {mod.description || "Sin descripción"}
                </p>
              </div>
              <div className="flex shrink-0 gap-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Editar ${mod.name}`}
                  onPress={() => onEdit(mod)}
                  className="min-w-0 px-1"
                >
                  <Pencil width={12} height={12} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="min-w-0 px-1 text-red-500"
                  aria-label={`Eliminar ${mod.name}`}
                  onPress={() => onDelete(mod)}
                >
                  <TrashBin width={12} height={12} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Estado global + apps */}
        <div
          className="space-y-3 rounded-xl border p-3"
          style={{ borderColor: "var(--gp-border)" }}
        >
          <div>
            <p className="text-xs font-semibold text-[var(--gp-text)]">
              Estado en catálogo
            </p>
            <p className="mb-2 text-[11px] text-[var(--gp-text-muted)]">
              Valor por defecto para todas las apps que usen este módulo.
            </p>
            <LifecycleStatusSelect
              value={status}
              onChange={(next) => onChangeStatus(mod, next)}
              aria-label={`Estado global de ${mod.name}`}
            />
          </div>
          <div
            className="border-t pt-3"
            style={{ borderColor: "var(--gp-border)" }}
          >
            <p className="text-xs font-semibold text-[var(--gp-text)]">
              Apps que lo usan
            </p>
            <p className="mb-2 text-[11px] text-[var(--gp-text-muted)]">
              Asigná el módulo a cada app y ajustá el estado solo donde haga falta.
            </p>
            <ModuleAppsPanel
              moduleId={mod.id}
              moduleName={mod.name}
              globalStatus={status}
              onChanged={onAppsChanged}
            />
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
            <Layers width={11} height={11} />
            {mod.sections.length} secc.
          </span>
          {maintenanceCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">
              <span className="size-1.5 rounded-full bg-red-500" />
              {maintenanceCount} en mant.
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => appsModal.open()}
            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-200 transition-colors"
          >
            <Persons width={11} height={11} />
            {appsCount} {appsCount === 1 ? "app" : "apps"}
          </button>
          {mod.is_trial ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">
              Trial {mod.limit_days_trial ? `(${mod.limit_days_trial}d)` : null}
            </span>
          ) : null}
          {mod.is_maintainer ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700">
              Mantenimiento
            </span>
          ) : null}
        </div>

        {/* Action buttons */}
        <div
          className="mt-auto flex gap-1.5 border-t pt-2.5"
          style={{ borderColor: "var(--gp-border)" }}
        >
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onPress={() => detailsModal.open()}
          >
            <Eye width={12} height={12} />
            Detalle
          </Button>
          <Button
            size="sm"
            className="flex-1"
            style={{
              backgroundColor: "var(--gp-primary)",
              color: "var(--gp-primary-text)",
            }}
            onPress={() => onManageSections(mod)}
          >
            <Layers width={12} height={12} />
            Secciones
          </Button>
        </div>
      </div>

      <Modal state={detailsModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-lg">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Detalle · {mod.name}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusStyle.chip}`}
                  >
                    <span className={`size-1.5 rounded-full ${statusStyle.dot}`} />
                    Módulo: {LIFECYCLE_STATUS_LABELS[status]}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                    {mod.sections.length} secciones
                  </span>
                  {maintenanceCount > 0 ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                      {maintenanceCount} en mantenimiento
                    </span>
                  ) : null}
                </div>

                {mod.description ? (
                  <p className="text-sm text-[var(--gp-text-muted)]">
                    {mod.description}
                  </p>
                ) : null}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]">
                    Secciones
                  </p>
                  {mod.sections.length === 0 ? (
                    <p className="text-sm text-[var(--gp-text-muted)]">
                      Sin secciones.
                    </p>
                  ) : (
                    <ul className="max-h-72 space-y-1.5 overflow-y-auto">
                      {[...mod.sections]
                        .sort((a, b) => {
                          const rank = (s: string | undefined) =>
                            normalizeLifecycleStatus(s) === "maintenance"
                              ? 0
                              : 1;
                          return rank(a.status) - rank(b.status);
                        })
                        .map((sec) => {
                          const secStatus = normalizeLifecycleStatus(sec.status);
                          const secStyle = LIFECYCLE_STATUS_STYLE[secStatus];
                          return (
                            <li
                              key={sec.id}
                              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                              style={{ borderColor: "var(--gp-border)" }}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[var(--gp-text)]">
                                  {sec.name}
                                </p>
                                {sec.key ? (
                                  <p className="truncate font-mono text-[10px] text-[var(--gp-text-muted)]">
                                    {sec.key}
                                  </p>
                                ) : null}
                              </div>
                              <span
                                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${secStyle.chip}`}
                              >
                                <span className={`size-1.5 rounded-full ${secStyle.dot}`} />
                                {LIFECYCLE_STATUS_LABELS[secStatus]}
                              </span>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" slot="close">
                  Cerrar
                </Button>
                <Button
                  onPress={() => {
                    detailsModal.close();
                    onManageSections(mod);
                  }}
                >
                  Gestionar secciones
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={appsModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Apps · {mod.name}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {appsUsing.length === 0 ? (
                  <p className="text-sm text-[var(--gp-text-muted)]">
                    Ninguna app vinculada.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {appsUsing.map((app) => (
                      <li
                        key={app.hash}
                        className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                        style={{ borderColor: "var(--gp-border)" }}
                      >
                        <div className={gp.iconBoxSm}>
                          <Briefcase width={14} height={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {app.name || "Sin nombre"}
                          </p>
                          <p className="truncate font-mono text-[10px] text-[var(--gp-text-muted)]">
                            {app.hash}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" slot="close">
                  Cerrar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Card>
  );
}
