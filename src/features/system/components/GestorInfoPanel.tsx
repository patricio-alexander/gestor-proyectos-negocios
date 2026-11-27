"use client";

import { useCallback, useState } from "react";
import { useOverlayState } from "@heroui/react";
import ArrowsRotateRight from "@gravity-ui/icons/ArrowsRotateRight";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import CircleInfo from "@gravity-ui/icons/CircleInfo";
import CircleXmark from "@gravity-ui/icons/CircleXmark";
import { PRODUCTION_SITE_URL, SITE_URL } from "@/src/config/site";
import { SYSTEM_VERSION } from "@/src/config/systemVersion";
import { ConfirmModal } from "@/src/features/system/components/ConfirmModal";
import type { GestorSelfUpdateState } from "@/src/features/system/lib/gestor-self-update-types";
import {
  isRestartLikeFailure,
  readSafeJson,
  sleep,
} from "@/src/features/system/lib/safe-fetch-json";
import { gp } from "@/src/shared/ui/theme";
import { apiUrl } from "@/src/utils/apiUrl";
import { appToast } from "@/src/shared/utils/app-toast";

type GestorStatus = {
  id: string;
  title: string;
  head: string | null;
  behind: number;
  ahead: number;
  needsUpdate: boolean;
  ok?: boolean;
  error?: string;
};

type StatusPayload = {
  ok: boolean;
  systemVersion?: string;
  siteUrl?: string;
  gestor?: GestorStatus;
  apps?: GestorStatus[];
  error?: string;
  selfUpdate?: GestorSelfUpdateState;
};

type UpdatePayload = {
  ok: boolean;
  accepted?: boolean;
  status?: string;
  dryRun?: boolean;
  results?: {
    id: string;
    title: string;
    ok: boolean;
    skipped?: boolean;
    reason?: string;
    log?: string[];
  }[];
  error?: string;
  message?: string;
  selfUpdate?: GestorSelfUpdateState;
};

const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-opacity disabled:opacity-50";
const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--gp-border)] bg-[var(--gp-surface)] px-3 py-2 text-sm font-medium text-[var(--gp-text)] transition-colors hover:border-[var(--gp-primary)] disabled:opacity-50";

const POLL_MAX_MS = 12 * 60 * 1000;
const POLL_START_MS = 1500;
const POLL_MAX_STEP_MS = 8000;

