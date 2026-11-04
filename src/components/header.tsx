"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { ThemeToggle } from "@/components/theme-toggle";
import StripeButton from "@/components/pixel-perfect/stripe-button";

export const navLinks: { label: string; href: string }[] = [];

export function Header() {
	const scrolled = useScroll(10);

	return (
		<header
			className={cn(
				"sticky z-50 w-full flex justify-center px-4 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
				scrolled ? "top-3 sm:top-4" : "top-0"
			)}
		>
			<div
				className={cn(
					"relative w-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center justify-center",
					scrolled ? "max-w-3xl" : "max-w-4xl"
				)}
			>
				{/* Liquid Glass Background - active on scroll */}
				<div
					className={cn(
						"absolute inset-0 -z-10 rounded-full overflow-hidden transition-all duration-300 pointer-events-none",
						scrolled
							? "opacity-100 shadow-lg shadow-black/5 border border-black/10 dark:border-white/15"
							: "opacity-0 border-transparent shadow-none"
					)}
				>
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

				<nav
					className={cn(
						"flex h-14 w-full items-center justify-between font-[family-name:var(--font-geist-mono)] text-foreground transition-all duration-300",
						scrolled ? "px-5 sm:px-6" : "px-0 sm:px-4"
					)}
				>
					<Link
						className="flex items-center gap-2.5 rounded-md"
						href="/"
					>
						<Image
							src="/logo.png"
							alt="WhereDaMoney"
							width={38}
							height={38}
							className="size-9 object-contain"
							priority
						/>
						<span className="font-[family-name:var(--font-geist-mono)] text-base font-semibold tracking-tight text-foreground">
							WhereDaMoney
						</span>
					</Link>

					<div className="flex items-center gap-2.5">
						<ThemeToggle />
						<StripeButton href="/register" className="px-5 py-1.5 text-sm font-semibold">
							Sign Up
						</StripeButton>
					</div>
				</nav>
			</div>
		</header>
	);
}
