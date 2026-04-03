import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoleGuardProps {
  /**
   * The role this route requires.
   *
   * - Pass "freelancer" for freelancer-only routes.
   * - Pass "client"     for client-only routes.
   * - Pass null         to allow any authenticated user (e.g., /role-select,
   *                     /onboarding) — the guard still enforces null-role redirect.
   */
  requiredRole: "freelancer" | "client" | null;

  /**
   * When true, the user must have onboardingComplete === true to proceed.
   * If false (default), the guard allows through even if onboarding is pending.
   */
  requireOnboarding?: boolean;

  /**
   * Optional child elements.
   * Omit to use <Outlet /> (layout route mode).
   */
  children?: React.ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the dashboard path for the given role. */
const dashboardFor = (role: "freelancer" | "client"): string =>
  role === "freelancer" ? ROUTES.DASHBOARD_FREELANCER : ROUTES.DASHBOARD_CLIENT;

/** Returns the onboarding path for the given role. */
const onboardingFor = (role: "freelancer" | "client"): string =>
  role === "freelancer" ? ROUTES.ONBOARDING_FREELANCER : ROUTES.ONBOARDING_CLIENT;

// ─── RoleGuard ────────────────────────────────────────────────────────────────

/**
 * RoleGuard — enforces role-based access and onboarding completion.
 *
 * Must be used INSIDE a <ProtectedRoute> — assumes the user is already
 * authenticated. Only runs role/onboarding checks.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  DECISION TREE                                                          │
 * │                                                                         │
 * │  isLoading?                                                             │
 * │    └─ YES → render spinner                                              │
 * │                                                                         │
 * │  role === null?                                                          │
 * │    └─ YES → redirect to /role-select                                    │
 * │             (user hasn't chosen a role yet)                              │
 * │                                                                         │
 * │  requiredRole !== null && role !== requiredRole?                         │
 * │    └─ YES → redirect to /dashboard/{actualRole}                         │
 * │             (wrong dashboard for this user's role)                       │
 * │                                                                         │
 * │  requireOnboarding === true && onboardingComplete === false?            │
 * │    └─ YES → redirect to /onboarding/{role}                              │
 * │             (must finish onboarding before accessing dashboard)          │
 * │                                                                         │
 * │  requireOnboarding === false && onboardingComplete === true             │
 * │                             && currently on an onboarding path?         │
 * │    └─ YES → redirect to /dashboard/{role}                               │
 * │             (already onboarded — skip onboarding page)                  │
 * │                                                                         │
 * │  ALL CHECKS PASS → render children or <Outlet />                        │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * @example Protect a freelancer-only dashboard (must be onboarded):
 *   <Route path="/dashboard/freelancer" element={
 *     <ProtectedRoute>
 *       <RoleGuard requiredRole="freelancer" requireOnboarding>
 *         <DashboardLayout />
 *       </RoleGuard>
 *     </ProtectedRoute>
 *   } />
 *
 * @example Protect an onboarding route (role must match, onboarding pending):
 *   <Route path="/onboarding/client" element={
 *     <ProtectedRoute>
 *       <RoleGuard requiredRole="client">
 *         <OnboardingClient />
 *       </RoleGuard>
 *     </ProtectedRoute>
 *   } />
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  requiredRole,
  requireOnboarding = false,
  children,
}) => {
  const { role, onboardingComplete, isLoading } = useAuth();

  // ── 0. Still restoring session — show spinner ─────────────────────────────
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Verifying access"
        className="flex h-screen w-full items-center justify-center bg-base"
      >
        <div className="relative flex items-center justify-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-border border-t-accent shadow-glow" />
          <div className="absolute h-4 w-4 rounded-full bg-accent/60 shadow-glow animate-pulse" />
        </div>
      </div>
    );
  }

  // ── 1. No role selected yet ───────────────────────────────────────────────
  //    Redirect to /role-select so the user can pick freelancer or client.
  if (!role) {
    return <Navigate to={ROUTES.ROLE_SELECT} replace />;
  }

  // ── 2. Wrong role for this route ──────────────────────────────────────────
  //    e.g. a client trying to hit /dashboard/freelancer.
  //    Redirect them to their own dashboard instead.
  if (requiredRole !== null && role !== requiredRole) {
    return <Navigate to={dashboardFor(role)} replace />;
  }

  // ── 3. Onboarding not complete (and this route requires it) ───────────────
  //    e.g. trying to access /dashboard/freelancer before finishing onboarding.
  //    Send them to the correct onboarding page for their role.
  if (requireOnboarding && !onboardingComplete) {
    return <Navigate to={onboardingFor(role)} replace />;
  }

  // ── 4. Already onboarded, but trying to access onboarding again ───────────
  //    Prevent re-entering the onboarding flow once it's complete.
  if (!requireOnboarding && onboardingComplete && requiredRole !== null) {
    const currentPath = window.location.pathname;
    const isOnOnboardingRoute =
      currentPath.startsWith("/onboarding/freelancer") ||
      currentPath.startsWith("/onboarding/client");

    if (isOnOnboardingRoute) {
      return <Navigate to={dashboardFor(role)} replace />;
    }
  }

  // ── 5. All checks passed — render content ─────────────────────────────────
  return children ? <>{children}</> : <Outlet />;
};
