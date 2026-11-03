"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatMoney } from "@/lib/utils";
import type { CategoryTotal } from "@/lib/types";

export function CategoryDonut({ data, currency }: { data: CategoryTotal[]; currency: string }) {
  const chartData = data.filter((item) => item.total_minor > 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="total_minor"
            nameKey="name"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={2}
            strokeWidth={0}
          >
            {chartData.map((item) => (
              <Cell key={item.name} fill={item.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--foreground)",
            }}
            formatter={(value, name) => [formatMoney(Number(value), currency), String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
