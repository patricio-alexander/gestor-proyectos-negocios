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
import { useApps } from "@/src/features/apps/hooks/useApps";
import type { ModuleRecord } from "../types";
import { INPUT_CLASS } from "@/src/shared/ui/form-styles";

export function CatalogManager() {
  const { apps: businesses } = useApps();
  const {
    modules,
    loading,
    createModule,
    updateModule,
    removeModule,
  } = useCatalog();

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleRecord | null>(null);
  const [deletingModule, setDeletingModule] = useState<ModuleRecord | null>(null);

  const moduleCreateState = useOverlayState();
  const moduleEditState = useOverlayState();
  const moduleDeleteState = useOverlayState();

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
      await createModule({
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
      await updateModule(editingModule.id, {
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
      await removeModule(deletingModule.id);
      moduleDeleteState.close();
      setDeletingModule(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
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
            <h1 className="gp-title">Módulos</h1>
          </div>
          <p className="gp-subtitle mt-1">
            Módulos del sistema
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
                      Aplicación
                      <select name="app_id" required className={INPUT_CLASS}>
                        <option value="">Seleccionar aplicación</option>
                        {businesses.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="gp-label">
                      Nombre
                      <input name="name" required placeholder="Plataforma" className={INPUT_CLASS} />
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

      <div className="grid gap-4">
        {modules.map((mod) => (
          <Card key={mod.id} className="gp-card px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-zinc-900">{mod.name}</h2>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
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
                      Nombre
                      <input name="name" required defaultValue={editingModule.name} className={INPUT_CLASS} />
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
                  ¿Eliminar <strong>{deletingModule?.name}</strong>?
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
