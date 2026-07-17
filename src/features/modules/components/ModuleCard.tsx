"use client";

import { useState } from "react";
import { Button, Card, Modal, useOverlayState } from "@heroui/react";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Eye from "@gravity-ui/icons/Eye";
import Layers from "@gravity-ui/icons/Layers";
import Briefcase from "@gravity-ui/icons/Briefcase";
import Persons from "@gravity-ui/icons/Persons";
import type { Module } from "../types";
import {
  LIFECYCLE_STATUS_LABELS,
  normalizeLifecycleStatus,
} from "../types";
import { deriveModuleStatusFromSections } from "@/src/shared/lib/lifecycle-status-resolve";
import { gp } from "@/src/shared/ui/theme";
import { apiUrl } from "@/src/utils/apiUrl";
import { LIFECYCLE_STATUS_STYLE } from "./LifecycleStatusSelect";
import { ModuleAccessPanel } from "./ModuleAccessPanel";

type ModuleCardProps = {
  module: Module;
  onEdit: (module: Module) => void;
  onDelete: (module: Module) => void;
  onModuleUpdate: (module: Module) => void;
  onAppsChanged?: () => void;
};

export function ModuleCard({
  module: mod,
  onEdit,
  onDelete,
  onModuleUpdate,
  onAppsChanged,
}: ModuleCardProps) {
  const detailsModal = useOverlayState();
  const appsModal = useOverlayState();
  const [accessOpen, setAccessOpen] = useState(false);
  const appsUsing = mod.apps_using ?? [];
  const appsCount = mod.apps_count ?? appsUsing.length;
  const storedStatus = normalizeLifecycleStatus(mod.status);
  const effectiveStatus = deriveModuleStatusFromSections(
    mod.sections,
    storedStatus,
  );
  const statusDiffers = effectiveStatus !== storedStatus;
  const badgeStatus = effectiveStatus;
  const statusStyle = LIFECYCLE_STATUS_STYLE[badgeStatus];
  const activeSections = mod.sections.filter(
    (s) => normalizeLifecycleStatus(s.status) === "active",
  ).length;
  const maintenanceSections = mod.sections.filter(
    (s) => normalizeLifecycleStatus(s.status) === "maintenance",
  );
  const maintenanceCount = maintenanceSections.length;

  return (
    <>
      <Card className="gp-card gp-card-interactive flex h-full flex-col overflow-hidden p-0">
        <div className="flex flex-1 flex-col gap-2.5 p-3.5">
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
                      {LIFECYCLE_STATUS_LABELS[badgeStatus]}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--gp-text-muted)]">
                    {mod.description || "Sin descripción"}
                    {statusDiffers ? (
                      <span className="ml-1 text-amber-700">
                        · Catálogo: {LIFECYCLE_STATUS_LABELS[storedStatus]}
                      </span>
                    ) : null}
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

          <Button
            size="sm"
            variant="secondary"
            className="h-9 w-full justify-center gap-2 text-xs font-semibold"
            onPress={() => setAccessOpen(true)}
          >
            <Briefcase width={14} height={14} />
            Acceso y estados
            {appsCount > 0 ? (
              <span className="rounded-full bg-indigo-100 px-1.5 py-px text-[10px] text-indigo-700">
                {appsCount} {appsCount === 1 ? "app" : "apps"}
              </span>
            ) : null}
          </Button>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
              <Layers width={11} height={11} />
              {mod.sections.length} secc.
              {activeSections > 0
                ? ` · ${activeSections} activa${activeSections === 1 ? "" : "s"}`
                : ""}
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
              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-zinc-200"
            >
              <Persons width={11} height={11} />
              {appsCount} {appsCount === 1 ? "app" : "apps"}
            </button>
            {mod.is_trial ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                Trial {mod.limit_days_trial ? `(${mod.limit_days_trial}d)` : null}
              </span>
            ) : null}
          </div>

          <div
            className="mt-auto flex gap-1.5 border-t pt-2.5"
            style={{ borderColor: "var(--gp-border)" }}
          >
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onPress={() => detailsModal.open()}
            >
              <Eye width={12} height={12} />
              Detalle
            </Button>
          </div>
        </div>

        <Modal state={detailsModal}>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog className="flex max-h-[min(92dvh,720px)] w-[calc(100vw-2rem)] max-w-lg flex-col overflow-hidden">
                <Modal.CloseTrigger />
                <Modal.Header className="shrink-0">
                  <Modal.Heading className="truncate">Detalle · {mod.name}</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusStyle.chip}`}
                    >
                      <span className={`size-1.5 rounded-full ${statusStyle.dot}`} />
                      Módulo: {LIFECYCLE_STATUS_LABELS[badgeStatus]}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                      {mod.sections.length} secciones
                    </span>
                  </div>
                  {mod.description ? (
                    <p className="text-sm text-[var(--gp-text-muted)]">{mod.description}</p>
                  ) : null}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]">
                      Secciones
                    </p>
                    {mod.sections.length === 0 ? (
                      <p className="text-sm text-[var(--gp-text-muted)]">Sin secciones.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {mod.sections.map((sec) => {
                          const secStatus = normalizeLifecycleStatus(sec.status);
                          const secStyle = LIFECYCLE_STATUS_STYLE[secStatus];
                          return (
                            <li
                              key={sec.id}
                              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                              style={{ borderColor: "var(--gp-border)" }}
                            >
                              <p className="truncate text-sm font-medium">{sec.name}</p>
                              <span
                                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${secStyle.chip}`}
                              >
                                {LIFECYCLE_STATUS_LABELS[secStatus]}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </Modal.Body>
                <Modal.Footer className="shrink-0">
                  <Button variant="secondary" slot="close">
                    Cerrar
                  </Button>
                  <Button
                    onPress={() => {
                      detailsModal.close();
                      setAccessOpen(true);
                    }}
                  >
                    Acceso y estados
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
                      Ninguna app vinculada. Usá &quot;Acceso y estados&quot; para asignar.
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
                          <p className="truncate text-sm font-medium">
                            {app.name || "Sin nombre"}
                          </p>
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

      <ModuleAccessPanel
        module={mod}
        open={accessOpen}
        onClose={() => setAccessOpen(false)}
        onModuleUpdate={onModuleUpdate}
        onChanged={onAppsChanged}
      />
    </>
  );
}
