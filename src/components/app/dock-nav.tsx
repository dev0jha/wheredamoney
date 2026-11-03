"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  IconHome,
  IconReceipt,
  IconSettings,
  IconTags,
  IconTrendingUp,
} from "@tabler/icons-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { LiquidGlass } from "@/components/ui/liquid-glass";

const navItems = [
  { href: "/dashboard", label: "Home", icon: IconHome },
  { href: "/incomes", label: "Income", icon: IconTrendingUp },
  { href: "/expenses", label: "Expenses", icon: IconReceipt },
  { href: "/categories", label: "Categories", icon: IconTags },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

export function DockNav() {
  const pathname = usePathname();
  const router = useRouter();

  const getMatchedHref = (path: string) => {
    if (path === "/dashboard" || path === "/") return "/dashboard";
    const match = navItems.find(
      (item) => item.href !== "/dashboard" && (path === item.href || path.startsWith(`${item.href}/`))
    );
    return match ? match.href : "/dashboard";
  };

  const currentTab = getMatchedHref(pathname);
  const [selectedTab, setSelectedTab] = useState(currentTab);

  useEffect(() => {
    setSelectedTab(getMatchedHref(pathname));
  }, [pathname]);

  const handleSelect = (href: string) => {
    setSelectedTab(href);
    router.push(href);
  };

  return (
    <nav
      aria-label="Main Dock Navigation"
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-1rem)] sm:max-w-max select-none pointer-events-auto"
    >
      <div className="relative rounded-full shadow-lg shadow-black/5 border border-black/10 dark:border-white/15">
        {/* Liquid Glass Background — exactly as in Header */}
        <div className="absolute inset-0 -z-10 rounded-full overflow-hidden pointer-events-none">
          <LiquidGlass
            radius={999}
            bevelDepth={12}
            scale={40}
            aberration={4}
            frost={0}
            tint={0.12}
            className="size-full"
          />
        </div>

        {/* Dock Tabs Content */}
        <div className="p-1 sm:p-1.5">
          <Tabs
            variant="pill"
            icons="selected"
            value={selectedTab}
            onValueChange={handleSelect}
            className="w-auto"
          >
            <TabsList wrapperClassName="w-auto" className="bg-transparent p-0 gap-0.5 sm:gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <TabsTrigger
                    key={item.href}
                    value={item.href}
                    icon={<Icon className="size-3.5 sm:size-4 shrink-0" stroke={2.2} />}
                    indicatorClassName="bg-blue-600 dark:bg-blue-600 shadow-[0_2px_14px_rgba(37,99,235,0.45)] text-white"
                    className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors text-foreground/80 hover:text-foreground"
                  >
                    {item.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>
    </nav>
  );
}
