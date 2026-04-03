/**
 * ClientPayments.tsx — Client payment history & status
 */
import React, { useState } from "react";
import { motion } from "motion/react";
import { CreditCard, CheckCircle2, Clock, AlertCircle, Download } from "lucide-react";
import { cn } from "../../lib/utils";

type PaymentStatus = "completed" | "pending" | "failed";

const PAYMENTS = [
  { id: "PAY-001", freelancer: "Alex Johnson",  amount: 420000, status: "completed" as PaymentStatus, date: "2025-12-15", project: "SaaS Dashboard", method: "Razorpay" },
  { id: "PAY-002", freelancer: "Maria Chen",    amount: 310000, status: "pending"   as PaymentStatus, date: "2026-01-10", project: "Brand Website",  method: "UPI" },
  { id: "PAY-003", freelancer: "David Park",    amount: 255000, status: "completed" as PaymentStatus, date: "2025-11-30", project: "MVP Sprint",     method: "Razorpay" },
  { id: "PAY-004", freelancer: "Sarah Williams",amount: 185000, status: "failed"    as PaymentStatus, date: "2025-11-15", project: "API Backend",    method: "Bank Transfer" },
  { id: "PAY-005", freelancer: "Alex Johnson",  amount: 420000, status: "completed" as PaymentStatus, date: "2025-10-25", project: "Dashboard Q3",  method: "Razorpay" },
];


const STATUS_CFG: Record<PaymentStatus, { icon: typeof CheckCircle2; cls: string; label: string }> = {
  completed: { icon: CheckCircle2, cls: "border-success/30 bg-success/10 text-success", label: "Completed" },
  pending:   { icon: Clock,        cls: "border-accent/30 bg-accent/10 text-accent",    label: "Pending"   },
  failed:    { icon: AlertCircle,  cls: "border-error/30 bg-error/10 text-error",        label: "Failed"    },
};

export const ClientPayments: React.FC = () => {
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");

  const filtered = PAYMENTS.filter(p => filter === "all" || p.status === filter);
  const totalPaid   = PAYMENTS.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0);
  const totalPending = PAYMENTS.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Payments</h1>
          <p className="text-sm text-text-muted mt-0.5">Payment history & upcoming transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Paid",    value: totalPaid,    color: "text-success", border: "border-success/20", bg: "bg-success/5" },
          { label: "Pending",       value: totalPending, color: "text-accent",  border: "border-accent/20",  bg: "bg-accent/5"  },
          { label: "This Month",    value: 420000,       color: "text-text-primary", border: "border-border", bg: "" },

        ].map(s => (
          <div key={s.label} className={cn("glass-gold rounded-2xl border p-4", s.border, s.bg)}>
            <p className="text-xs text-text-muted mb-1">{s.label}</p>
            <p className={cn("font-mono text-2xl font-bold", s.color)}>₹{s.value.toLocaleString("en-IN")}</p>

          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {(["all", "completed", "pending", "failed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-all",
              filter === f ? "border-accent/40 bg-accent/15 text-accent" : "border-border bg-elevated text-text-muted hover:text-text-primary")}>
            {f}
          </button>
        ))}
      </div>

      <div className="glass-gold rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["ID", "Freelancer", "Project", "Method", "Amount", "Date", "Status", ""].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-text-disabled">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const cfg = STATUS_CFG[p.status];
              const Icon = cfg.icon;
              return (
                <motion.tr key={p.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="border-b border-border/50 hover:bg-elevated/50 transition-colors">
                  <td className="px-5 py-4 font-mono text-text-muted text-xs">{p.id}</td>
                  <td className="px-5 py-4 text-text-primary font-medium">{p.freelancer}</td>
                  <td className="px-5 py-4 text-text-muted truncate max-w-[160px]">{p.project}</td>
                  <td className="px-5 py-4 text-text-muted">{p.method}</td>
                  <td className="px-5 py-4 text-accent font-mono font-bold">₹{p.amount.toLocaleString("en-IN")}</td>

                  <td className="px-5 py-4 font-mono text-xs text-text-muted">{p.date}</td>
                  <td className="px-5 py-4">
                    <span className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold w-fit", cfg.cls)}>
                      <Icon className="h-2.5 w-2.5" /> {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button className="rounded-lg border border-border bg-elevated p-1.5 text-text-muted hover:text-accent hover:border-accent/30 transition-all">
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
