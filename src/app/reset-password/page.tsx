import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/reset-form";

export const instant = false;
export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell title="Choose a new password" description="Pick something you have not used before.">
      <ResetForm token={params.token ?? ""} />
    </AuthShell>
  );
}
