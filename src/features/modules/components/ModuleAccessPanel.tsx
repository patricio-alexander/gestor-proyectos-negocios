"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import Briefcase from "@gravity-ui/icons/Briefcase";
import CirclePlus from "@gravity-ui/icons/CirclePlus";
import Globe from "@gravity-ui/icons/Globe";
import Key from "@gravity-ui/icons/Key";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import type { Capability, LifecycleStatus, Module, Section } from "../types";
import {
  LIFECYCLE_STATUS_LABELS,
  normalizeLifecycleStatus,
} from "../types";
import { effectiveSectionStatusForApp } from "@/src/shared/lib/lifecycle-status-resolve";
import { apiUrl } from "@/src/utils/apiUrl";
import { gp } from "@/src/shared/ui/theme";
import { appToast } from "@/src/shared/utils/app-toast";
import {
  formatPushSyncToast,
  type PushSyncPayload,
} from "@/src/shared/lib/push-sync-message";

function warnPushSync(data: PushSyncPayload) {
  const msg = formatPushSyncToast(data);
  if (msg) appToast.warning(msg);
}
import { useApps } from "@/src/features/apps/hooks/useApps";
import type { AppKind } from "@/src/features/apps/types";
import {
  LifecycleStatusSelect,
  LIFECYCLE_STATUS_STYLE,
} from "./LifecycleStatusSelect";
import { LifecycleStatusInheritSelect } from "./LifecycleStatusInheritSelect";
import { SectionCapabilitiesPanel } from "./SectionCapabilitiesPanel";
import { SectionLimitBadge, SectionLimitSummary } from "./SectionLimitBadge";
import { SectionMaxRecordsLimitField } from "./SectionMaxRecordsLimitField";

function parseMaxRecordsLimitInput(value: FormDataEntryValue | null) {
  if (value == null || String(value).trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(
      "El límite máximo de registros debe ser un entero mayor o igual a 0",
    );
  }
  return parsed;
}

type AssignmentRow = {
  app_id: number;
  status: LifecycleStatus | null;
  app_name?: string | null;
};

type ModuleAccessPanelProps = {
  module: Module;
  open: boolean;
  onClose: () => void;
  onModuleUpdate: (module: Module) => void;
  onChanged?: () => void;
  initialTab?: "global" | "app";
  initialAppId?: number;
};

