import React, { useState } from "react";
import { motion } from "motion/react";
import { Search, Zap, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import api from "../services/api";

export const LeadAnalyzer: React.FC = () => {
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    setIsLoading(true);
    try {
      const response = await api.post("/leads/analyze", { description });
      setResult(response.data.data);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-display font-bold text-textPrimary">Lead Analyzer</h2>
        <p className="text-textMuted">Paste a project description to get AI-powered feasibility insights.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-card border border-border bg-surface/50 p-6">
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-textMuted">Project Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Paste the job posting or project requirements here..."
                  className="h-64 w-full rounded-input bg-base border border-border p-4 text-sm text-textPrimary focus:outline-none focus:border-accent transition-all"
                />
              </div>
              <Button variant="primary" className="w-full gap-2" isLoading={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Analyze Lead
              </Button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          {result ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="rounded-card border border-accent/20 bg-accent/5 p-6 shadow-glow">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-textPrimary">{result.projectName}</h3>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent text-accent font-bold">
                    {result.score}%
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-base/50 p-3">
                    <p className="text-[10px] font-bold uppercase text-textDisabled">Feasibility</p>
                    <p className="text-sm font-bold text-success">{result.feasibility}</p>
                  </div>
                  <div className="rounded-lg bg-base/50 p-3">
                    <p className="text-[10px] font-bold uppercase text-textDisabled">Estimated Effort</p>
                    <p className="text-sm font-bold text-textPrimary">{result.estimatedEffort}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-card border border-border bg-surface/50 p-6">
                <h4 className="flex items-center gap-2 text-sm font-bold text-textPrimary">
                  <Zap className="h-4 w-4 text-accent" />
                  AI Recommendation
                </h4>
                <p className="mt-3 text-sm text-textMuted leading-relaxed">
                  {result.aiRecommendation}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-card border border-border bg-surface/50 p-6">
                  <h4 className="text-xs font-bold uppercase text-textDisabled">Tech Stack</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.techStack.map((tech: string) => (
                      <span key={tech} className="rounded-full bg-accent/10 px-3 py-1 text-[10px] font-bold text-accent">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-card border border-border bg-surface/50 p-6">
                  <h4 className="text-xs font-bold uppercase text-textDisabled">Risk Factors</h4>
                  <ul className="mt-3 space-y-2">
                    {result.riskFactors.map((risk: string) => (
                      <li key={risk} className="flex items-center gap-2 text-xs text-textMuted">
                        <AlertCircle className="h-3 w-3 text-error" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-card border border-dashed border-border text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-textDisabled">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="mt-4 font-bold text-textMuted">No Analysis Yet</h3>
              <p className="mt-2 text-sm text-textDisabled">Enter a project description to see AI insights.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
