import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import api from "../services/api";

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: "freelancer" | "client" | null;
  onboardingComplete: boolean;
  avatarUrl?: string;
}

export interface AuthContextValue {
  /** Authenticated user object, or null when logged out */
  user: AuthUser | null;
  /** Convenience shortcut for user.role */
  role: "freelancer" | "client" | null;
  /** Whether the user has finished onboarding */
  onboardingComplete: boolean;
  /** True while the initial session check is running */
  isLoading: boolean;
  /** True when a valid token + user exists */
  isAuthenticated: boolean;
  /** Update role in context (call after saving to server) */
  setRole: (role: "freelancer" | "client") => void;
  /** Mark onboarding complete in context (call after saving to server) */
  completeOnboarding: () => void;
  /** Hydrate context after login/signup with the user returned by the API */
  hydrateUser: (user: AuthUser, token: string) => void;
  /** Clear context + token and redirect to /auth */
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * On mount: if a token exists in localStorage, validate it by calling
   * GET /auth/me.  This restores the full session on page refresh.
   */
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        const userData: AuthUser = response.data.data.user;
        setUser(userData);
      } catch {
        // Token expired or invalid — clear it silently
        localStorage.removeItem("accessToken");
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  /** Called immediately after a successful login or signup response */
  const hydrateUser = useCallback((userData: AuthUser, token: string) => {
    localStorage.setItem("accessToken", token);
    setUser(userData);
  }, []);

  /** Update role locally (server should already be updated) */
  const setRole = useCallback((role: "freelancer" | "client") => {
    setUser((prev) => (prev ? { ...prev, role } : prev));
  }, []);

  /** Mark onboarding done locally (server should already be updated) */
  const completeOnboarding = useCallback(() => {
    setUser((prev) => (prev ? { ...prev, onboardingComplete: true } : prev));
  }, []);

  /** Sign out: clear local token + context state */
  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    setUser(null);
    // Hard navigate to auth — avoids stale router state
    window.location.href = "/auth";
  }, []);

  const value: AuthContextValue = {
    user,
    role: user?.role ?? null,
    onboardingComplete: user?.onboardingComplete ?? false,
    isLoading,
    isAuthenticated: !!user,
    setRole,
    completeOnboarding,
    hydrateUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuth — access the auth context inside any component.
 *
 * @example
 * const { user, role, isAuthenticated, logout } = useAuth();
 */
export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
};

export default AuthContext;
