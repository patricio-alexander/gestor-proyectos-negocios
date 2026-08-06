"use client";

import { Alert, Button, Label, ListBox, Modal, Select, Spinner, useOverlayState } from "@heroui/react";
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
import { appToast } from "@/src/shared/utils/app-toast";
import { ManagerHeader } from "@/src/shared/components/TableSearchBar";
import { GestorHowItWorks } from "@/src/shared/components/GestorHowItWorks";
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
  submitting: boolean;
  editing?: Plan | null;
  apps: PlanFormApp[];
  allModules: ModuleRecord[];
  allOffers: Offer[];
  children: React.ReactNode;
};

function PlanForm({
  onSubmit,
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
        <Select
          aria-label="Aplicación"
          selectedKey={selectedAppId || null}
          onSelectionChange={(key) => setSelectedAppId(key ? String(key) : "")}
          isRequired
        >
          <Label>Aplicación</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {apps.map((app) => (
                <ListBox.Item
                  key={app.id}
                  id={String(app.id)}
                  textValue={app.name || `App ${app.id}`}
                >
                  {app.name || `App ${app.id}`}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <input type="hidden" name="app_id" value={selectedAppId} />
        <fieldset key={selectedAppId || "no-app"}>
          <legend className="mb-2 text-sm font-medium text-[var(--gp-text)]">
            Módulos para la app seleccionada
          </legend>
          {!planAppId ? (
            <p className="gp-subtitle">
              Seleccioná una app para ver sus módulos
            </p>
          ) : availableModules.length === 0 ? (
            <p className="gp-subtitle">No hay módulos asignados a esta app</p>
          ) : (
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-[var(--gp-border)] bg-[var(--gp-surface-muted)]/30 p-3">
              {availableModules.map((mod) => (
                <label
                  key={mod.id}
                  className="flex items-center gap-2 text-sm font-medium text-[var(--gp-text)]"
                >
                  <input
                    type="checkbox"
                    name="module_ids"
                    value={mod.id}
                    defaultChecked={selectedModuleIds.has(mod.id)}
                    className="size-4 rounded border-[var(--gp-input-border)]"
                  />
                  {mod.name}
                  {mod.is_trial && (
                    <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-semibold uppercase leading-none text-amber-800 dark:text-amber-200">
                      Trial
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-[var(--gp-text)]">
            Ofertas
          </legend>
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-[var(--gp-border)] bg-[var(--gp-surface-muted)]/30 p-3">
            {!planAppId ? (
              <p className="gp-subtitle">Seleccioná una app para ver ofertas</p>
            ) : filteredOffers.length === 0 ? (
              <p className="gp-subtitle">No hay ofertas para esta app</p>
            ) : (
              filteredOffers.map((off) => (
                <label
                  key={off.id}
                  className="flex items-center gap-2 text-sm font-medium text-[var(--gp-text)]"
                >
                  <input
                    type="checkbox"
                    name="offer_ids"
                    value={off.id}
                    defaultChecked={selectedOfferIds.has(off.id)}
                    className="size-4 rounded border-[var(--gp-input-border)]"
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
  const appIdRaw = new FormData(form).get("app_id");
  if (appIdRaw && String(appIdRaw)) {
    const appId = Number(appIdRaw);
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
  const [enableAppId, setEnableAppId] = useState("");
  const [enablePeriod, setEnablePeriod] = useState<
    "MONTHLY" | "ANNUALLY" | null
  >(null);
  const [pendingReplace, setPendingReplace] = useState<{
    message: string;
    currentPlanName: string | null;
    nextPlanName: string | null;
  } | null>(null);
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
      appToast.success("Plan creado");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
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
      appToast.success("Plan actualizado");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setSubmitting(true);
    try {
      await remove(deleting.id);
      deleteState.close();
      setDeleting(null);
      appToast.success("Plan eliminado");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(plan: Plan) {
    setEditing(plan);
    editState.open();
  }

  function openDelete(plan: Plan) {
    setDeleting(plan);
    deleteState.open();
  }

  function openEnableSubscription(plan: Plan) {
    setEnabling(plan);
    setEnablePeriod(null);
    setPendingReplace(null);
    const eligible = filterDeploymentAppsForPlan(deploymentApps, plan);
    setEnableAppId(eligible[0] ? String(eligible[0].id) : "");
    enableState.open();
  }

  function openSubscriptionList(plan: Plan) {
    setViewingSubs(plan);
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
      appToast.warning("Elegí a qué app habilitar este plan");
      return;
    }
    if (!enableEligibleApps.some((app) => String(app.id) === enableAppId)) {
      appToast.warning("La app seleccionada no forma parte de este plan");
      return;
    }
    if (!period) {
      appToast.warning("Seleccioná el período");
      return;
    }
    setEnablePeriod(period);
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
            : pushErr
              ? ` (aviso: ${pushErr})`
              : " (aviso: no se pudo empujar a la app)";
      const replaced = data.replaced_subscription_id
        ? " (reemplazó el plan anterior)"
        : "";
      appToast.success(
        `Suscripción activa en ${data.app_name || "la app"}${replaced}${pushNote}.`,
      );
      await refetchSubscriptions();
      handleCloseEnable();
    } catch (err) {
      appToast.error(
        err instanceof Error ? err.message : "Error al habilitar suscripción",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCloseEnable() {
    enableState.close();
    setEnabling(null);
    setEnablePeriod(null);
    setEnableAppId("");
    setPendingReplace(null);
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
        description="Definí precios y módulos por app web. Los planes de apps móvil están en Apps móvil."
        Icon={FileText}
        action={
          <div className="flex items-center gap-2">
            <GestorHowItWorks defaultTopic="plans" />
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
                  {pendingReplace
                    ? "La app ya tiene un plan"
                    : "Crear suscripción"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {pendingReplace ? (
                  <div className="space-y-3">
                    <Alert status="warning">
                      <Alert.Description>
                        {pendingReplace.message}
                      </Alert.Description>
                    </Alert>
                    <p className="text-sm text-[var(--gp-text)]">
                      Plan actual:{" "}
                      <strong>{pendingReplace.currentPlanName || "—"}</strong>
                    </p>
                    <p className="text-sm text-[var(--gp-text)]">
                      Nuevo plan:{" "}
                      <strong>
                        {pendingReplace.nextPlanName || enabling?.name}
                      </strong>
                    </p>
                    <p className="text-xs text-[var(--gp-text-muted)]">
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
                          <Select
                            aria-label="App"
                            selectedKey={enableAppId || null}
                            onSelectionChange={(key) =>
                              setEnableAppId(key ? String(key) : "")
                            }
                            isRequired
                          >
                            <Label>App</Label>
                            <Select.Trigger>
                              <Select.Value />
                              <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                              <ListBox>
                                {enableEligibleApps.map((b) => (
                                  <ListBox.Item
                                    key={b.id}
                                    id={String(b.id)}
                                    textValue={b.name ?? `App ${b.id}`}
                                  >
                                    {b.name}
                                    <ListBox.ItemIndicator />
                                  </ListBox.Item>
                                ))}
                              </ListBox>
                            </Select.Popover>
                          </Select>
                          <p className="text-[11px] text-[var(--gp-text-muted)]">
                            Tip: la app debe tener URL entitlement + API Key
                            igual a GESTOR_SYNC_SECRET del backend para que el
                            sync llegue.
                          </p>
                          <p className="text-xs font-medium text-[var(--gp-text-muted)]">
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
                    Cancelar
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
                          <p className="truncate text-sm font-medium text-[var(--gp-text)]">
                            {sub.app_name || sub.app_hash}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--gp-text-muted)]">
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
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : sub.status === "EXPIRED"
                                ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                                : "bg-[var(--gp-surface-muted)] text-[var(--gp-text-muted)]"
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
