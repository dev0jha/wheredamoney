import type { Metadata } from "next";
import Link from "next/link";
import {
  IconArrowDownRight,
  IconChevronLeft,
  IconChevronRight,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrendingUp,
  IconX,
} from "@tabler/icons-react";

import { MonthPicker } from "@/components/app/month-picker";
import { DeleteTransactionButton } from "@/components/transactions/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { apiFetch, requireUser } from "@/lib/api";
import type { Income, Pagination } from "@/lib/types";
import { currentMonth, formatDate, formatMoney, monthLabel, monthRange } from "@/lib/utils";

export const metadata: Metadata = { title: "Income" };

export default async function IncomesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; q?: string; offset?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : currentMonth();
  const q = params.q?.trim() ?? "";
  const offset = Math.max(0, Number(params.offset ?? 0) || 0);
  const { from, to } = monthRange(month);

  const query = new URLSearchParams({ from, to, limit: "20", offset: String(offset) });
  if (q) query.set("q", q);

  const payload = await apiFetch<{ incomes: Income[]; pagination: Pagination }>(`/incomes?${query.toString()}`);
  const { incomes, pagination } = payload;

  const totalPageIncomeMinor = incomes.reduce((acc, curr) => acc + curr.amount_minor, 0);

  function pageHref(nextOffset: number) {
    const next = new URLSearchParams({ month });
    if (q) next.set("q", q);
    if (nextOffset > 0) next.set("offset", String(nextOffset));
    return `/incomes?${next.toString()}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Income"
        description={`All earnings and incoming money recorded for ${monthLabel(month)}.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <MonthPicker month={month} basePath="/incomes" />
            <Link href="/incomes/new" className={buttonVariants()}>
              <IconPlus className="size-4" /> Add income
            </Link>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex flex-1 items-center gap-2" action="/incomes">
          <input type="hidden" name="month" value={month} />
          <div className="relative flex-1 max-w-md">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search by source or notes..."
              className="pl-9 text-sm"
            />
            {q ? (
              <Link
                href={`/incomes?month=${month}`}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <IconX className="size-3.5" />
              </Link>
            ) : null}
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {incomes.length > 0 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Page total:</span>
            <span className="font-bold tabular-nums text-success">
              +{formatMoney(totalPageIncomeMinor, user.currency)}
            </span>
          </div>
        ) : null}
      </div>

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-0">
          {incomes.length === 0 ? (
            <EmptyState
              icon={IconTrendingUp}
              title={q ? "No matching income" : "No income recorded this month"}
              description={
                q
                  ? "Try searching for a different source keyword or clear the filter."
                  : "Add your monthly salary, consulting fees, dividend, or freelance payments."
              }
              action={
                <Link href="/incomes/new" className={buttonVariants()}>
                  <IconPlus className="size-4" /> Add income
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {incomes.map((income) => (
                <li
                  key={income.id}
                  className="group flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-muted/20 sm:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white shadow-xs"
                      style={{ background: income.category_color ?? "#10b981" }}
                    >
                      <IconArrowDownRight className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{income.source}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {income.category_name ?? "Uncategorized"} · {formatDate(income.date)}
                        {income.notes ? <span> · {income.notes}</span> : null}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="mr-1 text-right sm:mr-2">
                      <p className="text-sm font-bold tabular-nums text-success">
                        +{formatMoney(income.amount_minor, income.currency)}
                      </p>
                      <Badge variant="success" className="mt-0.5 text-[10px] uppercase tracking-wider">
                        Income
                      </Badge>
                    </div>
                    <Link
                      href={`/incomes/${income.id}/edit`}
                      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                      aria-label="Edit income"
                    >
                      <IconPencil className="size-3.5 text-muted-foreground hover:text-foreground" />
                    </Link>
                    <DeleteTransactionButton kind="incomes" id={income.id} label="income" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {pagination.total > 0 ? (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <p>
            Showing <span className="font-medium text-foreground">{pagination.offset + 1}</span>–
            <span className="font-medium text-foreground">
              {Math.min(pagination.offset + pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-medium text-foreground">{pagination.total}</span> entries
          </p>
          <div className="flex items-center gap-1.5">
            {pagination.offset > 0 ? (
              <Link
                href={pageHref(Math.max(0, pagination.offset - pagination.limit))}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <IconChevronLeft className="size-4" /> Previous
              </Link>
            ) : null}
            {pagination.offset + pagination.limit < pagination.total ? (
              <Link
                href={pageHref(pagination.offset + pagination.limit)}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Next <IconChevronRight className="size-4" />
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
