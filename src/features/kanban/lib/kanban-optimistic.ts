import type { LifecycleStatus } from "@/src/features/modules/types";
import {
  deriveModuleEffectiveStatus,
  effectiveSectionStatusForApp,
  normalizeLifecycleStatus,
} from "@/src/shared/lib/lifecycle-status-resolve";
import type { KanbanBoardData, KanbanModule, KanbanSection } from "../types";

function recomputeSection(
  section: KanbanSection,
  moduleAppOverride: LifecycleStatus | null,
): KanbanSection {
  return {
    ...section,
    effectiveStatus: effectiveSectionStatusForApp(
      section.globalStatus,
      section.appStatusOverride,
      moduleAppOverride,
    ),
  };
}

function recomputeModule(module: KanbanModule): KanbanModule {
  const moduleAppOverride = module.appStatusOverride;
  const sections = module.sections.map((section) =>
    recomputeSection(section, moduleAppOverride),
  );

  return {
    ...module,
    sections,
    effectiveStatus: deriveModuleEffectiveStatus(
      module.globalStatus,
      moduleAppOverride,
      sections.map((s) => s.effectiveStatus),
    ),
  };
}

function catalogModuleToAppModule(catalogModule: KanbanModule): KanbanModule {
  return recomputeModule({
    ...catalogModule,
    appStatusOverride: null,
    sections: catalogModule.sections.map((section) => ({
      ...section,
      appStatusOverride: null,
      assigned: false,
      effectiveStatus: normalizeLifecycleStatus(section.globalStatus),
    })),
  });
}

function updateModuleEverywhere(
  data: KanbanBoardData,
  moduleId: number,
  updater: (module: KanbanModule) => KanbanModule,
): KanbanBoardData {
  return {
    catalog_modules: data.catalog_modules.map((module) =>
      module.id === moduleId ? updater(module) : module,
    ),
    apps: data.apps.map((app) => ({
      ...app,
      modules: app.modules.map((module) =>
        module.id === moduleId ? updater(module) : module,
      ),
    })),
  };
}

function mapModuleSections(
  module: KanbanModule,
  sectionId: number,
  updater: (section: KanbanSection) => KanbanSection,
): KanbanModule {
  return recomputeModule({
    ...module,
    sections: module.sections.map((section) =>
      section.id === sectionId ? updater(section) : section,
    ),
  });
}

export function applyAssignModule(
  data: KanbanBoardData,
  appId: number,
  moduleId: number,
  assigned: boolean,
): KanbanBoardData {
  const catalogModule = data.catalog_modules.find((m) => m.id === moduleId);
  if (!catalogModule) return data;

  return {
    ...data,
    apps: data.apps.map((app) => {
      if (app.id !== appId) return app;

      if (assigned) {
        if (app.modules.some((m) => m.id === moduleId)) return app;
        return {
          ...app,
          modules: [...app.modules, catalogModuleToAppModule(catalogModule)],
        };
      }

      return {
        ...app,
        modules: app.modules.filter((m) => m.id !== moduleId),
      };
    }),
  };
}

export function applyAssignSection(
  data: KanbanBoardData,
  appId: number,
  moduleId: number,
  sectionId: number,
  assigned: boolean,
): KanbanBoardData {
  return {
    ...data,
    apps: data.apps.map((app) => {
      if (app.id !== appId) return app;

      return {
        ...app,
        modules: app.modules.map((module) => {
          if (module.id !== moduleId) return module;

          return mapModuleSections(module, sectionId, (section) =>
            recomputeSection(
              {
                ...section,
                assigned,
                appStatusOverride: assigned ? section.appStatusOverride : null,
              },
              module.appStatusOverride,
            ),
          );
        }),
      };
    }),
  };
}

export function applyModuleGlobalStatus(
  data: KanbanBoardData,
  moduleId: number,
  status: LifecycleStatus,
): KanbanBoardData {
  return updateModuleEverywhere(data, moduleId, (module) =>
    recomputeModule({ ...module, globalStatus: status }),
  );
}

export function applySectionGlobalStatus(
  data: KanbanBoardData,
  sectionId: number,
  status: LifecycleStatus,
): KanbanBoardData {
  return {
    catalog_modules: data.catalog_modules.map((module) =>
      recomputeModule({
        ...module,
        sections: module.sections.map((section) =>
          section.id === sectionId
            ? recomputeSection({ ...section, globalStatus: status }, module.appStatusOverride)
            : section,
        ),
      }),
    ),
    apps: data.apps.map((app) => ({
      ...app,
      modules: app.modules.map((module) =>
        mapModuleSections(module, sectionId, (section) =>
          recomputeSection({ ...section, globalStatus: status }, module.appStatusOverride),
        ),
      ),
    })),
  };
}

export function applyModuleAppStatus(
  data: KanbanBoardData,
  appId: number,
  moduleId: number,
  value: string,
): KanbanBoardData {
  const clear = value === "__inherit__";
  const appStatusOverride = clear ? null : (value as LifecycleStatus);

  return {
    ...data,
    apps: data.apps.map((app) => {
      if (app.id !== appId) return app;

      return {
        ...app,
        modules: app.modules.map((module) => {
          if (module.id !== moduleId) return module;
          return recomputeModule({ ...module, appStatusOverride });
        }),
      };
    }),
  };
}

export function applySectionAppStatus(
  data: KanbanBoardData,
  appId: number,
  moduleId: number,
  sectionId: number,
  value: string,
): KanbanBoardData {
  const clear = value === "__inherit__";
  const appStatusOverride = clear ? null : (value as LifecycleStatus);
  const assigned = !clear;

  return {
    ...data,
    apps: data.apps.map((app) => {
      if (app.id !== appId) return app;

      return {
        ...app,
        modules: app.modules.map((module) => {
          if (module.id !== moduleId) return module;

          return mapModuleSections(module, sectionId, (section) =>
            recomputeSection(
              {
                ...section,
                assigned,
                appStatusOverride,
              },
              module.appStatusOverride,
            ),
          );
        }),
      };
    }),
  };
}
