"use client";

import { useDroppable } from "@dnd-kit/core";
import { gp } from "@/src/shared/ui/theme";
import type { KanbanBoardActions, KanbanModule } from "../types";
import { KanbanModuleCard } from "./KanbanModuleCard";
import { columnDroppableId, type KanbanColumnKey } from "./kanban-dnd";

export type CatalogHighlightContext = {
  appName: string;
  missingIds: Set<number>;
  missingCount: number;
};

type KanbanColumnProps = {
  columnKey: KanbanColumnKey;
  title: string;
  subtitle?: string;
  modules: KanbanModule[];
  isCatalog?: boolean;
  appId?: number;
  actions?: KanbanBoardActions;
  catalogHighlight?: CatalogHighlightContext | null;
  isHoveredApp?: boolean;
  onAppHover?: (appId: number) => void;
  appIdForHover?: number;
};

export function KanbanColumn({
  columnKey,
  title,
  subtitle,
  modules,
  isCatalog = false,
  appId,
  actions,
  catalogHighlight = null,
  isHoveredApp = false,
  onAppHover,
  appIdForHover,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnDroppableId(columnKey),
  });

  const showCatalogFilter = isCatalog && catalogHighlight != null;
  const visibleModules = showCatalogFilter
    ? modules.filter((module) => catalogHighlight.missingIds.has(module.id))
    : modules;

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={
        onAppHover && appIdForHover != null
          ? () => onAppHover(appIdForHover)
          : undefined
      }
      className={`flex w-[min(100%,280px)] shrink-0 flex-col rounded-lg border ${
        isCatalog ? "border-dashed " : ""
      }${
        isOver || isHoveredApp
          ? "border-[var(--accent)] bg-[var(--gp-surface-hover)]"
          : "border-[var(--gp-border)] bg-[var(--gp-surface-muted)]"
      } ${showCatalogFilter ? "ring-1 ring-[var(--accent)]/30" : ""}`}
    >
      <div className="border-b border-[var(--gp-border)] px-2.5 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="min-w-0 truncate text-xs font-semibold text-[var(--gp-text)]">
            {title}
          </h2>
          <span className="shrink-0 text-[10px] tabular-nums text-[var(--gp-text-faint)]">
            {showCatalogFilter ? catalogHighlight.missingCount : modules.length}
          </span>
        </div>
        {isCatalog ? (
          <p
            className={`mt-0.5 text-[10px] leading-snug ${
              showCatalogFilter
                ? "font-medium text-[var(--accent)]"
                : "text-[var(--gp-text-muted)]"
            }`}
          >
            {showCatalogFilter
              ? `Faltan en ${catalogHighlight.appName}`
              : "Catálogo · arrastrá → app"}
          </p>
        ) : subtitle ? (
          <p className="mt-0.5 truncate text-[10px] capitalize text-[var(--gp-text-muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="flex max-h-[calc(100vh-14rem)] flex-col gap-1.5 overflow-y-auto p-1.5">
        {visibleModules.length === 0 ? (
          <p className={`${gp.empty} py-4 text-[10px]`}>
            {showCatalogFilter
              ? "Esta app ya tiene todos los módulos"
              : isCatalog
                ? "Sin módulos"
                : "Soltá módulos acá"}
          </p>
        ) : (
          visibleModules.map((module) => (
            <KanbanModuleCard
              key={`${columnKey}-${module.id}`}
              module={module}
              columnKey={columnKey}
              isCatalog={isCatalog}
              appId={appId}
              actions={actions}
            />
          ))
        )}
      </div>
    </div>
  );
}
