"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useScroll } from "@/hooks/use-scroll";
import { buttonVariants } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";

export const navLinks = [
	{
		label: "Features",
		href: "#features",
	},
	{
		label: "Pricing",
		href: "#pricing",
	},
	{
		label: "About",
		href: "#about",
	},
];

export function Header() {
	const scrolled = useScroll(10);

	return (
		<header
			className={cn(
				"sticky top-0 z-50 w-full transition-[background-color,box-shadow] duration-200",
				{
					"bg-background/95 shadow-xs backdrop-blur-sm supports-backdrop-filter:bg-background/50":
						scrolled,
				}
			)}
		>
			<nav className="mx-auto grid h-14 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4 font-[family-name:var(--font-geist-mono)] text-[#282525]">
				<Link
					className="flex items-center gap-2 justify-self-start rounded-md transition-opacity hover:opacity-80"
					href="/"
				>
					<Logo className="h-4" />
				</Link>

				<div className="hidden items-center gap-7 md:flex">
					{navLinks.map((link) => (
						<Link
							key={link.label}
							href={link.href}
							className="text-sm font-semibold uppercase tracking-[0.08em] text-[#282525] transition-colors hover:text-foreground"
						>
							{link.label}
						</Link>
					))}
				</div>

				<div className="flex items-center justify-self-end">
					<div className="hidden items-center gap-3 md:flex">
						<Link
							href="/login"
							className={cn(
								buttonVariants({
									variant: "outline",
									size: "sm",
								}),
								"rounded-md px-4 text-[#282525]"
							)}
						>
							Sign In
						</Link>
						<Link
							href="/register"
							className={cn(
								buttonVariants({ size: "sm" }),
								"rounded-md px-5 bg-[#4F39F6] hover:bg-[#4F39F6]/90 border-[#4F39F6] text-white"
							)}
						>
							Get Started
						</Link>
					</div>
					<MobileNav />
				</div>
			</nav>
		</header>
	);
}
