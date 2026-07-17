import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import {
  enrichModuleWithApps,
  getAppsUsingModules,
} from "@/src/features/modules/lib/module-query";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;
  try {
    const { id } = await params;
    const mod = await prisma.module.findFirst({
      where: { id: Number(id), deleted_at: null },
      include: {
        sections: {
          where: { deleted_at: null },
          orderBy: { created_at: "asc" },
          include: {
            capabilities: { orderBy: { created_at: "asc" } },
          },
        },
      },
    });

    if (!mod) {
      return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
    }

    const usage = await getAppsUsingModules([mod.id]);
    return NextResponse.json(
      enrichModuleWithApps(mod, usage.get(mod.id) ?? []),
    );
  } catch {
    return NextResponse.json({ error: "Error al obtener el módulo" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const updates: Record<string, unknown> = await request.json();

    const existing = await prisma.module.findFirst({
      where: { id: Number(id), deleted_at: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
    }

    const statusUpdate =
      updates.status !== undefined
        ? (String(updates.status) as
            | "active"
            | "development"
            | "maintenance"
            | "developer"
            | "planned")
        : undefined;

    const mod = await prisma.module.update({
      where: { id: Number(id) },
      data: {
        ...(updates.name !== undefined && {
          name: String(updates.name).trim(),
          key: String(updates.name)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, ""),
        }),
        ...(updates.description !== undefined && {
          description: updates.description ? String(updates.description).trim() : null,
        }),
        ...(updates.image_url !== undefined && {
          image_url: updates.image_url ? String(updates.image_url).trim() : null,
        }),
        ...(updates.is_maintainer !== undefined && {
          is_maintainer: Boolean(updates.is_maintainer),
        }),
        ...(updates.is_trial !== undefined && {
          is_trial: Boolean(updates.is_trial),
        }),
        ...(updates.limit_days_trial !== undefined && {
          limit_days_trial: updates.limit_days_trial != null ? Number(updates.limit_days_trial) : null,
        }),
        ...(updates.start_trial !== undefined && {
          start_trial: updates.start_trial ? new Date(String(updates.start_trial)) : null,
        }),
        ...(updates.end_trial !== undefined && {
          end_trial: updates.end_trial ? new Date(String(updates.end_trial)) : null,
        }),
      },
    });

    let pushFields = {
      push_ok: false,
      push_skipped: true,
      push_error: null as string | null,
    };

    if (statusUpdate !== undefined) {
      const { applyGlobalModuleStatus } = await import(
        "@/src/shared/lib/push-entitlement-helpers"
      );
      pushFields = await applyGlobalModuleStatus(mod.id, statusUpdate);
    } else if (updates.is_maintainer !== undefined) {
      const { pushEntitlementForModuleToAllUsers } = await import(
        "@/src/shared/lib/push-entitlement-helpers"
      );
      pushFields = await pushEntitlementForModuleToAllUsers(mod.id);
    }

    const modOut = await prisma.module.findFirst({
      where: { id: mod.id },
      include: {
        sections: {
          where: { deleted_at: null },
          orderBy: { created_at: "asc" },
          include: {
            capabilities: { orderBy: { created_at: "asc" } },
          },
        },
      },
    });

    const usage = await getAppsUsingModules([mod.id]);
    const appsUsing = usage.get(mod.id) ?? [];

    return NextResponse.json({
      ...enrichModuleWithApps(modOut ?? mod, appsUsing),
      ...pushFields,
    });
  } catch {
    return NextResponse.json({ error: "Error al actualizar el módulo" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const existing = await prisma.module.findFirst({
      where: { id: Number(id), deleted_at: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Módulo no encontrado" }, { status: 404 });
    }

    await prisma.module.update({
      where: { id: Number(id) },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar el módulo" }, { status: 500 });
  }
}
