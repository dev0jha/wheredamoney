import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function BackBtn({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-foreground/40 hover:text-foreground w-fit",
        className
      )}
    >
      <IconArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
      <span>Back to Home</span>
    </Link>
  );
}
