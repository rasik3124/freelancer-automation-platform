import React from "react";
import { cn } from "../../lib/utils";

interface LoadingSpinnerProps {
  /** xs: 12px, sm: 16px, md: 24px, lg: 40px, xl: 64px */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Center in a flex container */
  centered?: boolean;
  /** Override color class */
  color?: string;
  className?: string;
  label?: string;
}

const SIZES = {
  xs: "h-3 w-3 border",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
  xl: "h-16 w-16 border-4",
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md", centered, color = "border-accent", className, label
}) => {
  const spinner = (
    <div className={cn("inline-flex flex-col items-center gap-3", centered && "w-full justify-center py-10")}>
      <div className={cn("rounded-full border-t-transparent animate-spin", SIZES[size], color, className)} />
      {label && <p className="text-xs text-textMuted animate-pulse">{label}</p>}
    </div>
  );
  return spinner;
};

/** Full-page overlay spinner */
export const PageSpinner: React.FC<{ label?: string }> = ({ label = "Loading…" }) => (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
    style={{ backgroundColor: "#0a0a0a" }}>
    <div className="relative flex h-16 w-16 items-center justify-center">
      <div className="absolute h-full w-full animate-spin rounded-full border-2 border-t-accent border-r-accent/30 border-b-transparent border-l-transparent" />
      <div className="h-3 w-3 rounded-full bg-accent animate-pulse" />
    </div>
    {label && <p className="text-sm text-textMuted animate-pulse">{label}</p>}
  </div>
);

/** Inline skeleton line (for text content placeholders) */
export const SkeletonLine: React.FC<{ width?: string; className?: string }> = ({ width = "w-full", className }) => (
  <div className={cn("h-3 animate-pulse rounded-full bg-elevated", width, className)} />
);

/** Skeleton block (for card/image placeholders) */
export const SkeletonBlock: React.FC<{ height?: string; className?: string }> = ({ height = "h-24", className }) => (
  <div className={cn("w-full animate-pulse rounded-xl bg-elevated", height, className)} />
);