export function GestorInfoPanel() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [phase, setPhase] = useState<"idle" | "updating" | "restarting">(
    "idle",
  );
  const [lastUpdate, setLastUpdate] = useState<UpdatePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const confirmState = useOverlayState();

  const gestorFrom = useCallback((data: StatusPayload): GestorStatus | null => {
    if (data.gestor) return data.gestor;
    return data.apps?.find((a) => a.id === "gestor") || null;
  }, []);

  const fetchStatus = useCallback(async (): Promise<{
    payload: StatusPayload | null;
    restarting: boolean;
    err?: string;
  }> => {
    try {
      const res = await fetch(apiUrl("/api/system/update"), {
        credentials: "include",
        cache: "no-store",
      });
      const parsed = await readSafeJson<StatusPayload>(res);
      if (!parsed.ok) {
        return {
          payload: null,
          restarting: isRestartLikeFailure(parsed),
          err: parsed.error,
        };
      }
      if (!res.ok && parsed.data?.ok === false) {
        return {
          payload: parsed.data,
          restarting: false,
          err: parsed.data.error || "No se pudo verificar",
        };
      }
      return { payload: parsed.data, restarting: false };
    } catch (e) {
      return {
        payload: null,
        restarting: isRestartLikeFailure(null, e),
        err: e instanceof Error ? e.message : "Error de red",
      };
    }
  }, []);

  const verify = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const { payload, restarting, err } = await fetchStatus();
      if (restarting) {
        setError(null);
        appToast.warning("El servidor está reiniciando; reintentá en unos segundos");
        return;
      }
      if (!payload) throw new Error(err || "No se pudo verificar");
      setStatus(payload);
      const g = gestorFrom(payload);
      if (g?.needsUpdate) {
        appToast.warning(
          `Hay actualización: ${g.behind} commit${g.behind === 1 ? "" : "s"} pendiente${g.behind === 1 ? "" : "s"} en git`,
        );
      } else if (g?.ok) {
        appToast.success("Raptor Solutions está al día");
      } else {
        appToast.error(g?.error || "No se pudo leer el estado de git");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al verificar";
      setError(msg);
      appToast.error(msg);
    } finally {
      setChecking(false);
    }
  }, [fetchStatus, gestorFrom]);

  const pollUntilDone = useCallback(
    async (headBefore: string | null) => {
      setPhase("restarting");
      const started = Date.now();
      let delay = POLL_START_MS;

      while (Date.now() - started < POLL_MAX_MS) {
        await sleep(delay);
        delay = Math.min(Math.round(delay * 1.35), POLL_MAX_STEP_MS);

        const { payload, restarting } = await fetchStatus();
        if (restarting || !payload) continue;

        setStatus(payload);
        const self = payload.selfUpdate;
        const g = gestorFrom(payload);

        if (self?.status === "error") {
          throw new Error(self.error || "La autoactualización falló");
        }

        if (self?.status === "ok") {
          setLastUpdate({
            ok: true,
            status: "ok",
            dryRun: self.dryRun,
            message: "Actualización del gestor completada",
            results: [
              {
                id: "gestor",
                title: "Raptor Solutions (gestor)",
                ok: true,
                reason: self.dryRun ? "Simulado (dry-run)" : "Actualizado",
                log: self.log,
              },
            ],
            selfUpdate: self,
          });
          return;
        }

        if (self?.status === "updating") {
          setPhase("updating");
          continue;
        }

        // Servidor vivo otra vez: éxito si head cambió o ya no necesita update
        const headNow = g?.head || null;
        if (
          (headBefore && headNow && headNow !== headBefore) ||
          (g?.ok && !g.needsUpdate)
        ) {
          setLastUpdate({
            ok: true,
            status: "ok",
            message: "Servidor de vuelta tras reinicio",
            results: [
              {
                id: "gestor",
                title: "Raptor Solutions (gestor)",
                ok: true,
                reason: "Actualizado",
                log: self?.log,
              },
            ],
            selfUpdate: self,
          });
          return;
        }

        // idle sin cambio todavía: seguir un poco por si el job no escribió ok
        if (self?.status === "idle" || !self) {
          continue;
        }
      }

      throw new Error(
        "Se agotó la espera tras el reinicio. Revisá pm2 logs / data/gestor-self-update.log",
      );
    },
    [fetchStatus, gestorFrom],
  );

  async function runUpdate() {
    setUpdating(true);
    setPhase("updating");
    setError(null);
    setLastUpdate(null);
    const headBefore = status ? gestorFrom(status)?.head || null : null;

    try {
      let accepted = false;
      try {
        const res = await fetch(apiUrl("/api/system/update"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "one",
            app: "gestor",
            force: true,
          }),
        });
        const parsed = await readSafeJson<UpdatePayload>(res);

        if (parsed.ok) {
          setLastUpdate(parsed.data);
          if (res.status === 202 || parsed.data.accepted) {
            accepted = true;
          } else if (!res.ok || parsed.data.ok === false) {
            throw new Error(
              parsed.data.error || "La actualización terminó con errores",
            );
          } else {
            // 200 síncrono (p. ej. dry-run antiguo): éxito directo
            appToast.success(
              parsed.data.dryRun
                ? "Simulación OK (dry-run)"
                : "Raptor Solutions actualizado",
            );
            confirmState.close();
            await verify();
            return;
          }
        } else if (isRestartLikeFailure(parsed)) {
          // El POST pudo haberse aceptado y el restart ya cortó la respuesta
          accepted = true;
        } else {
          throw new Error(parsed.error || "Respuesta inválida del servidor");
        }
      } catch (e) {
        if (isRestartLikeFailure(null, e)) {
          accepted = true;
        } else {
          throw e;
        }
      }

      if (accepted) {
        appToast.warning("Actualización aceptada. Reiniciando…");
        confirmState.close();
        await pollUntilDone(headBefore);
        appToast.success(
          "Raptor Solutions actualizado (git pull + build + pm2)",
        );
        // Refresco final del badge
        const final = await fetchStatus();
        if (final.payload) setStatus(final.payload);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al actualizar";
      setError(msg);
      appToast.error(msg);
    } finally {
      setUpdating(false);
      setPhase("idle");
    }
  }

  const version = status?.systemVersion || SYSTEM_VERSION;
  const siteUrl = status?.siteUrl || SITE_URL || PRODUCTION_SITE_URL;
  const gestor = status ? gestorFrom(status) : null;
  const needsUpdate = Boolean(gestor?.needsUpdate);
  const updatingLabel =
    phase === "restarting"
      ? "Reiniciando…"
      : phase === "updating"
        ? "Actualizando…"
        : "Actualizar Raptor Solutions";

  return (
    <div className="flex flex-col gap-5">
      <div className={`${gp.cardPadded} space-y-3`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg border border-[var(--gp-border)] bg-[var(--gp-surface)] p-2 text-[var(--gp-primary)]">
            <CircleInfo width={22} height={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={gp.titleLg}>Raptor Solutions</h2>
            <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
              Gestor central de licencias, apps y actualizaciones del hub.
            </p>
            <p className="mt-3 text-sm text-[var(--gp-text)]">
              Versión instalada:{" "}
              <strong className="font-mono text-base">v{version}</strong>
            </p>
            <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
              Producción:{" "}
              <a
                href={siteUrl}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-[var(--gp-primary)] underline-offset-2 hover:text-[var(--gp-text)]"
              >
                {siteUrl}
              </a>
            </p>
          </div>
        </div>

        {gestor ? (
          <div
            className={`rounded-lg border px-3 py-2.5 text-sm ${
              needsUpdate
                ? "border-amber-500/40 bg-amber-500/10 text-amber-100"
                : gestor.ok
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                  : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 font-medium">
              {needsUpdate ? (
                <>
                  <CircleXmark width={14} height={14} />
                  Actualización disponible (−{gestor.behind} commit
                  {gestor.behind === 1 ? "" : "s"} en git)
                </>
              ) : gestor.ok ? (
                <>
                  <CircleCheck width={14} height={14} />
                  Estás al día
                </>
              ) : (
                <>
                  <CircleXmark width={14} height={14} />
                  {gestor.error || "Sin estado de git"}
                </>
              )}
            </div>
            <p className="mt-1 text-xs opacity-80">
              HEAD {gestor.head || "—"}
              {gestor.ahead > 0 ? ` · +${gestor.ahead} local` : ""}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--gp-text-muted)]">
            Pulsá <strong className="text-[var(--gp-text)]">Verificar</strong>{" "}
            para consultar git (fetch) y saber si hay commits nuevos.
          </p>
        )}

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void verify()}
            disabled={checking || updating}
            className={btnSecondary}
          >
            <ArrowsRotateRight width={14} height={14} />
            {checking ? "Verificando…" : "Verificar"}
          </button>
          <button
            type="button"
            disabled={updating || checking || (gestor != null && !needsUpdate)}
            onClick={() => confirmState.open()}
            className={btnPrimary}
            style={{
              backgroundColor: "var(--gp-primary)",
              color: "var(--gp-primary-text)",
            }}
            title={
              !gestor
                ? "Primero verificá el estado"
                : !needsUpdate
                  ? "Ya está al día"
                  : "Actualizar este gestor"
            }
          >
            {updating ? updatingLabel : "Actualizar Raptor Solutions"}
          </button>
        </div>

        <p className="text-xs text-[var(--gp-text-muted)]">
          1) Subí los cambios a git · 2) Acá pulsá Verificar · 3) Si hay
          commits, Actualizar (git pull + build staging + pm2 restart). Las apps
          EdDeli/Store/Tienda se actualizan en Configuración → Actualizar.
        </p>
      </div>

      {lastUpdate?.results?.length ? (
        <div className={`${gp.cardPadded} space-y-2`}>
          <h3 className="text-sm font-semibold text-[var(--gp-text)]">
            Última actualización
            {lastUpdate.dryRun ? " · dry-run" : ""}
          </h3>
          <ul className="space-y-2 text-sm">
            {lastUpdate.results.map((r) => (
              <li
                key={r.id}
                className="rounded-md border border-[var(--gp-border)] p-2"
              >
                <div className="font-medium text-[var(--gp-text)]">
                  {r.title}:{" "}
                  <span className={r.ok ? "text-emerald-300" : "text-red-300"}>
                    {r.skipped
                      ? `omitido · ${r.reason}`
                      : r.reason || (r.ok ? "OK" : "Error")}
                  </span>
                </div>
                {r.log?.length ? (
                  <pre className="mt-1 max-h-48 overflow-auto text-xs text-[var(--gp-text-muted)]">
                    {r.log.join("\n")}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ConfirmModal
        state={confirmState}
        title="Actualizar Raptor Solutions"
        message={
          "¿Actualizar el gestor ahora?\n\nHará git pull + build en staging + reinicio PM2.\nLa interfaz mostrará «Reiniciando…» hasta que el servidor vuelva."
        }
        confirmLabel="Actualizar"
        busy={updating}
        onConfirm={runUpdate}
      />
    </div>
  );
}
