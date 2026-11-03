"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconReceipt,
  IconSettings,
  IconTags,
  IconTrendingUp,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { href: "/incomes", label: "Income", icon: IconTrendingUp },
  { href: "/expenses", label: "Expenses", icon: IconReceipt },
  { href: "/categories", label: "Categories", icon: IconTags },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1.5">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-[background,color,transform] duration-160 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]",
              active
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <item.icon
              className={cn(
                "size-4 shrink-0 transition-transform duration-160 group-hover:scale-110",
                active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/80 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold transition-[transform,color] duration-160 active:scale-95",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg transition-colors",
                  active ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-4.5" />
              </div>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
