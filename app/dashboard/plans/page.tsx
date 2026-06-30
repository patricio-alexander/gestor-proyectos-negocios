"use client";

import {
  Alert,
  Button,
  Card,
  Modal,
  Spinner,
  useOverlayState,
} from "@heroui/react";
import { usePlans } from "@/src/features/plans/hooks/usePlans";
import { useBusinesses } from "@/src/features/businesses/hooks/useBusinesses";
import { useCatalog } from "@/src/features/catalog/hooks/useCatalog";
import { useLicenses } from "@/src/features/licenses/hooks/useLicenses";
import type { Plan } from "@/src/features/plans/types";
import type { AppModuleRecord } from "@/src/features/catalog/types";
import type { License } from "@/src/features/licenses/types";
import { useState } from "react";
import FileText from "@gravity-ui/icons/FileText";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Plus from "@gravity-ui/icons/Plus";
import ShieldKeyhole from "@gravity-ui/icons/ShieldKeyhole";
import Key from "@gravity-ui/icons/Key";

function formatPrice(price: number | null | undefined) {
  if (price == null) return null;
  return `$${price}`;
}

type PlanFormProps = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  error: string;
  submitting: boolean;
  editing?: Plan | null;
  businesses: { id: number; name: string | null }[];
  allModules: AppModuleRecord[];
  children: React.ReactNode;
};

