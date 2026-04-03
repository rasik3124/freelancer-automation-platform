import React from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";
import { ROUTES } from "../constants";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-base text-center p-6">
      {/* Glitchy 404 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mb-8"
      >
        <span className="font-display text-[160px] font-black leading-none text-surface select-none">
          404
        </span>
        <span className="absolute inset-0 flex items-center justify-center font-display text-[160px] font-black leading-none text-accent/20 select-none blur-sm">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-[160px] font-black leading-none text-border select-none">
            404
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h1 className="text-3xl font-display font-bold text-textPrimary">
          Page Not Found
        </h1>
        <p className="max-w-md text-textMuted leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
          <Button variant="outline" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" /> Go Back
          </Button>
          <Button variant="primary" className="gap-2" onClick={() => navigate(ROUTES.LANDING)}>
            <Home className="h-4 w-4" /> Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
