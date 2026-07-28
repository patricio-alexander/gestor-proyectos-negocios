"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Input,
  Modal,
  Spinner,
  TextArea,
  useOverlayState,
} from "@heroui/react";
import Plus from "@gravity-ui/icons/Plus";
import { gp } from "@/src/shared/ui/theme";
import { appToast } from "@/src/shared/utils/app-toast";
import { apiUrl } from "@/src/utils/apiUrl";
import { useModules } from "@/src/features/modules/hooks/useModules";
import type { LifecycleStatus, Module } from "@/src/features/modules/types";
import {
  LIFECYCLE_STATUS_LABELS,
  normalizeLifecycleStatus,
} from "@/src/features/modules/types";
import { LifecycleStatusInheritSelect } from "@/src/features/modules/components/LifecycleStatusInheritSelect";
import { ModuleAccessPanel } from "@/src/features/modules/components/ModuleAccessPanel";

type AssignmentRow = {
  app_id: number;
  status: LifecycleStatus | null;
  app_name?: string | null;
};

type Props = {
  /** Apps.id (kind=mobile) de esta app móvil */
  controlAppId: number;
  appName: string;
};

export function MobileAppModulesPanel({ controlAppId, appName }: Props) {
  const { modules, loading, create, patchModule, refetch } =
    useModules("mobile");

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [accessModule, setAccessModule] = useState<Module | null>(null);
  const addState = useOverlayState();
  const createState = useOverlayState();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [statusByModule, setStatusByModule] = useState<
    Map<number, LifecycleStatus | null>
  >(new Map());
  const [assignedModuleIds, setAssignedModuleIds] = useState<Set<number>>(
    new Set(),
  );

  const refreshPerModule = useCallback(async () => {
    const assigned = new Set<number>();
    const statuses = new Map<number, LifecycleStatus | null>();
    await Promise.all(
      modules.map(async (mod) => {
        try {
          const res = await fetch(apiUrl(`/api/modules/${mod.id}/app-status`));
          if (!res.ok) return;
          const data = (await res.json()) as AssignmentRow[];
          const mine = data.find((r) => r.app_id === controlAppId);
          if (mine) {
            assigned.add(mod.id);
            statuses.set(mod.id, mine.status);
          }
        } catch {
          /* ignore */
        }
      }),
    );
    setAssignedModuleIds(assigned);
    setStatusByModule(statuses);
  }, [modules, controlAppId]);

  useEffect(() => {
    void refreshPerModule();
  }, [refreshPerModule]);

  const assignedModules = useMemo(
    () => modules.filter((m) => assignedModuleIds.has(m.id)),
    [modules, assignedModuleIds],
  );

  const availableModules = useMemo(
    () => modules.filter((m) => !assignedModuleIds.has(m.id)),
    [modules, assignedModuleIds],
  );

  async function toggleAssign(moduleId: number, assign: boolean) {
    setBusyKey(`assign-${moduleId}`);
    try {
      const res = await fetch(apiUrl(`/api/modules/${moduleId}/assign-app`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: controlAppId, assigned: assign }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al asignar");
      appToast.success(assign ? "Módulo añadido" : "Módulo quitado");
      await refreshPerModule();
      await refetch();
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusyKey(null);
    }
  }

  async function saveStatus(moduleId: number, value: string) {
    setBusyKey(`status-${moduleId}`);
    try {
      const clear =
        value === "" || value === "__inherit__" || value === "__global__";
      const res = await fetch(apiUrl(`/api/modules/${moduleId}/app-status`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          clear
            ? { app_id: controlAppId, clear: true }
            : { app_id: controlAppId, status: value },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar estado");
      appToast.success("Estado guardado");
      await refreshPerModule();
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusyKey(null);
    }
  }

  async function onCreateModule() {
    if (!newName.trim()) {
      appToast.warning("Nombre obligatorio");
      return;
    }
    setCreating(true);
    try {
      const mod = await create({
        name: newName.trim(),
        description: newDesc.trim() || null,
        channel: "mobile",
      });
      await toggleAssign(mod.id, true);
      setNewName("");
      setNewDesc("");
      createState.close();
      addState.close();
      appToast.success("Módulo creado y añadido");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={`${gp.card} flex flex-col`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--gp-border)] px-4 py-2.5">
        <div>
          <h3 className="text-sm font-semibold">
            Módulos de {appName}
            <span className="ml-2 text-xs font-normal opacity-60">
              {assignedModules.length}
            </span>
          </h3>
          <p className="text-xs opacity-60">
            Solo los incluidos en esta app. Añadí más desde el catálogo móvil.
          </p>
        </div>
        <Button size="sm" onPress={addState.open}>
          <Plus width={14} height={14} />
          Añadir módulo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : assignedModules.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm opacity-70">
            Esta app no tiene módulos asignados.
          </p>
          <Button size="sm" className="mt-3" onPress={addState.open}>
            <Plus width={14} height={14} />
            Añadir el primero
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--gp-border)]">
          {assignedModules.map((mod) => {
            const override = statusByModule.get(mod.id) ?? null;
            const globalStatus = normalizeLifecycleStatus(mod.status);
            const globalLabel = LIFECYCLE_STATUS_LABELS[globalStatus];
            const busy = busyKey?.endsWith(String(mod.id));
            const sections = (mod.sections ?? []).filter((s) => !s.deleted_at);
            return (
              <li key={mod.id} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--gp-text)]">
                      {mod.name}
                      <span
                        className={`ml-2 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                          globalStatus === "planned"
                            ? "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-100"
                            : globalStatus === "active"
                              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                              : "border-[var(--gp-border)] bg-[var(--gp-surface-muted)] text-[var(--gp-text-muted)]"
                        }`}
                      >
                        {globalLabel}
                      </span>
                    </p>
                    <p className="truncate text-xs text-[var(--gp-text-muted)]">
                      {mod.key}
                      {override
                        ? ` · override: ${LIFECYCLE_STATUS_LABELS[normalizeLifecycleStatus(override)]}`
                        : " · estado global"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <LifecycleStatusInheritSelect
                      value={override}
                      inheritLabel={globalLabel}
                      disabled={!!busy}
                      busy={busyKey === `status-${mod.id}`}
                      aria-label={`Estado de ${mod.name}`}
                      onChange={(v) => void saveStatus(mod.id, v)}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onPress={() => setAccessModule(mod)}
                    >
                      Secciones
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      isDisabled={!!busy}
                      onPress={() => {
                        if (
                          !confirm(
                            `¿Quitar «${mod.name}» de ${appName}? No se elimina del catálogo.`,
                          )
                        ) {
                          return;
                        }
                        void toggleAssign(mod.id, false);
                      }}
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
                {sections.length > 0 ? (
                  <ul className="ml-1 flex flex-wrap gap-1.5">
                    {sections.map((sec) => {
                      const st = normalizeLifecycleStatus(sec.status);
                      return (
                        <li
                          key={sec.id}
                          className={`rounded border px-2 py-0.5 text-[11px] ${
                            st === "planned"
                              ? "border-amber-500/30 bg-amber-500/10"
                              : st === "active"
                                ? "border-emerald-500/30 bg-emerald-500/10"
                                : "border-[var(--gp-border)] bg-[var(--gp-surface-muted)]"
                          }`}
                          title={sec.key ?? undefined}
                        >
                          {sec.name}
                          <span className="ml-1 opacity-50">
                            {LIFECYCLE_STATUS_LABELS[st]}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs opacity-50">Sin secciones</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Añadir desde catálogo (no asignados) */}
      <Modal.Backdrop isOpen={addState.isOpen} onOpenChange={addState.setOpen}>
        <Modal.Container>
          <Modal.Dialog className="max-w-lg">
            <Modal.Header>
              <Modal.Heading>Añadir módulo a {appName}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              {availableModules.length === 0 ? (
                <p className="text-sm opacity-70">
                  No hay módulos móviles disponibles fuera de esta app. Creá uno
                  nuevo.
                </p>
              ) : (
                <ul className="max-h-64 divide-y divide-[var(--gp-border)] overflow-y-auto rounded-lg border border-[var(--gp-border)]">
                  {availableModules.map((mod) => {
                    const st = normalizeLifecycleStatus(mod.status);
                    const busy = busyKey === `assign-${mod.id}`;
                    return (
                      <li
                        key={mod.id}
                        className="flex items-center justify-between gap-2 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {mod.name}
                          </p>
                          <p className="truncate text-xs opacity-60">
                            {mod.key} · {LIFECYCLE_STATUS_LABELS[st]}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          isDisabled={!!busy}
                          onPress={() => void toggleAssign(mod.id, true)}
                        >
                          Incluir
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Button
                variant="secondary"
                onPress={() => {
                  createState.open();
                }}
              >
                <Plus width={14} height={14} />
                Crear módulo nuevo
              </Button>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={addState.close}>
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop
        isOpen={createState.isOpen}
        onOpenChange={createState.setOpen}
      >
        <Modal.Container>
          <Modal.Dialog className="max-w-md">
            <Modal.Header>
              <Modal.Heading>Nuevo módulo móvil</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-3">
              <label className={gp.label}>
                Nombre
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Pantalla / Impresión…"
                />
              </label>
              <label className={gp.label}>
                Descripción
                <TextArea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                />
              </label>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={createState.close}>
                Cancelar
              </Button>
              <Button
                onPress={() => void onCreateModule()}
                isDisabled={creating}
              >
                Crear y añadir
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {accessModule ? (
        <ModuleAccessPanel
          module={{ ...accessModule, channel: "mobile" }}
          open={!!accessModule}
          onClose={() => setAccessModule(null)}
          onModuleUpdate={(m) => {
            patchModule(m.id, () => m);
            setAccessModule(m);
          }}
          onChanged={() => {
            void refetch();
            void refreshPerModule();
          }}
          initialAppId={controlAppId}
        />
      ) : null}
    </div>
  );
}