function PlanForm({
  onSubmit,
  error,
  submitting,
  editing,
  businesses,
  allModules,
  children,
}: PlanFormProps) {
  const [selectedBusinessId, setSelectedBusinessId] = useState(
    editing?.business_id ?? "",
  );

  const monthlyPrice =
    editing?.prices?.find((p) => p.period === "MONTHLY")?.price ?? "";
  const annualPrice =
    editing?.prices?.find((p) => p.period === "ANNUALLY")?.price ?? "";
  const selectedModuleIds = new Set(
    editing?.modules?.map((m) => m.app_module_id) ?? [],
  );
  const selectedSectionIds = new Set(
    editing?.sections?.map((s) => s.app_section_id) ?? [],
  );

  const activeModules = allModules.filter((m) => m.is_active);

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
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          />
        </label>
        <label className="gp-label">
          Negocio
          <select
            name="business_id"
            required
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          >
            <option value="">Seleccionar negocio</option>
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
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
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
              className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            />
          </label>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-700">
            Módulos EdDeli (catálogo global)
          </legend>
          {activeModules.length === 0 ? (
            <p className="gp-subtitle">No hay módulos en el catálogo</p>
          ) : (
            <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-zinc-200 p-3">
              {activeModules.map((mod) => (
                <div key={mod.id}>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                    <input
                      type="checkbox"
                      name="app_module_ids"
                      value={mod.id}
                      defaultChecked={selectedModuleIds.has(mod.id)}
                      className="size-4 rounded border-zinc-300"
                    />
                    {mod.name}
                    <span className="font-mono text-xs text-zinc-400">{mod.key}</span>
                  </label>
                  {mod.sections.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1">
                      {mod.sections
                        .filter((s) => s.is_active)
                        .map((section) => (
                          <label
                            key={section.id}
                            className="flex items-center gap-2 text-xs text-zinc-600"
                          >
                            <input
                              type="checkbox"
                              name="app_section_ids"
                              value={section.id}
                              defaultChecked={selectedSectionIds.has(section.id)}
                              className="size-3.5 rounded border-zinc-300"
                            />
                            {section.name}
                          </label>
                        ))}
                    </div>
                  )}
                </div>
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
  const { businesses } = useBusinesses();
  const { modules: catalogModules } = useCatalog();
  const { licenses, fetchByPlan, create: createLicense, revoke: revokeLicense } = useLicenses();
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

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
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
        business_id: Number(formData.get("business_id")),
        price_monthly: priceMonthly ? Number(priceMonthly) : null,
        price_annual: priceAnnual ? Number(priceAnnual) : null,
        app_module_ids: getCheckedIds(form, "app_module_ids"),
        app_section_ids: getCheckedIds(form, "app_section_ids"),
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
    const form = e.currentTarget;
    const formData = new FormData(form);
    const priceMonthly = formData.get("price_monthly") as string;
    const priceAnnual = formData.get("price_annual") as string;
    try {
      await update(editing.id, {
        name: formData.get("name") as string,
        business_id: Number(formData.get("business_id")),
        price_monthly: priceMonthly ? Number(priceMonthly) : undefined,
        price_annual: priceAnnual ? Number(priceAnnual) : undefined,
        app_module_ids: getCheckedIds(form, "app_module_ids"),
        app_section_ids: getCheckedIds(form, "app_section_ids"),
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
      const lic = await createLicense({ plan_id: licensing.id, period, method_pay: methodPay });
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
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="gp-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText width={24} height={24} className="text-zinc-700" />
          <h1 className="gp-title">Planes</h1>
        </div>

        <Modal state={createState}>
          <Button>
            <Plus width={16} height={16} />
            Nuevo plan
          </Button>
          <Modal.Backdrop>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[500px]">
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
                >
                  Crear
                </PlanForm>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 py-16 text-center">
          <FileText width={48} height={48} className="text-zinc-300" />
          <p className="gp-subtitle">
            No hay planes registrados todavía
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const monthly = plan.prices?.find((p) => p.period === "MONTHLY");
            const annual = plan.prices?.find((p) => p.period === "ANNUALLY");
            return (
              <Card key={plan.id}>
                <Card.Content>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-zinc-900">
                        {plan.name || "-"}
                      </h3>
                      <p className="mt-0.5 gp-subtitle">
                        {plan.business_name || "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(plan)}
                        className="cursor-pointer rounded-lg border p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                        aria-label="Editar"
                      >
                        <Pencil width={14} height={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(plan)}
                        className="cursor-pointer rounded-lg border p-1.5 text-red-600 transition-colors hover:bg-red-50"
                        aria-label="Eliminar"
                      >
                        <TrashBin width={14} height={14} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-zinc-50 p-3">
                      <p className="text-xs text-zinc-500">Mensual</p>
                      <p className="mt-0.5 text-lg font-semibold text-zinc-900">
                        {formatPrice(monthly?.price) || "—"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-3">
                      <p className="text-xs text-zinc-500">Anual</p>
                      <p className="mt-0.5 text-lg font-semibold text-zinc-900">
                        {formatPrice(annual?.price) || "—"}
                      </p>
                    </div>
                  </div>
                  {plan.modules && plan.modules.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-1.5 text-xs font-medium text-zinc-500">
                        Módulos
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {plan.modules.map((m) => (
                          <span
                            key={m.id}
                            className="rounded-md gp-card px-2 py-0.5 text-xs text-zinc-700"
                          >
                            {m.module_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openLicenseCreate(plan)}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                    >
                      <ShieldKeyhole width={14} height={14} />
                      Crear licencia
                    </button>
                    <button
                      type="button"
                      onClick={() => openLicenseList(plan)}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
                    >
                      <Key width={14} height={14} />
                      Ver licencias
                    </button>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
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
                      <p className="text-xs font-medium text-zinc-500">Método de pago</p>
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
                      <p className="text-xs font-medium text-zinc-500">Período</p>
                      <div className="flex flex-col gap-3">
                        <Button
                          isDisabled={submitting || !methodPay}
                          onPress={() => handleCreateLicense("MONTHLY")}
                        >
                          {submitting ? <Spinner size="sm" /> : "Mensual (1 mes)"}
                        </Button>
                        <Button
                          isDisabled={submitting || !methodPay}
                          onPress={() => handleCreateLicense("ANNUALLY")}
                        >
                          {submitting ? <Spinner size="sm" /> : "Anual (12 meses)"}
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
                            {lic.period === "MONTHLY"
                              ? "Mensual"
                              : "Anual"}{" "}
                            &middot;{" "}
                            {lic.status === "AVAILABLE"
                              ? "Disponible"
                              : lic.status === "USED"
                                ? "Usada"
                                : "Revocada"}
                            {lic.method_pay && (
                              <>
                                {" "}&middot;{" "}
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
