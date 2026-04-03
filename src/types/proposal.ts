// ─── Shared Proposal Types ────────────────────────────────────────────────────

export type ProposalStatus = "pending" | "accepted" | "rejected" | "revision_requested";

export interface ProposalComment { author: string; text: string; createdAt: string; }

export interface Proposal {
  id: string; clientId: string; freelancerId: string;
  freelancerName: string; freelancerRole: string; freelancerAvatarInitials: string;
  projectId: string; projectName: string; proposalText: string;
  priceMin: number; priceMax: number; timeline: string;
  status: ProposalStatus; comments: ProposalComment[];
  revisionNote?: string; createdAt: string; updatedAt: string;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const STATUS_META: Record<ProposalStatus, { label: string; bg: string; text: string; border: string }> = {
  pending:            { label: "Pending",           bg: "bg-slate-500/10",  text: "text-slate-400",  border: "border-slate-500/30" },
  accepted:           { label: "Accepted",          bg: "bg-success/10",    text: "text-success",    border: "border-success/30" },
  rejected:           { label: "Rejected",          bg: "bg-error/10",      text: "text-error",      border: "border-error/30" },
  revision_requested: { label: "Revision Requested",bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
};

export function formatBudget(min: number, max: number): string {
  const f = (n: number) => `$${n.toLocaleString("en-US")}`;
  return `${f(min)} – ${f(max)}`;
}

export function relativeTime(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7)  return `${d} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const STATUS_FILTER_OPTIONS: { value: ProposalStatus | "all"; label: string }[] = [
  { value: "all",               label: "All Proposals" },
  { value: "pending",           label: "Pending" },
  { value: "accepted",          label: "Accepted" },
  { value: "rejected",          label: "Rejected" },
  { value: "revision_requested",label: "Revision Requested" },
];
