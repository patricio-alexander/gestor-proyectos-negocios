"use client";

import { useCallback, useEffect, useState } from "react";
import ArrowsRotateRight from "@gravity-ui/icons/ArrowsRotateRight";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import CircleXmark from "@gravity-ui/icons/CircleXmark";
import { PRODUCTION_SITE_URL, SITE_URL } from "@/src/config/site";
import { SYSTEM_VERSION } from "@/src/config/systemVersion";
import { gp } from "@/src/shared/ui/theme";
import { apiUrl } from "@/src/utils/apiUrl";

type AppStatus = {
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
  dryRunDefault?: boolean;
  apps?: AppStatus[];
  missing?: string[];
  error?: string;
};

type UpdateResult = {
  id: string;
  title: string;
  ok: boolean;
  skipped?: boolean;
  dryRun?: boolean;
  reason?: string;
  log?: string[];
};

type UpdatePayload = {
  ok: boolean;
  mode?: string;
  dryRun?: boolean;
  results?: UpdateResult[];
  missingAfter?: string[];
  message?: string;
  error?: string;
};

const TRIO = [
  { id: "eddeli", label: "EdDeli" },
  { id: "store", label: "Store" },
  { id: "tienda", label: "Tienda" },
] as const;

const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-opacity disabled:opacity-50";
const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--gp-border)] bg-[var(--gp-surface)] px-3 py-2 text-sm font-medium text-[var(--gp-text)] transition-colors hover:border-[var(--gp-primary)] disabled:opacity-50";

export function SystemUpdatePanel() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<UpdatePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/api/system/update"), {
        credentials: "include",
      });
      const data = (await res.json()) as StatusPayload;
      if (!res.ok) throw new Error(data.error || "No se pudo leer el estado");
      setStatus(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al consultar estado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const siteUrl = status?.siteUrl || SITE_URL || PRODUCTION_SITE_URL;
  const isDryRun = Boolean(status?.dryRunDefault);

  const runUpdate = async (mode: "all" | "missing" | "one", app?: string) => {
    const label =
      mode === "all"
        ? "¿Actualizar EdDeli, Store y Tienda ahora?\n\nHará git pull + db:sync + reinicio PM2 en el servidor.\nAntes debés haber subido los cambios a git."
        : mode === "missing"
          ? "¿Actualizar solo las apps atrasadas?"
          : `¿Actualizar ${app} ahora? (pull + sync + pm2)`;
    if (!window.confirm(label)) return;

    setRunning(true);
    setError(null);
    setLastRun(null);
    try {
      const res = await fetch(apiUrl("/api/system/update"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          app,
          force: mode === "all" || mode === "one",
        }),
      });
      const data = (await res.json()) as UpdatePayload;
      setLastRun(data);
      if (!res.ok && !data.ok) {
        setError(data.error || "La actualización terminó con errores");
      }
      await loadStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setRunning(false);
    }
  };

  const apps = status?.apps || [];
  const missing = status?.missing || [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={gp.titleLg}>Actualizar instalaciones</h2>
          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
            En el servidor baja cambios de git, sincroniza BD y reinicia
            backends. Versión:{" "}
            <strong className="text-[var(--gp-text)]">
              v{status?.systemVersion || SYSTEM_VERSION}
            </strong>
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
          <p className="mt-2 rounded-md border border-[var(--gp-border)] bg-[var(--gp-surface)] px-2.5 py-1.5 text-xs text-[var(--gp-text-muted)]">
            1) Subí los cambios a git · 2) Abrí el gestor en producción · 3)
            Pulsá <strong className="text-[var(--gp-text)]">Actualizar las 3</strong>
            {isDryRun ? " · (ahora: dry-run / UPDATE_APPS_DRY_RUN)" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadStatus()}
          disabled={loading || running}
          className={btnSecondary}
        >
          <ArrowsRotateRight width={14} height={14} />
          Refrescar estado
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-3">
        {TRIO.map((t) => {
          const st = apps.find((a) => a.id === t.id);
          const behind = st?.behind ?? 0;
          const needs = Boolean(st?.needsUpdate);
          return (
            <div key={t.id} className={`${gp.cardPadded} flex flex-col gap-2`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[var(--gp-text)]">
                  {t.label}
                </span>
                {needs ? (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-300">
                    <CircleXmark width={12} height={12} />−{behind}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                    <CircleCheck width={12} height={12} />
                    Al día
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--gp-text-muted)]">
                HEAD {st?.head || "—"}
                {st?.error ? ` · ${st.error}` : ""}
              </p>
              <button
                type="button"
                disabled={running}
                onClick={() => void runUpdate("one", t.id)}
                className={btnSecondary}
              >
                Actualizar esta
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={running}
          onClick={() => void runUpdate("all")}
          className={btnPrimary}
          style={{
            backgroundColor: "var(--gp-primary)",
            color: "var(--gp-primary-text)",
          }}
        >
          {running ? "Actualizando…" : "Actualizar las 3"}
        </button>
        <button
          type="button"
          disabled={running || missing.length === 0}
          onClick={() => void runUpdate("missing")}
          className={btnSecondary}
        >
          Solo las que faltan
          {missing.length ? ` (${missing.length})` : ""}
        </button>
      </div>

      {lastRun?.results?.length || lastRun?.message ? (
        <div className={`${gp.cardPadded} space-y-2`}>
          <h3 className="text-sm font-semibold text-[var(--gp-text)]">
            Última corrida ({lastRun.mode}
            {lastRun.dryRun ? " · dry-run" : " · live"})
          </h3>
          {lastRun.message ? (
            <p className="text-sm text-[var(--gp-text-muted)]">{lastRun.message}</p>
          ) : null}
          <ul className="space-y-2 text-sm">
            {(lastRun.results || []).map((r) => (
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
                  <pre className="mt-1 overflow-x-auto text-xs text-[var(--gp-text-muted)]">
                    {r.log.join("\n")}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--gp-text-muted)]">Consultando repos…</p>
      ) : null}
    </div>
  );
}
