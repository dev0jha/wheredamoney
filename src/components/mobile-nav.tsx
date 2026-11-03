"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Portal, PortalBackdrop } from "@/components/portal";
import { navLinks } from "@/components/header";
import { IconMenu2, IconX } from "@tabler/icons-react";

export function MobileNav() {
	const [open, setOpen] = React.useState(false);

	return (
		<div className="md:hidden">
			<Button
				aria-controls="mobile-menu"
				aria-expanded={open}
				aria-label="Toggle menu"
				className="text-[#282525] md:hidden"
				onClick={() => setOpen(!open)}
				size="icon"
				variant="outline"
			>
				{open ? (
					<IconX className="size-4.5" />
				) : (
					<IconMenu2 className="size-4.5" />
				)}
			</Button>
			{open && (
				<Portal className="top-14" id="mobile-menu">
					<PortalBackdrop />
					<div
						className={cn(
							"data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in",
							"size-full p-4"
						)}
						data-slot={open ? "open" : "closed"}
					>
						<div className="grid gap-y-1">
							{navLinks.map((link) => (
								<Link
									key={link.label}
									href={link.href}
									onClick={() => setOpen(false)}
									className="flex items-center rounded-lg px-3 py-2.5 text-base font-medium text-[#282525] transition-colors hover:bg-muted hover:text-foreground"
								>
									{link.label}
								</Link>
							))}
						</div>
						<div className="mt-8 flex flex-col gap-2">
							<Link
								href="/login"
								onClick={() => setOpen(false)}
								className={cn(
									buttonVariants({ variant: "outline" }),
									"w-full justify-center rounded-md"
								)}
							>
								Sign In
							</Link>
							<Link
								href="/register"
								onClick={() => setOpen(false)}
								className={cn(
									buttonVariants(),
									"w-full justify-center rounded-md bg-[#4F39F6] hover:bg-[#4F39F6]/90 border-[#4F39F6] text-white"
								)}
							>
								Get Started
							</Link>
						</div>
					</div>
				</Portal>
			)}
		</div>
	);
}
