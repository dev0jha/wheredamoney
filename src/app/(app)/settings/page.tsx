import type { Metadata } from "next";
import {
  IconCircleCheck,
  IconClock,
  IconLock,
  IconMail,
  IconShieldExclamation,
  IconSparkles,
  IconUser as UserIcon,
} from "@tabler/icons-react";

import { LogoutButton } from "@/components/app/logout-button";
import { ProfileForm } from "@/components/settings/profile-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/api";
import { formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your account profile, tracking preferences, and active session."
      />

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-14 ring-2 ring-primary/20">
              <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-bold text-foreground">{user.name}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <IconMail className="size-3.5" /> {user.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={user.email_verified ? "success" : "warning"}>
              {user.email_verified ? (
                <IconCircleCheck className="size-3.5" />
              ) : (
                <IconShieldExclamation className="size-3.5" />
              )}
              {user.email_verified ? "Verified" : "Unverified"}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <IconClock className="size-3" /> Member since {formatDate(user.created_at.slice(0, 10))}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-border bg-muted/10 pb-4">
          <div className="flex items-center gap-2 text-primary">
            <UserIcon className="size-4" />
            <CardTitle className="text-base">Profile & Preferences</CardTitle>
          </div>
          <CardDescription>
            Configure how your name, currencies, and billing cycles appear on reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ProfileForm user={user} />
        </CardContent>
      </Card>

      <Card className="border-dashed shadow-sm">
        <CardHeader className="border-b border-border bg-muted/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <IconSparkles className="size-4" />
              <CardTitle className="text-base">AI Financial Insights (Groq)</CardTitle>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              Coming Soon
            </Badge>
          </div>
          <CardDescription>
            Bring your own personal Groq API key to generate automated spending summaries and intelligent budget tips.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3.5 text-xs text-muted-foreground">
            <IconLock className="size-4 shrink-0 text-primary" />
            <span>
              Your personal API keys are encrypted at rest with AES-256-GCM. We never transmit your keys to third parties.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-border bg-muted/10 pb-4">
          <CardTitle className="text-base">Session & Security</CardTitle>
          <CardDescription>
            Sign out of your active browser session on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
