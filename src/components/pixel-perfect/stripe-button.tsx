import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StripeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
}

const StripeButton = React.forwardRef<HTMLButtonElement, StripeButtonProps>(
  ({ className, children, href, disabled, ...props }, ref) => {
    const commonClass = cn(
      "flex flex-row justify-center items-center px-4 py-2.5 gap-2 rounded-lg cursor-pointer font-medium transition-all active:scale-[0.98] text-white text-sm select-none hover:brightness-110",
      disabled && "opacity-75 cursor-not-allowed pointer-events-none active:scale-100",
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
        disabled={disabled}
        {...props}
      >
        {children || "Stripe Button"}
      </button>
    );
  }
);

StripeButton.displayName = "StripeButton";

export default StripeButton;
