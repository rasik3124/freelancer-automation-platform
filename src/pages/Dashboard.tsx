import React from "react";
import { motion } from "motion/react";
import { 
  TrendingUp, 
  Users, 
  FileCheck, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  MoreVertical,
  Plus,
  Calendar
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";

const stats = [
  { label: "Total Revenue", value: 12450, change: "+12.5%", trend: "up", icon: TrendingUp },
  { label: "Active Leads", value: 24, change: "+4.2%", trend: "up", icon: Users },
  { label: "Proposals Sent", value: 18, change: "-2.1%", trend: "down", icon: FileCheck },
  { label: "Meeting Hours", value: 42, change: "+18.7%", trend: "up", icon: Clock },
];

const recentActivity = [
  { id: 1, type: "lead", title: "New Lead: FinTech App", description: "AI analysis completed with 85% feasibility score.", time: "2 hours ago" },
  { id: 2, type: "proposal", title: "Proposal Accepted: E-commerce Redesign", description: "Client accepted the proposal for ₹4,500.", time: "5 hours ago" },

  { id: 3, type: "meeting", title: "Meeting Scheduled: Project Kickoff", description: "Meeting with Sarah J. tomorrow at 10:00 AM.", time: "1 day ago" },
  { id: 4, type: "lead", title: "Lead Analyzed: SaaS Dashboard", description: "AI recommendation: High priority lead.", time: "2 days ago" },
];

const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN")}`;


export const Dashboard: React.FC = () => {
  const { user } = useAuth();


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-display font-bold text-textPrimary">Welcome back, {user?.fullName?.split(' ')[0]}!</h2>
          <p className="text-textMuted">Here's what's happening with your business today.</p>
        </div>
        <Button variant="gold" className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative overflow-hidden rounded-card border border-border bg-surface/50 p-6 transition-all hover:border-violet/30 hover:bg-surface"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet/10 text-violet transition-colors group-hover:bg-violet group-hover:text-white">
                <stat.icon className="h-5 w-5" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold",
                stat.trend === "up" ? "text-success" : "text-error"
              )}>
                {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {stat.change}
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm font-medium text-textMuted">{stat.label}</p>
              <h3 className="text-2xl font-bold text-textPrimary">
                {stat.label.includes("Revenue") ? formatCurrency(stat.value) : stat.value}
              </h3>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-violet/5 blur-2xl transition-all group-hover:bg-violet/10" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-textPrimary">Recent Activity</h3>
            <button className="text-sm font-medium text-violet hover:underline">View all</button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-start gap-4 rounded-card border border-border bg-surface/30 p-4 transition-all hover:bg-surface/50"
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  activity.type === "lead" ? "bg-violet/10 text-violet" :
                  activity.type === "proposal" ? "bg-success/10 text-success" :
                  "bg-gold/10 text-gold"
                )}>
                  {activity.type === "lead" ? <Users className="h-5 w-5" /> :
                   activity.type === "proposal" ? <FileCheck className="h-5 w-5" /> :
                   <Calendar className="h-5 w-5" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-textPrimary">{activity.title}</h4>
                    <span className="text-xs text-textDisabled">{activity.time}</span>
                  </div>
                  <p className="text-xs text-textMuted leading-relaxed">{activity.description}</p>
                </div>
                <button className="text-textDisabled hover:text-textPrimary transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-display font-bold text-textPrimary">AI Insights</h3>
          <div className="rounded-card border border-violet/20 bg-violet/5 p-6 shadow-glow">
            <div className="flex items-center gap-3 text-violet">
              <TrendingUp className="h-5 w-5" />
              <h4 className="font-bold">Growth Potential</h4>
            </div>
            <p className="mt-3 text-sm text-textMuted leading-relaxed">
              Based on your recent proposal success rate, you could increase your hourly rate by <span className="font-bold text-violet">15%</span> without affecting conversion.
            </p>
            <Button variant="primary" size="sm" className="mt-4 w-full">
              Optimize Pricing
            </Button>
          </div>

          <div className="rounded-card border border-gold/20 bg-gold/5 p-6 shadow-goldGlow">
            <div className="flex items-center gap-3 text-gold">
              <Users className="h-5 w-5" />
              <h4 className="font-bold">Lead Alert</h4>
            </div>
            <p className="mt-3 text-sm text-textMuted leading-relaxed">
              A high-value lead matching your "Expert" React skills just appeared. AI feasibility score: <span className="font-bold text-gold">92%</span>.
            </p>
            <Button variant="gold" size="sm" className="mt-4 w-full">
              Analyze Lead
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
