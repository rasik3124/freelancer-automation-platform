import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Users,
  ChevronRight,
  Zap,
  TrendingUp,
  ShieldCheck,
  Search,
  BarChart3,
  Star,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { ROUTES, APP_NAME } from "../constants";

// ─── Role definitions ──────────────────────────────────────────────────────────

const ROLES = [
  {
    id: "freelancer" as const,
    label: "Freelancer",
    tagline: "I want to find clients & scale my business with AI.",
    description:
      "Analyze leads, auto-generate winning proposals, track your pipeline, and schedule meetings — all from one command center.",
    icon: Briefcase,
    accentClass: "accent",
    perks: [
      { icon: Zap,         text: "AI Lead Analyzer — feasibility scores in seconds" },
      { icon: TrendingUp,  text: "Proposal Generator — 92% higher win rate" },
      { icon: BarChart3,   text: "Revenue & pipeline tracking dashboard" },
      { icon: ShieldCheck, text: "Meeting scheduler with calendar sync" },
    ],
    stat: { value: "2,400+", label: "Freelancers earning more" },
  },
  {
    id: "client" as const,
    label: "Client",
    tagline: "I want to hire top talent & manage projects effortlessly.",
    description:
      "Post projects, discover AI-matched freelancers, review proposals, schedule interviews, and track invoices — end to end.",
    icon: Users,
    accentClass: "gold",
    perks: [
      { icon: Search,       text: "AI-matched freelancer discovery" },
      { icon: Star,         text: "Proposal review with scoring & comments" },
      { icon: CheckCircle2, text: "Project & milestone management" },
      { icon: BarChart3,    text: "Invoicing & payment tracking" },
    ],
    stat: { value: "98%", label: "Client satisfaction rate" },
  },
] as const;

type RoleId = "freelancer" | "client";

// ─── RoleSelect ───────────────────────────────────────────────────────────────

