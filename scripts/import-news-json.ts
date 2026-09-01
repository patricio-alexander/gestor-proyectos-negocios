/**
 * Importa noticias desde JSON y las empuja a EdDeli / Store / Tienda.
 *
 * Uso:
 *   npx tsx scripts/import-news-json.ts
 *   npx tsx scripts/import-news-json.ts data/noticias-periodico.json
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  importNewsFromJson,
  publishAndPushAllNews,
} from "../src/features/news/lib/news-service";

const file = resolve(process.argv[2] || "data/noticias-periodico.json");
const parsed = JSON.parse(readFileSync(file, "utf8")) as {
  items?: unknown[];
  default_app_ids?: number[];
};
const items = Array.isArray(parsed) ? parsed : parsed.items;
if (!Array.isArray(items) || !items.length) {
  console.error("JSON inválido: esperá { items: [...] }");
  process.exit(1);
}

const defaultAppIds = Array.isArray(parsed?.default_app_ids)
  ? parsed.default_app_ids.map(Number).filter((n) => n > 0)
  : [];

const imported = await importNewsFromJson(items as never[], defaultAppIds);
console.log(`Importadas ${imported.count} noticia(s) desde ${file}`);

const pushed = await publishAndPushAllNews();
console.log(`Publicadas ${pushed.count} · push:`);
for (const r of pushed.push) {
  console.log(
    r.ok
      ? `  OK  ${r.app_name}`
      : `  FAIL ${r.app_name}: ${r.error || r.status}`,
  );
}
