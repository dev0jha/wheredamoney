export const instant = false;

import type { Metadata } from "next";
import Image from "next/image";

import { CategoryDonutCard } from "@/components/charts/category-donut-card";
import type { DonutSegment } from "@/components/charts/donut-chart";
import { ExpenseHeatCalendar } from "@/components/charts/expense-heat-calendar";
import { FramedCard } from "@/components/ui/framed-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { apiFetch, requireUser } from "@/lib/api";
import type { CategoryTotal, DashboardSummary, Expense, Income, Pagination } from "@/lib/types";
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

  const [summaryPayload, expensesPayload, incomesPayload, categoriesPayload] = await Promise.all([
    apiFetch<{ summary: DashboardSummary }>(`/dashboard/summary?month=${month}`),
    apiFetch<{ expenses: Expense[]; pagination: Pagination }>(
      `/expenses?from=${from}&to=${to}&limit=100`
    ).catch(() => ({ expenses: [] as Expense[], pagination: { limit: 100, offset: 0, total: 0 } })),
    apiFetch<{ incomes: Income[]; pagination: Pagination }>(
      `/incomes?from=${from}&to=${to}&limit=100`
    ).catch(() => ({ incomes: [] as Income[], pagination: { limit: 100, offset: 0, total: 0 } })),
    apiFetch<{ categories: CategoryTotal[] }>(
      `/dashboard/categories?month=${month}&type=expense`
    ).catch(() => ({ categories: [] as CategoryTotal[] })),
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

  // Categories breakdown
  let categoryList = (categoriesPayload.categories ?? []).filter((c) => c.total_minor > 0);
  if (categoryList.length === 0) {
    const monthExpenses = allExpenses.filter((e) => e.date.slice(0, 7) === month);
    const catMap = new Map<string, { id: string; name: string; color: string; total_minor: number; count: number }>();
    for (const exp of monthExpenses) {
      const name = exp.category_name || "Uncategorized";
      const color = exp.category_color || "#71717a";
      const id = exp.category_id || name;
      const existing = catMap.get(name) ?? { id, name, color, total_minor: 0, count: 0 };
      existing.total_minor += exp.amount_minor;
      existing.count += 1;
      catMap.set(name, existing);
    }
    categoryList = Array.from(catMap.values()).map((c) => ({
      category_id: c.id,
      name: c.name,
      color: c.color,
      total_minor: c.total_minor,
      count: c.count,
      percent: summary.total_expenses_minor > 0 ? (c.total_minor / summary.total_expenses_minor) * 100 : 0,
    }));
  }

  const categorySegments: DonutSegment[] = categoryList.map((cat, i) => ({
    id: cat.category_id ?? `cat-${i}`,
    name: cat.name,
    color: cat.color || `var(--chart-${(i % 5) + 1})`,
    value: cat.total_minor / 100,
  }));

  const sampleSegments: DonutSegment[] = [
    { id: "housing", name: "Housing & Rent", color: "#6366f1", value: 12000 },
    { id: "food", name: "Food & Dining", color: "#f97316", value: 4500 },
    { id: "shopping", name: "Shopping", color: "#3b82f6", value: 3200 },
    { id: "transport", name: "Transport", color: "#10b981", value: 1800 },
    { id: "entertainment", name: "Entertainment", color: "#ec4899", value: 1500 },
  ];

  const displaySegments = categorySegments.length > 0 ? categorySegments : sampleSegments;
  const isPreview = categorySegments.length === 0;

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

      <section className="relative z-0 grid max-w-[636px] gap-4 sm:grid-cols-2">
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

      {/* Main Grid: Left Column (Heat Calendar + Category Donut) & Right Column (Framed Card) */}
      <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,636px)_1fr]">
        <div className="space-y-6">
          {/* Daily Expense Tracker Heat Calendar */}
          <section className="relative z-10 flex justify-start">
            <ExpenseHeatCalendar
              expenses={allExpenses}
              incomes={allIncomes}
              currency={currency}
              weeks={weeks}
            />
          </section>

          {/* Category Expenses Breakdown */}
          <section className="relative z-0 flex justify-start">
            <CategoryDonutCard
              segments={displaySegments}
              currency={currency}
              totalExpensesMinor={summary.total_expenses_minor}
              monthLabelText={monthLabel(month)}
              isPreview={isPreview}
            />
          </section>
        </div>

        {/* Right Column: Card with only inner & outer border */}
        <section className="relative z-0 flex h-full flex-col">
          <FramedCard className="h-full min-h-[460px] w-full" />
        </section>
      </div>
    </div>
  );
}
