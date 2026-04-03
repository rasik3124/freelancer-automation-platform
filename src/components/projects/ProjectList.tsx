import React from "react";
import { motion } from "motion/react";
import { Calendar, ChevronRight, Users, Zap, LayoutGrid, List } from "lucide-react";
import {
  Project,
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  formatBudget,
  deadlineLabel,
} from "../../types/project";
import { cn } from "../../lib/utils";

// ─── Gradient placeholder colours (one per project type) ─────────────────────

const TYPE_GRADIENTS = [
  "from-accent/40 to-violet-600/40",
  "from-blue-600/40 to-cyan-500/40",
  "from-orange-500/40 to-pink-600/40",
  "from-emerald-500/40 to-teal-500/40",
  "from-yellow-400/40 to-orange-400/40",
];

function gradientForId(id: string) {
  const i = id.charCodeAt(0) % TYPE_GRADIENTS.length;
  return TYPE_GRADIENTS[i];
}

// ─── Shared status + priority badges ─────────────────────────────────────────

export const StatusBadge: React.FC<{ status: Project["status"] }> = ({ status }) => {
  const c = STATUS_COLORS[status];
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        c.bg, c.text, c.border
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: Project["priority"] }> = ({ priority }) => {
  const c = PRIORITY_COLORS[priority];
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", c.bg, c.text)}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
};

// ─── Freelancer avatar stack ──────────────────────────────────────────────────

const AvatarStack: React.FC<{ freelancers: string[]; max?: number }> = ({
  freelancers,
  max = 3,
}) => {
  const shown = freelancers.slice(0, max);
  const extra = freelancers.length - max;
  if (!freelancers.length)
    return <span className="text-[10px] text-textDisabled">Unassigned</span>;
  return (
    <div className="flex -space-x-2">
      {shown.map((f, i) => (
        <div
          key={i}
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-accent/20 text-[9px] font-bold text-accent"
          title={f}
        >
          {f[0]?.toUpperCase() ?? "?"}
        </div>
      ))}
      {extra > 0 && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-elevated text-[9px] font-bold text-textMuted">
          +{extra}
        </div>
      )}
    </div>
  );
};

// ─── GRID card ────────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
  index: number;
  onSelect: (id: string) => void;
  view: "grid" | "list";
}

