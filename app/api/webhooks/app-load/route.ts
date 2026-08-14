import { NextResponse, type NextRequest } from "next/server";
import { validateKey } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import { ingestAppLoadSample } from "@/src/features/apps/lib/ingest-app-load";

/**
 * Webhook de carga cada 10 segundos. No crea Event (es telemetría agregada).
 * Auth: Authorization: Bearer {entitlement_secret}
 */
export async function POST(request: NextRequest) {
  const auth = await validateKey(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => null);
    if (body == null || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
    }

    const row = await ingestAppLoadSample(auth.app_id, body);
    return NextResponse.json(
      {
        ok: true,
        app_id: auth.app_id,
        interval_start: row.interval_start,
      },
      { status: 201 },
    );
  } catch (err) {
    return serviceErrorResponse(err, "Error al guardar métricas de carga");
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    method: "POST",
    auth: "Authorization: Bearer {entitlement_secret}",
    body: {
      interval_start: "2026-08-14T14:23:00.000Z",
      requests: 120,
      bytes_in: 45000,
      bytes_out: 890000,
      errors: 3,
      latency_p95_ms: 187,
    },
  });
}
