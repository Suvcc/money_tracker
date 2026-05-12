"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/formatters";
import type { SpendingTrendDatum } from "@/lib/types/finance";

type SpendingOverviewChartProps = {
  currency: string;
  data: SpendingTrendDatum[];
};

export function SpendingOverviewChart({
  currency,
  data,
}: SpendingOverviewChartProps) {
  return (
    <div className="h-[260px] w-full sm:h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 8, left: -26, bottom: 0 }}
        >
          <defs>
            <linearGradient id="expenseFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="dayLabel"
            minTickGap={32}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickFormatter={(value: number) => `${Math.round(value)}`}
            width={34}
          />
          <Tooltip
            formatter={(value) =>
              formatCurrency(typeof value === "number" ? value : 0, currency)
            }
            contentStyle={{
              borderRadius: "1rem",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              boxShadow: "0 18px 60px rgba(15, 23, 42, 0.12)",
            }}
          />
          <Area
            dataKey="expenseAmount"
            fill="url(#expenseFill)"
            name="Expenses"
            stroke="#ef4444"
            strokeWidth={2.5}
            type="monotone"
          />
          <Area
            dataKey="incomeAmount"
            fill="url(#incomeFill)"
            name="Income"
            stroke="#10b981"
            strokeWidth={2.5}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
