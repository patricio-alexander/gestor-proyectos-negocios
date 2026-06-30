"use client";

import { useState } from "react";
import type { Section } from "../types";

export function useSections() {
  const [sections, setSections] = useState<Section[]>([]);

  async function create(name: string, module_id: number) {
    const res = await fetch("/api/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, module_id }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear sección");
    }

    const section: Section = await res.json();
    setSections((prev) => [...prev, section]);
    return section;
  }

  async function update(id: number, name: string) {
    const res = await fetch(`/api/sections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar sección");
    }

    const section: Section = await res.json();
    setSections((prev) => prev.map((s) => (s.id === id ? section : s)));
    return section;
  }

  async function remove(id: number) {
    const res = await fetch(`/api/sections/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar sección");
    }

    setSections((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, deleted_at: new Date().toISOString() } : s
      )
    );
  }

  function set(initial: Section[]) {
    setSections(initial.filter((s) => !s.deleted_at));
  }

  const activeSections = sections.filter((s) => !s.deleted_at);

  return {
    sections: activeSections,
    create,
    update,
    remove,
    set,
  };
}
