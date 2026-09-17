"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import type { App } from "../types";
import { useCatalog } from "@/src/features/catalog/hooks/useCatalog";
import { gp } from "@/src/shared/ui/theme";
import { appToast } from "@/src/shared/utils/app-toast";

type AppModulesModalProps = {
  app: App | null;
  onClose: () => void;
  onSave: (appId: number, moduleIds: number[]) => Promise<void>;
};

/** 6 columnas hasta ~36 módulos; 7 si hay más (cuadrícula tipo 6×6 / 7×7). */
function moduleGridClass(count: number): string {
  return count > 36 ? "grid-cols-7" : "grid-cols-6";
}

export function AppModulesModal({ app, onClose, onSave }: AppModulesModalProps) {
  const { modules: catalogModules, loading: catalogLoading } = useCatalog();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const modal = useOverlayState({
    isOpen: Boolean(app),
    onOpenChange: (open) => {
      if (!open) onClose();
    },
  });

  useEffect(() => {
    if (!app) return;
    setSelectedIds(new Set((app.modules ?? []).map((m) => m.id)));
  }, [app]);

  const sortedModules = useMemo(
    () => [...catalogModules].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [catalogModules],
  );

  const gridClass = useMemo(
    () => moduleGridClass(sortedModules.length),
    [sortedModules.length],
  );

  function toggleModule(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!app) return;
    setSubmitting(true);
    try {
      await onSave(app.id, [...selectedIds]);
      onClose();
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al guardar módulos");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal state={modal}>
      <Modal.Backdrop>
        <Modal.Container className="w-[min(96vw,80rem)] max-w-none">
          <Modal.Dialog className="w-full">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Módulos · {app?.name || "App"}</Modal.Heading>
              <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
                Tocá cada tarjeta para incluir o quitar el módulo en esta app.
              </p>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
                style={{ borderColor: "var(--gp-border)" }}
              >
                <p className="font-medium text-[var(--gp-text)]">
                  {selectedIds.size}{" "}
                  {selectedIds.size === 1
                    ? "módulo seleccionado"
                    : "módulos seleccionados"}
                  <span className="ml-2 font-normal text-[var(--gp-text-muted)]">
                    · {sortedModules.length} en catálogo
                  </span>
                </p>
                <p className="text-xs text-[var(--gp-text-muted)]">
                  Solo los marcados entran en planes y entitlement.
                </p>
              </div>

              {catalogLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="sm" />
                </div>
              ) : sortedModules.length === 0 ? (
                <p className="text-sm text-[var(--gp-text-muted)]">
                  No hay módulos en el catálogo.
                </p>
              ) : (
                <div className={`grid gap-2 ${gridClass}`}>
                  {sortedModules.map((mod) => {
                    const selected = selectedIds.has(mod.id);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => toggleModule(mod.id)}
                        title={mod.name}
                        aria-pressed={selected}
                        className={`relative flex min-h-[5.5rem] flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition-colors ${
                          selected
                            ? "border-[var(--gp-primary)]/50 bg-[color-mix(in_srgb,var(--gp-primary)_14%,transparent)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--gp-primary)_25%,transparent)]"
                            : "border-[var(--gp-border)] bg-[var(--gp-surface-muted)]/30 hover:border-[var(--gp-primary)]/25 hover:bg-[var(--gp-surface-muted)]/60"
                        }`}
                      >
                        {selected ? (
                          <CircleCheck
                            width={14}
                            height={14}
                            className="absolute right-1.5 top-1.5 text-[var(--gp-primary)]"
                          />
                        ) : null}
                        <span className={gp.iconBoxSm}>
                          <Cubes3Overlap width={14} height={14} />
                        </span>
                        <span className="line-clamp-2 text-[11px] font-medium leading-snug text-[var(--gp-text)]">
                          {mod.name}
                        </span>
                        {mod.is_trial ? (
                          <span className="text-[9px] font-medium text-sky-600 dark:text-sky-300">
                            Trial
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" slot="close">
                Cancelar
              </Button>
              <Button isDisabled={submitting || !app} onPress={() => void handleSave()}>
                {submitting ? <Spinner size="sm" /> : "Guardar módulos"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
