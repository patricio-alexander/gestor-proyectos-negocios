import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, type JwtPayload } from "./jwt";
import { prisma } from "./prisma";
import { isEncryptedSecret, secretMatchesStored } from "./secret-crypto";

export async function getAuthUser(): Promise<
  { user: JwtPayload; error: null } | { user: null; error: NextResponse }
> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return {
        user: null,
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    const payload = await verifyToken(token);
    return { user: payload, error: null };
  } catch {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}

export async function validateKey(
  request: NextRequest,
): Promise<
  | { app_id: number; app_hash: string; error: null }
  | { app_id: null; app_hash: null; error: NextResponse }
> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      app_id: null,
      app_hash: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) {
    return {
      app_id: null,
      app_hash: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    // Legacy / igualdad directa (plaintext o coincidencia exacta del blob cifrado).
    const direct = await prisma.apps.findFirst({
      where: { entitlement_secret: rawKey, deleted_at: null },
      select: { id: true, hash: true },
    });
    if (direct) {
      return { app_id: direct.id, app_hash: direct.hash, error: null };
    }

    // Secretos cifrados: pocas apps → comparar en memoria.
    const encryptedApps = await prisma.apps.findMany({
      where: {
        deleted_at: null,
        entitlement_secret: { startsWith: "v1:" },
      },
      select: { id: true, hash: true, entitlement_secret: true },
    });
    for (const app of encryptedApps) {
      if (secretMatchesStored(rawKey, app.entitlement_secret)) {
        return { app_id: app.id, app_hash: app.hash, error: null };
      }
    }

    // Por si hay plaintext que no matcheó por encoding raro.
    const plainApps = await prisma.apps.findMany({
      where: {
        deleted_at: null,
        NOT: { entitlement_secret: null },
      },
      select: { id: true, hash: true, entitlement_secret: true },
    });
    for (const app of plainApps) {
      if (isEncryptedSecret(app.entitlement_secret)) continue;
      if (secretMatchesStored(rawKey, app.entitlement_secret)) {
        return { app_id: app.id, app_hash: app.hash, error: null };
      }
    }

    return {
      app_id: null,
      app_hash: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  } catch {
    return {
      app_id: null,
      app_hash: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}
