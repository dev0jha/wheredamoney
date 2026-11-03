"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-react";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField as Field } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect as Select } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ClientApiError, clientFetch } from "@/lib/client-api";
import type { Category, Expense, Income } from "@/lib/types";
import { todayISO } from "@/lib/utils";

type TransactionFormProps =
  | { mode: "income"; categories: Category[]; initial?: Income }
  | { mode: "expense"; categories: Category[]; initial?: Expense };

export function TransactionForm(props: TransactionFormProps) {
  const router = useRouter();
  const { mode, categories, initial } = props;
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const filtered = categories.filter((category) => category.type === mode);
  const editing = Boolean(initial);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const amount = String(form.get("amount") ?? "").trim();
    const common = {
      amount,
      category_id: String(form.get("category_id") ?? ""),
      date: String(form.get("date") ?? ""),
      notes: String(form.get("notes") ?? ""),
    };

    const body =
      mode === "income"
        ? { ...common, source: String(form.get("source") ?? "") }
        : {
            ...common,
            payment_method: String(form.get("payment_method") ?? "cash"),
            notify_payee: false,
          };

    const path = editing
      ? `/${mode === "income" ? "incomes" : "expenses"}/${initial!.id}`
      : `/${mode === "income" ? "incomes" : "expenses"}`;

    try {
      await clientFetch(path, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      router.push(mode === "income" ? "/incomes" : "/expenses");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ClientApiError ? caught.message : "Could not save this entry. Try again.");
      setPending(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl overflow-hidden shadow-sm">
      <CardHeader className="border-b border-border bg-muted/20 pb-5">
        <div className="flex items-center gap-2">
          <div
            className={`flex size-8 items-center justify-center rounded-lg ${
              mode === "income" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
            }`}
          >
            {mode === "income" ? <IconArrowDownRight className="size-4.5" /> : <IconArrowUpRight className="size-4.5" />}
          </div>
          <div>
            <CardTitle className="text-xl">
              {editing ? `Edit ${mode}` : `Add new ${mode}`}
            </CardTitle>
            <CardDescription>
              {mode === "income"
                ? "Record incoming money from salary, clients, or investments."
                : "Record spending to keep your monthly totals accurate."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount" htmlFor="amount" hint="In rupees, e.g. 1500.00">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="amount"
                  name="amount"
                  inputMode="decimal"
                  placeholder="0.00"
                  defaultValue={initial ? (initial.amount_minor / 100).toFixed(2) : ""}
                  className="pl-8 text-base font-semibold tabular-nums sm:text-sm"
                  required
                  autoFocus
                />
              </div>
            </Field>

            <Field label="Date" htmlFor="date">
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={initial?.date ?? todayISO()}
                required
              />
            </Field>
          </div>

          {mode === "income" ? (
            <Field
              label="Source"
              htmlFor="source"
              hint="Salary, client name, business dividend, or gift."
            >
              <Input
                id="source"
                name="source"
                placeholder="e.g. Monthly Salary"
                defaultValue={(initial as Income | undefined)?.source ?? ""}
                required
                maxLength={160}
              />
            </Field>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="category_id">
              <Select id="category_id" name="category_id" defaultValue={initial?.category_id ?? ""}>
                <option value="">Uncategorized</option>
                {filtered.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            {mode === "expense" ? (
              <Field label="Payment method" htmlFor="payment_method">
                <Select
                  id="payment_method"
                  name="payment_method"
                  defaultValue={(initial as Expense | undefined)?.payment_method ?? "cash"}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Debit / Credit Card</option>
                  <option value="bank">Net Banking / Bank Transfer</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
            ) : null}
          </div>

          <Field label="Notes" htmlFor="notes" hint="Optional context or memo.">
            <Textarea
              id="notes"
              name="notes"
              placeholder="Add details, invoice numbers, or reminders..."
              defaultValue={initial?.notes ?? ""}
              maxLength={2000}
              rows={3}
            />
          </Field>

          {error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex items-center gap-3 pt-3">
            <Button type="submit" loading={pending} disabled={pending}>
              {pending ? "Saving..." : editing ? "Save changes" : mode === "income" ? "Add income" : "Add expense"}
            </Button>
            <Link
              href={mode === "income" ? "/incomes" : "/expenses"}
              className={buttonVariants({ variant: "ghost" })}
            >
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
