import { prisma } from "@/src/shared/lib/prisma";
import type { NewsKind, Prisma } from "@/prisma/generated/prisma/client";
import { revealSecret } from "@/src/shared/lib/secret-crypto";
import { formatPushError } from "@/src/shared/lib/push-entitlement-shared";

export const NEWS_KINDS = [
  "portada",
  "interior",
  "breve",
  "editorial",
  "proximamente",
] as const;

export type NewsKindValue = (typeof NEWS_KINDS)[number];

export type NewsPayloadItem = {
  id: number;
  title: string;
  subtitle: string | null;
  body: string | null;
  kind: NewsKindValue;
  published_at: string | null;
  sort_order: number;
};

export function isNewsKind(value: unknown): value is NewsKindValue {
  return (
    typeof value === "string" &&
    (NEWS_KINDS as readonly string[]).includes(value)
  );
}

/** Deriva URL de sync de noticias desde entitlement_url. */
export function newsSyncUrlFromEntitlement(entitlementUrl: string | null | undefined) {
  const raw = String(entitlementUrl || "").trim();
  if (!raw) return null;
  if (/\/news\/sync\/?$/i.test(raw)) return raw.replace(/\/?$/, "");
  if (/\/subscription\/entitlement\/?$/i.test(raw)) {
    return raw.replace(/\/subscription\/entitlement\/?$/i, "/news/sync");
  }
  return `${raw.replace(/\/$/, "")}/news/sync`;
}

const newsInclude = {
  targets: {
    include: {
      app: {
        select: {
          id: true,
          name: true,
          kind: true,
          entitlement_url: true,
        },
      },
    },
  },
} satisfies Prisma.NewsItemInclude;

export type NewsItemRow = Prisma.NewsItemGetPayload<{ include: typeof newsInclude }>;

export async function listNewsItems() {
  return prisma.newsItem.findMany({
    where: { deleted_at: null },
    include: newsInclude,
    orderBy: [{ sort_order: "asc" }, { published_at: "desc" }, { id: "desc" }],
  });
}

export async function getNewsItem(id: number) {
  return prisma.newsItem.findFirst({
    where: { id, deleted_at: null },
    include: newsInclude,
  });
}

export type UpsertNewsInput = {
  title: string;
  subtitle?: string | null;
  body?: string | null;
  kind: NewsKindValue;
  sort_order?: number;
  app_ids: number[];
};

export async function createNewsItem(input: UpsertNewsInput) {
  const appIds = [...new Set(input.app_ids.map(Number).filter((n) => n > 0))];
  return prisma.newsItem.create({
    data: {
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || null,
      body: input.body?.trim() || null,
      kind: input.kind as NewsKind,
      sort_order: Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0,
      targets: {
        create: appIds.map((app_id) => ({ app_id })),
      },
    },
    include: newsInclude,
  });
}

export async function updateNewsItem(id: number, input: UpsertNewsInput) {
  const existing = await prisma.newsItem.findFirst({
    where: { id, deleted_at: null },
    select: { id: true },
  });
  if (!existing) throw new Error("Noticia no encontrada");

  const appIds = [...new Set(input.app_ids.map(Number).filter((n) => n > 0))];

  await prisma.$transaction(async (tx) => {
    await tx.newsAppTarget.deleteMany({ where: { news_id: id } });
    await tx.newsItem.update({
      where: { id },
      data: {
        title: input.title.trim(),
        subtitle: input.subtitle?.trim() || null,
        body: input.body?.trim() || null,
        kind: input.kind as NewsKind,
        sort_order: Number.isFinite(input.sort_order) ? Number(input.sort_order) : 0,
        targets: {
          create: appIds.map((app_id) => ({ app_id })),
        },
      },
    });
  });

  return getNewsItem(id);
}

export async function softDeleteNewsItem(id: number) {
  const existing = await prisma.newsItem.findFirst({
    where: { id, deleted_at: null },
    include: { targets: true },
  });
  if (!existing) throw new Error("Noticia no encontrada");

  await prisma.newsItem.update({
    where: { id },
    data: { deleted_at: new Date(), is_published: false },
  });

  // Re-sync apps that tenían esta noticia
  const appIds = existing.targets.map((t) => t.app_id);
  return pushNewsToAppIds(appIds);
}

