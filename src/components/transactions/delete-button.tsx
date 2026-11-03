"use client";

import { useRouter } from "next/navigation";
import { IconTrash } from "@tabler/icons-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { clientFetch } from "@/lib/client-api";

export function DeleteTransactionButton({
  kind,
  id,
  label,
}: {
  kind: "incomes" | "expenses";
  id: string;
  label: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setPending(true);
    setError("");
    try {
      await clientFetch(`/${kind}/${id}`, { method: "DELETE" });
      setOpen(false);
      router.refresh();
    } catch {
      setError("Could not delete this entry. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${label}`}
            className="text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <IconTrash className="size-4" />
          </Button>
        }
      />
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this {label}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove this {label} from your records. This action cannot be undone.
          </AlertDialogDescription>
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button variant="outline" disabled={pending}>Cancel</Button>} />
          <Button variant="destructive" onClick={remove} disabled={pending}>
            {pending ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  );
}
