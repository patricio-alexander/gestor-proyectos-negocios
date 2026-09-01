/**
 * Exporta noticias del gestor local a JSON (mismo formato que Importar en la UI).
 * Uso: npx tsx scripts/export-news-json.ts
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { prisma } from "../src/shared/lib/prisma";

async function main() {
  const apps = await prisma.apps.findMany({
    where: { deleted_at: null },
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });
  console.log("Apps:", apps.map((a) => `${a.id}=${a.name}`).join(", "));

  const items = await prisma.newsItem.findMany({
    where: { deleted_at: null },
    include: { targets: true },
    orderBy: [{ sort_order: "asc" }, { id: "asc" }],
  });

  if (!items.length) {
    console.error("No hay noticias en la BD local.");
    process.exit(1);
  }

  const payload = {
    exported_at: new Date().toISOString(),
    items: items.map((i) => ({
      title: i.title,
      subtitle: i.subtitle,
      body: i.body,
      kind: i.kind,
      sort_order: i.sort_order,
      is_published: i.is_published,
      published_at: i.published_at?.toISOString() ?? null,
      app_names: i.targets
        .map((t) => apps.find((a) => a.id === t.app_id)?.name)
        .filter(Boolean),
    })),
  };

  const out = resolve("data/noticias-periodico-export-local.json");
  writeFileSync(out, JSON.stringify(payload, null, 2));
  console.log(`Exportadas ${items.length} noticias → ${out}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
