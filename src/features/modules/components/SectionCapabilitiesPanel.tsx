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
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import { useState } from "react";
import type { Capability, Section } from "../types";
import { useCapabilities } from "../hooks/useCapabilities";
import { StatusBadge } from "@/src/shared/components/StatusBadge";
import { gp } from "@/src/shared/ui/theme";

type SectionCapabilitiesPanelProps = {
  section: Section;
  open: boolean;
  onClose: () => void;
  onCapabilitiesChange: (capabilities: Capability[]) => void;
};

export function SectionCapabilitiesPanel({
  section,
  open,
  onClose,
  onCapabilitiesChange,
}: SectionCapabilitiesPanelProps) {
  const { create, update, remove } = useCapabilities();

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editingCapability, setEditingCapability] = useState<Capability | null>(
    null,
  );
  const [deletingCapability, setDeletingCapability] =
    useState<Capability | null>(null);

  const capabilities = section.capabilities ?? [];

  const panelState = useOverlayState({
    isOpen: open,
    onOpenChange: (isOpen) => {
      if (!isOpen) onClose();
    },
  });
  const createState = useOverlayState();
  const editState = useOverlayState();
  const deleteState = useOverlayState();

  function replaceCapability(next: Capability) {
    onCapabilitiesChange(
      capabilities.map((c) => (c.id === next.id ? next : c)),
    );
  }

  function appendCapability(cap: Capability) {
    onCapabilitiesChange([...capabilities, cap]);
  }

  function dropCapability(id: number) {
    onCapabilitiesChange(capabilities.filter((c) => c.id !== id));
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const cap = await create({
        section_id: section.id,
        code: form.get("code") as string,
        name: form.get("name") as string,
      });
      appendCapability(cap);
      createState.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingCapability) return;
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const cap = await update(editingCapability.id, {
        name: form.get("name") as string,
      });
      replaceCapability(cap);
      editState.close();
      setEditingCapability(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(cap: Capability) {
    setError("");
    setTogglingId(cap.id);
    try {
      const next = await update(cap.id, { is_active: !cap.is_active });
      replaceCapability(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deletingCapability) return;
    setError("");
    setSubmitting(true);
    try {
      await remove(deletingCapability.id);
      dropCapability(deletingCapability.id);
      deleteState.close();
      setDeletingCapability(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const activeCount = capabilities.filter((c) => c.is_active).length;

  return (
    <>
      <Modal state={panelState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="flex max-h-[min(92dvh,720px)] w-[calc(100vw-2rem)] max-w-2xl flex-col overflow-hidden">
              <Modal.CloseTrigger />
              <Modal.Header className="shrink-0">
                <Modal.Icon className="bg-default text-foreground">
                  <Key width={20} height={20} />
                </Modal.Icon>
                <Modal.Heading className="truncate">Capacidades · {section.name}</Modal.Heading>
                <p className="text-sm text-[var(--gp-text-muted)]">
                  {capabilities.length === 0
                    ? "Sin capacidades configuradas"
                    : `${activeCount} activa${activeCount === 1 ? "" : "s"} de ${capabilities.length}`}
                </p>
              </Modal.Header>

              <Modal.Body className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                {error && (
                  <Alert status="danger">
                    <Alert.Description>{error}</Alert.Description>
                  </Alert>
                )}

                {capabilities.length === 0 ? (
                  <div className={`${gp.empty} py-8`}>
                    <p className="text-sm font-medium text-[var(--gp-text)]">
                      Sin capacidades todavía
                    </p>
                    <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
                      Agregá capacidades como exportar PDF o Excel para controlar
                      el acceso remoto.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[min(50vh,420px)] overflow-auto rounded-xl border">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="sticky top-0 z-10">
                        <tr
                          className="border-b text-xs uppercase tracking-wide"
                          style={{
                            color: "var(--gp-text-muted)",
                            borderColor: "var(--gp-border)",
                            backgroundColor: "var(--gp-table-head)",
                          }}
                        >
                          <th className="px-5 py-2.5 font-medium">Código</th>
                          <th className="px-5 py-2.5 font-medium">Nombre</th>
                          <th className="px-5 py-2.5 font-medium">Estado</th>
                          <th className="w-36 px-5 py-2.5 font-medium text-right">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {capabilities.map((cap) => (
                          <tr
                            key={cap.id}
                            className="border-b last:border-none"
                            style={{ borderColor: "var(--gp-border)" }}
                          >
                            <td className="px-5 py-3">
                              <code className="rounded bg-[var(--gp-surface-muted)] px-1.5 py-0.5 text-xs">
                                {cap.code}
                              </code>
                            </td>
                            <td className="px-5 py-3 font-medium">{cap.name}</td>
                            <td className="px-5 py-3">
                              <StatusBadge
                                label={cap.is_active ? "Activa" : "Inactiva"}
                                tone={cap.is_active ? "success" : "neutral"}
                              />
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant={cap.is_active ? "secondary" : "primary"}
                                  onPress={() => handleToggleActive(cap)}
                                  isDisabled={togglingId === cap.id}
                                >
                                  {togglingId === cap.id ? (
                                    <Spinner size="sm" />
                                  ) : cap.is_active ? (
                                    "Desactivar"
                                  ) : (
                                    "Activar"
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  aria-label={`Editar ${cap.name}`}
                                  onPress={() => {
                                    setEditingCapability(cap);
                                    setError("");
                                    editState.open();
                                  }}
                                >
                                  <Pencil width={12} height={12} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-500"
                                  aria-label={`Eliminar ${cap.name}`}
                                  onPress={() => {
                                    setDeletingCapability(cap);
                                    setError("");
                                    deleteState.open();
                                  }}
                                >
                                  <TrashBin width={12} height={12} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Modal.Body>

              <Modal.Footer className="shrink-0">
                <Button variant="secondary" slot="close">
                  Cerrar
                </Button>
                <Modal state={createState}>
                  <Button>
                    <CirclePlus width={14} height={14} />
                    Nueva capacidad
                  </Button>
                  <Modal.Backdrop>
                    <Modal.Container>
                      <Modal.Dialog className="sm:max-w-md">
                        <Modal.CloseTrigger />
                        <Modal.Header>
                          <Modal.Heading>Nueva capacidad</Modal.Heading>
                          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
                            En {section.name}
                          </p>
                        </Modal.Header>
                        <form onSubmit={handleCreate}>
                          <Modal.Body className="space-y-4">
                            {error && (
                              <Alert status="danger">
                                <Alert.Description>{error}</Alert.Description>
                              </Alert>
                            )}
                            <label className={gp.label}>
                              Código
                              <input
                                name="code"
                                required
                                placeholder="Ej: export_pdf, export_excel"
                                className={gp.input}
                                pattern="[a-zA-Z0-9_]+"
                                title="Solo letras, números y guiones bajos"
                              />
                              <span className="mt-1 block text-xs text-[var(--gp-text-muted)]">
                                Identificador estable para el cliente remoto.
                              </span>
                            </label>
                            <label className={gp.label}>
                              Nombre
                              <input
                                name="name"
                                required
                                placeholder="Ej: Exportar PDF"
                                className={gp.input}
                              />
                            </label>
                          </Modal.Body>
                          <Modal.Footer>
                            <Button variant="secondary" slot="close">
                              Cancelar
                            </Button>
                            <Button type="submit" isDisabled={submitting}>
                              {submitting ? (
                                <Spinner size="sm" />
                              ) : (
                                "Crear capacidad"
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

      <Modal state={editState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Editar capacidad</Modal.Heading>
              </Modal.Header>
              {editingCapability && (
                <form onSubmit={handleEdit}>
                  <Modal.Body className="space-y-4">
                    {error && (
                      <Alert status="danger">
                        <Alert.Description>{error}</Alert.Description>
                      </Alert>
                    )}
                    <label className={gp.label}>
                      Código
                      <input
                        value={editingCapability.code}
                        readOnly
                        className={`${gp.input} opacity-70`}
                      />
                    </label>
                    <label className={gp.label}>
                      Nombre
                      <input
                        name="name"
                        required
                        defaultValue={editingCapability.name}
                        className={gp.input}
                      />
                    </label>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" slot="close">
                      Cancelar
                    </Button>
                    <Button type="submit" isDisabled={submitting}>
                      {submitting ? <Spinner size="sm" /> : "Guardar"}
                    </Button>
                  </Modal.Footer>
                </form>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={deleteState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Eliminar capacidad</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {error && (
                  <Alert status="danger">
                    <Alert.Description>{error}</Alert.Description>
                  </Alert>
                )}
                <p className={gp.subtitle}>
                  ¿Eliminar la capacidad{" "}
                  <strong>{deletingCapability?.name}</strong> (
                  <code>{deletingCapability?.code}</code>)?
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" slot="close">
                  Cancelar
                </Button>
                <Button
                  className="bg-red-600 text-white"
                  onPress={handleDelete}
                  isDisabled={submitting}
                >
                  {submitting ? <Spinner size="sm" /> : "Eliminar"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
