import React from "react";
import { motion } from "motion/react";
import { 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  CheckCircle2, 
  Star, 
  ArrowRight 
} from "lucide-react";
import { APP_NAME, APP_SUBTITLE } from "../../constants";

export const AuthBrandPanel: React.FC = () => {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-authStart to-authEnd p-12 text-white">
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-accent/20 blur-[100px]"
      />
      <motion.div
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-gold/10 blur-[100px]"
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent shadow-glow overflow-hidden">
            <img src="https://picsum.photos/seed/logo/200/200" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-display font-bold tracking-tight">{APP_NAME}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Enterprise AI</span>
          </div>
        </div>

        <div className="mt-20 space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-display font-bold leading-tight">
              Automate your <br />
              <span className="text-accent">freelancing empire.</span>
            </h2>
            <p className="max-w-xs text-sm text-textMuted leading-relaxed">
              The unified platform for high-performance freelancers who want to scale with AI.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { icon: Zap, label: "AI Lead Analysis", desc: "Feasibility scores in seconds." },
              { icon: ShieldCheck, label: "Smart Proposals", desc: "92% higher conversion rate." },
              { icon: TrendingUp, label: "Revenue Tracking", desc: "Real-time business insights." },
            ].map((prop, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-accent">
                  <prop.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold">{prop.label}</h4>
                  <p className="text-xs text-textMuted">{prop.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <div className="inline-flex items-center gap-4 rounded-full bg-white/5 border border-white/10 px-6 py-3 backdrop-blur-md">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-6 w-6 rounded-full border-2 border-authStart bg-elevated" />
              ))}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-2 w-2 fill-gold text-gold" />)}
                <span className="text-[10px] font-bold ml-1">4.9/5</span>
              </div>
              <span className="text-[10px] text-textMuted">Trusted by 2,000+ freelancers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
