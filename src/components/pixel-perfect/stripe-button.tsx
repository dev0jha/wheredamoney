import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StripeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
}

const StripeButton = React.forwardRef<HTMLButtonElement, StripeButtonProps>(
  ({ className, children, href, ...props }, ref) => {
    const commonClass = cn(
      "flex flex-row justify-center items-center px-4 py-2 gap-2 rounded-lg cursor-pointer font-medium transition-all active:scale-95 text-white text-sm select-none hover:brightness-105",
      className
    );
    const commonStyle: React.CSSProperties = {
      background: "#1d4ed8", // blue-700
      boxShadow: "inset 0px 2px 0px #3b82f6", // blue-500 highlight
    };

    if (href) {
      return (
        <Link href={href} className={commonClass} style={commonStyle}>
          {children || "Stripe Button"}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        className={commonClass}
        style={commonStyle}
        {...props}
      >
        {children || "Stripe Button"}
      </button>
    );
  }
);

StripeButton.displayName = "StripeButton";

export default StripeButton;
