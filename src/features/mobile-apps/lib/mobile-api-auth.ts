import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";

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
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      mobile_app_id: null,
      app_key: null,
      control_app_id: null,
      control_app_hash: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) {
    return {
      mobile_app_id: null,
      app_key: null,
      control_app_id: null,
      control_app_hash: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    const app = await prisma.mobileApp.findFirst({
      where: { api_key: rawKey, deleted_at: null },
      select: {
        id: true,
        key: true,
        app_id: true,
        app: { select: { id: true, hash: true, deleted_at: true } },
      },
    });

    if (!app) {
      return {
        mobile_app_id: null,
        app_key: null,
        control_app_id: null,
        control_app_hash: null,
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    const controlOk = app.app && !app.app.deleted_at;

    return {
      mobile_app_id: app.id,
      app_key: app.key,
      control_app_id: controlOk ? app.app!.id : app.app_id,
      control_app_hash: controlOk ? app.app!.hash : null,
      error: null,
    };
  } catch {
    return {
      mobile_app_id: null,
      app_key: null,
      control_app_id: null,
      control_app_hash: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
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
