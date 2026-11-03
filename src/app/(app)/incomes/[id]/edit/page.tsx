import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

import { TransactionForm } from "@/components/transactions/transaction-form";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError, apiFetch, requireUser } from "@/lib/api";
import type { Category, Income } from "@/lib/types";

export const metadata: Metadata = { title: "Edit income" };

export default async function EditIncomePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  let income: Income;
  try {
    const payload = await apiFetch<{ income: Income }>(`/incomes/${id}`);
    income = payload.income;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const categories = await apiFetch<{ categories: Category[] }>("/categories?type=income");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Edit income"
        description="Fix an amount, change the date, or update the notes."
        actions={
          <Link href="/incomes" className={buttonVariants({ variant: "ghost" })}>
            <IconArrowLeft className="size-4" /> Back
          </Link>
        }
      />
      <TransactionForm mode="income" categories={categories.categories} initial={income} />
    </div>
  );
}
