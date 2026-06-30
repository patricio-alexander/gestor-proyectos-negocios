"use client";

import { useCallback, useEffect, useState } from "react";
import type { License } from "../types";

export function useAllLicenses() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/licenses");
      if (res.ok) setLicenses(await res.json());
    } catch {
      console.error("Error fetching licenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  async function revoke(id: number) {
    const res = await fetch(`/api/licenses/${id}`, { method: "PATCH" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al revocar licencia");
    }
    setLicenses((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "REVOKED" } : l)),
    );
  }

  return { licenses, loading, revoke, refetch: fetchLicenses };
}
