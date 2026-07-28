"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import Briefcase from "@gravity-ui/icons/Briefcase";
import type { LifecycleStatus } from "../types";
import {
  LIFECYCLE_STATUS_LABELS,
  normalizeLifecycleStatus,
} from "../types";
import { apiUrl } from "@/src/utils/apiUrl";
import { gp } from "@/src/shared/ui/theme";
import { useApps } from "@/src/features/apps/hooks/useApps";
import { LIFECYCLE_STATUS_STYLE } from "./LifecycleStatusSelect";
import { LifecycleStatusInheritSelect } from "./LifecycleStatusInheritSelect";
import { formatPushSyncToast, type PushSyncPayload } from "@/src/shared/lib/push-sync-message";

function warnPushSync(data: PushSyncPayload, onError?: (msg: string) => void) {
  const msg = formatPushSyncToast(data, "Guardado, pero sync incompleto");
  if (msg) onError?.(msg);
}

type AssignmentRow = {
  app_id: number;
  status: LifecycleStatus | null;
  app_name?: string | null;
};

type ModuleAppsPanelProps = {
  moduleId: number;
  moduleName: string;
  globalStatus: LifecycleStatus;
  /** Canal del módulo: filtra apps web vs móvil. Default web. */
  channel?: "web" | "mobile";
  onChanged?: () => void;
  onError?: (message: string) => void;
};

