"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Module,
  CreateModuleInput,
  UpdateModuleInput,
  ModuleChannel,
} from "../types";
import { apiUrl } from "@/src/utils/apiUrl";

export function useModules(channel: ModuleChannel = "web") {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        apiUrl(`/api/modules?channel=${encodeURIComponent(channel)}`),
      );
      if (res.ok) {
        const data = await res.json();
        setModules(Array.isArray(data) ? data : []);
      }
    } catch {
      console.error("Error fetching modules");
    } finally {
      setLoading(false);
    }
  }, [channel]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  async function create(input: CreateModuleInput) {
    const res = await fetch(apiUrl("/api/modules"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, channel: input.channel ?? channel }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear módulo");
    }

    const mod: Module = await res.json();
    setModules((prev) => [mod, ...prev]);
    return mod;
  }

  async function update(id: number, input: UpdateModuleInput) {
    const res = await fetch(apiUrl(`/api/modules/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar módulo");
    }

    const mod: Module = await res.json();
    setModules((prev) => prev.map((m) => (m.id === id ? mod : m)));
    return mod;
  }

  async function remove(id: number) {
    const res = await fetch(apiUrl(`/api/modules/${id}`), {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar módulo");
    }

    setModules((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, deleted_at: new Date().toISOString() } : m,
      ),
    );
  }

  const activeModules = useMemo(
    () => modules.filter((m) => !m.deleted_at),
    [modules],
  );

  function patchModule(id: number, updater: (module: Module) => Module) {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? updater(m) : m)),
    );
  }

  return {
    modules: activeModules,
    loading,
    create,
    update,
    remove,
    patchModule,
    refetch: fetchModules,
    channel,
  };
}
