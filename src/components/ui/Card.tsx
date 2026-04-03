import React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "../../lib/utils";

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  /** Extra padding preset: "none" | "sm" | "md" (default) | "lg" */
  padding?: "none" | "sm" | "md" | "lg";
  /** Remove hover animation */
  static?: boolean;
  /** Show glowing accent border on hover */
  glow?: boolean;
}

const PADDING = { none: "", sm: "p-4", md: "p-5", lg: "p-7" };

export const Card: React.FC<CardProps> = ({
  children, className, padding = "md", static: isStatic, glow, ...rest
}) => (
  <motion.div
    whileHover={isStatic ? undefined : { y: -2, scale: 1.002 }}
    transition={{ type: "spring", stiffness: 400, damping: 30 }}
    className={cn(
      "rounded-2xl border border-border shadow-card transition-colors duration-200",
      glow && "hover:border-accent/30 hover:shadow-accent/5 hover:shadow-lg",
      !glow && "hover:border-border/80",
      PADDING[padding],
      className
    )}
    style={{ backgroundColor: "#111111", ...rest.style }}
    {...rest}
  >
    {children}
  </motion.div>
);

/** Simple non-animated section divider inside a Card */
export const CardSection: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("border-t border-border/60 pt-4 mt-4", className)}>{children}</div>
);
