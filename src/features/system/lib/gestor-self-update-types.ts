/** Tipos compartidos (client + server) para autoactualización del gestor. */

export type GestorSelfUpdateStatus =
  | "idle"
  | "updating"
  | "ok"
  | "error";

export type GestorSelfUpdateState = {
  status: GestorSelfUpdateStatus;
  acceptedAt?: string;
  finishedAt?: string;
  headBefore?: string | null;
  headAfter?: string | null;
  log?: string[];
  error?: string | null;
  pid?: number | null;
  dryRun?: boolean;
};
