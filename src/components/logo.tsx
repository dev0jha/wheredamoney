import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
  iconOnly?: boolean;
}

export function Logo({ className, href, iconOnly = false }: LogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt="WhereDaMoney"
        width={32}
        height={32}
        className="size-7 object-contain"
        priority
      />
      {!iconOnly && (
        <span className="font-[family-name:var(--font-geist-mono)] text-sm font-semibold tracking-tight text-foreground">
          WhereDaMoney
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center transition-opacity hover:opacity-85">
        {content}
      </Link>
    );
  }

  return content;
}

export const LogoIcon = ({ className }: { className?: string }) => (
  <Image
    src="/logo.png"
    alt="WhereDaMoney"
    width={32}
    height={32}
    className={cn("size-7 object-contain", className)}
    priority
  />
);
