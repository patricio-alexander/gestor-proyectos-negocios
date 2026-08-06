"use client";

import { useEffect, useState } from "react";
import { Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import Sliders from "@gravity-ui/icons/Sliders";
import type { App } from "../types";
import type { LifecycleStatus } from "@/src/features/modules/types";
import {
  LIFECYCLE_STATUS_LABELS,
  LIFECYCLE_STATUS_OPTIONS,
  normalizeLifecycleStatus,
} from "@/src/features/modules/types";
import { LIFECYCLE_STATUS_STYLE } from "@/src/features/modules/components/LifecycleStatusSelect";
import { fetchJson } from "@/src/shared/lib/api-client";
import { appToast } from "@/src/shared/utils/app-toast";

type FeatureRow = {
  id: number;
  key: string;
  name: string;
  description: string | null;
  global_status: LifecycleStatus;
  status: LifecycleStatus | null;
  effective_status: LifecycleStatus;
};

type AppFeaturesModalProps = {
  app: App | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

const INHERIT = "__inherit__";

export function AppFeaturesModal({
  app,
  onClose,
  onSaved,
}: AppFeaturesModalProps) {
  const [rows, setRows] = useState<FeatureRow[]>([]);
  const [overrides, setOverrides] = useState<Map<number, LifecycleStatus | null>>(
    new Map(),
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const modal = useOverlayState({
    isOpen: Boolean(app),
    onOpenChange: (open) => {
      if (!open) onClose();
    },
  });

  useEffect(() => {
    if (!app) {
      setRows([]);
      setOverrides(new Map());
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const data = await fetchJson<{ features: FeatureRow[] }>(
          `/api/apps/${app.id}/features`,
        );
        if (cancelled) return;
        setRows(data.features);
        setOverrides(
          new Map(data.features.map((f) => [f.id, f.status ?? null])),
        );
      } catch (err) {
        if (!cancelled) {
          appToast.error(
            err instanceof Error ? err.message : "Error al cargar funciones",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [app]);

  async function handleSave() {
    if (!app) return;
    setSubmitting(true);
    try {
      const result = await fetchJson<{
        ok?: boolean;
        push_ok?: boolean;
        push_skipped?: boolean;
        push_error?: string | null;
      }>(`/api/apps/${app.id}/features`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          features: [...overrides.entries()].map(([feature_id, status]) => ({
            feature_id,
            status,
          })),
        }),
      });
      await onSaved();
      const pushNote =
        result.push_skipped
          ? " (sync omitido)"
          : result.push_ok === false
            ? ` (sync: ${result.push_error || "falló"})`
            : result.push_ok
              ? " · sync OK"
              : "";
      onClose();
      // Toast después de cerrar el modal evita InvalidStateError de HeroUI.
      queueMicrotask(() => {
        appToast.success(`Funciones actualizadas${pushNote}`);
      });
    } catch (err) {
      appToast.error(
        err instanceof Error ? err.message : "Error al guardar funciones",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!app) return null;

  return (
    <Modal state={modal}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading className="inline-flex items-center gap-2">
                <Sliders width={18} height={18} />
                Funciones · {app.name || "App"}
              </Modal.Heading>
              <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
                Desbloqueá o bloqueá opciones de producto (no las enciende solas).
                En uso = el cliente puede activarla; próximamente / mantenimiento =
                visible pero bloqueada; oculto = no se muestra.
              </p>
            </Modal.Header>
            <Modal.Body className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Spinner size="sm" />
                </div>
              ) : rows.length === 0 ? (
                <p className="text-sm text-[var(--gp-text-muted)]">
                  No hay funciones en el catálogo.
                </p>
              ) : (
                <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                  {rows.map((f) => {
                    const override = overrides.has(f.id)
                      ? overrides.get(f.id) ?? null
                      : null;
                    const effective = normalizeLifecycleStatus(
                      override ?? f.global_status,
                    );
                    const style = LIFECYCLE_STATUS_STYLE[effective];
                    const selectValue = override ?? INHERIT;
                    return (
                      <div
                        key={f.id}
                        className="rounded-xl border border-[var(--gp-border)] px-3 py-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[var(--gp-text)]">
                              {f.name}
                            </p>
                            <p className="mt-0.5 font-mono text-[10px] text-[var(--gp-text-faint)]">
                              {f.key}
                            </p>
                            {f.description ? (
                              <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
                                {f.description}
                              </p>
                            ) : null}
                            <p className="mt-2 text-[10px] text-[var(--gp-text-muted)]">
                              Catálogo:{" "}
                              {LIFECYCLE_STATUS_LABELS[
                                normalizeLifecycleStatus(f.global_status)
                              ]}
                              {" · "}
                              Efectivo:{" "}
                              <span
                                className={`inline-flex rounded px-1.5 py-0.5 font-semibold ${style.chip}`}
                              >
                                {LIFECYCLE_STATUS_LABELS[effective]}
                              </span>
                            </p>
                          </div>
                          {/* Native select: evita InvalidStateError de Select+Modal HeroUI */}
                          <select
                            aria-label={`Estado de ${f.name}`}
                            value={selectValue}
                            disabled={submitting}
                            className={`min-w-[148px] rounded-lg border px-2 py-1.5 text-xs font-semibold ${
                              override
                                ? style.chip
                                : "border-[var(--gp-input-border)] bg-[var(--gp-input-bg)] text-[var(--gp-text-muted)]"
                            }`}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const next =
                                raw === INHERIT || raw === ""
                                  ? null
                                  : normalizeLifecycleStatus(raw);
                              setOverrides((prev) => {
                                const map = new Map(prev);
                                map.set(f.id, next);
                                return map;
                              });
                            }}
                          >
                            <option value={INHERIT}>
                              ↳{" "}
                              {
                                LIFECYCLE_STATUS_LABELS[
                                  normalizeLifecycleStatus(f.global_status)
                                ]
                              }
                            </option>
                            {LIFECYCLE_STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {LIFECYCLE_STATUS_LABELS[option]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" slot="close" isDisabled={submitting}>
                Cancelar
              </Button>
              <Button
                onPress={() => void handleSave()}
                isDisabled={submitting || loading || rows.length === 0}
              >
                {submitting ? <Spinner size="sm" /> : "Guardar y sincronizar"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
