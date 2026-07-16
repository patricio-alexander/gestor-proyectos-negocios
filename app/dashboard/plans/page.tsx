"use client";

import { Alert, Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import { usePlans } from "@/src/features/plans/hooks/usePlans";
import { PlanCard } from "@/src/features/plans/components/PlanCard";
import { ExportPlansModal } from "@/src/features/plans/components/ExportPlansModal";
import { filterDeploymentAppsForPlan } from "@/src/features/plans/lib/plan-for-app";
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

type PlanFormApp = {
  id: number;
  name: string | null;
  kind?: string;
  modules?: Array<{ id: number; key?: string; name: string }>;
};

type PlanFormProps = {
  onSubmit: (e: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
  error: string;
  submitting: boolean;
  editing?: Plan | null;
  apps: PlanFormApp[];
  allModules: ModuleRecord[];
  allOffers: Offer[];
  children: React.ReactNode;
};

function PlanForm({
  onSubmit,
  error,
  submitting,
  editing,
  apps,
  allModules,
  allOffers,
  children,
}: PlanFormProps) {
  const monthlyPrice =
    editing?.prices?.find((p) => p.period === "MONTHLY")?.price ?? "";
  const annualPrice =
    editing?.prices?.find((p) => p.period === "ANNUALLY")?.price ?? "";
  const selectedOfferIds = new Set(
    editing?.plan_offers?.map((o) => o.offer_id) ?? [],
  );
  const [selectedAppId, setSelectedAppId] = useState<string>(
    editing?.app_ids?.[0]?.toString() ?? "",
  );
  const planAppId = selectedAppId ? Number(selectedAppId) : undefined;
  const selectedApp = apps.find((app) => app.id === planAppId) ?? null;
  const selectedModuleIds = new Set(
    editing?.plan_modules
      ?.filter((m) => m.app_id === planAppId)
      .map((m) => m.module_id) ?? [],
  );
  const availableModules =
    planAppId && selectedApp?.modules?.length
      ? selectedApp.modules.map((mod) => {
          const catalog = allModules.find((c) => c.id === mod.id);
          return {
            id: mod.id,
            name: mod.name,
            is_trial: catalog?.is_trial ?? false,
          };
        })
      : [];
  const filteredOffers = planAppId
    ? allOffers.filter((off) => off.app_id === planAppId)
    : [];

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
        <label className="gp-label">
          Aplicación
          <select
            name="app_id"
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className="gp-input"
          >
            <option value="">Seleccioná una app</option>
            {apps.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name || `App ${app.id}`}
              </option>
            ))}
          </select>
        </label>
        <fieldset key={selectedAppId || "no-app"}>
          <legend className="mb-2 text-sm font-medium text-zinc-700">
            Módulos para la app seleccionada
          </legend>
          {!planAppId ? (
            <p className="gp-subtitle">
              Seleccioná una app para ver sus módulos
            </p>
          ) : availableModules.length === 0 ? (
            <p className="gp-subtitle">No hay módulos asignados a esta app</p>
          ) : (
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 p-3">
              {availableModules.map((mod) => (
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
              ))}
            </div>
          )}
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-700">
            Ofertas
          </legend>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 p-3">
            {!planAppId ? (
              <p className="gp-subtitle">Seleccioná una app para ver ofertas</p>
            ) : filteredOffers.length === 0 ? (
              <p className="gp-subtitle">No hay ofertas para esta app</p>
            ) : (
              filteredOffers.map((off) => (
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

function getAppIdsFromForm(
  form: HTMLFormElement,
  fallbackAppIds: number[],
): number[] {
  const appIdRaw = form.elements.namedItem("app_id");
  if (appIdRaw instanceof HTMLSelectElement && appIdRaw.value) {
    const appId = Number(appIdRaw.value);
    if (!Number.isNaN(appId)) return [appId];
  }
  return fallbackAppIds;
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
  const deploymentApps = useMemo(
    () => businesses.filter((b) => b.kind !== "template"),
    [businesses],
  );
  const { modules: catalogModules } = useCatalog();
  const { offers } = useOffers();
  const { subscriptions, refetch: refetchSubscriptions } = useSubscriptions();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [deleting, setDeleting] = useState<Plan | null>(null);
  const [enabling, setEnabling] = useState<Plan | null>(null);
  const [viewingSubs, setViewingSubs] = useState<Plan | null>(null);
  const [enableSuccess, setEnableSuccess] = useState<string | null>(null);
  const [enableAppId, setEnableAppId] = useState("");
  const [enablePeriod, setEnablePeriod] = useState<
    "MONTHLY" | "ANNUALLY" | null
  >(null);
  const [pendingReplace, setPendingReplace] = useState<{
    message: string;
    currentPlanName: string | null;
    nextPlanName: string | null;
  } | null>(null);
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

  const enableEligibleApps = useMemo(() => {
    if (!enabling) return [];
    return filterDeploymentAppsForPlan(deploymentApps, enabling);
  }, [deploymentApps, enabling]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const priceMonthly = formData.get("price_monthly") as string;
    const priceAnnual = formData.get("price_annual") as string;
    const appIds = getAppIdsFromForm(form, []);

    try {
      await create({
        name: formData.get("name") as string,
        app_ids: appIds,
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

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setError("");
    setSubmitting(true);
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const priceMonthly = formData.get("price_monthly") as string;
    const priceAnnual = formData.get("price_annual") as string;
    const appIds = getAppIdsFromForm(form, editing.app_ids ?? []);

    try {
      await update(editing.id, {
        name: formData.get("name") as string,
        app_ids: appIds,
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
    setEnablePeriod(null);
    setPendingReplace(null);
    const eligible = filterDeploymentAppsForPlan(deploymentApps, plan);
    setEnableAppId(eligible[0] ? String(eligible[0].id) : "");
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
    if (!enableEligibleApps.some((app) => String(app.id) === enableAppId)) {
      setError("La app seleccionada no forma parte de este plan");
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
        throw new Error(
          data.error || data.message || "Error al habilitar suscripción",
        );
      }
      setPendingReplace(null);
      const pushErr = String(data.push_error || "");
      const unauthorized =
        /no autorizado|gestor sync|401/i.test(pushErr) ||
        /no autorizado \(gestor sync\)/i.test(pushErr);
      const pushNote = data.push_skipped
        ? " (la app no tiene URL de entitlement; configurala en Aplicaciones)"
        : data.push_ok
          ? " y se envió a la app"
          : unauthorized
            ? " (aviso: sync rechazado — la API Key del gestor no coincide con GESTOR_SYNC_SECRET del backend. En Aplicaciones → Editar app, copiá la API Key al .env del backend y reiniciá)"
            : ` (aviso: no se pudo empujar a la app${pushErr ? `: ${pushErr}` : ""})`;
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
        description="Definí precios y módulos por app. Desde cada plan podés crear una suscripción en una app desplegada."
        Icon={FileText}
        action={
          <div className="flex items-center gap-2">
            <ExportPlansModal
              plans={plans}
              apps={businesses.map((app) => ({
                id: app.id,
                name: app.name,
              }))}
            />
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
                      apps={businesses.map((app) => ({
                        id: app.id,
                        name: app.name,
                        kind: app.kind ?? "deployment",
                        modules: app.modules ?? [],
                      }))}
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
          <FileText
            width={40}
            height={40}
            className="text-[var(--gp-text-faint)]"
          />
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
                apps={businesses.map((app) => ({
                  id: app.id,
                  name: app.name,
                  kind: app.kind ?? "deployment",
                  modules: app.modules ?? [],
                }))}
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
                    ? "Suscripción creada"
                    : pendingReplace
                      ? "La app ya tiene un plan"
                      : "Crear suscripción"}
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
                      <Alert.Description>
                        {pendingReplace.message}
                      </Alert.Description>
                    </Alert>
                    <p className="text-sm text-zinc-700">
                      Plan actual:{" "}
                      <strong>{pendingReplace.currentPlanName || "—"}</strong>
                    </p>
                    <p className="text-sm text-zinc-700">
                      Nuevo plan:{" "}
                      <strong>
                        {pendingReplace.nextPlanName || enabling?.name}
                      </strong>
                    </p>
                    <p className="text-xs text-zinc-500">
                      Si confirmás, se cancela el plan activo y se habilita este
                      (mejora / cambio de plan).
                    </p>
                  </div>
                ) : (
                  <>
                    {enableEligibleApps.length === 0 ? (
                      <Alert status="warning">
                        <Alert.Description>
                          Este plan no tiene módulos asignados a ninguna app.
                          Editá el plan y configurá al menos un módulo para una
                          app antes de crear una suscripción.
                        </Alert.Description>
                      </Alert>
                    ) : (
                      <>
                        <p className="gp-subtitle">
                          Creá una suscripción activa para el plan{" "}
                          <strong>{enabling?.name}</strong> en una de las apps
                          que forman parte de este plan.
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
                              {enableEligibleApps.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <p className="text-[11px] text-zinc-500">
                            Tip: la app debe tener URL entitlement + API Key
                            igual a GESTOR_SYNC_SECRET del backend para que el
                            sync llegue.
                          </p>
                          <p className="text-xs font-medium text-zinc-500">
                            Período
                          </p>
                          <div className="flex flex-col gap-3">
                            <Button
                              isDisabled={submitting || !enableAppId}
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
                              isDisabled={submitting || !enableAppId}
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
                    Todavía no hay suscripciones con este plan. Usá «Crear
                    suscripción» en la tarjeta del plan.
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
