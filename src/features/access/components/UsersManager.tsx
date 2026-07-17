"use client";

import type { ComponentType } from "react";
import { Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import Persons from "@gravity-ui/icons/Persons";
import Pencil from "@gravity-ui/icons/Pencil";
import Plus from "@gravity-ui/icons/Plus";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Lock from "@gravity-ui/icons/Lock";
import { useCallback, useState } from "react";
import { useAuth } from "@/src/features/auth/hooks/useAuth";
import { useUsers } from "@/src/features/users/hooks/useUsers";
import { useRoles } from "@/src/features/access/hooks/useRoles";
import type { User } from "@/src/features/users/types";
import { ManagerHeader, TableSearchBar } from "@/src/shared/components/TableSearchBar";
import { TablePagination } from "@/src/shared/components/TablePagination";
import { usePaginatedSearch } from "@/src/shared/hooks/usePaginatedSearch";
import { gp } from "@/src/shared/ui/theme";
import { appToast } from "@/src/shared/utils/app-toast";

const PAGE_SIZE = 10;

type UsersManagerProps = {
  title?: string;
  description?: string;
  createLabel?: string;
  entityLabel?: string;
  Icon?: ComponentType<{ width?: number; height?: number; className?: string }>;
};

function RoleCheckboxes({
  roles,
  defaultIds = [],
}: {
  roles: { id: number; name: string }[];
  defaultIds?: number[];
}) {
  const selected = new Set(defaultIds);
  return (
    <fieldset>
      <legend className={`${gp.label} mb-2`}>Roles</legend>
      <div className="flex flex-wrap gap-3">
        {roles.map((role) => (
          <label key={role.id} className={`flex items-center gap-2 text-sm ${gp.subtitle}`}>
            <input
              type="checkbox"
              name="role_ids"
              value={role.id}
              defaultChecked={selected.has(role.id)}
              className="size-4 rounded"
              style={{ borderColor: "var(--gp-input-border)" }}
            />
            {role.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function getRoleIds(form: HTMLFormElement) {
  return Array.from(form.querySelectorAll<HTMLInputElement>('input[name="role_ids"]:checked')).map(
    (el) => Number(el.value),
  );
}

function matchesUserSearch(user: User, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const roleNames = user.roles.map((r) => r.name).join(" ");
  return [user.username, user.display_name, user.email, roleNames]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export function UsersManager({
  title = "Usuarios del gestor",
  description = "Cuentas con acceso al panel de administración.",
  createLabel = "Nuevo usuario",
  entityLabel = "usuario",
  Icon = Persons,
}: UsersManagerProps) {
  const { user: currentUser } = useAuth();
  const { users, loading, create, update, remove } = useUsers();
  const { roles } = useRoles();
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const createState = useOverlayState();
  const editState = useOverlayState();
  const deleteState = useOverlayState();

  const filterUsers = useCallback(
    (user: User, query: string) => matchesUserSearch(user, query),
    [],
  );

  const {
    search,
    setSearch,
    page,
    setPage,
    paginated: paginatedUsers,
    total: filteredTotal,
  } = usePaginatedSearch(users, filterUsers, PAGE_SIZE);

  const isSelf = (user: User) => {
    if (!currentUser) return false;
    if (currentUser.id === user.id) return true;
    const a = currentUser.username?.toLowerCase();
    const b = user.username?.toLowerCase();
    return Boolean(a && b && a === b);
  };

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      await create({
        username: formData.get("username") as string,
        email: (formData.get("email") as string) || undefined,
        display_name: (formData.get("display_name") as string) || undefined,
        password: formData.get("password") as string,
        role_ids: getRoleIds(form),
      });
      createState.close();
      form.reset();
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      await update(editing.id, {
        username: formData.get("username") as string,
        email: (formData.get("email") as string) || undefined,
        display_name: (formData.get("display_name") as string) || undefined,
        password: (formData.get("password") as string) || undefined,
        role_ids: getRoleIds(form),
      });
      editState.close();
      setEditing(null);
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await remove(deleting.id);
      deleteState.close();
      setDeleting(null);
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={`${gp.page} items-center justify-center`}>
        <Spinner size="lg" />
      </div>
    );
  }

  const entityPlural = `${entityLabel}${filteredTotal === 1 ? "" : "s"}`;

  return (
    <div className={gp.page}>
      <ManagerHeader
        title={title}
        description={description}
        Icon={Icon}
        action={
          <Modal state={createState}>
            <Button
              style={{
                backgroundColor: "var(--gp-primary)",
                color: "var(--gp-primary-text)",
              }}
            >
              <Plus width={16} height={16} />
              {createLabel}
            </Button>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog className="sm:max-w-lg">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>{createLabel}</Modal.Heading>
                  </Modal.Header>
                  <form onSubmit={handleCreate}>
                    <Modal.Body className="space-y-4">
                      <label className={gp.label}>
                        Usuario
                        <input name="username" required className={gp.input} />
                      </label>
                      <label className={gp.label}>
                        Nombre visible
                        <input name="display_name" className={gp.input} />
                      </label>
                      <label className={gp.label}>
                        Email
                        <input name="email" type="email" className={gp.input} />
                      </label>
                      <label className={gp.label}>
                        Contraseña
                        <input name="password" type="password" required className={gp.input} />
                      </label>
                      <RoleCheckboxes roles={roles} />
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
        }
      />

      <TableSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar por usuario, nombre, email o rol…"
        total={filteredTotal}
        totalLabel={entityPlural}
      />

      <div className={gp.tableWrap}>
        <table className={gp.table}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Roles</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center">
                  <p className={gp.subtitle}>
                    {search.trim()
                      ? `No hay ${entityPlural} que coincidan con la búsqueda.`
                      : `Aún no hay ${entityPlural} registrados.`}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => {
                const self = isSelf(user);
                return (
                  <tr key={user.id} className={self ? "gp-table-row-locked" : undefined}>
                    <td className="font-medium">
                      @{user.username}
                      {self && <span className="gp-badge-self">Tu sesión</span>}
                    </td>
                    <td>{user.display_name || "—"}</td>
                    <td>{user.email || "—"}</td>
                    <td>
                      {user.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {user.roles.map((role) => (
                            <span key={role.id} className={gp.badge}>
                              {role.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className={gp.subtitle}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="gp-table-actions">
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Editar ${user.username}`}
                          onPress={() => {
                            setEditing(user);
                            editState.open();
                          }}
                        >
                          <Pencil width={14} height={14} />
                        </Button>
                        {self ? (
                          <span
                            className="inline-flex h-8 w-8 items-center justify-center"
                            title="No puedes eliminar tu propia cuenta"
                          >
                            <Lock width={14} height={14} style={{ color: "var(--gp-text-faint)" }} />
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Eliminar ${user.username}`}
                            className="text-red-500"
                            onPress={() => {
                              setDeleting(user);
                              deleteState.open();
                            }}
                          >
                            <TrashBin width={14} height={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <TablePagination
          page={page}
          pageSize={PAGE_SIZE}
          total={filteredTotal}
          onPageChange={setPage}
        />
      </div>

      <Modal state={editState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-lg">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Editar {entityLabel}</Modal.Heading>
              </Modal.Header>
              {editing && (
                <form onSubmit={handleEdit}>
                  <Modal.Body className="space-y-4">
                    <label className={gp.label}>
                      Usuario
                      <input
                        name="username"
                        required
                        defaultValue={editing.username ?? ""}
                        className={gp.input}
                      />
                    </label>
                    <label className={gp.label}>
                      Nombre visible
                      <input
                        name="display_name"
                        defaultValue={editing.display_name ?? ""}
                        className={gp.input}
                      />
                    </label>
                    <label className={gp.label}>
                      Email
                      <input
                        name="email"
                        type="email"
                        defaultValue={editing.email ?? ""}
                        className={gp.input}
                      />
                    </label>
                    <label className={gp.label}>
                      Nueva contraseña (opcional)
                      <input name="password" type="password" className={gp.input} />
                    </label>
                    <RoleCheckboxes roles={roles} defaultIds={editing.roles.map((r) => r.id)} />
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
                <Modal.Heading>Eliminar {entityLabel}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className={gp.subtitle}>
                  ¿Eliminar a <strong>{deleting?.username}</strong>?
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
    </div>
  );
}
