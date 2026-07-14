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
import { useOffers } from "@/src/features/offers/hooks/useOffers";
import { useSubscriptions } from "@/src/features/subscriptions/hooks/useSubscriptions";
import type { Plan } from "@/src/features/plans/types";
import type { ModuleRecord } from "@/src/features/catalog/types";
import type { Offer } from "@/src/features/offers/types";
import type { Subscription } from "@/src/features/subscriptions/types";
import { useEffect, useMemo, useState } from "react";
import { gp } from "@/src/shared/ui/theme";
import { ManagerHeader } from "@/src/shared/components/TableSearchBar";
import FileText from "@gravity-ui/icons/FileText";
import Plus from "@gravity-ui/icons/Plus";
import { apiUrl } from "@/src/utils/apiUrl";
import { formatDate } from "@/src/shared/utils/format-display";

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
  const defaultAppId = (() => {
    if (editing?.app_id) return String(editing.app_id);
    const eddeli = businesses.find((b) =>
      /eddeli/i.test(String(b.name || "")),
    );
    if (eddeli) return String(eddeli.id);
    if (businesses.length === 1) return String(businesses[0].id);
    return "";
  })();

  const [selectedBusinessId, setSelectedBusinessId] = useState(defaultAppId);

  useEffect(() => {
    if (!selectedBusinessId && defaultAppId) {
      setSelectedBusinessId(defaultAppId);
    }
  }, [defaultAppId, selectedBusinessId]);

  const catalogApp =
    businesses.find((b) => String(b.id) === String(selectedBusinessId)) || null;
  const catalogLocked =
    Boolean(selectedBusinessId) &&
    (Boolean(catalogApp && /eddeli/i.test(String(catalogApp.name || ""))) ||
      businesses.length === 1);

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
        {catalogLocked ? (
          <>
            <input type="hidden" name="app_id" value={selectedBusinessId} />
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
              <p className="text-xs font-medium text-zinc-500">App</p>
              <p className="text-sm font-semibold text-zinc-900">
                {catalogApp?.name || "EdDeli"}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Fija para estos planes SoftEd (no hace falta elegirla).
              </p>
            </div>
          </>
        ) : (
          <label className="gp-label">
            App
            <select
              name="app_id"
              required
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="gp-select"
            >
              <option value="">Seleccionar app</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        )}
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
            <p className="gp-subtitle">No hay app de catálogo disponible</p>
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
  const { subscriptions, refetch: refetchSubscriptions } = useSubscriptions();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState<Plan | null>(null);
  const [enabling, setEnabling] = useState<Plan | null>(null);
  const [viewingSubs, setViewingSubs] = useState<Plan | null>(null);
  const [enableSuccess, setEnableSuccess] = useState<string | null>(null);
  const [enableAppId, setEnableAppId] = useState("");
  const [enablePeriod, setEnablePeriod] = useState<"MONTHLY" | "ANNUALLY" | null>(
    null,
  );
  const [pendingReplace, setPendingReplace] = useState<{
    message: string;
    currentPlanName: string | null;
    nextPlanName: string | null;
  } | null>(null);
  const [methodPay, setMethodPay] = useState<"CASH" | "TRANSFER" | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const createState = useOverlayState();
  const editState = useOverlayState();
  const deleteState = useOverlayState();
  const enableState = useOverlayState();
  const subListState = useOverlayState();

  const planSubscriptions = useMemo(() => {
    if (!viewingSubs) return [] as Subscription[];
    return subscriptions.filter((s) => s.plan_id === viewingSubs.id);
  }, [subscriptions, viewingSubs]);

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

  function openEnableSubscription(plan: Plan) {
    setEnabling(plan);
    setEnableSuccess(null);
    setMethodPay(null);
    setEnablePeriod(null);
    setPendingReplace(null);
    const eddeli = businesses.find((b) =>
      /eddeli/i.test(String(b.name || "")),
    );
    setEnableAppId(eddeli ? String(eddeli.id) : "");
    setError("");
    enableState.open();
  }

  function openSubscriptionList(plan: Plan) {
    setViewingSubs(plan);
    setError("");
    subListState.open();
    void refetchSubscriptions();
  }

  async function handleEnableSubscription(opts?: {
    replace?: boolean;
    period?: "MONTHLY" | "ANNUALLY";
  }) {
    if (!enabling) return;
    const period = opts?.period ?? enablePeriod;
    if (!enableAppId) {
      setError("Elegí a qué app habilitar este plan");
      return;
    }
    if (!methodPay) {
      setError("Seleccioná el método de pago");
      return;
    }
    if (!period) {
      setError("Seleccioná el período");
      return;
    }
    setEnablePeriod(period);
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/subscriptions/enable"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: enabling.id,
          app_id: Number(enableAppId),
          period,
          method_pay: methodPay,
          replace: Boolean(opts?.replace),
        }),
      });
      const data = await res.json();
      if (res.status === 409 && data.error === "conflict_active_subscription") {
        setPendingReplace({
          message: data.message || "La app ya tiene un plan activo.",
          currentPlanName: data.current?.plan_name ?? null,
          nextPlanName: data.next?.plan_name ?? enabling.name,
        });
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || data.message || "Error al habilitar suscripción");
      }
      setPendingReplace(null);
      const pushNote = data.push_skipped
        ? " (la app no tiene URL de entitlement; configurala en Aplicaciones)"
        : data.push_ok
          ? " y se envió a la app"
          : ` (aviso: no se pudo empujar a la app${data.push_error ? `: ${data.push_error}` : ""})`;
      const replaced = data.replaced_subscription_id
        ? " (reemplazó el plan anterior)"
        : "";
      setEnableSuccess(
        `Suscripción activa en ${data.app_name || "la app"}${replaced}${pushNote}.`,
      );
      await refetchSubscriptions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al habilitar suscripción",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCloseEnable() {
    enableState.close();
    setEnabling(null);
    setEnableSuccess(null);
    setMethodPay(null);
    setEnablePeriod(null);
    setEnableAppId("");
    setPendingReplace(null);
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
        description="Planes SoftEd. Al habilitar, elegís a qué app aplicarlo; si ya tiene plan, te pide confirmar el cambio."
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
              Creá el primer plan para definir precios, módulos y suscripciones.
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
              onEnableSubscription={openEnableSubscription}
              onViewSubscriptions={openSubscriptionList}
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

      <Modal state={enableState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[420px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  {enableSuccess
                    ? "Suscripción habilitada"
                    : pendingReplace
                      ? "La app ya tiene un plan"
                      : "Habilitar suscripción"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {error && (
                  <Alert status="danger">
                    <Alert.Description>{error}</Alert.Description>
                  </Alert>
                )}
                {enableSuccess ? (
                  <div className="flex flex-col items-center gap-3 py-2 text-center">
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
                      {enableSuccess}
                    </p>
                  </div>
                ) : pendingReplace ? (
                  <div className="space-y-3">
                    <Alert status="warning">
                      <Alert.Description>{pendingReplace.message}</Alert.Description>
                    </Alert>
                    <p className="text-sm text-zinc-700">
                      Plan actual:{" "}
                      <strong>{pendingReplace.currentPlanName || "—"}</strong>
                    </p>
                    <p className="text-sm text-zinc-700">
                      Nuevo plan:{" "}
                      <strong>{pendingReplace.nextPlanName || enabling?.name}</strong>
                    </p>
                    <p className="text-xs text-zinc-500">
                      Si confirmás, se cancela el plan activo y se habilita este
                      (mejora / cambio de plan).
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="gp-subtitle">
                      Elegí a qué app habilitar el plan{" "}
                      <strong>{enabling?.name}</strong>.
                    </p>
                    <div className="mt-4 space-y-3">
                      <label className="gp-label">
                        App
                        <select
                          value={enableAppId}
                          onChange={(e) => setEnableAppId(e.target.value)}
                          className="gp-select"
                        >
                          <option value="">Seleccionar app</option>
                          {businesses.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </label>
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
                          isDisabled={submitting || !methodPay || !enableAppId}
                          onPress={() =>
                            handleEnableSubscription({ period: "MONTHLY" })
                          }
                        >
                          {submitting && enablePeriod === "MONTHLY" ? (
                            <Spinner size="sm" />
                          ) : (
                            "Mensual (1 mes)"
                          )}
                        </Button>
                        <Button
                          isDisabled={submitting || !methodPay || !enableAppId}
                          onPress={() =>
                            handleEnableSubscription({ period: "ANNUALLY" })
                          }
                        >
                          {submitting && enablePeriod === "ANNUALLY" ? (
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
                {pendingReplace ? (
                  <>
                    <Button
                      variant="secondary"
                      isDisabled={submitting}
                      onPress={() => setPendingReplace(null)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      isDisabled={submitting}
                      onPress={() =>
                        handleEnableSubscription({ replace: true })
                      }
                    >
                      {submitting ? (
                        <Spinner size="sm" />
                      ) : (
                        "Sí, cambiar / mejorar plan"
                      )}
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" onPress={handleCloseEnable}>
                    {enableSuccess ? "Cerrar" : "Cancelar"}
                  </Button>
                )}
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={subListState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[520px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  Suscripciones · {viewingSubs?.name}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {planSubscriptions.length === 0 ? (
                  <p className="gp-subtitle">
                    Todavía no hay suscripciones con este plan. Usá «Habilitar
                    suscripción».
                  </p>
                ) : (
                  <div className="space-y-3">
                    {planSubscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900">
                            {sub.app_name || sub.app_hash}
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {sub.period === "MONTHLY" ? "Mensual" : "Anual"}
                            {sub.start_at
                              ? ` · desde ${formatDate(sub.start_at)}`
                              : ""}
                            {sub.expires_at
                              ? ` · hasta ${formatDate(sub.expires_at)}`
                              : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            sub.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : sub.status === "EXPIRED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {sub.status === "ACTIVE"
                            ? "Activa"
                            : sub.status === "EXPIRED"
                              ? "Expirada"
                              : "Cancelada"}
                        </span>
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
