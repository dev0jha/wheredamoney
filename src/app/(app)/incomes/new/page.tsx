import type { Metadata } from "next";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";

import { TransactionForm } from "@/components/transactions/transaction-form";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiFetch, requireUser } from "@/lib/api";
import type { Category } from "@/lib/types";

export const metadata: Metadata = { title: "Add income" };

export default async function NewIncomePage() {
  await requireUser();
  const payload = await apiFetch<{ categories: Category[] }>("/categories?type=income");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Add income"
        description="Record money that came in. You can add notes and a category."
        actions={
          <Link href="/incomes" className={buttonVariants({ variant: "ghost" })}>
            <IconArrowLeft className="size-4" /> Back
          </Link>
        }
      />
      <TransactionForm mode="income" categories={payload.categories} />
    </div>
  );
}
