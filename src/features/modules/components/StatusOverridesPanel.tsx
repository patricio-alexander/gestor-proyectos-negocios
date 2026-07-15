"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Spinner } from "@heroui/react";
import type { LinkedApp, LifecycleStatus } from "../types";
import {
  LIFECYCLE_STATUS_LABELS,
  LIFECYCLE_STATUS_OPTIONS,
  normalizeLifecycleStatus,
} from "../types";
import { apiUrl } from "@/src/utils/apiUrl";
import { gp } from "@/src/shared/ui/theme";
import { useApps } from "@/src/features/apps/hooks/useApps";

type OverrideRow = {
  app_id: number;
  status: LifecycleStatus;
  app_name?: string | null;
};

type StatusOverridesPanelProps = {
  kind: "module" | "section";
  entityId: number;
  globalStatus: LifecycleStatus;
  apps: LinkedApp[];
  onError?: (message: string) => void;
  compact?: boolean;
};

export function StatusOverridesPanel({
  kind,
  entityId,
  globalStatus,
  apps,
  onError,
  compact = false,
}: StatusOverridesPanelProps) {
  const { apps: allApps } = useApps();
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAppId, setBusyAppId] = useState<number | null>(null);

  const appList = useMemo(() => {
    const map = new Map<number, LinkedApp>();
    for (const a of apps) map.set(a.id, a);
    for (const a of allApps) {
      if (a.kind === "template") continue;
      if (!map.has(a.id)) {
        map.set(a.id, { id: a.id, name: a.name, hash: a.hash });
      }
    }
    return [...map.values()].filter((a) => {
      const full = allApps.find((x) => x.id === a.id);
      return !full || full.kind !== "template";
    });
  }, [apps, allApps]);

  const endpoint =
    kind === "module"
      ? `/api/modules/${entityId}/status-override`
      : `/api/sections/${entityId}/status-override`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(endpoint));
      if (!res.ok) throw new Error("No se pudieron cargar overrides");
      const data = (await res.json()) as OverrideRow[];
      setOverrides(data);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [endpoint, onError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(appId: number, value: string) {
    setBusyAppId(appId);
    onError?.("");
    try {
      const clear = value === "" || value === "__global__";
      const res = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          clear
            ? { app_id: appId, clear: true }
            : { app_id: appId, status: value },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      if (data.push_error) {
        onError?.(
          `Override guardado, pero sync falló: ${data.push_error}`,
        );
      }
      await load();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setBusyAppId(null);
    }
  }

  if (appList.length === 0) {
    return (
      <p className="text-[11px] text-[var(--gp-text-muted)]">
        Sin apps. Registrá aplicaciones para poder poner overrides.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-2">
        <Spinner size="sm" />
      </div>
    );
  }

  const byApp = new Map(overrides.map((o) => [o.app_id, o.status]));

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--gp-text-muted)]">
        Por app
        <span className="ml-1 font-normal normal-case">
          (override; gana sobre global «
          {LIFECYCLE_STATUS_LABELS[normalizeLifecycleStatus(globalStatus)]}»)
        </span>
      </p>
      <ul className="space-y-1.5">
        {appList.map((app) => {
          const current = byApp.get(app.id);
          const selectValue = current
            ? normalizeLifecycleStatus(current)
            : "__global__";
          return (
            <li
              key={app.id}
              className="flex items-center gap-2 rounded-lg border px-2 py-1.5"
              style={{ borderColor: "var(--gp-border)" }}
            >
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-[var(--gp-text)]">
                {app.name || `App #${app.id}`}
              </span>
              <select
                className={`${gp.input} !mt-0 h-8 max-w-[9.5rem] py-0 text-xs`}
                value={selectValue}
                disabled={busyAppId === app.id}
                title={`Estado efectivo en ${app.name || "app"}`}
                onChange={(e) => void save(app.id, e.target.value)}
              >
                <option value="__global__">Usar global</option>
                {LIFECYCLE_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {LIFECYCLE_STATUS_LABELS[opt]}
                  </option>
                ))}
              </select>
              {busyAppId === app.id ? <Spinner size="sm" /> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
