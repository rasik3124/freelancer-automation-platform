/**
 * FreelancerOnboarding — 9-Step flow
 *
 * Step 1: Professional Info     (title, bio)
 * Step 2: Skills & Expertise    (skills, specialisation)
 * Step 3: Portfolio & Links     (portfolio URL, LinkedIn, GitHub)
 * Step 4: Experience & Rates    (years experience, hourly rate)
 * Step 5: Service Categories    (what kind of work)
 * Step 6: Project Preferences   (project size, duration)
 * Step 7: Availability          (hours/week, timezone, start date)
 * Step 8: Work Type             ← THIS IS THE TEAM/INDIVIDUAL STEP
 * Step 9: Review & Submit
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Globe,
  Briefcase,
  Code,
  Rocket,
  Users,
  User,
  Plus,
  Trash2,
  DollarSign,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../constants";
import { cn } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type WorkType = "individual" | "team";

const MEMBER_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Fullstack Developer",
  "UI/UX Designer",
  "DevOps Engineer",
  "QA Engineer",
  "Project Manager",
  "Data Scientist",
  "Mobile Developer",
  "Other",
];

const MEMBER_EXPERIENCE_OPTIONS = [
  "0-1 years",
  "1-2 years",
  "2-5 years",
  "5-8 years",
  "8+ years",
];

const MEMBER_SKILL_SUGGESTIONS = [
  "React", "Vue", "Angular", "Next.js", "TypeScript", "JavaScript",
  "Node.js", "Python", "Django", "FastAPI", "PostgreSQL", "MongoDB",
  "Docker", "Kubernetes", "AWS", "GCP", "Figma", "Tailwind CSS",
];

interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: string[];
  experience: string;
  skillInput: string; // live tag input value
}

const emptyMember = (): TeamMember => ({
  id: crypto.randomUUID(),
  name: "",
  role: "",
  skills: [],
  experience: "",
  skillInput: "",
});

// ─── Step 8 validation ────────────────────────────────────────────────────────

interface ValidationError {
  field: string;
  message: string;
}

function validateStep8(
  workType: WorkType,
  teamName: string,
  teamMembers: TeamMember[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (workType === "team") {
    if (!teamName.trim()) {
      errors.push({ field: "teamName", message: "Team name is required." });
    }
    if (teamMembers.length < 2) {
      errors.push({ field: "memberCount", message: "A team must have at least 2 members." });
    }
    teamMembers.forEach((m, i) => {
      if (!m.name.trim()) errors.push({ field: `member-${i}-name`, message: `Member #${i + 1}: name is required.` });
      if (!m.role) errors.push({ field: `member-${i}-role`, message: `Member #${i + 1}: role is required.` });
      if (m.skills.length === 0) errors.push({ field: `member-${i}-skills`, message: `Member #${i + 1}: at least one skill is required.` });
      if (!m.experience) errors.push({ field: `member-${i}-experience`, message: `Member #${i + 1}: experience is required.` });
    });
  }

  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const OnboardingFreelancer: React.FC = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 9;

  // ── Step 1: Professional Info ─────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");

  // ── Step 2: Skills & Expertise ────────────────────────────────────────────
  const [skills, setSkills] = useState("");
  const [specialisation, setSpecialisation] = useState("");

  // ── Step 3: Portfolio & Links ─────────────────────────────────────────────
  const [portfolio, setPortfolio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");

  // ── Step 4: Experience & Rates ────────────────────────────────────────────
  const [yearsExperience, setYearsExperience] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  // ── Step 5: Service Categories ────────────────────────────────────────────
  const [categories, setCategories] = useState<string[]>([]);
  const ALL_CATEGORIES = [
    "Web Development", "Mobile Development", "UI/UX Design", "DevOps",
    "Data Science", "AI/ML", "QA Testing", "Technical Writing", "Other",
  ];

  // ── Step 6: Project Preferences ───────────────────────────────────────────
  const [projectSize, setProjectSize] = useState<"small" | "medium" | "large" | "">("");
  const [duration, setDuration] = useState<"short" | "medium" | "long" | "">("");

  // ── Step 7: Availability ──────────────────────────────────────────────────
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [timezone, setTimezone] = useState("");
  const [startDate, setStartDate] = useState<"immediately" | "2weeks" | "1month" | "">("");

  // ── Step 8: Work Type ─────────────────────────────────────────────────────
  const [workType, setWorkType] = useState<WorkType>("individual");
  const [teamName, setTeamName] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([emptyMember(), emptyMember()]);
  const [step8Errors, setStep8Errors] = useState<ValidationError[]>([]);

  // ── Global ────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // ─── Team member helpers ──────────────────────────────────────────────────

  const addMember = () =>
    setTeamMembers((prev) => [...prev, emptyMember()]);

  const removeMember = (id: string) =>
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));

  const updateMember = (id: string, field: keyof TeamMember, value: unknown) =>
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );

  /** Add a skill tag on Enter or comma */
  const handleSkillKeyDown = (id: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const member = teamMembers.find((m) => m.id === id);
      const val = member?.skillInput.trim();
      if (val && !member?.skills.includes(val)) {
        updateMember(id, "skills", [...(member?.skills ?? []), val]);
        updateMember(id, "skillInput", "");
      }
    }
    if (e.key === "Backspace") {
      const member = teamMembers.find((m) => m.id === id);
      if (!member?.skillInput && member && member.skills.length > 0) {
        updateMember(id, "skills", member.skills.slice(0, -1));
      }
    }
  };

  const removeSkillTag = (id: string, skill: string) => {
    const member = teamMembers.find((m) => m.id === id);
    if (member) {
      updateMember(id, "skills", member.skills.filter((s) => s !== skill));
    }
  };

  // ─── Step 8 → Step 9 (validate before proceeding) ────────────────────────
  const handleStep8Next = () => {
    const errors = validateStep8(workType, teamName, teamMembers);
    setStep8Errors(errors);
    if (errors.length === 0) {
      setStep(9);
    }
  };

  const hasError = (field: string) =>
    step8Errors.some((e) => e.field === field);

  // ─── Final submission ─────────────────────────────────────────────────────
  const handleComplete = async () => {
    setIsLoading(true);
    setGlobalError(null);

    try {
      await authService.updateProfile({
        professionalTitle: title,
        bio,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        specialisation,
        portfolioUrl: portfolio,
        linkedinUrl: linkedin,
        githubUrl: github,
        yearsOfExperience: Number(yearsExperience),
        hourlyRate: Number(hourlyRate),
        serviceCategories: categories,
        preferredProjectSize: projectSize,
        preferredDuration: duration,
        hoursPerWeek: Number(hoursPerWeek),
        timezone,
        availableFrom: startDate,
        workType,
        teamName: workType === "team" ? teamName : null,
        teamMembers:
          workType === "team"
            ? teamMembers.map(({ id: _id, skillInput: _si, ...m }) => m)
            : [],
        onboardingComplete: true,
      });
      completeOnboarding();
      navigate(ROUTES.DASHBOARD_FREELANCER, { replace: true });
    } catch (err: any) {
      setGlobalError(err.response?.data?.error || "Failed to complete onboarding. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Progress bar ─────────────────────────────────────────────────────────
  const ProgressBar = () => (
    <div className="mb-8 space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i + 1 < step
                ? "bg-success"
                : i + 1 === step
                ? "bg-accent shadow-glow"
                : "bg-border"
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-textMuted font-mono">
          Step {step} of {TOTAL_STEPS}
        </span>
        <span className="text-xs font-bold text-accent">
          {Math.round(((step - 1) / TOTAL_STEPS) * 100)}% Complete
        </span>
      </div>
    </div>
  );

  // ─── Navigation helpers ───────────────────────────────────────────────────
  const NavButtons = ({
    onNext,
    onBack,
    nextLabel = "Next Step",
    nextLoading = false,
    nextDisabled = false,
  }: {
    onNext: () => void;
    onBack: () => void;
    nextLabel?: string;
    nextLoading?: boolean;
    nextDisabled?: boolean;
  }) => (
    <div className="flex gap-4 pt-2">
      <Button variant="outline" className="flex-1" onClick={onBack} disabled={nextLoading}>
        ← Back
      </Button>
      <Button
        variant="primary"
        className="flex-1"
        onClick={onNext}
        isLoading={nextLoading}
        disabled={nextDisabled || nextLoading}
      >
        {nextLabel}
      </Button>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent shadow-glow mb-5">
            <Rocket className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-display font-bold text-textPrimary mb-3">
            Complete Your Profile
          </h1>
          <p className="text-textMuted">
            Set up your freelancer workspace to start finding high-quality leads.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl">
          <ProgressBar />

          {globalError && (
            <div className="mb-6 flex items-start gap-3 rounded-lg bg-error/10 border border-error/20 p-4">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-error" />
              <p className="text-xs font-medium text-error">{globalError}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ─────────────── STEP 1: Professional Info ─────────────────── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <h2 className="flex items-center gap-2 text-xl font-bold text-textPrimary">
                  <Briefcase className="h-5 w-5 text-accent" />
                  Professional Info
                </h2>
                <Input
                  label="Professional Title"
                  placeholder="e.g. Senior Fullstack Developer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-textMuted">
                    Bio
                  </label>
                  <textarea
                    className="min-h-[120px] w-full rounded-xl border border-border bg-base p-4 text-sm text-textPrimary focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all"
                    placeholder="Tell clients about your expertise and what makes you unique..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => setStep(2)}
                >
                  Next Step →
                </Button>
              </motion.div>
            )}

            {/* ─────────────── STEP 2: Skills ─────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <h2 className="flex items-center gap-2 text-xl font-bold text-textPrimary">
                  <Code className="h-5 w-5 text-accent" />
                  Skills & Expertise
                </h2>
                <Input
                  label="Primary Skills (comma separated)"
                  placeholder="React, Node.js, TypeScript, PostgreSQL..."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-textMuted">
                    Primary Specialisation
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-base p-3 text-sm text-textPrimary focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
                    value={specialisation}
                    onChange={(e) => setSpecialisation(e.target.value)}
                  >
                    <option value="">Select a specialisation...</option>
                    {["Frontend", "Backend", "Fullstack", "Mobile", "DevOps", "Design", "Data"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <NavButtons onNext={() => setStep(3)} onBack={() => setStep(1)} />
              </motion.div>
            )}

            {/* ─────────────── STEP 3: Portfolio ──────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <h2 className="flex items-center gap-2 text-xl font-bold text-textPrimary">
                  <Globe className="h-5 w-5 text-accent" />
                  Portfolio & Links
                </h2>
                <Input
                  label="Portfolio URL"
                  placeholder="https://yourportfolio.com"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                />
                <Input
                  label="LinkedIn Profile"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
                <Input
                  label="GitHub Profile"
                  placeholder="https://github.com/username"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                />
                <NavButtons onNext={() => setStep(4)} onBack={() => setStep(2)} />
              </motion.div>
            )}

            {/* ─────────────── STEP 4: Experience & Rates ─────────────────── */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <h2 className="flex items-center gap-2 text-xl font-bold text-textPrimary">
                  <DollarSign className="h-5 w-5 text-accent" />
                  Experience & Rates
                </h2>
                <Input
                  label="Years of Experience"
                  type="number"
                  placeholder="5"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                />
                <Input
                  label="Hourly Rate (USD)"
                  type="number"
                  placeholder="75"
                  icon={<DollarSign className="h-4 w-4" />}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
                <NavButtons onNext={() => setStep(5)} onBack={() => setStep(3)} />
              </motion.div>
            )}

            {/* ─────────────── STEP 5: Service Categories ─────────────────── */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <h2 className="flex items-center gap-2 text-xl font-bold text-textPrimary">
                  <Briefcase className="h-5 w-5 text-accent" />
                  Service Categories
                </h2>
                <p className="text-sm text-textMuted">Select all categories that apply to your work.</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ALL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setCategories((prev) =>
                          prev.includes(cat)
                            ? prev.filter((c) => c !== cat)
                            : [...prev, cat]
                        )
                      }
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-xs font-bold transition-all",
                        categories.includes(cat)
                          ? "border-accent bg-accent/10 text-accent shadow-glow"
                          : "border-border bg-base text-textMuted hover:border-textDisabled"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <NavButtons onNext={() => setStep(6)} onBack={() => setStep(4)} />
              </motion.div>
            )}

            {/* ─────────────── STEP 6: Project Preferences ─────────────────── */}
            {step === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <h2 className="flex items-center gap-2 text-xl font-bold text-textPrimary">
                  <Clock className="h-5 w-5 text-accent" />
                  Project Preferences
                </h2>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-textMuted">
                    Preferred Project Size
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["small", "medium", "large"] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setProjectSize(size)}
                        className={cn(
                          "rounded-xl border py-4 text-xs font-bold capitalize transition-all",
                          projectSize === size
                            ? "border-accent bg-accent/10 text-accent shadow-glow"
                            : "border-border bg-base text-textMuted hover:border-textDisabled"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-textMuted">
                    Preferred Duration
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: "short", label: "< 1 Month" },
                      { key: "medium", label: "1–3 Months" },
                      { key: "long", label: "3+ Months" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDuration(key as any)}
                        className={cn(
                          "rounded-xl border py-4 text-xs font-bold transition-all",
                          duration === key
                            ? "border-accent bg-accent/10 text-accent shadow-glow"
                            : "border-border bg-base text-textMuted hover:border-textDisabled"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <NavButtons onNext={() => setStep(7)} onBack={() => setStep(5)} />
              </motion.div>
            )}

            {/* ─────────────── STEP 7: Availability ───────────────────────── */}
            {step === 7 && (
              <motion.div
                key="step-7"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <h2 className="flex items-center gap-2 text-xl font-bold text-textPrimary">
                  <Calendar className="h-5 w-5 text-accent" />
                  Availability
                </h2>

                <Input
                  label="Hours Available Per Week"
                  type="number"
                  placeholder="40"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(e.target.value)}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-textMuted">
                    Timezone
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-base p-3 text-sm text-textPrimary focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option value="">Select your timezone...</option>
                    {[
                      "UTC-8 (PST)", "UTC-5 (EST)", "UTC+0 (GMT)",
                      "UTC+1 (CET)", "UTC+5:30 (IST)", "UTC+8 (SGT)", "UTC+9 (JST)",
                    ].map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-textMuted">
                    Available to Start
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: "immediately", label: "Immediately" },
                      { key: "2weeks", label: "In 2 Weeks" },
                      { key: "1month", label: "In 1 Month+" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setStartDate(key as any)}
                        className={cn(
                          "rounded-xl border py-4 text-xs font-bold transition-all",
                          startDate === key
                            ? "border-accent bg-accent/10 text-accent shadow-glow"
                            : "border-border bg-base text-textMuted hover:border-textDisabled"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <NavButtons onNext={() => setStep(8)} onBack={() => setStep(6)} />
              </motion.div>
            )}

            {/* ─────────────── STEP 8: Work Type ──────────────────────────── */}
            {step === 8 && (
              <motion.div
                key="step-8"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <h2 className="flex items-center gap-2 text-xl font-bold text-textPrimary">
                  <Users className="h-5 w-5 text-accent" />
                  How do you work?
                </h2>

                {/* ── Radio Options ── */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setWorkType("individual");
                      setStep8Errors([]);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition-all",
                      workType === "individual"
                        ? "border-accent bg-accent/10 text-accent shadow-glow"
                        : "border-border bg-base text-textMuted hover:border-textDisabled hover:bg-elevated/30"
                    )}
                    aria-pressed={workType === "individual"}
                  >
                    <User className="h-8 w-8" />
                    <div>
                      <p className="font-bold">Individual Freelancer</p>
                      <p className="mt-1 text-[10px] opacity-70 leading-relaxed">
                        I work solo on projects.
                      </p>
                    </div>
                    {workType === "individual" && (
                      <CheckCircle className="h-4 w-4 text-accent" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWorkType("team");
                      setStep8Errors([]);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-xl border p-6 text-center transition-all",
                      workType === "team"
                        ? "border-accent bg-accent/10 text-accent shadow-glow"
                        : "border-border bg-base text-textMuted hover:border-textDisabled hover:bg-elevated/30"
                    )}
                    aria-pressed={workType === "team"}
                  >
                    <Users className="h-8 w-8" />
                    <div>
                      <p className="font-bold">Team / Agency</p>
                      <p className="mt-1 text-[10px] opacity-70 leading-relaxed">
                        I work with a team on projects.
                      </p>
                    </div>
                    {workType === "team" && (
                      <CheckCircle className="h-4 w-4 text-accent" />
                    )}
                  </button>
                </div>

                {/* ── Team Fields (conditionally rendered when workType === "team") ── */}
                <AnimatePresence>
                  {workType === "team" && (
                    <motion.div
                      key="team-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden space-y-6"
                    >
                      {/* Team Name */}
                      <div className="space-y-1.5">
                        <label className={cn(
                          "text-xs font-bold uppercase tracking-widest",
                          hasError("teamName") ? "text-error" : "text-textMuted"
                        )}>
                          Team Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Pixel Lab Studio"
                          value={teamName}
                          onChange={(e) => {
                            setTeamName(e.target.value);
                            setStep8Errors((prev) => prev.filter((e) => e.field !== "teamName"));
                          }}
                          className={cn(
                            "w-full rounded-xl border bg-base p-3 text-sm text-textPrimary focus:outline-none focus:ring-4 transition-all",
                            hasError("teamName")
                              ? "border-error focus:border-error focus:ring-error/10"
                              : "border-border focus:border-accent focus:ring-accent/10"
                          )}
                        />
                        {hasError("teamName") && (
                          <p className="text-xs text-error">
                            {step8Errors.find((e) => e.field === "teamName")?.message}
                          </p>
                        )}
                      </div>

                      {/* Number of Members */}
                      <div className="space-y-1.5">
                        <label className={cn(
                          "text-xs font-bold uppercase tracking-widest",
                          hasError("memberCount") ? "text-error" : "text-textMuted"
                        )}>
                          Number of Members * (min. 2)
                        </label>
                        <input
                          type="number"
                          min={2}
                          value={teamMembers.length}
                          onChange={(e) => {
                            const n = Math.max(2, Number(e.target.value));
                            setTeamMembers((prev) => {
                              if (n > prev.length) {
                                return [...prev, ...Array.from({ length: n - prev.length }, emptyMember)];
                              }
                              return prev.slice(0, n);
                            });
                            setStep8Errors((prev) => prev.filter((e) => e.field !== "memberCount"));
                          }}
                          className={cn(
                            "w-full rounded-xl border bg-base p-3 text-sm text-textPrimary focus:outline-none focus:ring-4 transition-all",
                            hasError("memberCount")
                              ? "border-error focus:border-error focus:ring-error/10"
                              : "border-border focus:border-accent focus:ring-accent/10"
                          )}
                        />
                      </div>

                      {/* Dynamic Member Cards */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest text-textMuted">
                            Team Members
                          </span>
                          <button
                            type="button"
                            onClick={addMember}
                            className="flex items-center gap-1 text-xs font-bold text-accent hover:underline"
                          >
                            <Plus className="h-3 w-3" />
                            Add Member
                          </button>
                        </div>

                        {teamMembers.map((member, i) => (
                          <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="rounded-xl border border-border bg-base p-5 space-y-4"
                          >
                            {/* Card header */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-accent uppercase tracking-widest">
                                Member #{i + 1}
                              </span>
                              {teamMembers.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeMember(member.id)}
                                  aria-label={`Remove member ${i + 1}`}
                                  className="flex items-center gap-1 text-xs font-medium text-error hover:text-error/80 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Remove
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              {/* Member Name */}
                              <div className="space-y-1.5">
                                <label className={cn(
                                  "text-xs font-bold uppercase tracking-widest",
                                  hasError(`member-${i}-name`) ? "text-error" : "text-textMuted"
                                )}>
                                  Name *
                                </label>
                                <input
                                  type="text"
                                  placeholder="Jane Doe"
                                  value={member.name}
                                  onChange={(e) => {
                                    updateMember(member.id, "name", e.target.value);
                                    setStep8Errors((prev) => prev.filter((err) => err.field !== `member-${i}-name`));
                                  }}
                                  className={cn(
                                    "w-full rounded-xl border bg-elevated p-3 text-sm text-textPrimary focus:outline-none focus:ring-4 transition-all",
                                    hasError(`member-${i}-name`)
                                      ? "border-error focus:border-error focus:ring-error/10"
                                      : "border-border focus:border-accent focus:ring-accent/10"
                                  )}
                                />
                              </div>

                              {/* Member Role (dropdown) */}
                              <div className="space-y-1.5">
                                <label className={cn(
                                  "text-xs font-bold uppercase tracking-widest",
                                  hasError(`member-${i}-role`) ? "text-error" : "text-textMuted"
                                )}>
                                  Role *
                                </label>
                                <select
                                  value={member.role}
                                  onChange={(e) => {
                                    updateMember(member.id, "role", e.target.value);
                                    setStep8Errors((prev) => prev.filter((err) => err.field !== `member-${i}-role`));
                                  }}
                                  className={cn(
                                    "w-full rounded-xl border bg-elevated p-3 text-sm text-textPrimary focus:outline-none focus:ring-4 transition-all",
                                    hasError(`member-${i}-role`)
                                      ? "border-error focus:border-error focus:ring-error/10"
                                      : "border-border focus:border-accent focus:ring-accent/10"
                                  )}
                                >
                                  <option value="">Select role...</option>
                                  {MEMBER_ROLES.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Member Experience (dropdown) */}
                              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                <label className={cn(
                                  "text-xs font-bold uppercase tracking-widest",
                                  hasError(`member-${i}-experience`) ? "text-error" : "text-textMuted"
                                )}>
                                  Experience *
                                </label>
                                <select
                                  value={member.experience}
                                  onChange={(e) => {
                                    updateMember(member.id, "experience", e.target.value);
                                    setStep8Errors((prev) => prev.filter((err) => err.field !== `member-${i}-experience`));
                                  }}
                                  className={cn(
                                    "w-full rounded-xl border bg-elevated p-3 text-sm text-textPrimary focus:outline-none focus:ring-4 transition-all",
                                    hasError(`member-${i}-experience`)
                                      ? "border-error focus:border-error focus:ring-error/10"
                                      : "border-border focus:border-accent focus:ring-accent/10"
                                  )}
                                >
                                  <option value="">Select experience...</option>
                                  {MEMBER_EXPERIENCE_OPTIONS.map((exp) => (
                                    <option key={exp} value={exp}>{exp}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Member Skills (tag input) */}
                              <div className="space-y-1.5 col-span-2">
                                <label className={cn(
                                  "text-xs font-bold uppercase tracking-widest",
                                  hasError(`member-${i}-skills`) ? "text-error" : "text-textMuted"
                                )}>
                                  Skills * <span className="normal-case font-normal opacity-60">(press Enter or comma to add)</span>
                                </label>
                                <div className={cn(
                                  "flex flex-wrap gap-2 rounded-xl border bg-elevated p-3 min-h-[52px] focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10 transition-all",
                                  hasError(`member-${i}-skills`) ? "border-error" : "border-border"
                                )}>
                                  {member.skills.map((skill) => (
                                    <span
                                      key={skill}
                                      className="flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 text-[11px] font-bold text-accent"
                                    >
                                      {skill}
                                      <button
                                        type="button"
                                        onClick={() => removeSkillTag(member.id, skill)}
                                        className="hover:text-error transition-colors"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                  {/* Suggestions */}
                                  <input
                                    type="text"
                                    placeholder={member.skills.length === 0 ? "React, Figma..." : ""}
                                    className="min-w-[120px] flex-1 bg-transparent text-sm text-textPrimary placeholder:text-textDisabled focus:outline-none"
                                    value={member.skillInput}
                                    onChange={(e) => {
                                      updateMember(member.id, "skillInput", e.target.value);
                                      setStep8Errors((prev) => prev.filter((err) => err.field !== `member-${i}-skills`));
                                    }}
                                    onKeyDown={(e) => handleSkillKeyDown(member.id, e)}
                                  />
                                </div>
                                {/* Quick suggestions */}
                                {member.skillInput.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {MEMBER_SKILL_SUGGESTIONS
                                      .filter((s) => s.toLowerCase().includes(member.skillInput.toLowerCase()) && !member.skills.includes(s))
                                      .slice(0, 5)
                                      .map((suggestion) => (
                                        <button
                                          key={suggestion}
                                          type="button"
                                          onClick={() => {
                                            updateMember(member.id, "skills", [...member.skills, suggestion]);
                                            updateMember(member.id, "skillInput", "");
                                          }}
                                          className="rounded-full bg-surface border border-border px-2 py-0.5 text-[10px] text-textMuted hover:border-accent hover:text-accent transition-colors"
                                        >
                                          + {suggestion}
                                        </button>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Validation summary */}
                      {step8Errors.length > 0 && (
                        <div className="rounded-lg bg-error/10 border border-error/20 p-4 space-y-1">
                          {step8Errors.slice(0, 3).map((err) => (
                            <div key={err.field} className="flex items-center gap-2 text-xs text-error">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              {err.message}
                            </div>
                          ))}
                          {step8Errors.length > 3 && (
                            <p className="text-xs text-error opacity-70">
                              +{step8Errors.length - 3} more issue{step8Errors.length - 3 !== 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Back → Step 7 (Availability) | Next → Step 9 (Review) */}
                <NavButtons
                  onBack={() => setStep(7)}
                  onNext={handleStep8Next}
                  nextLabel="Next: Review →"
                />
              </motion.div>
            )}

            {/* ─────────────── STEP 9: Review & Submit ──────────────────────── */}
            {step === 9 && (
              <motion.div
                key="step-9"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <h2 className="flex items-center gap-2 text-xl font-bold text-textPrimary">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Review & Submit
                </h2>

                <div className="space-y-3">
                  {[
                    { label: "Professional Title", value: title || "—" },
                    { label: "Skills", value: skills || "—" },
                    { label: "Hourly Rate", value: hourlyRate ? `$${hourlyRate}/hr` : "—" },
                    { label: "Years Experience", value: yearsExperience ? `${yearsExperience} years` : "—" },
                    { label: "Availability", value: hoursPerWeek ? `${hoursPerWeek} hrs/week` : "—" },
                    {
                      label: "Work Type",
                      value:
                        workType === "team"
                          ? `Team / Agency (${teamName}, ${teamMembers.length} members)`
                          : "Individual Freelancer",
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between rounded-xl border border-border bg-base p-4">
                      <span className="text-xs font-bold uppercase tracking-widest text-textMuted">
                        {label}
                      </span>
                      <span className="text-sm font-semibold text-textPrimary text-right max-w-[60%]">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                  <p className="text-xs text-textMuted leading-relaxed">
                    By submitting, you agree to the{" "}
                    <button type="button" className="font-bold text-accent hover:underline">
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button type="button" className="font-bold text-accent hover:underline">
                      Privacy Policy
                    </button>
                    .
                  </p>
                </div>

                <NavButtons
                  onBack={() => setStep(8)}
                  onNext={handleComplete}
                  nextLabel="Complete Setup 🚀"
                  nextLoading={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
