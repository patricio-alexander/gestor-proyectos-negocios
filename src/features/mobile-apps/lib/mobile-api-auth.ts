import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { isEncryptedSecret, secretMatchesStored } from "@/src/shared/lib/secret-crypto";

export async function validateMobileApiKey(
  request: NextRequest,
): Promise<
  | {
      mobile_app_id: number;
      app_key: string;
      control_app_id: number | null;
      control_app_hash: string | null;
      error: null;
    }
  | {
      mobile_app_id: null;
      app_key: null;
      control_app_id: null;
      control_app_hash: null;
      error: NextResponse;
    }
> {
  const unauthorized = {
    mobile_app_id: null as null,
    app_key: null as null,
    control_app_id: null as null,
    control_app_hash: null as null,
    error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  };

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized;
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) {
    return unauthorized;
  }

  try {
    const direct = await prisma.mobileApp.findFirst({
      where: { api_key: rawKey, deleted_at: null },
      select: {
        id: true,
        key: true,
        app_id: true,
        app: { select: { id: true, hash: true, deleted_at: true } },
      },
    });

    const resolve = (app: NonNullable<typeof direct>) => {
      const controlOk = app.app && !app.app.deleted_at;
      return {
        mobile_app_id: app.id,
        app_key: app.key,
        control_app_id: controlOk ? app.app!.id : app.app_id,
        control_app_hash: controlOk ? app.app!.hash : null,
        error: null as null,
      };
    };

    if (direct) return resolve(direct);

    const candidates = await prisma.mobileApp.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        key: true,
        app_id: true,
        api_key: true,
        app: { select: { id: true, hash: true, deleted_at: true } },
      },
    });

    for (const app of candidates) {
      if (!isEncryptedSecret(app.api_key) && app.api_key !== rawKey) continue;
      if (!secretMatchesStored(rawKey, app.api_key)) continue;
      return resolve(app);
    }

    return unauthorized;
  } catch {
    return unauthorized;
  }
}

export function buildPublicBaseUrl(request: NextRequest): string {
  const fromEnv = process.env.OTA_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const proto =
    request.headers.get("x-forwarded-proto") ||
    request.nextUrl.protocol.replace(":", "") ||
    "https";
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/raptorsolutions";
  return `${proto}://${host}${basePath}`;
}

export function toAbsoluteBundleUrl(
  request: NextRequest,
  bundlePath: string,
): string {
  const base = buildPublicBaseUrl(request);
  const path = bundlePath.startsWith("/") ? bundlePath : `/${bundlePath}`;
  return `${base}${path}`;
}
