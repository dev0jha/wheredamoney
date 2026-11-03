"use client";

import Link from "next/link";
import { IconCircleCheck, IconMail } from "@tabler/icons-react";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { FormField as Field } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ClientApiError, clientFetch } from "@/lib/client-api";

export function ForgotForm() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await clientFetch("/auth/forgot", {
        method: "POST",
        body: JSON.stringify({ email: String(form.get("email") ?? "").trim() }),
      });
      setSent(true);
    } catch (caught) {
      setError(caught instanceof ClientApiError ? caught.message : "Could not send the reset link. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs font-medium text-success">
          <IconCircleCheck className="size-4 shrink-0" />
          <span>If that email address is registered, a password reset link is on its way.</span>
        </div>
        <Link href="/login" className={buttonVariants({ variant: "outline", className: "w-full" })}>
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email Address" htmlFor="email" hint="We will send a secure password reset link.">
        <div className="relative">
          <IconMail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            className="pl-9"
            required
            autoFocus
          />
        </div>
      </Field>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          {error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" loading={pending} disabled={pending}>
        {pending ? "Sending link..." : "Send reset link"}
      </Button>

      <p className="text-center text-xs text-muted-foreground pt-2">
        Remember your password?{" "}
        <Link href="/login" className="font-semibold text-primary transition-colors hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
