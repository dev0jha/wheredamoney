"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconCircleCheck, IconLock, IconMail, IconShieldExclamation } from "@tabler/icons-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField as Field } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ClientApiError, clientFetch } from "@/lib/client-api";
import type { User } from "@/lib/types";

export function LoginForm({
  next,
  verified,
  reset,
}: {
  next?: string;
  verified?: string;
  reset?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await clientFetch<{ user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: String(form.get("email") ?? "").trim(),
          password: String(form.get("password") ?? ""),
        }),
      });
      router.replace(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ClientApiError ? caught.message : "Could not sign you in. Please check your credentials.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {verified === "1" ? (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-xs font-medium text-success">
          <IconCircleCheck className="size-4 shrink-0" />
          <span>Email successfully verified. You can now sign in.</span>
        </div>
      ) : null}

      {verified === "0" ? (
        <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs font-medium text-warning">
          <IconShieldExclamation className="size-4 shrink-0" />
          <span>Verification link is invalid or has expired.</span>
        </div>
      ) : null}

      {reset === "1" ? (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-xs font-medium text-success">
          <IconCircleCheck className="size-4 shrink-0" />
          <span>Password reset confirmed. Sign in with your new password.</span>
        </div>
      ) : null}

      <Field label="Email Address" htmlFor="email">
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

      <Field label="Password" htmlFor="password">
        <div className="relative">
          <IconLock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="pl-9"
            required
          />
        </div>
      </Field>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          {error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" loading={pending} disabled={pending}>
        {pending ? "Signing in..." : "Sign in to account"}
      </Button>

      <div className="flex items-center justify-between pt-2 text-xs">
        <Link
          href="/forgot-password"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Forgot password?
        </Link>
        <Link href="/register" className="font-semibold text-primary transition-colors hover:underline">
          Create account
        </Link>
      </div>
    </form>
  );
}
