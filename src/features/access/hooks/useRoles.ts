"use client";

import { useCallback, useEffect, useState } from "react";
import type { CreateRoleInput, RoleRecord, UpdateRoleInput } from "@/src/features/access/types";

export function useRoles() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/roles");
      if (res.ok) setRoles(await res.json());
    } catch {
      console.error("Error fetching roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  async function create(input: CreateRoleInput) {
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear rol");
    }
    const role: RoleRecord = await res.json();
    setRoles((prev) => [...prev, role].sort((a, b) => a.name.localeCompare(b.name)));
    return role;
  }

  async function update(id: number, input: UpdateRoleInput) {
    const res = await fetch(`/api/roles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar rol");
    }
    const role: RoleRecord = await res.json();
    setRoles((prev) => prev.map((r) => (r.id === id ? role : r)));
    return role;
  }

  async function remove(id: number) {
    const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar rol");
    }
    setRoles((prev) => prev.filter((r) => r.id !== id));
  }

  return { roles, loading, create, update, remove, refetch: fetchRoles };
}
