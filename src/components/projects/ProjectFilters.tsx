import React, { useCallback, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  ProjectFiltersState,
  ProjectStatus,
  ProjectPriority,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from "../../types/project";
import { cn } from "../../lib/utils";

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProjectFiltersProps {
  filters: ProjectFiltersState;
  onChange: (f: ProjectFiltersState) => void;
  totalCount: number;
  filteredCount: number;
}

// ─── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all",         label: "All Statuses" },
  { value: "new_lead",    label: STATUS_LABELS.new_lead },
  { value: "contacted",   label: STATUS_LABELS.contacted },
  { value: "proposal_in", label: STATUS_LABELS.proposal_in },
  { value: "negotiation", label: STATUS_LABELS.negotiation },
  { value: "in_progress", label: STATUS_LABELS.in_progress },
  { value: "completed",   label: STATUS_LABELS.completed },
  { value: "cancelled",   label: STATUS_LABELS.cancelled },
];

const PRIORITY_OPTIONS: { value: ProjectPriority | "all"; label: string }[] = [
  { value: "all",    label: "All Priorities" },
  { value: "urgent", label: PRIORITY_LABELS.urgent },
  { value: "high",   label: PRIORITY_LABELS.high },
  { value: "medium", label: PRIORITY_LABELS.medium },
  { value: "low",    label: PRIORITY_LABELS.low },
];

// ─── ProjectFilters ────────────────────────────────────────────────────────────

/**
 * ProjectFilters — search bar + status/priority dropdowns.
 *
 * - Search is debounced 300 ms before calling onChange.
 * - Dropdowns update immediately.
 * - Shows "X of N projects" badge when any filter is active.
 */
export const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  filters,
  onChange,
  totalCount,
  filteredCount,
}) => {
  // Debounce ref for search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange({ ...filters, search: value });
      }, 300);
    },
    [filters, onChange]
  );

  // Cleanup timeout on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.priority !== "all";

  const clearAll = () =>
    onChange({ search: "", status: "all", priority: "all" });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
      {/* ── Search ── */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textDisabled pointer-events-none" />
        <input
          id="project-search"
          type="text"
          placeholder="Search projects…"
          defaultValue={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className={cn(
            "w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2.5 text-sm text-textPrimary placeholder-textDisabled",
            "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
          )}
        />
      </div>

      {/* ── Status dropdown ── */}
      <div className="relative flex items-center gap-1.5">
        <SlidersHorizontal className="h-3.5 w-3.5 text-textDisabled" />
        <select
          id="project-status-filter"
          value={filters.status}
          onChange={(e) =>
            onChange({ ...filters, status: e.target.value as ProjectStatus | "all" })
          }
          className={cn(
            "appearance-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-textPrimary",
            "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all cursor-pointer",
            "pr-8"
          )}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Priority dropdown ── */}
      <div className="relative">
        <select
          id="project-priority-filter"
          value={filters.priority}
          onChange={(e) =>
            onChange({ ...filters, priority: e.target.value as ProjectPriority | "all" })
          }
          className={cn(
            "appearance-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-textPrimary",
            "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all cursor-pointer",
            "pr-8"
          )}
        >
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Result count + clear ── */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-textMuted shrink-0">
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-accent font-bold">
            {filteredCount} / {totalCount}
          </span>
          <button
            onClick={clearAll}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-textDisabled hover:text-error hover:bg-error/10 transition-colors"
            aria-label="Clear all filters"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
