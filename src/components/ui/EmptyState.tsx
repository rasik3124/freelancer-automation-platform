import React from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { wrap: "py-10", icon: "h-10 w-10", iconInner: "h-5 w-5", title: "text-sm", desc: "text-xs" },
  md: { wrap: "py-16", icon: "h-14 w-14", iconInner: "h-7 w-7", title: "text-base", desc: "text-sm" },
  lg: { wrap: "py-24", icon: "h-20 w-20", iconInner: "h-10 w-10", title: "text-lg", desc: "text-sm" },
};

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className, size = "md" }) => {
  const s = SIZES[size];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-col items-center justify-center gap-4 text-center", s.wrap, className)}
    >
      <div className={cn("flex items-center justify-center rounded-2xl bg-accent/10 text-accent", s.icon)}>
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{className?: string}>, { className: s.iconInner }) : icon}
      </div>
      <div className="space-y-1 max-w-xs">
        <h4 className={cn("font-display font-bold text-textPrimary", s.title)}>{title}</h4>
        {description && <p className={cn("text-textMuted", s.desc)}>{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </motion.div>
  );
};

/** Bordered empty state (for use inside lists/tables) */
export const EmptyStateBordered: React.FC<EmptyStateProps> = (props) => (
  <div className="rounded-2xl border border-dashed border-border">
    <EmptyState {...props} />
  </div>
);
