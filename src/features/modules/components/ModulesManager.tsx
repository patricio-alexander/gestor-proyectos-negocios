"use client";

import {
  Alert,
  Button,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import Plus from "@gravity-ui/icons/Plus";
import { useCallback, useMemo, useState } from "react";
import { useModules } from "../hooks/useModules";
import { useApps } from "@/src/features/apps/hooks/useApps";
import type { Module } from "../types";
import { ManagerHeader, TableSearchBar } from "@/src/shared/components/TableSearchBar";
import { TablePagination } from "@/src/shared/components/TablePagination";
import { usePaginatedSearch } from "@/src/shared/hooks/usePaginatedSearch";
import { gp } from "@/src/shared/ui/theme";
import { ModulesDashboard } from "./ModulesDashboard";
import { ModuleCard } from "./ModuleCard";
import { ModuleSectionsPanel } from "./ModuleSectionsPanel";
import { getModuleStats } from "../lib/module-stats";

const PAGE_SIZE = 9;

function matchesModuleSearch(mod: Module, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [mod.name, mod.app_name]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

export function ModulesManager() {
  const { apps: businesses } = useApps();
  const { modules, loading, create, update, remove, patchModule } = useModules();

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deletingModule, setDeletingModule] = useState<Module | null>(null);

  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const moduleCreateState = useOverlayState();
  const moduleEditState = useOverlayState();
  const moduleDeleteState = useOverlayState();

  const stats = useMemo(() => getModuleStats(modules), [modules]);

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
  } = usePaginatedSearch(modules, filterModules, PAGE_SIZE);

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
        setError("Debe seleccionar una aplicación");
        return;
      }
      await create({
        name: form.get("name") as string,
        app_id: appId,
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
      const mod = await update(editingModule.id, {
        name: form.get("name") as string,
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
        description="Catálogo de módulos, secciones, límites y capacidades remotas"
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
                        Aplicación
                        <select name="app_id" required className={gp.input}>
                          <option value="">Seleccionar aplicación</option>
                          {businesses.map((b) => (
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

      <TableSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nombre o aplicación…"
        total={filteredTotal}
        totalLabel="módulos"
      />

      {paginatedModules.length === 0 ? (
        <div className={`${gp.empty} flex flex-col items-center gap-3 py-16`}>
          <Cubes3Overlap width={40} height={40} className="text-[var(--gp-text-faint)]" />
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--gp-text)]">
              {search.trim()
                ? "No hay módulos que coincidan"
                : "No hay módulos registrados"}
            </p>
            <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
              {search.trim()
                ? "Probá con otro término de búsqueda."
                : "Creá el primer módulo para organizar secciones y límites."}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedModules.map((mod) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                onManageSections={handleManageSections}
                onEdit={(m) => {
                  setEditingModule(m);
                  setError("");
                  moduleEditState.open();
                }}
                onDelete={(m) => {
                  setDeletingModule(m);
                  setError("");
                  moduleDeleteState.open();
                }}
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
