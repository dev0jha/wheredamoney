import React from "react";
import { cn } from "@/lib/utils";

export interface CornerDecorationsProps {
  className?: string;
}

export const CornerDecorations: React.FC<CornerDecorationsProps> = ({ className }) => {
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      {/* Top Left */}
      <div className="absolute -top-1.5 -left-1.5 h-6 w-6 border-t-2 border-l-2 border-foreground/30 dark:border-zinc-500/50" />

      {/* Top Right */}
      <div className="absolute -top-1.5 -right-1.5 h-6 w-6 border-t-2 border-r-2 border-foreground/30 dark:border-zinc-500/50" />

      {/* Bottom Left */}
      <div className="absolute -bottom-1.5 -left-1.5 h-6 w-6 border-b-2 border-l-2 border-foreground/30 dark:border-zinc-500/50" />

      {/* Bottom Right */}
      <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 border-b-2 border-r-2 border-foreground/30 dark:border-zinc-500/50" />
    </div>
  );
};

export default CornerDecorations;
