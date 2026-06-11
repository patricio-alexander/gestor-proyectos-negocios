import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { LicenseStatus } from "../../../../prisma/generated/prisma/enums";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    const license = await prisma.license.findFirst({
      where: { id: Number(id) },
    });

    if (!license) {
      return NextResponse.json(
        { error: "Licencia no encontrada" },
        { status: 404 }
      );
    }

    const updated = await prisma.license.update({
      where: { id: Number(id) },
      data: { status: LicenseStatus.REVOKED },
    });

    return NextResponse.json({
      id: updated.id,
      plan_price_id: updated.plan_price_id,
      key: updated.key,
      status: updated.status,
      used_at: updated.used_at?.toISOString() ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al revocar licencia" },
      { status: 500 }
    );
  }
}
