"use client";

import { Button, Modal, useOverlayState } from "@heroui/react";
import Copy from "@gravity-ui/icons/Copy";
import type { EventRecord } from "@/src/features/events/types";
import { StatusBadge } from "@/src/shared/components/StatusBadge";
import { gp } from "@/src/shared/ui/theme";
import { appToast } from "@/src/shared/utils/app-toast";
import {
  eventOutcomeTone,
  formatEventDateTime,
  sourceLabel,
} from "../lib/event-display";

type EventDetailModalProps = {
  event: EventRecord | null;
  appName?: string;
  state: ReturnType<typeof useOverlayState>;
};

export function EventDetailModal({ event, appName, state }: EventDetailModalProps) {
  async function copyMetadata() {
    if (!event?.metadata) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(event.metadata, null, 2));
      appToast.success("Metadata copiada");
    } catch {
      appToast.error("No se pudo copiar");
    }
  }

  const tone = event ? eventOutcomeTone(event) : "neutral";

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                Evento #{event?.id ?? "—"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {event && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={tone === "danger" ? "Fallido" : "OK"}
                      tone={tone === "danger" ? "danger" : "success"}
                    />
                    <StatusBadge label={sourceLabel(event.source)} tone="info" />
                    {event.type?.key && (
                      <span className="rounded-md bg-[var(--gp-elevated)] px-2 py-0.5 font-mono text-xs text-[var(--gp-text-muted)]">
                        {event.type.key}
                      </span>
                    )}
                  </div>

                  <p className="text-base font-semibold text-[var(--gp-text)]">{event.name}</p>

                  <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-lg bg-[var(--gp-elevated)] px-3 py-2.5">
                      <dt className="text-xs text-[var(--gp-text-muted)]">Tipo</dt>
                      <dd className="mt-0.5 font-medium">{event.type?.name ?? "—"}</dd>
                    </div>
                    <div className="rounded-lg bg-[var(--gp-elevated)] px-3 py-2.5">
                      <dt className="text-xs text-[var(--gp-text-muted)]">Aplicación</dt>
                      <dd className="mt-0.5 font-medium">{appName ?? `App #${event.app_id}`}</dd>
                    </div>
                    <div className="rounded-lg bg-[var(--gp-elevated)] px-3 py-2.5 sm:col-span-2">
                      <dt className="text-xs text-[var(--gp-text-muted)]">Fecha</dt>
                      <dd className="mt-0.5 font-medium">{formatEventDateTime(event.created_at)}</dd>
                    </div>
                  </dl>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]">
                        Metadata
                      </p>
                      {event.metadata && (
                        <Button size="sm" variant="ghost" onPress={copyMetadata}>
                          <Copy width={14} height={14} />
                          Copiar
                        </Button>
                      )}
                    </div>
                    <pre className={`${gp.card} max-h-64 overflow-auto p-3 font-mono text-xs whitespace-pre-wrap break-all text-[var(--gp-text)]`}>
                      {event.metadata ? JSON.stringify(event.metadata, null, 2) : "—"}
                    </pre>
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" slot="close">
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
