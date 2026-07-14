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
import ArrowUpFromSquare from "@gravity-ui/icons/ArrowUpFromSquare";
import Copy from "@gravity-ui/icons/Copy";
import ArrowsRotateRight from "@gravity-ui/icons/ArrowsRotateRight";
import { useState, useCallback } from "react";
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

function generateApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return "gc_" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function matchesAppSearch(app: App, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [app.name, app.owner_name, app.ruc, app.email]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

export default function AppsPage() {
  const { apps, loading, create, update, remove, pushEntitlement } = useApps();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [deletingApp, setDeletingApp] = useState<App | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [pushingIds, setPushingIds] = useState<Set<number>>(new Set());
  const [createApiKey, setCreateApiKey] = useState(generateApiKey);
  const [editApiKey, setEditApiKey] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const createState = useOverlayState();
  const editState = useOverlayState();
  const deleteState = useOverlayState();

  const filterApps = (app: App, query: string) => matchesAppSearch(app, query);

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
        database_name: (form.get("database_name") as string) || null,
        maintenance: form.get("maintenance") === "on",
        entitlement_url: (form.get("entitlement_url") as string) || null,
        entitlement_secret: createApiKey,
      });
      createState.close();
      setSuccess("Aplicación creada");
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
      const secret = editApiKey;
      const updated = await update(editingApp.id, {
        name: form.get("name") as string,
        owner_name: (form.get("owner_name") as string) || null,
        phone: (form.get("phone") as string) || null,
        ruc: (form.get("ruc") as string) || null,
        address: (form.get("address") as string) || null,
        email: (form.get("email") as string) || null,
        path: (form.get("path") as string) || null,
        database_name: (form.get("database_name") as string) || null,
        maintenance: form.get("maintenance") === "on",
        entitlement_url: (form.get("entitlement_url") as string) || null,
        ...(secret ? { entitlement_secret: secret } : {}),
      });
      editState.close();
      setEditingApp(null);
      setEditApiKey("");
      const pushNote =
        updated &&
        "push_skipped" in updated &&
        (updated as { push_skipped?: boolean }).push_skipped
          ? " (sin URL de sync)"
          : updated &&
              "push_ok" in updated &&
              (updated as { push_ok?: boolean }).push_ok
            ? " · sync enviado a la app"
            : updated &&
                "push_error" in updated &&
                (updated as { push_error?: string | null }).push_error
              ? ` · aviso sync: ${(updated as { push_error?: string }).push_error}`
              : "";
      setSuccess(`Aplicación actualizada${pushNote}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleMantenimiento(app: App) {
    setTogglingIds((prev) => new Set(prev).add(app.id));
    setError("");
    setSuccess("");
    try {
      const updated = await update(app.id, { maintenance: !app.maintenance });
      const pushErr = (updated as { push_error?: string | null })?.push_error;
      if (pushErr) {
        setError(`Mantenimiento guardado, pero no se pudo sync: ${pushErr}`);
      }
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

  async function handlePush(app: App) {
    setPushingIds((prev) => new Set(prev).add(app.id));
    setError("");
    setSuccess("");
    try {
      await pushEntitlement(app.id);
      setSuccess(`Entitlement enviado a ${app.name || "la app"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al empujar");
    } finally {
      setPushingIds((prev) => {
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
              onPress={() => {
                setCreateApiKey(generateApiKey());
                setCopiedId(null);
                createState.open();
              }}
            >
              <Plus width={16} height={16} />
              Nueva aplicación
            </Button>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog className="sm:max-w-xl">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Nueva aplicación</Modal.Heading>
                  </Modal.Header>
                  <form
                    onSubmit={handleCreate}
                    className="flex flex-1 flex-col"
                  >
                    <Modal.Body>
                      {error && (
                        <Alert status="danger">
                          <Alert.Description>{error}</Alert.Description>
                        </Alert>
                      )}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <label className={`${gp.label} col-span-2`}>
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
                        <label className={`${gp.label} col-span-2`}>
                          URL entitlement (sync)
                          <input
                            name="entitlement_url"
                            placeholder="http://127.0.0.1:3001/eddeliapi/subscription/entitlement"
                            className={gp.input}
                          />
                        </label>
                        <div className="col-span-2 space-y-1.5">
                          <label className={gp.label}>API Key</label>
                          <div className="flex gap-2">
                            <input
                              value={createApiKey}
                              readOnly
                              className={`${gp.input} flex-1 font-mono text-xs`}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label="Copiar API Key"
                              onPress={() => {
                                navigator.clipboard.writeText(createApiKey);
                                setCopiedId("create");
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                            >
                              {copiedId === "create" ? (
                                <span className="text-xs text-emerald-600">Copiado</span>
                              ) : (
                                <Copy width={14} height={14} />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label="Regenerar API Key"
                              onPress={() => setCreateApiKey(generateApiKey())}
                            >
                              <ArrowsRotateRight width={14} height={14} />
                            </Button>
                          </div>
                        </div>
                        <label className={`${gp.label} col-span-2`}>
                          <Switch name="maintenance" size="sm">
                            <Switch.Content>
                              <Switch.Control>
                                <Switch.Thumb />
                              </Switch.Control>
                              Modo mantenimiento
                            </Switch.Content>
                          </Switch>
                        </label>
                      </div>
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

      {error ? (
        <Alert status="danger">
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      ) : null}
      {success ? (
        <Alert status="success">
          <Alert.Description>{success}</Alert.Description>
        </Alert>
      ) : null}

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
              <th>Plan activo</th>
              <th>Sync</th>
              <th>Email</th>
              <th>Mantenimiento</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedApps.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center">
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
                  <td>
                    {app.plan ? (
                      <div>
                        <p className="font-medium text-[var(--gp-text)]">
                          {app.plan.name}
                        </p>
                        <p className="text-xs text-[var(--gp-text-muted)]">
                          {app.plan.modules_count}{" "}
                          {app.plan.modules_count === 1 ? "módulo" : "módulos"}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[var(--gp-text-muted)]">
                        Sin plan
                      </span>
                    )}
                  </td>
                  <td>
                    {app.entitlement_url ? (
                      <span className="text-xs font-medium text-emerald-700">
                        {app.has_entitlement_secret ? "Listo" : "Sin secreto"}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--gp-text-muted)]">
                        Sin URL
                      </span>
                    )}
                  </td>
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
                        aria-label={`Empujar entitlement ${app.name}`}
                        isDisabled={!app.entitlement_url || pushingIds.has(app.id)}
                        onPress={() => handlePush(app)}
                      >
                        {pushingIds.has(app.id) ? (
                          <Spinner size="sm" />
                        ) : (
                          <ArrowUpFromSquare width={14} height={14} />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Editar ${app.name}`}
                        onPress={() => {
                          setEditingApp(app);
                          setEditApiKey("");
                          setCopiedId(null);
                          setError("");
                          setSuccess("");
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
          <Modal.Container size="lg">
            <Modal.Dialog className="sm:max-w-xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Editar aplicación</Modal.Heading>
              </Modal.Header>
              {editingApp && (
                <form onSubmit={handleEdit} className="flex flex-1 flex-col">
                  <Modal.Body>
                    {error && (
                      <Alert status="danger">
                        <Alert.Description>{error}</Alert.Description>
                      </Alert>
                    )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <label className={`${gp.label} col-span-2`}>
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
                        <label className={`${gp.label} col-span-2`}>
                          URL entitlement (sync)
                          <input
                            name="entitlement_url"
                            defaultValue={editingApp.entitlement_url ?? ""}
                            placeholder="http://127.0.0.1:3001/eddeliapi/subscription/entitlement"
                            className={gp.input}
                          />
                        </label>
                        <div className="col-span-2 space-y-1.5">
                          <label className={gp.label}>API Key</label>
                          <div className="flex gap-2">
                            <input
                              value={editApiKey || editingApp.entitlement_secret || ""}
                              readOnly
                              className={`${gp.input} flex-1 font-mono text-xs`}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label="Copiar API Key"
                              onPress={() => {
                                const val = editApiKey || editingApp.entitlement_secret || "";
                                navigator.clipboard.writeText(val);
                                setCopiedId("edit");
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                            >
                              {copiedId === "edit" ? (
                                <span className="text-xs text-emerald-600">Copiado</span>
                              ) : (
                                <Copy width={14} height={14} />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label="Regenerar API Key"
                              onPress={() => setEditApiKey(generateApiKey())}
                            >
                              <ArrowsRotateRight width={14} height={14} />
                            </Button>
                          </div>
                          {editApiKey && (
                            <p className="text-[11px] text-amber-600">
                              Se va a regenerar la API Key al guardar.
                            </p>
                          )}
                        </div>
                      <label className={`${gp.label} col-span-2`}>
                        <Switch
                          name="maintenance"
                          size="sm"
                          defaultSelected={editingApp.maintenance}
                        >
                          <Switch.Content>
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                            Modo mantenimiento
                          </Switch.Content>
                        </Switch>
                      </label>
                    </div>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" slot="close" onPress={() => setEditingApp(null)}>
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
