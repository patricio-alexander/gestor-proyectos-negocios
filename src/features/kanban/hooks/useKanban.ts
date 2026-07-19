"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { LifecycleStatus } from "@/src/features/modules/types";
import { fetchJson } from "@/src/shared/lib/api-client";
import { queryKeys } from "@/src/shared/lib/query-keys";
import type { KanbanBoardActions, KanbanBoardData } from "../types";
import {
  applyAssignModule,
  applyAssignSection,
  applyModuleAppStatus,
  applyModuleGlobalStatus,
  applySectionAppStatus,
  applySectionGlobalStatus,
} from "../lib/kanban-optimistic";
import { apiUrl } from "@/src/utils/apiUrl";
import { appToast } from "@/src/shared/utils/app-toast";
import { formatPushSyncToast } from "@/src/shared/lib/push-sync-message";
import type { PushSyncPayload } from "@/src/shared/lib/push-sync-message";

function warnPushSync(body: PushSyncPayload) {
  const msg = formatPushSyncToast(body);
  if (msg) appToast.warning(msg);
}

function findModuleIdForSection(
  data: KanbanBoardData,
  sectionId: number,
): number | null {
  for (const module of data.catalog_modules) {
    if (module.sections.some((section) => section.id === sectionId)) {
      return module.id;
    }
  }
  return null;
}

async function fetchKanbanBoard(): Promise<KanbanBoardData> {
  return fetchJson<KanbanBoardData>("/api/kanban");
}

export function useKanban() {
  const queryClient = useQueryClient();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const boardQuery = useQuery({
    queryKey: queryKeys.kanban.board,
    queryFn: fetchKanbanBoard,
  });

  useEffect(() => {
    if (boardQuery.error) {
      appToast.error(
        boardQuery.error instanceof Error
          ? boardQuery.error.message
          : "Error al cargar kanban",
      );
    }
  }, [boardQuery.error]);

  const data = boardQuery.data ?? null;
  const dataRef = useRef(data);
  dataRef.current = data;

  const reconcile = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.kanban.board });
  };

  async function mutate({
    key,
    apply,
    request,
    successMessage,
  }: {
    key: string;
    apply: (current: KanbanBoardData) => KanbanBoardData;
    request: () => Promise<void>;
    successMessage?: string;
  }) {
    const snapshot = queryClient.getQueryData<KanbanBoardData>(
      queryKeys.kanban.board,
    );
    if (!snapshot) return;

    setBusyKey(key);
    queryClient.setQueryData(queryKeys.kanban.board, apply(snapshot));

    try {
      await request();
      if (successMessage) appToast.success(successMessage);
      reconcile();
    } catch (err) {
      queryClient.setQueryData(queryKeys.kanban.board, snapshot);
      appToast.error(err instanceof Error ? err.message : "Error en la operación");
      throw err;
    } finally {
      setBusyKey(null);
    }
  }

  async function assignModule(
    appId: number,
    moduleId: number,
    assigned: boolean,
  ) {
    await mutate({
      key: `assign-mod-${moduleId}-${appId}`,
      apply: (current) => applyAssignModule(current, appId, moduleId, assigned),
      request: async () => {
        const res = await fetch(apiUrl(`/api/modules/${moduleId}/assign-app`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app_id: appId, assigned }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Error al asignar módulo");
        warnPushSync(body);
      },
      successMessage: assigned
        ? "Módulo asignado a la aplicación"
        : "Módulo desasignado de la aplicación",
    });
  }

  async function assignSection(
    appId: number,
    sectionId: number,
    assigned: boolean,
    moduleId: number,
  ) {
    await mutate({
      key: `assign-sec-${sectionId}-${appId}`,
      apply: (current) =>
        applyAssignSection(current, appId, moduleId, sectionId, assigned),
      request: async () => {
        const res = await fetch(apiUrl(`/api/sections/${sectionId}/assign-app`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app_id: appId, assigned }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Error al asignar sección");
        warnPushSync(body);
      },
      successMessage: assigned
        ? "Sección activada en la aplicación"
        : "Sección desactivada en la aplicación",
    });
  }

  async function updateModuleGlobalStatus(
    moduleId: number,
    status: LifecycleStatus,
  ) {
    await mutate({
      key: `global-mod-${moduleId}`,
      apply: (current) => applyModuleGlobalStatus(current, moduleId, status),
      request: async () => {
        const res = await fetch(apiUrl(`/api/modules/${moduleId}`), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Error al actualizar módulo");
        warnPushSync(body);
      },
      successMessage: "Estado global del módulo actualizado",
    });
  }

  async function updateSectionGlobalStatus(
    sectionId: number,
    status: LifecycleStatus,
  ) {
    await mutate({
      key: `global-sec-${sectionId}`,
      apply: (current) => applySectionGlobalStatus(current, sectionId, status),
      request: async () => {
        const res = await fetch(apiUrl(`/api/sections/${sectionId}`), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Error al actualizar sección");
        warnPushSync(body);
      },
      successMessage: "Estado global de la sección actualizado",
    });
  }

  async function updateModuleAppStatus(
    appId: number,
    moduleId: number,
    value: string,
  ) {
    const clear = value === "__inherit__";
    await mutate({
      key: `app-mod-${moduleId}-${appId}`,
      apply: (current) => applyModuleAppStatus(current, appId, moduleId, value),
      request: async () => {
        const res = await fetch(apiUrl(`/api/modules/${moduleId}/app-status`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            clear ? { app_id: appId, clear: true } : { app_id: appId, status: value },
          ),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Error al guardar estado");
        warnPushSync(body);
      },
      successMessage: clear
        ? "Módulo hereda estado global en esta app"
        : "Estado del módulo actualizado en la app",
    });
  }

  async function updateSectionAppStatus(
    appId: number,
    sectionId: number,
    value: string,
  ) {
    const snapshot = dataRef.current;
    const moduleId = snapshot
      ? findModuleIdForSection(snapshot, sectionId)
      : null;
    if (moduleId == null) {
      appToast.error("No se encontró el módulo de la sección");
      return;
    }

    const clear = value === "__inherit__";
    await mutate({
      key: `app-sec-${sectionId}-${appId}`,
      apply: (current) =>
        applySectionAppStatus(current, appId, moduleId, sectionId, value),
      request: async () => {
        const res = await fetch(apiUrl(`/api/sections/${sectionId}/app-status`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            clear ? { app_id: appId, clear: true } : { app_id: appId, status: value },
          ),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Error al guardar estado");
        warnPushSync(body);
      },
      successMessage: clear
        ? "Sección hereda estado del módulo en esta app"
        : "Estado de la sección actualizado en la app",
    });
  }

  const actions: KanbanBoardActions = {
    busyKey,
    onModuleGlobalStatus: updateModuleGlobalStatus,
    onSectionGlobalStatus: updateSectionGlobalStatus,
    onModuleAppStatus: updateModuleAppStatus,
    onSectionAppStatus: updateSectionAppStatus,
    onUnassignModule: (appId, moduleId) => assignModule(appId, moduleId, false),
  };

  return {
    data,
    loading: boardQuery.isLoading,
    isFetching: boardQuery.isFetching,
    busyKey,
    refetch: boardQuery.refetch,
    assignModule,
    assignSection,
    actions,
  };
}
