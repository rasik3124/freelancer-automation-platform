import React from "react";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, RefreshCw, ChevronRight, Calendar, DollarSign, Clock } from "lucide-react";
import { Proposal, STATUS_META, formatBudget, relativeTime } from "../../types/proposal";
import { cn } from "../../lib/utils";

// ─── Avatar gradients ─────────────────────────────────────────────────────────
const GRADIENTS = ["from-accent to-violet-600","from-blue-500 to-cyan-400","from-emerald-500 to-teal-400","from-orange-500 to-pink-500"];
const grad = (id: string) => GRADIENTS[id.charCodeAt(id.length-1) % GRADIENTS.length];

// ─── Status badge ─────────────────────────────────────────────────────────────
export const StatusBadge: React.FC<{ status: Proposal["status"] }> = ({ status }) => {
  const m = STATUS_META[status];
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", m.bg, m.text, m.border)}>
      {m.label}
    </span>
  );
};

// ─── ProposalCard ─────────────────────────────────────────────────────────────

interface ProposalCardProps {
  proposal: Proposal;
  index: number;
  view: "grid" | "list";
  onView: (id: string) => void;
  onQuickAction: (id: string, action: "accepted" | "rejected" | "revision_requested") => void;
}

const GridCard: React.FC<Omit<ProposalCardProps, "view">> = ({ proposal: p, index, onView, onQuickAction }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.24 }}
    className="group flex flex-col rounded-2xl border border-border transition-all duration-200 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/5 cursor-pointer"
    style={{ backgroundColor: "#111111" }}
    onClick={() => onView(p.id)}
  >
    {/* Header */}
    <div className="flex items-start gap-3 p-5 pb-3">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-black text-white", grad(p.freelancerId))}>
        {p.freelancerAvatarInitials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-textPrimary">{p.freelancerName}</p>
        <p className="truncate text-[11px] text-textMuted">{p.freelancerRole}</p>
      </div>
      <StatusBadge status={p.status} />
    </div>

    {/* Project tag */}
    <div className="px-5">
      <span className="rounded-full bg-elevated border border-border px-2 py-0.5 text-[10px] font-medium text-textDisabled">{p.projectName}</span>
    </div>

    {/* Meta */}
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-5 text-[11px] text-textMuted">
      <span className="flex items-center gap-1 font-semibold text-accent"><DollarSign className="h-3 w-3" />{formatBudget(p.priceMin, p.priceMax)}</span>
      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.timeline}</span>
      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{relativeTime(p.createdAt)}</span>
    </div>

    {/* Preview text */}
    <p className="mt-2 px-5 text-xs text-textDisabled line-clamp-2 leading-relaxed">{p.proposalText.replace(/\*\*/g,"").substring(0,120)}…</p>

    {/* Action row */}
    <div className="mt-auto flex items-center justify-between border-t border-border p-4 pt-3 gap-2">
      {p.status === "pending" ? (
        <div className="flex gap-1.5">
          <button onClick={(e)=>{e.stopPropagation();onQuickAction(p.id,"accepted");}}
            className="flex items-center gap-1 rounded-lg bg-success/10 border border-success/30 px-2.5 py-1 text-[10px] font-bold text-success hover:bg-success/20 transition-colors">
            <CheckCircle2 className="h-3 w-3" />Accept
          </button>
          <button onClick={(e)=>{e.stopPropagation();onQuickAction(p.id,"revision_requested");}}
            className="flex items-center gap-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 text-[10px] font-bold text-yellow-400 hover:bg-yellow-500/20 transition-colors">
            <RefreshCw className="h-3 w-3" />Revise
          </button>
          <button onClick={(e)=>{e.stopPropagation();onQuickAction(p.id,"rejected");}}
            className="flex items-center gap-1 rounded-lg bg-error/10 border border-error/30 px-2.5 py-1 text-[10px] font-bold text-error hover:bg-error/20 transition-colors">
            <XCircle className="h-3 w-3" />Reject
          </button>
        </div>
      ) : (
        <span className="text-[10px] text-textDisabled">Updated {relativeTime(p.updatedAt)}</span>
      )}
      <button onClick={()=>onView(p.id)} className="flex items-center gap-1 text-[10px] font-bold text-accent hover:underline ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        Details <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  </motion.div>
);

const ListRow: React.FC<Omit<ProposalCardProps, "view">> = ({ proposal: p, index, onView, onQuickAction }) => (
  <motion.tr
    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04, duration: 0.2 }}
    className="group cursor-pointer border-b border-border/50 transition-colors hover:bg-elevated/40 last:border-0"
    onClick={() => onView(p.id)}
  >
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-black text-white", grad(p.freelancerId))}>{p.freelancerAvatarInitials}</div>
        <div>
          <p className="text-sm font-bold text-textPrimary group-hover:text-accent transition-colors">{p.freelancerName}</p>
          <p className="text-[10px] text-textMuted">{p.freelancerRole}</p>
        </div>
      </div>
    </td>
    <td className="px-4 py-3 text-xs text-textMuted max-w-[140px] truncate">{p.projectName}</td>
    <td className="px-4 py-3 text-xs font-semibold text-accent whitespace-nowrap">{formatBudget(p.priceMin, p.priceMax)}</td>
    <td className="px-4 py-3 text-xs text-textMuted whitespace-nowrap">{p.timeline}</td>
    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
    <td className="px-4 py-3 text-xs text-textDisabled whitespace-nowrap">{relativeTime(p.createdAt)}</td>
    <td className="px-4 py-3">
      {p.status === "pending" && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e)=>{e.stopPropagation();onQuickAction(p.id,"accepted");}} className="rounded px-2 py-1 text-[10px] font-bold text-success bg-success/10 hover:bg-success/20"><CheckCircle2 className="h-3 w-3 inline mr-0.5"/>Accept</button>
          <button onClick={(e)=>{e.stopPropagation();onQuickAction(p.id,"rejected");}} className="rounded px-2 py-1 text-[10px] font-bold text-error bg-error/10 hover:bg-error/20"><XCircle className="h-3 w-3 inline mr-0.5"/>Reject</button>
        </div>
      )}
    </td>
  </motion.tr>
);

export const ProposalCard: React.FC<ProposalCardProps> = (props) =>
  props.view === "grid" ? <GridCard {...props} /> : null;

export const ProposalListRow: React.FC<Omit<ProposalCardProps,"view">> = (props) => <ListRow {...props} />;

// ─── Skeletons ────────────────────────────────────────────────────────────────
export const ProposalCardSkeleton: React.FC = () => (
  <div className="animate-pulse rounded-2xl border border-border p-5 space-y-3" style={{ backgroundColor: "#111111" }}>
    <div className="flex items-start gap-3">
      <div className="h-11 w-11 rounded-xl bg-elevated shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-28 rounded-full bg-elevated" />
        <div className="h-3 w-36 rounded-full bg-elevated" />
      </div>
      <div className="h-5 w-16 rounded-full bg-elevated" />
    </div>
    <div className="h-3 w-24 rounded-full bg-elevated" />
    <div className="flex gap-4">
      <div className="h-3 w-20 rounded-full bg-elevated" />
      <div className="h-3 w-16 rounded-full bg-elevated" />
    </div>
  </div>
);

export const ProposalRowSkeleton: React.FC = () => (
  <tr className="animate-pulse border-b border-border/50">
    {[160, 120, 90, 60, 70, 60, 80].map((w,i) => (
      <td key={i} className="px-4 py-3"><div className="h-3 rounded-full bg-elevated" style={{ width: w }} /></td>
    ))}
  </tr>
);
