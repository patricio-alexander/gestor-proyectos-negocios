"use client";

import { useCallback, useEffect, useState } from "react";
import type { App, CreateAppInput, UpdateAppInput } from "../types";

export function useApps() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/apps");
      if (res.ok) {
        const data = await res.json();
        setApps(data);
      }
    } catch {
      console.error("Error fetching apps");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  async function create(input: CreateAppInput) {
    const res = await fetch("/api/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear aplicación");
    }

    const app: App = await res.json();
    setApps((prev) => [app, ...prev]);
    return app;
  }

  async function update(id: number, input: UpdateAppInput) {
    const res = await fetch(`/api/apps/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar aplicación");
    }

    const app: App = await res.json();
    setApps((prev) => prev.map((a) => (a.id === id ? app : a)));
    return app;
  }

  async function remove(id: number) {
    const res = await fetch(`/api/apps/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar aplicación");
    }

    setApps((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, deleted_at: new Date().toISOString() } : a,
      ),
    );
  }

  const activeApps = apps.filter((a) => !a.deleted_at);

  return {
    apps: activeApps,
    loading,
    create,
    update,
    remove,
    refetch: fetchApps,
  };
}
