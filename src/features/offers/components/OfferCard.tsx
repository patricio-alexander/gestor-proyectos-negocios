"use client";

import { Button, Card } from "@heroui/react";
import Gift from "@gravity-ui/icons/Gift";
import Pencil from "@gravity-ui/icons/Pencil";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Cubes3Overlap from "@gravity-ui/icons/Cubes3Overlap";
import type { Offer } from "../types";
import { gp } from "@/src/shared/ui/theme";
import {
  StatusBadge,
  offerRangeTone,
} from "@/src/shared/components/StatusBadge";
import {
  formatDate,
  formatPrice,
  getDateRangeStatus,
  daysUntil,
} from "@/src/shared/utils/format-display";

const MAX_MODULES = 4;
const RANGE_LABEL = {
  active: "Vigente",
  upcoming: "Próxima",
  expired: "Finalizada",
} as const;

type OfferCardProps = {
  offer: Offer;
  onEdit: (offer: Offer) => void;
  onDelete: (offer: Offer) => void;
};

export function OfferCard({ offer, onEdit, onDelete }: OfferCardProps) {
  const rangeStatus = getDateRangeStatus(offer.start_at, offer.expires_at);
  const daysLeft = daysUntil(offer.expires_at);
  const visibleModules = offer.modules.slice(0, MAX_MODULES);
  const hiddenModules = offer.modules.length - visibleModules.length;

  return (
    <Card className="gp-card gp-card-interactive flex h-full flex-col overflow-hidden p-0">
      <div
        className="h-1 shrink-0"
        style={{
          background:
            rangeStatus === "active"
              ? "linear-gradient(90deg, var(--gp-primary), var(--gp-input-focus))"
              : "var(--gp-border)",
        }}
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className={gp.iconBoxSm}>
              <Gift width={18} height={18} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-[var(--gp-text)]">
                {offer.name}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {offer.app_name && (
                  <span className={gp.badge}>{offer.app_name}</span>
                )}
                <StatusBadge
                  label={RANGE_LABEL[rangeStatus]}
                  tone={offerRangeTone(rangeStatus)}
                />
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-0.5">
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Editar ${offer.name}`}
              onPress={() => onEdit(offer)}
            >
              <Pencil width={14} height={14} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500"
              aria-label={`Eliminar ${offer.name}`}
              onPress={() => onDelete(offer)}
            >
              <TrashBin width={14} height={14} />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <OfferStatBlock label="Precio" value={formatPrice(offer.price) ?? "Gratis"} />
          <OfferStatBlock
            label="Vence"
            value={formatDate(offer.expires_at)}
            hint={
              rangeStatus === "active" && daysLeft != null && daysLeft <= 14
                ? `${daysLeft} días restantes`
                : undefined
            }
            featured={
              rangeStatus === "active" &&
              daysLeft != null &&
              daysLeft <= 14 &&
              daysLeft >= 0
            }
          />
        </div>

        <p className="mt-3 text-xs text-[var(--gp-text-muted)]">
          {formatDate(offer.start_at)} — {formatDate(offer.expires_at)}
        </p>

        {offer.modules.length > 0 ? (
          <div className="mt-4 flex-1">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--gp-text-muted)]">
              <Cubes3Overlap width={12} height={12} />
              {offer.modules.length}{" "}
              {offer.modules.length === 1 ? "módulo" : "módulos"}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visibleModules.map((m) => (
                <span
                  key={m.module_id}
                  className="rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--gp-badge-bg)",
                    color: "var(--gp-badge-text)",
                  }}
                >
                  {m.module_name}
                </span>
              ))}
              {hiddenModules > 0 && (
                <span className={`${gp.badge} opacity-80`}>
                  +{hiddenModules} más
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-4 flex-1 text-xs text-[var(--gp-text-muted)]">
            Sin módulos asignados.
          </p>
        )}
      </div>
    </Card>
  );
}

function OfferStatBlock({
  label,
  value,
  hint,
  featured = false,
}: {
  label: string;
  value: string;
  hint?: string;
  featured?: boolean;
}) {
  return (
    <div
      className="rounded-xl border px-3 py-3"
      style={{
        borderColor: featured ? "var(--gp-input-focus)" : "var(--gp-card-border)",
        backgroundColor: featured
          ? "var(--gp-badge-bg)"
          : "var(--gp-surface-muted)",
      }}
    >
      <p className="text-xs font-medium text-[var(--gp-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--gp-text)]">{value}</p>
      {hint && (
        <p className="mt-0.5 text-[10px] font-medium text-[var(--gp-badge-text)]">
          {hint}
        </p>
      )}
    </div>
  );
}
