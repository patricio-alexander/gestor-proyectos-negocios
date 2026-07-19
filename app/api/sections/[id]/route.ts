import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { parseMaxRecordsLimit } from "@/src/shared/utils/max-records-limit";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const updates: Record<string, unknown> = await request.json();

    const existing = await prisma.section.findFirst({
      where: { id: Number(id), deleted_at: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
    }

    if (updates.max_records_limit !== undefined) {
      const limitResult = parseMaxRecordsLimit(updates.max_records_limit);
      if (!limitResult.ok) {
        return NextResponse.json({ error: limitResult.error }, { status: 400 });
      }
      updates.max_records_limit = limitResult.value;
    }

    const data: Record<string, unknown> = {
      ...(updates.name !== undefined && {
        name: String(updates.name).trim(),
      }),
      ...(updates.key !== undefined && {
        key: updates.key ? String(updates.key).trim() : null,
      }),
      ...(updates.max_records_limit !== undefined && {
        max_records_limit: updates.max_records_limit as number | null,
      }),
    };

    if (Object.keys(data).length > 0) {
      await prisma.section.update({
        where: { id: Number(id) },
        data,
      });
    }

    let pushFields = {
      push_ok: false,
      push_skipped: true,
      push_error: null as string | null,
      push_results: [] as import("@/src/shared/lib/push-entitlement-shared").PushAppResult[],
    };

    if (updates.status !== undefined) {
      const { applyGlobalSectionStatus } = await import(
        "@/src/shared/lib/push-entitlement-helpers"
      );
      pushFields = await applyGlobalSectionStatus(
        Number(id),
        String(updates.status) as
          | "active"
          | "development"
          | "maintenance"
          | "developer"
          | "planned",
      );
    }

    const sectionOut = await prisma.section.findFirst({
      where: { id: Number(id) },
      include: {
        module: { select: { id: true, status: true } },
      },
    });

    return NextResponse.json({
      ...sectionOut,
      module_status: sectionOut?.module.status ?? null,
      ...pushFields,
    });
  } catch {
    return NextResponse.json({ error: "Error al actualizar la sección" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const existing = await prisma.section.findFirst({
      where: { id: Number(id), deleted_at: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Sección no encontrada" }, { status: 404 });
    }

    await prisma.section.update({
      where: { id: Number(id) },
      data: { deleted_at: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar la sección" }, { status: 500 });
  }
}
