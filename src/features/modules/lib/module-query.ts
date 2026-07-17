import { prisma } from "@/src/shared/lib/prisma";

export type ModuleLinkedApp = {
  id: number;
  name: string | null;
  hash: string;
};

export async function getAppsUsingModules(moduleIds: number[]) {
  const map = new Map<number, ModuleLinkedApp[]>();
  if (moduleIds.length === 0) return map;

  const appModules = await prisma.appModule.findMany({
    where: { module_id: { in: moduleIds } },
    select: {
      module_id: true,
      app: {
        select: { id: true, name: true, hash: true, kind: true },
      },
    },
  });

  for (const am of appModules) {
    if (am.app.kind === "template") continue;
    const list = map.get(am.module_id) ?? [];
    if (!list.some((a) => a.hash === am.app.hash)) {
      list.push({ id: am.app.id, name: am.app.name, hash: am.app.hash });
    }
    map.set(am.module_id, list);
  }

  return map;
}

export function enrichModuleWithApps<T extends { id: number }>(
  mod: T,
  appsUsing: ModuleLinkedApp[],
) {
  return {
    ...mod,
    apps_count: appsUsing.length,
    apps_using: appsUsing,
  };
}
