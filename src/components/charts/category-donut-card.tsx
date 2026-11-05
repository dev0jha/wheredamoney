"use client";

import {
  DonutChart,
  DonutChartCenter,
  DonutChartLegend,
  DonutChartPlot,
  type DonutSegment,
} from "@/components/charts/donut-chart";
import { FramedCard } from "@/components/ui/framed-card";
import { cn, formatMoney } from "@/lib/utils";

export interface CategoryDonutCardProps {
  segments: DonutSegment[];
  currency: string;
  totalExpensesMinor: number;
  monthLabelText: string;
  isPreview?: boolean;
  className?: string;
}

export function CategoryDonutCard({
  segments,
  currency,
  totalExpensesMinor,
  monthLabelText,
  isPreview = false,
  className,
}: CategoryDonutCardProps) {
  return (
    <FramedCard className={cn("w-full max-w-[636px]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            Expenses by Category
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Breakdown for {monthLabelText}
          </p>
        </div>
        {isPreview ? (
          <span className="rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Sample Preview
          </span>
        ) : (
          <span className="text-xs font-semibold tabular-nums text-foreground">
            {formatMoney(totalExpensesMinor, currency)}
          </span>
        )}
      </div>

      {/* Donut Chart */}
      <div className="pt-5">
        <DonutChart
          segments={segments}
          formatValue={(val) => formatMoney(Math.round(val * 100), currency)}
        >
          <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,14rem)_1fr]">
            <DonutChartPlot>
              <DonutChartCenter totalLabel="Total Expenses" />
            </DonutChartPlot>
            <DonutChartLegend />
          </div>
        </DonutChart>
      </div>
    </FramedCard>
  );
}
