"use client";

import {
  Alert,
  Button,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  Switch,
  useOverlayState,
} from "@heroui/react";
import Briefcase from "@gravity-ui/icons/Briefcase";
import Pencil from "@gravity-ui/icons/Pencil";
import Plus from "@gravity-ui/icons/Plus";
import TrashBin from "@gravity-ui/icons/TrashBin";
import ArrowUpFromSquare from "@gravity-ui/icons/ArrowUpFromSquare";
import CreditCard from "@gravity-ui/icons/CreditCard";
import Copy from "@gravity-ui/icons/Copy";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import Sliders from "@gravity-ui/icons/Sliders";
import ArrowsRotateRight from "@gravity-ui/icons/ArrowsRotateRight";
import ArrowsRotateLeft from "@gravity-ui/icons/ArrowsRotateLeft";
import Eye from "@gravity-ui/icons/Eye";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import CircleExclamation from "@gravity-ui/icons/CircleExclamation";
import { AppModulesModal } from "@/src/features/apps/components/AppModulesModal";
import { AppFeaturesModal } from "@/src/features/apps/components/AppFeaturesModal";
import { useState, useMemo, type ReactNode } from "react";
import { useApps } from "@/src/features/apps/hooks/useApps";
import type { App } from "@/src/features/apps/types";
import { usePlans } from "@/src/features/plans/hooks/usePlans";
import {
  filterPlansForApp,
  getPlanModulesForApp,
} from "@/src/features/plans/lib/plan-for-app";
import { formatPlanPrice } from "@/src/features/plans/lib/format-plan-price";
import { entitlementSyncSummary } from "@/src/features/apps/lib/entitlementEnv";
import { isTemplateApp, isMobileApp } from "@/src/features/apps/lib/app-kind";
import { useAppsSyncHealth } from "@/src/features/apps/hooks/useAppsSyncHealth";
import {
  ManagerHeader,
  TableSearchBar,
} from "@/src/shared/components/TableSearchBar";
import { GestorHowItWorks } from "@/src/shared/components/GestorHowItWorks";
import { TablePagination } from "@/src/shared/components/TablePagination";
import { usePaginatedSearch } from "@/src/shared/hooks/usePaginatedSearch";
import { gp } from "@/src/shared/ui/theme";
import { appToast } from "@/src/shared/utils/app-toast";
import {
  formatPushSyncNote,
  formatPushSyncSuccess,
  formatPushSyncToast,
} from "@/src/shared/lib/push-sync-message";

const PAGE_SIZE = 10;

function generateApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return (
    "gc_" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

function matchesAppSearch(app: App, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [app.name, app.owner_name, app.ruc, app.email, app.kind, app.mobile?.key]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}

function appKindLabel(app: App) {
  if (isMobileApp(app)) return "Móvil";
  if (isTemplateApp(app)) return "Plantilla";
  return "Web";
}

function appPlatformLabel(app: App) {
  if (!isMobileApp(app)) return "—";
  const platforms = app.mobile?.platforms ?? [];
  if (platforms.length === 0) return "Android";
  return platforms
    .map((p) => (p === "ios" ? "iOS" : "Android"))
    .join(" · ");
}

function InfoField({
  label,
  value,
  mono = false,
  wide = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  wide?: boolean;
}) {
  const empty =
    value == null || value === "" || value === "—";
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--gp-text-faint)]">
        {label}
      </p>
      <p
        className={`mt-0.5 break-all text-sm ${
          empty ? "text-[var(--gp-text-muted)]" : "text-[var(--gp-text)]"
        } ${mono ? "font-mono text-xs" : "font-medium"}`}
      >
        {empty ? "—" : value}
      </p>
    </div>
  );
}

