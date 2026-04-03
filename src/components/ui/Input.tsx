import React from "react";
import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
  /** Left icon — also accepted as `icon` for backwards compatibility */
  leftIcon?: React.ReactNode;
  icon?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, hint, leftIcon, icon, rightSlot, id, ...rest }, ref) => {
    const resolvedIcon = leftIcon ?? icon;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id}
            className={cn("text-[10px] font-black uppercase tracking-widest", error ? "text-error" : "text-textDisabled")}>
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {resolvedIcon && (
            <div className="pointer-events-none absolute left-3 text-textDisabled">{resolvedIcon}</div>
          )}
          <input
            ref={ref} id={id}
            className={cn(
              "w-full rounded-xl border bg-surface px-4 py-2.5 text-sm text-textPrimary placeholder-textDisabled",
              "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all",
              "disabled:cursor-not-allowed disabled:opacity-50",
              resolvedIcon && "pl-9",
              rightSlot && "pr-9",
              error ? "border-error focus:ring-error/40" : "border-border",
              className
            )}
            {...rest}
          />
          {rightSlot && <div className="absolute right-3">{rightSlot}</div>}
        </div>
        {error   && <p className="text-[11px] text-error">{error}</p>}
        {!error && hint && <p className="text-[11px] text-textDisabled">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ─── Textarea variant ─────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string; label?: string; hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, hint, id, ...rest }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className={cn("text-[10px] font-black uppercase tracking-widest", error ? "text-error" : "text-textDisabled")}>
          {label}
        </label>
      )}
      <textarea
        ref={ref} id={id}
        className={cn(
          "w-full resize-none rounded-xl border bg-surface px-4 py-3 text-sm text-textPrimary placeholder-textDisabled",
          "focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all",
          error ? "border-error focus:ring-error/40" : "border-border",
          className
        )}
        {...rest}
      />
      {error   && <p className="text-[11px] text-error">{error}</p>}
      {!error && hint && <p className="text-[11px] text-textDisabled">{hint}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