export async function listPublishedPayloadForApp(appId: number): Promise<NewsPayloadItem[]> {
  const rows = await prisma.newsItem.findMany({
    where: {
      deleted_at: null,
      is_published: true,
      targets: { some: { app_id: appId } },
    },
    orderBy: [{ sort_order: "asc" }, { published_at: "desc" }, { id: "desc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    body: r.body,
    kind: r.kind as NewsKindValue,
    published_at: r.published_at ? r.published_at.toISOString() : null,
    sort_order: r.sort_order,
  }));
}

export type NewsPushResult = {
  app_id: number;
  app_name: string;
  ok: boolean;
  skipped?: boolean;
  error?: string;
  status?: number;
};

export async function pushNewsToAppIds(appIds: number[]): Promise<NewsPushResult[]> {
  const unique = [...new Set(appIds.map(Number).filter((n) => n > 0))];
  if (!unique.length) return [];

  const apps = await prisma.apps.findMany({
    where: { id: { in: unique }, deleted_at: null },
    select: {
      id: true,
      name: true,
      entitlement_url: true,
      entitlement_secret: true,
    },
  });

  const results: NewsPushResult[] = [];

  for (const app of apps) {
    const appName = app.name?.trim() || `App ${app.id}`;
    const url = newsSyncUrlFromEntitlement(app.entitlement_url);
    if (!url) {
      results.push({
        app_id: app.id,
        app_name: appName,
        ok: true,
        skipped: true,
        error: "Sin entitlement_url",
      });
      continue;
    }

    const items = await listPublishedPayloadForApp(app.id);
    const secret = revealSecret(app.entitlement_secret) || "";

    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
        },
        body: JSON.stringify({ items }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const friendly = formatPushError(text || res.statusText, res.status);
        console.error(`[news] push falló (${appName}): ${res.status} ${friendly}`);
        await prisma.newsAppTarget.updateMany({
          where: { app_id: app.id },
          data: { pushed_at: new Date(), push_ok: false },
        });
        results.push({
          app_id: app.id,
          app_name: appName,
          ok: false,
          status: res.status,
          error: friendly,
        });
        continue;
      }

      await prisma.newsAppTarget.updateMany({
        where: { app_id: app.id },
        data: { pushed_at: new Date(), push_ok: true },
      });
      console.log(`[news] push OK → ${appName} (${url}) · ${items.length} ítems`);
      results.push({ app_id: app.id, app_name: appName, ok: true });
    } catch (err) {
      const message = formatPushError(
        err instanceof Error ? err.message : String(err),
      );
      console.error(`[news] push error (${appName}):`, message);
      await prisma.newsAppTarget.updateMany({
        where: { app_id: app.id },
        data: { pushed_at: new Date(), push_ok: false },
      });
      results.push({
        app_id: app.id,
        app_name: appName,
        ok: false,
        error: message,
      });
    }
  }

  return results;
}

export async function publishNewsItem(id: number) {
  const item = await prisma.newsItem.findFirst({
    where: { id, deleted_at: null },
    include: { targets: true },
  });
  if (!item) throw new Error("Noticia no encontrada");
  if (!item.targets.length) {
    throw new Error("Elegí al menos una app destino antes de publicar");
  }

  await prisma.newsItem.update({
    where: { id },
    data: {
      is_published: true,
      published_at: item.published_at ?? new Date(),
    },
  });

  const push = await pushNewsToAppIds(item.targets.map((t) => t.app_id));
  const fresh = await getNewsItem(id);
  return { item: fresh, push };
}

export async function publishAndPushAllNews() {
  const items = await prisma.newsItem.findMany({
    where: { deleted_at: null },
    include: { targets: true },
  });

  const withTargets = items.filter((i) => i.targets.length > 0);
  if (!withTargets.length) {
    throw new Error("No hay noticias con apps destino");
  }

  const now = new Date();
  await prisma.newsItem.updateMany({
    where: {
      id: { in: withTargets.map((i) => i.id) },
      deleted_at: null,
    },
    data: {
      is_published: true,
      published_at: now,
    },
  });

  // Conserva published_at original si ya estaba publicada
  for (const item of withTargets) {
    if (item.published_at) {
      await prisma.newsItem.update({
        where: { id: item.id },
        data: { published_at: item.published_at },
      });
    }
  }

  const appIds = [
    ...new Set(withTargets.flatMap((i) => i.targets.map((t) => t.app_id))),
  ];
  const push = await pushNewsToAppIds(appIds);
  return { count: withTargets.length, push };
}

export async function unpublishNewsItem(id: number) {
  const item = await prisma.newsItem.findFirst({
    where: { id, deleted_at: null },
    include: { targets: true },
  });
  if (!item) throw new Error("Noticia no encontrada");

  await prisma.newsItem.update({
    where: { id },
    data: { is_published: false },
  });

  const push = await pushNewsToAppIds(item.targets.map((t) => t.app_id));
  const fresh = await getNewsItem(id);
  return { item: fresh, push };
}

