"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import type { App } from "../types";
import { useCatalog } from "@/src/features/catalog/hooks/useCatalog";
import { gp } from "@/src/shared/ui/theme";
import { appToast } from "@/src/shared/utils/app-toast";

type AppModulesModalProps = {
  app: App | null;
  onClose: () => void;
  onSave: (appId: number, moduleIds: number[]) => Promise<void>;
};

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
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-lg">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Módulos · {app?.name || "App"}</Modal.Heading>
              <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
                Elegí qué módulos del catálogo global estarán disponibles en
                esta aplicación.
              </p>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              <div
                className="rounded-xl border px-4 py-3 text-sm"
                style={{ borderColor: "var(--gp-border)" }}
              >
                <p className="font-medium text-[var(--gp-text)]">
                  {selectedIds.size}{" "}
                  {selectedIds.size === 1
                    ? "módulo seleccionado"
                    : "módulos seleccionados"}
                </p>
                <p className="mt-0.5 text-xs text-[var(--gp-text-muted)]">
                  Solo los módulos marcados podrán usarse en planes y
                  entitlement de esta app.
                </p>
              </div>

              {catalogLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner size="sm" />
                </div>
              ) : sortedModules.length === 0 ? (
                <p className="text-sm text-[var(--gp-text-muted)]">
                  No hay módulos en el catálogo.
                </p>
              ) : (
                <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                  {sortedModules.map((mod) => (
                    <label
                      key={mod.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                        selectedIds.has(mod.id)
                          ? "border-[var(--gp-primary)]/40 bg-[color-mix(in_srgb,var(--gp-primary)_12%,transparent)]"
                          : "border-[var(--gp-border)] hover:bg-[var(--gp-surface-muted)]/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(mod.id)}
                        onChange={() => toggleModule(mod.id)}
                        className="size-4 rounded border-[var(--gp-input-border)]"
                      />
                      <div className={gp.iconBoxSm}>
                        <Cubes3Overlap width={14} height={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--gp-text)]">
                          {mod.name}
                        </p>
                        {mod.is_trial ? (
                          <p className="text-[10px] font-medium text-sky-600 dark:text-sky-300">
                            Trial disponible
                          </p>
                        ) : null}
                      </div>
                    </label>
                  ))}
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
