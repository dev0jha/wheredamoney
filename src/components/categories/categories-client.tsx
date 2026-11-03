"use client";

import { useRouter } from "next/navigation";
import {
  IconFolderPlus,
  IconPencil,
  IconPlus,
  IconTag,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField as Field } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect as Select } from "@/components/ui/native-select";
import { ClientApiError, clientFetch } from "@/lib/client-api";
import type { Category } from "@/lib/types";

const palette = [
  "#6366f1",
  "#f97316",
  "#ef4444",
  "#10b981",
  "#0ea5e9",
  "#a855f7",
  "#eab308",
  "#000000",
  "#ec4899",
  "#14b8a6",
];

export function CategoriesClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const income = categories.filter((category) => category.type === "income");
  const expense = categories.filter((category) => category.type === "expense");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = {
      name: String(form.get("name") ?? "").trim(),
      type: editing?.type ?? String(form.get("type") ?? "expense"),
      color: String(form.get("color") ?? "#6366f1"),
      icon: editing?.icon || "circle",
    };
    try {
      await clientFetch(editing ? `/categories/${editing.id}` : "/categories", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      setEditing(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ClientApiError ? caught.message : "Could not save the category. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    if (!categoryToDelete) return;
    setDeletePending(true);
    setDeleteError("");
    try {
      await clientFetch(`/categories/${categoryToDelete.id}`, { method: "DELETE" });
      if (editing?.id === categoryToDelete.id) setEditing(null);
      setCategoryToDelete(null);
      router.refresh();
    } catch {
      setDeleteError("Could not delete this category. Try again.");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
        <Card className="h-fit">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <IconFolderPlus className="size-4" />
              <CardTitle>{editing ? "Edit category" : "New category"}</CardTitle>
            </div>
            <CardDescription>
              {editing
                ? "Update category name and color theme."
                : "Create a custom category to tag your spending and income."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form key={editing?.id ?? "new"} onSubmit={onSubmit} className="space-y-4">
              <Field label="Category name" htmlFor="name">
                <Input
                  id="name"
                  name="name"
                  defaultValue={editing?.name ?? ""}
                  placeholder="e.g. Groceries, Subscriptions"
                  required
                  maxLength={80}
                  autoFocus={Boolean(editing)}
                />
              </Field>

              {!editing ? (
                <Field label="Type" htmlFor="type">
                  <Select id="type" name="type" defaultValue="expense">
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </Select>
                </Field>
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-sm">
                  <span className="text-muted-foreground">Type: </span>
                  <span className="font-semibold capitalize text-foreground">{editing.type}</span>
                </div>
              )}

              <Field label="Color badge" htmlFor="color">
                <div className="flex flex-wrap gap-2 pt-1">
                  {palette.map((color) => (
                    <label key={color} className="group relative cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        value={color}
                        defaultChecked={editing ? editing.color === color : color === palette[0]}
                        className="peer sr-only"
                      />
                      <span
                        className="flex size-7 items-center justify-center rounded-full transition-transform duration-160 ease-[cubic-bezier(0.23,1,0.32,1)] group-active:scale-95 peer-checked:ring-2 peer-checked:ring-foreground peer-checked:ring-offset-2 peer-checked:ring-offset-background"
                        style={{ background: color }}
                      />
                    </label>
                  ))}
                </div>
              </Field>

              {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving..." : editing ? "Save changes" : "Create category"}
                </Button>
                {editing ? (
                  <Button variant="ghost" type="button" onClick={() => setEditing(null)}>
                    <IconX className="size-4" /> Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {[
            { label: "Expense categories", items: expense, tone: "destructive" },
            { label: "Income categories", items: income, tone: "success" },
          ].map((group) => (
            <Card key={group.label}>
              <CardHeader className="flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <IconTag className="size-4 text-muted-foreground" />
                  <CardTitle className="text-base">{group.label}</CardTitle>
                </div>
                <Badge variant="outline">{group.items.length}</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {group.items.map((category) => (
                    <li
                      key={category.id}
                      className="group flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-muted/20"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="size-3.5 shrink-0 rounded-full ring-2 ring-background shadow-xs"
                          style={{ background: category.color }}
                        />
                        <span className="truncate text-sm font-medium">{category.name}</span>
                        {category.is_default ? (
                          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                            Default
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 opacity-90 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${category.name}`}
                          onClick={() => setEditing(category)}
                          className="hover:bg-muted"
                        >
                          <IconPencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${category.name}`}
                          onClick={() => setCategoryToDelete(category)}
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <IconTrash className="size-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                  {group.items.length === 0 ? (
                    <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                      No {group.label.toLowerCase()} yet. Create your first category using the form.
                    </li>
                  ) : null}
                </ul>
              </CardContent>
            </Card>
          ))}
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
            <IconPlus className="size-3.5 shrink-0 text-primary" />
            <span>Default categories can be edited or deleted. Deleted categories leave transactions uncategorized.</span>
          </div>
        </div>
      </div>

      <AlertDialog
        open={Boolean(categoryToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setCategoryToDelete(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category &ldquo;{categoryToDelete?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Any transactions tagged with this category will remain, but will become uncategorized. This action cannot be undone.
            </AlertDialogDescription>
            {deleteError ? <p className="mt-2 text-sm text-destructive">{deleteError}</p> : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" disabled={deletePending}>Cancel</Button>} />
            <Button variant="destructive" onClick={confirmDelete} disabled={deletePending}>
              {deletePending ? "Deleting..." : "Delete category"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </>
  );
}
