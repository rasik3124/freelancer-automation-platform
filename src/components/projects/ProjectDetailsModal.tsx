import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Tag, Users, Inbox, Clock, Pencil, Trash2, ChevronRight,
  AlertTriangle, Loader2, CheckCircle2,
} from "lucide-react";
import {
  Project, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS,
  formatBudget, deadlineLabel,
} from "../../types/project";
import api from "../../services/api";
import { cn } from "../../lib/utils";

interface ProjectDetailsModalProps {
  projectId: string | null;
  onClose: () => void;
  onProjectUpdated: (p: Project) => void;
}

const ConfirmDialog: React.FC<{ message: string; onConfirm: () => void; onCancel: () => void; loading?: boolean }> = ({ message, onConfirm, onCancel, loading }) => (
  <div className="rounded-2xl border border-error/30 bg-error/5 p-5 space-y-4">
    <div className="flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" />
      <p className="text-sm text-textPrimary">{message}</p>
    </div>
    <div className="flex gap-3 justify-end">
      <button onClick={onCancel} className="rounded-xl px-4 py-2 text-sm font-bold text-textMuted hover:bg-elevated transition-colors">Cancel</button>
      <button onClick={onConfirm} disabled={loading} className="flex items-center gap-2 rounded-xl bg-error px-4 py-2 text-sm font-bold text-white hover:bg-error/80 transition-colors disabled:opacity-50">
        {loading && <Loader2 className="h-3 w-3 animate-spin" />} Confirm
      </button>
    </div>
  </div>
);

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 border-b border-border pb-2">
      <Icon className="h-4 w-4 text-accent" />
      <h4 className="text-sm font-bold text-textPrimary">{title}</h4>
    </div>
    {children}
  </div>
);

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0">
    <span className="text-xs text-textMuted font-medium w-28 shrink-0">{label}</span>
    <span className="text-xs text-textPrimary text-right font-semibold">{value}</span>
  </div>
);

