"use client";

import { Button, Card } from "@heroui/react";
import CreditCard from "@gravity-ui/icons/CreditCard";
import Pencil from "@gravity-ui/icons/Pencil";
import Ban from "@gravity-ui/icons/Ban";
import type { Subscription } from "../types";
import { gp } from "@/src/shared/ui/theme";
import {
  StatusBadge,
  subscriptionStatusTone,
} from "@/src/shared/components/StatusBadge";
import { formatDate, formatPrice, daysUntil } from "@/src/shared/utils/format-display";

type SubscriptionCardProps = {
  subscription: Subscription;
  onEdit: (sub: Subscription) => void;
  onCancel: (sub: Subscription) => void;
};

export function SubscriptionCard({
  subscription: sub,
  onEdit,
  onCancel,
}: SubscriptionCardProps) {
  const daysLeft = daysUntil(sub.expires_at);
  const expiringSoon =
    sub.status === "ACTIVE" && daysLeft != null && daysLeft <= 30 && daysLeft >= 0;

  return (
    <Card className="gp-card gp-card-interactive flex h-full flex-col overflow-hidden p-0">
      <div
        className="h-1 shrink-0"
        style={{
          background:
            sub.status === "ACTIVE"
              ? "linear-gradient(90deg, var(--gp-primary), var(--gp-input-focus))"
              : "var(--gp-border)",
        }}
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className={gp.iconBoxSm}>
              <CreditCard width={18} height={18} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-[var(--gp-text)]">
                {sub.app_name || "Aplicación"}
              </h3>
              <p className="mt-0.5 truncate text-sm text-[var(--gp-text-muted)]">
                {sub.plan_name || "Plan"}
              </p>
            </div>
          </div>
          <StatusBadge
            label={
              sub.status === "ACTIVE"
                ? "Activa"
                : sub.status === "EXPIRED"
                  ? "Vencida"
                  : "Cancelada"
            }
            tone={subscriptionStatusTone(sub.status)}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div
            className="rounded-xl border px-3 py-3"
            style={{
              borderColor: "var(--gp-card-border)",
              backgroundColor: "var(--gp-surface-muted)",
            }}
          >
            <p className="text-xs text-[var(--gp-text-muted)]">Período</p>
            <p className="mt-1 text-sm font-semibold text-[var(--gp-text)]">
              {sub.period === "MONTHLY" ? "Mensual" : "Anual"}
            </p>
          </div>
          <div
            className="rounded-xl border px-3 py-3"
            style={{
              borderColor: expiringSoon
                ? "var(--gp-input-focus)"
                : "var(--gp-card-border)",
              backgroundColor: expiringSoon
                ? "var(--gp-badge-bg)"
                : "var(--gp-surface-muted)",
            }}
          >
            <p className="text-xs text-[var(--gp-text-muted)]">Precio</p>
            <p className="mt-1 text-sm font-semibold text-[var(--gp-text)]">
              {formatPrice(sub.price) ?? "—"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex-1 space-y-1 text-xs text-[var(--gp-text-muted)]">
          <p>Inicio: {formatDate(sub.start_at)}</p>
          <p>
            Vence: {formatDate(sub.expires_at)}
            {expiringSoon && daysLeft != null && (
              <span className="ml-1 font-medium text-[var(--gp-badge-text)]">
                · {daysLeft} días
              </span>
            )}
          </p>
        </div>

        <div
          className="mt-4 flex flex-wrap gap-2 border-t pt-4"
          style={{ borderColor: "var(--gp-border)" }}
        >
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onPress={() => onEdit(sub)}
          >
            <Pencil width={14} height={14} />
            Editar fechas
          </Button>
          {sub.status === "ACTIVE" && (
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 text-red-500"
              onPress={() => onCancel(sub)}
            >
              <Ban width={14} height={14} />
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
