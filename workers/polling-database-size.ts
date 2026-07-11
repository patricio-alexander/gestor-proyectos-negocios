import "dotenv/config";

import mysql from "mysql2/promise";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import cron from "node-cron";
import { PrismaClient } from "@/prisma/generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

const connection = await mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  // no pongas "database" aquí, para poder ver todas
});

async function main() {
  const apps = await prisma.apps.findMany({
    select: { database_name: true, id: true },
    where: {
      database_name: { not: null },
      AND: [{ database_name: { not: "" } }, { database_name: { not: "null" } }],
    },
  });

  if (!apps.length) {
    console.log(
      "no hay apps - asegurate de tener regisrado el nombre de base de datos de apps",
    );
    return;
  }

  async function getDbSizeBytes(dbName: string): Promise<number> {
    const [rows] = await connection.query<any[]>(
      `
    SELECT SUM(data_length + index_length) AS size_bytes
    FROM information_schema.tables
    WHERE table_schema = ?;
    `,
      [dbName],
    );
    return Number(rows[0].size_bytes ?? 0);
  }

  await Promise.all(
    apps.map(async (app) => {
      if (!app.database_name) return;

      const dbSizeInBytes = await getDbSizeBytes(app.database_name);
      const toMb = dbSizeInBytes / (1024 * 1024);
      await prisma.apps.update({
        where: { id: app.id },
        data: { database_size: toMb },
      });
    }),
  );
}

cron.schedule("*/5 * * * *", main);

console.log("actualizando cada 5 minutos el peso de la DB");
