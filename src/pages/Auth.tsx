import React from "react";
import { motion } from "motion/react";
import { AuthBrandPanel } from "../components/auth/AuthBrandPanel";
import { AuthCard } from "../components/auth/AuthCard";

export const Auth: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-base p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative flex h-[720px] w-full max-w-[1100px] overflow-hidden rounded-authCard border border-border bg-surface shadow-card"
      >
        <div className="hidden w-1/2 lg:block">
          <AuthBrandPanel />
        </div>
        <div className="w-full lg:w-1/2">
          <AuthCard />
        </div>
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-accent/10 blur-[100px]" />
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-gold/5 blur-[100px]" />
      </motion.div>
    </div>
  );
};
