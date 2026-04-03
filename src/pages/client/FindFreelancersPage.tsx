import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Search, X } from "lucide-react";
import {
  Freelancer, FreelancerFiltersState, DEFAULT_FILTERS, SortOption,
} from "../../types/freelancer";
import { FreelancerFilters } from "../../components/freelancers/FreelancerFilters";
import { FreelancerGrid } from "../../components/freelancers/FreelancerGrid";
import { FreelancerProfileModal } from "../../components/freelancers/FreelancerProfileModal";
import { SendInquiryForm } from "../../components/freelancers/SendInquiryForm";
import api from "../../services/api";

// ─── FindFreelancersPage ──────────────────────────────────────────────────────

/**
 * FindFreelancersPage — /dashboard/client/freelancers
 *
 * State managed here:
 *   filters        — FreelancerFiltersState (includes sort)
 *   freelancers    — fetched from GET /api/freelancers with filter params
 *   page           — for "Load More" pagination (9 per page)
 *   selectedId     — opens FreelancerProfileModal
 *   inquireId      — opens standalone SendInquiryForm modal
 *   filtersOpen    — mobile filter drawer toggle
 *
 * Fetch is debounced on filter changes (300ms) to avoid rapid API calls.
 */
export const FindFreelancersPage: React.FC = () => {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FreelancerFiltersState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inquireTarget, setInquireTarget] = useState<{ id: string; name: string } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Build query params ────────────────────────────────────────────────────
  const buildParams = (f: FreelancerFiltersState) => {
    const p: Record<string, string> = {};
    if (f.q)                    p.q            = f.q;
    if (f.roles.length)         p.role         = f.roles.join(",");
    if (f.experience !== "all") p.experience   = f.experience;
    if (f.availability !== "all") p.availability = f.availability;
    if (f.minRate > 0)          p.minRate      = String(f.minRate);
    if (f.maxRate < 500)        p.maxRate      = String(f.maxRate);
    if (f.minRating > 0)        p.minRating    = String(f.minRating);
    if (f.skills.length)        p.skills       = f.skills.join(",");
    p.sort = f.sort;
    return p;
  };

  // ── Fetch with debounce ───────────────────────────────────────────────────
  const fetchFreelancers = useCallback((f: FreelancerFiltersState) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get<{ data: Freelancer[] }>("/api/freelancers", { params: buildParams(f) });
        setFreelancers(res.data.data);
        setPage(1);
      } catch {
        // silent — production would show toast
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, []);

  // ── Re-fetch whenever filters change ──────────────────────────────────────
  useEffect(() => { fetchFreelancers(filters); }, [filters, fetchFreelancers]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInquire = (id: string) => {
    const f = freelancers.find((fr) => fr.id === id);
    if (f) setInquireTarget({ id, name: f.name });
  };

  const handleSortChange = (sort: SortOption) =>
    setFilters((prev) => ({ ...prev, sort }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="font-display text-2xl font-bold text-textPrimary">Find Freelancers</h2>
          <p className="text-sm text-textMuted">Browse and connect with top-rated professionals.</p>
        </div>

        {/* Header search bar */}
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textDisabled pointer-events-none" />
          <input
            id="freelancer-search" type="text" placeholder="Search name, role, skill…"
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
            className="w-full rounded-xl border border-border bg-surface pl-9 pr-9 py-2.5 text-sm text-textPrimary placeholder-textDisabled focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all"
          />
          {filters.q && (
            <button onClick={() => setFilters((prev) => ({ ...prev, q: "" }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-textDisabled hover:text-textPrimary">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Main layout: sidebar + grid */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Filters (desktop sidebar / mobile drawer) */}
        <FreelancerFilters
          filters={filters}
          onChange={(f) => setFilters(f)}
          isOpen={filtersOpen}
          onToggle={() => setFiltersOpen((v) => !v)}
        />

        {/* Freelancer grid */}
        <FreelancerGrid
          freelancers={freelancers}
          isLoading={isLoading}
          sort={filters.sort}
          onSortChange={handleSortChange}
          onView={setSelectedId}
          onInquire={handleInquire}
          page={page}
          onLoadMore={() => setPage((p) => p + 1)}
        />
      </div>

      {/* Profile modal (drawer) */}
      {selectedId && (
        <FreelancerProfileModal
          freelancerId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}

      {/* Standalone inquiry modal */}
      {inquireTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setInquireTarget(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border p-6 shadow-2xl" style={{ backgroundColor: "#0d0d0d" }}>
            <SendInquiryForm
              freelancerId={inquireTarget.id}
              freelancerName={inquireTarget.name}
              onClose={() => setInquireTarget(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
