"use client";

import { Button, Card } from "@heroui/react";
import ShieldKeyhole from "@gravity-ui/icons/ShieldKeyhole";
import type { License } from "../types";
import { gp } from "@/src/shared/ui/theme";
import {
  StatusBadge,
  licenseStatusTone,
} from "@/src/shared/components/StatusBadge";
import { formatDate } from "@/src/shared/utils/format-display";

const PAY_LABEL = { CASH: "Efectivo", TRANSFER: "Transferencia" } as const;

type LicenseCardProps = {
  license: License;
  onRevoke?: (license: License) => void;
  revoking?: boolean;
};

export function LicenseCard({ license: lic, onRevoke, revoking }: LicenseCardProps) {
  const statusLabel =
    lic.status === "AVAILABLE"
      ? "Disponible"
      : lic.status === "USED"
        ? "Usada"
        : "Revocada";

  return (
    <Card className="gp-card gp-card-interactive flex h-full flex-col overflow-hidden p-0">
      <div
        className="h-1 shrink-0"
        style={{
          background:
            lic.status === "AVAILABLE"
              ? "linear-gradient(90deg, var(--gp-primary), var(--gp-input-focus))"
              : "var(--gp-border)",
        }}
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className={gp.iconBoxSm}>
              <ShieldKeyhole width={18} height={18} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-[var(--gp-text)]">
                {lic.plan_name ?? `Plan #${lic.plan_id}`}
              </h3>
              <p className="mt-0.5 text-sm text-[var(--gp-text-muted)]">
                {lic.period === "MONTHLY" ? "Mensual" : "Anual"}
              </p>
            </div>
          </div>
          <StatusBadge label={statusLabel} tone={licenseStatusTone(lic.status)} />
        </div>

        <div
          className="mt-4 rounded-xl border px-3 py-3"
          style={{
            borderColor: "var(--gp-card-border)",
            backgroundColor: "var(--gp-surface-muted)",
          }}
        >
          <p className="text-xs font-medium text-[var(--gp-text-muted)]">Clave</p>
          <code className="mt-1 block truncate font-mono text-xs text-[var(--gp-text)]">
            {lic.key ?? "—"}
          </code>
        </div>

        <div className="mt-4 flex-1 text-xs text-[var(--gp-text-muted)]">
          {lic.method_pay && (
            <p>Pago: {PAY_LABEL[lic.method_pay] ?? lic.method_pay}</p>
          )}
          {lic.used_at && <p>Usada {formatDate(lic.used_at)}</p>}
        </div>

        {lic.status === "AVAILABLE" && onRevoke && (
          <div
            className="mt-4 border-t pt-4"
            style={{ borderColor: "var(--gp-border)" }}
          >
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-red-500"
              isDisabled={revoking}
              onPress={() => onRevoke(lic)}
            >
              Revocar licencia
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
