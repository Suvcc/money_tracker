"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCurrency } from "@/lib/formatters";
import type { CategoryBreakdownDatum } from "@/lib/types/finance";

type CategoryBreakdownChartProps = {
  currency: string;
  data: CategoryBreakdownDatum[];
};

export function CategoryBreakdownChart({
  currency,
  data,
}: CategoryBreakdownChartProps) {
  return (
    <div className="space-y-5">
      <div className="h-[240px] sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              innerRadius={54}
              outerRadius={86}
              paddingAngle={3}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
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
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-3">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.shareOfTotal}% of expenses</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-800 sm:text-right">
              {formatCurrency(item.amount, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
