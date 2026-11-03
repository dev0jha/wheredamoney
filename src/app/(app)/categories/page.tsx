import type { Metadata } from "next";

import { CategoriesClient } from "@/components/categories/categories-client";
import { PageHeader } from "@/components/ui/page-header";
import { apiFetch, requireUser } from "@/lib/api";
import type { Category } from "@/lib/types";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireUser();
  const payload = await apiFetch<{ categories: Category[] }>("/categories");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Give every rupee a place to land. Colors show up on the dashboard and slips."
      />
      <CategoriesClient categories={payload.categories} />
    </div>
  );
}
