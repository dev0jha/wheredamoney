import type { Metadata } from "next";
import Link from "next/link";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconChevronRight,
  IconPigMoney,
  IconPlus,
  IconReceipt,
  IconSparkles,
  IconTrendingDown,
  IconTrendingUp,
  IconWallet,
} from "@tabler/icons-react";

import { MonthPicker } from "@/components/app/month-picker";
import { CategoryDonut } from "@/components/charts/category-donut";
import { TrendChart } from "@/components/charts/trend-chart";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { apiFetch, requireUser } from "@/lib/api";
import type {
  CategoryTotal,
  DashboardSummary,
  RecentTransaction,
  TrendPoint,
} from "@/lib/types";
import { currentMonth, formatMoney, formatShortDate, monthLabel, percent } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentMonth();

  const [summaryPayload, trendsPayload, categoriesPayload, recentPayload] = await Promise.all([
    apiFetch<{ summary: DashboardSummary }>(`/dashboard/summary?month=${month}`),
    apiFetch<{ trends: TrendPoint[] }>("/dashboard/trends?months=6"),
    apiFetch<{ categories: CategoryTotal[] }>(`/dashboard/categories?month=${month}&type=expense`),
    apiFetch<{ transactions: RecentTransaction[] }>("/dashboard/recent?limit=8"),
  ]);

  const summary = summaryPayload.summary;
  const trends = trendsPayload.trends;
  const categories = categoriesPayload.categories;
  const recent = recentPayload.transactions;
  const currency = user.currency;
  const isEmpty = summary.income_count === 0 && summary.expense_count === 0;

  const current = trends.at(-1);
  const previous = trends.at(-2);
  const expenseDelta = current && previous ? current.expense_minor - previous.expense_minor : 0;
  const topCategory = categories[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hello, ${user.name.split(" ")[0]}`}
        description={`Here is where your money went for ${monthLabel(month)}.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MonthPicker month={month} basePath="/dashboard" />
            <Link href="/incomes/new" className={buttonVariants({ variant: "outline" })}>
              <IconArrowDownRight className="size-4 text-success" />
              Add income
            </Link>
            <Link href="/expenses/new" className={buttonVariants()}>
              <IconPlus className="size-4" /> Add expense
            </Link>
          </div>
        }
      />

      {isEmpty ? (
        <Card className="border-dashed bg-card/60">
          <EmptyState
            icon={IconSparkles}
            title={`No entries for ${monthLabel(month)} yet`}
            description="Add your first income or expense to see visual totals, spending trends, and breakdown charts."
            action={
              <div className="flex flex-wrap justify-center gap-2.5 pt-2">
                <Link href="/incomes/new" className={buttonVariants({ variant: "outline" })}>
                  <IconArrowDownRight className="size-4 text-success" />
                  Add income
                </Link>
                <Link href="/expenses/new" className={buttonVariants()}>
                  <IconPlus className="size-4" />
                  Add expense
                </Link>
              </div>
            }
          />
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Income"
          value={formatMoney(summary.total_income_minor, currency)}
          hint={`${summary.income_count} ${summary.income_count === 1 ? "entry" : "entries"}`}
          icon={IconTrendingUp}
          tone="success"
        />
        <StatCard
          label="Total Expenses"
          value={formatMoney(summary.total_expenses_minor, currency)}
          hint={`${summary.expense_count} ${summary.expense_count === 1 ? "entry" : "entries"}`}
          icon={IconReceipt}
          tone="destructive"
        />
        <StatCard
          label="Net Saved"
          value={formatMoney(summary.net_minor, currency)}
          hint={summary.net_minor >= 0 ? "Kept in your pocket" : "Spent more than earned"}
          icon={IconWallet}
          tone={summary.net_minor >= 0 ? "default" : "warning"}
        />
        <StatCard
          label="Savings Rate"
          value={`${Math.round(summary.savings_rate)}%`}
          hint={
            expenseDelta === 0
              ? "No change vs last month"
              : expenseDelta > 0
                ? "Spending is up vs last month"
                : "Spending is down vs last month"
          }
          icon={IconPigMoney}
          tone={summary.savings_rate >= 20 ? "success" : "warning"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="border-b border-border bg-muted/10 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Income vs Expenses</CardTitle>
                <CardDescription>Monthly movement across the last 6 months</CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-success">
                  <span className="size-2 rounded-full bg-success" /> Income
                </span>
                <span className="flex items-center gap-1.5 text-destructive">
                  <span className="size-2 rounded-full bg-destructive" /> Expenses
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <TrendChart data={trends} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border bg-muted/10 pb-4">
            <CardTitle className="text-lg">Where It Went</CardTitle>
            <CardDescription>Category distribution for {monthLabel(month)}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {categories.length === 0 ? (
              <EmptyState
                icon={IconReceipt}
                title="No expenses yet"
                description="Add an expense to see the visual category breakdown."
                action={
                  <Link href="/expenses/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Add expense
                  </Link>
                }
              />
            ) : (
              <div className="space-y-6">
                <CategoryDonut data={categories} currency={currency} />
                <div className="space-y-3.5">
                  {categories.slice(0, 4).map((category) => (
                    <div key={category.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          <span
                            className="size-2.5 rounded-full ring-2 ring-background shadow-xs"
                            style={{ background: category.color }}
                          />
                          {category.name}
                        </span>
                        <span className="tabular-nums font-medium text-muted-foreground">
                          {formatMoney(category.total_minor, currency)} · {percent(category.percent / 100)}
                        </span>
                      </div>
                      <Progress value={category.percent}>
                        <ProgressTrack className="h-1.5 bg-muted">
                          <ProgressIndicator style={{ background: category.color }} />
                        </ProgressTrack>
                      </Progress>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between border-b border-border bg-muted/10 pb-4">
            <div>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest logged transactions</CardDescription>
            </div>
            <Link
              href="/expenses"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              View all <IconChevronRight className="size-4" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <EmptyState
                icon={IconReceipt}
                title="Nothing recorded yet"
                description="Your latest transactions will automatically show up here."
              />
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((transaction) => (
                  <li
                    key={transaction.id}
                    className="group flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span
                        className="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white shadow-xs"
                        style={{ background: transaction.category_color ?? "var(--primary)" }}
                      >
                        {transaction.kind === "income" ? (
                          <IconArrowDownRight className="size-4.5" />
                        ) : (
                          <IconArrowUpRight className="size-4.5" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{transaction.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {transaction.category_name ?? "Uncategorized"} · {formatShortDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold tabular-nums ${
                          transaction.kind === "income" ? "text-success" : "text-foreground"
                        }`}
                      >
                        {transaction.kind === "income" ? "+" : "−"}
                        {formatMoney(transaction.amount_minor, transaction.currency)}
                      </p>
                      <Badge
                        variant={transaction.kind === "income" ? "success" : "secondary"}
                        className="mt-0.5 text-[10px] uppercase tracking-wider"
                      >
                        {transaction.kind}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border bg-muted/10 pb-4">
            <CardTitle className="text-lg">Month at a Glance</CardTitle>
            <CardDescription>Key observations for {monthLabel(month)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {topCategory ? (
              <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Largest Outflow Category
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="flex items-center gap-2 font-semibold text-foreground">
                    <span className="size-3 rounded-full shadow-xs" style={{ background: topCategory.color }} />
                    {topCategory.name}
                  </p>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground">
                    {percent(topCategory.percent / 100)} of spending
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold tabular-nums text-foreground">
                  {formatMoney(topCategory.total_minor, currency)}
                </p>
              </div>
            ) : null}

            <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Month-over-Month Delta
              </p>
              <p
                className={`mt-2 flex items-center gap-1.5 font-bold ${
                  expenseDelta > 0 ? "text-destructive" : expenseDelta < 0 ? "text-success" : "text-muted-foreground"
                }`}
              >
                {expenseDelta > 0 ? (
                  <IconTrendingUp className="size-4 shrink-0" />
                ) : expenseDelta < 0 ? (
                  <IconTrendingDown className="size-4 shrink-0" />
                ) : null}
                {expenseDelta === 0
                  ? "Equal spending to previous month"
                  : `${expenseDelta > 0 ? "Spent" : "Saved"} ${formatMoney(Math.abs(expenseDelta), currency)}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {previous
                  ? `Comparison against ${monthLabel(previous.month)} spending baseline.`
                  : "Record more months to unlock historical trend comparisons."}
              </p>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
              <p className="flex items-center gap-1.5 font-semibold text-primary">
                <IconSparkles className="size-3.5" /> Smart Insight
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Categorizing each transaction allows the automated monthly slip to rank your expenses and detect sudden spikes early.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
