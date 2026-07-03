"use client";

import { useCallback, useEffect, useState } from "react";
import type { Subscription } from "../types";
import { apiUrl } from "@/src/utils/apiUrl";

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/subscriptions"));
      if (res.ok) {
        setSubscriptions(await res.json());
      }
    } catch {
      console.error("Error fetching subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  async function cancel(id: number) {
    const res = await fetch(apiUrl(`/api/subscriptions/${id}/cancel`), {
      method: "PATCH",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al cancelar suscripción");
    }

    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "CANCELED" } : s))
    );
  }

  async function update(id: number, data: { start_at?: string | null; expires_at?: string | null }) {
    const res = await fetch(apiUrl(`/api/subscriptions/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al actualizar suscripción");
    }

    const result = await res.json();
    setSubscriptions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, start_at: result.start_at, expires_at: result.expires_at }
          : s
      )
    );
  }

  return { subscriptions, loading, cancel, update, refetch: fetchSubscriptions };
}
