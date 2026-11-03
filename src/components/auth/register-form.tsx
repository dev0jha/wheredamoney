"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconLock, IconMail, IconUser } from "@tabler/icons-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField as Field } from "@/components/ui/form-field";
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
    try {
      await clientFetch<{ user: UserType }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name") ?? "").trim(),
          email: String(form.get("email") ?? "").trim(),
          password: String(form.get("password") ?? ""),
        }),
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ClientApiError ? caught.message : "Could not create your account. Try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Full Name" htmlFor="name">
        <div className="relative">
          <IconUser className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="John Doe"
            className="pl-9"
            required
            maxLength={120}
            autoFocus
          />
        </div>
      </Field>

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
          />
        </div>
      </Field>

      <Field label="Password" htmlFor="password" hint="Minimum 8 characters.">
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
          />
        </div>
      </Field>

      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
          {error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" loading={pending} disabled={pending}>
        {pending ? "Creating account..." : "Start tracking free"}
      </Button>

      <p className="text-center text-xs text-muted-foreground pt-2">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary transition-colors hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
