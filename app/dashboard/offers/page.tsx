"use client";

import {
  Alert,
  Button,
  Card,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import { useOffers } from "@/src/features/offers/hooks/useOffers";
import type { Offer } from "@/src/features/offers/types";
import { useApps } from "@/src/features/apps/hooks/useApps";
import { useCatalog } from "@/src/features/catalog/hooks/useCatalog";
import { useState } from "react";
import { gp } from "@/src/shared/ui/theme";
import Gift from "@gravity-ui/icons/Gift";
import Pencil from "@gravity-ui/icons/Pencil";
import Plus from "@gravity-ui/icons/Plus";
import TrashBin from "@gravity-ui/icons/TrashBin";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPrice(price: number | null | undefined) {
  if (price == null) return null;
  return `$${price}`;
}

type OfferFormProps = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  error: string;
  submitting: boolean;
  editing?: Offer | null;
  apps: { id: number; name: string | null }[];
  allModules: { id: number; name: string; app_id: number }[];
  children: React.ReactNode;
};

function OfferForm({
  onSubmit,
  error,
  submitting,
  editing,
  apps,
  allModules,
  children,
}: OfferFormProps) {
  const [selectedAppId, setSelectedAppId] = useState(
    editing?.app_id ?? "",
  );

  const filteredModules = allModules.filter(
    (m) => m.app_id === Number(selectedAppId),
  );

  const selectedModuleIds = new Set(
    editing?.modules?.map((m) => m.module_id) ?? [],
  );

  return (
    <form onSubmit={onSubmit}>
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
            defaultValue={editing?.name ?? ""}
            placeholder="Nombre de la oferta"
            className={gp.input}
          />
        </label>
        <label className={gp.label}>
          Aplicación
          <select
            name="app_id"
            required
            value={String(selectedAppId)}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className={gp.select}
          >
            <option value="">Seleccionar aplicación</option>
            {apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className={gp.label}>
          Precio ($)
          <input
            name="price"
            type="number"
            min="0"
            step="1"
            defaultValue={editing?.price ?? ""}
            placeholder="Ej: 500"
            className={gp.input}
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className={gp.label}>
            Inicio
            <input
              name="start_at"
              type="date"
              required
              defaultValue={
                editing?.start_at
                  ? editing.start_at.split("T")[0]
                  : ""
              }
              className={gp.input}
            />
          </label>
          <label className={gp.label}>
            Vencimiento
            <input
              name="expires_at"
              type="date"
              required
              defaultValue={
                editing?.expires_at
                  ? editing.expires_at.split("T")[0]
                  : ""
              }
              className={gp.input}
            />
          </label>
        </div>
        {selectedAppId && (
          <>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-zinc-700">
                Módulos
              </legend>
              {filteredModules.length === 0 ? (
                <p className={gp.subtitle}>
                  No hay módulos para esta aplicación
                </p>
              ) : (
                <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border p-3">
                  {filteredModules.map((mod) => (
                    <label
                      key={mod.id}
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      <input
                        type="checkbox"
                        name="module_ids"
                        value={mod.id}
                        defaultChecked={selectedModuleIds.has(mod.id)}
                        className="size-4 rounded border-zinc-300"
                      />
                      {mod.name}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" slot="close">
          Cancelar
        </Button>
        <Button type="submit" isDisabled={submitting}>
          {submitting ? <Spinner size="sm" /> : children}
        </Button>
      </Modal.Footer>
    </form>
  );
}

export default function OffersPage() {
  const { offers, loading, create, update, remove } = useOffers();
  const { apps } = useApps();
  const { modules } = useCatalog();

  const [editing, setEditing] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState<Offer | null>(null);
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
      const moduleInputs = form.getAll("module_ids") as string[];
      await create({
        name: form.get("name") as string,
        app_id: Number(form.get("app_id")),
        price: (form.get("price") as string)
          ? Number(form.get("price"))
          : null,
        start_at: form.get("start_at") as string,
        expires_at: form.get("expires_at") as string,
        module_ids: moduleInputs.map(Number),
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
      const moduleInputs = form.getAll("module_ids") as string[];
      await update(editing.id, {
        name: form.get("name") as string,
        app_id: Number(form.get("app_id")),
        price: (form.get("price") as string)
          ? Number(form.get("price"))
          : null,
        start_at: form.get("start_at") as string,
        expires_at: form.get("expires_at") as string,
        module_ids: moduleInputs.map(Number),
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

  function openEdit(offer: Offer) {
    setEditing(offer);
    setError("");
    editState.open();
  }

  function openDelete(offer: Offer) {
    setDeleting(offer);
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
    <div className={gp.page}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gift width={24} height={24} className="gp-icon-box-text" />
          <h1 className={gp.title}>Ofertas</h1>
        </div>

        <Modal state={createState}>
          <Button>
            <Plus width={16} height={16} />
            Nueva oferta
          </Button>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[500px]">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Nueva oferta</Modal.Heading>
                </Modal.Header>
                <OfferForm
                  key="create"
                  onSubmit={handleCreate}
                  error={error}
                  submitting={submitting}
                  apps={apps}
                  allModules={modules}
                >
                  Crear
                </OfferForm>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </div>

      {offers.length === 0 ? (
        <div className="gp-empty flex flex-col items-center gap-4 py-16 text-center">
          <Gift width={48} height={48} className="text-zinc-300" />
          <p className={gp.subtitle}>
            No hay ofertas registradas todavía
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer) => (
            <Card key={offer.id} className={gp.cardPadded}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{offer.name}</h3>
                  <p className={gp.subtitle}>
                    {offer.app_name || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Editar"
                    onPress={() => openEdit(offer)}
                  >
                    <Pencil width={14} height={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                    aria-label="Eliminar"
                    onPress={() => openDelete(offer)}
                  >
                    <TrashBin width={14} height={14} />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg gp-card px-3 py-3">
                  <p className={gp.subtitle}>Precio</p>
                  <p className="mt-0.5 text-lg font-semibold">
                    {formatPrice(offer.price) || "Gratis"}
                  </p>
                </div>
                <div className="rounded-lg gp-card px-3 py-3">
                  <p className={gp.subtitle}>Vigencia</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {formatDate(offer.start_at)} — {formatDate(offer.expires_at)}
                  </p>
                </div>
              </div>

              {offer.modules.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-medium gp-subtitle">
                    Módulos
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {offer.modules.map((m) => (
                      <span
                        key={m.module_id}
                        className="rounded-md gp-card px-2 py-0.5 text-xs"
                      >
                        {m.module_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </Card>
          ))}
        </div>
      )}

      <Modal state={editState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[500px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Editar oferta</Modal.Heading>
              </Modal.Header>
              <OfferForm
                key={editing?.id ?? "edit"}
                onSubmit={handleEdit}
                error={error}
                submitting={submitting}
                editing={editing}
                apps={apps}
                allModules={modules}
              >
                Guardar
              </OfferForm>
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
                <Modal.Heading>Eliminar oferta</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {error && (
                  <Alert status="danger">
                    <Alert.Description>{error}</Alert.Description>
                  </Alert>
                )}
                <p className={gp.subtitle}>
                  ¿Estás seguro de que querés eliminar la oferta{" "}
                  <strong>{deleting?.name}</strong>?
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
