import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, type JwtPayload } from "./jwt";
import { prisma } from "./prisma";
import crypto from "crypto";

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

export async function validateApiKey(
  request: NextRequest,
): Promise<
  | { business_id: number; business_hash: string; error: null }
  | { business_id: null; business_hash: null; error: NextResponse }
> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      business_id: null,
      business_hash: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const apiKey = authHeader.slice(7);
  const prefix = apiKey.slice(0, 11);

  try {
    const record = await prisma.apiKey.findFirst({
      where: { prefix, active: true },
      include: { business: { select: { id: true, hash: true } } },
    });

    if (!record) {
      return {
        business_id: null,
        business_hash: null,
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    const hash = crypto.createHash("sha256").update(apiKey).digest("hex");
    if (hash !== record.hash) {
      return {
        business_id: null,
        business_hash: null,
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }

    return {
      business_id: record.business.id,
      business_hash: record.business.hash,
      error: null,
    };
  } catch {
    return {
      business_id: null,
      business_hash: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}
