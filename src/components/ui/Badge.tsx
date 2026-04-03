import React from "react";
import { cn } from "../../lib/utils";

export type BadgeVariant =
  | "default" | "accent" | "success" | "warning" | "error" | "info"
  | "draft" | "sent" | "paid" | "overdue"
  | "scheduled" | "completed" | "cancelled"
  | "pending" | "accepted" | "rejected" | "active" | "paused";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default:   "bg-elevated border-border text-textMuted",
  accent:    "bg-accent/10 border-accent/30 text-accent",
  success:   "bg-success/10 border-success/30 text-success",
  warning:   "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  error:     "bg-error/10 border-error/30 text-error",
  info:      "bg-blue-500/10 border-blue-500/30 text-blue-400",
  draft:     "bg-slate-500/10 border-slate-500/30 text-slate-400",
  sent:      "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  paid:      "bg-success/10 border-success/30 text-success",
  overdue:   "bg-error/10 border-error/30 text-error",
  scheduled: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  completed: "bg-success/10 border-success/30 text-success",
  cancelled: "bg-slate-500/10 border-slate-500/30 text-slate-400",
  pending:   "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  accepted:  "bg-success/10 border-success/30 text-success",
  rejected:  "bg-error/10 border-error/30 text-error",
  active:    "bg-success/10 border-success/30 text-success",
  paused:    "bg-slate-500/10 border-slate-500/30 text-slate-400",
};

const DOT_CLASSES: Partial<Record<BadgeVariant, string>> = {
  success:"bg-success", paid:"bg-success", completed:"bg-success", accepted:"bg-success", active:"bg-success",
  warning:"bg-yellow-400", sent:"bg-yellow-400", pending:"bg-yellow-400",
  error:"bg-error", overdue:"bg-error", rejected:"bg-error",
  info:"bg-blue-400", scheduled:"bg-blue-400",
  accent:"bg-accent",
  draft:"bg-slate-400", cancelled:"bg-slate-400", paused:"bg-slate-400",
  default:"bg-textDisabled",
};

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
  children: React.ReactNode;
}

const SIZE = { xs: "px-1.5 py-0 text-[9px]", sm: "px-2.5 py-0.5 text-[10px]", md: "px-3 py-1 text-xs" };

export const Badge: React.FC<BadgeProps> = ({ variant = "default", dot, size = "sm", className, children }) => (
  <span className={cn(
    "inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wider",
    SIZE[size], VARIANT_CLASSES[variant], className
  )}>
    {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASSES[variant] ?? "bg-textDisabled")} />}
    {children}
  </span>
);
