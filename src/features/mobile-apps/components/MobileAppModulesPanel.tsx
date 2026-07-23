"use client";

import { useCallback, useEffect, useState } from "react";
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
      appToast.success(assign ? "Módulo asignado" : "Módulo quitado");
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
      appToast.success("Módulo móvil creado y asignado");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={`${gp.card} flex flex-col`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--gp-border)] px-5 py-3">
        <div>
          <h3 className="text-sm font-semibold">Módulos móviles</h3>
          <p className="text-xs opacity-60">
            Definí módulos y secciones acá en el gestor. Lo no programado en la
            app va como «Próximamente». No afecta módulos web.
          </p>
        </div>
        <Button size="sm" onPress={createState.open}>
          <Plus width={14} height={14} />
          Nuevo módulo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : modules.length === 0 ? (
        <p className={gp.empty}>
          Aún no hay módulos móviles. Creá Impresión, Ventas, Inventario,
          Finanzas…
        </p>
      ) : (
        <ul className="divide-y divide-[var(--gp-border)]">
          {modules.map((mod) => {
            const assigned = assignedModuleIds.has(mod.id);
            const override = statusByModule.get(mod.id) ?? null;
            const globalStatus = normalizeLifecycleStatus(mod.status);
            const globalLabel = LIFECYCLE_STATUS_LABELS[globalStatus];
            const busy = busyKey?.endsWith(String(mod.id));
            const sections = (mod.sections ?? []).filter((s) => !s.deleted_at);
            return (
              <li key={mod.id} className="flex flex-col gap-3 px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--gp-text)]">
                      {mod.name}
                      <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                        Móvil
                      </span>
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
                    <p className="text-xs text-[var(--gp-text-muted)]">
                      {mod.key}
                      {mod.description ? ` · ${mod.description}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
                      {assigned
                        ? override
                          ? `Override app: ${LIFECYCLE_STATUS_LABELS[normalizeLifecycleStatus(override)]}`
                          : "Usa estado global"
                        : "No asignado a esta app"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={assigned}
                        disabled={!!busy}
                        onChange={(e) =>
                          void toggleAssign(mod.id, e.target.checked)
                        }
                      />
                      Incluir en {appName}
                    </label>
                    <LifecycleStatusInheritSelect
                      value={assigned ? override : null}
                      inheritLabel={globalLabel}
                      disabled={!assigned || !!busy}
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
                  </div>
                </div>
                {sections.length > 0 ? (
                  <ul className="ml-1 space-y-1 border-l-2 border-[var(--gp-border)] pl-3">
                    {sections.map((sec) => {
                      const st = normalizeLifecycleStatus(sec.status);
                      return (
                        <li
                          key={sec.id}
                          className="flex flex-wrap items-center gap-2 text-xs text-[var(--gp-text-muted)]"
                        >
                          <span className="text-[var(--gp-text)]">
                            {sec.name}
                          </span>
                          <span className="opacity-50">{sec.key}</span>
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
                              st === "planned"
                                ? "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-100"
                                : st === "active"
                                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                                  : "border-[var(--gp-border)] bg-[var(--gp-surface-muted)] text-[var(--gp-text-muted)]"
                            }`}
                          >
                            {LIFECYCLE_STATUS_LABELS[st]}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs opacity-50">Sin secciones aún</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

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
                  placeholder="Impresión / Archivos…"
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
                Crear y asignar
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