const GridCard: React.FC<Omit<ProjectCardProps, "view">> = ({
  project: p,
  index,
  onSelect,
}) => {
  const { label: dlLabel, overdue } = deadlineLabel(p.deadline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border transition-all duration-200 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/5 cursor-pointer"
      style={{ backgroundColor: "#111111" }}
      onClick={() => onSelect(p.id)}
      role="button"
      aria-label={`Open project: ${p.title}`}
    >
      {/* Gradient header */}
      <div
        className={cn(
          "relative h-28 bg-gradient-to-br p-4 flex flex-col justify-between",
          gradientForId(p.id)
        )}
        style={{ backgroundColor: "rgba(26,26,26,0.8)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full bg-black/30 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-white/80">
            {p.type}
          </span>
          <PriorityBadge priority={p.priority} />
        </div>
        <div className="flex justify-end">
          <StatusBadge status={p.status} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title */}
        <h4 className="font-display text-sm font-bold text-textPrimary line-clamp-2 group-hover:text-accent transition-colors">
          {p.title}
        </h4>

        {/* Budget */}
        <p className="text-xs font-semibold text-accent">{formatBudget(p.budgetMin, p.budgetMax)}</p>

        {/* Footer row */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
          {/* Deadline */}
          <span className={cn("flex items-center gap-1 text-[10px] font-medium", overdue ? "text-error" : "text-textDisabled")}>
            <Calendar className="h-3 w-3" />
            {dlLabel}
          </span>

          {/* Freelancers */}
          <AvatarStack freelancers={p.assignedFreelancers} />
        </div>

        {/* View details */}
        <button
          className="flex items-center justify-center gap-1.5 rounded-xl border border-accent/30 py-1.5 text-xs font-bold text-accent opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-accent/10"
          onClick={(e) => { e.stopPropagation(); onSelect(p.id); }}
        >
          View Details <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── LIST row ─────────────────────────────────────────────────────────────────

const ListRow: React.FC<Omit<ProjectCardProps, "view">> = ({
  project: p,
  index,
  onSelect,
}) => {
  const { label: dlLabel, overdue } = deadlineLabel(p.deadline);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="group cursor-pointer border-b border-border/50 transition-colors hover:bg-elevated/40 last:border-0"
      onClick={() => onSelect(p.id)}
    >
      {/* Title */}
      <td className="px-4 py-3 max-w-[220px]">
        <span className="block truncate text-sm font-bold text-textPrimary group-hover:text-accent transition-colors">
          {p.title}
        </span>
        <span className="text-[10px] text-textDisabled">{p.type}</span>
      </td>

      {/* Budget */}
      <td className="px-4 py-3 text-xs font-semibold text-accent whitespace-nowrap">
        {formatBudget(p.budgetMin, p.budgetMax)}
      </td>

      {/* Deadline */}
      <td className="px-4 py-3">
        <span className={cn("flex items-center gap-1 text-xs whitespace-nowrap", overdue ? "text-error" : "text-textDisabled")}>
          <Calendar className="h-3 w-3 shrink-0" />
          {dlLabel}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={p.status} />
      </td>

      {/* Priority */}
      <td className="px-4 py-3">
        <PriorityBadge priority={p.priority} />
      </td>

      {/* Freelancers */}
      <td className="px-4 py-3">
        <AvatarStack freelancers={p.assignedFreelancers} />
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(p.id); }}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-accent opacity-0 transition-all group-hover:opacity-100 hover:bg-accent/10"
        >
          Open <ChevronRight className="h-3 w-3" />
        </button>
      </td>
    </motion.tr>
  );
};

// ─── ProjectCard (dispatcher) ─────────────────────────────────────────────────

export const ProjectCard: React.FC<ProjectCardProps> = (props) =>
  props.view === "grid" ? <GridCard {...props} /> : null; // list rows handled by ProjectList

// ─── Empty state ──────────────────────────────────────────────────────────────

export const ProjectsEmptyState: React.FC<{
  hasFilters: boolean;
  onPost: () => void;
}> = ({ hasFilters, onPost }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center gap-4">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
      <Zap className="h-8 w-8 text-accent" />
    </div>
    <div className="space-y-1">
      <h4 className="font-display text-lg font-bold text-textPrimary">
        {hasFilters ? "No projects match your filters" : "No projects yet"}
      </h4>
      <p className="text-sm text-textMuted max-w-xs">
        {hasFilters
          ? "Try adjusting your search or filter criteria."
          : "Post your first project and start receiving proposals from top freelancers."}
      </p>
    </div>
    {!hasFilters && (
      <button
        onClick={onPost}
        className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:bg-accent/90 transition-colors"
      >
        <Users className="h-4 w-4" />
        Post First Project
      </button>
    )}
  </div>
);

// ─── Skeleton cards ───────────────────────────────────────────────────────────

export const ProjectCardSkeleton: React.FC<{ view: "grid" | "list" }> = ({ view }) =>
  view === "grid" ? (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-border" style={{ backgroundColor: "#111111" }}>
      <div className="h-28 bg-elevated" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded-full bg-elevated" />
        <div className="h-3 w-1/2 rounded-full bg-elevated" />
        <div className="mt-3 flex justify-between">
          <div className="h-3 w-20 rounded-full bg-elevated" />
          <div className="h-5 w-14 rounded-full bg-elevated" />
        </div>
      </div>
    </div>
  ) : (
    <tr className="animate-pulse border-b border-border/50">
      {[180, 100, 80, 70, 60, 60, 50].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 rounded-full bg-elevated" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );

// ─── ProjectList ──────────────────────────────────────────────────────────────

interface ProjectListProps {
  projects: Project[];
  isLoading: boolean;
  view: "grid" | "list";
  onViewChange: (v: "grid" | "list") => void;
  onSelectProject: (id: string) => void;
  onPostProject: () => void;
  hasFilters: boolean;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  isLoading,
  view,
  onViewChange,
  onSelectProject,
  onPostProject,
  hasFilters,
}) => {
  const SKELETON_COUNT = 6;

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-textMuted font-medium">
          {isLoading ? "Loading…" : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
        </p>
        <div className="flex rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => onViewChange("grid")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors",
              view === "grid" ? "bg-accent text-white" : "text-textMuted hover:text-textPrimary"
            )}
            aria-label="Grid view"
            id="grid-view-btn"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Grid
          </button>
          <button
            onClick={() => onViewChange("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors",
              view === "list" ? "bg-accent text-white" : "text-textMuted hover:text-textPrimary"
            )}
            aria-label="List view"
            id="list-view-btn"
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <ProjectCardSkeleton key={i} view="grid" />
              ))
            : projects.length === 0
            ? <div className="col-span-full"><ProjectsEmptyState hasFilters={hasFilters} onPost={onPostProject} /></div>
            : projects.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} view="grid" onSelect={onSelectProject} />
              ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border" style={{ backgroundColor: "#111111" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Project", "Budget", "Deadline", "Status", "Priority", "Team", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-textDisabled"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                    <ProjectCardSkeleton key={i} view="list" />
                  ))
                : projects.length === 0
                ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <ProjectsEmptyState hasFilters={hasFilters} onPost={onPostProject} />
                      </td>
                    </tr>
                  )
                : projects.map((p, i) => (
                    <ListRow key={p.id} project={p} index={i} onSelect={onSelectProject} />
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
