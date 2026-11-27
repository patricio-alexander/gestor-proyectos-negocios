"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Label,
  Modal,
  Spinner,
  Switch,
  useOverlayState,
} from "@heroui/react";
import ArrowsRotateRight from "@gravity-ui/icons/ArrowsRotateRight";
import Clock from "@gravity-ui/icons/Clock";
import { PRODUCTION_SITE_URL } from "@/src/config/site";
import { pm2NameFor } from "@/src/features/system/lib/pm2-names";
import { ConfirmModal } from "@/src/features/system/components/ConfirmModal";
import {
  formatGuayaquil,
  guayaquilWallTimeToUtc,
  utcToGuayaquilInputValue,
} from "@/src/features/system/lib/guayaquil-time";
import { apiUrl } from "@/src/utils/apiUrl";
import { appToast } from "@/src/shared/utils/app-toast";

type TrioId = "eddeli" | "store" | "tienda";
type Policy = "forced" | "optional";

type Job = {
  id: number;
  run_at: string;
  policy: Policy;
  deploy: boolean;
  notify: boolean;
  targets: unknown;
  status: string;
};

const TRIO_OPTS: { id: TrioId; label: string }[] = [
  { id: "eddeli", label: "EdDeli" },
  { id: "store", label: "Store" },
  { id: "tienda", label: "Tienda" },
];

