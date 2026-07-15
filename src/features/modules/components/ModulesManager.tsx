"use client";

import {
  Alert,
  Button,
  Modal,
  Spinner,
  Switch,
  useOverlayState,
} from "@heroui/react";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import Plus from "@gravity-ui/icons/Plus";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useModules } from "../hooks/useModules";
import { useApps } from "@/src/features/apps/hooks/useApps";
import type { LifecycleStatus, Module } from "../types";
import {
  matchesLifecycleFilter,
  normalizeLifecycleStatus,
} from "../types";
import { ManagerHeader, TableSearchBar } from "@/src/shared/components/TableSearchBar";
import { TablePagination } from "@/src/shared/components/TablePagination";
import { usePaginatedSearch } from "@/src/shared/hooks/usePaginatedSearch";
import { gp } from "@/src/shared/ui/theme";
import { apiUrl } from "@/src/utils/apiUrl";
import { ModulesDashboard } from "./ModulesDashboard";
import { ModuleCard } from "./ModuleCard";
import { ModuleSectionsPanel } from "./ModuleSectionsPanel";
import { getModuleStats } from "../lib/module-stats";
import {
  ModuleStatusFilter,
  type ModuleStatusFilterValue,
} from "./ModuleStatusFilter";

const PAGE_SIZE = 12;

