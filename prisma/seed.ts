import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 1,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({
    where: { id: "admin-id" },
    update: {},
    create: {
      id: "admin-id",
      username: "admin",
      email: "admin@mail.com",
      password: hashedPassword,
    },
  });

  console.log("Admin user seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
