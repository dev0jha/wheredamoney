"use client";

import { useRouter } from "next/navigation";
import { IconCalendar, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { cn, currentMonth, monthLabel, shiftMonth } from "@/lib/utils";

export function MonthPicker({
  month,
  basePath,
  className,
}: {
  month: string;
  basePath: string;
  className?: string;
}) {
  const router = useRouter();
  const isCurrent = month === currentMonth();

  function go(next: string) {
    router.push(`${basePath}?month=${next}`);
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-border bg-card/80 p-1 shadow-2xs backdrop-blur-sm",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Previous month"
        onClick={() => go(shiftMonth(month, -1))}
        className="rounded-lg text-muted-foreground hover:text-foreground"
      >
        <IconChevronLeft className="size-3.5" />
      </Button>

      <div className="flex min-w-32 items-center justify-center gap-1.5 px-2">
        <IconCalendar className="size-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {monthLabel(month)}
        </span>
        {isCurrent ? (
          <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-primary">
            Now
          </span>
        ) : null}
      </div>

      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Next month"
        onClick={() => go(shiftMonth(month, 1))}
        className="rounded-lg text-muted-foreground hover:text-foreground"
      >
        <IconChevronRight className="size-3.5" />
      </Button>
    </div>
  );
}
