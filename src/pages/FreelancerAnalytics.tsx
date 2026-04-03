/**
 * FreelancerAnalytics.tsx — Crescent Black Analytics Dashboard (Freelancer)
 *
 * - Revenue trend (area chart via SVG sparklines)
 * - Conversion funnel
 * - Project completion stats
 * - Performance KPIs
 * - Top clients
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp, TrendingDown, DollarSign, Users, Star,
  BarChart2, CheckCircle2, Clock, Zap, Award, Target,
} from "lucide-react";
import { cn } from "../lib/utils";

// ─── SAMPLE DATA ──────────────────────────────────────────────────────────────

const MONTHLY_REVENUE = [4200, 5800, 5100, 7200, 6800, 9100, 8400, 11200, 10500, 13800, 12600, 15400];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const FUNNEL = [
  { label: "Leads Received",       value: 84,  pct: 100, color: "bg-text-muted" },
  { label: "Leads Reviewed",       value: 61,  pct: 73,  color: "bg-accent/60" },
  { label: "Proposals Sent",       value: 38,  pct: 45,  color: "bg-accent/80" },
  { label: "Client Responded",     value: 22,  pct: 26,  color: "bg-accent" },
  { label: "Contracts Signed",     value: 14,  pct: 17,  color: "bg-success/80" },
];

const TOP_CLIENTS = [
  { name: "TechVentures Inc.",  revenue: 8400,  projects: 3, rating: 4.9 },
  { name: "DesignStudio Co.",   revenue: 6200,  projects: 2, rating: 5.0 },
  { name: "Startup Labs",       revenue: 5100,  projects: 4, rating: 4.7 },
  { name: "Growth Agency",      revenue: 3800,  projects: 2, rating: 4.8 },
  { name: "E-commerce Plus",    revenue: 2900,  projects: 1, rating: 4.6 },
];

const KPIS = [
  { label: "Total Revenue",     value: "₹9.1L",  change: +24.5, icon: DollarSign, color: "text-accent" },

  { label: "Active Projects",   value: "7",       change: +2,    icon: BarChart2,  color: "text-success" },
  { label: "Win Rate",          value: "36.8%",   change: +4.2,  icon: Target,     color: "text-accent" },
  { label: "Avg Rating",        value: "4.85",    change: +0.12, icon: Star,       color: "text-warning" },
  { label: "Client Retention",  value: "78%",     change: +6,    icon: Users,      color: "text-success" },
  { label: "On-Time Delivery",  value: "91%",     change: -2,    icon: Clock,      color: "text-text-secondary" },
];

// ─── SVG Sparkline Area Chart ─────────────────────────────────────────────────

const RevenueChart: React.FC = () => {
  const W = 100, H = 60;
  const max = Math.max(...MONTHLY_REVENUE);
  const pts = MONTHLY_REVENUE.map((v, i) => ({
    x: (i / (MONTHLY_REVENUE.length - 1)) * W,
    y: H - (v / max) * H,
  }));

  const lineD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = `${lineD} L${W},${H} L0,${H} Z`;

  return (
    <div className="w-full">
      {/* Top labels */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="font-mono text-2xl font-bold text-accent">₹15,400</p>

          <p className="text-xs text-text-muted mt-0.5">Dec 2025 — highest month</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success">
          <TrendingUp className="h-3 w-3" /> +22% MoM
        </div>
      </div>

      {/* SVG chart */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40 overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="gold-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#gold-grad)" />
        <path d={lineD} fill="none" stroke="#D4AF37" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1" fill="#D4AF37" opacity={i === pts.length - 1 ? 1 : 0.4} />
        ))}
      </svg>

      {/* Month labels */}
      <div className="flex justify-between mt-1">
        {MONTHS.filter((_, i) => i % 2 === 0).map(m => (
          <span key={m} className="text-[9px] font-mono text-text-disabled">{m}</span>
        ))}
      </div>
    </div>
  );
};

// ─── Horizontal bar chart ──────────────────────────────────────────────────────

