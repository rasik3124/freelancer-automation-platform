import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../constants";

interface ProtectedRouteProps {
  /**
   * Optional children — pass when using ProtectedRoute as a wrapper component.
   * If omitted, ProtectedRoute renders <Outlet /> instead, which works when
   * used directly as the `element` prop of a parent <Route>.
   *
   * @example Wrapper usage (wraps a single page):
   *   <Route path="/role-select" element={<ProtectedRoute><RoleSelect /></ProtectedRoute>} />
   *
   * @example Outlet usage (wraps a nested layout route):
   *   <Route element={<ProtectedRoute />}>
   *     <Route path="/dashboard" element={<DashboardLayout />} />
   *   </Route>
   */
  children?: React.ReactNode;
}

/**
 * ProtectedRoute — prevents unauthenticated access to any wrapped route.
 *
 * Behaviour:
 *  - While `isLoading` is true (initial session check): renders a full-screen spinner.
 *  - If `isAuthenticated` is false: redirects to /auth, preserving the
 *    intended destination in `location.state.from` so the user can be
 *    sent back after login.
 *  - Otherwise: renders `children` (wrapper mode) or `<Outlet />` (layout mode).
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // ── 1. Wait for session restore ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Checking authentication"
        className="flex h-screen w-full items-center justify-center bg-base"
      >
        <div className="relative flex items-center justify-center">
          {/* Outer ring */}
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-border border-t-accent shadow-glow" />
          {/* Inner glow dot */}
          <div className="absolute h-4 w-4 rounded-full bg-accent/60 shadow-glow animate-pulse" />
        </div>
      </div>
    );
  }

  // ── 2. Unauthenticated → redirect to /auth ────────────────────────────────
  if (!isAuthenticated) {
    return (
      <Navigate
        to={ROUTES.AUTH}
        state={{ from: location }}
        replace
      />
    );
  }

  // ── 3. Authenticated → render content ────────────────────────────────────
  // If children were passed, render them (wrapper mode).
  // Otherwise fall back to <Outlet /> which React Router uses for nested routes.
  return children ? <>{children}</> : <Outlet />;
};
