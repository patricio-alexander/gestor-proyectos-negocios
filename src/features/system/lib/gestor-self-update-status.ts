/**
 * Estado de autoactualización del gestor (Raptor Solutions).
 * Archivo local: el POST responde 202 y un proceso detached escribe el resultado.
 */
import fs from "node:fs";
import path from "node:path";
import type { GestorSelfUpdateState } from "@/src/features/system/lib/gestor-self-update-types";

export type {
  GestorSelfUpdateState,
  GestorSelfUpdateStatus,
} from "@/src/features/system/lib/gestor-self-update-types";

function filePath() {
  return path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "data",
    "gestor-self-update.json",
  );
}

export function readGestorSelfUpdateState(): GestorSelfUpdateState {
  try {
    const raw = fs.readFileSync(filePath(), "utf8");
    const parsed = JSON.parse(raw) as GestorSelfUpdateState;
    if (!parsed || typeof parsed !== "object") {
      return { status: "idle" };
    }
    if (
      parsed.status !== "idle" &&
      parsed.status !== "updating" &&
      parsed.status !== "ok" &&
      parsed.status !== "error"
    ) {
      return { status: "idle" };
    }
    return parsed;
  } catch {
    return { status: "idle" };
  }
}

export function writeGestorSelfUpdateState(
  state: GestorSelfUpdateState,
): void {
  const dir = path.dirname(filePath());
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${filePath()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
  fs.renameSync(tmp, filePath());
}

export function gestorSelfUpdateLogPath() {
  return path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "data",
    "gestor-self-update.log",
  );
}
