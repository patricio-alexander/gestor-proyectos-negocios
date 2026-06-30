"use client";

import { Alert, Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import ShieldKeyhole from "@gravity-ui/icons/ShieldKeyhole";
import Pencil from "@gravity-ui/icons/Pencil";
import Plus from "@gravity-ui/icons/Plus";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Lock from "@gravity-ui/icons/Lock";
import { useCallback, useState } from "react";
import { useRoles } from "../hooks/useRoles";
import type { RoleRecord } from "../types";
import { ManagerHeader, TableSearchBar } from "@/src/shared/components/TableSearchBar";
import { TablePagination } from "@/src/shared/components/TablePagination";
import { usePaginatedSearch } from "@/src/shared/hooks/usePaginatedSearch";
import { gp } from "@/src/shared/ui/theme";

const PAGE_SIZE = 10;
const SYSTEM_ROLES = new Set(["programador", "admin", "operator"]);

function matchesRoleSearch(role: RoleRecord, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [role.key, role.name, role.description, String(role.user_count ?? "")]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export function RolesManager() {
  const { roles, loading, create, update, remove } = useRoles();
  const [editing, setEditing] = useState<RoleRecord | null>(null);
  const [deleting, setDeleting] = useState<RoleRecord | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const createState = useOverlayState();
  const editState = useOverlayState();
  const deleteState = useOverlayState();

  const filterRoles = useCallback(
    (role: RoleRecord, query: string) => matchesRoleSearch(role, query),
    [],
  );

  const {
    search,
    setSearch,
    page,
    setPage,
    paginated: paginatedRoles,
    total: filteredTotal,
  } = usePaginatedSearch(roles, filterRoles, PAGE_SIZE);

  const isSystemRole = (role: RoleRecord) => SYSTEM_ROLES.has(role.key);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await create({
        key: form.get("key") as string,
        name: form.get("name") as string,
        description: (form.get("description") as string) || undefined,
      });
      createState.close();
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
        key: form.get("key") as string,
        name: form.get("name") as string,
        description: (form.get("description") as string) || undefined,
      });
      editState.close();
      setEditing(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
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

  return (
    <div className={gp.page}>
      <ManagerHeader
        title="Roles"
        description="Perfiles de acceso asignables a las cuentas del gestor."
        Icon={ShieldKeyhole}
        action={
          <Modal state={createState}>
            <Button
              style={{
                backgroundColor: "var(--gp-primary)",
                color: "var(--gp-primary-text)",
              }}
            >
              <Plus width={16} height={16} />
              Nuevo rol
            </Button>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog className="sm:max-w-lg">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Nuevo rol</Modal.Heading>
                  </Modal.Header>
                  <form onSubmit={handleCreate}>
                    <Modal.Body className="space-y-4">
                      {error && (
                        <Alert status="danger">
                          <Alert.Description>{error}</Alert.Description>
                        </Alert>
                      )}
                      <label className={gp.label}>
                        Clave
                        <input name="key" required placeholder="support" className={gp.input} />
                      </label>
                      <label className={gp.label}>
                        Nombre
                        <input name="name" required placeholder="Soporte" className={gp.input} />
                      </label>
                      <label className={gp.label}>
                        Descripción
                        <textarea name="description" rows={2} className={gp.textarea} />
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
        }
      />

      <TableSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar por clave, nombre o descripción…"
        total={filteredTotal}
        totalLabel={`rol${filteredTotal === 1 ? "" : "es"}`}
      />

      <div className={gp.tableWrap}>
        <table className={gp.table}>
          <thead>
            <tr>
              <th>Clave</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Usuarios</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRoles.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center">
                  <p className={gp.subtitle}>
                    {search.trim()
                      ? "No hay roles que coincidan con la búsqueda."
                      : "Aún no hay roles registrados."}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedRoles.map((role) => {
                const locked = isSystemRole(role);
                return (
                  <tr key={role.id} className={locked ? "gp-table-row-locked" : undefined}>
                    <td className="font-mono text-sm">
                      {role.key}
                      {locked && <span className="gp-badge-self">Sistema</span>}
                    </td>
                    <td className="font-medium">{role.name}</td>
                    <td>{role.description || "—"}</td>
                    <td>{role.user_count ?? 0}</td>
                    <td>
                      <div className="gp-table-actions">
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Editar ${role.name}`}
                          onPress={() => {
                            setEditing(role);
                            setError("");
                            editState.open();
                          }}
                        >
                          <Pencil width={14} height={14} />
                        </Button>
                        {locked ? (
                          <span
                            className="inline-flex h-8 w-8 items-center justify-center"
                            title="Rol del sistema: no se puede eliminar"
                          >
                            <Lock width={14} height={14} style={{ color: "var(--gp-text-faint)" }} />
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Eliminar ${role.name}`}
                            className="text-red-500"
                            onPress={() => {
                              setDeleting(role);
                              setError("");
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
                <Modal.Heading>Editar rol</Modal.Heading>
              </Modal.Header>
              {editing && (
                <form onSubmit={handleEdit}>
                  <Modal.Body className="space-y-4">
                    {error && (
                      <Alert status="danger">
                        <Alert.Description>{error}</Alert.Description>
                      </Alert>
                    )}
                    <label className={gp.label}>
                      Clave
                      <input
                        name="key"
                        required
                        defaultValue={editing.key}
                        disabled={isSystemRole(editing)}
                        className={gp.input}
                      />
                    </label>
                    <label className={gp.label}>
                      Nombre
                      <input name="name" required defaultValue={editing.name} className={gp.input} />
                    </label>
                    <label className={gp.label}>
                      Descripción
                      <textarea
                        name="description"
                        rows={2}
                        defaultValue={editing.description ?? ""}
                        className={gp.textarea}
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
                <Modal.Heading>Eliminar rol</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {error && (
                  <Alert status="danger">
                    <Alert.Description>{error}</Alert.Description>
                  </Alert>
                )}
                <p className={gp.subtitle}>
                  ¿Eliminar el rol <strong>{deleting?.name}</strong>?
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
