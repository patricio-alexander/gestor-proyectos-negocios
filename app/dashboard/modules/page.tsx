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
import type { Module } from "@/src/features/modules/types";
import { useState } from "react";
import LayoutCells from "@gravity-ui/icons/LayoutCells";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Plus from "@gravity-ui/icons/Plus";

export default function ModulesPage() {
  const { modules, loading, create, update, remove } = useModules();
  const [editing, setEditing] = useState<Module | null>(null);
  const [deleting, setDeleting] = useState<Module | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const createState = useOverlayState();
  const editState = useOverlayState();
  const deleteState = useOverlayState();

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await create({
        name: form.get("name") as string,
        key: form.get("key") as string,
      });
      createState.close();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
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
    setError("");
    editState.open();
  }

  function openDelete(mod: Module) {
    setDeleting(mod);
    setError("");
    deleteState.open();
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
              <Modal.Dialog className="sm:max-w-[420px]">
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
                      Ruta / clave
                      <input
                        name="key"
                        required
                        placeholder="Ej: facturacion, inventario, usuarios"
                        className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                      />
                    </label>
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
                    <p className="mt-0.5 font-mono text-xs text-zinc-400">
                      {mod.key}
                    </p>
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
            <Modal.Dialog className="sm:max-w-[420px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Editar módulo</Modal.Heading>
              </Modal.Header>
              <form onSubmit={handleEdit}>
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
