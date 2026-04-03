import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Proposal, ProposalStatus, STATUS_FILTER_OPTIONS } from "../../types/proposal";
import { ProposalList } from "../../components/proposals/ProposalList";
import { ProposalDetailsModal } from "../../components/proposals/ProposalDetailsModal";
import api from "../../services/api";

// ─── ProposalsPage ────────────────────────────────────────────────────────────

/**
 * ProposalsPage — /dashboard/client/proposals
 *
 * State:
 *   proposals      — from GET /api/proposals
 *   statusFilter   — pill filter (all | pending | accepted | rejected | revision_requested)
 *   view           — grid | list
 *   selectedId     — opens ProposalDetailsModal
 */
export const ProposalsPage: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "all">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProposals = useCallback(async () => {
    setIsLoading(true); setFetchError(null);
    try {
      const res = await api.get<{ data: Proposal[] }>("/api/proposals");
      setProposals(res.data.data);
    } catch {
      setFetchError("Could not load proposals. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  // ── Client-side filter ─────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    statusFilter === "all" ? proposals : proposals.filter((p) => p.status === statusFilter),
    [proposals, statusFilter]
  );

  // ── Update single proposal in-place ───────────────────────────────────────
  const handleUpdated = (updated: Proposal) =>
    setProposals((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  // ── Quick actions from card (no modal) ────────────────────────────────────
  const handleQuickAction = async (id: string, action: "accepted" | "rejected" | "revision_requested") => {
    try {
      const res = await api.put<{ data: Proposal }>(`/api/proposals/${id}`, { status: action });
      handleUpdated(res.data.data);
    } catch {
      // silent — production would show toast
    }
  };

  // ── Stats bar ──────────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    total:    proposals.length,
    pending:  proposals.filter((p) => p.status === "pending").length,
    accepted: proposals.filter((p) => p.status === "accepted").length,
    rejected: proposals.filter((p) => p.status === "rejected").length,
  }), [proposals]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="font-display text-2xl font-bold text-textPrimary">Proposals Received</h2>
          <p className="text-sm text-textMuted">Review and respond to freelancer proposals for your projects.</p>
        </div>

        {/* Stats strip */}
        {!isLoading && (
          <div className="flex items-center gap-4 text-xs">
            <span className="text-textDisabled">{counts.total} total</span>
            <span className="font-bold text-yellow-400">{counts.pending} pending</span>
            <span className="font-bold text-success">{counts.accepted} accepted</span>
            <span className="font-bold text-error">{counts.rejected} rejected</span>
          </div>
        )}
      </motion.div>

      {/* Fetch error */}
      {fetchError && (
        <div className="flex items-center justify-between rounded-2xl border border-error/20 bg-error/5 px-5 py-4">
          <p className="text-sm text-error">{fetchError}</p>
          <button onClick={fetchProposals} className="rounded-lg bg-error/10 px-3 py-1.5 text-xs font-bold text-error hover:bg-error/20 transition-colors">Retry</button>
        </div>
      )}

      {/* Proposal list */}
      <ProposalList
        proposals={filtered}
        isLoading={isLoading}
        view={view}
        onViewChange={setView}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
        onView={setSelectedId}
        onQuickAction={handleQuickAction}
      />

      {/* Details drawer */}
      {selectedId && (
        <ProposalDetailsModal
          proposalId={selectedId}
          onClose={() => setSelectedId(null)}
          onProposalUpdated={handleUpdated}
        />
      )}
    </div>
  );
};
