"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Spinner } from "@heroui/react";
import { useMemo, useState, useCallback } from "react";
import { gp } from "@/src/shared/ui/theme";
import { ManagerHeader } from "@/src/shared/components/TableSearchBar";
import { useKanban } from "../hooks/useKanban";
import type { KanbanBoardData, KanbanModule } from "../types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanModuleCardPreview } from "./KanbanModuleCard";
import { KanbanSectionChipPreview } from "./KanbanSectionChip";
import { KanbanHintLegend } from "./kanban-ui";
import { parseDragId, type KanbanColumnKey } from "./kanban-dnd";

export function AppsKanbanManager() {
  const { data, loading, assignModule, assignSection, actions } = useKanban();
  const [activeDrag, setActiveDrag] = useState<ReturnType<typeof parseDragId> | null>(
    null,
  );
  const [hoveredAppId, setHoveredAppId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const columns = useMemo(() => buildColumns(data), [data]);

  const handleAppHover = useCallback((appId: number) => {
    setHoveredAppId((current) => (current === appId ? current : appId));
  }, []);

  const handleBoardLeave = useCallback(() => {
    setHoveredAppId(null);
  }, []);

  const catalogHighlight = useMemo(() => {
    if (!data || hoveredAppId == null) return null;

    const app = data.apps.find((a) => a.id === hoveredAppId);
    if (!app) return null;

    const assignedIds = new Set(app.modules.map((m) => m.id));
    const missingIds = new Set(
      data.catalog_modules
        .filter((m) => !assignedIds.has(m.id))
        .map((m) => m.id),
    );

    return {
      appName: app.name || `App #${hoveredAppId}`,
      missingIds,
      missingCount: missingIds.size,
    };
  }, [data, hoveredAppId]);

  function findModule(moduleId: number): KanbanModule | undefined {
    if (!data) return undefined;
    for (const app of data.apps) {
      const mod = app.modules.find((m) => m.id === moduleId);
      if (mod) return mod;
    }
    return data.catalog_modules.find((m) => m.id === moduleId);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const active = parseDragId(String(event.active.id));
    const over = event.over ? parseDragId(String(event.over.id)) : null;
    setActiveDrag(null);

    if (!active || !over) return;

    if (active.kind === "module") {
      const fromCol = active.columnKey;
      const toCol =
        over.kind === "column" || over.kind === "module" ? over.columnKey : null;
      if (!toCol || fromCol === toCol) return;

      try {
        if (toCol === "unassigned") {
          if (fromCol !== "unassigned") {
            await assignModule(Number(fromCol), active.moduleId, false);
          }
          return;
        }

        const targetAppId = Number(toCol);
        const alreadyInTarget = data?.apps
          .find((a) => a.id === targetAppId)
          ?.modules.some((m) => m.id === active.moduleId);

        if (alreadyInTarget) return;

        await assignModule(targetAppId, active.moduleId, true);
      } catch {
        /* toast en hook */
      }
      return;
    }

    if (active.kind === "section") {
      const fromCol = active.columnKey;
      const toCol =
        over.kind === "column" || over.kind === "module" ? over.columnKey : null;

      if (!toCol || fromCol === toCol) return;

      if (toCol === "unassigned") {
        if (fromCol !== "unassigned") {
          await assignSection(Number(fromCol), active.sectionId, false, active.moduleId);
        }
        return;
      }

      const targetAppId = Number(toCol);
      const targetColumn = data?.apps.find((a) => a.id === targetAppId);
      const moduleInTarget = targetColumn?.modules.some(
        (m) => m.id === active.moduleId,
      );

      if (!moduleInTarget) {
        return;
      }

      const alreadyAssigned = targetColumn?.modules
        .find((m) => m.id === active.moduleId)
        ?.sections.find((s) => s.id === active.sectionId)?.assigned;

      if (alreadyAssigned) return;

      await assignSection(targetAppId, active.sectionId, true, active.moduleId);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDrag(parseDragId(String(event.active.id)));
  }

  const overlayModule =
    activeDrag?.kind === "module" ? findModule(activeDrag.moduleId) : null;

  const overlaySection =
    activeDrag?.kind === "section"
      ? findModule(activeDrag.moduleId)?.sections.find(
          (s) => s.id === activeDrag.sectionId,
        )
      : null;

  return (
    <div className={`${gp.page} ${gp.pageGap8}`}>
      <ManagerHeader
        title="Kanban de aplicaciones"
        description="Asigná módulos y secciones por app; configurá estados globales u overrides."
      />
      <KanbanHintLegend />

      {loading ? (
        <div className={`${gp.card} flex items-center justify-center py-16`}>
          <Spinner size="lg" />
        </div>
      ) : !data ? (
        <div className={gp.empty}>No se pudo cargar el tablero.</div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div
            className="flex gap-4 overflow-x-auto pb-4"
            onMouseLeave={handleBoardLeave}
          >
            {columns.map((column) => {
              const columnAppId = column.isCatalog
                ? undefined
                : Number(column.key);

              return (
                <KanbanColumn
                  key={column.key}
                  columnKey={column.key}
                  title={column.title}
                  subtitle={column.subtitle}
                  modules={column.modules}
                  isCatalog={column.isCatalog}
                  appId={columnAppId}
                  actions={actions}
                  catalogHighlight={
                    column.isCatalog ? catalogHighlight : null
                  }
                  isHoveredApp={columnAppId != null && hoveredAppId === columnAppId}
                  appIdForHover={columnAppId}
                  onAppHover={columnAppId != null ? handleAppHover : undefined}
                />
              );
            })}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeDrag?.kind === "module" && overlayModule ? (
              <KanbanModuleCardPreview module={overlayModule} />
            ) : null}
            {activeDrag?.kind === "section" && overlaySection ? (
              <KanbanSectionChipPreview section={overlaySection} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

function buildColumns(data: KanbanBoardData | null) {
  if (!data) return [];

  const cols: {
    key: KanbanColumnKey;
    title: string;
    subtitle?: string;
    modules: KanbanModule[];
    isCatalog?: boolean;
  }[] = [
    {
      key: "unassigned",
      title: "Sin asignar",
      subtitle: undefined,
      modules: data.catalog_modules,
      isCatalog: true,
    },
  ];

  for (const app of data.apps) {
    cols.push({
      key: String(app.id) as KanbanColumnKey,
      title: app.name || `App #${app.id}`,
      subtitle: app.kind,
      modules: app.modules,
    });
  }

  return cols;
}
