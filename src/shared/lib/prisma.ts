import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../../prisma/generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

void prisma.user
  .findFirst({ where: { username: "admin" } })
  .then((existing) => {
    if (!existing) {
      return bcrypt
        .hash("123456", 10)
        .then((hash) =>
          prisma.user.create({
            data: {
              username: "admin",
              email: "admin@mail.com",
              password: hash,
            },
          })
        )
        .then(() => console.log("Admin user created"));
    }
  });

export { prisma };
