"use client";

import { useCallback, useEffect, useState } from "react";
import type { Business, CreateBusinessInput, UpdateBusinessInput } from "../types";

export function useBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/businesses");
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data);
      }
    } catch {
      console.error("Error fetching businesses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  async function create(input: CreateBusinessInput) {
    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear negocio");
    }

    const business: Business = await res.json();
    setBusinesses((prev) => [business, ...prev]);
    return business;
  }

  async function update(id: number, input: UpdateBusinessInput) {
    const res = await fetch(`/api/businesses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar negocio");
    }

    const business: Business = await res.json();
    setBusinesses((prev) => prev.map((b) => (b.id === id ? business : b)));
    return business;
  }

  async function remove(id: number) {
    const res = await fetch(`/api/businesses/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar negocio");
    }

    setBusinesses((prev) => prev.map((b) => b.id === id ? { ...b, deleted_at: new Date().toISOString() } : b));
  }

  const activeBusinesses = businesses.filter((b) => !b.deleted_at);

  return { businesses: activeBusinesses, loading, create, update, remove, refetch: fetchBusinesses };
}