const ConversionFunnel: React.FC = () => (
  <div className="space-y-3">
    {FUNNEL.map((step, i) => (
      <div key={step.label}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-secondary">{step.label}</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-primary font-semibold">{step.value}</span>
            <span className="text-[10px] text-text-muted">{step.pct}%</span>
          </div>
        </div>
        <div className="h-1.5 w-full rounded-full bg-elevated">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${step.pct}%` }}
            transition={{ duration: 0.7, delay: i * 0.1 }}
            className={cn("h-full rounded-full", step.color)}
          />
        </div>
      </div>
    ))}
  </div>
);

// ─── Mini project completion donut ────────────────────────────────────────────

const DonutChart: React.FC<{ pct: number; label: string; color: string }> = ({ pct, label, color }) => {
  const r = 28, cx = 36, cy = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="72" height="72">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e1e2e" strokeWidth="7" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          style={{ transition: "stroke-dasharray 0.7s ease" }}
        />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize="10" fontWeight="bold" fill={color} fontFamily="monospace">
          {pct}%
        </text>
      </svg>
      <p className="text-[10px] text-text-muted text-center leading-tight">{label}</p>
    </div>
  );
};

// ─── FreelancerAnalytics ──────────────────────────────────────────────────────

export const FreelancerAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<"monthly" | "annual">("annual");

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-muted mt-0.5">Performance insights & revenue metrics</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-1">
          {(["monthly", "annual"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-all",
                period === p ? "bg-accent/20 text-accent border border-accent/30" : "text-text-muted hover:text-text-primary"
              )}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPIS.map((k, i) => {
          const Icon = k.icon;
          const up = k.change > 0;
          return (
            <motion.div key={k.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="stat-card"
            >
              <div className="flex items-start justify-between">
                <Icon className={cn("h-4 w-4", k.color)} />
                <span className={cn(
                  "flex items-center gap-0.5 text-[10px] font-semibold",
                  up ? "text-success" : "text-error"
                )}>
                  {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {up ? "+" : ""}{k.change}{typeof k.change === "number" && Math.abs(k.change) < 10 ? "%" : ""}
                </span>
              </div>
              <div>
                <p className={cn("font-mono text-lg font-bold", k.color)}>{k.value}</p>
                <p className="text-[10px] text-text-muted leading-tight">{k.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue chart — 2 cols */}
        <div className="lg:col-span-2 glass-gold rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-accent" />
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Revenue Trend</p>
          </div>
          <RevenueChart />
        </div>

        {/* Donut metrics */}
        <div className="glass-gold rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-5">
            <Target className="h-4 w-4 text-accent" />
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Completion</p>
          </div>
          <div className="grid grid-cols-2 gap-4 place-items-center">
            <DonutChart pct={91} label="On-Time Delivery" color="#D4AF37" />
            <DonutChart pct={78} label="Client Retention" color="#10B981" />
            <DonutChart pct={37} label="Win Rate" color="#D4AF37" />
            <DonutChart pct={94} label="Satisfaction" color="#10B981" />
          </div>
        </div>
      </div>

      {/* Funnel + Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Conversion funnel */}
        <div className="glass-gold rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-4 w-4 text-accent" />
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Conversion Funnel</p>
          </div>
          <ConversionFunnel />
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-[11px] text-text-muted">
              Overall conversion: <span className="text-accent font-bold font-mono">16.7%</span> lead-to-contract
            </p>
          </div>
        </div>

        {/* Top clients */}
        <div className="glass-gold rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-4 w-4 text-accent" />
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Top Clients</p>
          </div>
          <div className="space-y-3">
            {TOP_CLIENTS.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 rounded-xl border border-border bg-elevated p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 font-bold text-accent text-xs">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{c.name}</p>
                  <p className="text-[11px] text-text-muted">{c.projects} project{c.projects > 1 ? "s" : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm font-bold text-accent">₹{c.revenue.toLocaleString("en-IN")}</p>

                  <div className="flex items-center justify-end gap-0.5 mt-0.5">
                    <Star className="h-3 w-3 fill-gold text-gold" />
                    <span className="text-[10px] text-text-muted">{c.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
