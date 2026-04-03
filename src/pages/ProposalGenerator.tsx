import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileText, Plus, Send, Download, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import api from "../services/api";
import { cn } from "../lib/utils";

export const ProposalGenerator: React.FC = () => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newProposal, setNewProposal] = useState({ title: "", clientName: "" });

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await api.get("/proposals");
        setProposals(response.data.data);
      } catch (error) {
        console.error("Failed to fetch proposals:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProposals();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProposal.title || !newProposal.clientName) return;

    setIsGenerating(true);
    try {
      const response = await api.post("/proposals/generate", newProposal);
      setProposals([response.data.data, ...proposals]);
      setNewProposal({ title: "", clientName: "" });
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-display font-bold text-textPrimary">Proposal Generator</h2>
          <p className="text-textMuted">Create professional project proposals in minutes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-card border border-border bg-surface/50 p-6">
            <h3 className="text-lg font-bold text-textPrimary mb-6">Generate New</h3>
            <form onSubmit={handleGenerate} className="space-y-6">
              <Input
                label="Project Title"
                placeholder="e.g. E-commerce Website"
                value={newProposal.title}
                onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
              />
              <Input
                label="Client Name"
                placeholder="e.g. Acme Corp"
                value={newProposal.clientName}
                onChange={(e) => setNewProposal({ ...newProposal, clientName: e.target.value })}
              />
              <Button variant="primary" className="w-full gap-2" isLoading={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Generate Proposal
              </Button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-textPrimary">Recent Proposals</h3>
          <div className="space-y-4">
            {isLoading ? (
              [1, 2].map(i => <div key={i} className="h-24 animate-pulse rounded-card bg-surface/50 border border-border" />)
            ) : (
              proposals.map((proposal, index) => (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between rounded-card border border-border bg-surface/30 p-6 transition-all hover:bg-surface/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet/10 text-violet">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-textPrimary">{proposal.title}</h4>
                      <p className="text-xs text-textMuted">{proposal.clientName} • ${proposal.totalBudget.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                      proposal.status === "Accepted" ? "bg-success/10 text-success" : "bg-gold/10 text-gold"
                    )}>
                      {proposal.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <button className="rounded-lg p-2 text-textDisabled hover:bg-base hover:text-textPrimary transition-colors">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg p-2 text-textDisabled hover:bg-base hover:text-textPrimary transition-colors">
                        <Send className="h-4 w-4" />
                      </button>
                      <button className="rounded-lg p-2 text-textDisabled hover:bg-base hover:text-textPrimary transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