export function ModuleAccessPanel({
  module,
  open,
  onClose,
  onModuleUpdate,
  onChanged,
  initialTab = "global",
  initialAppId,
}: ModuleAccessPanelProps) {
  const modal = useOverlayState({
    isOpen: open,
    onOpenChange: (isOpen) => {
      if (!isOpen) onClose();
    },
  });

  const { apps: allApps } = useApps();
  const [tab, setTab] = useState<"global" | "app">(initialTab);
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(
    initialAppId ?? null,
  );
  const [sectionOverrides, setSectionOverrides] = useState(
    new Map<number, LifecycleStatus | null>(),
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [sectionSubmitting, setSectionSubmitting] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);
  const [managingCapabilitiesSection, setManagingCapabilitiesSection] =
    useState<Section | null>(null);

  const sectionCreateState = useOverlayState();
  const sectionEditState = useOverlayState();
  const sectionDeleteState = useOverlayState();

  const deploymentApps = useMemo(
    () =>
      allApps.filter((a) => {
        if (a.kind === "template") return false;
        if ((module.channel ?? "web") === "mobile") return a.kind === "mobile";
        return a.kind === "deployment" || a.kind == null;
      }),
    [allApps, module.channel],
  );

  const assignedIds = useMemo(
    () => new Set(assignments.map((a) => a.app_id)),
    [assignments],
  );

  const moduleStatusByApp = useMemo(
    () => new Map(assignments.map((a) => [a.app_id, a.status])),
    [assignments],
  );

  const globalModuleStatus = normalizeLifecycleStatus(module.status);
  const globalStyle = LIFECYCLE_STATUS_STYLE[globalModuleStatus];
  const globalLabel = LIFECYCLE_STATUS_LABELS[globalModuleStatus];

  const loadAccessData = useCallback(
    async (appId?: number | null) => {
      const qs =
        appId != null ? `?app_id=${encodeURIComponent(String(appId))}` : "";
      const res = await fetch(apiUrl(`/api/modules/${module.id}/access${qs}`));
      if (!res.ok) throw new Error("No se pudo cargar el acceso del módulo");
      const data = (await res.json()) as {
        assignments: AssignmentRow[];
        section_overrides?: Record<string, LifecycleStatus | null>;
      };
      return data;
    },
    [module.id],
  );

  const overridesMapFromPayload = useCallback(
    (
      sectionOverrides?: Record<string, LifecycleStatus | null>,
    ): Map<number, LifecycleStatus | null> => {
      const map = new Map<number, LifecycleStatus | null>();
      for (const sec of module.sections) {
        const raw = sectionOverrides?.[String(sec.id)];
        map.set(sec.id, raw ?? null);
      }
      return map;
    },
    [module.sections],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const appIdForLoad = initialAppId ?? null;
      const qs =
        appIdForLoad != null
          ? `?app_id=${encodeURIComponent(String(appIdForLoad))}`
          : "";
      const res = await fetch(apiUrl(`/api/modules/${module.id}/access${qs}`));
      if (!res.ok) throw new Error("No se pudo cargar el acceso del módulo");
      const data = (await res.json()) as {
        assignments: AssignmentRow[];
        section_overrides?: Record<string, LifecycleStatus | null>;
        selected_app_id?: number | null;
      };
      setAssignments(data.assignments);
      setSelectedAppId(
        data.selected_app_id ??
          appIdForLoad ??
          data.assignments[0]?.app_id ??
          null,
      );
      setSectionOverrides(overridesMapFromPayload(data.section_overrides));
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [initialAppId, module.id, overridesMapFromPayload]);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    void load();
  }, [open, initialTab, module.id, load]);

  async function reloadOverrides(appId: number) {
    const data = await loadAccessData(appId);
    setSectionOverrides(overridesMapFromPayload(data.section_overrides));
  }

  async function selectApp(appId: number) {
    setSelectedAppId(appId);
    setBusyKey("load-sections");
    try {
      await reloadOverrides(appId);
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleAssignment(appId: number, assign: boolean) {
    setBusyKey(`assign-${appId}`);
    try {
      const res = await fetch(apiUrl(`/api/modules/${module.id}/assign-app`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: appId, assigned: assign }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al asignar");
      warnPushSync(data);
      const refreshed = await loadAccessData();
      setAssignments(refreshed.assignments);
      onChanged?.();
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al asignar");
    } finally {
      setBusyKey(null);
    }
  }

  async function saveModuleAppStatus(appId: number, value: string) {
    setBusyKey(`mod-${appId}`);
    try {
      const clear = value === "__inherit__";
      const res = await fetch(apiUrl(`/api/modules/${module.id}/app-status`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          clear ? { app_id: appId, clear: true } : { app_id: appId, status: value },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      warnPushSync(data);
      const refreshed = await loadAccessData();
      setAssignments(refreshed.assignments);
      if (selectedAppId === appId) {
        await reloadOverrides(appId);
      }
      onChanged?.();
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setBusyKey(null);
    }
  }

  async function saveSectionAppStatus(
    sectionId: number,
    appId: number,
    value: string,
  ) {
    setBusyKey(`sec-${sectionId}`);
    try {
      const clear = value === "__inherit__";
      const res = await fetch(apiUrl(`/api/sections/${sectionId}/app-status`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          clear ? { app_id: appId, clear: true } : { app_id: appId, status: value },
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      warnPushSync(data);
      await reloadOverrides(appId);
      onChanged?.();
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setBusyKey(null);
    }
  }

  async function changeModuleGlobal(status: LifecycleStatus) {
    setBusyKey("global-module");
    onModuleUpdate({ ...module, status });
    try {
      const res = await fetch(apiUrl(`/api/modules/${module.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar módulo");
      const { push_error: _pushError, push_results: _pushResults, ...modData } = data;
      onModuleUpdate({ ...module, ...modData, sections: module.sections });
      warnPushSync(data);
      const refreshed = await loadAccessData();
      setAssignments(refreshed.assignments);
      onChanged?.();
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al guardar");
      onModuleUpdate(module);
    } finally {
      setBusyKey(null);
    }
  }

  async function changeSectionGlobal(sec: Section, status: LifecycleStatus) {
    setBusyKey(`global-sec-${sec.id}`);
    onModuleUpdate({
      ...module,
      sections: module.sections.map((s) =>
        s.id === sec.id ? { ...s, status } : s,
      ),
    });
    try {
      const res = await fetch(apiUrl(`/api/sections/${sec.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar sección");
      const {
        push_error: _pushError,
        push_results: _pushResults,
        module_status,
        ...sectionData
      } = data;
      onModuleUpdate({
        ...module,
        status: module_status ?? module.status,
        sections: module.sections.map((s) =>
          s.id === sec.id ? { ...s, ...sectionData } : s,
        ),
      });
      warnPushSync(data);
      onChanged?.();
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al guardar");
      onModuleUpdate(module);
    } finally {
      setBusyKey(null);
    }
  }

  function updateSections(updater: (sections: Section[]) => Section[]) {
    onModuleUpdate({
      ...module,
      sections: updater(module.sections),
    });
  }

  function updateSectionCapabilities(
    sectionId: number,
    capabilities: Capability[],
  ) {
    updateSections((sections) =>
      sections.map((s) =>
        s.id === sectionId ? { ...s, capabilities } : s,
      ),
    );
    setManagingCapabilitiesSection((current) =>
      current?.id === sectionId ? { ...current, capabilities } : current,
    );
  }

  async function handleCreateSection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSectionSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(apiUrl("/api/sections"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name") as string,
          key: (form.get("key") as string) || null,
          module_id: module.id,
          max_records_limit: parseMaxRecordsLimitInput(
            form.get("max_records_limit"),
          ),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear sección");
      }
      const section: Section = {
        ...(await res.json()),
        capabilities: [],
      };
      updateSections((sections) => [...sections, section]);
      sectionCreateState.close();
      appToast.success("Sección creada");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSectionSubmitting(false);
    }
  }

  async function handleEditSection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingSection) return;
    setSectionSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(apiUrl(`/api/sections/${editingSection.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name") as string,
          key: (form.get("key") as string) || null,
          max_records_limit: parseMaxRecordsLimitInput(
            form.get("max_records_limit"),
          ),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar sección");
      }
      const section: Section = await res.json();
      updateSections((sections) =>
        sections.map((s) =>
          s.id === section.id
            ? { ...section, capabilities: s.capabilities ?? [] }
            : s,
        ),
      );
      sectionEditState.close();
      setEditingSection(null);
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSectionSubmitting(false);
    }
  }

  async function handleDeleteSection() {
    if (!deletingSection) return;
    setSectionSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/api/sections/${deletingSection.id}`), {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar sección");
      }
      updateSections((sections) =>
        sections.filter((s) => s.id !== deletingSection.id),
      );
      sectionDeleteState.close();
      setDeletingSection(null);
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setSectionSubmitting(false);
    }
  }

  function openCapabilities(sec: Section) {
    setManagingCapabilitiesSection(sec);
  }

  function openEditSection(sec: Section) {
    setEditingSection(sec);
    sectionEditState.open();
  }

  function openDeleteSection(sec: Section) {
    setDeletingSection(sec);
    sectionDeleteState.open();
  }

  const selectedApp = deploymentApps.find((a) => a.id === selectedAppId);
  const selectedAssigned = selectedAppId != null && assignedIds.has(selectedAppId);
  const moduleAppOverride =
    selectedAppId != null ? moduleStatusByApp.get(selectedAppId) ?? null : null;
  const moduleInheritLabel = globalLabel;

  if (!open) return null;

  return (
    <>
    <Modal state={modal}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="flex max-h-[min(92dvh,820px)] w-[calc(100vw-2rem)] max-w-3xl flex-col overflow-hidden">
            <Modal.CloseTrigger />
            <Modal.Header className="shrink-0">
              <Modal.Heading className="truncate">Acceso · {module.name}</Modal.Heading>
              <SectionLimitSummary sections={module.sections} />
              <p className="mt-1 text-xs text-[var(--gp-text-muted)] sm:text-sm">
                Prioridad: sección por app → módulo por app → catálogo global
              </p>
            </Modal.Header>

            <Modal.Body className="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <div className="flex gap-1 rounded-lg bg-[var(--gp-surface-muted)] p-1">
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition ${
                    tab === "global"
                      ? "bg-[var(--gp-card-bg)] text-[var(--gp-text)] shadow-sm ring-1 ring-[var(--gp-border)]"
                      : "text-[var(--gp-text-muted)] hover:text-[var(--gp-text)]"
                  }`}
                  onClick={() => setTab("global")}
                >
                  <Globe width={14} height={14} />
                  Catálogo global
                </button>
                <button
                  type="button"
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition ${
                    tab === "app"
                      ? "bg-[var(--gp-card-bg)] text-[var(--gp-text)] shadow-sm ring-1 ring-[var(--gp-border)]"
                      : "text-[var(--gp-text-muted)] hover:text-[var(--gp-text)]"
                  }`}
                  onClick={() => setTab("app")}
                >
                  <Briefcase width={14} height={14} />
                  Por app
                  {assignments.length > 0 ? (
                    <span className="rounded-full bg-[var(--gp-badge-bg)] px-1.5 text-[10px] text-[var(--gp-badge-text)]">
                      {assignments.length}
                    </span>
                  ) : null}
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-16">
                  <Spinner size="sm" />
                </div>
              ) : tab === "global" ? (
                <GlobalTab
                  module={module}
                  globalLabel={globalLabel}
                  globalStyle={globalStyle}
                  busyKey={busyKey}
                  onModuleChange={changeModuleGlobal}
                  onSectionChange={changeSectionGlobal}
                  onCapabilities={openCapabilities}
                  onEditSection={openEditSection}
                  onDeleteSection={openDeleteSection}
                />
              ) : (
                <AppTab
                  deploymentApps={deploymentApps}
                  assignedIds={assignedIds}
                  selectedAppId={selectedAppId}
                  selectedApp={selectedApp}
                  selectedAssigned={selectedAssigned}
                  module={module}
                  moduleAppOverride={moduleAppOverride}
                  moduleInheritLabel={moduleInheritLabel}
                  sectionOverrides={sectionOverrides}
                  busyKey={busyKey}
                  onSelectApp={selectApp}
                  onToggleAssignment={toggleAssignment}
                  onModuleAppStatus={saveModuleAppStatus}
                  onSectionAppStatus={saveSectionAppStatus}
                  onCapabilities={openCapabilities}
                  onEditSection={openEditSection}
                  onDeleteSection={openDeleteSection}
                />
              )}
            </Modal.Body>

            <Modal.Footer className="shrink-0">
              <Modal state={sectionCreateState}>
                <Button>
                  <CirclePlus width={14} height={14} />
                  Nueva sección
                </Button>
                <Modal.Backdrop>
                  <Modal.Container>
                    <Modal.Dialog className="flex max-h-[min(92dvh,640px)] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden">
                      <Modal.CloseTrigger />
                      <Modal.Header className="shrink-0">
                        <Modal.Heading>Nueva sección</Modal.Heading>
                        <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
                          En {module.name}
                        </p>
                      </Modal.Header>
                      <form onSubmit={handleCreateSection} className="flex min-h-0 flex-1 flex-col">
                        <Modal.Body className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                          <label className={gp.label}>
                            Nombre
                            <input
                              name="name"
                              required
                              placeholder="Ej: Productos, Pedidos…"
                              className={gp.input}
                            />
                          </label>
                          <label className={gp.label}>
                            Key
                            <input
                              name="key"
                              placeholder="Ej: /productos, /pedidos…"
                              className={gp.input}
                            />
                            <span className="mt-1 block text-xs text-[var(--gp-text-muted)]">
                              Identificador remoto de la sección (ruta o slug).
                            </span>
                          </label>
                          <SectionMaxRecordsLimitField key="create-section-limit" />
                        </Modal.Body>
                        <Modal.Footer className="shrink-0">
                          <Button variant="secondary" slot="close">
                            Cancelar
                          </Button>
                          <Button type="submit" isDisabled={sectionSubmitting}>
                            {sectionSubmitting ? (
                              <Spinner size="sm" />
                            ) : (
                              "Crear sección"
                            )}
                          </Button>
                        </Modal.Footer>
                      </form>
                    </Modal.Dialog>
                  </Modal.Container>
                </Modal.Backdrop>
              </Modal>
              <Button variant="secondary" slot="close">
                Cerrar
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>

    <Modal state={sectionEditState}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="flex max-h-[min(92dvh,640px)] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden">
            <Modal.CloseTrigger />
            <Modal.Header className="shrink-0">
              <Modal.Heading>Editar sección</Modal.Heading>
            </Modal.Header>
            {editingSection && (
              <form onSubmit={handleEditSection} className="flex min-h-0 flex-1 flex-col">
                <Modal.Body className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                  <label className={gp.label}>
                    Nombre
                    <input
                      name="name"
                      required
                      defaultValue={editingSection.name}
                      className={gp.input}
                    />
                  </label>
                  <label className={gp.label}>
                    Key
                    <input
                      name="key"
                      defaultValue={editingSection.key ?? ""}
                      placeholder="Ej: /productos, /pedidos…"
                      className={gp.input}
                    />
                    <span className="mt-1 block text-xs text-[var(--gp-text-muted)]">
                      Identificador remoto de la sección (ruta o slug).
                    </span>
                  </label>
                  <SectionMaxRecordsLimitField
                    key={editingSection.id}
                    defaultLimit={editingSection.max_records_limit}
                  />
                </Modal.Body>
                <Modal.Footer className="shrink-0">
                  <Button variant="secondary" slot="close">
                    Cancelar
                  </Button>
                  <Button type="submit" isDisabled={sectionSubmitting}>
                    {sectionSubmitting ? <Spinner size="sm" /> : "Guardar"}
                  </Button>
                </Modal.Footer>
              </form>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>

    {managingCapabilitiesSection ? (
      <SectionCapabilitiesPanel
        section={managingCapabilitiesSection}
        open
        onClose={() => setManagingCapabilitiesSection(null)}
        onCapabilitiesChange={(capabilities) =>
          updateSectionCapabilities(
            managingCapabilitiesSection.id,
            capabilities,
          )
        }
      />
    ) : null}

    <Modal state={sectionDeleteState}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Eliminar sección</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className={gp.subtitle}>
                ¿Eliminar la sección <strong>{deletingSection?.name}</strong>?
                {deletingSection?.max_records_limit != null ? (
                  <>
                    <br />
                    <span className="mt-2 inline-block">
                      Tiene un límite de{" "}
                      {deletingSection.max_records_limit.toLocaleString(
                        "es-PE",
                      )}{" "}
                      registros configurado.
                    </span>
                  </>
                ) : null}
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" slot="close">
                Cancelar
              </Button>
              <Button
                className="bg-red-600 text-white"
                onPress={handleDeleteSection}
                isDisabled={sectionSubmitting}
              >
                {sectionSubmitting ? <Spinner size="sm" /> : "Eliminar"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  </>
  );
}

function GlobalTab({
  module,
  globalLabel,
  globalStyle,
  busyKey,
  onModuleChange,
  onSectionChange,
  onCapabilities,
  onEditSection,
  onDeleteSection,
}: {
  module: Module;
  globalLabel: string;
  globalStyle: { chip: string; dot: string };
  busyKey: string | null;
  onModuleChange: (s: LifecycleStatus) => void;
  onSectionChange: (sec: Section, s: LifecycleStatus) => void;
  onCapabilities: (sec: Section) => void;
  onEditSection: (sec: Section) => void;
  onDeleteSection: (sec: Section) => void;
}) {
  return (
    <div className="space-y-4">
      <Alert status="warning">
        <Alert.Description className="text-xs">
          Cambiar el catálogo global resetea todos los overrides por app de este
          módulo. Usá la pestaña &quot;Por app&quot; para afinar sin tocar el
          resto.
        </Alert.Description>
      </Alert>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: "var(--gp-border)" }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--gp-text)]">
              Módulo completo
            </p>
            <p className="text-xs text-[var(--gp-text-muted)]">
              Default para todas las apps
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${globalStyle.chip}`}
          >
            <span className={`size-1.5 rounded-full ${globalStyle.dot}`} />
            {globalLabel}
          </span>
        </div>
        <LifecycleStatusSelect
          value={normalizeLifecycleStatus(module.status)}
          onChange={onModuleChange}
          aria-label={`Estado global de ${module.name}`}
          busy={busyKey === "global-module"}
        />
      </div>

      {module.sections.length > 0 ? (
        <SectionStatusTable
          rows={module.sections.map((sec) => ({
            id: sec.id,
            name: sec.name,
            key: sec.key,
            level: "global" as const,
            status: normalizeLifecycleStatus(sec.status),
            inheritLabel: "",
            override: null as LifecycleStatus | null,
            effective: normalizeLifecycleStatus(sec.status),
            section: sec,
          }))}
          busyKey={busyKey}
          onGlobalChange={onSectionChange}
          onCapabilities={onCapabilities}
          onEditSection={onEditSection}
          onDeleteSection={onDeleteSection}
        />
      ) : (
        <p className="text-sm text-[var(--gp-text-muted)]">Sin secciones.</p>
      )}
    </div>
  );
}

function AppTab({
  deploymentApps,
  assignedIds,
  selectedAppId,
  selectedApp,
  selectedAssigned,
  module,
  moduleAppOverride,
  moduleInheritLabel,
  sectionOverrides,
  busyKey,
  onSelectApp,
  onToggleAssignment,
  onModuleAppStatus,
  onSectionAppStatus,
  onCapabilities,
  onEditSection,
  onDeleteSection,
}: {
  deploymentApps: Array<{ id: number; name: string | null; kind?: AppKind | null }>;
  assignedIds: Set<number>;
  selectedAppId: number | null;
  selectedApp?: { id: number; name: string | null; kind?: AppKind | null };
  selectedAssigned: boolean;
  module: Module;
  moduleAppOverride: LifecycleStatus | null;
  moduleInheritLabel: string;
  sectionOverrides: Map<number, LifecycleStatus | null>;
  busyKey: string | null;
  onSelectApp: (id: number) => void;
  onToggleAssignment: (id: number, assign: boolean) => void;
  onModuleAppStatus: (appId: number, value: string) => void;
  onSectionAppStatus: (sectionId: number, appId: number, value: string) => void;
  onCapabilities: (sec: Section) => void;
  onEditSection: (sec: Section) => void;
  onDeleteSection: (sec: Section) => void;
}) {
  const moduleEffective = moduleAppOverride ?? normalizeLifecycleStatus(module.status);

  const rows = module.sections.map((sec) => {
    const catalog = normalizeLifecycleStatus(sec.status);
    const override =
      selectedAppId != null
        ? sectionOverrides.get(sec.id) ?? null
        : null;
    const effective = effectiveSectionStatusForApp(
      catalog,
      override,
      moduleAppOverride,
    );
    const inheritLabel =
      LIFECYCLE_STATUS_LABELS[
        effectiveSectionStatusForApp(catalog, null, moduleAppOverride)
      ];
    return {
      id: sec.id,
      name: sec.name,
      key: sec.key,
      level: "section" as const,
      status: catalog,
      inheritLabel,
      override,
      effective,
      section: sec,
    };
  });

  return (
    <div className="flex min-h-0 flex-col gap-3 sm:flex-row sm:gap-4">
      <div
        className="max-h-[min(28vh,220px)] w-full shrink-0 overflow-y-auto rounded-xl border p-2 sm:max-h-none sm:w-40"
        style={{ borderColor: "var(--gp-border)" }}
      >
        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]">
          Apps
        </p>
        {deploymentApps.length === 0 ? (
          <p className="px-2 text-xs text-[var(--gp-text-muted)]">Sin apps</p>
        ) : (
          deploymentApps.map((app) => {
            const assigned = assignedIds.has(app.id);
            const active = selectedAppId === app.id;
            return (
              <div
                key={app.id}
                className={`rounded-lg border transition ${
                  active
                    ? "border-[var(--gp-primary)]/45 bg-[color-mix(in_srgb,var(--gp-primary)_16%,transparent)]"
                    : "border-transparent hover:bg-[var(--gp-surface-muted)]"
                }`}
              >
                <button
                  type="button"
                  className="w-full px-2 py-2 text-left"
                  onClick={() => onSelectApp(app.id)}
                >
                  <p className="truncate text-xs font-semibold text-[var(--gp-text)]">
                    {app.name || `App #${app.id}`}
                    {app.kind === "mobile" ? (
                      <span className="ml-1 rounded bg-emerald-500/15 px-1 py-0.5 text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                        Móvil
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[10px] text-[var(--gp-text-muted)]">
                    {assigned ? "Asignado" : "Sin asignar"}
                  </p>
                </button>
                <label
                  className="flex cursor-pointer items-center gap-2 border-t px-2 py-1.5 text-[10px] text-[var(--gp-text-muted)]"
                  style={{ borderColor: "var(--gp-border)" }}
                >
                  <input
                    type="checkbox"
                    checked={assigned}
                    disabled={busyKey === `assign-${app.id}`}
                    onChange={(e) =>
                      void onToggleAssignment(app.id, e.target.checked)
                    }
                    className="size-3.5 rounded"
                  />
                  Incluir módulo
                </label>
              </div>
            );
          })
        )}
      </div>

      <div className="min-h-0 min-w-0 flex-1 space-y-3">
        {!selectedApp ? (
          <div className={`${gp.empty} py-8 sm:py-12`}>
            <p className="text-sm text-[var(--gp-text-muted)]">
              Elegí una app de la lista
            </p>
          </div>
        ) : !selectedAssigned ? (
          <div className={`${gp.empty} py-8 sm:py-12`}>
            <p className="text-sm font-medium text-[var(--gp-text)]">
              Módulo no asignado
            </p>
            <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
              Marcá &quot;Incluir módulo&quot; en {selectedApp.name || "la app"}{" "}
              para configurar estados.
            </p>
          </div>
        ) : (
          <>
            <div
              className="flex flex-col gap-3 rounded-xl border bg-[color-mix(in_srgb,var(--gp-primary)_10%,transparent)] px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4"
              style={{ borderColor: "var(--gp-border)" }}
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold uppercase tracking-wide text-[var(--gp-primary)]">
                  Módulo · {selectedApp.name}
                </p>
                <p className="text-[11px] text-[var(--gp-text-muted)]">
                  Aplica a todas las secciones sin override propio
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <EffectiveBadge status={moduleEffective} />
                <LifecycleStatusInheritSelect
                  value={moduleAppOverride}
                  inheritLabel={moduleInheritLabel}
                  busy={busyKey === `mod-${selectedAppId}`}
                  aria-label={`Estado del módulo en ${selectedApp.name}`}
                  className="w-full min-w-0 sm:w-auto"
                  onChange={(v) =>
                    selectedAppId != null && onModuleAppStatus(selectedAppId, v)
                  }
                />
              </div>
            </div>

            {module.sections.length > 0 ? (
              <SectionStatusTable
                rows={rows}
                busyKey={busyKey}
                appId={selectedAppId!}
                onSectionAppStatus={onSectionAppStatus}
                onCapabilities={onCapabilities}
                onEditSection={onEditSection}
                onDeleteSection={onDeleteSection}
              />
            ) : (
              <p className="text-sm text-[var(--gp-text-muted)]">
                Sin secciones en este módulo.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

type StatusRow = {
  id: number;
  name: string;
  key: string | null;
  level: "global" | "section";
  status: LifecycleStatus;
  inheritLabel: string;
  override: LifecycleStatus | null;
  effective: LifecycleStatus;
  section: Section;
};

function SectionStatusTable({
  rows,
  busyKey,
  appId,
  onGlobalChange,
  onSectionAppStatus,
  onCapabilities,
  onEditSection,
  onDeleteSection,
}: {
  rows: StatusRow[];
  busyKey: string | null;
  appId?: number;
  onGlobalChange?: (sec: Section, s: LifecycleStatus) => void;
  onSectionAppStatus?: (sectionId: number, appId: number, value: string) => void;
  onCapabilities?: (sec: Section) => void;
  onEditSection?: (sec: Section) => void;
  onDeleteSection?: (sec: Section) => void;
}) {
  const isAppMode = appId != null;
  const gridCols = isAppMode
    ? "grid-cols-[minmax(0,1fr)_72px_130px_72px]"
    : "grid-cols-[minmax(0,1fr)_130px_72px]";

  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{ borderColor: "var(--gp-border)" }}
    >
      <div
        className={`grid ${gridCols} items-center gap-x-2 border-b bg-[var(--gp-surface-muted)]/60 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]`}
      >
        <span>Sección</span>
        {isAppMode ? <span className="text-center">Efectivo</span> : null}
        <span className="text-right">{isAppMode ? "Configurar" : "Estado"}</span>
        <span className="text-center">Acciones</span>
      </div>
      <div className="max-h-[min(42dvh,380px)] overflow-y-auto overflow-x-auto">
        {rows.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-[var(--gp-text-muted)]">
            Sin secciones
          </p>
        ) : (
          rows.map((row, index) => {
            const caps = row.section.capabilities ?? [];
            const activeCaps = caps.filter((c) => c.is_active).length;

            return (
              <div
                key={row.id}
                className={`grid ${gridCols} items-center gap-x-2 border-b px-2.5 py-2 last:border-b-0 ${
                  index % 2 === 1 ? "bg-[var(--gp-surface-muted)]/25" : ""
                } hover:bg-[color-mix(in_srgb,var(--gp-primary)_8%,transparent)]`}
                style={{ borderColor: "var(--gp-border)" }}
              >
                <div className="min-w-[140px]">
                  <p className="truncate text-xs font-semibold text-[var(--gp-text)]">
                    {row.name}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {row.key ? (
                      <span className="truncate font-mono text-[9px] text-[var(--gp-text-muted)]">
                        {row.key}
                      </span>
                    ) : null}
                    <SectionLimitBadge limit={row.section.max_records_limit} />
                    <span className="text-[9px] text-[var(--gp-text-muted)]">
                      {caps.length === 0
                        ? "0 caps"
                        : `${activeCaps}/${caps.length}`}
                    </span>
                  </div>
                </div>
                {isAppMode ? (
                  <div className="flex justify-center">
                    <EffectiveBadge status={row.effective} compact />
                  </div>
                ) : null}
                <div className="flex justify-end">
                  {isAppMode && onSectionAppStatus ? (
                    <LifecycleStatusInheritSelect
                      value={row.override}
                      inheritLabel={row.inheritLabel}
                      busy={busyKey === `sec-${row.id}`}
                      aria-label={`Estado de ${row.name}`}
                      className="min-w-[118px]"
                      onChange={(v) => onSectionAppStatus(row.id, appId, v)}
                    />
                  ) : onGlobalChange ? (
                    <LifecycleStatusSelect
                      value={row.status}
                      onChange={(s) => onGlobalChange(row.section, s)}
                      aria-label={`Estado global de ${row.name}`}
                      busy={busyKey === `global-sec-${row.id}`}
                    />
                  ) : null}
                </div>
                <div className="flex justify-center gap-0">
                  {onCapabilities ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-w-0 px-1"
                      aria-label={`Capacidades de ${row.name}`}
                      onPress={() => onCapabilities(row.section)}
                    >
                      <Key width={11} height={11} />
                    </Button>
                  ) : null}
                  {onEditSection ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-w-0 px-1"
                      aria-label={`Editar ${row.name}`}
                      onPress={() => onEditSection(row.section)}
                    >
                      <Pencil width={11} height={11} />
                    </Button>
                  ) : null}
                  {onDeleteSection ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-w-0 px-1 text-red-500"
                      aria-label={`Eliminar ${row.name}`}
                      onPress={() => onDeleteSection(row.section)}
                    >
                      <TrashBin width={11} height={11} />
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function EffectiveBadge({
  status,
  compact,
}: {
  status: LifecycleStatus;
  compact?: boolean;
}) {
  const s = normalizeLifecycleStatus(status);
  const style = LIFECYCLE_STATUS_STYLE[s];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${style.chip} ${
        compact
          ? "px-1.5 py-px text-[9px]"
          : "px-2 py-0.5 text-[10px]"
      }`}
    >
      <span className={`rounded-full ${style.dot} ${compact ? "size-1" : "size-1.5"}`} />
      {compact ? (
        <span className="max-w-[52px] truncate">{LIFECYCLE_STATUS_LABELS[s]}</span>
      ) : (
        LIFECYCLE_STATUS_LABELS[s]
      )}
    </span>
  );
}