const TagList: React.FC<{ tags: string[]; empty?: string }> = ({ tags, empty = "None specified" }) =>
  tags.length === 0 ? (
    <p className="text-xs text-textDisabled italic">{empty}</p>
  ) : (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span key={t} className="rounded-full border border-border bg-elevated px-2.5 py-0.5 text-[11px] font-medium text-textMuted">{t}</span>
      ))}
    </div>
  );

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ projectId, onClose, onProjectUpdated }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true); setError(null);
    api.get<{ data: Project }>(`/api/projects/${projectId}`)
      .then((r) => setProject(r.data.data))
      .catch(() => setError("Could not load project details."))
      .finally(() => setIsLoading(false));
  }, [projectId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const patchStatus = async (status: Project["status"]) => {
    if (!project) return;
    setActionLoading(true);
    try {
      const r = await api.patch<{ data: Project }>(`/api/projects/${project.id}`, { status });
      setProject(r.data.data);
      onProjectUpdated(r.data.data);
    } finally {
      setActionLoading(false);
      setConfirmCancel(false);
    }
  };

  const dl = project ? deadlineLabel(project.deadline) : { label: "", overdue: false };

  const panel = (
    <AnimatePresence>
      {projectId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.aside key="panel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-border shadow-2xl"
            style={{ backgroundColor: "#0d0d0d" }} role="dialog" aria-modal aria-label="Project details">
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-border px-5">
              <h3 className="font-display text-base font-bold text-textPrimary">Project Details</h3>
              <button onClick={onClose} className="rounded-lg p-2 text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
              {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              ) : error ? (
                <p className="text-sm text-error text-center py-10">{error}</p>
              ) : project ? (
                <>
                  <Section title="Overview" icon={Tag}>
                    <div className="rounded-xl border border-border p-4 space-y-0" style={{ backgroundColor: "#111111" }}>
                      <InfoRow label="Title" value={project.title} />
                      <InfoRow label="Type" value={project.type} />
                      <InfoRow label="Budget" value={<span className="text-accent">{formatBudget(project.budgetMin, project.budgetMax)}</span>} />
                      <InfoRow label="Deadline" value={
                        <span className={dl.overdue ? "text-error" : "text-textPrimary"}>
                          {new Date(project.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ({dl.label})
                        </span>
                      } />
                      <InfoRow label="Priority" value={
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", PRIORITY_COLORS[project.priority].bg, PRIORITY_COLORS[project.priority].text)}>
                          {PRIORITY_LABELS[project.priority]}
                        </span>
                      } />
                      <InfoRow label="Status" value={
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", STATUS_COLORS[project.status].bg, STATUS_COLORS[project.status].text, STATUS_COLORS[project.status].border)}>
                          {STATUS_LABELS[project.status]}
                        </span>
                      } />
                      <InfoRow label="Proposals" value={`${project.proposalCount} received`} />
                    </div>
                    {project.description && <p className="text-sm text-textMuted leading-relaxed mt-2">{project.description}</p>}
                  </Section>

                  <Section title="Requirements" icon={ChevronRight}>
                    {project.problemStatement && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-textDisabled">Problem Statement</p>
                        <p className="text-sm text-textMuted leading-relaxed">{project.problemStatement}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-textDisabled">Key Features</p>
                      <TagList tags={project.features} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-textDisabled">Technologies</p>
                      <TagList tags={project.technologies} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-textDisabled">Deliverables</p>
                      <TagList tags={project.deliverables} />
                    </div>
                    {project.targetAudience && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-textDisabled">Target Audience</p>
                        <p className="text-sm text-textMuted">{project.targetAudience}</p>
                      </div>
                    )}
                  </Section>

                  <Section title="Assigned Freelancers" icon={Users}>
                    {project.assignedFreelancers.length === 0 ? (
                      <p className="text-xs text-textDisabled italic">No freelancers assigned yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {project.assignedFreelancers.map((f, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3" style={{ backgroundColor: "#111111" }}>
                            <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">{f[0]?.toUpperCase()}</div>
                            <span className="text-sm text-textPrimary">{f}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>

                  <Section title="Proposals" icon={Inbox}>
                    <p className="text-sm text-textPrimary font-bold">
                      {project.proposalCount === 0 ? "No proposals yet." : `${project.proposalCount} proposal${project.proposalCount > 1 ? "s" : ""} received.`}
                    </p>
                  </Section>

                  <Section title="Timeline" icon={Clock}>
                    <div className="space-y-2 text-xs">
                      {[
                        ["Created", new Date(project.createdAt).toLocaleDateString()],
                        ["Last updated", new Date(project.updatedAt).toLocaleDateString()],
                        ["Deadline", new Date(project.deadline).toLocaleDateString()],
                      ].map(([label, value]) => (
                        <p key={label} className="flex justify-between text-textMuted">
                          <span>{label}</span>
                          <span className="text-textPrimary font-semibold">{value}</span>
                        </p>
                      ))}
                    </div>
                  </Section>

                  {confirmCancel && (
                    <ConfirmDialog message="Are you sure you want to cancel this project? This cannot be undone."
                      onConfirm={() => patchStatus("cancelled")} onCancel={() => setConfirmCancel(false)} loading={actionLoading} />
                  )}
                </>
              ) : null}
            </div>
            {/* Footer */}
            {project && !isLoading && (
              <div className="border-t border-border p-4 flex flex-wrap gap-2">
                {project.status !== "completed" && project.status !== "cancelled" && (
                  <button onClick={() => patchStatus("completed")} disabled={actionLoading}
                    className="flex items-center gap-1.5 rounded-xl bg-success/10 border border-success/30 px-3 py-2 text-xs font-bold text-success hover:bg-success/20 transition-colors disabled:opacity-40">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
                  </button>
                )}
                <button className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                {project.status !== "cancelled" && (
                  <button onClick={() => setConfirmCancel(true)} disabled={actionLoading} className="flex items-center gap-1.5 rounded-xl border border-error/30 px-3 py-2 text-xs font-bold text-error hover:bg-error/10 transition-colors disabled:opacity-40 ml-auto">
                    <Trash2 className="h-3.5 w-3.5" /> Cancel Project
                  </button>
                )}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
  return createPortal(panel, document.body);
};
