"use client";

import { useDraggable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Bars from "@gravity-ui/icons/Bars";
import ChevronDown from "@gravity-ui/icons/ChevronDown";
import ChevronRight from "@gravity-ui/icons/ChevronRight";
import Xmark from "@gravity-ui/icons/Xmark";
import { Button } from "@heroui/react";
import { useState } from "react";
import {
  LIFECYCLE_STATUS_LABELS,
  normalizeLifecycleStatus,
} from "@/src/features/modules/types";
import { effectiveSectionStatusForApp } from "@/src/shared/lib/lifecycle-status-resolve";
import type { KanbanBoardActions, KanbanModule } from "../types";
import {
  moduleDraggableId,
  sectionDraggableId,
  type KanbanColumnKey,
} from "./kanban-dnd";
import { KanbanSectionChip } from "./KanbanSectionChip";
import { LifecycleStatusSelect } from "@/src/features/modules/components/LifecycleStatusSelect";
import { LifecycleStatusInheritSelect } from "@/src/features/modules/components/LifecycleStatusInheritSelect";
import {
  KanbanEffectivePill,
  KanbanFieldLabel,
} from "./kanban-ui";

type KanbanModuleCardProps = {
  module: KanbanModule;
  columnKey: KanbanColumnKey;
  isCatalog?: boolean;
  appId?: number;
  actions?: KanbanBoardActions;
  overlay?: boolean;
};

export function KanbanModuleCard({
  module,
  columnKey,
  isCatalog = columnKey === "unassigned",
  appId,
  actions,
  overlay = false,
}: KanbanModuleCardProps) {
  const [sectionsOpen, setSectionsOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: moduleDraggableId(module.id, columnKey),
      data: { type: "module", moduleId: module.id, columnKey },
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const sectionIds = module.sections.map((section) =>
    sectionDraggableId(section.id, module.id, columnKey),
  );

  const moduleBusyKey = isCatalog
    ? `global-mod-${module.id}`
    : appId != null
      ? `app-mod-${module.id}-${appId}`
      : null;

  const moduleInheritLabel =
    LIFECYCLE_STATUS_LABELS[normalizeLifecycleStatus(module.globalStatus)];

  const activeSections = module.sections.filter((s) => s.assigned).length;

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : style}
      className={`rounded-lg border border-[var(--gp-border)] bg-[var(--gp-card-bg)] ${
        isDragging && !overlay && !isCatalog ? "opacity-40" : ""
      } ${overlay ? "rotate-1 shadow-lg ring-2 ring-[var(--accent)]" : ""}`}
    >
      <div className="flex items-center gap-1 border-b border-[var(--gp-border)] px-1.5 py-1.5">
        <button
          type="button"
          className="shrink-0 cursor-grab rounded p-0.5 text-[var(--gp-text-muted)] hover:bg-[var(--gp-surface-muted)] active:cursor-grabbing"
          aria-label={`Arrastrar ${module.name}`}
          title="Arrastrar módulo"
          {...(overlay ? {} : { ...listeners, ...attributes })}
          disabled={overlay}
        >
          <Bars width={12} height={12} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold leading-tight text-[var(--gp-text)]">
            {module.name}
          </p>
          <p className="truncate font-mono text-[9px] leading-tight text-[var(--gp-text-muted)]">
            {module.key}
          </p>
        </div>

        {!isCatalog ? (
          <KanbanEffectivePill status={module.effectiveStatus} compact />
        ) : null}

        {!isCatalog && appId != null && actions ? (
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            aria-label="Quitar de esta app"
            isDisabled={actions.busyKey != null}
            className="min-h-6 min-w-6 shrink-0 text-[var(--gp-text-muted)]"
            onPress={() => void actions.onUnassignModule(appId, module.id)}
          >
            <Xmark width={12} height={12} />
          </Button>
        ) : null}
      </div>

      <div
        className="space-y-1 px-2 py-1.5"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          <KanbanFieldLabel title={isCatalog ? "Estado en todo el catálogo" : "Override solo en esta app"}>
            {isCatalog ? "Global" : "App"}
          </KanbanFieldLabel>
          <div className="min-w-0 flex-1">
            {actions ? (
              isCatalog ? (
                <LifecycleStatusSelect
                  value={module.globalStatus}
                  busy={actions.busyKey === moduleBusyKey}
                  aria-label={`Estado global de ${module.name}`}
                  className="w-full min-w-0 [&_[data-slot=trigger]]:h-7"
                  onChange={(status) =>
                    void actions.onModuleGlobalStatus(module.id, status)
                  }
                />
              ) : appId != null ? (
                <LifecycleStatusInheritSelect
                  value={module.appStatusOverride}
                  inheritLabel={moduleInheritLabel}
                  busy={actions.busyKey === moduleBusyKey}
                  aria-label={`Estado de ${module.name} en la app`}
                  className="w-full min-w-0 [&_[data-slot=trigger]]:h-7"
                  onChange={(value) =>
                    void actions.onModuleAppStatus(appId, module.id, value)
                  }
                />
              ) : null
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className="flex w-full items-center gap-1 rounded px-0.5 py-0.5 text-left hover:bg-[var(--gp-surface-muted)]"
          title="Secciones del módulo · arrastrá para activar en otra app"
          onClick={() => setSectionsOpen((open) => !open)}
        >
          {sectionsOpen ? (
            <ChevronDown width={10} height={10} className="shrink-0 opacity-60" />
          ) : (
            <ChevronRight width={10} height={10} className="shrink-0 opacity-60" />
          )}
          <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--gp-text-faint)]">
            Secc.
          </span>
          <span className="text-[10px] text-[var(--gp-text-muted)]">
            {module.sections.length}
            {!isCatalog && module.sections.length > 0
              ? ` · ${activeSections} on`
              : ""}
          </span>
        </button>

        {sectionsOpen ? (
          module.sections.length === 0 ? (
            <p className="px-1 text-[10px] text-[var(--gp-text-muted)]">
              Sin secciones
            </p>
          ) : (
            <SortableContext
              items={sectionIds}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-1">
                {module.sections.map((section) => {
                  const sectionInheritLabel =
                    LIFECYCLE_STATUS_LABELS[
                      effectiveSectionStatusForApp(
                        section.globalStatus,
                        null,
                        module.appStatusOverride,
                      )
                    ];

                  return (
                    <li key={section.id}>
                      <KanbanSectionChip
                        section={section}
                        moduleId={module.id}
                        columnKey={columnKey}
                        isCatalog={isCatalog}
                        appId={appId}
                        actions={actions}
                        sectionInheritLabel={sectionInheritLabel}
                      />
                    </li>
                  );
                })}
              </ul>
            </SortableContext>
          )
        ) : null}
      </div>
    </div>
  );
}

export function KanbanModuleCardPreview({ module }: { module: KanbanModule }) {
  return (
    <KanbanModuleCard module={module} columnKey="unassigned" overlay />
  );
}
