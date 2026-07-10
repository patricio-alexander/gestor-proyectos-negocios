"use client";

import { useCallback, useEffect, useState } from "react";
import type { CreateEventInput, EventRecord } from "@/src/features/events/types";
import { apiUrl } from "@/src/utils/apiUrl";

type AppStats = {
  app_id: number;
  app_name: string;
  types: Array<{ type_name: string; count: number }>;
};

export function useEvents(range: string = "TODO") {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [apps, setApps] = useState<AppStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const query = `?range=${range}`;
      const [eventsRes, statsRes] = await Promise.all([
        fetch(apiUrl(`/api/events${query}`)),
        fetch(apiUrl(`/api/events/stats${query}`)),
      ]);
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (statsRes.ok) {
        const data = await statsRes.json();
        setApps(data.apps ?? []);
      }
    } catch {
      console.error("Error fetching events");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  async function create(input: CreateEventInput) {
    const res = await fetch(apiUrl("/api/events"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear evento");
    }
    const event: EventRecord = await res.json();
    setEvents((prev) => [event, ...prev]);
    return event;
  }

  return { events, apps, loading, create, refetch: fetchEvents };
}
