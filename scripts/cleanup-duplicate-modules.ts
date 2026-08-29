import "dotenv/config";
import {
  mergeMarketingModule,
  pruneDeletedModulesFromApps,
  pruneMobileModulesFromWebApps,
  retireCanalDigitalModule,
  retireComprobantesElectronicosModule,
  retireLegacyCanalModule,
} from "../src/features/modules/lib/cleanup-module-assignments";
import { prisma } from "../src/shared/lib/prisma";

async function main() {
  const canal = await retireLegacyCanalModule();
  const canalDigital = await retireCanalDigitalModule();
  const sri = await retireComprobantesElectronicosModule();
  const marketing = await mergeMarketingModule();
  const mobile = await pruneMobileModulesFromWebApps();
  const deleted = await pruneDeletedModulesFromApps();
  console.log("canal:", canal);
  console.log("canal_digital:", canalDigital);
  console.log("comprobantes_electronicos:", sri);
  console.log("marketing:", marketing);
  console.log("mobile pruned from web apps:", mobile);
  console.log("deleted-module links:", deleted);

  const leftover = await prisma.appModule.findMany({
    where: {
      app: { kind: "deployment", deleted_at: null },
      module: {
        OR: [
          { channel: "mobile" },
          { key: { in: ["canal", "canal_digital", "comprobantes_electronicos"] } },
        ],
      },
    },
    include: { module: { select: { key: true } }, app: { select: { name: true } } },
  });
  console.log("leftover", leftover.map((r) => `${r.app.name}:${r.module.key}`));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
