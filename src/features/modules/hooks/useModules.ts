"use client";

import { useCallback, useEffect, useState } from "react";
import type { Module, CreateModuleInput, UpdateModuleInput } from "../types";

export function useModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/modules");
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      }
    } catch {
      console.error("Error fetching modules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  async function create(input: CreateModuleInput) {
    const res = await fetch("/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
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
    const res = await fetch(`/api/modules/${id}`, {
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
    const res = await fetch(`/api/modules/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar módulo");
    }

    setModules((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, deleted_at: new Date().toISOString() } : m
      )
    );
  }

  const activeModules = modules.filter((m) => !m.deleted_at);

  return {
    modules: activeModules,
    loading,
    create,
    update,
    remove,
    refetch: fetchModules,
  };
}
