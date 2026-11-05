import type { Metadata } from "next";
import Image from "next/image";

import { ExpenseHeatCalendar } from "@/components/charts/expense-heat-calendar";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { apiFetch, requireUser } from "@/lib/api";
import type { DashboardSummary, Expense, Income, Pagination } from "@/lib/types";
import { currentMonth, formatMoney, monthLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentMonth();

  const weeks = 32;
  const now = new Date();
  const fromDate = new Date(now.getTime() - weeks * 7 * 86400000);
  const from = fromDate.toISOString().slice(0, 10);
  const to = now.toISOString().slice(0, 10);

  const [summaryPayload, expensesPayload, incomesPayload] = await Promise.all([
    apiFetch<{ summary: DashboardSummary }>(`/dashboard/summary?month=${month}`),
    apiFetch<{ expenses: Expense[]; pagination: Pagination }>(
      `/expenses?from=${from}&to=${to}&limit=100`
    ).catch(() => ({ expenses: [] as Expense[], pagination: { limit: 100, offset: 0, total: 0 } })),
    apiFetch<{ incomes: Income[]; pagination: Pagination }>(
      `/incomes?from=${from}&to=${to}&limit=100`
    ).catch(() => ({ incomes: [] as Income[], pagination: { limit: 100, offset: 0, total: 0 } })),
  ]);

  let allExpenses = expensesPayload.expenses;
  if (expensesPayload.pagination && (expensesPayload.pagination as any).total > 100) {
    try {
      const page2 = await apiFetch<{ expenses: Expense[] }>(
        `/expenses?from=${from}&to=${to}&limit=100&offset=100`
      );
      allExpenses = allExpenses.concat(page2.expenses);
    } catch {
      // ignore
    }
  }

  let allIncomes = incomesPayload.incomes;
  if (incomesPayload.pagination && (incomesPayload.pagination as any).total > 100) {
    try {
      const page2 = await apiFetch<{ incomes: Income[] }>(
        `/incomes?from=${from}&to=${to}&limit=100&offset=100`
      );
      allIncomes = allIncomes.concat(page2.incomes);
    } catch {
      // ignore
    }
  }

  const summary = summaryPayload.summary;
  const currency = user.currency;

  return (
    <div className="relative isolate space-y-8">
      {/* Decorative Dashboard Illustration in top-right area */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-4 right-0 z-0 hidden sm:block h-[300px] w-[500px] lg:h-[360px] lg:w-[620px] overflow-hidden rounded-2xl opacity-90 dark:opacity-80 transition-opacity"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 40%, transparent 95%), linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)",
          WebkitMaskComposite: "source-in",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 40%, transparent 95%), linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)",
          maskComposite: "intersect",
        }}
      >
        <Image
          src="/dashboard.png"
          alt="Dashboard Preview"
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background from-0% via-background/40 via-15% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background from-10% via-background/60 via-45% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background from-0% via-background/35 via-25% to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-l from-background from-0% via-background/40 via-20% to-transparent" />
      </div>

      <div className="relative z-10">
        <PageHeader
          title={`Hello, ${user.name.split(" ")[0]}`}
          description={`Here is where your money went for ${monthLabel(month)}.`}
        />
      </div>

      <section className="relative z-0 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Income"
          value={formatMoney(summary.total_income_minor, currency)}
          tone="info"
        />
        <StatCard
          label="Total Expenses"
          value={formatMoney(summary.total_expenses_minor, currency)}
          tone="destructive"
        />
      </section>

      {/* Daily Expense Tracker Heat Calendar */}
      <section className="relative z-10 flex justify-start py-2">
        <ExpenseHeatCalendar
          expenses={allExpenses}
          incomes={allIncomes}
          currency={currency}
          weeks={weeks}
        />
      </section>
    </div>
  );
}