export function JointUpdateModal() {
  const state = useOverlayState();
  const confirmState = useOverlayState();
  const [when, setWhen] = useState<"now" | "schedule">("schedule");
  const [runAt, setRunAt] = useState(() =>
    utcToGuayaquilInputValue(new Date(Date.now() + 15 * 60_000)),
  );
  const [policy, setPolicy] = useState<Policy>("forced");
  const [completo, setCompleto] = useState(true);
  const [doGit, setDoGit] = useState(true);
  const [doSync, setDoSync] = useState(true);
  const [doPm2, setDoPm2] = useState(true);
  const [notify, setNotify] = useState(true);
  const [forceLogout, setForceLogout] = useState(false);
  const [targets, setTargets] = useState<TrioId[]>([
    "eddeli",
    "store",
    "tienda",
  ]);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Job[]>([]);

  const deploy = doGit || doSync || doPm2;
  const pm2List = targets.map((t) => pm2NameFor(t)).join(", ");

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/system/joint-update"), {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setPending((data.pending || []) as Job[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (state.isOpen) void loadJobs();
  }, [state.isOpen, loadJobs]);

  useEffect(() => {
    if (completo) {
      setDoGit(true);
      setDoSync(true);
      setDoPm2(true);
    }
  }, [completo]);

  function toggleTarget(id: TrioId) {
    setTargets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function requestSubmit() {
    if (!targets.length) {
      appToast.error("Elegí al menos una app");
      return;
    }
    if (!deploy && !notify) {
      appToast.error("Activá deploy y/o avisar a las apps");
      return;
    }
    confirmState.open();
  }

  async function submitConfirmed() {
    setBusy(true);
    try {
      const steps = { git: doGit, sync: doSync, pm2: doPm2 };
      const body =
        when === "now"
          ? {
              when: "now",
              policy,
              deploy,
              notify,
              forceLogout,
              targets,
              steps,
            }
          : {
              when: "schedule",
              // datetime-local como hora de Guayaquil → ISO UTC
              runAt: guayaquilWallTimeToUtc(runAt).toISOString(),
              policy,
              deploy,
              notify,
              forceLogout,
              targets,
              steps,
            };
      const res = await fetch(apiUrl("/api/system/joint-update"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "No se pudo ejecutar");
      }
      if (data.scheduled) {
        appToast.success("Actualización programada");
      } else {
        appToast.success(
          policy === "forced"
            ? "Actualización forzada iniciada"
            : "Aviso de actualización enviado (con aceptación)",
        );
      }
      await loadJobs();
      confirmState.close();
      if (when === "now") state.close();
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function cancelJob(id: number) {
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/api/system/joint-update"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelJobId: id }),
      });
      if (!res.ok) throw new Error("No se pudo cancelar");
      appToast.success("Programación cancelada");
      await loadJobs();
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  const confirmMsg =
    when === "now"
      ? policy === "forced"
        ? "¿Actualización FORZADA ahora? Los usuarios no podrán seguir usando la app hasta Continuar."
        : "¿Actualización con PERMISO ahora? Se envía el aviso; el deploy (git/sync/pm2) corre cuando el usuario pulse Actualizar ahora."
      : `¿Programar actualización ${
          policy === "forced" ? "forzada" : "con permiso"
        } para ${runAt} (hora Ecuador / Guayaquil)? Las apps verán la cuenta regresiva hasta esa hora.`;

  return (
    <>
      <Modal state={state}>
        <Button
          variant="secondary"
          onPress={() => state.open()}
          className="border border-[var(--gp-border)]"
        >
          <ArrowsRotateRight width={16} height={16} />
          Programar actualización
        </Button>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="flex max-h-[min(92vh,720px)] flex-col sm:max-w-lg">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Programar actualización</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="min-h-0 flex-1 space-y-4 overflow-y-auto text-sm">
                <p className="text-[var(--gp-text-muted)]">
                  Acá programás cuándo y si es{" "}
                  <strong className="text-[var(--gp-text)]">forzada</strong> o{" "}
                  <strong className="text-[var(--gp-text)]">
                    con permiso del usuario
                  </strong>
                  . Para una sola app al momento, usá el ícono de flechas en la
                  fila. Sitio:{" "}
                  <span className="text-[var(--gp-text)]">
                    {PRODUCTION_SITE_URL}
                  </span>
                </p>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]">
                    Cuándo
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={when === "now" ? "primary" : "secondary"}
                      onPress={() => setWhen("now")}
                      style={
                        when === "now"
                          ? {
                              backgroundColor: "var(--gp-primary)",
                              color: "var(--gp-primary-text)",
                            }
                          : undefined
                      }
                    >
                      Manual (ahora)
                    </Button>
                    <Button
                      size="sm"
                      variant={when === "schedule" ? "primary" : "secondary"}
                      onPress={() => setWhen("schedule")}
                      style={
                        when === "schedule"
                          ? {
                              backgroundColor: "var(--gp-primary)",
                              color: "var(--gp-primary-text)",
                            }
                          : undefined
                      }
                    >
                      <Clock width={14} height={14} />
                      Programar
                    </Button>
                  </div>
                  {when === "schedule" ? (
                    <div className="mt-1 space-y-1">
                      <input
                        type="datetime-local"
                        value={runAt}
                        onChange={(e) => setRunAt(e.target.value)}
                        className="gp-input w-full rounded-lg border border-[var(--gp-border)] bg-[var(--gp-surface)] px-3 py-2 text-sm"
                      />
                      <p className="text-[11px] text-[var(--gp-text-muted)]">
                        Hora de Ecuador (America/Guayaquil, UTC−5).
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]">
                    Permiso del usuario
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={policy === "forced" ? "primary" : "secondary"}
                      onPress={() => setPolicy("forced")}
                      style={
                        policy === "forced"
                          ? {
                              backgroundColor: "var(--gp-primary)",
                              color: "var(--gp-primary-text)",
                            }
                          : undefined
                      }
                    >
                      Forzada
                    </Button>
                    <Button
                      size="sm"
                      variant={policy === "optional" ? "primary" : "secondary"}
                      onPress={() => setPolicy("optional")}
                      style={
                        policy === "optional"
                          ? {
                              backgroundColor: "var(--gp-primary)",
                              color: "var(--gp-primary-text)",
                            }
                          : undefined
                      }
                    >
                      Con permiso del usuario
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]">
                    Apps
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {TRIO_OPTS.map((t) => {
                      const on = targets.includes(t.id);
                      return (
                        <Button
                          key={t.id}
                          size="sm"
                          variant={on ? "primary" : "secondary"}
                          onPress={() => toggleTarget(t.id)}
                          style={
                            on
                              ? {
                                  backgroundColor: "var(--gp-primary)",
                                  color: "var(--gp-primary-text)",
                                }
                              : undefined
                          }
                        >
                          {t.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-[var(--gp-border)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--gp-text)]">
                        Actualización completa
                      </p>
                      <p className="text-xs text-[var(--gp-text-muted)]">
                        Git + db:sync + pm2 ({pm2List || "—"})
                      </p>
                    </div>
                    <Switch
                      isSelected={completo}
                      onChange={setCompleto}
                    >
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Content>
                    </Switch>
                  </div>

                  <div className="space-y-2 border-t border-[var(--gp-border)] pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]">
                      Pasos (individual)
                    </p>
                    {(
                      [
                        {
                          key: "git",
                          label: "Bajar git (pull)",
                          on: doGit,
                          set: setDoGit,
                        },
                        {
                          key: "sync",
                          label: "Sincronizar BD (db:sync)",
                          on: doSync,
                          set: setDoSync,
                        },
                        {
                          key: "pm2",
                          label: `Reiniciar PM2 (${pm2List || "—"})`,
                          on: doPm2,
                          set: setDoPm2,
                        },
                      ] as const
                    ).map((row) => (
                      <div
                        key={row.key}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-[var(--gp-text)]">{row.label}</span>
                        <Switch
                          isSelected={row.on}
                          isDisabled={completo}
                          onChange={(v) => {
                            row.set(v);
                            setCompleto(false);
                          }}
                        >
                          <Switch.Content>
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                          </Switch.Content>
                        </Switch>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-[var(--gp-border)] pt-3">
                    <div>
                      <p className="font-medium text-[var(--gp-text)]">
                        Avisar a las apps
                      </p>
                      <p className="text-xs text-[var(--gp-text-muted)]">
                        Empuja entitlement (forzada / con permiso)
                      </p>
                    </div>
                    <Switch isSelected={notify} onChange={setNotify}>
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Content>
                    </Switch>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-[var(--gp-border)] pt-3">
                    <div>
                      <p className="font-medium text-[var(--gp-text)]">
                        Cerrar sesión forzosamente
                      </p>
                      <p className="text-xs text-[var(--gp-text-muted)]">
                        Activo = limpia el token al Continuar. Apagado = se
                        mantiene la sesión.
                      </p>
                    </div>
                    <Switch
                      isSelected={forceLogout}
                      onChange={setForceLogout}
                    >
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Content>
                    </Switch>
                  </div>
                </div>

                {pending.length ? (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]">
                      Programadas
                    </Label>
                    <ul className="space-y-2">
                      {pending.map((j) => (
                        <li
                          key={j.id}
                          className="flex items-center justify-between gap-2 rounded-md border border-[var(--gp-border)] px-2 py-1.5 text-xs"
                        >
                          <span>
                            #{j.id} · {formatGuayaquil(j.run_at)} (Guayaquil) ·{" "}
                            {j.policy === "forced" ? "forzada" : "permiso"}
                            {j.deploy ? " · deploy" : ""}
                            {j.notify ? " · aviso" : ""}
                          </span>
                          {j.status === "pending" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              isDisabled={busy}
                              onPress={() => void cancelJob(j.id)}
                            >
                              Cancelar
                            </Button>
                          ) : (
                            <span className="text-[var(--gp-text-muted)]">
                              {j.status}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onPress={() => state.close()}
                  isDisabled={busy}
                >
                  Cerrar
                </Button>
                <Button
                  isDisabled={busy}
                  onPress={requestSubmit}
                  style={{
                    backgroundColor: "var(--gp-primary)",
                    color: "var(--gp-primary-text)",
                  }}
                >
                  {when === "now" ? "Ejecutar ahora" : "Programar"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <ConfirmModal
        state={confirmState}
        title={when === "now" ? "Confirmar actualización" : "Confirmar programación"}
        message={confirmMsg}
        confirmLabel={when === "now" ? "Ejecutar" : "Programar"}
        busy={busy}
        onConfirm={submitConfirmed}
      />
    </>
  );
}
