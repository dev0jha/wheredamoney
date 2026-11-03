"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconCircleCheck, IconShieldExclamation } from "@tabler/icons-react";
import { useState } from "react";

import StripeButton from "@/components/pixel-perfect/stripe-button";
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
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "Could not sign you in. Please check your credentials."
      );
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 font-[family-name:var(--font-geist-mono)]">
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

      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Authenticate to access your profile.
        </p>
      </div>

      <div className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-xs font-medium tracking-wider text-muted-foreground"
          >
            Email Address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="someone@domain.com"
            required
            autoFocus
            className="h-11 border-border/70 bg-background/50 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/40"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-medium tracking-wider text-muted-foreground"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="h-11 border-border/70 bg-background/50 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/40"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          {error}
        </div>
      ) : null}

      <div className="space-y-4 pt-1">
        <StripeButton
          type="submit"
          className="w-full h-11"
          disabled={pending}
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              Verifying...
            </span>
          ) : (
            "Login"
          )}
        </StripeButton>

        <div className="text-center text-xs text-muted-foreground">
          No Account?{" "}
          <Link
            href="/register"
            className="px-1 font-semibold text-primary underline-offset-4 transition-colors hover:underline"
          >
            Create one
          </Link>
        </div>
      </div>
    </form>
  );
}

export default LoginForm;
