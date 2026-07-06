"use client";

import { useCallback, useEffect, useState } from "react";
import type { Offer, CreateOfferInput, UpdateOfferInput } from "../types";
import { apiUrl } from "@/src/utils/apiUrl";

export function useOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/offers"));
      if (res.ok) {
        const data = await res.json();
        setOffers(data);
      }
    } catch {
      console.error("Error fetching offers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  async function create(input: CreateOfferInput) {
    const res = await fetch(apiUrl("/api/offers"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear oferta");
    }

    const offer: Offer = await res.json();
    setOffers((prev) => [offer, ...prev]);
    return offer;
  }

  async function update(id: number, input: UpdateOfferInput) {
    const res = await fetch(apiUrl(`/api/offers/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar oferta");
    }

    const offer: Offer = await res.json();
    setOffers((prev) => prev.map((o) => (o.id === id ? offer : o)));
    return offer;
  }

  async function remove(id: number) {
    const res = await fetch(apiUrl(`/api/offers/${id}`), {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar oferta");
    }

    setOffers((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, deleted_at: new Date().toISOString() } : o,
      ),
    );
  }

  const activeOffers = offers.filter((o) => !o.deleted_at);

  return {
    offers: activeOffers,
    loading,
    create,
    update,
    remove,
    refetch: fetchOffers,
  };
}
