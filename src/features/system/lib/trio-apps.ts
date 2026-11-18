export type TrioId = "eddeli" | "store" | "tienda";

export const TRIO_IDS: TrioId[] = ["eddeli", "store", "tienda"];

/** Empareja una app del gestor con eddeli/store/tienda. */
export function matchTrioId(app: {
  name?: string | null;
  path?: string | null;
  entitlement_url?: string | null;
}): TrioId | null {
  const blob =
    `${app.name || ""} ${app.path || ""} ${app.entitlement_url || ""}`.toLowerCase();
  if (/\beddeli\b/.test(blob) || blob.includes("eddeliapi")) return "eddeli";
  if (/\btienda\b/.test(blob) || blob.includes("tiendaapi")) return "tienda";
  if (/\bstore\b/.test(blob) || blob.includes("storeapi")) return "store";
  return null;
}

export function trioLabel(id: TrioId): string {
  if (id === "eddeli") return "EdDeli";
  if (id === "tienda") return "Tienda";
  return "Store";
}
