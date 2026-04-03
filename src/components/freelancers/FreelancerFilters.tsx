import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  FreelancerFiltersState, ExperienceLevel, AvailabilityType,
  EXPERIENCE_LABELS, AVAILABILITY_LABELS, ROLE_OPTIONS, RATING_OPTIONS,
} from "../../types/freelancer";
import { cn } from "../../lib/utils";

interface FreelancerFiltersProps {
  filters: FreelancerFiltersState;
  onChange: (f: FreelancerFiltersState) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <p className="text-[10px] font-black uppercase tracking-widest text-textDisabled mb-2">{label}</p>
);

const RadioGroup = <T extends string>({
  name, options, value, onChange,
}: { name: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) => (
  <div className="space-y-1.5">
    {options.map((o) => (
      <label key={o.value} className="flex items-center gap-2.5 cursor-pointer group">
        <input type="radio" name={name} value={o.value} checked={value === o.value}
          onChange={() => onChange(o.value)}
          className="accent-accent w-3.5 h-3.5 cursor-pointer" />
        <span className={cn("text-xs transition-colors", value === o.value ? "text-textPrimary font-bold" : "text-textMuted group-hover:text-textPrimary")}>{o.label}</span>
      </label>
    ))}
  </div>
);

export const FreelancerFilters: React.FC<FreelancerFiltersProps> = ({ filters, onChange, isOpen, onToggle }) => {
  const set = (key: keyof FreelancerFiltersState, value: unknown) =>
    onChange({ ...filters, [key]: value });

  const toggleRole = (r: string) => {
    const has = filters.roles.includes(r);
    set("roles", has ? filters.roles.filter((x) => x !== r) : [...filters.roles, r]);
  };

  const hasActiveFilters = filters.roles.length > 0 || filters.experience !== "all" ||
    filters.availability !== "all" || filters.minRating > 0 ||
    filters.minRate > 0 || filters.maxRate < 500 || filters.skills.length > 0;

  const clearAll = () => onChange({ ...filters, roles: [], experience: "all", availability: "all", minRating: 0, minRate: 0, maxRate: 500, skills: [] });

  const content = (
    <div className="space-y-6">
      {/* Clear button */}
      {hasActiveFilters && (
        <button onClick={clearAll} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-error hover:bg-error/10 transition-colors border border-error/20 w-full justify-center">
          <X className="h-3 w-3" /> Clear All Filters
        </button>
      )}

      {/* Role checkboxes */}
      <div>
        <SectionLabel label="Role" />
        <div className="space-y-1.5">
          {ROLE_OPTIONS.map((r) => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" checked={filters.roles.includes(r)} onChange={() => toggleRole(r)}
                className="accent-accent w-3.5 h-3.5 cursor-pointer" />
              <span className={cn("text-xs transition-colors", filters.roles.includes(r) ? "text-textPrimary font-bold" : "text-textMuted group-hover:text-textPrimary")}>{r}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div>
        <SectionLabel label="Experience Level" />
        <RadioGroup<ExperienceLevel | "all">
          name="experience"
          options={(["all","beginner","intermediate","experienced","expert"] as (ExperienceLevel|"all")[]).map(v=>({value:v,label:EXPERIENCE_LABELS[v]}))}
          value={filters.experience}
          onChange={(v) => set("experience", v)}
        />
      </div>

      {/* Hourly Rate */}
      <div>
        <SectionLabel label="Hourly Rate ($/hr)" />
        <div className="flex items-center gap-2">
          <input type="number" min={0} max={filters.maxRate} value={filters.minRate}
            onChange={(e) => set("minRate", Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-textPrimary focus:outline-none focus:ring-1 focus:ring-accent/50" placeholder="Min" />
          <span className="text-textDisabled text-xs">–</span>
          <input type="number" min={filters.minRate} max={500} value={filters.maxRate}
            onChange={(e) => set("maxRate", Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-textPrimary focus:outline-none focus:ring-1 focus:ring-accent/50" placeholder="Max" />
        </div>
      </div>

      {/* Availability */}
      <div>
        <SectionLabel label="Availability" />
        <RadioGroup<AvailabilityType | "all">
          name="availability"
          options={(["all","full-time","part-time","small-projects"] as (AvailabilityType|"all")[]).map(v=>({value:v,label:AVAILABILITY_LABELS[v]}))}
          value={filters.availability}
          onChange={(v) => set("availability", v)}
        />
      </div>

      {/* Min rating */}
      <div>
        <SectionLabel label="Minimum Rating" />
        <RadioGroup<string>
          name="minRating"
          options={RATING_OPTIONS.map(o=>({value:String(o.value),label:o.label}))}
          value={String(filters.minRating)}
          onChange={(v) => set("minRating", Number(v))}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-4 rounded-2xl border border-border p-5 space-y-1" style={{ backgroundColor: "#111111" }}>
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-4 w-4 text-accent" />
            <h4 className="text-sm font-bold text-textPrimary">Filters</h4>
          </div>
          {content}
        </div>
      </aside>

      {/* ── Mobile: Collapsible drawer ── */}
      <div className="lg:hidden">
        <button onClick={onToggle} className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors">
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {hasActiveFilters && <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-black text-white">{filters.roles.length + (filters.experience !== "all" ? 1 : 0)}</span>}
          {isOpen ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div key="mob-filters" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3 rounded-2xl border border-border p-5" style={{ backgroundColor: "#111111" }}>
              {content}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
