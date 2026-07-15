import crypto from "crypto";
import { prisma } from "./prisma";
import type { AppKind } from "../../../prisma/generated/prisma/enums";

/** Hash estable de la app plantilla Raptor (catálogo maestro). */
export const RAPTOR_TEMPLATE_HASH = crypto
  .createHash("sha256")
  .update("raptor-template-app")
  .digest("hex")
  .slice(0, 32);

export async function getTemplateApp() {
  return prisma.apps.findFirst({
    where: { kind: "template", deleted_at: null },
    orderBy: { id: "asc" },
  });
}

export async function requireTemplateAppId(appId: number) {
  const app = await prisma.apps.findFirst({
    where: { id: appId, deleted_at: null },
    select: { id: true, kind: true, name: true },
  });
  if (!app) {
    return { ok: false as const, status: 404, error: "Aplicación no encontrada" };
  }
  if (app.kind !== "template") {
    return {
      ok: false as const,
      status: 400,
      error: `El catálogo solo puede vivir en la plantilla Raptor (${app.name ?? "app"} es un despliegue)`,
    };
  }
  return { ok: true as const, app };
}

export async function requireDeploymentAppId(appId: number) {
  const app = await prisma.apps.findFirst({
    where: { id: appId, deleted_at: null },
    select: { id: true, hash: true, name: true, kind: true },
  });
  if (!app) {
    return { ok: false as const, status: 404, error: "Aplicación no encontrada" };
  }
  if (app.kind === "template") {
    return {
      ok: false as const,
      status: 400,
      error:
        "No podés asignar suscripciones a la plantilla Raptor; elegí una app desplegada (EdDeli, Store…)",
    };
  }
  return { ok: true as const, app };
}

export function isTemplateKind(kind: AppKind | null | undefined): boolean {
  return kind === "template";
}
