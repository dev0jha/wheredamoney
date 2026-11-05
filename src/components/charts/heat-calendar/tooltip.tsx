"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NumberTicker } from "@/components/motion/number-ticker";
import { cn } from "@/lib/utils";
import { useHeatCalendar } from "./context";
import { fmtDay, fmtRange } from "./utils";

export function HeatCalendarTooltip({
  children,
  className,
}: {
  children?: ReactNode | ((data: NonNullable<ReturnType<typeof useHeatCalendar>["tooltip"]>) => ReactNode);
  className?: string;
}) {
  const { gridRef, tip, tooltip, unit } = useHeatCalendar();
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!tip || !gridRef.current) {
      setPos(null);
      return;
    }

    const updatePos = () => {
      const el = gridRef.current?.querySelector<HTMLElement>(`[data-heat-cell="${tip.w}-${tip.d}"]`);
      if (!el) {
        setPos(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setPos({
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    };

    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [tip, gridRef]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  // Calculate alignment relative to screen width and height
  let transformX = "-50%";
  let arrowLeft = "50%";
  const isTopFlipped = pos ? pos.y < 120 : false;

  if (pos && typeof window !== "undefined") {
    if (pos.x > window.innerWidth - 130) {
      transformX = "-88%";
      arrowLeft = "88%";
    } else if (pos.x < 130) {
      transformX = "-12%";
      arrowLeft = "12%";
    }
  }

  return createPortal(
    <AnimatePresence>
      {tooltip && pos ? (
        <motion.div
          key={`${tip?.w}-${tip?.d}`}
          initial={{ opacity: 0, scale: 0.94, y: isTopFlipped ? -4 : 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: isTopFlipped ? -2 : 2 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={{
            position: "fixed",
            left: pos.x,
            top: isTopFlipped ? pos.y + 24 : pos.y - 8,
            transform: `translate(${transformX}, ${isTopFlipped ? "0%" : "-100%"})`,
          }}
          className={cn(
            "pointer-events-none fixed z-[9999] rounded-xl border border-border bg-popover/95 px-3 py-2 text-popover-foreground shadow-2xl backdrop-blur-md",
            className,
          )}
        >
          {typeof children === "function" ? (
            children(tooltip)
          ) : (
            children ?? (
              <div className="flex flex-col gap-0.5 text-xs">
                <span className="inline-flex items-center gap-1 font-mono tabular-nums font-semibold text-foreground">
                  <NumberTicker
                    value={tooltip.days > 1 ? tooltip.total : tooltip.count}
                    duration={0.35}
                    startOnView={false}
                  />{" "}
                  {unit}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {tooltip.days > 1 && tooltip.startDate && tooltip.endDate
                    ? `${fmtRange.format(tooltip.startDate)} – ${fmtRange.format(tooltip.endDate)} (${tooltip.days} days)`
                    : fmtDay.format(tooltip.date)}
                </span>
              </div>
            )
          )}
          {/* Arrow */}
          <div
            className={cn(
              "absolute size-2 rotate-45 border-border bg-popover",
              isTopFlipped
                ? "-top-1 border-t border-l"
                : "-bottom-1 border-b border-r"
            )}
            style={{
              left: arrowLeft,
              transform: "translateX(-50%) rotate(45deg)",
            }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