function matchesModuleSearch(mod: Module, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const appNames = (mod.apps_using ?? [])
    .map((a) => a.name)
    .filter(Boolean)
    .join(" ");
  return [mod.name, mod.app_name, mod.catalog_app_name, appNames, "softed"]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

export function ModulesManager() {
  const { apps: businesses } = useApps();
  const templateApps = useMemo(
    () => businesses.filter((b) => b.kind === "template"),
    [businesses],
  );
  const { modules, loading, create, update, remove, patchModule, refetch } = useModules();

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deletingModule, setDeletingModule] = useState<Module | null>(null);
  const [editIsTrial, setEditIsTrial] = useState(false);
  const [editLimitDays, setEditLimitDays] = useState("");

  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<ModuleStatusFilterValue>("all");

  const moduleCreateState = useOverlayState();
  const moduleEditState = useOverlayState();
  const moduleDeleteState = useOverlayState();

  const stats = useMemo(() => getModuleStats(modules), [modules]);

  const statusCounts = useMemo(() => {
    const counts: Record<ModuleStatusFilterValue, number> = {
      all: modules.length,
      active: 0,
      maintenance: 0,
      planned: 0,
      developer: 0,
    };
    for (const mod of modules) {
      const status = normalizeLifecycleStatus(mod.status);
      counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }, [modules]);

  const modulesForList = useMemo(() => {
    return modules.filter((mod) =>
      matchesLifecycleFilter(mod.status, statusFilter),
    );
  }, [modules, statusFilter]);

  const filterModules = useCallback(
    (mod: Module, query: string) => matchesModuleSearch(mod, query),
    [],
  );

  const {
    search,
    setSearch,
    page,
    setPage,
    paginated: paginatedModules,
    total: filteredTotal,
  } = usePaginatedSearch(modulesForList, filterModules, PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, setPage]);

  function handleManageSections(mod: Module) {
    setSelectedModule(mod);
  }

  async function handleCreateModule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const appId = Number(form.get("app_id"));
      if (!appId) {
        setError("Debe vincular el módulo a una aplicación del catálogo");
        return;
      }
      const file = form.get("image") as File | null;
      let imageUrl: string | null = null;
      if (file && file.size > 0) {
        const imgForm = new FormData();
        imgForm.set("file", file);
        const uploadRes = await fetch(apiUrl("/api/upload"), { method: "POST", body: imgForm });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => null);
          throw new Error(errData?.error || "Error al subir la imagen");
        }
        const { url } = await uploadRes.json();
        imageUrl = url;
      }
      await create({
        name: form.get("name") as string,
        app_id: appId,
        description: (form.get("description") as string) || null,
        image_url: imageUrl,
      });
      moduleCreateState.close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditModule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingModule) return;
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const file = form.get("image") as File | null;
      let imageUrl: string | null | undefined = undefined;
      if (file && file.size > 0) {
        const imgForm = new FormData();
        imgForm.set("file", file);
        const uploadRes = await fetch(apiUrl("/api/upload"), { method: "POST", body: imgForm });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => null);
          throw new Error(errData?.error || "Error al subir la imagen");
        }
        const { url } = await uploadRes.json();
        imageUrl = url;
      }
      const mod = await update(editingModule.id, {
        name: form.get("name") as string,
        description: (form.get("description") as string) || null,
        ...(imageUrl !== undefined && { image_url: imageUrl }),
        is_trial: editIsTrial,
        limit_days_trial: editIsTrial && editLimitDays ? Number(editLimitDays) : null,
      });
      if (selectedModule?.id === mod.id) {
        setSelectedModule(mod);
      }
      moduleEditState.close();
      setEditingModule(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteModule() {
    if (!deletingModule) return;
    setError("");
    setSubmitting(true);
    try {
      await remove(deletingModule.id);
      if (selectedModule?.id === deletingModule.id) {
        setSelectedModule(null);
      }
      moduleDeleteState.close();
      setDeletingModule(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setSubmitting(false);
    }
  }

  function handleModuleUpdate(updated: Module) {
    patchModule(updated.id, () => updated);
    setSelectedModule(updated);
  }

  async function handleChangeStatus(mod: Module, status: LifecycleStatus) {
    patchModule(mod.id, (m) => ({ ...m, status }));
    setError("");
    try {
      const updated = await update(mod.id, { status });
      setSelectedModule((prev) => (prev?.id === mod.id ? updated : prev));
      const pushError = (updated as Module & { push_error?: string | null })
        ?.push_error;
      if (pushError) {
        setError(
          `Estado guardado, pero no se pudo sync a EdDeli: ${pushError}`,
        );
      }
    } catch {
      await refetch();
      setError("No se pudo actualizar el estado del módulo");
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
        title="Módulos"
        description="Catálogo SoftEd general. Cada módulo se vincula a apps (hoy EdDeli); mismas secciones, distinta activación por plan."
        Icon={Cubes3Overlap}
        action={
          <Modal state={moduleCreateState}>
            <Button
              style={{
                backgroundColor: "var(--gp-primary)",
                color: "var(--gp-primary-text)",
              }}
            >
              <Plus width={16} height={16} />
              Nuevo módulo
            </Button>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog className="sm:max-w-lg">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Nuevo módulo</Modal.Heading>
                  </Modal.Header>
                  <form onSubmit={handleCreateModule}>
                    <Modal.Body className="space-y-4">
                      {error && (
                        <Alert status="danger">
                          <Alert.Description>{error}</Alert.Description>
                        </Alert>
                      )}
                      <label className={gp.label}>
                        Plantilla (catálogo Raptor)
                        <select name="app_id" required className={gp.input}>
                          <option value="">Seleccionar plantilla</option>
                          {templateApps.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={gp.label}>
                        Nombre
                        <input
                          name="name"
                          required
                          placeholder="Ej: Plataforma"
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Descripción
                        <textarea
                          name="description"
                          rows={3}
                          placeholder="Descripción del módulo"
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Imagen
                        <input
                          name="image"
                          type="file"
                          accept="image/*"
                          className={gp.input}
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
        }
      />

      <ModulesDashboard stats={stats} />

      {error ? (
        <Alert status="danger">
          <Alert.Description>{error}</Alert.Description>
        </Alert>
      ) : null}

      <div className="space-y-3">
        <TableSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o aplicación…"
          total={filteredTotal}
          totalLabel="módulos"
        />
        <ModuleStatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
          counts={statusCounts}
        />
      </div>

      {paginatedModules.length === 0 ? (
        <div className={`${gp.empty} flex flex-col items-center gap-3 py-16`}>
          <Cubes3Overlap width={40} height={40} className="text-[var(--gp-text-faint)]" />
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--gp-text)]">
              {search.trim() || statusFilter !== "all"
                ? "No hay módulos que coincidan"
                : "No hay módulos registrados"}
            </p>
            <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
              {search.trim() || statusFilter !== "all"
                ? "Probá con otro término o cambia el filtro de estado."
                : "Creá el primer módulo para organizar secciones y límites."}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {paginatedModules.map((mod) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                onManageSections={handleManageSections}
                onEdit={(m) => {
                  setEditingModule(m);
                  setEditIsTrial(m.is_trial);
                  setEditLimitDays(m.limit_days_trial?.toString() ?? "");
                  setError("");
                  moduleEditState.open();
                }}
                onDelete={(m) => {
                  setDeletingModule(m);
                  setError("");
                  moduleDeleteState.open();
                }}
                onChangeStatus={handleChangeStatus}
              />
            ))}
          </div>

          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filteredTotal}
            onPageChange={setPage}
          />
        </>
      )}

      {selectedModule && (
        <ModuleSectionsPanel
          module={selectedModule}
          open
          onClose={() => setSelectedModule(null)}
          onModuleUpdate={handleModuleUpdate}
        />
      )}

      <Modal state={moduleEditState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-lg">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Editar módulo</Modal.Heading>
              </Modal.Header>
              {editingModule && (
                <form onSubmit={handleEditModule}>
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
                        defaultValue={editingModule.name}
                        className={gp.input}
                      />
                    </label>
                    <label className={gp.label}>
                      Descripción
                      <textarea
                        name="description"
                        rows={3}
                        placeholder="Descripción del módulo"
                        defaultValue={editingModule.description ?? ""}
                        className={gp.input}
                      />
                    </label>
                    {editingModule.image_url && (
                      <div className="flex items-center gap-3 rounded-lg border p-2">
                        <img
                          src={editingModule.image_url}
                          alt={editingModule.name}
                          className="size-12 rounded-lg object-cover"
                        />
                        <span className="text-xs text-zinc-500">Imagen actual</span>
                      </div>
                    )}
                    <label className={gp.label}>
                      {editingModule.image_url ? "Cambiar imagen" : "Imagen"}
                      <input
                        name="image"
                        type="file"
                        accept="image/*"
                        className={gp.input}
                      />
                    </label>

                    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                      <span className="text-sm font-medium text-zinc-700">
                        Periodo de prueba (trial)
                      </span>
                      <Switch
                        isSelected={editIsTrial}
                        onChange={setEditIsTrial}
                      >
                        <Switch.Content>
                          <Switch.Control>
                            <Switch.Thumb />
                          </Switch.Control>
                          {editIsTrial ? "Activado" : "Desactivado"}
                        </Switch.Content>
                      </Switch>
                    </div>

                    <label className={gp.label}>
                      Días de prueba
                      <input
                        type="number"
                        min="1"
                        value={editLimitDays}
                        onChange={(e) => setEditLimitDays(e.target.value)}
                        placeholder="Ej: 30"
                        className={gp.input}
                        disabled={!editIsTrial}
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

      <Modal state={moduleDeleteState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
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
                <p className={gp.subtitle}>
                  ¿Eliminar <strong>{deletingModule?.name}</strong>?
                  <br />
                  También se eliminarán sus secciones.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" slot="close">
                  Cancelar
                </Button>
                <Button
                  className="bg-red-600 text-white"
                  onPress={handleDeleteModule}
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
