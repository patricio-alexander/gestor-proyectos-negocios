import "dotenv/config";
import cron from "node-cron";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
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

async function resetUsage() {
  try {
    await prisma.section.updateMany({ data: { usage_count: 0 } });
  } catch {
    console.error("Error reseteando usage_count");
  } finally {
    await prisma.$disconnect();
  }
}

cron.schedule("0 0 * * *", async () => {
  await resetUsage();
  process.exit(0);
});

console.log("Usage reset worker started. Waiting for midnight...");