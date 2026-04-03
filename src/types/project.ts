// ─── Shared Project Types ─────────────────────────────────────────────────────
// Single source of truth used by ProjectCard, ProjectList, ProjectDetailsModal,
// PostProjectForm, and ClientProjects.

export type ProjectStatus =
  | "new_lead"
  | "contacted"
  | "proposal_in"
  | "negotiation"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ProjectPriority = "low" | "medium" | "high" | "urgent";

export interface Project {
  id: string;
  clientId: string;
  title: string;
  description: string;
  type: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;           // ISO date string
  priority: ProjectPriority;
  status: ProjectStatus;
  features: string[];
  technologies: string[];
  deliverables: string[];
  problemStatement: string;
  targetAudience: string;
  references: string[];
  assignedFreelancers: string[];
  proposalCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Filters state ───────────────────────────────────────────────────────────

export interface ProjectFiltersState {
  search: string;
  status: ProjectStatus | "all";
  priority: ProjectPriority | "all";
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  new_lead:     "New Lead",
  contacted:    "Contacted",
  proposal_in:  "Proposal In",
  negotiation:  "Negotiation",
  in_progress:  "In Progress",
  completed:    "Completed",
  cancelled:    "Cancelled",
};

export const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string; border: string }> = {
  new_lead:    { bg: "bg-slate-500/10",   text: "text-slate-400",   border: "border-slate-500/30" },
  contacted:   { bg: "bg-yellow-500/10",  text: "text-yellow-400",  border: "border-yellow-500/30" },
  proposal_in: { bg: "bg-accent/10",      text: "text-accent",      border: "border-accent/30" },
  negotiation: { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/30" },
  in_progress: { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/30" },
  completed:   { bg: "bg-success/10",     text: "text-success",     border: "border-success/30" },
  cancelled:   { bg: "bg-error/10",       text: "text-error",       border: "border-error/30" },
};

export const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: "Low", medium: "Medium", high: "High", urgent: "Urgent",
};

export const PRIORITY_COLORS: Record<ProjectPriority, { bg: string; text: string }> = {
  low:    { bg: "bg-textDisabled/10", text: "text-textDisabled" },
  medium: { bg: "bg-blue-500/10",     text: "text-blue-400" },
  high:   { bg: "bg-orange-500/10",   text: "text-orange-400" },
  urgent: { bg: "bg-error/10",        text: "text-error" },
};

export const PROJECT_TYPES = [
  "Website Development",
  "Mobile App",
  "UI/UX Design",
  "Backend / API",
  "E-commerce",
  "Data / AI / ML",
  "DevOps / Infrastructure",
  "Other",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format budget as "$X,000 – $Y,000" */
export function formatBudget(min: number, max: number): string {
  const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;
  return `${fmt(min)} – ${fmt(max)}`;
}

/** Returns deadline label: "15 days left", "Overdue", "Due today" */
export function deadlineLabel(isoDate: string): { label: string; overdue: boolean } {
  const now = new Date();
  const due = new Date(isoDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);
  if (diffDays < 0)  return { label: `${Math.abs(diffDays)}d overdue`, overdue: true };
  if (diffDays === 0) return { label: "Due today",                      overdue: true };
  if (diffDays <= 7)  return { label: `${diffDays}d left`,              overdue: false };
  return { label: `${diffDays} days left`, overdue: false };
}
