import type { Icon as TablerIconType, TablerIcon } from "@tabler/icons-react";
import type * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: TablerIcon | TablerIconType | React.ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "destructive" | "warning";
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
};

const tones = {
  default: {
    iconBg: "bg-muted text-foreground",
    badge: "bg-muted text-muted-foreground",
    accent: "bg-primary",
  },
  success: {
    iconBg: "bg-success/10 text-success dark:bg-success/20",
    badge: "bg-success/10 text-success",
    accent: "bg-success",
  },
  destructive: {
    iconBg: "bg-destructive/10 text-destructive dark:bg-destructive/20",
    badge: "bg-destructive/10 text-destructive",
    accent: "bg-destructive",
  },
  warning: {
    iconBg: "bg-warning/10 text-warning dark:bg-warning/20",
    badge: "bg-warning/10 text-warning",
    accent: "bg-warning",
  },
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  trend,
  className,
}: StatCardProps) {
  const t = tones[tone];

  return (
    <Card className={cn("group relative overflow-hidden p-5 transition-shadow hover:shadow-md", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">{value}</p>
          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
          {trend ? (
            <div className="flex items-center gap-1.5 pt-1 text-xs font-medium">
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  trend.isPositive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
                )}
              >
                {trend.value}
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          ) : null}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-160 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105",
            t.iconBg,
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}
