"use client";

import {
  Alert,
  Button,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import Gift from "@gravity-ui/icons/Gift";
import Plus from "@gravity-ui/icons/Plus";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import Clock from "@gravity-ui/icons/Clock";
import { useMemo, useState } from "react";
import { useOffers } from "../hooks/useOffers";
import type { Offer } from "../types";
import { useApps } from "@/src/features/apps/hooks/useApps";
import { useCatalog } from "@/src/features/catalog/hooks/useCatalog";
import { PageHeader } from "@/src/shared/components/PageHeader";
import { StatCard } from "@/src/shared/components/StatCard";
import { gp } from "@/src/shared/ui/theme";
import { getDateRangeStatus } from "@/src/shared/utils/format-display";
import { OfferCard } from "./OfferCard";

type OfferFormProps = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  error: string;
  submitting: boolean;
  editing?: Offer | null;
  apps: { id: number; name: string | null }[];
  allModules: { id: number; name: string }[];
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
  const [selectedAppId, setSelectedAppId] = useState(editing?.app_id ?? "");
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
          Plantilla (catálogo)
          <select
            name="app_id"
            required
            value={String(selectedAppId)}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className={gp.select}
          >
            <option value="">Seleccionar plantilla</option>
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
                editing?.start_at ? editing.start_at.split("T")[0] : ""
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
                editing?.expires_at ? editing.expires_at.split("T")[0] : ""
              }
              className={gp.input}
            />
          </label>
        </div>
        <fieldset>
            <legend className={`${gp.label} mb-2`}>Módulos</legend>
            {allModules.length === 0 ? (
              <p className={gp.subtitle}>No hay módulos disponibles</p>
            ) : (
              <div
                className="max-h-36 space-y-2 overflow-y-auto rounded-lg border p-3"
                style={{ borderColor: "var(--gp-card-border)" }}
              >
                {allModules.map((mod) => (
                  <label
                    key={mod.id}
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <input
                      type="checkbox"
                      name="module_ids"
                      value={mod.id}
                      defaultChecked={selectedModuleIds.has(mod.id)}
                      className="size-4 rounded"
                    />
                    {mod.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
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

export function OffersManager() {
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

  const stats = useMemo(
    () => ({
      total: offers.length,
      active: offers.filter(
        (o) => getDateRangeStatus(o.start_at, o.expires_at) === "active",
      ).length,
      upcoming: offers.filter(
        (o) => getDateRangeStatus(o.start_at, o.expires_at) === "upcoming",
      ).length,
      expired: offers.filter(
        (o) => getDateRangeStatus(o.start_at, o.expires_at) === "expired",
      ).length,
    }),
    [offers],
  );

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await create({
        name: form.get("name") as string,
        app_id: Number(form.get("app_id")),
        price: (form.get("price") as string)
          ? Number(form.get("price"))
          : null,
        start_at: form.get("start_at") as string,
        expires_at: form.get("expires_at") as string,
        module_ids: (form.getAll("module_ids") as string[]).map(Number),
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
        name: form.get("name") as string,
        app_id: Number(form.get("app_id")),
        price: (form.get("price") as string)
          ? Number(form.get("price"))
          : null,
        start_at: form.get("start_at") as string,
        expires_at: form.get("expires_at") as string,
        module_ids: (form.getAll("module_ids") as string[]).map(Number),
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
      <PageHeader
        title="Ofertas"
        description="Promociones temporales con módulos y precios especiales por aplicación."
        Icon={Gift}
        action={
          <Modal state={createState}>
            <Button
              style={{
                backgroundColor: "var(--gp-primary)",
                color: "var(--gp-primary-text)",
              }}
            >
              <Plus width={16} height={16} />
              Nueva oferta
            </Button>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog className="sm:max-w-md">
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
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Gift} label="Total" value={stats.total} />
        <StatCard
          icon={CircleCheck}
          label="Vigentes"
          value={stats.active}
          featured={stats.active > 0}
        />
        <StatCard icon={Clock} label="Próximas" value={stats.upcoming} />
        <StatCard icon={Gift} label="Finalizadas" value={stats.expired} />
      </div>

      {offers.length === 0 ? (
        <div className={`${gp.empty} flex flex-col items-center gap-3 py-16`}>
          <Gift width={40} height={40} className="text-[var(--gp-text-faint)]" />
          <p className="text-sm font-medium text-[var(--gp-text)]">
            No hay ofertas registradas
          </p>
          <p className="text-xs text-[var(--gp-text-muted)]">
            Creá promociones con vigencia y módulos incluidos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onEdit={(o) => {
                setEditing(o);
                setError("");
                editState.open();
              }}
              onDelete={(o) => {
                setDeleting(o);
                setError("");
                deleteState.open();
              }}
            />
          ))}
        </div>
      )}

      <Modal state={editState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
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
            <Modal.Dialog className="sm:max-w-md">
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
                  ¿Eliminar la oferta <strong>{deleting?.name}</strong>?
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
