export type KanbanColumnKey = "unassigned" | `${number}`;

export type ParsedDragId =
  | {
      kind: "column";
      columnKey: KanbanColumnKey;
    }
  | {
      kind: "module";
      moduleId: number;
      columnKey: KanbanColumnKey;
    }
  | {
      kind: "section";
      sectionId: number;
      moduleId: number;
      columnKey: KanbanColumnKey;
    };

export function columnDroppableId(columnKey: KanbanColumnKey) {
  return `col:${columnKey}`;
}

export function moduleDraggableId(
  moduleId: number,
  columnKey: KanbanColumnKey,
) {
  return `mod:${moduleId}:col:${columnKey}`;
}

export function sectionDraggableId(
  sectionId: number,
  moduleId: number,
  columnKey: KanbanColumnKey,
) {
  return `sec:${sectionId}:mod:${moduleId}:col:${columnKey}`;
}

export function parseDragId(id: string): ParsedDragId | null {
  if (id.startsWith("col:")) {
    const columnKey = id.slice(4) as KanbanColumnKey;
    return { kind: "column", columnKey };
  }

  const modMatch = /^mod:(\d+):col:(.+)$/.exec(id);
  if (modMatch) {
    return {
      kind: "module",
      moduleId: Number(modMatch[1]),
      columnKey: modMatch[2] as KanbanColumnKey,
    };
  }

  const secMatch = /^sec:(\d+):mod:(\d+):col:(.+)$/.exec(id);
  if (secMatch) {
    return {
      kind: "section",
      sectionId: Number(secMatch[1]),
      moduleId: Number(secMatch[2]),
      columnKey: secMatch[3] as KanbanColumnKey,
    };
  }

  return null;
}
