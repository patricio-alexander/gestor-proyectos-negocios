/**
 * Deploy pendiente tras aviso «con permiso del usuario».
 * Archivo local (sin cambiar schema de BD): se dispara cuando la app
 * llama POST /api/apps/update-apply al aceptar «Actualizar ahora».
 */
import fs from "node:fs";
import path from "node:path";
import type { DeploySteps } from "@/src/features/system/lib/joint-update";
import type { TrioId } from "@/src/features/system/lib/trio-apps";

export type PendingOptionalDeploy = {
  appId: number;
  trio: TrioId;
  steps: DeploySteps;
  forceLogout: boolean;
  createdAt: string;
};

function filePath() {
  return path.join(process.cwd(), "data", "pending-optional-deploys.json");
}

function readAll(): Record<string, PendingOptionalDeploy> {
  try {
    const raw = fs.readFileSync(filePath(), "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, PendingOptionalDeploy>;
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, PendingOptionalDeploy>) {
  const dir = path.dirname(filePath());
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath(), JSON.stringify(map, null, 2), "utf8");
}

export function savePendingOptionalDeploy(entry: PendingOptionalDeploy) {
  const map = readAll();
  map[String(entry.appId)] = entry;
  writeAll(map);
}

export function peekPendingOptionalDeploy(
  appId: number,
): PendingOptionalDeploy | null {
  return readAll()[String(appId)] || null;
}

export function takePendingOptionalDeploy(
  appId: number,
): PendingOptionalDeploy | null {
  const map = readAll();
  const key = String(appId);
  const entry = map[key] || null;
  if (entry) {
    delete map[key];
    writeAll(map);
  }
  return entry;
}

export function clearPendingOptionalDeploy(appId: number) {
  const map = readAll();
  const key = String(appId);
  if (map[key]) {
    delete map[key];
    writeAll(map);
  }
}
