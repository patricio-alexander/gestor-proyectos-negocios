"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiKey, CreateApiKeyInput } from "../types";
import { apiUrl } from "@/src/utils/apiUrl";

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/api-keys"));
      if (res.ok) setKeys(await res.json());
    } catch {
      console.error("Error fetching api keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  async function create(input: CreateApiKeyInput) {
    const res = await fetch(apiUrl("/api/api-keys"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al crear API key");
    await fetchKeys();
    return data.key as string;
  }

  async function revoke(id: number) {
    const res = await fetch(apiUrl(`/api/api-keys/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: false }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al revocar API key");
    setKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, active: false } : k)),
    );
  }

  const active = keys.filter((k) => k.active).length;

  return {
    keys,
    loading,
    active,
    revoked: keys.length - active,
    create,
    revoke,
    refetch: fetchKeys,
  };
}
