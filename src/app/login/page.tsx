import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/api";

export const instant = false;
export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; verified?: string; reset?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }
  const params = await searchParams;
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to see where your money went."
      footer={
        <span>
          New here?{" "}
          <a href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </a>
        </span>
      }
    >
      <LoginForm next={params.next} verified={params.verified} reset={params.reset} />
    </AuthShell>
  );
}
