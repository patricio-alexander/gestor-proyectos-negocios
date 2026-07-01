"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ModuleRecord,
  CreateModuleInput,
  UpdateModuleInput,
} from "../types";
import { apiUrl } from "@/src/utils/apiUrl";

export function useCatalog() {
  const [modules, setModules] = useState<ModuleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/catalog/modules"));
      if (res.ok) setModules(await res.json());
    } catch {
      console.error("Error fetching catalog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  async function createModule(input: CreateModuleInput) {
    const res = await fetch(apiUrl("/api/catalog/modules"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear módulo");
    }
    const mod: ModuleRecord = await res.json();
    setModules((prev) => [...prev, mod]);
    return mod;
  }

  async function updateModule(id: number, input: UpdateModuleInput) {
    const res = await fetch(apiUrl(`/api/catalog/modules/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar módulo");
    }
    const mod: ModuleRecord = await res.json();
    setModules((prev) => prev.map((m) => (m.id === id ? mod : m)));
    return mod;
  }

  async function removeModule(id: number) {
    const res = await fetch(apiUrl(`/api/catalog/modules/${id}`), { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar módulo");
    }
    setModules((prev) => prev.filter((m) => m.id !== id));
  }

  return {
    modules,
    loading,
    refetch: fetchModules,
    createModule,
    updateModule,
    removeModule,
  };
}
