import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../constants";

// ─── Routing helper ───────────────────────────────────────────────────────────

/**
 * routeAfterAuth — determines the correct destination after login/signup.
 *
 * Decision table:
 *   role=null                                   → /role-select
 *   role='freelancer' && onboardingComplete=false → /onboarding/freelancer
 *   role='client'     && onboardingComplete=false → /onboarding/client
 *   role='freelancer' && onboardingComplete=true  → /dashboard/freelancer
 *   role='client'     && onboardingComplete=true  → /dashboard/client
 *
 * NEVER returns '/' or '/landing'.
 */
function routeAfterAuth(
  role: "freelancer" | "client" | null,
  onboardingComplete: boolean
): string {
  if (!role) {
    // No role chosen yet → must select role first
    return ROUTES.ROLE_SELECT;
  }

  if (role === "freelancer") {
    // Freelancer: onboarding pending or complete
    return onboardingComplete
      ? ROUTES.DASHBOARD_FREELANCER         // ✅ /dashboard/freelancer
      : ROUTES.ONBOARDING_FREELANCER;       // 🔄 /onboarding/freelancer
  }

  if (role === "client") {
    // Client: onboarding pending or complete
    return onboardingComplete
      ? ROUTES.DASHBOARD_CLIENT             // ✅ /dashboard/client
      : ROUTES.ONBOARDING_CLIENT;           // 🔄 /onboarding/client
  }

  // Fallback (should never be reached given TypeScript types)
  return ROUTES.ROLE_SELECT;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AuthCard: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { hydrateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear error on any input change for better UX
    if (error) setError(null);
  };

  // ── Login handler ──────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Call POST /auth/login — server validates credentials and returns
      //    { accessToken, user: { id, email, fullName, role, onboardingComplete } }
      const data = await authService.login({
        email: formData.email,
        password: formData.password,
      });

      // 2. Hydrate AuthContext with the returned user + token.
      //    This stores the token in localStorage and sets user state,
      //    restoring the full session immediately.
      hydrateUser(data.user, data.accessToken);

      // 3. Determine the correct redirect destination based on role + onboarding.
      //    Never navigates to '/' or '/landing'.
      //    If the user was redirected here from a protected route, send them back.
      const intendedPath =
        (location.state as any)?.from?.pathname ?? null;

      const destination = intendedPath
        ? validateIntendedPath(intendedPath, data.user.role, data.user.onboardingComplete)
        : routeAfterAuth(data.user.role, data.user.onboardingComplete);

      navigate(destination, { replace: true });

    } catch (err: any) {
      // 4. Surface server error without navigating anywhere
      const message =
        err.response?.data?.error ||
        err.message ||
        "Invalid email or password. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Signup handler ─────────────────────────────────────────────────────────
  const handleSignup = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Call POST /auth/signup — creates user with role=null, onboardingComplete=false
      const data = await authService.signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      // 2. Hydrate context
      hydrateUser(data.user, data.accessToken);

      // 3. New users always go to role selection — no exceptions
      navigate(ROUTES.ROLE_SELECT, { replace: true });

    } catch (err: any) {
      const serverMsg: string =
        err.response?.data?.error ||
        err.message ||
        "Failed to create account. Please try again.";

      // If the email is already taken, prompt the user to log in instead
      const message =
        serverMsg.toLowerCase().includes("already exists") ||
        serverMsg.toLowerCase().includes("already registered")
          ? "An account with this email already exists. Please log in instead."
          : serverMsg;

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Form submit dispatcher ─────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  // ── Mode toggle ────────────────────────────────────────────────────────────
  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setError(null);
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
  };

  return (
    <div className="flex h-full w-full flex-col p-12 bg-surface">
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">

        {/* ── Heading ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? "login-heading" : "signup-heading"}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <h2 className="text-3xl font-display font-bold text-textPrimary">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm text-textMuted">
              {isLogin
                ? "Login to your workspace."
                : "Join the future of freelancing."}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* ── Error toast ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-6 flex items-start gap-3 overflow-hidden rounded-lg bg-error/10 border border-error/20 p-4"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-error" />
              <p className="text-xs font-medium text-error leading-relaxed">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <motion.div
            key="credentials"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Signup-only: Name field */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Input
                    label="Full Name"
                    name="name"
                    placeholder="John Doe"
                    required={!isLogin}
                    icon={<User className="h-4 w-4" />}
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="john@example.com"
              required
              icon={<Mail className="h-4 w-4" />}
              value={formData.email}
              onChange={handleInputChange}
            />

            {/* Password row */}
            <div className={`grid gap-4 ${!isLogin ? "grid-cols-2" : "grid-cols-1"}`}>
              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  icon={<Lock className="h-4 w-4" />}
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-9 text-textDisabled hover:text-textPrimary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Confirm password — signup only */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    key="confirm-password"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden"
                  >
                    <Input
                      label="Confirm Password"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required={!isLogin}
                      icon={<Lock className="h-4 w-4" />}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Remember me / Forgot password — login only */}
            <AnimatePresence>
              {isLogin && (
                <motion.div
                  key="login-extras"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between"
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border bg-surface text-accent focus:ring-accent/20"
                    />
                    <span className="text-xs text-textMuted">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-xs font-bold text-accent hover:underline"
                  >
                    Forgot password?
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Submit */}
          <Button
            variant="primary"
            type="submit"
            className="w-full gap-2"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLogin ? "Login" : "Create Account"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* ── Toggle login ↔ signup ── */}
      <div className="mt-8 text-center">
        <p className="text-sm text-textMuted">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={toggleMode}
            className="font-bold text-accent hover:underline"
          >
            {isLogin ? "Sign up for free" : "Login now"}
          </button>
        </p>
      </div>
    </div>
  );
};

// ─── Internal helper ───────────────────────────────────────────────────────────

/**
 * validateIntendedPath — verifies that a saved `from` path is still valid
 * for the user's role/onboarding state. Falls back to routeAfterAuth if not.
 *
 * Prevents a client from being redirected to a freelancer route they happened
 * to have visited while unauthenticated.
 */
function validateIntendedPath(
  intendedPath: string,
  role: "freelancer" | "client" | null,
  onboardingComplete: boolean
): string {
  // If onboarding isn't done, never navigate to dashboard
  if (!onboardingComplete && intendedPath.startsWith("/dashboard")) {
    return routeAfterAuth(role, onboardingComplete);
  }

  // If the path is role-scoped and the role doesn't match, override
  if (intendedPath.startsWith("/dashboard/freelancer") && role !== "freelancer") {
    return routeAfterAuth(role, onboardingComplete);
  }
  if (intendedPath.startsWith("/dashboard/client") && role !== "client") {
    return routeAfterAuth(role, onboardingComplete);
  }

  // Landing or auth pages should not be a redirect target
  if (intendedPath === "/" || intendedPath === "/auth") {
    return routeAfterAuth(role, onboardingComplete);
  }

  return intendedPath;
}