export type NewsImportItem = {
  title: string;
  subtitle?: string | null;
  body?: string | null;
  kind: NewsKindValue;
  sort_order?: number;
  is_published?: boolean;
  published_at?: string | null;
  /** IDs numéricos (solo si coinciden con apps del gestor). */
  app_ids?: number[];
  /** Nombres de app: EdDeli, Store, Tienda (recomendado para importar entre entornos). */
  app_names?: string[];
};

const VITE_DEPLOYMENT_NAMES = new Set(["eddeli", "store", "tienda"]);

async function listDeploymentApps() {
  return prisma.apps.findMany({
    where: { deleted_at: null, kind: "deployment" },
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });
}

/** Resuelve destino: app_names → app_ids válidos → default → EdDeli/Store/Tienda. */
async function resolveNewsTargetAppIds(
  raw: NewsImportItem,
  defaultAppIds: number[] = [],
) {
  const apps = await listDeploymentApps();
  const byName = new Map(
    apps.map((a) => [String(a.name || "").trim().toLowerCase(), a.id]),
  );
  const validIds = new Set(apps.map((a) => a.id));

  const fromNames = [
    ...new Set(
      (Array.isArray(raw.app_names) ? raw.app_names : [])
        .map((n) => byName.get(String(n).trim().toLowerCase()))
        .filter((id): id is number => Number.isFinite(id)),
    ),
  ];
  if (fromNames.length) return fromNames;

  const fromIds = [
    ...new Set(
      (Array.isArray(raw.app_ids) ? raw.app_ids : [])
        .map(Number)
        .filter((n) => Number.isFinite(n) && n > 0 && validIds.has(n)),
    ),
  ];
  if (fromIds.length) return fromIds;

  const fromDefaults = [
    ...new Set(
      defaultAppIds.map(Number).filter((n) => Number.isFinite(n) && n > 0 && validIds.has(n)),
    ),
  ];
  if (fromDefaults.length) return fromDefaults;

  const viteDefaults = apps
    .filter((a) => VITE_DEPLOYMENT_NAMES.has(String(a.name || "").trim().toLowerCase()))
    .map((a) => a.id);
  if (viteDefaults.length) return viteDefaults;

  throw new Error(
    "No hay apps destino (EdDeli/Store/Tienda). Revisá Apps en el gestor o usá app_names en el JSON.",
  );
}

/** Reemplaza el lote actual con el JSON importado (soft-delete + create). */
export async function importNewsFromJson(
  items: NewsImportItem[],
  defaultAppIds: number[] = [],
) {
  if (!Array.isArray(items) || !items.length) {
    throw new Error("El JSON no tiene noticias");
  }

  const normalized: Array<{
    title: string;
    subtitle: string | null;
    body: string | null;
    kind: NewsKind;
    sort_order: number;
    is_published: boolean;
    published_at: Date | null;
    app_ids: number[];
  }> = [];

  for (const raw of items) {
    const title = String(raw?.title || "").trim();
    if (!title) continue;
    if (!isNewsKind(raw?.kind)) {
      throw new Error(`kind inválido: ${String(raw?.kind)}`);
    }
    const appIds = await resolveNewsTargetAppIds(raw, defaultAppIds);
    if (!appIds.length) {
      throw new Error(`«${title}» no tiene apps destino`);
    }
    normalized.push({
      title,
      subtitle: raw.subtitle != null ? String(raw.subtitle).trim() || null : null,
      body: raw.body != null ? String(raw.body).trim() || null : null,
      kind: raw.kind as NewsKind,
      sort_order: Number.isFinite(Number(raw.sort_order)) ? Number(raw.sort_order) : 0,
      is_published: Boolean(raw.is_published),
      published_at: raw.published_at ? new Date(raw.published_at) : null,
      app_ids: appIds,
    });
  }

  if (!normalized.length) {
    throw new Error("No hay piezas válidas en el JSON");
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.newsItem.updateMany({
      where: { deleted_at: null },
      data: { deleted_at: now, is_published: false },
    });

    for (const n of normalized) {
      await tx.newsItem.create({
        data: {
          title: n.title,
          subtitle: n.subtitle,
          body: n.body,
          kind: n.kind,
          sort_order: n.sort_order,
          is_published: n.is_published,
          published_at: n.is_published ? n.published_at || now : n.published_at,
          targets: {
            create: n.app_ids.map((app_id) => ({ app_id })),
          },
        },
      });
    }
  });

  return { count: normalized.length };
}
