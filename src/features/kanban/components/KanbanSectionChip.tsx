"use client";

import { useDraggable } from "@dnd-kit/core";
import Bars from "@gravity-ui/icons/Bars";
import { LifecycleStatusSelect } from "@/src/features/modules/components/LifecycleStatusSelect";
import { LifecycleStatusInheritSelect } from "@/src/features/modules/components/LifecycleStatusInheritSelect";
import type { KanbanBoardActions, KanbanSection } from "../types";
import { sectionDraggableId, type KanbanColumnKey } from "./kanban-dnd";
import {
  KanbanAssignedDot,
  KanbanEffectivePill,
  KanbanFieldLabel,
} from "./kanban-ui";

type KanbanSectionChipProps = {
  section: KanbanSection;
  moduleId: number;
  columnKey: KanbanColumnKey;
  isCatalog?: boolean;
  appId?: number;
  actions?: KanbanBoardActions;
  sectionInheritLabel?: string;
  disabled?: boolean;
  overlay?: boolean;
};

export function KanbanSectionChip({
  section,
  moduleId,
  columnKey,
  isCatalog = false,
  appId,
  actions,
  sectionInheritLabel = "",
  disabled = false,
  overlay = false,
}: KanbanSectionChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: sectionDraggableId(section.id, moduleId, columnKey),
      disabled: disabled || overlay,
      data: {
        type: "section",
        sectionId: section.id,
        moduleId,
        columnKey,
      },
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const globalBusyKey = `global-sec-${section.id}`;
  const appBusyKey =
    appId != null ? `app-sec-${section.id}-${appId}` : null;

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      className={`rounded border px-1.5 py-1 ${
        section.assigned
          ? "border-[var(--accent)]/35 bg-[var(--accent)]/8"
          : "border-[var(--gp-border)] bg-[var(--gp-surface)]"
      } ${isDragging && !overlay ? "opacity-40" : ""} ${
        overlay ? "shadow-md ring-1 ring-[var(--accent)]" : ""
      }`}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="shrink-0 cursor-grab rounded p-px text-[var(--gp-text-muted)] active:cursor-grabbing hover:bg-[var(--gp-surface-muted)]"
          aria-label={`Arrastrar ${section.name}`}
          title="Arrastrar sección"
          {...(disabled || overlay ? {} : { ...listeners, ...attributes })}
          disabled={disabled || overlay}
        >
          <Bars width={10} height={10} />
        </button>

        <KanbanAssignedDot assigned={section.assigned} />

        <span
          className="min-w-0 flex-1 truncate text-[11px] leading-tight text-[var(--gp-text)]"
          title={section.name}
        >
          {section.name}
        </span>

        {!isCatalog && appId != null ? (
          <KanbanEffectivePill status={section.effectiveStatus} compact />
        ) : null}
      </div>

      <div
        className="mt-1 flex items-center gap-1.5 pl-4"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <KanbanFieldLabel title={isCatalog ? "Estado global" : "Override en app"}>
          {isCatalog ? "Global" : "App"}
        </KanbanFieldLabel>
        <div className="min-w-0 flex-1">
          {actions ? (
            isCatalog ? (
              <LifecycleStatusSelect
                value={section.globalStatus}
                busy={actions.busyKey === globalBusyKey}
                aria-label={`Estado global de ${section.name}`}
                className="w-full min-w-0 [&_[data-slot=trigger]]:h-7"
                onChange={(status) =>
                  void actions.onSectionGlobalStatus(section.id, status)
                }
              />
            ) : appId != null ? (
              <LifecycleStatusInheritSelect
                value={section.appStatusOverride}
                inheritLabel={sectionInheritLabel}
                busy={appBusyKey != null && actions.busyKey === appBusyKey}
                aria-label={`Estado de ${section.name}`}
                className="w-full min-w-0 [&_[data-slot=trigger]]:h-7"
                onChange={(value) =>
                  void actions.onSectionAppStatus(appId, section.id, value)
                }
              />
            ) : null
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function KanbanSectionChipPreview({ section }: { section: KanbanSection }) {
  return (
    <KanbanSectionChip
      section={section}
      moduleId={0}
      columnKey="unassigned"
      overlay
    />
  );
}
