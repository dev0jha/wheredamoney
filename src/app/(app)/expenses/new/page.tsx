import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

import { TransactionForm } from "@/components/transactions/transaction-form";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiFetch, requireUser } from "@/lib/api";
import type { Category } from "@/lib/types";

export const metadata: Metadata = { title: "Add expense" };

export default async function NewExpensePage() {
  await requireUser();
  const payload = await apiFetch<{ categories: Category[] }>("/categories?type=expense");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Add expense"
        description="Record what you paid, when, and how."
        actions={
          <Link href="/expenses" className={buttonVariants({ variant: "ghost" })}>
            <IconArrowLeft className="size-4" /> Back
          </Link>
        }
      />
      <TransactionForm mode="expense" categories={payload.categories} />
    </div>
  );
}
