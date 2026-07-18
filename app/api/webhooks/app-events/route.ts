import { NextResponse, type NextRequest } from "next/server";
import { validateKey } from "@/src/shared/lib/api-auth";
import { serviceErrorResponse } from "@/src/shared/lib/api-error";
import { ingestAppWebhookEvent } from "@/src/features/events/lib/webhook-ingest";
import { emitDashboardRefresh } from "@/src/shared/lib/realtime-emit";

/**
 * Webhook para apps cliente → Event + EventType (modelo unificado).
 * Auth: Authorization: Bearer {entitlement_secret}
 *
 * POST /raptorsolutions/api/webhooks/app-events
 *
 * Body:
 * {
 *   "type_key": "order.created",
 *   "name": "Pedido #1042",
 *   "metadata": { ... }
 * }
 */
export async function POST(request: NextRequest) {
  const auth = await validateKey(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => null);
    if (body == null || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Body JSON inválido" },
        { status: 400 },
      );
    }

    const result = await ingestAppWebhookEvent(auth.app_id, body);

    await emitDashboardRefresh({
      source: "webhook",
      app_id: auth.app_id,
      app_hash: auth.app_hash,
      event_id: result.event.id,
      event_type: result.type_key,
      received_at: result.event.created_at,
      event: result.event,
    });

    return NextResponse.json(
      {
        ok: true,
        event_id: result.event.id,
        type_key: result.type_key,
        event: result.event,
      },
      { status: 201 },
    );
  } catch (err) {
    return serviceErrorResponse(err, "Error al procesar webhook");
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    method: "POST",
    auth: "Authorization: Bearer {entitlement_secret}",
    body: {
      type_key: "order.created (obligatorio)",
      name: "Pedido #1042 (opcional)",
      metadata: "{ ... } (opcional)",
    },
    description:
      "Crea un Event vinculado a EventType y refresca el dashboard en tiempo real.",
  });
}
