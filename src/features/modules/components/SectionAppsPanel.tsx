"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import Briefcase from "@gravity-ui/icons/Briefcase";
import type { LifecycleStatus, LinkedApp } from "../types";
import {
  LIFECYCLE_STATUS_LABELS,
  LIFECYCLE_STATUS_OPTIONS,
  normalizeLifecycleStatus,
} from "../types";
import { apiUrl } from "@/src/utils/apiUrl";
import { gp } from "@/src/shared/ui/theme";
import { LIFECYCLE_STATUS_STYLE } from "./LifecycleStatusSelect";

type AssignmentRow = {
  app_id: number;
  status: LifecycleStatus | null;
  app_name?: string | null;
};

type SectionAppsPanelProps = {
  sectionId: number;
  sectionName: string;
  globalStatus: LifecycleStatus;
  /** Apps con el módulo padre asignado */
  moduleApps: LinkedApp[];
  onChanged?: () => void;
  onError?: (message: string) => void;
};

export function SectionAppsPanel({
  sectionId,
  sectionName,
  globalStatus,
  moduleApps,
  onChanged,
  onError,
}: SectionAppsPanelProps) {
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAppId, setBusyAppId] = useState<number | null>(null);
  const modal = useOverlayState();

  const assignedAppIds = useMemo(
    () => new Set(assignments.map((a) => a.app_id)),
    [assignments],
  );

  const overrideCount = assignments.filter((a) => a.status !== null).length;
  const assignedCount = assignments.length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/sections/${sectionId}/app-status`));
      if (!res.ok) throw new Error("No se pudieron cargar apps de la sección");
      const data = (await res.json()) as AssignmentRow[];
      setAssignments(data);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [sectionId, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleAssignment(appId: number, assign: boolean) {
    setBusyAppId(appId);
    onError?.("");
    try {
      const res = await fetch(apiUrl(`/api/sections/${sectionId}/assign-app`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: appId, assigned: assign }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al asignar");
      if (data.push_error) {
        onError?.(`Guardado, pero sync falló: ${data.push_error}`);
      }
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
      const clear = value === "" || value === "__global__";
      const res = await fetch(apiUrl(`/api/sections/${sectionId}/app-status`), {
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
      if (data.push_error) {
        onError?.(`Estado guardado, pero sync falló: ${data.push_error}`);
      }
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

  if (moduleApps.length === 0) {
    return (
      <span className="text-[11px] text-[var(--gp-text-muted)]">
        Asigná el módulo a apps primero
      </span>
    );
  }

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
          <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
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
                <Modal.Heading>Apps · {sectionName}</Modal.Heading>
                <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
                  Solo apps con el módulo asignado. Marcá la sección por app y
                  ajustá el estado si difiere del catálogo.
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
                      Si no asignás la sección, hereda del módulo
                    </span>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-10">
                    <Spinner size="sm" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {moduleApps.map((app) => {
                      const isAssigned = assignedAppIds.has(app.id);
                      const currentStatus = statusByApp.get(app.id);
                      const hasOverride = currentStatus != null;
                      const selectValue = hasOverride
                        ? normalizeLifecycleStatus(currentStatus)
                        : "__global__";
                      const busy = busyAppId === app.id;

                      return (
                        <div
                          key={app.id}
                          className={`rounded-xl border p-3 ${
                            isAssigned
                              ? "border-indigo-200 bg-indigo-50/40"
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
                                className="mt-1 size-4 rounded border-zinc-300"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className={gp.iconBoxSm}>
                                    <Briefcase width={14} height={14} />
                                  </div>
                                  <p className="truncate text-sm font-semibold text-[var(--gp-text)]">
                                    {app.name || `App #${app.id}`}
                                  </p>
                                </div>
                                <p className="mt-0.5 text-xs text-[var(--gp-text-muted)]">
                                  {isAssigned
                                    ? "Sección habilitada en esta app"
                                    : "Sin asignar — no limita por sección"}
                                </p>
                              </div>
                            </label>

                            <div className="flex shrink-0 flex-col items-end gap-1">
                              {busy ? <Spinner size="sm" /> : null}
                              <select
                                className={`h-9 min-w-[140px] rounded-lg border px-2 text-xs ${
                                  !isAssigned
                                    ? "cursor-not-allowed opacity-40"
                                    : hasOverride
                                      ? "border-amber-300 bg-amber-50 font-semibold"
                                      : "border-[var(--gp-border)] bg-white"
                                }`}
                                value={selectValue}
                                disabled={!isAssigned || busy}
                                onChange={(e) =>
                                  void saveStatus(app.id, e.target.value)
                                }
                              >
                                <option value="__global__">
                                  Hereda · {globalLabel}
                                </option>
                                {LIFECYCLE_STATUS_OPTIONS.filter(
                                  (opt) =>
                                    opt !== normalizeLifecycleStatus(globalStatus),
                                ).map((opt) => (
                                  <option key={opt} value={opt}>
                                    {LIFECYCLE_STATUS_LABELS[opt]}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {assignedCount > 0 && (
                  <p className="text-xs text-[var(--gp-text-muted)]">
                    {assignedCount}{" "}
                    {assignedCount === 1 ? "app tiene" : "apps tienen"} esta
                    sección asignada
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