export default function AppsPage() {
  const { apps, loading, create, update, remove, pushEntitlement, enablePlan, updateModules, refetch } =
    useApps();
  const {
    healthFor,
    isFetching: syncChecking,
    refetch: refetchSyncHealth,
  } = useAppsSyncHealth(!loading);
  const { plans } = usePlans();
  const [submitting, setSubmitting] = useState(false);
  const [editingApp, setEditingApp] = useState<App | null>(null);
  const [viewingApp, setViewingApp] = useState<App | null>(null);
  const [deletingApp, setDeletingApp] = useState<App | null>(null);
  const [modulesApp, setModulesApp] = useState<App | null>(null);
  const [featuresApp, setFeaturesApp] = useState<App | null>(null);
  const [planApp, setPlanApp] = useState<App | null>(null);
  const [planId, setPlanId] = useState("");
  const [planPeriod, setPlanPeriod] = useState<"MONTHLY" | "ANNUALLY">("MONTHLY");
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [pushingIds, setPushingIds] = useState<Set<number>>(new Set());
  const [createApiKey, setCreateApiKey] = useState(generateApiKey);
  const [editApiKey, setEditApiKey] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const createState = useOverlayState();
  const editState = useOverlayState();
  const viewState = useOverlayState();
  const deleteState = useOverlayState();
  const planState = useOverlayState();

  const filterApps = (app: App, query: string) => matchesAppSearch(app, query);

  const sortedPlans = useMemo(
    () => [...plans].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id,
    ),
    [plans],
  );

  const plansForSelectedApp = useMemo(() => {
    if (!planApp) return [];
    return filterPlansForApp(sortedPlans, planApp.id);
  }, [sortedPlans, planApp]);

  const selectedPlan = useMemo(
    () => plansForSelectedApp.find((p) => String(p.id) === planId) ?? null,
    [plansForSelectedApp, planId],
  );

  const selectedPlanModules = useMemo(() => {
    if (!selectedPlan || !planApp) return [];
    return getPlanModulesForApp(selectedPlan, planApp.id);
  }, [selectedPlan, planApp]);

  function openModules(app: App) {
    setModulesApp(app);
  }

  function openFeatures(app: App) {
    setFeaturesApp(app);
  }

  async function handleSaveAppModules(appId: number, moduleIds: number[]) {
    const result = await updateModules(appId, moduleIds);
    await refetch();
    const pushNote = formatPushSyncNote(result);
    appToast.success(`Módulos actualizados${pushNote}`);
  }

  function openAssignPlan(app: App) {
    setPlanApp(app);
    const forApp = filterPlansForApp(sortedPlans, app.id);
    const defaultPlan =
      app.plan?.id != null && forApp.some((p) => p.id === app.plan!.id)
        ? String(app.plan.id)
        : forApp[0]
          ? String(forApp[0].id)
          : "";
    setPlanId(defaultPlan);
    setPlanPeriod("MONTHLY");
    planState.open();
  }

  async function handleAssignPlan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!planApp || !planId) {
      appToast.warning("Elegí un plan");
      return;
    }
    const appName = planApp.name || "la app";
    const selectedPlan = plans.find((p) => String(p.id) === planId);
    setSubmitting(true);
    try {
      const result = await enablePlan({
        app_id: planApp.id,
        plan_id: Number(planId),
        period: planPeriod,
        replace: true,
      });
      planState.close();
      setPlanApp(null);
      const pushNote = formatPushSyncNote(result);
      appToast.success(
        `Plan ${result.plan_name || selectedPlan?.name || ""} asignado a ${appName}${pushNote}`,
      );
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al asignar plan");
    } finally {
      setSubmitting(false);
    }
  }

  const {
    search,
    setSearch,
    page,
    setPage,
    paginated: paginatedApps,
    total: filteredTotal,
  } = usePaginatedSearch(apps, filterApps, PAGE_SIZE);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      await create({
        name: form.get("name") as string,
        owner_name: (form.get("owner_name") as string) || null,
        phone: (form.get("phone") as string) || null,
        ruc: (form.get("ruc") as string) || null,
        address: (form.get("address") as string) || null,
        email: (form.get("email") as string) || null,
        path: (form.get("path") as string) || null,
        database_name: (form.get("database_name") as string) || null,
        maintenance: form.get("maintenance") === "on",
        entitlement_url: (form.get("entitlement_url") as string) || null,
        entitlement_secret: createApiKey,
      });
      createState.close();
      appToast.success("Aplicación creada");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingApp) return;
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    try {
      const secret = editApiKey;
      const updated = await update(editingApp.id, {
        name: form.get("name") as string,
        owner_name: (form.get("owner_name") as string) || null,
        phone: (form.get("phone") as string) || null,
        ruc: (form.get("ruc") as string) || null,
        address: (form.get("address") as string) || null,
        email: (form.get("email") as string) || null,
        path: (form.get("path") as string) || null,
        database_name: (form.get("database_name") as string) || null,
        maintenance: form.get("maintenance") === "on",
        entitlement_url: (form.get("entitlement_url") as string) || null,
        ...(secret ? { entitlement_secret: secret } : {}),
      });
      editState.close();
      setEditingApp(null);
      setEditApiKey("");
      const pushNote =
        updated && "push_ok" in updated
          ? formatPushSyncNote(updated as Parameters<typeof formatPushSyncNote>[0])
          : "";
      appToast.success(`Aplicación actualizada${pushNote}`);
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleMantenimiento(app: App) {
    setTogglingIds((prev) => new Set(prev).add(app.id));
    try {
      const updated = await update(app.id, { maintenance: !app.maintenance });
      const pushMsg = formatPushSyncToast(
        updated as Parameters<typeof formatPushSyncToast>[0],
        "Mantenimiento guardado, pero sync incompleto",
      );
      if (pushMsg) appToast.warning(pushMsg);
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al cambiar estado");
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(app.id);
        return next;
      });
    }
  }

  async function handlePush(app: App) {
    setPushingIds((prev) => new Set(prev).add(app.id));
    try {
      const result = await pushEntitlement(app.id);
      await refetchSyncHealth();
      const okMsg =
        formatPushSyncSuccess(result as Parameters<typeof formatPushSyncSuccess>[0]) ??
        `Entitlement enviado a ${app.name || "la app"}`;
      appToast.success(okMsg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al empujar";
      if (/no autorizado|gestor sync|secreto incorrecto/i.test(msg)) {
        appToast.error(
          `Sync rechazado · ${app.name || "App"}: secreto incorrecto — copiá la API Key (Editar app) a GESTOR_SYNC_SECRET del backend y reiniciá.`,
        );
      } else if (/sin conexión|fetch failed|ECONNREFUSED/i.test(msg)) {
        appToast.error(
          `Sync falló · ${app.name || "App"}: backend apagado o entitlement_url incorrecta.`,
        );
      } else if (/404|ruta no encontrada/i.test(msg)) {
        appToast.error(
          `Sync falló · ${app.name || "App"}: ruta no encontrada — la URL debe terminar en /subscription/entitlement.`,
        );
      } else {
        appToast.error(`Sync falló · ${app.name || "App"}: ${msg}`);
      }
    } finally {
      setPushingIds((prev) => {
        const next = new Set(prev);
        next.delete(app.id);
        return next;
      });
    }
  }

  async function handleDelete() {
    if (!deletingApp) return;
    setSubmitting(true);
    try {
      await remove(deletingApp.id);
      deleteState.close();
      setDeletingApp(null);
      appToast.success("Aplicación eliminada");
    } catch (err) {
      appToast.error(err instanceof Error ? err.message : "Error al eliminar");
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
      <ManagerHeader
        title="Todas"
        description="Apps web y móvil: email, sync, dispositivos, planes y mantenimiento."
        Icon={Briefcase}
        action={
          <div className="flex items-center gap-2">
            <GestorHowItWorks defaultTopic="features" />
          <Modal state={createState}>
            <Button
              style={{
                backgroundColor: "var(--gp-primary)",
                color: "var(--gp-primary-text)",
              }}
              onPress={() => {
                setCreateApiKey(generateApiKey());
                setCopiedId(null);
                createState.open();
              }}
            >
              <Plus width={16} height={16} />
              Nueva aplicación
            </Button>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog className="flex max-h-[min(92vh,760px)] flex-col sm:max-w-xl">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Nueva aplicación</Modal.Heading>
                  </Modal.Header>
                  <form
                    onSubmit={handleCreate}
                    className="flex min-h-0 flex-1 flex-col"
                  >
                    <Modal.Body className="min-h-0 flex-1 overflow-y-auto">
                      <p className="mb-2 text-[11px] text-[var(--gp-text-muted)]">
                        Solo el <strong>nombre</strong> es obligatorio. El resto es opcional (URL y API Key
                        sirven para conectar el sync).
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <label className={`${gp.label} col-span-2`}>
                          Nombre
                          <input
                            name="name"
                            required
                            placeholder="Nombre de la aplicación"
                            className={gp.input}
                          />
                        </label>
                        <label className={gp.label}>
                          Propietario
                          <input
                            name="owner_name"
                            placeholder="Nombre del propietario"
                            className={gp.input}
                          />
                        </label>
                        <label className={gp.label}>
                          RUC
                          <input
                            name="ruc"
                            placeholder="RUC"
                            className={gp.input}
                          />
                        </label>
                        <label className={gp.label}>
                          Teléfono
                          <input
                            name="phone"
                            placeholder="Teléfono"
                            className={gp.input}
                          />
                        </label>
                        <label className={gp.label}>
                          Email
                          <input
                            name="email"
                            type="email"
                            placeholder="Email"
                            className={gp.input}
                          />
                        </label>
                        <label className={gp.label}>
                          Dirección
                          <input
                            name="address"
                            placeholder="Dirección"
                            className={gp.input}
                          />
                        </label>
                        <label className={gp.label}>
                          Path de imágenes y videos
                          <input
                            name="path"
                            placeholder="ej: /apps/mi-app/media"
                            className={gp.input}
                          />
                        </label>
                        <label className={gp.label}>
                          Nombre de base de datos
                          <input
                            name="database_name"
                            placeholder="ej: gestor_ed_deli"
                            className={gp.input}
                          />
                        </label>
                        <label className={`${gp.label} col-span-2`}>
                          URL entitlement (sync)
                          <input
                            name="entitlement_url"
                            placeholder="http://127.0.0.1:3001/eddeliapi/subscription/entitlement"
                            className={gp.input}
                          />
                          <span className="mt-1 block text-[11px] text-[var(--gp-text-muted)]">
                            Localhost → Desarrollo · dominio https → Producción · staging/test → Pruebas
                          </span>
                        </label>
                        <div className="col-span-2 space-y-1.5">
                          <label className={gp.label}>API Key</label>
                          <div className="flex gap-2">
                            <input
                              value={createApiKey}
                              readOnly
                              className={`${gp.input} flex-1 font-mono text-xs`}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label="Copiar API Key"
                              onPress={() => {
                                navigator.clipboard.writeText(createApiKey);
                                setCopiedId("create");
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                            >
                              {copiedId === "create" ? (
                                <span className="text-xs text-emerald-600">
                                  Copiado
                                </span>
                              ) : (
                                <Copy width={14} height={14} />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label="Regenerar API Key"
                              onPress={() => setCreateApiKey(generateApiKey())}
                            >
                              <ArrowsRotateRight width={14} height={14} />
                            </Button>
                          </div>
                        </div>
                        <label className={`${gp.label} col-span-2`}>
                          <Switch name="maintenance" size="sm">
                            <Switch.Content>
                              <Switch.Control>
                                <Switch.Thumb />
                              </Switch.Control>
                              Modo mantenimiento
                            </Switch.Content>
                          </Switch>
                        </label>
                      </div>
                    </Modal.Body>
                    <Modal.Footer className="shrink-0 border-t border-[var(--gp-border)] bg-[var(--gp-surface)]">
                      <Button variant="secondary" slot="close">
                        Cancelar
                      </Button>
                      <Button type="submit" isDisabled={submitting}>
                        {submitting ? <Spinner size="sm" /> : "Guardar"}
                      </Button>
                    </Modal.Footer>
                  </form>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
          </div>
        }
      />

      <TableSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nombre, propietario, RUC o email…"
        total={filteredTotal}
        totalLabel="aplicaciones"
      />

      <div className={gp.tableWrap}>
        <table className={gp.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>SO</th>
              <th>Propietario</th>
              <th>Plan</th>
              <th>Módulos</th>
              <th>Funciones</th>
              <th>
                <span className="inline-flex items-center gap-1.5">
                  Sync
                  <button
                    type="button"
                    className="inline-flex rounded p-0.5 text-[var(--gp-text-muted)] hover:bg-[var(--gp-nav-hover)] hover:text-[var(--gp-text)]"
                    title="Comprobar backends web y refrescar dispositivos móvil"
                    aria-label="Comprobar sync"
                    disabled={syncChecking}
                    onClick={() => {
                      void refetchSyncHealth();
                      void refetch();
                    }}
                  >
                    <ArrowsRotateLeft
                      width={12}
                      height={12}
                      className={syncChecking ? "animate-spin" : undefined}
                    />
                  </button>
                </span>
              </th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedApps.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center">
                  <p className={gp.subtitle}>
                    {search.trim()
                      ? "No hay aplicaciones que coincidan con la búsqueda."
                      : "Aún no hay aplicaciones registradas."}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedApps.map((app) => (
                <tr key={app.id}>
                  <td className="font-medium">{app.name || "—"}</td>
                  <td>
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                        isMobileApp(app)
                          ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                          : isTemplateApp(app)
                            ? "bg-[var(--gp-surface-muted)] text-[var(--gp-text-muted)]"
                            : "bg-sky-500/15 text-sky-800 dark:text-sky-200"
                      }`}
                    >
                      {appKindLabel(app)}
                    </span>
                  </td>
                  <td className="text-xs text-[var(--gp-text-muted)]">
                    {appPlatformLabel(app)}
                  </td>
                  <td>{app.owner_name || "—"}</td>
                  <td>
                    {app.plan ? (
                      <span className="font-medium text-[var(--gp-text)]">
                        {app.plan.name}
                      </span>
                    ) : (
                      <span className="text-[var(--gp-text-muted)]">
                        Sin plan
                      </span>
                    )}
                  </td>
                  <td>
                    {isTemplateApp(app) ? (
                      <span className="text-[var(--gp-text-muted)]">—</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openModules(app)}
                        className="inline-flex items-center gap-1 rounded-md bg-[var(--gp-badge-bg)] px-2 py-0.5 text-xs font-medium text-[var(--gp-badge-text)] hover:bg-[color-mix(in_srgb,var(--gp-primary)_22%,transparent)]"
                      >
                        <Cubes3Overlap width={11} height={11} />
                        {app.modules?.length ?? 0}
                      </button>
                    )}
                  </td>
                  <td>
                    {isTemplateApp(app) ? (
                      <span className="text-[var(--gp-text-muted)]">—</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openFeatures(app)}
                        className="inline-flex items-center gap-1 rounded-md bg-[var(--gp-badge-bg)] px-2 py-0.5 text-xs font-medium text-[var(--gp-badge-text)] hover:bg-[color-mix(in_srgb,var(--gp-primary)_22%,transparent)]"
                        title="Funciones de producto (multistock, etc.)"
                      >
                        <Sliders width={11} height={11} />
                        Funciones
                      </button>
                    )}
                  </td>
                  <td>
                    {isMobileApp(app) ? (
                      <div className="max-w-[12rem]">
                        {(app.mobile?.device_count ?? 0) === 0 ? (
                          <p className="text-xs font-medium text-[var(--gp-text-muted)]">
                            Sin dispositivos
                          </p>
                        ) : (
                          <>
                            <p
                              className={`text-xs font-medium ${
                                (app.mobile?.online_device_count ?? 0) > 0
                                  ? "text-emerald-700"
                                  : "text-amber-700"
                              }`}
                            >
                              {(app.mobile?.online_device_count ?? 0) > 0
                                ? `${app.mobile!.online_device_count} en línea`
                                : "Ninguno en línea"}
                            </p>
                            <p className="truncate text-[10px] text-[var(--gp-text-muted)]">
                              {app.mobile!.device_count} dispositivo
                              {app.mobile!.device_count === 1 ? "" : "s"}
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      (() => {
                        const health =
                          healthFor(app.id) ??
                          (syncChecking ? ("checking" as const) : null);
                        const sync = entitlementSyncSummary(app, health);
                        return (
                          <div title={sync.title} className="max-w-[14rem]">
                            <p
                              className={`text-xs font-medium ${sync.toneClass}`}
                            >
                              {sync.primary}
                            </p>
                            {sync.secondary ? (
                              <p className="truncate text-[10px] text-[var(--gp-text-muted)]">
                                {sync.module} · {sync.secondary}
                              </p>
                            ) : null}
                            {sync.tertiary ? (
                              <p className="line-clamp-2 text-[10px] leading-snug text-[var(--gp-text-faint)]">
                                {sync.tertiary}
                              </p>
                            ) : null}
                          </div>
                        );
                      })()
                    )}
                  </td>
                  <td>
                    <div className="gp-table-actions">
                      <span
                        className="gp-tip inline-flex"
                        data-tip={
                          isMobileApp(app)
                            ? app.maintenance
                              ? "Estado: en mantenimiento"
                              : "Estado: activa"
                            : app.maintenance
                              ? "Estado: en mantenimiento — clic para activar"
                              : "Estado: activa — clic para poner en mantenimiento"
                        }
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={
                            app.maintenance
                              ? "Estado: en mantenimiento"
                              : "Estado: activa"
                          }
                          isDisabled={
                            togglingIds.has(app.id) || isMobileApp(app)
                          }
                          className={
                            togglingIds.has(app.id) || isMobileApp(app)
                              ? "pointer-events-none"
                              : undefined
                          }
                          onPress={() => handleToggleMantenimiento(app)}
                        >
                          {togglingIds.has(app.id) ? (
                            <Spinner size="sm" />
                          ) : app.maintenance ? (
                            <CircleExclamation
                              width={14}
                              height={14}
                              className="text-red-500"
                            />
                          ) : (
                            <CircleCheck
                              width={14}
                              height={14}
                              className="text-emerald-600"
                            />
                          )}
                        </Button>
                      </span>
                      <span
                        className="gp-tip inline-flex"
                        data-tip="Ver información de la app"
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Ver información de la app"
                          onPress={() => {
                            setViewingApp(app);
                            viewState.open();
                          }}
                        >
                          <Eye width={14} height={14} />
                        </Button>
                      </span>
                      <span
                        className="gp-tip inline-flex"
                        data-tip="Módulos: asignar o ver módulos de la app"
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Módulos: asignar o ver módulos de la app"
                          isDisabled={isTemplateApp(app)}
                          className={isTemplateApp(app) ? "pointer-events-none" : undefined}
                          onPress={() => openModules(app)}
                        >
                          <Cubes3Overlap width={14} height={14} />
                        </Button>
                      </span>
                      <span
                        className="gp-tip inline-flex"
                        data-tip="Funciones: multistock y flags de producto"
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Funciones: multistock y flags de producto"
                          isDisabled={isTemplateApp(app)}
                          className={isTemplateApp(app) ? "pointer-events-none" : undefined}
                          onPress={() => openFeatures(app)}
                        >
                          <Sliders width={14} height={14} />
                        </Button>
                      </span>
                      <span
                        className="gp-tip inline-flex"
                        data-tip="Plan: asignar o cambiar el plan"
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Plan: asignar o cambiar el plan"
                          isDisabled={isTemplateApp(app)}
                          className={isTemplateApp(app) ? "pointer-events-none" : undefined}
                          onPress={() => openAssignPlan(app)}
                        >
                          <CreditCard width={14} height={14} />
                        </Button>
                      </span>
                      <span
                        className="gp-tip inline-flex"
                        data-tip={
                          isMobileApp(app)
                            ? "Sync: solo aplica a apps web"
                            : !app.entitlement_url
                              ? "Sync: falta configurar la URL entitlement"
                              : "Sync: empujar entitlement al backend"
                        }
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={
                            isMobileApp(app)
                              ? "Sync: solo aplica a apps web"
                              : !app.entitlement_url
                                ? "Sync: falta configurar la URL entitlement"
                                : "Sync: empujar entitlement al backend"
                          }
                          isDisabled={
                            isMobileApp(app) ||
                            !app.entitlement_url ||
                            pushingIds.has(app.id)
                          }
                          className={
                            isMobileApp(app) || !app.entitlement_url
                              ? "pointer-events-none"
                              : undefined
                          }
                          onPress={() => handlePush(app)}
                        >
                          {pushingIds.has(app.id) ? (
                            <Spinner size="sm" />
                          ) : (
                            <ArrowUpFromSquare width={14} height={14} />
                          )}
                        </Button>
                      </span>
                      <span className="gp-tip inline-flex" data-tip="Editar aplicación">
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Editar aplicación"
                          onPress={() => {
                            setEditingApp(app);
                            setEditApiKey("");
                            setCopiedId(null);
                            editState.open();
                          }}
                        >
                          <Pencil width={14} height={14} />
                        </Button>
                      </span>
                      <span className="gp-tip inline-flex" data-tip="Eliminar aplicación">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500"
                          aria-label="Eliminar aplicación"
                          onPress={() => {
                            setDeletingApp(app);
                            deleteState.open();
                          }}
                        >
                          <TrashBin width={14} height={14} />
                        </Button>
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <TablePagination
          page={page}
          pageSize={PAGE_SIZE}
          total={filteredTotal}
          onPageChange={setPage}
        />
      </div>

      <Modal state={viewState}>
        <Modal.Backdrop>
          <Modal.Container size="lg">
            <Modal.Dialog className="flex max-h-[min(92vh,720px)] flex-col sm:max-w-xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Información de la app</Modal.Heading>
              </Modal.Header>
              {viewingApp ? (
                <>
                  <Modal.Body className="min-h-0 flex-1 overflow-y-auto">
                    <div className="mb-5 flex flex-wrap items-start gap-3">
                      <div
                        className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
                        style={{
                          background:
                            "color-mix(in srgb, var(--gp-primary) 16%, transparent)",
                          color: "var(--gp-primary)",
                        }}
                      >
                        <Briefcase width={22} height={22} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold tracking-tight text-[var(--gp-text)]">
                          {viewingApp.name || "Sin nombre"}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span
                            className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
                              isMobileApp(viewingApp)
                                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                                : isTemplateApp(viewingApp)
                                  ? "bg-[var(--gp-surface-muted)] text-[var(--gp-text-muted)]"
                                  : "bg-sky-500/15 text-sky-800 dark:text-sky-200"
                            }`}
                          >
                            {appKindLabel(viewingApp)}
                          </span>
                          {isMobileApp(viewingApp) ? (
                            <span className="inline-flex rounded-md bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-800 dark:text-violet-200">
                              {appPlatformLabel(viewingApp)}
                            </span>
                          ) : null}
                          {viewingApp.maintenance ? (
                            <span className="inline-flex rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-100">
                              En mantenimiento
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-5 gap-y-4 rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface-muted)]/40 p-4">
                      <InfoField label="Propietario" value={viewingApp.owner_name} />
                      <InfoField label="Email" value={viewingApp.email} />
                      <InfoField label="Teléfono" value={viewingApp.phone} />
                      <InfoField label="RUC" value={viewingApp.ruc} />
                      <InfoField label="Dirección" value={viewingApp.address} wide />
                      <InfoField
                        label="Plan"
                        value={viewingApp.plan?.name ?? "Sin plan"}
                      />
                      <InfoField
                        label="Módulos"
                        value={
                          isTemplateApp(viewingApp)
                            ? "—"
                            : String(viewingApp.modules?.length ?? 0)
                        }
                      />
                      {isMobileApp(viewingApp) ? (
                        <>
                          <InfoField
                            label="Dispositivos"
                            value={
                              viewingApp.mobile
                                ? `${viewingApp.mobile.device_count} registrados · ${viewingApp.mobile.online_device_count} en línea`
                                : "Sin dispositivos"
                            }
                          />
                          <InfoField
                            label="Key móvil"
                            value={viewingApp.mobile?.key}
                            mono
                          />
                        </>
                      ) : (
                        <>
                          {(() => {
                            const sync = entitlementSyncSummary(
                              viewingApp,
                              healthFor(viewingApp.id) ??
                                (syncChecking ? "checking" : null),
                            );
                            return (
                              <>
                                <InfoField label="Sync" value={sync.primary} />
                                <InfoField
                                  label="Módulo / host"
                                  value={
                                    sync.secondary
                                      ? `${sync.module} · ${sync.secondary}`
                                      : sync.module
                                  }
                                  mono
                                />
                                <InfoField
                                  label="Ruta entitlement"
                                  value={sync.route || "—"}
                                  mono
                                />
                                <InfoField
                                  label="Detalle"
                                  value={sync.tertiary || "—"}
                                  wide
                                />
                              </>
                            );
                          })()}
                        </>
                      )}
                      <InfoField
                        label="URL entitlement"
                        value={viewingApp.entitlement_url}
                        mono
                        wide
                      />
                      <InfoField
                        label="Path media"
                        value={viewingApp.path}
                        mono
                      />
                      <InfoField
                        label="Base de datos"
                        value={viewingApp.database_name}
                        mono
                      />
                      <InfoField
                        label="Hash"
                        value={viewingApp.hash}
                        mono
                        wide
                      />
                    </div>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button
                      variant="secondary"
                      onPress={() => {
                        viewState.close();
                        setViewingApp(null);
                      }}
                    >
                      Cerrar
                    </Button>
                    <Button
                      onPress={() => {
                        viewState.close();
                        setEditingApp(viewingApp);
                        setEditApiKey("");
                        setCopiedId(null);
                        editState.open();
                      }}
                      style={{
                        backgroundColor: "var(--gp-primary)",
                        color: "var(--gp-primary-text)",
                      }}
                    >
                      Editar
                    </Button>
                  </Modal.Footer>
                </>
              ) : null}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={editState}>
        <Modal.Backdrop>
          <Modal.Container size="lg">
            <Modal.Dialog className="flex max-h-[min(92vh,760px)] flex-col sm:max-w-xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Editar aplicación</Modal.Heading>
              </Modal.Header>
              {editingApp && (
                <form onSubmit={handleEdit} className="flex min-h-0 flex-1 flex-col">
                  <Modal.Body className="min-h-0 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <label className={`${gp.label} col-span-2`}>
                        Nombre
                        <input
                          name="name"
                          required
                          defaultValue={editingApp.name ?? ""}
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Propietario
                        <input
                          name="owner_name"
                          defaultValue={editingApp.owner_name ?? ""}
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        RUC
                        <input
                          name="ruc"
                          defaultValue={editingApp.ruc ?? ""}
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Teléfono
                        <input
                          name="phone"
                          defaultValue={editingApp.phone ?? ""}
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Email
                        <input
                          name="email"
                          type="email"
                          defaultValue={editingApp.email ?? ""}
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Dirección
                        <input
                          name="address"
                          defaultValue={editingApp.address ?? ""}
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Path de imágenes y videos
                        <input
                          name="path"
                          defaultValue={editingApp.path ?? ""}
                          placeholder="ej: /apps/mi-app/media"
                          className={gp.input}
                        />
                      </label>
                      <label className={gp.label}>
                        Nombre de base de datos
                        <input
                          name="database_name"
                          defaultValue={editingApp.database_name ?? ""}
                          placeholder="ej: gestor_ed_deli"
                          className={gp.input}
                        />
                      </label>
                      <label className={`${gp.label} col-span-2`}>
                        URL entitlement (sync)
                        <input
                          name="entitlement_url"
                          defaultValue={editingApp.entitlement_url ?? ""}
                          placeholder="http://127.0.0.1:3001/eddeliapi/subscription/entitlement"
                          className={gp.input}
                        />
                      </label>
                      <div className="col-span-2 space-y-1.5">
                        <label className={gp.label}>API Key</label>
                        <div className="flex gap-2">
                          <input
                            value={
                              editApiKey || editingApp.entitlement_secret || ""
                            }
                            readOnly
                            className={`${gp.input} flex-1 font-mono text-xs`}
                          />

                          {(() => {
                            const sync = entitlementSyncSummary(
                              editingApp,
                              healthFor(editingApp.id) ??
                                (syncChecking ? "checking" : null),
                            );
                            return (
                              <span
                                className={`mt-1 block text-[11px] font-medium ${sync.toneClass}`}
                                title={sync.title}
                              >
                                {sync.module}: {sync.primary}
                                {sync.secondary ? ` · ${sync.secondary}` : ""}
                                {sync.tertiary ? (
                                  <span className="block font-normal text-[var(--gp-text-muted)]">
                                    {sync.tertiary}
                                  </span>
                                ) : null}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <label className={gp.label}>API Key</label>
                        <div className="flex gap-2">
                          <input
                            value={editApiKey || editingApp.entitlement_secret || ""}
                            readOnly
                            className={`${gp.input} flex-1 font-mono text-xs`}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label="Copiar API Key"
                            onPress={() => {
                              const val = editApiKey || editingApp.entitlement_secret || "";
                              navigator.clipboard.writeText(val);
                              setCopiedId("edit");
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                          >
                            {copiedId === "edit" ? (
                              <span className="text-xs text-emerald-600">Copiado</span>
                            ) : (
                              <Copy width={14} height={14} />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label="Regenerar API Key"
                            onPress={() => setEditApiKey(generateApiKey())}
                          >
                            <ArrowsRotateRight width={14} height={14} />
                          </Button>
                        </div>
                        {editApiKey && (
                          <p className="text-[11px] text-amber-600">
                            Se va a regenerar la API Key al guardar.
                          </p>
                        )}
                      </div>
                      <label className={`${gp.label} col-span-2`}>
                        <Switch
                          name="maintenance"
                          size="sm"
                          defaultSelected={editingApp.maintenance}
                        >
                          <Switch.Content>
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                            Modo mantenimiento
                          </Switch.Content>
                        </Switch>
                      </label>
                    </div>
                  </Modal.Body>
                  <Modal.Footer className="shrink-0 border-t border-[var(--gp-border)] bg-[var(--gp-surface)]">
                    <Button variant="secondary" slot="close" onPress={() => setEditingApp(null)}>
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

      <Modal state={deleteState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Eliminar aplicación</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className={gp.subtitle}>
                  ¿Eliminar <strong>{deletingApp?.name}</strong>?
                  <br />
                  Los módulos, planes y datos asociados se conservarán.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" slot="close">
                  Cancelar
                </Button>
                <Button
                  className="bg-red-600 text-white"
                  onPress={handleDelete}
                  isDisabled={submitting}
                >
                  {submitting ? <Spinner size="sm" /> : "Eliminar"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal state={planState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  Asignar plan
                  {planApp?.name ? ` · ${planApp.name}` : ""}
                </Modal.Heading>
              </Modal.Header>
              <form onSubmit={handleAssignPlan} className="flex flex-col">
                <Modal.Body className="space-y-3">
                  {planApp?.plan ? (
                    <p className="text-xs text-[var(--gp-text-muted)]">
                      Plan actual: <strong>{planApp.plan.name}</strong>
                      {" · "}al guardar se reemplaza automáticamente.
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--gp-text-muted)]">
                      Esta app aún no tiene suscripción activa.
                    </p>
                  )}
                  {plansForSelectedApp.length === 0 ? (
                    <Alert status="warning">
                      <Alert.Description>
                        No hay planes con módulos configurados para{" "}
                        <strong>{planApp?.name || "esta app"}</strong>. En{" "}
                        <strong>Planes</strong>, editá un plan, seleccioná esta
                        app y marcá sus módulos.
                      </Alert.Description>
                    </Alert>
                  ) : (
                    <>
                      <Select
                        aria-label="Plan"
                        selectedKey={planId || null}
                        onSelectionChange={(key) =>
                          setPlanId(key ? String(key) : "")
                        }
                        isRequired
                      >
                        <Label>Plan</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {plansForSelectedApp.map((p) => {
                              const modCount = getPlanModulesForApp(
                                p,
                                planApp!.id,
                              ).length;
                              const monthly = p.prices?.find(
                                (price) => price.period === "MONTHLY",
                              )?.price;
                              const label = [
                                p.name || `Plan #${p.id}`,
                                modCount > 0 ? `${modCount} módulos` : null,
                                monthly != null
                                  ? `${formatPlanPrice(monthly)}/mes`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ");
                              return (
                                <ListBox.Item
                                  key={p.id}
                                  id={String(p.id)}
                                  textValue={label}
                                >
                                  {label}
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                              );
                            })}
                          </ListBox>
                        </Select.Popover>
                      </Select>

                      {selectedPlan && selectedPlanModules.length > 0 && (
                        <div
                          className="rounded-xl border p-3"
                          style={{ borderColor: "var(--gp-border)" }}
                        >
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--gp-text-muted)]">
                            Módulos incluidos en{" "}
                            {planApp?.name || "esta app"}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedPlanModules.map((mod) => (
                              <span
                                key={mod.id}
                                className="rounded-md bg-[var(--gp-badge-bg)] px-2 py-0.5 text-xs font-medium text-[var(--gp-badge-text)]"
                              >
                                {mod.module_name}
                                {mod.is_trial ? " (trial)" : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <Select
                        aria-label="Período"
                        selectedKey={planPeriod}
                        onSelectionChange={(key) =>
                          setPlanPeriod(
                            key === "ANNUALLY" ? "ANNUALLY" : "MONTHLY",
                          )
                        }
                      >
                        <Label>Período</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            <ListBox.Item id="MONTHLY" textValue="Mensual">
                              Mensual
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                            <ListBox.Item id="ANNUALLY" textValue="Anual">
                              Anual
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    variant="secondary"
                    slot="close"
                    onPress={() => {
                      setPlanApp(null);
                      planState.close();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    isDisabled={
                      submitting || plansForSelectedApp.length === 0 || !planId
                    }
                  >
                    {submitting ? <Spinner size="sm" /> : "Asignar plan"}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <AppModulesModal
        app={modulesApp}
        onClose={() => setModulesApp(null)}
        onSave={handleSaveAppModules}
      />

      <AppFeaturesModal
        app={featuresApp}
        onClose={() => setFeaturesApp(null)}
        onSaved={async () => {
          await refetch();
        }}
      />
    </div>
  );
}
