"use client";

import {
  Alert,
  Button,
  Card,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import { useModules } from "@/src/features/modules/hooks/useModules";
import { useBusinesses } from "@/src/features/businesses/hooks/useBusinesses";
import { useSections } from "@/src/features/modules/hooks/useSections";
import type { Module, Section } from "@/src/features/modules/types";
import { useState, useRef, useEffect } from "react";
import LayoutCells from "@gravity-ui/icons/LayoutCells";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Plus from "@gravity-ui/icons/Plus";
import Check from "@gravity-ui/icons/Check";
import Xmark from "@gravity-ui/icons/Xmark";

function SectionInput({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      const name = value.trim();
      if (name) {
        onAdd(name);
        setValue("");
        inputRef.current?.focus();
      }
    }
  }

  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
      Secciones
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribí el nombre del path y presioná Enter"
        className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
      />
    </label>
  );
}

function SectionList({
  sections,
  onEdit,
  onDelete,
  editingId,
  editValue,
  onEditChange,
  onEditSave,
  onEditCancel,
}: {
  sections: Section[];
  onEdit: (s: Section) => void;
  onDelete: (id: number) => void;
  editingId: number | null;
  editValue: string;
  onEditChange: (v: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
}) {
  if (sections.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {sections.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2"
        >
          {editingId === s.id ? (
            <>
              <input
                value={editValue}
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onEditSave();
                  if (e.key === "Escape") onEditCancel();
                }}
                className="min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-900"
                autoFocus
              />
              <button
                type="button"
                onClick={onEditSave}
                className="cursor-pointer rounded p-1 text-green-600 hover:bg-green-50"
              >
                <Check width={14} height={14} />
              </button>
              <button
                type="button"
                onClick={onEditCancel}
                className="cursor-pointer rounded p-1 text-zinc-400 hover:bg-zinc-100"
              >
                <Xmark width={14} height={14} />
              </button>
            </>
          ) : (
            <>
              <span className="flex-1 text-sm text-zinc-700">{s.name}</span>
              <button
                type="button"
                onClick={() => onEdit(s)}
                className="cursor-pointer rounded p-1 text-zinc-400 hover:bg-zinc-100"
              >
                <Pencil width={12} height={12} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(s.id)}
                className="cursor-pointer rounded p-1 text-red-400 hover:bg-red-50"
              >
                <TrashBin width={12} height={12} />
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function CreateSectionsList({
  names,
  onRemove,
}: {
  names: string[];
  onRemove: (i: number) => void;
}) {
  if (names.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {names.map((name, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-700"
        >
          {name}
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="cursor-pointer text-zinc-400 hover:text-red-500"
          >
            <Xmark width={12} height={12} />
          </button>
        </span>
      ))}
    </div>
  );
}

export default function ModulesPage() {
  const { modules, loading, create, update, remove } = useModules();
  const { businesses } = useBusinesses();
  const sectionsHook = useSections();
  const [editing, setEditing] = useState<Module | null>(null);
  const [deleting, setDeleting] = useState<Module | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [newSectionNames, setNewSectionNames] = useState<string[]>([]);

  const [editSectionId, setEditSectionId] = useState<number | null>(null);
  const [editSectionValue, setEditSectionValue] = useState("");

  const createState = useOverlayState();
  const editState = useOverlayState();
  const deleteState = useOverlayState();

  useEffect(() => {
    if (!editState.isOpen) {
      setEditing(null);
      setEditSectionId(null);
      setEditSectionValue("");
      sectionsHook.set([]);
    }
  }, [editState.isOpen]);

  useEffect(() => {
    if (!createState.isOpen) {
      setNewSectionNames([]);
    }
  }, [createState.isOpen]);

  function handleAddSection(name: string) {
    setNewSectionNames((prev) => [...prev, name]);
  }

  function handleRemoveSection(i: number) {
    setNewSectionNames((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const mod = await create({
        name: form.get("name") as string,
        key: form.get("key") as string,
        business_id: Number(form.get("business_id")),
      });

      for (const name of newSectionNames) {
        await sectionsHook.create(name, mod.id);
      }

      createState.close();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await update(editing.id, {
        name: form.get("name") as string,
        key: (form.get("key") as string) || undefined,
      });
      editState.close();
      setEditing(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setError("");
    setSubmitting(true);
    try {
      await remove(deleting.id);
      deleteState.close();
      setDeleting(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(mod: Module) {
    setEditing(mod);
    sectionsHook.set(mod.sections ?? []);
    setError("");
    editState.open();
  }

  function openDelete(mod: Module) {
    setDeleting(mod);
    setError("");
    deleteState.open();
  }

  function handleEditSection(section: Section) {
    setEditSectionId(section.id);
    setEditSectionValue(section.name);
  }

  async function handleSaveEditSection() {
    if (editSectionId === null) return;
    const name = editSectionValue.trim();
    if (!name) return;
    try {
      await sectionsHook.update(editSectionId, name);
      setEditSectionId(null);
      setEditSectionValue("");
    } catch {
      setError("Error al actualizar sección");
    }
  }

  function handleCancelEditSection() {
    setEditSectionId(null);
    setEditSectionValue("");
  }

  async function handleDeleteSection(id: number) {
    try {
      await sectionsHook.remove(id);
    } catch {
      setError("Error al eliminar sección");
    }
  }

  function handleAddExistingSection(name: string) {
    if (!editing) return;
    sectionsHook.create(name, editing.id);
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutCells width={24} height={24} className="text-zinc-700" />
          <h1 className="text-xl font-semibold text-zinc-900">Módulos</h1>
        </div>

        <Modal state={createState}>
          <Button>
            <Plus width={16} height={16} />
            Nuevo módulo
          </Button>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[460px]">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Nuevo módulo</Modal.Heading>
                </Modal.Header>
                <form onSubmit={handleCreate}>
                  <Modal.Body className="space-y-4">
                    {error && (
                      <Alert status="danger">
                        <Alert.Description>{error}</Alert.Description>
                      </Alert>
                    )}
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                      Nombre
                      <input
                        name="name"
                        required
                        placeholder="Nombre del módulo"
                        className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                      Clave
                      <input
                        name="key"
                        required
                        placeholder="Ej: facturacion, inventario, usuarios"
                        className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                      Negocio
                      {businesses.length > 0 ? (
                        <select
                          name="business_id"
                          required
                          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                        >
                          <option value="">Seleccionar negocio</option>
                          {businesses.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm text-zinc-500">
                          No hay negocios disponibles
                        </p>
                      )}
                    </label>
                    <SectionInput onAdd={handleAddSection} />
                    <CreateSectionsList
                      names={newSectionNames}
                      onRemove={handleRemoveSection}
                    />
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" slot="close">
                      Cancelar
                    </Button>
                    <Button type="submit" isDisabled={submitting}>
                      {submitting ? <Spinner size="sm" /> : "Crear"}
                    </Button>
                  </Modal.Footer>
                </form>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </div>

      {modules.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 py-16 text-center">
          <LayoutCells width={48} height={48} className="text-zinc-300" />
          <p className="text-sm text-zinc-500">
            No hay módulos registrados todavía
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <Card key={mod.id}>
              <Card.Header>
                <div className="flex w-full items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <Card.Title>{mod.name || "-"}</Card.Title>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {mod.business_name || "—"}
                    </p>
                    <p className="font-mono text-xs text-zinc-400">{mod.key}</p>
                    {mod.sections && mod.sections.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {mod.sections.map((s) => (
                          <span
                            key={s.id}
                            className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-600"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(mod)}
                      className="cursor-pointer rounded-lg border p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                      aria-label="Editar"
                    >
                      <Pencil width={14} height={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDelete(mod)}
                      className="cursor-pointer rounded-lg border p-1.5 text-red-600 transition-colors hover:bg-red-50"
                      aria-label="Eliminar"
                    >
                      <TrashBin width={14} height={14} />
                    </button>
                  </div>
                </div>
              </Card.Header>
            </Card>
          ))}
        </div>
      )}

      <Modal state={editState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[460px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Editar módulo</Modal.Heading>
              </Modal.Header>
              <form onSubmit={handleEditSubmit}>
                <Modal.Body className="space-y-4">
                  {error && (
                    <Alert status="danger">
                      <Alert.Description>{error}</Alert.Description>
                    </Alert>
                  )}
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                    Nombre
                    <input
                      name="name"
                      required
                      defaultValue={editing?.name ?? ""}
                      className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                    Clave
                    <input
                      name="key"
                      defaultValue={editing?.key ?? ""}
                      placeholder="Identificador único"
                      className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                  </label>
                  <SectionInput onAdd={handleAddExistingSection} />
                  <SectionList
                    sections={sectionsHook.sections}
                    onEdit={handleEditSection}
                    onDelete={handleDeleteSection}
                    editingId={editSectionId}
                    editValue={editSectionValue}
                    onEditChange={setEditSectionValue}
                    onEditSave={handleSaveEditSection}
                    onEditCancel={handleCancelEditSection}
                  />
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
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={deleteState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[400px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Eliminar módulo</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {error && (
                  <Alert status="danger">
                    <Alert.Description>{error}</Alert.Description>
                  </Alert>
                )}
                <p className="text-sm text-zinc-600">
                  ¿Estás seguro de que querés eliminar el módulo{" "}
                  <strong>{deleting?.name}</strong>?
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" slot="close">
                  Cancelar
                </Button>
                <Button
                  className="bg-red-600 text-white"
                  isDisabled={submitting}
                  onPress={handleDelete}
                >
                  {submitting ? <Spinner size="sm" /> : "Eliminar"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
