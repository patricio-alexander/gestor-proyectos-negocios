"use client";

import { useCallback, useEffect, useState } from "react";
import type { EventTypeRecord } from "@/src/features/events/types";
import { apiUrl } from "@/src/utils/apiUrl";

export function useEventTypes() {
  const [types, setTypes] = useState<EventTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/event-types"));
      if (res.ok) setTypes(await res.json());
    } catch {
      console.error("Error fetching event types");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  async function create(input: { key: string; name: string; description?: string }) {
    const res = await fetch(apiUrl("/api/event-types"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear tipo de evento");
    }
    const type: EventTypeRecord = await res.json();
    setTypes((prev) => [...prev, type]);
    return type;
  }

  async function remove(id: number) {
    const res = await fetch(apiUrl(`/api/event-types/${id}`), { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar tipo de evento");
    }
    setTypes((prev) => prev.filter((t) => t.id !== id));
  }

  return { types, loading, create, remove, refetch: fetchTypes };
}
