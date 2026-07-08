"use client";

import type {
  Capability,
  CreateCapabilityInput,
  UpdateCapabilityInput,
} from "../types";
import { apiUrl } from "@/src/utils/apiUrl";

export function useCapabilities() {
  async function create(input: CreateCapabilityInput) {
    const res = await fetch(apiUrl("/api/capabilities"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al crear capability");
    }

    return (await res.json()) as Capability;
  }

  async function update(id: number, input: UpdateCapabilityInput) {
    const res = await fetch(apiUrl(`/api/capabilities/${id}`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar capability");
    }

    return (await res.json()) as Capability;
  }

  async function remove(id: number) {
    const res = await fetch(apiUrl(`/api/capabilities/${id}`), {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar capability");
    }
  }

  return { create, update, remove };
}
