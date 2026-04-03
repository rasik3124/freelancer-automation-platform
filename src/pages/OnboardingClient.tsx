import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Building2, Users, Target, Rocket } from "lucide-react";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../constants";

export const OnboardingClient: React.FC = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1 — Company
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");

  // Step 2 — Hiring needs
  const [projectType, setProjectType] = useState("");
  const [budget, setBudget] = useState("");

  // Step 3 — Team preferences
  const [teamSize, setTeamSize] = useState("");
  const [communication, setCommunication] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.updateProfile({
        companyName,
        industry,
        companyDescription,
        primaryProjectType: projectType,
        estimatedBudget: budget,
        teamSize: Number(teamSize),
        preferredCommunication: communication,
        onboardingComplete: true,
      });
      completeOnboarding();
      navigate(ROUTES.DASHBOARD_CLIENT);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="mb-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent shadow-glow mb-6">
            <Rocket className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-display font-bold text-textPrimary mb-4">
            Welcome to Crescent Black
          </h1>
          <p className="text-textMuted">
            Let's set up your client workspace to start hiring high-quality talent.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl">
          {/* Progress Bar */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-accent shadow-glow" : "bg-border"
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-error/10 border border-error/20 p-4 text-sm text-error">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ── Step 1: Company Details ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-textPrimary flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-accent" />
                  Company Details
                </h2>
                <Input
                  label="Company Name"
                  placeholder="e.g. Acme Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <Input
                  label="Industry"
                  placeholder="e.g. Technology, Healthcare..."
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-textMuted">
                    About the Company
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-border bg-base p-4 text-sm text-textPrimary focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all min-h-[120px]"
                    placeholder="Tell freelancers about your company..."
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                  />
                </div>
                <Button variant="primary" className="w-full" onClick={() => setStep(2)}>
                  Next Step
                </Button>
              </motion.div>
            )}

            {/* ── Step 2: Hiring Needs ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-textPrimary flex items-center gap-2">
                  <Target className="h-5 w-5 text-accent" />
                  Hiring Needs
                </h2>
                <Input
                  label="Primary Project Type"
                  placeholder="e.g. Web Development, Design..."
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                />
                <Input
                  label="Estimated Budget Range"
                  placeholder="e.g. $5k - $10k"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button variant="primary" className="flex-1" onClick={() => setStep(3)}>
                    Next Step
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Team & Preferences ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-textPrimary flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  Team & Preferences
                </h2>
                <Input
                  label="Team Size"
                  type="number"
                  placeholder="10"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                />
                <Input
                  label="Preferred Communication"
                  placeholder="e.g. Slack, Email..."
                  value={communication}
                  onChange={(e) => setCommunication(e.target.value)}
                />
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleComplete}
                    isLoading={isLoading}
                  >
                    Complete Setup
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