export const RoleSelect: React.FC = () => {
  const [selected, setSelected] = useState<RoleId>("freelancer");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setRole, user } = useAuth();

  const handleContinue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.updateProfile({ role: selected });
      setRole(selected);
      navigate(
        selected === "freelancer" ? ROUTES.ONBOARDING_FREELANCER : ROUTES.ONBOARDING_CLIENT,
        { replace: true }
      );
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save your choice. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const firstName = user?.fullName?.split(" ")[0] ?? "there";
  const activeRole = ROLES.find((r) => r.id === selected)!;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-base px-4 py-12">

      {/* ── Background grid ── */}
      <div className="grid-pattern pointer-events-none absolute inset-0 opacity-40" />

      {/* ── Ambient glows ── */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-accent blur-[140px]"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="pointer-events-none absolute -right-32 bottom-0 h-[500px] w-[500px] rounded-full bg-gold blur-[140px]"
      />

      {/* ── Noise overlay ── */}
      <div className="noise-bg" />

      {/* ── Scanline ── */}
      <div className="scanline" />

      {/* ── Logo ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 flex items-center gap-3"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent shadow-glow overflow-hidden">
          <img
            src="https://picsum.photos/seed/logo/200/200"
            alt="Logo"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <span className="font-display text-lg font-bold tracking-tight text-textPrimary">
          {APP_NAME}
        </span>
        <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-accent">
          Enterprise AI
        </span>
      </motion.div>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="mb-10 text-center space-y-3"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
          Step 1 of 2 — Role Selection
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight text-textPrimary sm:text-5xl">
          Welcome, {firstName}.<br />
          <span className="text-accent">Choose your path.</span>
        </h1>
        <p className="text-sm text-textMuted max-w-md mx-auto leading-relaxed">
          Your role shapes your entire experience. You can change this later from settings.
        </p>
      </motion.div>

      {/* ── Role cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
        className="relative z-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {ROLES.map((role, idx) => {
          const isActive = selected === role.id;
          const Icon = role.icon;
          const isGold = role.id === "client";

          return (
            <motion.button
              key={role.id}
              type="button"
              onClick={() => { setSelected(role.id); setError(null); }}
              initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + idx * 0.08 }}
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.985 }}
              className={[
                "relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-7 text-left transition-all duration-300",
                isActive
                  ? isGold
                    ? "border-gold/60 bg-gold/5 shadow-[0_0_30px_rgba(212,175,55,0.12)]"
                    : "border-accent/60 bg-accent/5 shadow-glow"
                  : "border-border bg-surface hover:border-border/80 hover:bg-elevated/60",
              ].join(" ")}
            >
              {/* Corner accent lines */}
              {isActive && (
                <>
                  <span className={`absolute left-0 top-0 h-8 w-0.5 ${isGold ? "bg-gold" : "bg-accent"}`} />
                  <span className={`absolute left-0 top-0 h-0.5 w-8 ${isGold ? "bg-gold" : "bg-accent"}`} />
                  <span className={`absolute bottom-0 right-0 h-8 w-0.5 ${isGold ? "bg-gold" : "bg-accent"}`} />
                  <span className={`absolute bottom-0 right-0 h-0.5 w-8 ${isGold ? "bg-gold" : "bg-accent"}`} />
                </>
              )}

              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className={[
                  "flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300",
                  isActive
                    ? isGold
                      ? "border-gold/40 bg-gold/10 text-gold shadow-[0_0_16px_rgba(212,175,55,0.2)]"
                      : "border-accent/40 bg-accent/10 text-accent shadow-glow"
                    : "border-border bg-elevated text-textMuted",
                ].join(" ")}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Selection indicator */}
                <div className={[
                  "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-300 shrink-0 mt-0.5",
                  isActive
                    ? isGold
                      ? "border-gold bg-gold"
                      : "border-accent bg-accent"
                    : "border-border bg-transparent",
                ].join(" ")}>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="h-2 w-2 rounded-full bg-base"
                    />
                  )}
                </div>
              </div>

              {/* Title + tagline */}
              <div className="space-y-1">
                <h2 className={[
                  "font-display text-xl font-bold transition-colors duration-300",
                  isActive
                    ? isGold ? "text-gold" : "text-accent"
                    : "text-textPrimary",
                ].join(" ")}>
                  {role.label}
                </h2>
                <p className="text-xs leading-relaxed text-textMuted">{role.tagline}</p>
              </div>

              {/* Perks list */}
              <ul className="space-y-2.5">
                {role.perks.map((perk, i) => {
                  const PerkIcon = perk.icon;
                  return (
                    <li key={i} className="flex items-start gap-2.5">
                      <PerkIcon className={[
                        "mt-0.5 h-3.5 w-3.5 shrink-0",
                        isActive
                          ? isGold ? "text-gold" : "text-accent"
                          : "text-textDisabled",
                      ].join(" ")} />
                      <span className="text-[11px] leading-relaxed text-textMuted">{perk.text}</span>
                    </li>
                  );
                })}
              </ul>

              {/* Stat badge */}
              <div className={[
                "mt-auto flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-300",
                isActive
                  ? isGold
                    ? "border-gold/20 bg-gold/5"
                    : "border-accent/20 bg-accent/5"
                  : "border-border bg-elevated/40",
              ].join(" ")}>
                <span className={[
                  "font-display text-base font-bold",
                  isActive ? isGold ? "text-gold" : "text-accent" : "text-textPrimary",
                ].join(" ")}>
                  {role.stat.value}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-textMuted">
                  {role.stat.label}
                </span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="mt-5 flex items-center gap-2.5 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error max-w-3xl w-full"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-6 w-full max-w-3xl"
      >
        <motion.button
          onClick={handleContinue}
          disabled={isLoading}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          className={[
            "relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl px-8 py-4 font-display text-base font-bold tracking-wide transition-all duration-300",
            selected === "client"
              ? "bg-gold text-base shadow-[0_0_24px_rgba(212,175,55,0.25)] hover:shadow-[0_0_32px_rgba(212,175,55,0.35)]"
              : "bg-accent text-white shadow-glow hover:shadow-[0_0_32px_rgba(242,125,38,0.4)]",
            isLoading && "cursor-not-allowed opacity-70",
          ].join(" ")}
        >
          {/* Shimmer on hover */}
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 hover:translate-x-full" />

          {isLoading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving your role…
            </>
          ) : (
            <>
              Continue as {activeRole.label}
              <ChevronRight className="h-5 w-5" />
            </>
          )}
        </motion.button>

        <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-textDisabled">
          You can change your role later in settings
        </p>
      </motion.div>
    </div>
  );
};
