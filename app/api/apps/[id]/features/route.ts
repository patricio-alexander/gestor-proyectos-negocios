import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { pushEntitlementForAppId } from "@/src/shared/lib/push-entitlement-helpers";
import { ensureFeatureCatalog } from "@/src/shared/lib/feature-catalog";
import {
  effectiveLifecycleStatus,
  normalizeLifecycleStatus,
} from "@/src/shared/lib/lifecycle-status-resolve";
import type { LifecycleStatus } from "@/src/features/modules/types";
import { LIFECYCLE_STATUS_OPTIONS } from "@/src/features/modules/types";

const ALLOWED = new Set<string>(LIFECYCLE_STATUS_OPTIONS);

function parseStatus(value: unknown): LifecycleStatus | null {
  if (value === null || value === undefined || value === "" || value === "inherit") {
    return null;
  }
  const raw = String(value);
  if (!ALLOWED.has(raw) && raw !== "development") return null;
  return normalizeLifecycleStatus(raw);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const { id } = await params;
  const appId = Number(id);
  if (isNaN(appId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const app = await prisma.apps.findUnique({ where: { id: appId } });
    if (!app || app.deleted_at) {
      return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
    }

    await ensureFeatureCatalog();

    const catalog = await prisma.feature.findMany({
      where: { deleted_at: null },
      orderBy: [{ sort_order: "asc" }, { id: "asc" }],
    });

    const overrides = await prisma.appFeature.findMany({
      where: { app_id: appId },
      select: { feature_id: true, status: true },
    });
    const overrideById = new Map(
      overrides.map((o) => [o.feature_id, o.status]),
    );

    return NextResponse.json({
      features: catalog.map((f) => {
        const override = overrideById.has(f.id)
          ? overrideById.get(f.id) ?? null
          : null;
        return {
          id: f.id,
          key: f.key,
          name: f.name,
          description: f.description,
          global_status: normalizeLifecycleStatus(f.status),
          status: override,
          effective_status: effectiveLifecycleStatus(f.status, override),
        };
      }),
    });
  } catch (err) {
    console.error("Error listing app features:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al listar funciones" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const { id } = await params;
  const appId = Number(id);
  if (isNaN(appId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const app = await prisma.apps.findUnique({ where: { id: appId } });
    if (!app || app.deleted_at) {
      return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const items = body?.features as
      | Array<{ feature_id: number; status: LifecycleStatus | null }>
      | undefined;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "features debe ser un array" },
        { status: 400 },
      );
    }

    await ensureFeatureCatalog();

    for (const item of items) {
      const featureId = Number(item.feature_id);
      if (!Number.isFinite(featureId)) continue;
      const status = parseStatus(item.status);

      const feature = await prisma.feature.findFirst({
        where: { id: featureId, deleted_at: null },
        select: { id: true },
      });
      if (!feature) continue;

      if (status == null) {
        await prisma.appFeature.deleteMany({
          where: { app_id: appId, feature_id: featureId },
        });
      } else {
        await prisma.appFeature.upsert({
          where: {
            app_id_feature_id: { app_id: appId, feature_id: featureId },
          },
          create: { app_id: appId, feature_id: featureId, status },
          update: { status },
        });
      }
    }

    const pushResult = await pushEntitlementForAppId(appId);

    return NextResponse.json({
      ok: true,
      features_count: items.length,
      ...pushResult,
    });
  } catch (err) {
    console.error("Error updating app features:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Error al actualizar funciones",
      },
      { status: 500 },
    );
  }
}
