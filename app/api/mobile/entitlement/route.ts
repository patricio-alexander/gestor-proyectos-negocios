import { NextRequest, NextResponse } from "next/server";
import { buildEntitlementForAppHash } from "@/src/shared/lib/entitlement-payload";
import { validateMobileApiKey } from "@/src/features/mobile-apps/lib/mobile-api-auth";

/**
 * Entitlement + catálogo de planes para apps móviles.
 * Auth: Authorization: Bearer {mobile_app.api_key}
 *
 * Solo módulos/planes channel=mobile (no mezcla con SoftEd/web).
 */
export async function GET(request: NextRequest) {
  const auth = await validateMobileApiKey(request);
  if (auth.error) return auth.error;

  if (!auth.control_app_hash) {
    return NextResponse.json(
      {
        error:
          "La app móvil no tiene app de control vinculada. Revisa Apps móvil en el gestor.",
      },
      { status: 503 },
    );
  }

  const payload = await buildEntitlementForAppHash(auth.control_app_hash);

  return NextResponse.json({
    app_key: auth.app_key,
    channel: "mobile",
    maintenance: payload.maintenance,
    subscribed: payload.subscribed,
    features: payload.features,
    plans: payload.plans,
    subscription: payload.subscription,
    modules: payload.subscription?.modules ?? [],
  });
}
