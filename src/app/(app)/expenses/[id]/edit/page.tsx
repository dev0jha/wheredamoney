import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

import { TransactionForm } from "@/components/transactions/transaction-form";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError, apiFetch, requireUser } from "@/lib/api";
import type { Category, Expense } from "@/lib/types";

export const metadata: Metadata = { title: "Edit expense" };

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  let expense: Expense;
  try {
    const payload = await apiFetch<{ expense: Expense }>(`/expenses/${id}`);
    expense = payload.expense;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const categories = await apiFetch<{ categories: Category[] }>("/categories?type=expense");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Edit expense"
        description="Fix an amount, change the category, or update the notes."
        actions={
          <Link href="/expenses" className={buttonVariants({ variant: "ghost" })}>
            <IconArrowLeft className="size-4" /> Back
          </Link>
        }
      />
      <TransactionForm mode="expense" categories={categories.categories} initial={expense} />
    </div>
  );
}
