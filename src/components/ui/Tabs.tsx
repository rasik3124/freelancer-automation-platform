import React, { useState } from "react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

interface Tab { key: string; label: string; icon?: React.ReactNode; badge?: number; }

interface TabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: "underline" | "pill" | "card";
  size?: "sm" | "md";
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs, activeKey, onChange, variant = "underline", size = "md", className
}) => {
  const smText = size === "sm" ? "text-xs" : "text-sm";

  if (variant === "pill") {
    return (
      <div className={cn("flex gap-1.5", className)}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => onChange(t.key)}
            className={cn("relative flex items-center gap-2 rounded-xl px-4 py-2 font-bold transition-all", smText,
              activeKey === t.key ? "bg-accent/10 text-accent" : "text-textMuted hover:text-textPrimary hover:bg-elevated")}>
            {t.icon}{t.label}
            {t.badge != null && t.badge > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-black text-white">{t.badge > 9 ? "9+" : t.badge}</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cn("flex overflow-hidden rounded-xl border border-border", className)}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => onChange(t.key)}
            className={cn("flex flex-1 items-center justify-center gap-2 px-4 py-2.5 font-bold transition-colors border-r border-border last:border-r-0", smText,
              activeKey === t.key ? "bg-accent text-white" : "text-textMuted hover:text-textPrimary")}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
    );
  }

  // Underline variant (default)
  return (
    <div className={cn("flex border-b border-border/60", className)}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={cn("relative flex items-center gap-2 px-4 pb-3 pt-1 font-bold transition-colors", smText,
            activeKey === t.key ? "text-textPrimary" : "text-textMuted hover:text-textPrimary")}>
          {t.icon}{t.label}
          {t.badge != null && t.badge > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-black text-white">{t.badge > 9 ? "9+" : t.badge}</span>
          )}
          {activeKey === t.key && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-accent" />
          )}
        </button>
      ))}
    </div>
  );
};
