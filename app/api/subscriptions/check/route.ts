import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { validateApiKey } from "@/src/shared/lib/api-auth";
import { buildEntitlementForAppHash } from "@/src/shared/lib/entitlement-payload";

export async function GET(request: NextRequest) {
  const apiKey = await validateApiKey(request);
  if (apiKey.error) return apiKey.error;

  try {
    const exists = await prisma.apps.findFirst({
      where: { hash: apiKey.app_hash, deleted_at: null },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json(
        { error: "Aplicación no encontrada" },
        { status: 404 },
      );
    }

    const payload = await buildEntitlementForAppHash(apiKey.app_hash!);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Error al verificar suscripción" },
      { status: 500 },
    );
  }
}
