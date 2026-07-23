"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import Briefcase from "@gravity-ui/icons/Briefcase";
import type { LifecycleStatus, LinkedApp } from "../types";
import {
  LIFECYCLE_STATUS_LABELS,
  normalizeLifecycleStatus,
} from "../types";
import { apiUrl } from "@/src/utils/apiUrl";
import { effectiveSectionStatusForApp } from "@/src/shared/lib/lifecycle-status-resolve";
import { gp } from "@/src/shared/ui/theme";
import { LIFECYCLE_STATUS_STYLE } from "./LifecycleStatusSelect";
import { LifecycleStatusInheritSelect } from "./LifecycleStatusInheritSelect";
import { formatPushSyncToast, type PushSyncPayload } from "@/src/shared/lib/push-sync-message";

function warnPushSync(data: PushSyncPayload, onError?: (msg: string) => void) {
  const msg = formatPushSyncToast(data, "Estado guardado, pero sync incompleto");
  if (msg) onError?.(msg);
}

type OverrideRow = {
  app_id: number;
  status: LifecycleStatus | null;
  app_name?: string | null;
};

type SectionAppsPanelProps = {
  sectionId: number;
  sectionName: string;
  globalStatus: LifecycleStatus;
  moduleId: number;
  onChanged?: () => void;
  onError?: (message: string) => void;
};

type ModuleAppRow = {
  app_id: number;
  app_name?: string | null;
  app_hash?: string;
  status?: LifecycleStatus | null;
};

export function SectionAppsPanel({
  sectionId,
  sectionName,
  globalStatus,
  moduleId,
  onChanged,
  onError,
}: SectionAppsPanelProps) {
  const [moduleApps, setModuleApps] = useState<LinkedApp[]>([]);
  const [moduleStatusByApp, setModuleStatusByApp] = useState(
    new Map<number, LifecycleStatus | null>(),
  );
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAppId, setBusyAppId] = useState<number | null>(null);
  const modal = useOverlayState();

  const overrideByApp = useMemo(
    () => new Map(overrides.map((o) => [o.app_id, o.status])),
    [overrides],
  );

  const overrideCount = overrides.filter((o) => o.status != null).length;

  const loadModuleApps = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/api/modules/${moduleId}/app-status`));
      if (!res.ok) throw new Error("No se pudieron cargar apps del módulo");
      const data = (await res.json()) as ModuleAppRow[];
      setModuleApps(
        data.map((row) => ({
          id: row.app_id,
          name: row.app_name ?? null,
          hash: row.app_hash ?? "",
        })),
      );
      setModuleStatusByApp(
        new Map(data.map((row) => [row.app_id, row.status ?? null])),
      );
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Error al cargar apps");
      setModuleApps([]);
    }
  }, [moduleId, onError]);

  const loadOverrides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/sections/${sectionId}/app-status`));
      if (!res.ok) throw new Error("No se pudieron cargar apps de la sección");
      const data = (await res.json()) as OverrideRow[];
      setOverrides(data);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Error al cargar");
    }
  }, [sectionId, onError]);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadModuleApps(), loadOverrides()]);
    setLoading(false);
  }, [loadModuleApps, loadOverrides]);

  useEffect(() => {
    void loadModuleApps();
  }, [loadModuleApps]);

  async function saveStatus(appId: number, value: string) {
    setBusyAppId(appId);
    onError?.("");
    try {
      const clear =
        value === "" || value === "__global__" || value === "__inherit__";
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
      warnPushSync(data, onError);
      await load();
      onChanged?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setBusyAppId(null);
    }
  }

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
        {overrideCount > 0 ? (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
            {overrideCount}
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
                  Override solo para esta sección. Gana sobre el módulo por app
                  y el catálogo global.
                </p>
              </Modal.Header>
              <Modal.Body className="space-y-4">
                <div
                  className="rounded-xl border px-4 py-3"
                  style={{ borderColor: "var(--gp-border)" }}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--gp-text-muted)]">
                    Estado default (catálogo)
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${globalStyle.chip}`}
                    >
                      <span className={`size-1.5 rounded-full ${globalStyle.dot}`} />
                      {globalLabel}
                    </span>
                    <span className="text-xs text-[var(--gp-text-muted)]">
                      Aplica salvo override por app
                    </span>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-10">
                    <Spinner size="sm" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr_auto] gap-3 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]">
                      <span>App</span>
                      <span className="min-w-[140px] text-right">Estado en la app</span>
                    </div>
                    {moduleApps.map((app) => {
                      const currentStatus = overrideByApp.get(app.id);
                      const hasOverride = currentStatus != null;
                      const inheritedStatus = effectiveSectionStatusForApp(
                        globalStatus,
                        null,
                        moduleStatusByApp.get(app.id),
                      );
                      const inheritedLabel =
                        LIFECYCLE_STATUS_LABELS[inheritedStatus];
                      const busy = busyAppId === app.id;

                      return (
                        <div
                          key={app.id}
                          className={`rounded-xl border p-3 ${
                            hasOverride
                              ? "border-amber-500/40 bg-amber-500/15 dark:border-amber-400/40"
                              : "border-[var(--gp-border)] bg-[var(--gp-surface-muted)]/30"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className={gp.iconBoxSm}>
                                  <Briefcase width={14} height={14} />
                                </div>
                                <p className="truncate text-sm font-semibold text-[var(--gp-text)]">
                                  {app.name || `App #${app.id}`}
                                </p>
                              </div>
                              <p className="mt-0.5 text-xs text-[var(--gp-text-muted)]">
                                {hasOverride
                                  ? `Override · ${LIFECYCLE_STATUS_LABELS[normalizeLifecycleStatus(currentStatus!)]}`
                                  : `Hereda · ${inheritedLabel}`}
                              </p>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-1">
                              {busy ? <Spinner size="sm" /> : null}
                              <LifecycleStatusInheritSelect
                                value={hasOverride ? currentStatus! : null}
                                inheritLabel={inheritedLabel}
                                busy={busy}
                                aria-label={`Estado de ${sectionName} en ${app.name || "app"}`}
                                onChange={(v) => void saveStatus(app.id, v)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {overrideCount > 0 && (
                  <p className="text-xs text-[var(--gp-text-muted)]">
                    {overrideCount}{" "}
                    {overrideCount === 1 ? "app con" : "apps con"} estado
                    personalizado (sobrescribe el default).
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
