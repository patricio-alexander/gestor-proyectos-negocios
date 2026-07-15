"use client";

import { useCallback, useEffect, useState } from "react";
import type { App, CreateAppInput, UpdateAppInput } from "../types";
import { apiUrl } from "@/src/utils/apiUrl";

export function useApps() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/apps"));
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
    const res = await fetch(apiUrl("/api/apps"), {
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
    const res = await fetch(apiUrl(`/api/apps/${id}`), {
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
    const res = await fetch(apiUrl(`/api/apps/${id}`), {
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

  async function pushEntitlement(id: number) {
    const res = await fetch(apiUrl(`/api/apps/${id}/push-entitlement`), {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.push_error || "Error al empujar entitlement");
    }
    return data as {
      push_ok?: boolean;
      push_skipped?: boolean;
      push_error?: string | null;
      ok?: boolean;
      skipped?: boolean;
      error?: string;
    };
  }

  /** Asigna o reemplaza el plan activo de una app (POST /api/subscriptions/enable). */
  async function enablePlan(input: {
    app_id: number;
    plan_id: number;
    period?: "MONTHLY" | "ANNUALLY";
    replace?: boolean;
  }) {
    const res = await fetch(apiUrl("/api/subscriptions/enable"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: input.app_id,
        plan_id: input.plan_id,
        period: input.period ?? "MONTHLY",
        replace: input.replace ?? true,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error || "Error al asignar el plan");
    }
    await fetchApps();
    return data as {
      plan_name?: string | null;
      period?: string;
      push_ok?: boolean;
      push_skipped?: boolean;
      push_error?: string | null;
    };
  }

  const activeApps = apps.filter((a) => !a.deleted_at);

  return {
    apps: activeApps,
    loading,
    create,
    update,
    remove,
    pushEntitlement,
    enablePlan,
    refetch: fetchApps,
  };
}
