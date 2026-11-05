import type * as React from "react";
import { cn } from "@/lib/utils";

export interface FramedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  innerClassName?: string;
  children?: React.ReactNode;
}

/**
 * Reusable card with concentric layered outer and inner borders:
 * - Outer frame: rounded-[22px] with 5px track padding
 * - Inner surface: rounded-[17px] distinct surface layer
 * - Static elevation, z-index: 0, no hover interference
 */
export function FramedCard({
  className,
  innerClassName,
  children,
  ...props
}: FramedCardProps) {
  return (
    // Outer Frame (Outer border & subtle dark frame enclosure)
    <div
      className={cn(
        "relative z-0 rounded-[22px] border border-border/60 bg-muted/30 p-[5px]",
        "dark:border-white/[0.08] dark:bg-black/40",
        className,
      )}
      {...props}
    >
      {/* Inner Card (Inner border & distinct elevated surface) */}
      <div
        className={cn(
          "h-full w-full rounded-[17px] border border-border/70 bg-card p-5 text-card-foreground shadow-2xs sm:p-6",
          "dark:border-white/[0.08] dark:bg-[#141417]",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
