"use client";

import { Alert, Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import { useUsers } from "@/src/features/users/hooks/useUsers";
import type { User } from "@/src/features/users/types";
import { useState } from "react";
import Person from "@gravity-ui/icons/Person";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Plus from "@gravity-ui/icons/Plus";

export default function UsersPage() {
  const { users, loading, create, update, remove } = useUsers();
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
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
        username: form.get("username") as string,
        email: (form.get("email") as string) || undefined,
        password: form.get("password") as string,
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
        username: form.get("username") as string,
        email: (form.get("email") as string) || undefined,
        password: (form.get("password") as string) || undefined,
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

  function openEdit(user: User) {
    setEditing(user);
    setError("");
    editState.open();
  }

  function openDelete(user: User) {
    setDeleting(user);
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
          <Person width={24} height={24} className="text-zinc-700" />
          <h1 className="text-xl font-semibold text-zinc-900">Usuarios</h1>
        </div>

        <Modal state={createState}>
          <Button>
            <Plus width={16} height={16} />
            Nuevo usuario
          </Button>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-105">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Nuevo usuario</Modal.Heading>
                </Modal.Header>
                <form onSubmit={handleCreate}>
                  <Modal.Body className="space-y-4">
                    {error && (
                      <Alert status="danger">
                        <Alert.Description>{error}</Alert.Description>
                      </Alert>
                    )}
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                      Usuario
                      <input
                        name="username"
                        required
                        placeholder="Nombre de usuario"
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
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                      Contraseña
                      <input
                        name="password"
                        type="password"
                        required
                        placeholder="Contraseña"
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

      {users.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 py-16 text-center">
          <Person width={48} height={48} className="text-zinc-300" />
          <p className="text-sm text-zinc-500">
            No hay usuarios registrados todavía
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-zinc-50">
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Usuario
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600">Email</th>
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Creado
                </th>
                <th className="px-4 py-3 font-medium text-zinc-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="px-4 py-3 text-zinc-900">
                    {user.username || "-"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {user.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="cursor-pointer rounded-lg border p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                        aria-label="Editar"
                      >
                        <Pencil width={14} height={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(user)}
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
                <Modal.Heading>Editar usuario</Modal.Heading>
              </Modal.Header>
              <form onSubmit={handleEdit}>
                <Modal.Body className="space-y-4">
                  {error && (
                    <Alert status="danger">
                      <Alert.Description>{error}</Alert.Description>
                    </Alert>
                  )}
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                    Usuario
                    <input
                      name="username"
                      required
                      defaultValue={editing?.username ?? ""}
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
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                    Nueva contraseña
                    <input
                      name="password"
                      type="password"
                      placeholder="Dejar vacío para no cambiar"
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
                <Modal.Heading>Eliminar usuario</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {error && (
                  <Alert status="danger">
                    <Alert.Description>{error}</Alert.Description>
                  </Alert>
                )}
                <p className="text-sm text-zinc-600">
                  ¿Estás seguro de que querés eliminar el usuario{" "}
                  <strong>{deleting?.username}</strong>? Esta acción no
                  eliminará los datos permanentemente, pero dejará de estar
                  visible.
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
