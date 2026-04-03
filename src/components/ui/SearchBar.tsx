import React, { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../lib/utils";

interface SearchBarProps {
  value?: string;
  onChange?: (val: string) => void;
  /** Controlled mode via onDebouncedChange — fires after delay */
  onDebouncedChange?: (val: string) => void;
  debounceMs?: number;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  autoFocus?: boolean;
  id?: string;
}

const SIZES = {
  sm: "h-8  pl-8  pr-8  text-xs",
  md: "h-9  pl-9  pr-9  text-sm",
  lg: "h-11 pl-10 pr-10 text-sm",
};
const ICON_SIZES = { sm: "h-3.5 w-3.5 left-2.5", md: "h-4 w-4 left-3", lg: "h-4 w-4 left-3" };

export const SearchBar: React.FC<SearchBarProps> = ({
  value: controlledValue, onChange, onDebouncedChange, debounceMs = 300,
  placeholder = "Search…", className, size = "md", autoFocus, id,
}) => {
  const [internal, setInternal] = useState(controlledValue ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync if controlled
  useEffect(() => { if (controlledValue !== undefined) setInternal(controlledValue); }, [controlledValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternal(val);
    onChange?.(val);
    if (onDebouncedChange) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => onDebouncedChange(val), debounceMs);
    }
  };

  const clear = () => {
    setInternal(""); onChange?.(""); onDebouncedChange?.("");
  };

  return (
    <div className={cn("relative", className)}>
      <Search className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-textDisabled", ICON_SIZES[size])} />
      <input
        id={id} value={internal} onChange={handleChange} autoFocus={autoFocus}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border border-border bg-surface text-textPrimary placeholder-textDisabled",
          "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/40 transition-all",
          SIZES[size]
        )}
      />
      {internal && (
        <button onClick={clear} className={cn("absolute top-1/2 -translate-y-1/2 right-2.5 text-textDisabled hover:text-textPrimary transition-colors")}>
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
