"use client";

import type { ReactNode } from "react";
import type { LifecycleStatus } from "@/src/features/modules/types";
import {
  LIFECYCLE_STATUS_LABELS,
  normalizeLifecycleStatus,
} from "@/src/features/modules/types";
import { LIFECYCLE_STATUS_STYLE } from "@/src/features/modules/components/LifecycleStatusSelect";

export function KanbanHintLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--gp-text-muted)]">
      <span>
        <span className="font-medium text-[var(--gp-text)]">≡</span> arrastrar
      </span>
      <span>
        <span className="font-medium text-[var(--gp-text)]">Catálogo</span> ·
        estado global
      </span>
      <span>
        <span className="font-medium text-[var(--gp-text)]">App</span> · override
        por app
      </span>
      <span>
        <span className="font-medium text-[var(--gp-text)]">✕</span> quitar de
        app
      </span>
      <span>
        <span className="font-medium text-[var(--gp-text)]">Hover app</span> ·
        solo faltantes en catálogo
      </span>
    </div>
  );
}

export function KanbanFieldLabel({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <span
      className="w-14 shrink-0 text-[9px] font-semibold uppercase leading-tight tracking-wide text-[var(--gp-text-faint)]"
      title={title}
    >
      {children}
    </span>
  );
}

export function KanbanEffectivePill({
  status,
  compact = false,
}: {
  status: LifecycleStatus;
  compact?: boolean;
}) {
  const normalized = normalizeLifecycleStatus(status);
  const style = LIFECYCLE_STATUS_STYLE[normalized];
  const label = LIFECYCLE_STATUS_LABELS[normalized];

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded border px-1 py-px font-medium ${style.chip} ${
        compact ? "text-[9px]" : "text-[10px]"
      }`}
      title={`Efectivo: ${label}`}
    >
      <span className={`size-1.5 shrink-0 rounded-full ${style.dot}`} />
      <span className="truncate">{compact ? label.split(" ")[0] : label}</span>
    </span>
  );
}

export function KanbanAssignedDot({ assigned }: { assigned: boolean }) {
  return (
    <span
      className={`size-1.5 shrink-0 rounded-full ${
        assigned ? "bg-[var(--accent)]" : "bg-[var(--gp-text-faint)]/40"
      }`}
      title={assigned ? "Activa en esta app" : "Inactiva · arrastrá a otra app"}
    />
  );
}
