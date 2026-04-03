import React from "react";
import { motion } from "motion/react";
import { FolderOpen, Plus } from "lucide-react";
import { Button } from "../../components/ui/Button";

export const ClientProjects: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-display font-bold text-textPrimary">My Projects</h2>
        <p className="text-sm text-textMuted mt-1">Manage and track all your active projects.</p>
      </div>
      <Button variant="primary" className="gap-2">
        <Plus className="h-4 w-4" /> Post New Project
      </Button>
    </div>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface/30 py-24 text-center"
    >
      <FolderOpen className="h-12 w-12 text-textDisabled mb-4" />
      <h3 className="text-lg font-bold text-textPrimary">No projects yet</h3>
      <p className="mt-2 text-sm text-textMuted">Post your first project to start receiving proposals.</p>
      <Button variant="primary" className="mt-6 gap-2">
        <Plus className="h-4 w-4" /> Post a Project
      </Button>
    </motion.div>
  </div>
);

export const ClientFreelancers: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-display font-bold text-textPrimary">Find Freelancers</h2>
      <p className="text-sm text-textMuted mt-1">Discover and connect with top talent.</p>
    </div>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface/30 py-24 text-center"
    >
      <p className="text-textMuted text-sm">Freelancer discovery coming soon.</p>
    </motion.div>
  </div>
);

export const ClientProposals: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-display font-bold text-textPrimary">Proposals Received</h2>
      <p className="text-sm text-textMuted mt-1">Review and respond to freelancer proposals.</p>
    </div>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface/30 py-24 text-center"
    >
      <p className="text-textMuted text-sm">No proposals received yet.</p>
    </motion.div>
  </div>
);

export const ClientMeetings: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-display font-bold text-textPrimary">Meetings</h2>
        <p className="text-sm text-textMuted mt-1">Schedule and manage your meetings.</p>
      </div>
      <Button variant="primary" className="gap-2">
        <Plus className="h-4 w-4" /> Schedule Meeting
      </Button>
    </div>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface/30 py-24 text-center"
    >
      <p className="text-textMuted text-sm">No meetings scheduled yet.</p>
    </motion.div>
  </div>
);

export const ClientMessages: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-display font-bold text-textPrimary">Messages</h2>
      <p className="text-sm text-textMuted mt-1">Chat with freelancers on your projects.</p>
    </div>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface/30 py-24 text-center"
    >
      <p className="text-textMuted text-sm">No messages yet. Start a conversation with a freelancer.</p>
    </motion.div>
  </div>
);

export const ClientInvoices: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-display font-bold text-textPrimary">Invoices</h2>
      <p className="text-sm text-textMuted mt-1">Track and manage your payment history.</p>
    </div>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface/30 py-24 text-center"
    >
      <p className="text-textMuted text-sm">No invoices yet.</p>
    </motion.div>
  </div>
);

export const ClientSettings: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-display font-bold text-textPrimary">Settings</h2>
      <p className="text-sm text-textMuted mt-1">Manage your account and preferences.</p>
    </div>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-card border border-border bg-surface/30 p-8"
    >
      <p className="text-textMuted text-sm">Account settings coming soon.</p>
    </motion.div>
  </div>
);
