/**
 * FreelancerClients.tsx — Freelancer's client list & CRM
 */
import React, { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Users2, MessageCircle, FolderOpen, Star, Search, Filter, Plus } from "lucide-react";
import { ROUTES } from "../constants";
import { cn } from "../lib/utils";

const CLIENTS = [
  { id: "c1", name: "TechVentures Inc.",  email: "cto@techventures.io",  projects: 3, totalPaid: 840000,  rating: 4.9, status: "active",   lastContact: "2025-12-20", avatarInitials: "TV" },
  { id: "c2", name: "DesignStudio Co.",    email: "hi@designstudio.co",   projects: 2, totalPaid: 620000,  rating: 5.0, status: "active",   lastContact: "2025-12-18", avatarInitials: "DS" },
  { id: "c3", name: "Startup Labs",        email: "ops@startuplabs.io",   projects: 4, totalPaid: 510000,  rating: 4.7, status: "active",   lastContact: "2025-11-30", avatarInitials: "SL" },
  { id: "c4", name: "Growth Agency",       email: "pm@growthagency.co",   projects: 2, totalPaid: 380000,  rating: 4.8, status: "inactive", lastContact: "2025-10-15", avatarInitials: "GA" },
  { id: "c5", name: "E-commerce Plus",     email: "dev@ecomplus.net",     projects: 1, totalPaid: 290000,  rating: 4.6, status: "inactive", lastContact: "2025-09-20", avatarInitials: "EP" },

];

export const FreelancerClients: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = CLIENTS.filter(c =>
    (filter === "all" || c.status === filter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Clients</h1>
          <p className="text-sm text-text-muted mt-0.5">{CLIENTS.length} total clients · {CLIENTS.filter(c => c.status === "active").length} active</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-base hover:bg-accent-muted transition-all shadow-glow">
          <Plus className="h-4 w-4" /> Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-disabled" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="w-full rounded-xl border border-border bg-elevated pl-9 pr-4 py-2 text-sm text-text-primary placeholder-text-disabled focus:border-accent/50 focus:outline-none transition-all" />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          {(["all", "active", "inactive"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all",
                filter === f ? "bg-accent/20 text-accent border border-accent/30" : "text-text-muted hover:text-text-primary")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Client table */}
      <div className="glass-gold rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-disabled">Client</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-disabled">Projects</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-disabled">Total Paid</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-disabled">Rating</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-disabled">Status</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-disabled">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client, i) => (
              <motion.tr key={client.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-border/50 hover:bg-elevated/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-xs font-bold text-accent">
                      {client.avatarInitials}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{client.name}</p>
                      <p className="text-xs text-text-muted">{client.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-text-secondary font-mono">{client.projects}</td>
                <td className="px-5 py-4 text-accent font-mono font-semibold">₹{client.totalPaid.toLocaleString("en-IN")}</td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                    <span className="font-mono text-sm text-text-primary">{client.rating}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={cn("badge-muted", client.status === "active" && "badge-success")}>
                    {client.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => navigate(ROUTES.FREELANCER_MESSAGES)} title="Message"
                      className="rounded-lg border border-border bg-elevated p-1.5 text-text-muted hover:text-accent hover:border-accent/30 transition-all">
                      <MessageCircle className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => navigate(ROUTES.FREELANCER_PROJECTS)} title="Projects"
                      className="rounded-lg border border-border bg-elevated p-1.5 text-text-muted hover:text-accent hover:border-accent/30 transition-all">
                      <FolderOpen className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <Users2 className="h-8 w-8 text-text-disabled mb-2" />
            <p className="text-sm text-text-muted">No clients found</p>
          </div>
        )}
      </div>
    </div>
  );
};
