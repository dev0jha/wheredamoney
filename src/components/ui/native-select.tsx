import type * as React from "react";

import { cn } from "@/lib/utils";

export type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function NativeSelect({ className, children, ...props }: NativeSelectProps): React.ReactElement {
  return (
    <select
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-input bg-background px-[calc(--spacing(3)-1px)] text-base text-foreground shadow-xs/5 outline-none ring-ring/24 transition-shadow focus-visible:border-ring focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-64 sm:h-8 sm:text-sm dark:bg-input/32",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
