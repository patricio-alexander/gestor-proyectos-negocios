"use client";

import { useCallback, useEffect, useState } from "react";
import type { User, CreateUserInput, UpdateUserInput } from "../types";

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      console.error("Error fetching users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function create(input: CreateUserInput) {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear usuario");
    }

    const user: User = await res.json();
    setUsers((prev) => [user, ...prev]);
    return user;
  }

  async function update(id: string, input: UpdateUserInput) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar usuario");
    }

    const user: User = await res.json();
    setUsers((prev) => prev.map((u) => (u.id === id ? user : u)));
    return user;
  }

  async function remove(id: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar usuario");
    }

    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, deleted_at: new Date().toISOString() } : u,
      ),
    );
  }

  const activeUsers = users.filter((u) => !u.deleted_at);

  return {
    users: activeUsers,
    loading,
    create,
    update,
    remove,
    refetch: fetchUsers,
  };
}
