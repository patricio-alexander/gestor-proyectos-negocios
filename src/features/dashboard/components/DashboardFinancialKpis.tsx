"use client";

import type { ComponentType } from "react";
import CreditCard from "@gravity-ui/icons/CreditCard";
import ChartLine from "@gravity-ui/icons/ChartLine";
import CircleDollar from "@gravity-ui/icons/CircleDollar";
import ShoppingBag from "@gravity-ui/icons/ShoppingBag";
import ChartLineArrowUp from "@gravity-ui/icons/ChartLineArrowUp";
import Wallet from "@gravity-ui/icons/Wallet";
import type { FinancialKpis } from "../lib/financial-kpis";
import { StatCard } from "@/src/shared/components/StatCard";
import { formatCurrency } from "@/src/shared/utils/format-display";

type DashboardFinancialKpisProps = {
  financial: FinancialKpis;
};

export function DashboardFinancialKpis({ financial }: DashboardFinancialKpisProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--gp-text)]">
          KPIs financieros
        </h2>
        <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
          MRR, ingresos cobrados y pipeline estimado según planes y licencias.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <FinancialStatCard
          icon={ChartLine}
          label="MRR"
          value={formatCurrency(financial.mrr)}
          hint="Ingreso recurrente mensual"
          featured={financial.mrr > 0}
        />
        <FinancialStatCard
          icon={ChartLineArrowUp}
          label="ARR"
          value={formatCurrency(financial.arr)}
          hint="Proyección anual (MRR × 12)"
        />
        <FinancialStatCard
          icon={CircleDollar}
          label="Ticket promedio"
          value={formatCurrency(financial.avgTicket)}
          hint="Suscripciones activas"
        />
        <FinancialStatCard
          icon={Wallet}
          label="Ingresos por suscripciones"
          value={formatCurrency(financial.collectedRevenue)}
          hint="Suscripciones activas"
          featured={financial.collectedRevenue > 0}
        />
        <FinancialStatCard
          icon={CreditCard}
          label="Facturación 6 meses"
          value={formatCurrency(
            financial.revenueTrend.reduce((sum, item) => sum + item.ingresos, 0),
          )}
          hint="Activaciones con precio"
        />
      </div>
    </section>
  );
}

function FinancialStatCard({
  icon,
  label,
  value,
  hint,
  featured = false,
}: {
  icon: ComponentType<{ width?: number; height?: number }>;
  label: string;
  value: string;
  hint: string;
  featured?: boolean;
}) {
  return (
    <StatCard
      icon={icon}
      label={label}
      value={value}
      hint={hint}
      featured={featured}
    />
  );
}
