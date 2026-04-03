import React from "react";
import { LayoutGrid, List, Inbox } from "lucide-react";
import { Proposal, ProposalStatus, STATUS_FILTER_OPTIONS } from "../../types/proposal";
import { ProposalCard, ProposalListRow, ProposalCardSkeleton, ProposalRowSkeleton } from "./ProposalCard";
import { cn } from "../../lib/utils";

interface ProposalListProps {
  proposals: Proposal[];
  isLoading: boolean;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
  statusFilter: ProposalStatus | "all";
  onStatusFilter: (s: ProposalStatus | "all") => void;
  onView: (id: string) => void;
  onQuickAction: (id: string, action: "accepted" | "rejected" | "revision_requested") => void;
}

export const ProposalList: React.FC<ProposalListProps> = ({
  proposals, isLoading, view, onViewChange, statusFilter, onStatusFilter, onView, onQuickAction,
}) => {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTER_OPTIONS.map((o) => (
            <button key={o.value} onClick={() => onStatusFilter(o.value)}
              className={cn("rounded-full border px-3 py-1 text-[11px] font-bold transition-all",
                statusFilter === o.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-textDisabled hover:border-accent/30 hover:text-textMuted")}>
              {o.label}
            </button>
          ))}
        </div>

        {/* Count + view toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-textMuted shrink-0">
            {isLoading ? "Loading…" : `${proposals.length} proposal${proposals.length !== 1 ? "s" : ""}`}
          </span>
          <div className="flex rounded-xl border border-border overflow-hidden">
            {(["grid","list"] as const).map((v) => (
              <button key={v} onClick={() => onViewChange(v)} id={`proposal-${v}-btn`}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors",
                  view === v ? "bg-accent text-white" : "text-textMuted hover:text-textPrimary")}>
                {v === "grid" ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid view */}
      {view === "grid" && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <ProposalCardSkeleton key={i} />)
            : proposals.length === 0
            ? <EmptyState />
            : proposals.map((p, i) => (
                <ProposalCard key={p.id} proposal={p} index={i} view="grid" onView={onView} onQuickAction={onQuickAction} />
              ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="overflow-hidden rounded-2xl border border-border" style={{ backgroundColor: "#111111" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Freelancer","Project","Budget","Timeline","Status","Received","Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-textDisabled">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <ProposalRowSkeleton key={i} />)
                : proposals.length === 0
                ? <tr><td colSpan={7} className="py-20 text-center"><EmptyState /></td></tr>
                : proposals.map((p, i) => (
                    <ProposalListRow key={p.id} proposal={p} index={i} onView={onView} onQuickAction={onQuickAction} />
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-24 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
      <Inbox className="h-7 w-7 text-accent" />
    </div>
    <div className="space-y-1">
      <h4 className="font-display text-base font-bold text-textPrimary">No proposals yet</h4>
      <p className="text-sm text-textMuted max-w-xs">Post a project to start receiving proposals from freelancers.</p>
    </div>
  </div>
);
