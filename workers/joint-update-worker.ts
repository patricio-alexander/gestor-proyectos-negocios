/**
 * Ejecuta jobs de actualización conjunta vencidos cada minuto.
 * No depende de que alguien abra el modal en el dashboard.
 */
import "dotenv/config";
import cron from "node-cron";
import { runDueJointJobs } from "@/src/features/system/lib/joint-update";

async function tick() {
  try {
    const ran = await runDueJointJobs();
    if (ran > 0) {
      console.log(`[joint-update-worker] ejecutó ${ran} job(s) vencido(s)`);
    }
  } catch (e) {
    console.error(
      "[joint-update-worker] error:",
      e instanceof Error ? e.message : e,
    );
  }
}

console.log(
  "[joint-update-worker] iniciado — revisa jobs pendientes cada minuto",
);

void tick();
cron.schedule("* * * * *", () => {
  void tick();
});
