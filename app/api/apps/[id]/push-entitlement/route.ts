import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import {
  pushEntitlementToApp,
  toPushResponseFields,
} from "@/src/shared/lib/push-entitlement";

type Params = { params: Promise<{ id: string }> };

/** POST — empuja manualmente el entitlement al backend de la app. */
export async function POST(_request: Request, { params }: Params) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const app = await prisma.apps.findFirst({
      where: { id: Number(id), deleted_at: null },
      select: { hash: true, entitlement_url: true },
    });
    if (!app) {
      return NextResponse.json({ error: "Aplicación no encontrada" }, { status: 404 });
    }
    if (!app.entitlement_url) {
      return NextResponse.json(
        { error: "La app no tiene entitlement_url configurada" },
        { status: 400 },
      );
    }

    const result = await pushEntitlementToApp(app.hash);
    const pushFields = toPushResponseFields(result);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error || "Push falló",
          status: result.status,
          ...pushFields,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, ...pushFields });
  } catch {
    return NextResponse.json(
      { error: "Error al empujar entitlement" },
      { status: 500 },
    );
  }
}
