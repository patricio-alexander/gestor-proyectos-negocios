"use client";

import {
  Alert,
  Button,
  Card,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import LayoutCells from "@gravity-ui/icons/Layers";
import Pencil from "@gravity-ui/icons/Pencil";
import Plus from "@gravity-ui/icons/Plus";
import TrashBin from "@gravity-ui/icons/TrashBin";
import { useState } from "react";
import { useCatalog } from "../hooks/useCatalog";
import type { AppModuleRecord, AppSectionRecord } from "../types";
import { INPUT_CLASS } from "@/src/shared/ui/form-styles";

export function CatalogManager() {
  const {
    modules,
    loading,
    createModule,
    updateModule,
    removeModule,
    createSection,
    updateSection,
    removeSection,
  } = useCatalog();

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingModule, setEditingModule] = useState<AppModuleRecord | null>(null);
  const [deletingModule, setDeletingModule] = useState<AppModuleRecord | null>(null);
  const [sectionModuleId, setSectionModuleId] = useState<number | null>(null);
  const [editingSection, setEditingSection] = useState<{
    section: AppSectionRecord;
    moduleId: number;
  } | null>(null);

  const moduleCreateState = useOverlayState();
  const moduleEditState = useOverlayState();
  const moduleDeleteState = useOverlayState();
  const sectionCreateState = useOverlayState();
  const sectionEditState = useOverlayState();

  async function handleCreateModule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await createModule({
        key: form.get("key") as string,
        name: form.get("name") as string,
        description: (form.get("description") as string) || undefined,
        icon: (form.get("icon") as string) || undefined,
        sort_order: Number(form.get("sort_order") || 0),
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
      await updateModule(editingModule.id, {
        key: form.get("key") as string,
        name: form.get("name") as string,
        description: (form.get("description") as string) || undefined,
        icon: (form.get("icon") as string) || undefined,
        sort_order: Number(form.get("sort_order") || 0),
        is_active: form.get("is_active") === "on",
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
      await removeModule(deletingModule.id);
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
    if (!sectionModuleId) return;
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await createSection({
        app_module_id: sectionModuleId,
        key: form.get("key") as string,
        name: form.get("name") as string,
        route_path: (form.get("route_path") as string) || undefined,
        description: (form.get("description") as string) || undefined,
        sort_order: Number(form.get("sort_order") || 0),
      });
      sectionCreateState.close();
      setSectionModuleId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingSection) return;
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await updateSection(editingSection.section.id, editingSection.moduleId, {
        key: form.get("key") as string,
        name: form.get("name") as string,
        route_path: (form.get("route_path") as string) || undefined,
        description: (form.get("description") as string) || undefined,
        sort_order: Number(form.get("sort_order") || 0),
        is_active: form.get("is_active") === "on",
      });
      sectionEditState.close();
      setEditingSection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="gp-page">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <LayoutCells width={24} height={24} className="text-zinc-700" />
            <h1 className="gp-title">Catálogo EdDeli</h1>
          </div>
          <p className="gp-subtitle mt-1">
            Módulos y secciones licenciables de eddeliApp (notificaciones, themes, backups, etc.)
          </p>
        </div>

        <Modal state={moduleCreateState}>
          <Button>
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
                    <label className="gp-label">
                      Clave (key)
                      <input name="key" required placeholder="platform" className={INPUT_CLASS} />
                    </label>
                    <label className="gp-label">
                      Nombre
                      <input name="name" required placeholder="Plataforma" className={INPUT_CLASS} />
                    </label>
                    <label className="gp-label">
                      Descripción
                      <textarea name="description" rows={2} className={INPUT_CLASS} />
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="gp-label">
                        Icono
                        <input name="icon" placeholder="Settings" className={INPUT_CLASS} />
                      </label>
                      <label className="gp-label">
                        Orden
                        <input name="sort_order" type="number" defaultValue={0} className={INPUT_CLASS} />
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
      </div>

      <div className="grid gap-4">
        {modules.map((mod) => (
          <Card key={mod.id} className="gp-card px-5 py-4">
            <div className="mb-4 flex flex-row items-start justify-between gap-4 border-b border-zinc-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-zinc-900">{mod.name}</h2>
                  <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-600">
                    {mod.key}
                  </span>
                  {!mod.is_active && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      Inactivo
                    </span>
                  )}
                </div>
                {mod.description && (
                  <p className="gp-subtitle mt-1">{mod.description}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setSectionModuleId(mod.id);
                    setError("");
                    sectionCreateState.open();
                  }}
                >
                  <Plus width={14} height={14} />
                  Sección
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
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
                  className="text-red-600"
                  onPress={() => {
                    setDeletingModule(mod);
                    setError("");
                    moduleDeleteState.open();
                  }}
                >
                  <TrashBin width={14} height={14} />
                </Button>
              </div>
            </div>
            <div className="pt-1">
              {mod.sections.length === 0 ? (
                <p className="text-sm text-zinc-400">Sin secciones</p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {mod.sections.map((section) => (
                    <li
                      key={section.id}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-800">{section.name}</span>
                          <span className="font-mono text-xs text-zinc-400">{section.key}</span>
                          {!section.is_active && (
                            <span className="text-xs text-amber-600">inactiva</span>
                          )}
                        </div>
                        {section.route_path && (
                          <p className="mt-0.5 font-mono text-xs text-zinc-400">{section.route_path}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onPress={() => {
                          setEditingSection({ section, moduleId: mod.id });
                          setError("");
                          sectionEditState.open();
                        }}
                      >
                        <Pencil width={14} height={14} />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        ))}
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
                    <label className="gp-label">
                      Clave
                      <input name="key" required defaultValue={editingModule.key} className={INPUT_CLASS} />
                    </label>
                    <label className="gp-label">
                      Nombre
                      <input name="name" required defaultValue={editingModule.name} className={INPUT_CLASS} />
                    </label>
                    <label className="gp-label">
                      Descripción
                      <textarea
                        name="description"
                        rows={2}
                        defaultValue={editingModule.description ?? ""}
                        className={INPUT_CLASS}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={editingModule.is_active}
                        className="size-4 rounded border-zinc-300"
                      />
                      Activo
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
                <p className="gp-subtitle">
                  ¿Eliminar <strong>{deletingModule?.name}</strong> y todas sus secciones del catálogo?
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

      <Modal state={sectionCreateState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-lg">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Nueva sección</Modal.Heading>
              </Modal.Header>
              <form onSubmit={handleCreateSection}>
                <Modal.Body className="space-y-4">
                  {error && (
                    <Alert status="danger">
                      <Alert.Description>{error}</Alert.Description>
                    </Alert>
                  )}
                  <label className="gp-label">
                    Clave
                    <input name="key" required placeholder="json-backup" className={INPUT_CLASS} />
                  </label>
                  <label className="gp-label">
                    Nombre
                    <input name="name" required placeholder="Backup JSON" className={INPUT_CLASS} />
                  </label>
                  <label className="gp-label">
                    Ruta en eddeliApp
                    <input name="route_path" placeholder="/eddeli/platform/backups" className={INPUT_CLASS} />
                  </label>
                  <label className="gp-label">
                    Orden
                    <input name="sort_order" type="number" defaultValue={0} className={INPUT_CLASS} />
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

      <Modal state={sectionEditState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-lg">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Editar sección</Modal.Heading>
              </Modal.Header>
              {editingSection && (
                <form onSubmit={handleEditSection}>
                  <Modal.Body className="space-y-4">
                    {error && (
                      <Alert status="danger">
                        <Alert.Description>{error}</Alert.Description>
                      </Alert>
                    )}
                    <label className="gp-label">
                      Clave
                      <input
                        name="key"
                        required
                        defaultValue={editingSection.section.key}
                        className={INPUT_CLASS}
                      />
                    </label>
                    <label className="gp-label">
                      Nombre
                      <input
                        name="name"
                        required
                        defaultValue={editingSection.section.name}
                        className={INPUT_CLASS}
                      />
                    </label>
                    <label className="gp-label">
                      Ruta
                      <input
                        name="route_path"
                        defaultValue={editingSection.section.route_path ?? ""}
                        className={INPUT_CLASS}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={editingSection.section.is_active}
                        className="size-4 rounded border-zinc-300"
                      />
                      Activa
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
    </div>
  );
}
