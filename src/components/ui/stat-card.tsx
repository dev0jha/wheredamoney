"use client";

import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string;
  sparklineData?: number[];
  tone?: "default" | "success" | "destructive" | "info";
  color?: string;
  className?: string;
}

const toneColors = {
  default: "#3b82f6",
  success: "#10b981",
  destructive: "#ef4444",
  info: "#3b82f6",
};

// Natural wavy curve data modeled from reference image
const REFERENCE_WAVE_UP = [18, 38, 40, 26, 34, 42, 30, 26, 32, 44, 44, 32, 68, 76, 56, 74, 70, 62, 82, 95];
const REFERENCE_WAVE_DOWN = [45, 30, 34, 24, 38, 32, 26, 35, 28, 22, 30, 24, 36, 26, 32, 22, 26, 18, 22, 14];

function generateSparkline(data: number[], width = 130, height = 36) {
  if (!data || data.length === 0) {
    return { linePath: "", areaPath: "", lastPoint: null };
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max === min ? 1 : max - min;
  const padX = 2;
  const padY = 5;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const pts = data.map((v, i) => {
    const x = padX + (i / Math.max(1, data.length - 1)) * innerW;
    const norm = max === min ? 0.35 : (v - min) / range;
    const y = padY + innerH - norm * innerH;
    return { x, y };
  });

  if (pts.length === 1) {
    pts.push({ x: width - padX, y: pts[0].y });
  }

  let linePath = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * 0.18;
    const cp1y = p1.y + (p2.y - p0.y) * 0.18;
    const cp2x = p2.x - (p3.x - p1.x) * 0.18;
    const cp2y = p2.y - (p3.y - p1.y) * 0.18;

    linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  const last = pts[pts.length - 1];
  const first = pts[0];
  const areaPath = `${linePath} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`;

  return { linePath, areaPath, lastPoint: last };
}

function Sparkline({
  data,
  color,
  width = 130,
  height = 36,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const gradientId = useId();
  const { linePath, areaPath, lastPoint } = useMemo(
    () => generateSparkline(data, width, height),
    [data, width, height],
  );

  if (!linePath) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Subtle vertical gradient area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Smooth sparkline curve */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Glowing end dot */}
      {lastPoint ? (
        <>
          <circle cx={lastPoint.x} cy={lastPoint.y} r="5" fill={color} fillOpacity="0.25" />
          <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill={color} />
        </>
      ) : null}
    </svg>
  );
}

export function StatCard({
  label,
  value,
  sparklineData,
  tone = "default",
  color,
  className,
}: StatCardProps) {
  const strokeColor = color ?? toneColors[tone];

  const data = useMemo(() => {
    if (sparklineData && sparklineData.length > 0) return sparklineData;
    if (tone === "destructive") return REFERENCE_WAVE_DOWN;
    return REFERENCE_WAVE_UP;
  }, [sparklineData, tone]);

  return (
    // Outer Frame (Outer border & subtle dark frame enclosure)
    <div
      className={cn(
        "relative z-0 rounded-[22px] border border-border/60 bg-muted/30 p-[5px]",
        "dark:border-white/[0.08] dark:bg-black/40",
        className,
      )}
    >
      {/* Inner Card (Inner border & distinct elevated surface) */}
      <div
        className={cn(
          "flex flex-col justify-center rounded-[17px] border border-border/70 bg-card px-5 py-4 text-card-foreground shadow-2xs sm:px-6 sm:py-4.5",
          "dark:border-white/[0.08] dark:bg-[#141417]",
        )}
      >
        {/* Top: Label */}
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>

        {/* Row: Value on the Left, Sparkline on the Right */}
        <div className="mt-1.5 flex items-center justify-between gap-3 sm:mt-2">
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl shrink-0">
            {value}
          </p>

          <div className="h-9 w-28 shrink-0 overflow-visible sm:h-10 sm:w-36">
            <Sparkline data={data} color={strokeColor} width={130} height={36} />
          </div>
        </div>
      </div>
    </div>
  );
}
