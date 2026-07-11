"use client";

import {
  Alert,
  Button,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import { usePlans } from "@/src/features/plans/hooks/usePlans";
import { PlanCard } from "@/src/features/plans/components/PlanCard";
import { ExportPlansModal } from "@/src/features/plans/components/ExportPlansModal";
import { useApps } from "@/src/features/apps/hooks/useApps";
import { useCatalog } from "@/src/features/catalog/hooks/useCatalog";
import { useLicenses } from "@/src/features/licenses/hooks/useLicenses";
import { useOffers } from "@/src/features/offers/hooks/useOffers";
import type { Plan } from "@/src/features/plans/types";
import type { ModuleRecord } from "@/src/features/catalog/types";
import type { Offer } from "@/src/features/offers/types";
import { useState } from "react";
import { gp } from "@/src/shared/ui/theme";
import { ManagerHeader } from "@/src/shared/components/TableSearchBar";
import FileText from "@gravity-ui/icons/FileText";
import Plus from "@gravity-ui/icons/Plus";

type PlanFormProps = {
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
  error: string;
  submitting: boolean;
  editing?: Plan | null;
  businesses: { id: number; name: string | null }[];
  allModules: ModuleRecord[];
  allOffers: Offer[];
  children: React.ReactNode;
};

function PlanForm({
  onSubmit,
  error,
  submitting,
  editing,
  businesses,
  allModules,
  allOffers,
  children,
}: PlanFormProps) {
  const [selectedBusinessId, setSelectedBusinessId] = useState(
    editing?.app_id ?? "",
  );

  const monthlyPrice =
    editing?.prices?.find((p) => p.period === "MONTHLY")?.price ?? "";
  const annualPrice =
    editing?.prices?.find((p) => p.period === "ANNUALLY")?.price ?? "";
  const selectedModuleIds = new Set(
    editing?.plan_modules?.map((m) => m.module_id) ?? [],
  );
  const selectedOfferIds = new Set(
    editing?.plan_offers?.map((o) => o.offer_id) ?? [],
  );

  return (
    <form onSubmit={onSubmit}>
      <Modal.Body className="space-y-4">
        {error && (
          <Alert status="danger">
            <Alert.Description>{error}</Alert.Description>
          </Alert>
        )}
        <label className="gp-label">
          Nombre
          <input
            name="name"
            required
            defaultValue={editing?.name ?? ""}
            placeholder="Nombre del plan"
            className="gp-input"
          />
        </label>
        <label className="gp-label">
          Aplicación
          <select
            name="app_id"
            required
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="gp-select"
          >
            <option value="">Seleccionar aplicación</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="gp-label">
            Precio mensual ($)
            <input
              name="price_monthly"
              type="number"
              min="0"
              step="1"
              defaultValue={monthlyPrice}
              placeholder="Ej: 100"
              className="gp-input"
            />
          </label>
          <label className="gp-label">
            Precio anual ($)
            <input
              name="price_annual"
              type="number"
              min="0"
              step="1"
              defaultValue={annualPrice}
              placeholder="Ej: 1000"
              className="gp-input"
            />
          </label>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-700">
            Módulos
          </legend>
          {!selectedBusinessId ? (
            <p className="gp-subtitle">Seleccioná una aplicación primero</p>
          ) : (
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 p-3">
              {allModules.filter(
                (mod) => mod.app_id === Number(selectedBusinessId),
              ).length === 0 ? (
                <p className="gp-subtitle">
                  No hay módulos para esta aplicación
                </p>
              ) : (
                allModules
                  .filter((mod) => mod.app_id === Number(selectedBusinessId))
                  .map((mod) => (
                    <label
                      key={mod.id}
                      className="flex items-center gap-2 text-sm font-medium text-zinc-800"
                    >
                      <input
                        type="checkbox"
                        name="module_ids"
                        value={mod.id}
                        defaultChecked={selectedModuleIds.has(mod.id)}
                        className="size-4 rounded border-zinc-300"
                      />
                      {mod.name}
                      {mod.is_trial && (
                        <span className="rounded bg-amber-200 px-1 py-0.5 text-[9px] font-semibold uppercase leading-none text-amber-800">
                          Trial
                        </span>
                      )}
                    </label>
                  ))
              )}
            </div>
          )}
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-700">
            Ofertas
          </legend>
          {!selectedBusinessId ? (
            <p className="gp-subtitle">Seleccioná una aplicación primero</p>
          ) : (
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 p-3">
              {allOffers.filter(
                (off) => off.app_id === Number(selectedBusinessId),
              ).length === 0 ? (
                <p className="gp-subtitle">
                  No hay ofertas para esta aplicación
                </p>
              ) : (
                allOffers
                  .filter((off) => off.app_id === Number(selectedBusinessId))
                  .map((off) => (
                    <label
                      key={off.id}
                      className="flex items-center gap-2 text-sm font-medium text-zinc-800"
                    >
                      <input
                        type="checkbox"
                        name="offer_ids"
                        value={off.id}
                        defaultChecked={selectedOfferIds.has(off.id)}
                        className="size-4 rounded border-zinc-300"
                      />
                      {off.name}
                    </label>
                  ))
              )}
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

function getCheckedIds(form: HTMLFormElement, name: string) {
  const formData = new FormData(form);
  const ids: number[] = [];
  for (const entry of formData.getAll(name)) {
    ids.push(Number(entry));
  }
  return ids;
}

export default function PlansPage() {
  const { plans, loading, create, update, remove } = usePlans();
  const { apps: businesses } = useApps();
  const { modules: catalogModules } = useCatalog();
  const { offers } = useOffers();
  const {
    licenses,
    fetchByPlan,
    create: createLicense,
    revoke: revokeLicense,
  } = useLicenses();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState<Plan | null>(null);
  const [licensing, setLicensing] = useState<Plan | null>(null);
  const [viewingLicenses, setViewingLicenses] = useState<Plan | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [methodPay, setMethodPay] = useState<"CASH" | "TRANSFER" | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const createState = useOverlayState();
  const editState = useOverlayState();
  const deleteState = useOverlayState();
  const licenseCreateState = useOverlayState();
  const licenseListState = useOverlayState();

  async function handleCreate(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const priceMonthly = formData.get("price_monthly") as string;
    const priceAnnual = formData.get("price_annual") as string;
    try {
      await create({
        name: formData.get("name") as string,
        app_id: Number(formData.get("app_id")),
        price_monthly: priceMonthly ? Number(priceMonthly) : null,
        price_annual: priceAnnual ? Number(priceAnnual) : null,
        module_ids: getCheckedIds(form, "module_ids"),
        offer_ids: getCheckedIds(form, "offer_ids"),
      });
      createState.close();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setError("");
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const priceMonthly = formData.get("price_monthly") as string;
    const priceAnnual = formData.get("price_annual") as string;
    try {
      await update(editing.id, {
        name: formData.get("name") as string,
        app_id: Number(formData.get("app_id")),
        price_monthly: priceMonthly ? Number(priceMonthly) : undefined,
        price_annual: priceAnnual ? Number(priceAnnual) : undefined,
        module_ids: getCheckedIds(form, "module_ids"),
        offer_ids: getCheckedIds(form, "offer_ids"),
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

  function openEdit(plan: Plan) {
    setEditing(plan);
    setError("");
    editState.open();
  }

  function openDelete(plan: Plan) {
    setDeleting(plan);
    setError("");
    deleteState.open();
  }

  function openLicenseCreate(plan: Plan) {
    setLicensing(plan);
    setError("");
    licenseCreateState.open();
  }

  function openLicenseList(plan: Plan) {
    setViewingLicenses(plan);
    setError("");
    licenseListState.open();
    fetchByPlan(plan.id);
  }

  async function handleCreateLicense(period: "MONTHLY" | "ANNUALLY") {
    if (!licensing) return;
    if (!methodPay) {
      setError("Seleccioná el método de pago");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const lic = await createLicense({
        plan_id: licensing.id,
        period,
        method_pay: methodPay,
      });
      setGeneratedKey(lic.key);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear licencia");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopyKey() {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCloseLicenseCreate() {
    licenseCreateState.close();
    setLicensing(null);
    setGeneratedKey(null);
    setCopied(false);
    setMethodPay(null);
    setError("");
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
        title="Planes"
        description="Planes comerciales, precios y licencias por aplicación"
        Icon={FileText}
        action={
          <div className="flex items-center gap-2">
            <ExportPlansModal plans={plans} apps={businesses} />
            <Modal state={createState}>
              <Button
                style={{
                  backgroundColor: "var(--gp-primary)",
                  color: "var(--gp-primary-text)",
                }}
              >
                <Plus width={16} height={16} />
                Nuevo plan
              </Button>
              <Modal.Backdrop>
                <Modal.Container>
                  <Modal.Dialog className="sm:max-w-200">
                    <Modal.CloseTrigger />
                    <Modal.Header>
                      <Modal.Heading>Nuevo plan</Modal.Heading>
                    </Modal.Header>
                    <PlanForm
                      key="create"
                      onSubmit={handleCreate}
                      error={error}
                      submitting={submitting}
                      businesses={businesses}
                      allModules={catalogModules}
                      allOffers={offers}
                    >
                      Crear
                    </PlanForm>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>
          </div>
        }
      />

      {plans.length === 0 ? (
        <div className={`${gp.empty} flex flex-col items-center gap-3 py-16`}>
          <FileText width={40} height={40} className="text-[var(--gp-text-faint)]" />
          <div>
            <p className="text-sm font-medium text-[var(--gp-text)]">
              No hay planes registrados
            </p>
            <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
              Creá el primer plan para definir precios, módulos y licencias.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={openEdit}
              onDelete={openDelete}
              onCreateLicense={openLicenseCreate}
              onViewLicenses={openLicenseList}
            />
          ))}
        </div>
      )}

      <Modal state={editState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[500px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Editar plan</Modal.Heading>
              </Modal.Header>
              <PlanForm
                key={editing?.id ?? "edit"}
                onSubmit={handleEdit}
                error={error}
                submitting={submitting}
                editing={editing}
                businesses={businesses}
                allModules={catalogModules}
                allOffers={offers}
              >
                Guardar
              </PlanForm>
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
                <Modal.Heading>Eliminar plan</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {error && (
                  <Alert status="danger">
                    <Alert.Description>{error}</Alert.Description>
                  </Alert>
                )}
                <p className="gp-subtitle">
                  ¿Estás seguro de que querés eliminar el plan{" "}
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

      <Modal state={licenseCreateState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[420px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  {generatedKey ? "Licencia generada" : "Crear licencia"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {error && (
                  <Alert status="danger">
                    <Alert.Description>{error}</Alert.Description>
                  </Alert>
                )}
                {generatedKey ? (
                  <div className="flex flex-col items-center gap-4 py-2 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-green-600"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-green-700">
                      Licencia generada con éxito
                    </p>
                    <div className="flex w-full items-center gap-2 rounded-lg border bg-zinc-50 px-3 py-2.5">
                      <span className="flex-1 select-all font-mono text-xs text-zinc-900">
                        {generatedKey}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="shrink-0 cursor-pointer rounded-md border bg-white px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                      >
                        {copied ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="gp-subtitle">
                      Seleccioná el período para la licencia del plan{" "}
                      <strong>{licensing?.name}</strong>
                    </p>
                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-medium text-zinc-500">
                        Método de pago
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setMethodPay("CASH")}
                          className={`flex-1 cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                            methodPay === "CASH"
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          Efectivo
                        </button>
                        <button
                          type="button"
                          onClick={() => setMethodPay("TRANSFER")}
                          className={`flex-1 cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                            methodPay === "TRANSFER"
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                          }`}
                        >
                          Transferencia
                        </button>
                      </div>
                      <p className="text-xs font-medium text-zinc-500">
                        Período
                      </p>
                      <div className="flex flex-col gap-3">
                        <Button
                          isDisabled={submitting || !methodPay}
                          onPress={() => handleCreateLicense("MONTHLY")}
                        >
                          {submitting ? (
                            <Spinner size="sm" />
                          ) : (
                            "Mensual (1 mes)"
                          )}
                        </Button>
                        <Button
                          isDisabled={submitting || !methodPay}
                          onPress={() => handleCreateLicense("ANNUALLY")}
                        >
                          {submitting ? (
                            <Spinner size="sm" />
                          ) : (
                            "Anual (12 meses)"
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={handleCloseLicenseCreate}>
                  {generatedKey ? "Cerrar" : "Cancelar"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={licenseListState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[500px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  Licencias de {viewingLicenses?.name}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {licenses.length === 0 ? (
                  <p className="gp-subtitle">
                    No hay licencias generadas para este plan
                  </p>
                ) : (
                  <div className="space-y-3">
                    {licenses.map((lic) => (
                      <div
                        key={lic.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-xs text-zinc-900">
                            {lic.key}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {lic.period === "MONTHLY" ? "Mensual" : "Anual"}{" "}
                            &middot;{" "}
                            {lic.status === "AVAILABLE"
                              ? "Disponible"
                              : lic.status === "USED"
                                ? "Usada"
                                : "Revocada"}
                            {lic.method_pay && (
                              <>
                                {" "}
                                &middot;{" "}
                                {lic.method_pay === "CASH"
                                  ? "Efectivo"
                                  : "Transferencia"}
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              lic.status === "AVAILABLE"
                                ? "bg-green-100 text-green-700"
                                : lic.status === "USED"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {lic.status === "AVAILABLE"
                              ? "Disponible"
                              : lic.status === "USED"
                                ? "Usada"
                                : "Revocada"}
                          </span>
                          {lic.status === "AVAILABLE" && (
                            <button
                              type="button"
                              onClick={() => revokeLicense(lic.id)}
                              className="cursor-pointer rounded-lg border border-red-300 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                            >
                              Revocar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" slot="close">
                  Cerrar
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
