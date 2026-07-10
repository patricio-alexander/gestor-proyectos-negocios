import Watcher from "watcher";
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/prisma/generated/prisma/client";
import path from "path";
import fs from "fs/promises";

// Resetear contador de limite de uso por seccion
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});

const basePath = "/var/www/html";

const getSizeFolder = async (pathDir: string) => {
  const entries = await fs.readdir(pathDir, { withFileTypes: true });

  const sizes = await Promise.all(
    entries.map(async (entrie) => {
      const fullpath = path.join(pathDir, entrie.name);

      if (entrie.isFile()) {
        const stats = await fs.stat(fullpath);
        return stats.size;
      }
      return 0;
    }),
  );

  return Math.round(sizes.reduce((acc, s) => acc + s, 0) / (1024 * 1024));
};

async function main() {
  const prisma = new PrismaClient({ adapter });
  const apps = await prisma.apps.findMany({
    select: { path: true, id: true },
    where: {
      path: { not: null },
      AND: [{ path: { not: "" } }, { path: { not: "null" } }],
    },
  });

  if (!apps.length) {
    return;
  }

  const fullpaths = apps.map((app) => ({
    id: app.id,
    fullpath: `${basePath}${app.path}`,
  }));

  const watcher = new Watcher(fullpaths.map((f) => f.fullpath));

  const onChangeFolder = async (filePath: any) => {
    const folder = fullpaths.find(
      (f) => f.fullpath === path.dirname(path.resolve(filePath)),
    );
    if (folder) {
      const size = await getSizeFolder(folder.fullpath);
      await prisma.apps.update({
        where: { id: folder.id },
        data: {
          images_size: size,
        },
      });
    }
  };

  watcher.on("add", async (filePath) => {
    onChangeFolder(filePath);
  });

  watcher.on("change", (filePath) => {
    onChangeFolder(filePath);
  });

  // Cuando el watcher está listo (ya escaneó todo)
  watcher.on("ready", () => {
    console.log("Watcher listo, vigilando cambios...");
  });

  prisma.$disconnect();
}
main();
