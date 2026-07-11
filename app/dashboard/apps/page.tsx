"use client";

import {
  Alert,
  Button,
  Modal,
  Spinner,
  Switch,
  useOverlayState,
} from "@heroui/react";
import Briefcase from "@gravity-ui/icons/Briefcase";
import Pencil from "@gravity-ui/icons/Pencil";
import Plus from "@gravity-ui/icons/Plus";
import TrashBin from "@gravity-ui/icons/TrashBin";
import { useState } from "react";
import { useApps } from "@/src/features/apps/hooks/useApps";
import type { App } from "@/src/features/apps/types";
import {
  ManagerHeader,
  TableSearchBar,
} from "@/src/shared/components/TableSearchBar";
import { TablePagination } from "@/src/shared/components/TablePagination";
import { usePaginatedSearch } from "@/src/shared/hooks/usePaginatedSearch";
import { gp } from "@/src/shared/ui/theme";

const PAGE_SIZE = 10;

function matchesAppSearch(app: App, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [app.name, app.owner_name, app.ruc, app.email]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

export default function AppsPage() {
  const { apps, loading, create, update, remove } = useApps();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [deletingApp, setDeletingApp] = useState<App | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const createState = useOverlayState();
  const editState = useOverlayState();
  const deleteState = useOverlayState();

  const filterApps = (app: App, query: string) =>
    matchesAppSearch(app, query);

  const {
    search,
    setSearch,
    page,
    setPage,
    paginated: paginatedApps,
    total: filteredTotal,
  } = usePaginatedSearch(apps, filterApps, PAGE_SIZE);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await create({
        name: form.get("name") as string,
        owner_name: (form.get("owner_name") as string) || null,
        phone: (form.get("phone") as string) || null,
        ruc: (form.get("ruc") as string) || null,
        address: (form.get("address") as string) || null,
        email: (form.get("email") as string) || null,
        path: (form.get("path") as string) || null,
        maintenance: form.get("maintenance") === "on",
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
    if (!editingApp) return;
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await update(editingApp.id, {
        name: form.get("name") as string,
        owner_name: (form.get("owner_name") as string) || null,
        phone: (form.get("phone") as string) || null,
        ruc: (form.get("ruc") as string) || null,
        address: (form.get("address") as string) || null,
        email: (form.get("email") as string) || null,
        path: (form.get("path") as string) || null,
        maintenance: form.get("maintenance") === "on",
      });
      editState.close();
      setEditingApp(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleMantenimiento(app: App) {
    setTogglingIds((prev) => new Set(prev).add(app.id));
    setError("");
    try {
      await update(app.id, { maintenance: !app.maintenance });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar estado");
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(app.id);
        return next;
      });
    }
  }

  async function handleDelete() {
    if (!deletingApp) return;
    setError("");
    setSubmitting(true);
    try {
      await remove(deletingApp.id);
      deleteState.close();
      setDeletingApp(null);
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
        title="Aplicaciones"
        description="Gestioná las aplicaciones registradas en el sistema"
        Icon={Briefcase}
        action={
          <Modal state={createState}>
            <Button
              style={{
                backgroundColor: "var(--gp-primary)",
                color: "var(--gp-primary-text)",
              }}
            >
              <Plus width={16} height={16} />
              Nueva aplicación
            </Button>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog className="sm:max-w-lg">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Nueva aplicación</Modal.Heading>
                  </Modal.Header>
                  <form onSubmit={handleCreate}>
                    <Modal.Body className="space-y-4">
                      {error && (
                        <Alert status="danger">
                          <Alert.Description>{error}</Alert.Description>
                        </Alert>
                      )}
                      <label className={gp.label}>
                        Nombre
                        <input
                          name="name"
                          required
                          placeholder="Nombre de la aplicación"
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Propietario
                        <input
                          name="owner_name"
                          placeholder="Nombre del propietario"
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        RUC
                        <input
                          name="ruc"
                          placeholder="RUC"
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Teléfono
                        <input
                          name="phone"
                          placeholder="Teléfono"
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Email
                        <input
                          name="email"
                          type="email"
                          placeholder="Email"
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Dirección
                        <input
                          name="address"
                          placeholder="Dirección"
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Path de imágenes y videos
                        <input
                          name="path"
                          placeholder="ej: /apps/mi-app/media"
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Nombre de base de datos
                        <input
                          name="database_name"
                          placeholder="ej: gestor_ed_deli"
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        <Switch name="maintenance" size="sm">
                          <Switch.Content>
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                            Maintenance mode
                          </Switch.Content>
                        </Switch>
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
        placeholder="Buscar por nombre, propietario, RUC o email…"
        total={filteredTotal}
        totalLabel="aplicaciones"
      />

      <div className={gp.tableWrap}>
        <table className={gp.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Propietario</th>
              <th>RUC</th>
              <th>Email</th>
              <th>Mantenimiento</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedApps.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <p className={gp.subtitle}>
                    {search.trim()
                      ? "No hay aplicaciones que coincidan con la búsqueda."
                      : "Aún no hay aplicaciones registradas."}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedApps.map((app) => (
                <tr key={app.id}>
                  <td className="font-medium">{app.name || "—"}</td>
                  <td>{app.owner_name || "—"}</td>
                  <td>{app.ruc || "—"}</td>
                  <td>{app.email || "—"}</td>
                  <td>
                    <Switch
                      size="sm"
                      isSelected={app.maintenance}
                      isDisabled={togglingIds.has(app.id)}
                      onChange={() => handleToggleMantenimiento(app)}
                    >
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Content>
                    </Switch>
                  </td>
                  <td>
                    <div className="gp-table-actions">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Editar ${app.name}`}
                        onPress={() => {
                          setEditingApp(app);
                          setError("");
                          editState.open();
                        }}
                      >
                        <Pencil width={14} height={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        aria-label={`Eliminar ${app.name}`}
                        onPress={() => {
                          setDeletingApp(app);
                          setError("");
                          deleteState.open();
                        }}
                      >
                        <TrashBin width={14} height={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
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
                <Modal.Heading>Editar aplicación</Modal.Heading>
              </Modal.Header>
              {editingApp && (
                <form onSubmit={handleEdit}>
                  <Modal.Body className="space-y-4">
                    {error && (
                      <Alert status="danger">
                        <Alert.Description>{error}</Alert.Description>
                      </Alert>
                    )}
                    <label className={gp.label}>
                      Nombre
                      <input
                        name="name"
                        required
                        defaultValue={editingApp.name ?? ""}
                        className={gp.input}
                      />
                    </label>
                    <label className={gp.label}>
                      Propietario
                      <input
                        name="owner_name"
                        defaultValue={editingApp.owner_name ?? ""}
                        className={gp.input}
                      />
                    </label>
                    <label className={gp.label}>
                      RUC
                      <input
                        name="ruc"
                        defaultValue={editingApp.ruc ?? ""}
                        className={gp.input}
                      />
                    </label>
                    <label className={gp.label}>
                      Teléfono
                      <input
                        name="phone"
                        defaultValue={editingApp.phone ?? ""}
                        className={gp.input}
                      />
                    </label>
                    <label className={gp.label}>
                      Email
                      <input
                        name="email"
                        type="email"
                        defaultValue={editingApp.email ?? ""}
                        className={gp.input}
                      />
                    </label>
                      <label className={gp.label}>
                        Dirección
                        <input
                          name="address"
                          defaultValue={editingApp.address ?? ""}
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Path de imágenes y videos
                        <input
                          name="path"
                          defaultValue={editingApp.path ?? ""}
                          placeholder="ej: /apps/mi-app/media"
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Nombre de base de datos
                        <input
                          name="database_name"
                          defaultValue={editingApp.database_name ?? ""}
                          placeholder="ej: gestor_ed_deli"
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        <Switch
                          name="maintenance"
                          size="sm"
                          defaultSelected={editingApp.maintenance}
                        >
                          <Switch.Content>
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                            Maintenance mode
                          </Switch.Content>
                        </Switch>
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
                <Modal.Heading>Eliminar aplicación</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {error && (
                  <Alert status="danger">
                    <Alert.Description>{error}</Alert.Description>
                  </Alert>
                )}
                <p className={gp.subtitle}>
                  ¿Eliminar <strong>{deletingApp?.name}</strong>?
                  <br />
                  Los módulos, planes y datos asociados se conservarán.
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
