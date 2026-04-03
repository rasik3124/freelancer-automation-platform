import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

export interface FilterOption<V extends string = string> {
  value: V; label: string; icon?: React.ReactNode; count?: number;
}

interface FilterDropdownProps<V extends string = string> {
  options: FilterOption<V>[];
  value: V | V[];
  onChange: (val: V | V[]) => void;
  multiple?: boolean;
  placeholder?: string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export const FilterDropdown = <V extends string = string>({
  options, value, onChange, multiple, placeholder = "Filter…", label, className, size = "md"
}: FilterDropdownProps<V>) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const isSelected = (v: V) => Array.isArray(value) ? value.includes(v) : value === v;

  const toggle = (v: V) => {
    if (multiple && Array.isArray(value)) {
      onChange(isSelected(v) ? value.filter(x => x !== v) as V[] : [...value, v] as V[]);
    } else {
      onChange(v); setOpen(false);
    }
  };

  const displayLabel = (() => {
    if (Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      if (value.length === 1) return options.find(o => o.value === value[0])?.label ?? placeholder;
      return `${value.length} selected`;
    }
    return options.find(o => o.value === value)?.label ?? placeholder;
  })();

  const smH = size === "sm" ? "h-8 text-xs" : "h-9 text-sm";

  return (
    <div ref={ref} className={cn("relative", className)}>
      {label && <p className="text-[10px] font-black uppercase tracking-widest text-textDisabled mb-1.5">{label}</p>}
      <button onClick={() => setOpen(v => !v)}
        className={cn("flex items-center gap-2 rounded-xl border border-border bg-surface px-3 font-bold text-textMuted hover:border-accent/30 hover:text-textPrimary transition-all", smH)}>
        <span className="truncate max-w-[120px]">{displayLabel}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }}
            className="absolute z-50 top-full mt-1.5 left-0 min-w-[160px] rounded-2xl border border-border shadow-xl overflow-hidden"
            style={{ backgroundColor: "#0d0d0d" }}>
            {options.map((o) => (
              <button key={o.value} onClick={() => toggle(o.value)}
                className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                  isSelected(o.value)
                    ? "bg-accent/10 text-accent"
                    : "text-textMuted hover:bg-elevated hover:text-textPrimary")}>
                {o.icon && <span className="shrink-0">{o.icon}</span>}
                <span className="flex-1">{o.label}</span>
                {o.count != null && <span className="text-[10px] text-textDisabled">{o.count}</span>}
                {isSelected(o.value) && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
