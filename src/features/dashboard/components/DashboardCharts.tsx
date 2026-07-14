"use client";

import type { ReactNode } from "react";
import { Card } from "@heroui/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardOverview } from "../hooks/useDashboardOverview";
import {
  buildEcosystemData,
  buildOfferStatusData,
  buildSubscriptionStatusData,
  CHART_COLORS,
  hasChartData,
  type ChartSegment,
} from "../lib/chart-data";
import { formatCurrency } from "@/src/shared/utils/format-display";
import { gp } from "@/src/shared/ui/theme";

type DashboardChartsProps = {
  data: DashboardOverview;
};

const TOOLTIP_STYLE = {
  backgroundColor: "var(--gp-card-bg)",
  border: "1px solid var(--gp-card-border)",
  borderRadius: "0.5rem",
  color: "var(--gp-text)",
  fontSize: "12px",
};

const AXIS_TICK = { fill: "var(--gp-text-muted)", fontSize: 12 };
const GRID_STROKE = "var(--gp-border)";

export function DashboardCharts({ data }: DashboardChartsProps) {
  const subscriptionStatus = buildSubscriptionStatusData(data.subscriptions);
  const offerStatus = buildOfferStatusData(data.offers);
  const ecosystem = buildEcosystemData(data);
  const trend = data.subscriptionTrend;
  const financial = data.financial;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--gp-text)]">
          Gráficas financieras
        </h2>
        <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
          Ingresos por activaciones, mix de planes y métodos de pago.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Ingresos mensuales (activaciones)">
          <FinancialBarChart
            data={financial.revenueTrend}
            dataKey="ingresos"
            empty="Sin ingresos en los últimos 6 meses"
          />
        </ChartCard>

        <ChartCard title="Mix por período (activas)">
          <StatusDonut
            data={financial.revenueByPeriod}
            total={financial.revenueByPeriod.reduce((s, i) => s + i.value, 0)}
            empty="Sin suscripciones activas con precio"
            compact
            formatValue={formatCurrency}
          />
        </ChartCard>

      </div>

      <div>
        <h2 className="text-sm font-semibold text-[var(--gp-text)]">
          Gráficas operativas
        </h2>
      </div>

      <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Suscripciones por estado">
          <StatusDonut
            data={subscriptionStatus}
            total={data.subscriptions.total}
            empty="Sin suscripciones registradas"
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Ofertas por vigencia">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={offerStatus}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={GRID_STROKE}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Ofertas">
                {offerStatus.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ecosistema">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={ecosystem}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={GRID_STROKE}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} name="Total">
                {ecosystem.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Activaciones de suscripción (últimos 6 meses)">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={trend}
            margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="activacionesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={CHART_COLORS.primary}
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_COLORS.primary}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={GRID_STROKE}
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area
              type="monotone"
              dataKey="activaciones"
              name="Activaciones"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              fill="url(#activacionesGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className={`${gp.card} px-5 py-4`}>
      <h2 className="mb-4 text-sm font-semibold text-[var(--gp-text)]">{title}</h2>
      {children}
    </Card>
  );
}

function FinancialBarChart({
  data,
  dataKey,
  empty,
}: {
  data: { month: string; ingresos: number }[];
  dataKey: string;
  empty: string;
}) {
  if (!data.some((item) => item.ingresos > 0)) {
    return <p className={`${gp.subtitle} py-10 text-center text-sm`}>{empty}</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [
            formatCurrency(Number(value ?? 0)),
            "Ingresos",
          ]}
        />
        <Bar
          dataKey={dataKey}
          name="Ingresos"
          fill={CHART_COLORS.success}
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function StatusDonut({
  data,
  total,
  empty,
  compact = false,
  formatValue,
}: {
  data: ChartSegment[];
  total: number;
  empty: string;
  compact?: boolean;
  formatValue?: (value: number) => string;
}) {
  if (!hasChartData(data)) {
    return (
      <p className={`${gp.subtitle} py-10 text-center text-sm`}>{empty}</p>
    );
  }

  const height = compact ? 220 : 260;
  const centerLabel = formatValue ? formatValue(total) : String(total);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={compact ? 52 : 62}
          outerRadius={compact ? 78 : 92}
          paddingAngle={3}
          stroke="none"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) =>
            formatValue ? formatValue(Number(value ?? 0)) : Number(value ?? 0)
          }
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span style={{ color: "var(--gp-text-muted)", fontSize: 12 }}>
              {value}
            </span>
          )}
        />
        <text
          x="50%"
          y={compact ? "48%" : "46%"}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--gp-text)"
          fontSize={compact ? 14 : 22}
          fontWeight={600}
        >
          {centerLabel}
        </text>
        {!formatValue && !compact && (
          <text
            x="50%"
            y="54%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--gp-text-muted)"
            fontSize={11}
          >
            total
          </text>
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
