"use client";

import { useRouter } from "next/navigation";
import { IconCheck, IconDeviceFloppy } from "@tabler/icons-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormField as Field } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect as Select } from "@/components/ui/native-select";
import { ClientApiError, clientFetch } from "@/lib/client-api";
import type { User } from "@/lib/types";

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    try {
      await clientFetch<{ user: User }>("/settings/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: String(form.get("name") ?? "").trim(),
          currency: String(form.get("currency") ?? "INR"),
          timezone: String(form.get("timezone") ?? "Asia/Kolkata"),
          month_start_day: Number(form.get("month_start_day") ?? 1),
        }),
      });
      setSuccess("Profile settings successfully saved.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ClientApiError ? caught.message : "Could not update your profile. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Field label="Display Name" htmlFor="name" hint="Visible across your slips and statements.">
        <Input id="name" name="name" defaultValue={user.name} required maxLength={120} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Primary Currency" htmlFor="currency" hint="Used for calculations & formatting.">
          <Select id="currency" name="currency" defaultValue={user.currency}>
            <option value="INR">INR (₹) — Indian Rupee</option>
            <option value="USD">USD ($) — US Dollar</option>
            <option value="EUR">EUR (€) — Euro</option>
            <option value="GBP">GBP (£) — British Pound</option>
            <option value="CAD">CAD ($) — Canadian Dollar</option>
            <option value="AUD">AUD ($) — Australian Dollar</option>
          </Select>
        </Field>

        <Field
          label="Billing Month Starts On"
          htmlFor="month_start_day"
          hint="Salary cycle day (1 to 28)."
        >
          <Input
            id="month_start_day"
            name="month_start_day"
            type="number"
            min={1}
            max={28}
            defaultValue={user.month_start_day}
            required
            className="tabular-nums"
          />
        </Field>
      </div>

      <Field label="Timezone" htmlFor="timezone" hint="For accurate daily date groupings.">
        <Input id="timezone" name="timezone" defaultValue={user.timezone} required />
      </Field>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 p-3 text-sm font-medium text-success">
          <IconCheck className="size-4 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}

      <div className="pt-2">
        <Button type="submit" loading={pending} disabled={pending}>
          <IconDeviceFloppy className="size-4" />
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
