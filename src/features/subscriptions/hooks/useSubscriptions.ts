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

  return { subscriptions, loading, cancel, refetch: fetchSubscriptions };
}
