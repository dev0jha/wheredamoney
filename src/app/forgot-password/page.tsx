import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" description="We will email you a link to choose a new password.">
      <ForgotForm />
    </AuthShell>
  );
}
