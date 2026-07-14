import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { getAuthUser } from "@/src/shared/lib/api-auth";

function generateKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

type LinkedApp = { id: number; name: string | null; hash: string };

/** Apps con plan ACTIVE que incluye el módulo. */
async function getAppsUsingModules(moduleIds: number[]) {
  const map = new Map<number, LinkedApp[]>();
  if (moduleIds.length === 0) return map;

  const links = await prisma.planModule.findMany({
    where: { module_id: { in: moduleIds } },
    select: {
      module_id: true,
      plan: {
        select: {
          prices: {
            select: {
              subscriptions: {
                where: { status: "ACTIVE" },
                select: {
                  apps: { select: { id: true, name: true, hash: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  for (const link of links) {
    const list = map.get(link.module_id) ?? [];
    for (const price of link.plan.prices) {
      for (const sub of price.subscriptions) {
        if (!list.some((a) => a.hash === sub.apps.hash)) {
          list.push(sub.apps);
        }
      }
    }
    map.set(link.module_id, list);
  }

  return map;
}

export async function GET() {
  const auth = await getAuthUser();
  if (auth.error) return auth.error;
  try {
    const modules = await prisma.module.findMany({
      where: { deleted_at: null },
      include: {
        apps: { select: { id: true, name: true, hash: true } },
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

    const usage = await getAppsUsingModules(modules.map((m) => m.id));

    return NextResponse.json(
      modules.map((m) => {
        const viaPlans = usage.get(m.id) ?? [];
        // Siempre incluir la app de registro del catálogo (vinculación base)
        const appsUsing: LinkedApp[] = [...viaPlans];
        if (
          m.apps &&
          !appsUsing.some((a) => a.hash === m.apps.hash)
        ) {
          appsUsing.unshift({
            id: m.apps.id,
            name: m.apps.name,
            hash: m.apps.hash,
          });
        }

        return {
          ...m,
          app_name: m.apps.name,
          catalog_app_name: m.apps.name,
          apps_count: appsUsing.length,
          apps_using: appsUsing,
        };
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
    const app_id = body.app_id as number | undefined;
    const description = body.description as string | null | undefined;
    const image_url = body.image_url as string | null | undefined;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "El nombre del módulo es obligatorio" },
        { status: 400 },
      );
    }
    if (!app_id) {
      return NextResponse.json(
        { error: "Debe vincular el módulo a una aplicación del catálogo" },
        { status: 400 },
      );
    }

    const key = generateKey(name.trim());

    const mod = await prisma.module.create({
      data: {
        name: name.trim(),
        key,
        app_id: Number(app_id),
        ...(description !== undefined && { description: description || null }),
        ...(image_url !== undefined && { image_url: image_url || null }),
      },
      include: {
        apps: { select: { id: true, name: true, hash: true } },
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
        app_name: mod.apps.name,
        catalog_app_name: mod.apps.name,
        apps_count: 1,
        apps_using: [
          { id: mod.apps.id, name: mod.apps.name, hash: mod.apps.hash },
        ],
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
