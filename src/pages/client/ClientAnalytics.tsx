/**
 * ClientAnalytics.tsx — Client-side spending & project analytics
 */
import React from "react";
import { motion } from "motion/react";
import { TrendingUp, DollarSign, FolderOpen, Users2, Star, BarChart2 } from "lucide-react";
import { cn } from "../../lib/utils";

const MONTHLY_SPEND = [180000, 240000, 320000, 280000, 410000, 360000, 520000, 480000, 610000, 580000, 740000, 820000];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const KPIS = [
  { label: "Total Spent",           value: "₹55.4L", icon: DollarSign, color: "text-accent" },

  { label: "Active Projects",  value: "4",      icon: FolderOpen, color: "text-success" },
  { label: "Freelancers Hired",value: "7",      icon: Users2,     color: "text-accent" },
  { label: "Avg Freelancer Rating", value: "4.8", icon: Star,    color: "text-warning" },
];

const SpendChart: React.FC = () => {
  const max = Math.max(...MONTHLY_SPEND);
  return (
    <div>
      <div className="flex items-end gap-1.5 h-32">
        {MONTHLY_SPEND.map((v, i) => (
          <motion.div key={i}
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 100}%` }}
            transition={{ duration: 0.5, delay: i * 0.04 }}
            className={cn("flex-1 rounded-t-md", i === MONTHLY_SPEND.length - 1 ? "bg-accent" : "bg-accent/30")}
            title={`${MONTHS[i]}: $${v.toLocaleString()}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        {MONTHS.filter((_, i) => i % 2 === 0).map(m => (
          <span key={m} className="text-[9px] font-mono text-text-disabled">{m}</span>
        ))}
      </div>
    </div>
  );
};

export const ClientAnalytics: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h1 className="font-display text-2xl font-bold text-text-primary">Analytics</h1>
      <p className="text-sm text-text-muted mt-0.5">Project spend & performance overview</p>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {KPIS.map((k, i) => {
        const Icon = k.icon;
        return (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="stat-card">
            <Icon className={cn("h-4 w-4", k.color)} />
            <div>
              <p className={cn("font-mono text-2xl font-bold", k.color)}>{k.value}</p>
              <p className="text-xs text-text-muted">{k.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>

    <div className="glass-gold rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="h-4 w-4 text-accent" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Monthly Spend (2025)</p>
      </div>
      <div className="flex items-end justify-between mb-2">
        <p className="font-mono text-2xl font-bold text-accent">₹8,20,000</p>

        <span className="flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success">
          <TrendingUp className="h-3 w-3" /> +11% MoM
        </span>
      </div>
      <SpendChart />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { label: "Project Success Rate", pct: 92, color: "bg-success" },
        { label: "Budget Utilization",   pct: 78, color: "bg-accent"  },
        { label: "On-Time Delivery",     pct: 85, color: "bg-success" },
        { label: "Freelancer Retention", pct: 71, color: "bg-accent"  },
      ].map((m, i) => (
        <div key={m.label} className="glass-gold rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">{m.label}</span>
            <span className="font-mono text-sm font-bold text-accent">{m.pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className={cn("h-full rounded-full", m.color)} />
          </div>
        </div>
      ))}
    </div>
  </div>
);
