"use client";

import { Alert, Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import { useBusinesses } from "@/src/features/businesses/hooks/useBusinesses";
import type { Business } from "@/src/features/businesses/types";
import { useState } from "react";
import Briefcase from "@gravity-ui/icons/Briefcase";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Plus from "@gravity-ui/icons/Plus";

export default function BusinessesPage() {
  const { businesses, loading, create, update, remove } = useBusinesses();
  const [editing, setEditing] = useState<Business | null>(null);
  const [deleting, setDeleting] = useState<Business | null>(null);
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
        owner_name: (form.get("owner_name") as string) || undefined,
        phone: (form.get("phone") as string) || undefined,
        ruc: (form.get("ruc") as string) || undefined,
        address: (form.get("address") as string) || undefined,
        email: (form.get("email") as string) || undefined,
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
        owner_name: (form.get("owner_name") as string) || undefined,
        phone: (form.get("phone") as string) || undefined,
        ruc: (form.get("ruc") as string) || undefined,
        address: (form.get("address") as string) || undefined,
        email: (form.get("email") as string) || undefined,
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

  function openEdit(business: Business) {
    setEditing(business);
    setError("");
    editState.open();
  }

  function openDelete(business: Business) {
    setDeleting(business);
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
          <Briefcase width={24} height={24} className="text-zinc-700" />
          <h1 className="text-xl font-semibold text-zinc-900">Negocios</h1>
        </div>

        <Modal state={createState}>
          <Button>
            <Plus width={16} height={16} />
            Nuevo negocio
          </Button>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-105">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Nuevo negocio</Modal.Heading>
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
                        placeholder="Nombre del negocio"
                        className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                      Titular
                      <input
                        name="owner_name"
                        placeholder="Nombre del titular (opcional)"
                        className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                      Teléfono
                      <input
                        name="phone"
                        placeholder="Teléfono (opcional)"
                        className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                      RUC
                      <input
                        name="ruc"
                        placeholder="RUC (opcional)"
                        className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                      Dirección
                      <input
                        name="address"
                        placeholder="Dirección (opcional)"
                        className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                      Email
                      <input
                        name="email"
                        type="email"
                        placeholder="Email (opcional)"
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

      {businesses.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 py-16 text-center">
          <Briefcase width={48} height={48} className="text-zinc-300" />
          <p className="text-sm text-zinc-500">
            No hay negocios registrados todavía
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-zinc-50">
                <th className="px-4 py-3 font-medium text-zinc-600">Nombre</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Hash</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Titular</th>
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Teléfono
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600">RUC</th>
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Dirección
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600">Email</th>
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((business) => (
                <tr key={business.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-zinc-900">
                    {business.name || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-zinc-500">
                      {business.hash}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {business.owner_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {business.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {business.ruc || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {business.address || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {business.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(business)}
                        className="cursor-pointer rounded-lg border p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                        aria-label="Editar"
                      >
                        <Pencil width={14} height={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(business)}
                        className="cursor-pointer rounded-lg border p-1.5 text-red-600 transition-colors hover:bg-red-50"
                        aria-label="Eliminar"
                      >
                        <TrashBin width={14} height={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal state={editState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[420px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Editar negocio</Modal.Heading>
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
                    Titular
                    <input
                      name="owner_name"
                      defaultValue={editing?.owner_name ?? ""}
                      className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                    Teléfono
                    <input
                      name="phone"
                      defaultValue={editing?.phone ?? ""}
                      className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                    RUC
                    <input
                      name="ruc"
                      defaultValue={editing?.ruc ?? ""}
                      className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                    Dirección
                    <input
                      name="address"
                      defaultValue={editing?.address ?? ""}
                      className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                    Email
                    <input
                      name="email"
                      type="email"
                      defaultValue={editing?.email ?? ""}
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
                <Modal.Heading>Eliminar negocio</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {error && (
                  <Alert status="danger">
                    <Alert.Description>{error}</Alert.Description>
                  </Alert>
                )}
                <p className="text-sm text-zinc-600">
                  ¿Estás seguro de que querés eliminar el negocio{" "}
                  <strong>{deleting?.name}</strong>? Esta acción no eliminará
                  los datos permanentemente, pero dejará de estar visible.
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
