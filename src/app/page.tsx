import Link from "next/link";
import {
  IconArrowRight,
  IconChartBar,
  IconCheck,
  IconFileText,
  IconLock,
  IconMail,
  IconSparkles,
  IconTrendingUp,
  IconWallet,
} from "@tabler/icons-react";

import { Logo } from "@/components/logo";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function CopyrightYear() {
  "use cache";
  return <>{new Date().getFullYear()}</>;
}

const features = [
  {
    icon: IconTrendingUp,
    title: "Income & expenses in seconds",
    body: "Log salary, client payments, rent, groceries, and daily coffee with a lightning-fast form that stays out of your way.",
    badge: "Speed",
  },
  {
    icon: IconChartBar,
    title: "A dashboard that explains",
    body: "See income vs. expenses over time, category breakdowns, and the categories that grew the most this month.",
    badge: "Clarity",
  },
  {
    icon: IconMail,
    title: "Payment receipts for payees",
    body: "Tag a payee to notify and they receive a clean, professional email receipt with amount, date, purpose, and reference.",
    badge: "Automated",
  },
  {
    icon: IconFileText,
    title: "Monthly financial slip",
    body: "A month-end statement that ranks spending, surfaces unusual increases, and is ready to view or download instantly.",
    badge: "Insight",
  },
  {
    icon: IconSparkles,
    title: "AI insights with your own key",
    body: "Connect your personal Groq key to get plain-language summaries and smart saving recommendations. Zero vendor lock-in.",
    badge: "AI Powered",
  },
  {
    icon: IconLock,
    title: "Private by default",
    body: "Money never moves through WhereDaMoney. No bank linking, no scrapers, no credential risks. Just an honest ledger.",
    badge: "Secure",
  },
];

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Ambient Top Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary/8 via-primary/2 to-transparent blur-3xl"
      />

      {/* Header */}
      <Header />

      <main className="relative flex-1">
        {/* Hero Section */}
        <section id="about" className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-24 pt-16 text-center sm:pt-20 lg:pb-32 lg:pt-24">
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-[#282525] text-xs font-semibold text-[#282525] shadow-2xs">
            <span className="bg-[#282525] px-3 py-2 font-mono text-[11px] text-white">NEW</span>
            <span className="px-3 py-2">Your money, finally clear.</span>
          </div>

          <div className="mt-12 max-w-4xl space-y-6 sm:mt-14">
            <h1 className="font-cooper text-5xl leading-[0.98] tracking-[-0.045em] text-[#282525] text-balance sm:text-6xl lg:text-8xl">
              Know where every rupee goes.
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Track income, expenses, and the choices behind them in one calm, private ledger.
              <br className="hidden sm:block" />
              Clarity for every month, without the spreadsheet headache.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className={buttonVariants({ size: "lg", className: "rounded-md px-6 font-mono text-sm" })}>
              Start tracking free <IconArrowRight className="size-4" />
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-md px-6 font-mono text-sm" })}>
              Sign in
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><IconCheck className="size-3.5 text-success" /> No bank connection</span>
            <span className="flex items-center gap-1.5"><IconCheck className="size-3.5 text-success" /> 100% private</span>
            <span className="flex items-center gap-1.5"><IconCheck className="size-3.5 text-success" /> Set up in 60 seconds</span>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="border-y border-border bg-muted/20 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-14 text-center space-y-3">
              <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading sm:text-4xl text-balance">
                Crafted for peace of mind.
              </h2>
              <p className="mx-auto max-w-xl text-base text-muted-foreground">
                Built with precision, smooth physical interactions, and respect for your time and data.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="group relative overflow-hidden transition-all duration-160 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-160 group-hover:scale-105">
                        <feature.icon className="size-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="pt-3 text-lg font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section id="pricing" className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            <IconWallet className="size-7" />
          </div>
          <div className="max-w-xl space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-heading sm:text-4xl text-balance">
              Take back control of your cash flow.
            </h2>
            <p className="text-muted-foreground">
              Set up in under 60 seconds. Add your income, record an expense, and watch the dashboard light up.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Create free account <IconArrowRight className="size-4" />
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Sign in
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 text-xs text-muted-foreground sm:flex-row">
          <Logo />
          <p>© <CopyrightYear /> WhereDaMoney. Built with craft and care.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
