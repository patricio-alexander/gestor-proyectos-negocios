import type { LifecycleStatus } from "@/src/features/modules/types";

export type KanbanSection = {
  id: number;
  name: string;
  key: string | null;
  globalStatus: LifecycleStatus;
  appStatusOverride: LifecycleStatus | null;
  assigned: boolean;
  effectiveStatus: LifecycleStatus;
};

export type KanbanModule = {
  id: number;
  name: string;
  key: string;
  globalStatus: LifecycleStatus;
  appStatusOverride: LifecycleStatus | null;
  effectiveStatus: LifecycleStatus;
  sections: KanbanSection[];
};

export type KanbanAppColumn = {
  id: number;
  name: string | null;
  kind: string;
  modules: KanbanModule[];
};

export type KanbanBoardData = {
  apps: KanbanAppColumn[];
  catalog_modules: KanbanModule[];
};

export type KanbanBoardActions = {
  busyKey: string | null;
  onModuleGlobalStatus: (moduleId: number, status: LifecycleStatus) => Promise<void>;
  onSectionGlobalStatus: (sectionId: number, status: LifecycleStatus) => Promise<void>;
  onModuleAppStatus: (
    appId: number,
    moduleId: number,
    value: string,
  ) => Promise<void>;
  onSectionAppStatus: (
    appId: number,
    sectionId: number,
    value: string,
  ) => Promise<void>;
  onUnassignModule: (appId: number, moduleId: number) => Promise<void>;
};
