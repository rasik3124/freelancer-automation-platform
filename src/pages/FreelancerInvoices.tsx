/**
 * FreelancerInvoices.tsx — Freelancer Invoice & Payment Tracking
 */
import React, { useState } from "react";
import { motion } from "motion/react";
import { Receipt, Plus, Download, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

type InvoiceStatus = "paid" | "pending" | "overdue";

const INVOICES = [
  { id: "INV-001", client: "TechVentures Inc.",  amount: 420000, status: "paid"    as InvoiceStatus, issued: "2025-12-01", due: "2025-12-15", project: "SaaS Dashboard Q4" },
  { id: "INV-002", client: "DesignStudio Co.",   amount: 310000, status: "pending" as InvoiceStatus, issued: "2025-12-10", due: "2026-01-10", project: "Brand Website Phase 2" },
  { id: "INV-003", client: "Startup Labs",       amount: 255000, status: "paid"    as InvoiceStatus, issued: "2025-11-20", due: "2025-12-05", project: "MVP Sprint 3" },
  { id: "INV-004", client: "Growth Agency",      amount: 190000, status: "overdue" as InvoiceStatus, issued: "2025-11-01", due: "2025-11-30", project: "Marketing Automation" },
  { id: "INV-005", client: "E-commerce Plus",    amount: 145000, status: "pending" as InvoiceStatus, issued: "2025-12-15", due: "2026-01-15", project: "Shopify Integration" },
];


const STATUS_CONFIG: Record<InvoiceStatus, { badge: string; icon: typeof CheckCircle2; label: string }> = {
  paid:    { badge: "badge-success", icon: CheckCircle2, label: "Paid" },
  pending: { badge: "badge-gold",    icon: Clock,        label: "Pending" },
  overdue: { badge: "badge-error",   icon: AlertCircle,  label: "Overdue" },
};

export const FreelancerInvoices: React.FC = () => {
  const [filter, setFilter] = useState<"all" | InvoiceStatus>("all");

  const filtered = INVOICES.filter(inv => filter === "all" || inv.status === filter);
  const totalPaid    = INVOICES.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = INVOICES.filter(i => i.status === "pending").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = INVOICES.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Invoices</h1>
          <p className="text-sm text-text-muted mt-0.5">{INVOICES.length} invoices</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-base hover:bg-accent-muted transition-all shadow-glow">
          <Plus className="h-4 w-4" /> Create Invoice
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Paid",    value: totalPaid,    color: "text-success", border: "border-success/20", bg: "bg-success/5"  },
          { label: "Pending",       value: totalPending, color: "text-accent",  border: "border-accent/20",  bg: "bg-accent/5"   },
          { label: "Overdue",       value: totalOverdue, color: "text-error",   border: "border-error/20",   bg: "bg-error/5"    },
        ].map(s => (
          <div key={s.label} className={cn("rounded-2xl border p-4", s.border, s.bg)}>
            <p className="text-xs text-text-muted mb-1">{s.label}</p>
            <p className={cn("font-mono text-2xl font-bold", s.color)}>₹{s.value.toLocaleString("en-IN")}</p>

          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(["all", "paid", "pending", "overdue"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-all",
              filter === f ? "border-accent/40 bg-accent/15 text-accent" : "border-border bg-elevated text-text-muted hover:text-text-primary")}>
            {f}
          </button>
        ))}
      </div>

      {/* Invoice table */}
      <div className="glass-gold rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Invoice", "Client", "Project", "Amount", "Due Date", "Status", ""].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-disabled">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv, i) => {
              const cfg = STATUS_CONFIG[inv.status];
              const Icon = cfg.icon;
              return (
                <motion.tr key={inv.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-border/50 hover:bg-elevated/50 transition-colors">
                  <td className="px-5 py-4 font-mono text-text-primary font-semibold">{inv.id}</td>
                  <td className="px-5 py-4 text-text-secondary">{inv.client}</td>
                  <td className="px-5 py-4 text-text-muted truncate max-w-[180px]">{inv.project}</td>
                  <td className="px-5 py-4 text-accent font-mono font-bold">₹{inv.amount.toLocaleString("en-IN")}</td>

                  <td className="px-5 py-4 text-text-muted font-mono text-xs">{inv.due}</td>
                  <td className="px-5 py-4">
                    <span className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold w-fit", 
                      inv.status === "paid" ? "border-success/30 bg-success/10 text-success" :
                      inv.status === "pending" ? "border-accent/30 bg-accent/10 text-accent" :
                      "border-error/30 bg-error/10 text-error")}>
                      <Icon className="h-2.5 w-2.5" /> {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button title="Download PDF"
                      className="rounded-lg border border-border bg-elevated p-1.5 text-text-muted hover:text-accent hover:border-accent/30 transition-all">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
