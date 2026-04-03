import React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "gold" | "danger" | "success";
export type ButtonSize    = "xs" | "sm" | "md" | "lg" | "icon";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Framer Motion / generic loading flag */
  loading?: boolean;
  /** Alias for loading — accepted from legacy AuthCard usage */
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:   "bg-accent text-white hover:bg-accent/90 shadow-glow",
  secondary: "bg-elevated border border-border text-textPrimary hover:bg-surface hover:border-accent/30",
  outline:   "border border-border bg-transparent hover:bg-surface text-textPrimary hover:border-accent/40",
  ghost:     "bg-transparent hover:bg-surface text-textMuted hover:text-textPrimary",
  gold:      "bg-gold text-base font-bold hover:bg-goldMuted shadow-goldGlow",
  danger:    "bg-error text-white hover:bg-error/80",
  success:   "bg-success/10 border border-success/30 text-success hover:bg-success/20",
};

const SIZES: Record<ButtonSize, string> = {
  xs:   "h-6 px-2.5 text-[10px] rounded-lg gap-1",
  sm:   "px-3 py-1.5 text-xs rounded-xl gap-1.5",
  md:   "px-5 py-2.5 text-sm rounded-xl gap-2",
  lg:   "px-8 py-3.5 text-base rounded-xl gap-2",
  icon: "h-9 w-9 rounded-xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, isLoading, leftIcon, rightIcon, className, children, disabled, ...rest }, ref) => {
    // Merge both loading aliases; strip isLoading so it never reaches the DOM
    const isSpinning = loading || isLoading;
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={disabled || isSpinning}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-accent/50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          VARIANTS[variant], SIZES[size], className
        )}
        {...rest}
      >
        {isSpinning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : leftIcon}
        {children && <span>{children}</span>}
        {!isSpinning && rightIcon}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
