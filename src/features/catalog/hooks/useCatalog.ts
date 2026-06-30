"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AppModuleRecord,
  CreateAppModuleInput,
  CreateAppSectionInput,
  UpdateAppModuleInput,
  UpdateAppSectionInput,
} from "../types";

export function useCatalog() {
  const [modules, setModules] = useState<AppModuleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/catalog/modules");
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

  async function createModule(input: CreateAppModuleInput) {
    const res = await fetch("/api/catalog/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear módulo");
    }
    const mod: AppModuleRecord = await res.json();
    setModules((prev) => [...prev, mod].sort((a, b) => a.sort_order - b.sort_order));
    return mod;
  }

  async function updateModule(id: number, input: UpdateAppModuleInput) {
    const res = await fetch(`/api/catalog/modules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar módulo");
    }
    const mod: AppModuleRecord = await res.json();
    setModules((prev) => prev.map((m) => (m.id === id ? mod : m)));
    return mod;
  }

  async function removeModule(id: number) {
    const res = await fetch(`/api/catalog/modules/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar módulo");
    }
    setModules((prev) => prev.filter((m) => m.id !== id));
  }

  async function createSection(input: CreateAppSectionInput) {
    const res = await fetch("/api/catalog/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear sección");
    }
    const section = await res.json();
    setModules((prev) =>
      prev.map((m) =>
        m.id === input.app_module_id
          ? { ...m, sections: [...m.sections, section].sort((a, b) => a.sort_order - b.sort_order) }
          : m,
      ),
    );
    return section;
  }

  async function updateSection(id: number, moduleId: number, input: UpdateAppSectionInput) {
    const res = await fetch(`/api/catalog/sections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar sección");
    }
    const section = await res.json();
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, sections: m.sections.map((s) => (s.id === id ? section : s)) }
          : m,
      ),
    );
    return section;
  }

  async function removeSection(id: number, moduleId: number) {
    const res = await fetch(`/api/catalog/sections/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar sección");
    }
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId ? { ...m, sections: m.sections.filter((s) => s.id !== id) } : m,
      ),
    );
  }

  return {
    modules,
    loading,
    refetch: fetchModules,
    createModule,
    updateModule,
    removeModule,
    createSection,
    updateSection,
    removeSection,
  };
}
