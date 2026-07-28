"use client";

import type { ComponentType } from "react";
import { Button, Card, Modal, useOverlayState } from "@heroui/react";
import FileText from "@gravity-ui/icons/FileText";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import ShieldKeyhole from "@gravity-ui/icons/ShieldKeyhole";
import ListCheck from "@gravity-ui/icons/ListCheck";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import Gift from "@gravity-ui/icons/Gift";
import Briefcase from "@gravity-ui/icons/Briefcase";
import Persons from "@gravity-ui/icons/Persons";
import type { Plan } from "../types";
import { gp } from "@/src/shared/ui/theme";
import {
  formatPlanPrice,
  getAnnualSavingsPercent,
} from "../lib/format-plan-price";
import { groupPlanModulesByApp } from "../lib/group-plan-modules-by-app";
import { getPlanAppIds } from "../lib/plan-for-app";

const MAX_VISIBLE_APP_CHIPS = 3;

type PlanCardProps = {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
  onEnableSubscription: (plan: Plan) => void;
  onViewSubscriptions: (plan: Plan) => void;
};

export function PlanCard({
  plan,
  onEdit,
  onDelete,
  onEnableSubscription,
  onViewSubscriptions,
}: PlanCardProps) {
  const monthly = plan.prices?.find((p) => p.period === "MONTHLY");
  const annual = plan.prices?.find((p) => p.period === "ANNUALLY");
  const savings = getAnnualSavingsPercent(monthly?.price, annual?.price);
  const modules = plan.plan_modules ?? [];
  const offers = plan.plan_offers ?? [];
  const modulesByApp = groupPlanModulesByApp(modules);
  const planAppIds = getPlanAppIds(plan);
  const canCreateSubscription = planAppIds.length > 0;
  const visibleApps = modulesByApp.slice(0, MAX_VISIBLE_APP_CHIPS);
  const hiddenApps = modulesByApp.length - visibleApps.length;
  const visibleOffers = offers.slice(0, 4);
  const hiddenOffers = offers.length - visibleOffers.length;
  const appsModal = useOverlayState();
  const modulesModal = useOverlayState();
  const appsUsing = plan.apps_using ?? [];

  return (
    <Card className="gp-card gp-card-interactive flex h-full flex-col overflow-hidden p-0">
      <div
        className="h-1 shrink-0"
        style={{
          background:
            "linear-gradient(90deg, var(--gp-primary), var(--gp-input-focus))",
        }}
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className={gp.iconBoxSm}>
              <FileText width={18} height={18} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-[var(--gp-text)]">
                {plan.name || "Sin nombre"}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 min-h-0 gap-1 px-2 text-xs"
                  onPress={appsModal.open}
                  aria-label={`Ver apps de ${plan.name ?? "plan"}`}
                >
                  <Persons width={12} height={12} />
                  {plan.apps_count} {plan.apps_count === 1 ? "app" : "apps"}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-0.5">
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Apps vinculadas a ${plan.name ?? "plan"}`}
              onPress={appsModal.open}
            >
              <Briefcase width={14} height={14} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Editar ${plan.name ?? "plan"}`}
              onPress={() => onEdit(plan)}
            >
              <Pencil width={14} height={14} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500"
              aria-label={`Eliminar ${plan.name ?? "plan"}`}
              onPress={() => onDelete(plan)}
            >
              <TrashBin width={14} height={14} />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <PlanPriceBlock
            label="Mensual"
            price={formatPlanPrice(monthly?.price)}
            suffix="/mes"
            featured
          />
          <PlanPriceBlock
            label="Anual"
            price={formatPlanPrice(annual?.price)}
            suffix="/año"
            badge={savings != null ? `-${savings}%` : undefined}
          />
        </div>

        {(modules.length > 0 || offers.length > 0) && (
          <div className="mt-5 flex-1 space-y-4">
            <p className="text-xs text-[var(--gp-text-muted)]">
              {modules.length > 0 && (
                <>
                  {modules.length} {modules.length === 1 ? "módulo" : "módulos"}
                </>
              )}
              {modules.length > 0 && offers.length > 0 && " · "}
              {offers.length > 0 && (
                <>
                  {offers.length} {offers.length === 1 ? "oferta" : "ofertas"}
                </>
              )}
            </p>

            {modules.length > 0 && (
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--gp-text-muted)]">
                    <Cubes3Overlap width={12} height={12} />
                    Módulos por app
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 min-h-0 px-2 text-xs"
                    onPress={modulesModal.open}
                    aria-label={`Ver módulos de ${plan.name ?? "plan"}`}
                  >
                    Ver todos
                  </Button>
                </div>
                <button
                  type="button"
                  className="flex w-full flex-wrap gap-1 rounded-lg text-left transition-opacity hover:opacity-80"
                  onClick={modulesModal.open}
                  aria-label={`Ver módulos por app de ${plan.name ?? "plan"}`}
                >
                  {visibleApps.map((group) => (
                    <span
                      key={group.app_id}
                      className="rounded-md bg-[var(--gp-badge-bg)] px-2 py-0.5 text-xs font-medium text-[var(--gp-badge-text)]"
                    >
                      {group.app_name} · {group.modules.length}
                    </span>
                  ))}
                  {hiddenApps > 0 && (
                    <span className="text-xs text-[var(--gp-text-muted)]">
                      +{hiddenApps} {hiddenApps === 1 ? "app" : "apps"}
                    </span>
                  )}
                </button>
              </div>
            )}

            {offers.length > 0 && (
              <PlanChipGroup
                icon={Gift}
                label="Ofertas"
                items={visibleOffers.map((o) => o.offer_name)}
                hiddenCount={hiddenOffers}
                variant="offer"
              />
            )}
          </div>
        )}

        {modules.length === 0 && offers.length === 0 && (
          <p className="mt-5 flex-1 text-xs text-[var(--gp-text-muted)]">
            Sin módulos ni ofertas asignados.
          </p>
        )}

        <div
          className="mt-5 flex flex-wrap gap-2 border-t pt-4"
          style={{ borderColor: "var(--gp-border)" }}
        >
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 sm:flex-none"
            isDisabled={!canCreateSubscription}
            aria-label={
              canCreateSubscription
                ? "Crear una suscripción activa en una app del plan"
                : "Asigná módulos a una app en el plan antes de crear suscripciones"
            }
            onPress={() => onEnableSubscription(plan)}
          >
            <ShieldKeyhole width={14} height={14} />
            Crear suscripción
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 sm:flex-none"
            aria-label="Ver suscripciones de este plan"
            onPress={() => onViewSubscriptions(plan)}
          >
            <ListCheck width={14} height={14} />
            Ver suscripciones
          </Button>
        </div>
      </div>

      <Modal state={modulesModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-lg">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  Módulos por app · {plan.name || "Plan"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="mb-4 text-sm text-[var(--gp-text-muted)]">
                  Configuración de módulos incluidos en este plan, agrupados por
                  app.
                </p>
                {modulesByApp.length === 0 ? (
                  <p className="text-sm text-[var(--gp-text-muted)]">
                    Sin módulos asignados.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {modulesByApp.map((group) => (
                      <section
                        key={group.app_id}
                        className="rounded-xl border p-3"
                        style={{ borderColor: "var(--gp-border)" }}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <div className={gp.iconBoxSm}>
                            <Briefcase width={14} height={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--gp-text)]">
                              {group.app_name}
                            </p>
                            <p className="text-xs text-[var(--gp-text-muted)]">
                              {group.modules.length}{" "}
                              {group.modules.length === 1
                                ? "módulo"
                                : "módulos"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {group.modules.map((mod) => (
                            <span
                              key={mod.id}
                              className="rounded-md bg-[var(--gp-badge-bg)] px-2 py-0.5 text-xs font-medium text-[var(--gp-badge-text)]"
                            >
                              {mod.module_name}
                              {mod.is_trial ? " (trial)" : ""}
                            </span>
                          ))}
                        </div>
                      </section>
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

      <Modal state={appsModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  Apps vinculadas · {plan.name || "Plan"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="mb-3 text-sm text-[var(--gp-text-muted)]">
                  Apps con suscripción activa en este plan SoftEd.
                </p>
                {appsUsing.length === 0 ? (
                  <p className="text-sm text-[var(--gp-text-muted)]">
                    Todavía ninguna app usa este plan.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {appsUsing.map((app) => (
                      <li
                        key={app.hash}
                        className="flex items-center gap-3 rounded-xl border px-3 py-3"
                        style={{ borderColor: "var(--gp-border)" }}
                      >
                        <div className={gp.iconBoxSm}>
                          <Briefcase width={16} height={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--gp-text)]">
                            {app.name || "Sin nombre"}
                          </p>
                          <p className="truncate font-mono text-[10px] text-[var(--gp-text-muted)]">
                            {app.hash}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
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
    </Card>
  );
}

function PlanPriceBlock({
  label,
  price,
  suffix,
  featured = false,
  badge,
}: {
  label: string;
  price: string | null;
  suffix: string;
  featured?: boolean;
  badge?: string;
}) {
  return (
    <div
      className="rounded-xl border px-3 py-3"
      style={{
        borderColor: featured
          ? "var(--gp-input-focus)"
          : "var(--gp-card-border)",
        backgroundColor: featured
          ? "var(--gp-badge-bg)"
          : "var(--gp-surface-muted)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[var(--gp-text-muted)]">
          {label}
        </p>
        {badge && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: "var(--gp-primary)",
              color: "var(--gp-primary-text)",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-lg font-semibold text-[var(--gp-text)]">
        {price ?? "—"}
        {price && (
          <span className="ml-0.5 text-xs font-normal text-[var(--gp-text-muted)]">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

function PlanChipGroup({
  icon: Icon,
  label,
  items,
  hiddenCount,
  variant = "module",
}: {
  icon: ComponentType<{ width?: number; height?: number }>;
  label: string;
  items: string[];
  hiddenCount: number;
  variant?: "module" | "offer";
}) {
  const chipClass =
    variant === "offer"
      ? "rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200"
      : "rounded-md bg-[var(--gp-badge-bg)] px-2 py-0.5 text-xs font-medium text-[var(--gp-badge-text)]";

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--gp-text-muted)]">
        <Icon width={12} height={12} />
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span key={item} className={chipClass}>
            {item}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="text-xs text-[var(--gp-text-muted)]">
            +{hiddenCount}
          </span>
        )}
      </div>
    </div>
  );
}
