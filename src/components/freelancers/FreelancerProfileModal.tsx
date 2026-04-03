import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Star, MapPin, Clock, Globe, Github, Linkedin, Heart, Send,
  Loader2, Briefcase, Award, MessageCircle,
} from "lucide-react";
import { Freelancer, AVAILABILITY_LABELS, AVAILABILITY_COLOR } from "../../types/freelancer";
import { Stars } from "./FreelancerCard";
import { SendInquiryForm } from "./SendInquiryForm";
import api from "../../services/api";
import { cn } from "../../lib/utils";

interface FreelancerProfileModalProps {
  freelancerId: string | null;
  onClose: () => void;
}

const SectionTitle: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 border-b border-border pb-2 mb-3">
    <Icon className="h-4 w-4 text-accent" />
    <h4 className="text-sm font-bold text-textPrimary">{label}</h4>
  </div>
);

export const FreelancerProfileModal: React.FC<FreelancerProfileModalProps> = ({ freelancerId, onClose }) => {
  const [profile, setProfile] = useState<Freelancer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFavourite, setIsFavourite] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);

  useEffect(() => {
    if (!freelancerId) return;
    setIsLoading(true); setError(null);
    api.get<{ data: Freelancer }>(`/api/freelancers/${freelancerId}`)
      .then((r) => setProfile(r.data.data))
      .catch(() => setError("Could not load profile."))
      .finally(() => setIsLoading(false));
  }, [freelancerId]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const panel = (
    <AnimatePresence>
      {freelancerId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.aside key="panel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-border shadow-2xl"
            style={{ backgroundColor: "#0d0d0d" }} role="dialog" aria-modal>
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-border px-5">
              <h3 className="font-display text-base font-bold text-textPrimary">Freelancer Profile</h3>
              <button onClick={onClose} className="rounded-lg p-2 text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
              {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              ) : error ? (
                <p className="text-sm text-error text-center py-10">{error}</p>
              ) : profile ? (
                <>
                  {/* 1. Header card */}
                  <div className="flex items-start gap-4 rounded-2xl border border-border p-5" style={{ backgroundColor: "#111111" }}>
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-violet-600 text-xl font-black text-white">
                      {profile.avatarInitials}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-display text-lg font-bold text-textPrimary">{profile.name}</h4>
                      <p className="text-sm text-textMuted">{profile.role}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        <span className="flex items-center gap-1 text-textDisabled"><MapPin className="h-3 w-3" />{profile.location}</span>
                        <span className={cn("flex items-center gap-1 font-medium", AVAILABILITY_COLOR[profile.availability])}>
                          <Clock className="h-3 w-3" />{AVAILABILITY_LABELS[profile.availability]}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Stars rating={profile.rating} />
                          <span className="text-xs font-bold text-textPrimary">{profile.rating}</span>
                          <span className="text-xs text-textDisabled">({profile.reviews} reviews)</span>
                        </div>
                        <span className="text-sm font-black text-accent">${profile.hourlyRate}/hr</span>
                        <span className="text-xs text-textDisabled">{profile.projectsDone} projects done</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. About */}
                  <div>
                    <SectionTitle icon={Briefcase} label="About" />
                    <p className="text-sm text-textMuted leading-relaxed">{profile.bio}</p>
                  </div>

                  {/* 3. Skills */}
                  <div>
                    <SectionTitle icon={Award} label="Skills & Experience" />
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {profile.skills.map((s) => (
                        <span key={s} className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-[11px] font-bold text-accent">{s}</span>
                      ))}
                    </div>
                    <div className="flex gap-4 text-xs text-textMuted">
                      <span><span className="font-bold text-textPrimary capitalize">{profile.experience}</span> level</span>
                      <span><span className="font-bold text-textPrimary">{profile.yearsExp}</span> yrs exp</span>
                      <span><span className="font-bold text-textPrimary">{profile.projectsDone}</span> projects</span>
                    </div>
                  </div>

                  {/* 4. Portfolio links */}
                  <div>
                    <SectionTitle icon={Globe} label="Portfolio & Links" />
                    <div className="flex flex-wrap gap-3">
                      {[
                        { href: profile.portfolio, icon: Globe, label: "Portfolio" },
                        ...(profile.github ? [{ href: `https://${profile.github}`, icon: Github, label: "GitHub" }] : []),
                        ...(profile.linkedin ? [{ href: `https://${profile.linkedin}`, icon: Linkedin, label: "LinkedIn" }] : []),
                      ].map(({ href, icon: Icon, label }) => (
                        <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-textMuted hover:border-accent/40 hover:text-accent hover:bg-accent/5 transition-all">
                          <Icon className="h-3.5 w-3.5" />{label}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* 5. Reviews */}
                  <div>
                    <SectionTitle icon={Star} label="Recent Reviews" />
                    <div className="space-y-3">
                      {profile.recentReviews.map((r, i) => (
                        <div key={i} className="rounded-xl border border-border p-4 space-y-2" style={{ backgroundColor: "#111111" }}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-textPrimary">{r.author}</span>
                            <div className="flex items-center gap-1">
                              <Stars rating={r.rating} size="h-3 w-3" />
                              <span className="text-[10px] text-textDisabled ml-1">{new Date(r.date).toLocaleDateString("en-US",{month:"short",year:"numeric"})}</span>
                            </div>
                          </div>
                          <p className="text-xs text-textMuted leading-relaxed">"{r.comment}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Inquiry form inline */}
                  {showInquiry && profile && (
                    <div className="animate-in fade-in duration-200">
                      <SendInquiryForm
                        freelancerId={profile.id}
                        freelancerName={profile.name}
                        onClose={() => setShowInquiry(false)}
                        inline
                      />
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Sticky footer */}
            {profile && !isLoading && (
              <div className="border-t border-border p-4 flex items-center gap-2">
                <button onClick={() => setShowInquiry(v => !v)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-xs font-bold text-white hover:bg-accent/90 shadow-glow transition-colors">
                  <Send className="h-3.5 w-3.5" /> {showInquiry ? "Hide Form" : "Send Inquiry"}
                </button>
                <button className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors">
                  <MessageCircle className="h-3.5 w-3.5" /> Message
                </button>
                <button onClick={() => setIsFavourite(v => !v)}
                  className={cn("flex items-center justify-center rounded-xl border px-3 py-2.5 transition-all",
                    isFavourite ? "border-error/40 bg-error/10 text-error" : "border-border text-textDisabled hover:border-error/40 hover:text-error hover:bg-error/10")}
                  aria-label="Add to favorites">
                  <Heart className={cn("h-4 w-4", isFavourite && "fill-error")} />
                </button>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(panel, document.body);
};
