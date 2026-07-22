"use client";

import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "@/src/utils/apiUrl";
import type {
  CreateMobileAppInput,
  MobileApp,
  MobileAppRelease,
  UpdateMobileAppInput,
} from "../types";
import { appToast } from "@/src/shared/utils/app-toast";

export function useMobileApps() {
  const [apps, setApps] = useState<MobileApp[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/mobile-apps"));
      if (!res.ok) throw new Error("No se pudieron cargar las apps móviles");
      const data = (await res.json()) as MobileApp[];
      setApps(data);
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function create(input: CreateMobileAppInput) {
    const res = await fetch(apiUrl("/api/mobile-apps"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al crear");
    setApps((prev) => [data as MobileApp, ...prev]);
    return data as MobileApp;
  }

  async function update(id: number, input: UpdateMobileAppInput) {
    const res = await fetch(apiUrl(`/api/mobile-apps/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al actualizar");
    setApps((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              ...data,
            }
          : a,
      ),
    );
    return data as MobileApp;
  }

  async function remove(id: number) {
    const res = await fetch(apiUrl(`/api/mobile-apps/${id}`), {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Error al eliminar");
    setApps((prev) => prev.filter((a) => a.id !== id));
  }

  return { apps, loading, refresh, create, update, remove };
}

export function useMobileReleases(appId: number | null) {
  const [releases, setReleases] = useState<MobileAppRelease[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!appId) {
      setReleases([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/mobile-apps/${appId}/releases`));
      if (!res.ok) throw new Error("No se pudieron cargar los releases");
      setReleases((await res.json()) as MobileAppRelease[]);
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function uploadRelease(input: {
    file: File;
    platform: "ios" | "android";
    version: string;
    mandatory: boolean;
    activate: boolean;
    release_notes?: string;
  }) {
    if (!appId) throw new Error("Sin app seleccionada");
    const form = new FormData();
    form.append("file", input.file);
    form.append("platform", input.platform);
    form.append("version", input.version);
    form.append("mandatory", String(input.mandatory));
    form.append("activate", String(input.activate));
    if (input.release_notes) form.append("release_notes", input.release_notes);

    const res = await fetch(
      apiUrl(`/api/mobile-apps/${appId}/releases/upload`),
      { method: "POST", body: form },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al subir");
    await refresh();
    return data as MobileAppRelease;
  }

  async function activate(releaseId: number) {
    if (!appId) throw new Error("Sin app seleccionada");
    const res = await fetch(
      apiUrl(`/api/mobile-apps/${appId}/releases/${releaseId}`),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activate: true }),
      },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al activar");
    await refresh();
    return data as MobileAppRelease;
  }

  async function setMandatory(releaseId: number, mandatory: boolean) {
    if (!appId) throw new Error("Sin app seleccionada");
    const res = await fetch(
      apiUrl(`/api/mobile-apps/${appId}/releases/${releaseId}`),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mandatory }),
      },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al actualizar");
    await refresh();
    return data as MobileAppRelease;
  }

  async function remove(releaseId: number) {
    if (!appId) throw new Error("Sin app seleccionada");
    const res = await fetch(
      apiUrl(`/api/mobile-apps/${appId}/releases/${releaseId}`),
      { method: "DELETE" },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Error al eliminar");
    await refresh();
  }

  return {
    releases,
    loading,
    refresh,
    uploadRelease,
    activate,
    setMandatory,
    remove,
  };
}
