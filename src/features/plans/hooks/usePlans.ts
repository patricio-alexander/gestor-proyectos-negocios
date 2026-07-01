"use client";

import { useCallback, useEffect, useState } from "react";
import type { Plan, CreatePlanInput, UpdatePlanInput } from "../types";
import { apiUrl } from "@/src/utils/apiUrl";

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/plans"));
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch {
      console.error("Error fetching plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  async function create(input: CreatePlanInput) {
    const res = await fetch(apiUrl("/api/plans"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear plan");
    }

    const plan: Plan = await res.json();
    setPlans((prev) => [plan, ...prev]);
    return plan;
  }

  async function update(id: number, input: UpdatePlanInput) {
    const res = await fetch(apiUrl(`/api/plans/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar plan");
    }

    const plan: Plan = await res.json();
    setPlans((prev) => prev.map((p) => (p.id === id ? plan : p)));
    return plan;
  }

  async function remove(id: number) {
    const res = await fetch(apiUrl(`/api/plans/${id}`), {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar plan");
    }

    setPlans((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, deleted_at: new Date().toISOString() } : p
      )
    );
  }

  const activePlans = plans.filter((p) => !p.deleted_at);

  return {
    plans: activePlans,
    loading,
    create,
    update,
    remove,
    refetch: fetchPlans,
  };
}
