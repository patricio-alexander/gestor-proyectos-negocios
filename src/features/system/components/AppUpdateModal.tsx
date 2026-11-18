"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Label,
  Modal,
  Spinner,
  Switch,
  useOverlayState,
} from "@heroui/react";
import { pm2NameFor } from "@/src/features/system/lib/pm2-names";
import { trioLabel, type TrioId } from "@/src/features/system/lib/trio-apps";
import { apiUrl } from "@/src/utils/apiUrl";
import { appToast } from "@/src/shared/utils/app-toast";

export type UpdatePolicy = "forced" | "optional";

export type AppUpdateSubmit = {
  policy: UpdatePolicy;
  notify: boolean;
  deploy: boolean;
  forceLogout: boolean;
  steps: { git: boolean; sync: boolean; pm2: boolean };
};

type OverlayState = ReturnType<typeof useOverlayState>;

type Props = {
  state: OverlayState;
  targets: TrioId[];
  title?: string;
  onConfirm: (opts: AppUpdateSubmit) => void | Promise<void>;
};

export function AppUpdateModal({ state, targets, title, onConfirm }: Props) {
  const [policy, setPolicy] = useState<UpdatePolicy>("forced");
  const [completo, setCompleto] = useState(true);
  const [doGit, setDoGit] = useState(true);
  const [doSync, setDoSync] = useState(true);
  const [doPm2, setDoPm2] = useState(true);
  const [notify, setNotify] = useState(true);
  const [forceLogout, setForceLogout] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!state.isOpen) return;
    setPolicy("forced");
    setCompleto(true);
    setDoGit(true);
    setDoSync(true);
    setDoPm2(true);
    setNotify(true);
    setForceLogout(false);
  }, [state.isOpen, targets.join(",")]);

  useEffect(() => {
    if (completo) {
      setDoGit(true);
      setDoSync(true);
      setDoPm2(true);
    }
  }, [completo]);

  const labels = targets.map((t) => trioLabel(t)).join(", ");
  const pm2List = targets.map((t) => pm2NameFor(t)).join(", ");
  const isMulti = targets.length > 1;
  const disabled = running;

  async function submit() {
    if (!targets.length) {
      appToast.error("No hay apps destino");
      return;
    }
    if (!notify && !doGit && !doSync && !doPm2) {
      appToast.error("Elegí al menos avisar a la app o un paso de deploy");
      return;
    }
    setRunning(true);
    try {
      await onConfirm({
        policy,
        notify,
        deploy: doGit || doSync || doPm2,
        forceLogout,
        steps: { git: doGit, sync: doSync, pm2: doPm2 },
      });
      state.close();
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!disabled}>
        <Modal.Container>
          <Modal.Dialog className="flex max-h-[min(92vh,720px)] flex-col sm:max-w-lg">
            {!disabled ? <Modal.CloseTrigger /> : null}
            <Modal.Header>
              <Modal.Heading>
                {title ||
                  (isMulti ? "Actualizar apps" : `Actualizar ${labels || "app"}`)}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="min-h-0 flex-1 space-y-4 overflow-y-auto text-sm">
              <p className="text-[var(--gp-text-muted)]">
                Destino:{" "}
                <strong className="text-[var(--gp-text)]">
                  {labels || "—"}
                </strong>
                {targets.length
                  ? ` · PM2: ${isMulti ? pm2List : pm2NameFor(targets[0])}`
                  : null}
              </p>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]">
                  Permiso del usuario
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={policy === "forced" ? "primary" : "secondary"}
                    isDisabled={disabled}
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
                    isDisabled={disabled}
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
                <p className="text-xs text-[var(--gp-text-muted)]">
                  {policy === "forced"
                    ? "Bloquea la app con barra de progreso hasta Continuar."
                    : "Modal en la app: Actualizar ahora o Más tarde."}
                </p>
              </div>

              <div className="space-y-3 rounded-lg border border-[var(--gp-border)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--gp-text)]">
                      Actualización completa
                    </p>
                    <p className="text-xs text-[var(--gp-text-muted)]">
                      Git pull + db:sync + pm2 restart
                      {isMulti ? " (cada backend)" : ""}
                    </p>
                  </div>
                  <Switch
                    isSelected={completo}
                    isDisabled={disabled}
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
                    Pasos
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
                        label: targets.length
                          ? isMulti
                            ? `Reiniciar PM2 (${pm2List})`
                            : `Reiniciar PM2 (${pm2NameFor(targets[0])})`
                          : "Reiniciar PM2",
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
                        isDisabled={disabled || completo}
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
                      Avisar a la app
                    </p>
                    <p className="text-xs text-[var(--gp-text-muted)]">
                      Empuja entitlement (forzada / con aceptación)
                    </p>
                  </div>
                  <Switch
                    isSelected={notify}
                    isDisabled={disabled}
                    onChange={setNotify}
                  >
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
                      Si está activo, al Continuar se limpia el token. Si no, se
                      mantiene la sesión iniciada.
                    </p>
                  </div>
                  <Switch
                    isSelected={forceLogout}
                    isDisabled={disabled}
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
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button
                variant="secondary"
                isDisabled={disabled}
                onPress={() => state.close()}
              >
                Cancelar
              </Button>
              <Button
                isDisabled={disabled}
                onPress={() => void submit()}
                style={{
                  backgroundColor: "var(--gp-primary)",
                  color: "var(--gp-primary-text)",
                }}
              >
                {disabled ? <Spinner size="sm" /> : "Ejecutar"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export async function runJointUpdateNow(opts: {
  targets: TrioId[];
  policy: UpdatePolicy;
  notify: boolean;
  deploy: boolean;
  forceLogout?: boolean;
  steps: { git: boolean; sync: boolean; pm2: boolean };
}) {
  const res = await fetch(apiUrl("/api/system/joint-update"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      when: "now",
      policy: opts.policy,
      notify: opts.notify,
      deploy: opts.deploy,
      forceLogout: Boolean(opts.forceLogout),
      targets: opts.targets,
      steps: opts.steps,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || "No se pudo ejecutar la actualización");
  }
  return data;
}
