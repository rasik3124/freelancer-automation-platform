import React from "react";
import { motion } from "motion/react";
import {
  FolderOpen,
  Inbox,
  Calendar,
  CreditCard,
  TrendingUp,
  Users,
  ArrowUpRight,
  Plus,
  Clock,
  Star,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";

const stats = [
  {
    label: "Active Projects",
    value: "3",
    subtitle: "+1 from last month",
    icon: FolderOpen,
    color: "violet",
  },
  {
    label: "Proposals Received",
    value: "12",
    subtitle: "5 awaiting review",
    icon: Inbox,
    color: "accent",
  },
  {
    label: "Meetings Scheduled",
    value: "4",
    subtitle: "Next: Tomorrow 2 PM",
    icon: Calendar,
    color: "gold",
  },
  {
    label: "Total Spent",
    value: "$12,450",
    subtitle: "Last 30 days",
    icon: CreditCard,
    color: "success",
  },
];

const pipeline = [
  { stage: "New Lead", count: 2, color: "border-border text-textMuted" },
  { stage: "Contacted", count: 3, color: "border-yellow-500/40 text-yellow-400" },
  { stage: "Proposal In", count: 4, color: "border-accent/40 text-accent" },
  { stage: "Negotiation", count: 1, color: "border-violet/40 text-violet" },
  { stage: "In Progress", count: 2, color: "border-blue-500/40 text-blue-400" },
  { stage: "Completed", count: 5, color: "border-success/40 text-success" },
];

const recentActivity = [
  { id: 1, icon: Inbox, type: "proposal", title: "New proposal from Alex M.", desc: "Proposed $3,200 for the e-commerce project.", time: "2h ago", color: "text-accent" },
  { id: 2, icon: Calendar, type: "meeting", title: "Meeting scheduled with Jane K.", desc: "UX Discovery call — Mar 29 at 3 PM.", time: "5h ago", color: "text-gold" },
  { id: 3, icon: Star, type: "match", title: "New AI match found", desc: "Marcus L. is a 94% match for your web project.", time: "1d ago", color: "text-violet" },
  { id: 4, icon: FolderOpen, type: "project", title: "Project status updated", desc: "Mobile App project moved to 'In Progress'.", time: "2d ago", color: "text-blue-400" },
];

const topFreelancers = [
  { name: "Alex Martinez", role: "Full-Stack Developer", skills: ["React", "Node.js", "TypeScript"], match: 95, rating: 4.9 },
  { name: "Sarah Chen", role: "UI/UX Designer", skills: ["Figma", "Tailwind", "Framer"], match: 88, rating: 4.8 },
  { name: "James Okafor", role: "Mobile Developer", skills: ["React Native", "Swift", "Firebase"], match: 82, rating: 4.7 },
];

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-display font-bold text-textPrimary">
            Welcome back, {user?.fullName?.split(" ")[0]}!
          </h2>
          <p className="text-textMuted">Here's what's happening with your projects today.</p>
        </div>
        <Button variant="primary" className="gap-2" onClick={() => navigate(ROUTES.CLIENT_PROJECTS)}>
          <Plus className="h-4 w-4" />
          Post a Project
        </Button>
      </div>

      {/* AI Briefing */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-card border border-accent/20 bg-accent/5 p-6"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-textPrimary">AI Project Briefing</h3>
              <button className="text-xs font-bold text-accent hover:underline">Regenerate</button>
            </div>
            <p className="mt-2 text-sm text-textMuted leading-relaxed">
              You have <span className="font-bold text-textPrimary">3 active projects</span> with a combined{" "}
              <span className="font-bold text-accent">12 proposals received</span>. Top match Alex M. has a{" "}
              <span className="font-bold text-success">95% compatibility score</span> for your e-commerce project.
              Consider scheduling interviews this week to maintain momentum.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="group relative overflow-hidden rounded-card border border-border bg-surface/50 p-6 transition-all hover:border-accent/30 hover:bg-surface"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                <stat.icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-success" />
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm font-medium text-textMuted">{stat.label}</p>
              <h3 className="text-2xl font-bold text-textPrimary">{stat.value}</h3>
              <p className="text-xs text-textDisabled">{stat.subtitle}</p>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-accent/5 blur-2xl transition-all group-hover:bg-accent/10" />
          </motion.div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="space-y-4">
        <h3 className="text-xl font-display font-bold text-textPrimary">CRM Pipeline</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {pipeline.map((stage, i) => (
            <motion.div
              key={stage.stage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                "flex min-w-[120px] flex-col items-center gap-2 rounded-card border p-4 text-center flex-shrink-0",
                stage.color
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                Stage {i + 1}
              </span>
              <span className="text-2xl font-bold">{stage.count}</span>
              <span className="text-[10px] font-medium">{stage.stage}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-textPrimary">Recent Activity</h3>
            <button className="text-sm font-medium text-accent hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-start gap-4 rounded-card border border-border bg-surface/30 p-4 transition-all hover:bg-surface/50"
              >
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-elevated", item.color)}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-textPrimary">{item.title}</h4>
                    <span className="flex items-center gap-1 text-xs text-textDisabled">
                      <Clock className="h-3 w-3" />
                      {item.time}
                    </span>
                  </div>
                  <p className="text-xs text-textMuted">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-textPrimary">Top Matches</h3>
            <button className="text-sm font-medium text-accent hover:underline" onClick={() => navigate(ROUTES.CLIENT_FREELANCERS)}>
              Find more
            </button>
          </div>
          <div className="space-y-3">
            {topFreelancers.map((f, i) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="rounded-card border border-border bg-surface/30 p-4 space-y-3 hover:bg-surface/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent font-bold text-sm">
                    {f.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-textPrimary truncate">{f.name}</h4>
                    <p className="text-xs text-textMuted truncate">{f.role}</p>
                  </div>
                  <div className={cn(
                    "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                    f.match >= 90 ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
                  )}>
                    {f.match}%
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {f.skills.map((s) => (
                    <span key={s} className="rounded-full bg-elevated px-2 py-0.5 text-[10px] text-textMuted">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gold text-xs">
                    <Star className="h-3 w-3 fill-gold" />
                    <span className="font-bold">{f.rating}</span>
                  </div>
                  <button className="text-xs font-bold text-accent hover:underline">
                    View Profile →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
