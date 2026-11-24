/**
 * Aviso de actualización programada (p. ej. a las 00:00).
 * Sin columna nueva en BD: archivo local + se mezcla en el entitlement push.
 */
import fs from "node:fs";
import path from "node:path";
import type { JointPolicy } from "@/src/features/system/lib/joint-update";
import type { TrioId } from "@/src/features/system/lib/trio-apps";

export type PendingScheduledUpdate = {
  appId: number;
  trio: TrioId;
  at: string;
  policy: JointPolicy;
  forceLogout: boolean;
  jobId?: number;
  createdAt: string;
};

function filePath() {
  return path.join(process.cwd(), "data", "pending-scheduled-updates.json");
}

function readAll(): Record<string, PendingScheduledUpdate> {
  try {
    const raw = fs.readFileSync(filePath(), "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, PendingScheduledUpdate>;
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, PendingScheduledUpdate>) {
  const dir = path.dirname(filePath());
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath(), JSON.stringify(map, null, 2), "utf8");
}

export function savePendingScheduledUpdate(entry: PendingScheduledUpdate) {
  const map = readAll();
  map[String(entry.appId)] = entry;
  writeAll(map);
}

export function peekPendingScheduledUpdate(
  appId: number,
): PendingScheduledUpdate | null {
  return readAll()[String(appId)] || null;
}

export function clearPendingScheduledUpdate(appId: number) {
  const map = readAll();
  const key = String(appId);
  if (map[key]) {
    delete map[key];
    writeAll(map);
  }
}

export function clearPendingScheduledByJobId(jobId: number) {
  const map = readAll();
  let changed = false;
  for (const [key, entry] of Object.entries(map)) {
    if (entry.jobId === jobId) {
      delete map[key];
      changed = true;
    }
  }
  if (changed) writeAll(map);
}

export function clearPendingScheduledForTrios(trios: TrioId[]) {
  const set = new Set(trios);
  const map = readAll();
  let changed = false;
  for (const [key, entry] of Object.entries(map)) {
    if (set.has(entry.trio)) {
      delete map[key];
      changed = true;
    }
  }
  if (changed) writeAll(map);
}