export function ModuleAppsPanel({
  moduleId,
  moduleName,
  globalStatus,
  channel = "web",
  onChanged,
  onError,
}: ModuleAppsPanelProps) {
  const { apps: allApps } = useApps();
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAppId, setBusyAppId] = useState<number | null>(null);
  const modal = useOverlayState();

  const deploymentApps = useMemo(
    () =>
      allApps.filter((a) => {
        if (a.kind === "template") return false;
        if (channel === "mobile") return a.kind === "mobile";
        return a.kind === "deployment" || a.kind == null;
      }),
    [allApps, channel],
  );

  const assignedAppIds = useMemo(
    () => new Set(assignments.map((a) => a.app_id)),
    [assignments],
  );

  const overrideCount = assignments.filter((a) => a.status !== null).length;
  const assignedCount = assignments.length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/modules/${moduleId}/app-status`));
      if (!res.ok) throw new Error("No se pudieron cargar las apps del módulo");
      const data = (await res.json()) as AssignmentRow[];
      setAssignments(data);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [moduleId, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleAssignment(appId: number, assign: boolean) {
    setBusyAppId(appId);
    onError?.("");
    try {
      const res = await fetch(apiUrl(`/api/modules/${moduleId}/assign-app`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: appId, assigned: assign }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al asignar");
      warnPushSync(data, onError);
      await load();
      onChanged?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Error al asignar");
    } finally {
      setBusyAppId(null);
    }
  }

  async function saveStatus(appId: number, value: string) {
    setBusyAppId(appId);
    onError?.("");
    try {
      const clear =
        value === "" || value === "__global__" || value === "__inherit__";
      const res = await fetch(apiUrl(`/api/modules/${moduleId}/app-status`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          clear
            ? { app_id: appId, clear: true }
            : { app_id: appId, status: value },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar estado");
      warnPushSync(data, onError);
      await load();
      onChanged?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setBusyAppId(null);
    }
  }

  const statusByApp = new Map(assignments.map((a) => [a.app_id, a.status]));
  const globalLabel = LIFECYCLE_STATUS_LABELS[normalizeLifecycleStatus(globalStatus)];
  const globalStyle = LIFECYCLE_STATUS_STYLE[normalizeLifecycleStatus(globalStatus)];

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        className="h-8 gap-1.5 px-2.5 text-xs"
        onPress={() => {
          void load();
          modal.open();
        }}
      >
        <Briefcase width={13} height={13} />
        Apps
        {assignedCount > 0 ? (
          <span className="rounded-full bg-[var(--gp-badge-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--gp-badge-text)]">
            {assignedCount}
          </span>
        ) : null}
      </Button>

      <Modal state={modal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Apps · {moduleName}</Modal.Heading>
                <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
                  Asigná el módulo y, si hace falta, definí un estado distinto
                  al global para esa app. Aplica a todas las secciones salvo
                  override por sección.
                </p>
              </Modal.Header>
              <Modal.Body className="space-y-4">
                <div
                  className="rounded-xl border px-4 py-3"
                  style={{ borderColor: "var(--gp-border)" }}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--gp-text-muted)]">
                    Estado global del catálogo
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${globalStyle.chip}`}
                    >
                      <span className={`size-1.5 rounded-full ${globalStyle.dot}`} />
                      {globalLabel}
                    </span>
                    <span className="text-xs text-[var(--gp-text-muted)]">
                      Aplica a todas las apps salvo override
                    </span>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-10">
                    <Spinner size="sm" />
                  </div>
                ) : deploymentApps.length === 0 ? (
                  <p className="text-sm text-[var(--gp-text-muted)]">
                    No hay apps desplegadas disponibles.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_auto] gap-3 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]">
                      <span>App · asignación</span>
                      <span className="min-w-[140px] text-right">Estado en la app</span>
                    </div>
                    <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                      {deploymentApps.map((app) => {
                        const isAssigned = assignedAppIds.has(app.id);
                        const currentStatus = statusByApp.get(app.id);
                        const hasOverride = currentStatus != null;
                        const busy = busyAppId === app.id;

                        return (
                          <div
                            key={app.id}
                            className={`rounded-xl border p-3 transition-colors ${
                              isAssigned
                                ? "border-[var(--gp-primary)]/40 bg-[color-mix(in_srgb,var(--gp-primary)_12%,transparent)]"
                                : "border-[var(--gp-border)] bg-[var(--gp-surface-muted)]/30"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={isAssigned}
                                  disabled={busy}
                                  onChange={(e) =>
                                    void toggleAssignment(app.id, e.target.checked)
                                  }
                                  className="mt-1 size-4 rounded border-[var(--gp-input-border)]"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className={gp.iconBoxSm}>
                                      <Briefcase width={14} height={14} />
                                    </div>
                                    <p className="truncate text-sm font-semibold text-[var(--gp-text)]">
                                      {app.name || `App #${app.id}`}
                                      {app.kind === "mobile" ? (
                                        <span className="ml-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                                          Móvil
                                        </span>
                                      ) : null}
                                    </p>
                                  </div>
                                  <p className="mt-0.5 text-xs text-[var(--gp-text-muted)]">
                                    {isAssigned
                                      ? "Módulo asignado a esta app"
                                      : "Sin asignar — no estará disponible"}
                                  </p>
                                </div>
                              </label>

                              <div className="flex shrink-0 flex-col items-end gap-1">
                                {busy ? <Spinner size="sm" /> : null}
                                <LifecycleStatusInheritSelect
                                  value={hasOverride ? currentStatus : null}
                                  inheritLabel={globalLabel}
                                  disabled={!isAssigned}
                                  busy={busy}
                                  aria-label={`Estado del módulo en ${app.name || "app"}`}
                                  onChange={(v) => void saveStatus(app.id, v)}
                                />
                                {isAssigned && hasOverride ? (
                                  <span className="text-[10px] font-medium text-amber-700">
                                    Override activo
                                  </span>
                                ) : isAssigned ? (
                                  <span className="text-[10px] text-[var(--gp-text-muted)]">
                                    Usa global
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {assignedCount > 0 && (
                  <p className="text-xs text-[var(--gp-text-muted)]">
                    {assignedCount}{" "}
                    {assignedCount === 1 ? "app usa" : "apps usan"} este módulo
                    {overrideCount > 0
                      ? ` · ${overrideCount} con estado personalizado`
                      : ""}
                    .
                  </p>
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
    </>
  );
}
