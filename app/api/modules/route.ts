import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";
import {
  enrichModuleWithApps,
  getAppsUsingModules,
} from "@/src/features/modules/lib/module-query";
import { isMobileChannel } from "@/src/features/modules/lib/module-channel";

function generateKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function parseChannel(raw: string | null): "web" | "mobile" {
  return raw === "mobile" ? "mobile" : "web";
}

export async function GET(request: NextRequest) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;
  try {
    const channel = parseChannel(request.nextUrl.searchParams.get("channel"));

    const modules = await prisma.module.findMany({
      where: { deleted_at: null, channel },
      include: {
        sections: {
          where: { deleted_at: null },
          orderBy: { created_at: "asc" },
          include: {
            capabilities: { orderBy: { created_at: "asc" } },
          },
        },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });

    const usage = await getAppsUsingModules(
      modules.map((m) => m.id),
      channel,
    );

    return NextResponse.json(
      modules.map((m) => {
        const appsUsing = usage.get(m.id) ?? [];
        return enrichModuleWithApps(m, appsUsing);
      }),
    );
  } catch {
    return NextResponse.json(
      { error: "Error al obtener módulos" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const name = body.name as string | undefined;
    const description = body.description as string | null | undefined;
    const image_url = body.image_url as string | null | undefined;
    const channel = parseChannel(
      typeof body.channel === "string" ? body.channel : "web",
    );

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre del módulo es obligatorio" },
        { status: 400 },
      );
    }

    let key = generateKey(name.trim());
    if (isMobileChannel(channel) && !key.startsWith("mobile_")) {
      key = `mobile_${key}`;
    }

    const existingKey = await prisma.module.findFirst({
      where: { key, deleted_at: null },
      select: { id: true },
    });
    if (existingKey) {
      key = `${key}_${Date.now().toString(36)}`;
    }

    const mod = await prisma.module.create({
      data: {
        name: name.trim(),
        key,
        channel,
        ...(description !== undefined && { description: description || null }),
        ...(image_url !== undefined && { image_url: image_url || null }),
      },
      include: {
        sections: {
          where: { deleted_at: null },
          orderBy: { created_at: "asc" },
          include: {
            capabilities: { orderBy: { created_at: "asc" } },
          },
        },
      },
    });

    return NextResponse.json(
      {
        ...mod,
        apps_count: 0,
        apps_using: [],
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Error al crear módulo" },
      { status: 500 },
    );
  }
}
