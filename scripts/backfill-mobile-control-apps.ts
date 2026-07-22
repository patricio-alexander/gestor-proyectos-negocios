import { prisma } from "../src/shared/lib/prisma";
import { ensureMobileControlApp } from "../src/features/mobile-apps/lib/mobile-control-app";

async function main() {
  const apps = await prisma.mobileApp.findMany({ where: { deleted_at: null } });
  for (const a of apps) {
    const id = await ensureMobileControlApp(a);
    console.log(`${a.key} -> Apps#${id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
