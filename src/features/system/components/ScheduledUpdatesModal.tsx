"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Label,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import Calendar from "@gravity-ui/icons/Calendar";
import { ConfirmModal } from "@/src/features/system/components/ConfirmModal";
import {
  formatGuayaquil,
  guayaquilWallTimeToUtc,
  utcToGuayaquilInputValue,
} from "@/src/features/system/lib/guayaquil-time";
import { TRIO_IDS, trioLabel, type TrioId } from "@/src/features/system/lib/trio-apps";
import { apiUrl } from "@/src/utils/apiUrl";
import { appToast } from "@/src/shared/utils/app-toast";

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

function appsLabel(targets: unknown): string {
  const list = Array.isArray(targets)
    ? targets
    : targets &&
        typeof targets === "object" &&
        Array.isArray((targets as { apps?: unknown }).apps)
      ? (targets as { apps: unknown[] }).apps
      : [];
  const ids = list
    .map((x) => String(x).toLowerCase())
    .filter((x): x is TrioId => TRIO_IDS.includes(x as TrioId));
  if (!ids.length) return "—";
  return ids.map((id) => trioLabel(id)).join(", ");
}

export function ScheduledUpdatesModal() {
  const state = useOverlayState();
  const cancelConfirm = useOverlayState();
  const [pending, setPending] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [rescheduleAt, setRescheduleAt] = useState(() =>
    utcToGuayaquilInputValue(new Date(Date.now() + 15 * 60_000)),
  );

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/system/joint-update"), {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        const list = ((data.pending || []) as Job[]).filter(
          (j) => j.status === "pending" || j.status === "running",
        );
        setPending(list);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (state.isOpen) void loadJobs();
  }, [state.isOpen, loadJobs]);

  // Badge count also when closed: soft poll on mount
  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

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
      setCancelId(null);
      cancelConfirm.close();
      setRescheduleId(null);
      await loadJobs();
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function rescheduleJob() {
    if (rescheduleId == null) return;
    const utc = guayaquilWallTimeToUtc(rescheduleAt);
    if (Number.isNaN(utc.getTime()) || utc.getTime() < Date.now() - 60_000) {
      appToast.error("Elegí una fecha/hora válida (Guayaquil)");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/api/system/joint-update"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rescheduleJobId: rescheduleId,
          runAt: utc.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "No se pudo reprogramar");
      }
      appToast.success(
        `Reprogramada para ${formatGuayaquil(utc)} (Guayaquil)`,
      );
      setRescheduleId(null);
      await loadJobs();
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  const count = pending.filter((j) => j.status === "pending").length;

  return (
    <>
      <Modal state={state}>
        <Button
          variant="secondary"
          onPress={() => state.open()}
          className="border border-[var(--gp-border)]"
        >
          <Calendar width={16} height={16} />
          Programadas
          {count > 0 ? (
            <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500/90 px-1.5 text-[11px] font-bold text-black">
              {count}
            </span>
          ) : null}
        </Button>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="flex max-h-[min(92vh,720px)] flex-col sm:max-w-lg">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Actualizaciones programadas</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="min-h-0 flex-1 space-y-3 overflow-y-auto text-sm">
                <p className="text-[var(--gp-text-muted)]">
                  Acá ves lo pendiente, podés{" "}
                  <strong className="text-[var(--gp-text)]">cancelar</strong> o{" "}
                  <strong className="text-[var(--gp-text)]">reprogramar</strong>{" "}
                  (hora Ecuador / Guayaquil).
                </p>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={loading || busy}
                    onPress={() => void loadJobs()}
                  >
                    {loading ? <Spinner size="sm" /> : "Refrescar"}
                  </Button>
                </div>

                {!pending.length && !loading ? (
                  <div className="rounded-lg border border-[var(--gp-border)] px-3 py-6 text-center text-[var(--gp-text-muted)]">
                    No hay actualizaciones programadas.
                  </div>
                ) : null}

                <ul className="space-y-3">
                  {pending.map((j) => (
                    <li
                      key={j.id}
                      className="space-y-2 rounded-lg border border-[var(--gp-border)] p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-[var(--gp-text)]">
                            #{j.id} ·{" "}
                            {j.policy === "forced" ? "Forzada" : "Con permiso"}
                            {j.status === "running" ? " · ejecutando…" : ""}
                          </p>
                          <p className="text-xs text-[var(--gp-text-muted)]">
                            {formatGuayaquil(j.run_at)} (Guayaquil)
                          </p>
                          <p className="text-xs text-[var(--gp-text-muted)]">
                            Apps: {appsLabel(j.targets)}
                            {j.deploy ? " · deploy" : ""}
                            {j.notify ? " · aviso" : ""}
                          </p>
                        </div>
                        {j.status === "pending" ? (
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              size="sm"
                              variant="secondary"
                              isDisabled={busy}
                              onPress={() => {
                                setRescheduleId(j.id);
                                setRescheduleAt(
                                  utcToGuayaquilInputValue(j.run_at),
                                );
                              }}
                            >
                              Reprogramar
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              isDisabled={busy}
                              onPress={() => {
                                setCancelId(j.id);
                                cancelConfirm.open();
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--gp-text-muted)]">
                            {j.status}
                          </span>
                        )}
                      </div>

                      {rescheduleId === j.id ? (
                        <div className="space-y-2 rounded-md border border-[var(--gp-border)] bg-[var(--gp-surface)] p-2">
                          <Label className="text-xs font-semibold text-[var(--gp-text-muted)]">
                            Nueva hora (Guayaquil)
                          </Label>
                          <input
                            type="datetime-local"
                            value={rescheduleAt}
                            onChange={(e) => setRescheduleAt(e.target.value)}
                            className="gp-input w-full rounded-lg border border-[var(--gp-border)] bg-[var(--gp-surface)] px-3 py-2 text-sm"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              isDisabled={busy}
                              onPress={() => setRescheduleId(null)}
                            >
                              Cerrar
                            </Button>
                            <Button
                              size="sm"
                              isDisabled={busy}
                              onPress={() => void rescheduleJob()}
                              style={{
                                backgroundColor: "var(--gp-primary)",
                                color: "var(--gp-primary-text)",
                              }}
                            >
                              Guardar nueva hora
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Modal.Body>
              <Modal.Footer className="flex justify-end">
                <Button
                  variant="secondary"
                  onPress={() => state.close()}
                  isDisabled={busy}
                >
                  Cerrar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <ConfirmModal
        state={cancelConfirm}
        title="Cancelar programación"
        message={
          cancelId != null
            ? `¿Cancelar la actualización programada #${cancelId}? Las apps dejarán de ver el countdown.`
            : "¿Cancelar?"
        }
        confirmLabel="Cancelar programación"
        busy={busy}
        onConfirm={() => {
          if (cancelId != null) void cancelJob(cancelId);
        }}
      />
    </>
  );
}
