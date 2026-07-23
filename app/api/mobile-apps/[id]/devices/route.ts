import { NextResponse } from "next/server";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import { prisma } from "@/src/shared/lib/prisma";
import {
  getActiveReleaseVersion,
  mapMobileDevice,
} from "@/src/features/mobile-apps/lib/mobile-device";
import type { MobilePlatform } from "@/src/features/mobile-apps/types";

type Ctx = { params: Promise<{ id: string }> };

/** Lista dispositivos que reportaron heartbeat para esta app móvil. */
export async function GET(_request: Request, context: Ctx) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  const id = Number((await context.params).id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const app = await prisma.mobileApp.findFirst({
    where: { id, deleted_at: null },
    select: { id: true },
  });
  if (!app) {
    return NextResponse.json({ error: "App no encontrada" }, { status: 404 });
  }

  const devices = await prisma.mobileDevice.findMany({
    where: { mobile_app_id: id, deleted_at: null },
    orderBy: { last_seen_at: "desc" },
  });

  const latestByPlatform = new Map<MobilePlatform, string | null>();
  for (const platform of ["android", "ios"] as MobilePlatform[]) {
    latestByPlatform.set(
      platform,
      await getActiveReleaseVersion(id, platform),
    );
  }

  return NextResponse.json(
    devices.map((d) =>
      mapMobileDevice(d, latestByPlatform.get(d.platform) ?? null),
    ),
  );
}
