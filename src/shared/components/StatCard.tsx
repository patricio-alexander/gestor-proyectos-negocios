"use client";

import type { ComponentType, ReactNode } from "react";
import { Card } from "@heroui/react";
import { gp } from "@/src/shared/ui/theme";

type StatCardProps = {
  icon: ComponentType<{ width?: number; height?: number }>;
  label: string;
  value: number | string;
  hint?: string;
  featured?: boolean;
  action?: ReactNode;
};

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  featured = false,
  action,
}: StatCardProps) {
  return (
    <Card
      className="gp-card gp-card-interactive overflow-hidden p-0"
      style={
        featured
          ? {
              borderColor: "var(--gp-input-focus)",
              backgroundColor: "var(--gp-badge-bg)",
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className={gp.iconBoxSm}>
            <Icon width={16} height={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--gp-text-muted)]">
              {label}
            </p>
            <p className="mt-0.5 text-2xl font-semibold text-[var(--gp-text)]">
              {typeof value === "number" ? value.toLocaleString("es-PE") : value}
            </p>
            {hint && (
              <p className="mt-1 truncate text-xs text-[var(--gp-text-muted)]">
                {hint}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
    </Card>
  );
}
