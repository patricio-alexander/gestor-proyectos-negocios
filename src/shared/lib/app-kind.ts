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

export async function requireAppId(appId: number) {
  const app = await prisma.apps.findFirst({
    where: { id: appId, deleted_at: null },
    select: { id: true, kind: true, name: true, hash: true },
  });
  if (!app) {
    return { ok: false as const, status: 404, error: "Aplicación no encontrada" };
  }
  return { ok: true as const, app };
}

/** @deprecated Usar requireAppId — el catálogo ya no está atado a la plantilla. */
export async function requireTemplateAppId(appId: number) {
  return requireAppId(appId);
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
        "No podés asignar suscripciones a una app plantilla; elegí una app desplegada.",
    };
  }
  if (app.kind === "mobile") {
    return {
      ok: false as const,
      status: 400,
      error:
        "Las apps móviles no usan suscripciones web; gestioná módulos desde Módulos.",
    };
  }
  return { ok: true as const, app };
}

export function isTemplateKind(kind: AppKind | null | undefined): boolean {
  return kind === "template";
}
