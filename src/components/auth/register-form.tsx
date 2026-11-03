"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import StripeButton from "@/components/pixel-perfect/stripe-button";
import { Input } from "@/components/ui/input";
import { ClientApiError, clientFetch } from "@/lib/client-api";
import type { User as UserType } from "@/lib/types";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const firstName = String(form.get("firstName") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setPending(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setPending(false);
      return;
    }

    const name = `${firstName} ${lastName}`.trim() || firstName || "User";

    try {
      await clientFetch<{ user: UserType }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "Could not create your account. Try again."
      );
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6 font-[family-name:var(--font-geist-mono)]">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Create your account on WhereDaMoney.
        </p>
      </div>

      <div className="space-y-4">
        {/* Name Fields (First & Last Name) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="firstName"
              className="text-xs font-medium tracking-wider text-muted-foreground"
            >
              First Name
            </label>
            <Input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              placeholder="John"
              required
              autoFocus
              className="h-11 border-border/70 bg-background/50 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/40"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="lastName"
              className="text-xs font-medium tracking-wider text-muted-foreground"
            >
              Last Name
            </label>
            <Input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              placeholder="Doe"
              required
              className="h-11 border-border/70 bg-background/50 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/40"
            />
          </div>
        </div>

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
            className="h-11 border-border/70 bg-background/50 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/40"
          />
        </div>

        {/* Password & Confirm Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-xs font-medium tracking-wider text-muted-foreground"
          >
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required
            minLength={8}
            className="h-11 border-border/70 bg-background/50 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/40"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-xs font-medium tracking-wider text-muted-foreground"
          >
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            required
            minLength={8}
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
              Creating your account...
            </span>
          ) : (
            "Create account"
          )}
        </StripeButton>

        <div className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="px-1 font-semibold text-primary underline-offset-4 transition-colors hover:underline"
          >
            Log in
          </Link>
        </div>
      </div>
    </form>
  );
}

export default RegisterForm;
