import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, type JwtPayload } from "./jwt";
import { prisma } from "./prisma";

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

  const rawKey = authHeader.slice(7);

  try {
    const app = await prisma.apps.findFirst({
      where: { entitlement_secret: rawKey, deleted_at: null },
      select: { id: true, hash: true },
    });

    if (!app) {
      return {
        app_id: null,
        app_hash: null,
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    return {
      app_id: app.id,
      app_hash: app.hash,
      error: null,
    };
  } catch {
    return {
      app_id: null,
      app_hash: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}
