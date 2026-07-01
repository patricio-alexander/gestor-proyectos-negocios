"use client";

import {
  Alert,
  Button,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import Pencil from "@gravity-ui/icons/Pencil";
import Plus from "@gravity-ui/icons/Plus";
import TrashBin from "@gravity-ui/icons/TrashBin";
import CirclePlus from "@gravity-ui/icons/CirclePlus";
import { useCallback, useState } from "react";
import { useModules } from "../hooks/useModules";
import { useApps } from "@/src/features/apps/hooks/useApps";
import type { Module, Section } from "../types";
import { ManagerHeader, TableSearchBar } from "@/src/shared/components/TableSearchBar";
import { TablePagination } from "@/src/shared/components/TablePagination";
import { usePaginatedSearch } from "@/src/shared/hooks/usePaginatedSearch";
import { gp } from "@/src/shared/ui/theme";
import { apiUrl } from "@/src/utils/apiUrl";

const PAGE_SIZE = 10;

function matchesModuleSearch(mod: Module, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [mod.name, mod.business_name]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

export function ModulesManager() {
  const { apps: businesses } = useApps();
  const { modules, loading, create, update, remove } = useModules();

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deletingModule, setDeletingModule] = useState<Module | null>(null);

  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);
  const [sectionError, setSectionError] = useState("");
  const [sectionSubmitting, setSectionSubmitting] = useState(false);

  const moduleCreateState = useOverlayState();
  const moduleEditState = useOverlayState();
  const moduleDeleteState = useOverlayState();

  const sectionCreateState = useOverlayState();
  const sectionEditState = useOverlayState();
  const sectionDeleteState = useOverlayState();

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

  async function handleCreateModule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const businessId = Number(form.get("business_id"));
      if (!businessId) {
        setError("Debe seleccionar una aplicación");
        return;
      }
      await create({
        name: form.get("name") as string,
        business_id: businessId,
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
      await update(editingModule.id, {
        name: form.get("name") as string,
      });
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
      moduleDeleteState.close();
      setDeletingModule(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateSection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedModule) return;
    setSectionError("");
    setSectionSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(apiUrl("/api/sections"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name") as string,
          module_id: selectedModule.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear sección");
      }
      const section: Section = await res.json();
      setSelectedModule((prev) =>
        prev ? { ...prev, sections: [...prev.sections, section] } : prev
      );
      sectionCreateState.close();
    } catch (err) {
      setSectionError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSectionSubmitting(false);
    }
  }

  async function handleEditSection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingSection) return;
    setSectionError("");
    setSectionSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(apiUrl(`/api/sections/${editingSection.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.get("name") as string }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar sección");
      }
      const section: Section = await res.json();
      setSelectedModule((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.map((s) =>
                s.id === section.id ? section : s
              ),
            }
          : prev
      );
      sectionEditState.close();
      setEditingSection(null);
    } catch (err) {
      setSectionError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSectionSubmitting(false);
    }
  }

  async function handleDeleteSection() {
    if (!deletingSection) return;
    setSectionError("");
    setSectionSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/api/sections/${deletingSection.id}`), {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar sección");
      }
      setSelectedModule((prev) =>
        prev
          ? {
              ...prev,
              sections: prev.sections.filter(
                (s) => s.id !== deletingSection.id
              ),
            }
          : prev
      );
      sectionDeleteState.close();
      setDeletingSection(null);
    } catch (err) {
      setSectionError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setSectionSubmitting(false);
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
        description="Módulos del sistema"
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
                        <select name="business_id" required className={gp.input}>
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

      <TableSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nombre o aplicación…"
        total={filteredTotal}
        totalLabel="módulos"
      />

      <div className={gp.tableWrap}>
        <table className={gp.table}>
          <thead>
            <tr>
              <th>Módulo</th>
              <th>Aplicación</th>
              <th>Secciones</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedModules.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center">
                  <p className={gp.subtitle}>
                    {search.trim()
                      ? "No hay módulos que coincidan con la búsqueda."
                      : "Aún no hay módulos registrados."}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedModules.map((mod) => {
                const expanded = selectedModule?.id === mod.id;
                return (
                  <tr key={mod.id}>
                    <td className="font-medium">{mod.name}</td>
                    <td>{mod.business_name || "—"}</td>
                    <td>{mod.sections.length}</td>
                    <td>
                      <div className="gp-table-actions">
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Gestionar secciones"
                          onPress={() =>
                            setSelectedModule(
                              expanded ? null : mod
                            )
                          }
                        >
                          <Cubes3Overlap width={14} height={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Editar ${mod.name}`}
                          onPress={() => {
                            setEditingModule(mod);
                            setError("");
                            moduleEditState.open();
                          }}
                        >
                          <Pencil width={14} height={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500"
                          aria-label={`Eliminar ${mod.name}`}
                          onPress={() => {
                            setDeletingModule(mod);
                            setError("");
                            moduleDeleteState.open();
                          }}
                        >
                          <TrashBin width={14} height={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {selectedModule && (
          <div className="border-t px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Secciones de <strong>{selectedModule.name}</strong>
              </h3>
              <Modal state={sectionCreateState}>
                <Button size="sm" variant="ghost">
                  <CirclePlus width={14} height={14} />
                  Nueva sección
                </Button>
                <Modal.Backdrop>
                  <Modal.Container>
                    <Modal.Dialog className="sm:max-w-md">
                      <Modal.CloseTrigger />
                      <Modal.Header>
                        <Modal.Heading>Nueva sección</Modal.Heading>
                      </Modal.Header>
                      <form onSubmit={handleCreateSection}>
                        <Modal.Body className="space-y-4">
                          {sectionError && (
                            <Alert status="danger">
                              <Alert.Description>
                                {sectionError}
                              </Alert.Description>
                            </Alert>
                          )}
                          <label className={gp.label}>
                            Nombre
                            <input
                              name="name"
                              required
                              placeholder="Ej: Módulo de ventas"
                              className={gp.input}
                            />
                          </label>
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="secondary" slot="close">
                            Cancelar
                          </Button>
                          <Button type="submit" isDisabled={sectionSubmitting}>
                            {sectionSubmitting ? (
                              <Spinner size="sm" />
                            ) : (
                              "Crear"
                            )}
                          </Button>
                        </Modal.Footer>
                      </form>
                    </Modal.Dialog>
                  </Modal.Container>
                </Modal.Backdrop>
              </Modal>
            </div>

            {selectedModule.sections.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-400">
                Este módulo no tiene secciones.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <tbody>
                  {selectedModule.sections.map((sec) => (
                    <tr key={sec.id} className="border-b last:border-none">
                      <td className="py-2 pl-4">{sec.name}</td>
                      <td className="w-24 py-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={() => {
                              setEditingSection(sec);
                              setSectionError("");
                              sectionEditState.open();
                            }}
                          >
                            <Pencil width={12} height={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500"
                            onPress={() => {
                              setDeletingSection(sec);
                              setSectionError("");
                              sectionDeleteState.open();
                            }}
                          >
                            <TrashBin width={12} height={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <TablePagination
          page={page}
          pageSize={PAGE_SIZE}
          total={filteredTotal}
          onPageChange={setPage}
        />
      </div>

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

      <Modal state={sectionEditState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Editar sección</Modal.Heading>
              </Modal.Header>
              {editingSection && (
                <form onSubmit={handleEditSection}>
                  <Modal.Body className="space-y-4">
                    {sectionError && (
                      <Alert status="danger">
                        <Alert.Description>
                          {sectionError}
                        </Alert.Description>
                      </Alert>
                    )}
                    <label className={gp.label}>
                      Nombre
                      <input
                        name="name"
                        required
                        defaultValue={editingSection.name}
                        className={gp.input}
                      />
                    </label>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" slot="close">
                      Cancelar
                    </Button>
                    <Button type="submit" isDisabled={sectionSubmitting}>
                      {sectionSubmitting ? (
                        <Spinner size="sm" />
                      ) : (
                        "Guardar"
                      )}
                    </Button>
                  </Modal.Footer>
                </form>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={sectionDeleteState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Eliminar sección</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {sectionError && (
                  <Alert status="danger">
                    <Alert.Description>
                      {sectionError}
                    </Alert.Description>
                  </Alert>
                )}
                <p className={gp.subtitle}>
                  ¿Eliminar la sección <strong>{deletingSection?.name}</strong>?
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" slot="close">
                  Cancelar
                </Button>
                <Button
                  className="bg-red-600 text-white"
                  onPress={handleDeleteSection}
                  isDisabled={sectionSubmitting}
                >
                  {sectionSubmitting ? (
                    <Spinner size="sm" />
                  ) : (
                    "Eliminar"
                  )}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
