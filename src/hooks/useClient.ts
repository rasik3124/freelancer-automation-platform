import { useCallback, useEffect, useRef, useState } from "react";
import { ClientProfile } from "../types/settings";
import api from "../services/api";
import { useAuth } from "./useAuth";

// ─── Client context hook ──────────────────────────────────────────────────────

interface UseClientReturn {
  profile: ClientProfile | null;
  isLoading: boolean;
  error: string | null;
  /** Manually re-fetch the profile */
  refetch: () => Promise<void>;
  /** Update profile in-place (after a PUT) */
  updateProfile: (partial: Partial<ClientProfile>) => void;
}

/**
 * useClient — fetches and caches the authenticated client's profile.
 *
 * Caches the result per uid so navigating between tabs doesn't re-fetch.
 *
 * @example
 * const { profile, isLoading } = useClient();
 */
export function useClient(): UseClientReturn {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, ClientProfile>>(new Map());

  const fetch = useCallback(async () => {
    if (!isAuthenticated || !user?.id) { setIsLoading(false); return; }
    const uid = user.id;

    // Return cached value instantly
    if (cacheRef.current.has(uid)) {
      setProfile(cacheRef.current.get(uid)!);
      setIsLoading(false);
      return;
    }

    setIsLoading(true); setError(null);
    try {
      const res = await api.get<{ data: ClientProfile }>(`/api/clients/${uid}`);
      const data = res.data.data;
      cacheRef.current.set(uid, data);
      setProfile(data);
    } catch {
      setError("Could not load client profile.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateProfile = useCallback((partial: Partial<ClientProfile>) => {
    setProfile(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      if (user?.id) cacheRef.current.set(user.id, updated);
      return updated;
    });
  }, [user?.id]);

  return { profile, isLoading, error, refetch: fetch, updateProfile };
}
