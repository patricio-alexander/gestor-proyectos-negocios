"use client";

import {
  Alert,
  Button,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import CirclePlus from "@gravity-ui/icons/CirclePlus";
import Key from "@gravity-ui/icons/Key";
import Layers from "@gravity-ui/icons/Layers";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import { useState } from "react";
import type { Capability, LifecycleStatus, Module, Section } from "../types";
import { normalizeLifecycleStatus } from "../types";
import { gp } from "@/src/shared/ui/theme";
import { apiUrl } from "@/src/utils/apiUrl";
import { SectionLimitBadge, SectionLimitSummary } from "./SectionLimitBadge";
import { SectionMaxRecordsLimitField } from "./SectionMaxRecordsLimitField";
import { SectionCapabilitiesPanel } from "./SectionCapabilitiesPanel";
import { LifecycleStatusSelect } from "./LifecycleStatusSelect";
import { StatusOverridesPanel } from "./StatusOverridesPanel";

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

type ModuleSectionsPanelProps = {
  module: Module;
  open: boolean;
  onClose: () => void;
  onModuleUpdate: (module: Module) => void;
};

export function ModuleSectionsPanel({
  module,
  open,
  onClose,
  onModuleUpdate,
}: ModuleSectionsPanelProps) {
  const [sectionError, setSectionError] = useState("");
  const [sectionSubmitting, setSectionSubmitting] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);
  const [managingCapabilitiesSection, setManagingCapabilitiesSection] =
    useState<Section | null>(null);

  const sectionsState = useOverlayState({
    isOpen: open,
    onOpenChange: (isOpen) => {
      if (!isOpen) onClose();
    },
  });
  const sectionCreateState = useOverlayState();
  const sectionEditState = useOverlayState();
  const sectionDeleteState = useOverlayState();

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

  async function handleChangeSectionStatus(
    sec: Section,
    nextStatus: LifecycleStatus,
  ) {
    updateSections((sections) =>
      sections.map((s) =>
        s.id === sec.id ? { ...s, status: nextStatus } : s,
      ),
    );
    setSectionError("");
    try {
      const res = await fetch(apiUrl(`/api/sections/${sec.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar sección");
      const {
        push_ok: _ok,
        push_skipped: _skipped,
        push_error: pushError,
        ...sectionData
      } = data;
      updateSections((sections) =>
        sections.map((s) =>
          s.id === sec.id ? { ...s, ...sectionData } : s,
        ),
      );
      if (pushError) {
        setSectionError(
          `Estado global guardado, pero no se pudo sync a las apps: ${pushError}`,
        );
      }
    } catch (err) {
      setSectionError(
        err instanceof Error ? err.message : "Error al actualizar sección",
      );
      updateSections((sections) =>
        sections.map((s) =>
          s.id === sec.id ? { ...s, status: sec.status } : s,
        ),
      );
    }
  }

  async function handleCreateSection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSectionError("");
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
    } catch (err) {
      setSectionError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSectionSubmitting(false);
    }
  }

  async function handleEditSection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingSection) return;
    setSectionError("");
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
      setSectionError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSectionSubmitting(false);
    }
  }

  async function handleDeleteSection() {
    if (!deletingSection) return;
    setSectionError("");
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
      setSectionError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setSectionSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <Modal state={sectionsState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-2xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-default text-foreground">
                  <Layers width={20} height={20} />
                </Modal.Icon>
                <Modal.Heading>Secciones · {module.name}</Modal.Heading>
                <SectionLimitSummary sections={module.sections} />
              </Modal.Header>

              <Modal.Body className="space-y-4">
                {module.sections.length === 0 ? (
                  <div className={`${gp.empty} py-8`}>
                    <p className="text-sm font-medium text-[var(--gp-text)]">
                      Sin secciones todavía
                    </p>
                    <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
                      Creá la primera sección para definir límites y capacidades
                      remotas.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[min(50vh,420px)] overflow-auto rounded-xl border">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="sticky top-0 z-10">
                        <tr
                          className="border-b text-xs uppercase tracking-wide"
                          style={{
                            color: "var(--gp-text-muted)",
                            borderColor: "var(--gp-border)",
                            backgroundColor: "var(--gp-table-head)",
                          }}
                        >
                          <th className="px-5 py-2.5 font-medium">Sección</th>
                          <th className="px-5 py-2.5 font-medium">Key</th>
                          <th className="px-5 py-2.5 font-medium">Estado</th>
                          <th className="px-5 py-2.5 font-medium">
                            Límite remoto
                          </th>
                          <th className="px-5 py-2.5 font-medium">
                            Capacidades
                          </th>
                          <th className="w-36 px-5 py-2.5 font-medium text-right">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {module.sections.map((sec) => {
                          const caps = sec.capabilities ?? [];
                          const activeCaps = caps.filter((c) => c.is_active).length;

                          return (
                            <tr
                              key={sec.id}
                              className="border-b last:border-none"
                              style={{ borderColor: "var(--gp-border)" }}
                            >
                              <td className="px-5 py-3 font-medium">{sec.name}</td>
                              <td className="px-5 py-3">
                                {sec.key ? (
                                  <code className="rounded bg-[var(--gp-surface-muted)] px-1.5 py-0.5 text-xs text-[var(--gp-text-muted)]">
                                    {sec.key}
                                  </code>
                                ) : (
                                  <span className="text-xs text-[var(--gp-text-muted)]">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3">
                                <div className="min-w-[12rem] space-y-2">
                                  <div>
                                    <span className="mb-0.5 block text-[9px] font-medium uppercase text-[var(--gp-text-muted)]">
                                      Global
                                    </span>
                                    <LifecycleStatusSelect
                                      value={normalizeLifecycleStatus(sec.status)}
                                      onChange={(next) =>
                                        handleChangeSectionStatus(sec, next)
                                      }
                                      aria-label={`Estado global de ${sec.name}`}
                                    />
                                  </div>
                                  <StatusOverridesPanel
                                    kind="section"
                                    entityId={sec.id}
                                    globalStatus={normalizeLifecycleStatus(
                                      sec.status,
                                    )}
                                    apps={module.apps_using ?? []}
                                    onError={setSectionError}
                                    compact
                                  />
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <SectionLimitBadge limit={sec.max_records_limit} />
                              </td>
                              <td className="px-5 py-3">
                                <span className="text-xs text-[var(--gp-text-muted)]">
                                  {caps.length === 0
                                    ? "Sin capacidades"
                                    : `${activeCaps}/${caps.length} activas`}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    aria-label={`Capacidades de ${sec.name}`}
                                    onPress={() => {
                                      setManagingCapabilitiesSection(sec);
                                      setSectionError("");
                                    }}
                                  >
                                    <Key width={12} height={12} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    aria-label={`Editar ${sec.name}`}
                                    onPress={() => {
                                      setEditingSection(sec);
                                      setSectionError("");
                                      sectionEditState.open();
                                    }}
                                  >
                                    <Pencil width={12} height={12} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500"
                                    aria-label={`Eliminar ${sec.name}`}
                                    onPress={() => {
                                      setDeletingSection(sec);
                                      setSectionError("");
                                      sectionDeleteState.open();
                                    }}
                                  >
                                    <TrashBin width={12} height={12} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Modal.Body>

              <Modal.Footer>
                <Button variant="secondary" slot="close">
                  Cerrar
                </Button>
                <Modal state={sectionCreateState}>
                  <Button>
                    <CirclePlus width={14} height={14} />
                    Nueva sección
                  </Button>
                  <Modal.Backdrop>
                    <Modal.Container>
                      <Modal.Dialog className="sm:max-w-md">
                        <Modal.CloseTrigger />
                        <Modal.Header>
                          <Modal.Heading>Nueva sección</Modal.Heading>
                          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
                            En {module.name}
                          </p>
                        </Modal.Header>
                        <form onSubmit={handleCreateSection}>
                          <Modal.Body className="space-y-4">
                            {sectionError && (
                              <Alert status="danger">
                                <Alert.Description>
                                  {sectionError}
                                </Alert.Description>
                              </Alert>
                            )}
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
                          <Modal.Footer>
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
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={sectionEditState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Editar sección</Modal.Heading>
              </Modal.Header>
              {editingSection && (
                <form onSubmit={handleEditSection}>
                  <Modal.Body className="space-y-4">
                    {sectionError && (
                      <Alert status="danger">
                        <Alert.Description>{sectionError}</Alert.Description>
                      </Alert>
                    )}
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
                  <Modal.Footer>
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

      {managingCapabilitiesSection && (
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
      )}

      <Modal state={sectionDeleteState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Eliminar sección</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {sectionError && (
                  <Alert status="danger">
                    <Alert.Description>{sectionError}</Alert.Description>
                  </Alert>
                )}
                <p className={gp.subtitle}>
                  ¿Eliminar la sección <strong>{deletingSection?.name}</strong>?
                  {deletingSection?.max_records_limit != null && (
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
                  )}
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
