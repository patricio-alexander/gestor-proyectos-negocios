"use client";

import { useCallback, useState } from "react";
import type { License, CreateLicenseInput } from "../types";

export function useLicenses() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchByPlan = useCallback(async (planId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/plans/${planId}/licenses`);
      if (res.ok) {
        setLicenses(await res.json());
      }
    } catch {
      console.error("Error fetching licenses");
    } finally {
      setLoading(false);
    }
  }, []);

  async function revoke(id: number) {
    const res = await fetch(`/api/licenses/${id}`, {
      method: "PATCH",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al revocar licencia");
    }

    setLicenses((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, status: "REVOKED" } : l
      )
    );
  }

  async function create(input: CreateLicenseInput) {
    const res = await fetch("/api/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear licencia");
    }

    return (await res.json()) as License;
  }

  return { licenses, loading, fetchByPlan, create, revoke };
}
