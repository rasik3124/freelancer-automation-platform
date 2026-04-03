/**
 * FreelancerProjects.tsx — Freelancer Project Management (Kanban + List)
 */
import React, { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Plus, Clock, DollarSign, User, Kanban, List } from "lucide-react";

import { ROUTES } from "../constants";
import { cn } from "../lib/utils";

type Status = "todo" | "in_progress" | "review" | "done";

const PROJECTS = [
  { id: "p1", title: "SaaS Dashboard Rebuild",      client: "TechVentures Inc.",  status: "in_progress" as Status, progress: 65, budget: 840000,  deadline: "2026-02-15", daysLeft: 15 },
  { id: "p2", title: "Brand Website",               client: "DesignStudio Co.",   status: "review"      as Status, progress: 90, budget: 620000,  deadline: "2026-01-30", daysLeft: 3  },
  { id: "p3", title: "Mobile App MVP",              client: "Startup Labs",       status: "in_progress" as Status, progress: 40, budget: 510000,  deadline: "2026-03-10", daysLeft: 38 },
  { id: "p4", title: "Marketing Automation",        client: "Growth Agency",      status: "done"        as Status, progress: 100,budget: 380000,  deadline: "2025-12-20", daysLeft: 0  },
  { id: "p5", title: "Shopify Integration",         client: "E-commerce Plus",    status: "todo"        as Status, progress: 0,  budget: 290000,  deadline: "2026-04-01", daysLeft: 60 },

];

const COLUMNS: { key: Status; label: string; color: string }[] = [
  { key: "todo",        label: "To Do",      color: "text-text-muted"  },
  { key: "in_progress", label: "In Progress",color: "text-accent"      },
  { key: "review",      label: "In Review",  color: "text-warning"     },
  { key: "done",        label: "Done",       color: "text-success"     },
];

const statusColor: Record<Status, string> = {
  todo:        "badge-muted",
  in_progress: "badge-gold",
  review:      "badge-warning",
  done:        "badge-success",
};

const statusLabel: Record<Status, string> = {
  todo: "To Do", in_progress: "In Progress", review: "In Review", done: "Done"
};

export const FreelancerProjects: React.FC = () => {
  const [view, setView] = useState<"list" | "kanban">("list");
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Projects</h1>
          <p className="text-sm text-text-muted mt-0.5">{PROJECTS.length} projects · {PROJECTS.filter(p => p.status === "in_progress").length} active</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
            <button onClick={() => setView("list")}
              className={cn("rounded-lg p-2 transition-all", view === "list" ? "bg-accent/20 text-accent" : "text-text-muted hover:text-text-primary")}>
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setView("kanban")}
              className={cn("rounded-lg p-2 transition-all", view === "kanban" ? "bg-accent/20 text-accent" : "text-text-muted hover:text-text-primary")}>
              <Kanban className="h-4 w-4" />

            </button>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-base hover:bg-accent-muted transition-all shadow-glow">
            <Plus className="h-4 w-4" /> New Project
          </button>
        </div>
      </div>

      {/* ── LIST VIEW ── */}
      {view === "list" && (
        <div className="space-y-3">
          {PROJECTS.map((p, i) => (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-gold rounded-2xl border border-border p-5 hover-glow cursor-pointer"
              onClick={() => navigate(ROUTES.FREELANCER_PROJECTS)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-text-primary truncate">{p.title}</h3>
                    <span className={cn("shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border", statusColor[p.status])}>
                      {statusLabel[p.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{p.client}</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />₹{p.budget.toLocaleString("en-IN")}</span>

                    {p.daysLeft > 0 && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.daysLeft}d left</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-xl font-bold text-accent">{p.progress}%</p>
                  <p className="text-[10px] text-text-muted">complete</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-elevated overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.progress}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06 }}
                  className={cn("h-full rounded-full", p.status === "done" ? "bg-success" : "bg-accent")}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── KANBAN VIEW ── */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto">
          {COLUMNS.map(col => {
            const cards = PROJECTS.filter(p => p.status === col.key);
            return (
              <div key={col.key} className="min-w-[220px] glass-gold rounded-2xl border border-border">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className={cn("text-xs font-bold uppercase tracking-widest", col.color)}>{col.label}</p>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-elevated text-[10px] font-mono font-bold text-text-muted">{cards.length}</span>
                </div>
                <div className="space-y-2 p-3">
                  {cards.map(p => (
                    <div key={p.id} className="rounded-xl border border-border bg-elevated p-3 cursor-pointer hover:border-accent/30 transition-all">
                      <p className="text-xs font-semibold text-text-primary leading-tight">{p.title}</p>
                      <p className="mt-1 text-[10px] text-text-muted">{p.client}</p>
                      {p.progress > 0 && p.progress < 100 && (
                        <div className="mt-2 h-1 w-full rounded-full bg-surface overflow-hidden">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${p.progress}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <p className="py-4 text-center text-[11px] text-text-disabled">No cards</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
