"use client";

import { useMemo } from "react";
import {
  HeatCalendar,
  HeatCalendarGrid,
  HeatCalendarLegend,
  HeatCalendarTooltip,
} from "@/components/charts/heat-calendar";
import {
  addDays,
  fmtDay,
  fmtRange,
  mondayOf,
  startOfDay,
} from "@/components/charts/heat-calendar/utils";
import { NumberTicker } from "@/components/motion/number-ticker";
import { cn, formatMoney } from "@/lib/utils";

export interface ExpenseHeatCalendarItem {
  date: string;
  amount_minor: number;
}

export interface ExpenseHeatCalendarProps {
  expenses: ExpenseHeatCalendarItem[];
  incomes?: ExpenseHeatCalendarItem[];
  currency: string;
  weeks?: number;
  className?: string;
}

const OPACITIES = [0, 28, 48, 72, 95] as const;

export function ExpenseHeatCalendar({
  expenses,
  incomes = [],
  currency,
  weeks = 32,
  className,
}: ExpenseHeatCalendarProps) {
  // Use today as end date normalized to UTC start of day
  const endDate = useMemo(() => startOfDay(new Date()), []);
  const startDate = useMemo(() => addDays(mondayOf(endDate), -(weeks - 1) * 7), [endDate, weeks]);

  // Aggregate daily totals in minor currency units (e.g. paisa/cents)
  const {
    dailyExpenseTotals,
    dailyIncomeTotals,
    maxDailyExpenseMinor,
    maxDailyIncomeMinor,
  } = useMemo(() => {
    const expenseMap = new Map<string, number>();
    for (const exp of expenses) {
      const dateKey = exp.date.slice(0, 10);
      expenseMap.set(dateKey, (expenseMap.get(dateKey) ?? 0) + exp.amount_minor);
    }

    const incomeMap = new Map<string, number>();
    for (const inc of incomes) {
      const dateKey = inc.date.slice(0, 10);
      incomeMap.set(dateKey, (incomeMap.get(dateKey) ?? 0) + inc.amount_minor);
    }

    let maxExpense = 0;
    let maxIncome = 0;

    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const cd = addDays(startDate, w * 7 + d);
        if (cd > endDate) continue;
        const key = cd.toISOString().slice(0, 10);

        const expAmount = expenseMap.get(key) ?? 0;
        if (expAmount > maxExpense) maxExpense = expAmount;

        const incAmount = incomeMap.get(key) ?? 0;
        if (incAmount > maxIncome) maxIncome = incAmount;
      }
    }

    return {
      dailyExpenseTotals: expenseMap,
      dailyIncomeTotals: incomeMap,
      maxDailyExpenseMinor: maxExpense,
      maxDailyIncomeMinor: maxIncome,
    };
  }, [expenses, incomes, startDate, endDate, weeks]);

  // Calculate 2D intensity values for HeatCalendar base model (tracks expense intensity)
  const values = useMemo(() => {
    const grid: number[][] = [];
    for (let w = 0; w < weeks; w++) {
      const col: number[] = [];
      for (let d = 0; d < 7; d++) {
        const cd = addDays(startDate, w * 7 + d);
        if (cd > endDate) {
          col.push(0);
          continue;
        }
        const key = cd.toISOString().slice(0, 10);
        const expAmount = dailyExpenseTotals.get(key) ?? 0;
        const incAmount = dailyIncomeTotals.get(key) ?? 0;

        if (expAmount <= 0 && incAmount <= 0) {
          col.push(0);
        } else if (expAmount > 0 && maxDailyExpenseMinor > 0) {
          const ratio = expAmount / maxDailyExpenseMinor;
          col.push(Math.min(1, Math.max(0.2, 0.2 + ratio * 0.8)));
        } else {
          // If only income present on this day, give it an active step so it's not dim
          const ratio = maxDailyIncomeMinor > 0 ? incAmount / maxDailyIncomeMinor : 1;
          col.push(Math.min(1, Math.max(0.2, 0.2 + ratio * 0.8)));
        }
      }
      grid.push(col);
    }
    return grid;
  }, [dailyExpenseTotals, dailyIncomeTotals, maxDailyExpenseMinor, maxDailyIncomeMinor, startDate, endDate, weeks]);

  // Custom cell background renderer:
  // - Expense only: solid blue
  // - Income only: solid green
  // - Both Income & Expense: half blue / half green diagonal split
  const getCellBackground = useMemo(() => {
    return (w: number, d: number, defaultFill: string) => {
      const cd = addDays(startDate, w * 7 + d);
      if (cd > endDate) return defaultFill;
      const key = cd.toISOString().slice(0, 10);

      const expense = dailyExpenseTotals.get(key) ?? 0;
      const income = dailyIncomeTotals.get(key) ?? 0;

      if (expense === 0 && income === 0) return defaultFill;

      const getOpacity = (amt: number, max: number) => {
        if (amt <= 0) return 0;
        if (max <= 0) return OPACITIES[4];
        const bucket = Math.min(4, Math.max(1, Math.ceil((amt / max) * 4)));
        return OPACITIES[bucket];
      };

      const redOpacity = getOpacity(expense, maxDailyExpenseMinor);
      const greenOpacity = getOpacity(income, maxDailyIncomeMinor);

      const redColor = `color-mix(in srgb, var(--destructive) ${redOpacity}%, transparent)`;
      const greenColor = `color-mix(in srgb, var(--success) ${greenOpacity}%, transparent)`;

      // Both expense and income: half red, half green
      if (expense > 0 && income > 0) {
        return `linear-gradient(135deg, ${redColor} 50%, ${greenColor} 50%)`;
      }

      // Income only: full green
      if (income > 0) {
        return greenColor;
      }

      // Expense only: full red
      return redColor;
    };
  }, [startDate, endDate, dailyExpenseTotals, dailyIncomeTotals, maxDailyExpenseMinor, maxDailyIncomeMinor]);

  return (
    <div className={className}>
      <div className="overflow-x-auto p-1">
        <HeatCalendar
          weeks={weeks}
          endDate={endDate}
          values={values}
          maxCount={Math.max(1, Math.round(maxDailyExpenseMinor / 100))}
          color="var(--destructive)"
          unit={currency}
          getCellBackground={getCellBackground}
        >
          <HeatCalendarGrid>
            <HeatCalendarTooltip>
              {(tip) => {
                let totalExpenseMinor = 0;
                let totalIncomeMinor = 0;

                if (tip.days > 1 && tip.startDate && tip.endDate) {
                  let curr = new Date(tip.startDate);
                  while (curr <= tip.endDate) {
                    const key = curr.toISOString().slice(0, 10);
                    totalExpenseMinor += dailyExpenseTotals.get(key) ?? 0;
                    totalIncomeMinor += dailyIncomeTotals.get(key) ?? 0;
                    curr = addDays(curr, 1);
                  }
                } else {
                  const key = tip.date.toISOString().slice(0, 10);
                  totalExpenseMinor = dailyExpenseTotals.get(key) ?? 0;
                  totalIncomeMinor = dailyIncomeTotals.get(key) ?? 0;
                }

                const netMinor = totalIncomeMinor - totalExpenseMinor;
                const hasExpense = totalExpenseMinor > 0;
                const hasIncome = totalIncomeMinor > 0;

                return (
                  <div className="flex flex-col gap-1.5 p-1 text-xs min-w-40">
                    <div className="text-[11px] font-medium text-muted-foreground border-b border-border/50 pb-1">
                      {tip.days > 1 && tip.startDate && tip.endDate
                        ? `${fmtRange.format(tip.startDate)} – ${fmtRange.format(tip.endDate)} (${tip.days} days)`
                        : fmtDay.format(tip.date)}
                    </div>

                    {hasExpense || hasIncome ? (
                      <div className="space-y-1 pt-0.5">
                        {hasExpense ? (
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="size-2 rounded-full bg-destructive" />
                              Total Expense
                            </span>
                            <span className="font-semibold text-foreground tabular-nums">
                              <NumberTicker
                                value={totalExpenseMinor / 100}
                                decimals={2}
                                duration={0.3}
                                stagger={0.015}
                                startOnView={false}
                                format={(val) => formatMoney(Math.round(val * 100), currency)}
                              />
                            </span>
                          </div>
                        ) : null}

                        {hasIncome ? (
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="size-2 rounded-full bg-success" />
                              Total Income
                            </span>
                            <span className="font-semibold text-success tabular-nums">
                              +
                              <NumberTicker
                                value={totalIncomeMinor / 100}
                                decimals={2}
                                duration={0.3}
                                stagger={0.015}
                                startOnView={false}
                                format={(val) => formatMoney(Math.round(val * 100), currency)}
                              />
                            </span>
                          </div>
                        ) : null}

                        {hasExpense && hasIncome ? (
                          <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/40 text-[11px]">
                            <span className="text-muted-foreground font-medium">Net</span>
                            <span
                              className={cn(
                                "font-bold tabular-nums",
                                netMinor >= 0 ? "text-success" : "text-destructive"
                              )}
                            >
                              {netMinor >= 0 ? "+" : "−"}
                              <NumberTicker
                                value={Math.abs(netMinor) / 100}
                                decimals={2}
                                duration={0.3}
                                stagger={0.015}
                                startOnView={false}
                                format={(val) => formatMoney(Math.round(val * 100), currency)}
                              />
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-[11px] py-0.5">
                        No expenses or income
                      </div>
                    )}
                  </div>
                );
              }}
            </HeatCalendarTooltip>
          </HeatCalendarGrid>
          <HeatCalendarLegend />
        </HeatCalendar>
      </div>
    </div>
  );
}
