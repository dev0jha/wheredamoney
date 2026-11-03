"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconLock, IconShieldExclamation } from "@tabler/icons-react";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { FormField as Field } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ClientApiError, clientFetch } from "@/lib/client-api";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password !== confirm) {
      setError("Passwords do not match.");
      setPending(false);
      return;
    }
    try {
      await clientFetch("/auth/reset", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      router.replace("/login?reset=1");
    } catch (caught) {
      setError(caught instanceof ClientApiError ? caught.message : "Could not reset your password. Try again.");
      setPending(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
          <IconShieldExclamation className="size-4 shrink-0" />
          <span>This reset link is invalid or missing a token. Please request a new one.</span>
        </div>
        <Link href="/forgot-password" className={buttonVariants({ variant: "outline", className: "w-full" })}>
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="New Password" htmlFor="password" hint="Minimum 8 characters.">
        <div className="relative">
          <IconLock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="pl-9"
            required
            minLength={8}
            autoFocus
          />
        </div>
      </Field>

      <Field label="Confirm New Password" htmlFor="confirm">
        <div className="relative">
          <IconLock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="pl-9"
            required
            minLength={8}
          />
        </div>
      </Field>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          {error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" loading={pending} disabled={pending}>
        {pending ? "Updating..." : "Update password"}
      </Button>

      <p className="text-center text-xs text-muted-foreground pt-2">
        <Link href="/login" className="font-semibold text-primary transition-colors hover:underline">
          Return to sign in
        </Link>
      </p>
    </form>
  );
}
