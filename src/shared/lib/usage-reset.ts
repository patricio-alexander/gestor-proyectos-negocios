import cron from "node-cron";
import { prisma } from "./prisma";

let started = false;

export function startUsageResetScheduler() {
  if (started) return;
  started = true;

  cron.schedule("0 0 * * *", async () => {
    try {
      await prisma.section.updateMany({ data: { usage_count: 0 } });
    } catch {
      console.error("Error reseteando usage_count");
    }
  });
}

