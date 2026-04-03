/**
 * useApi — Crescent Black data-fetching hooks
 *
 * Pure REST API hooks backed by the Node.js/Express/JWT backend.
 * Replaces the old Firebase/Firestore hooks (no Firebase SDK needed).
 *
 * All requests go through src/services/api.ts which automatically
 * attaches the Authorization: Bearer <JWT> header.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";

// ─── Shared state types ───────────────────────────────────────────────────────

interface CollectionState<T> { data: T[];     isLoading: boolean; error: string | null; }
interface DocState<T>        { data: T | null; isLoading: boolean; error: string | null; }
interface MutationState      {                 isLoading: boolean; error: string | null; }

// ─── useApiCollection ─────────────────────────────────────────────────────────

interface UseApiCollectionOptions {
  /** Full API path e.g. "/api/projects" */
  endpoint: string;
  /** Fetch immediately on mount (default: true) */
  fetchOnMount?: boolean;
}

/**
 * Fetch a list of resources from a REST endpoint.
 *
 * @example
 * const { data: projects, refetch } = useApiCollection<Project>({ endpoint: "/api/projects" });
 */
export function useApiCollection<T>({
  endpoint,
  fetchOnMount = true,
}: UseApiCollectionOptions): CollectionState<T> & { refetch: () => void } {
  const [state, setState] = useState<CollectionState<T>>({
    data: [],
    isLoading: fetchOnMount,
    error: null,
  });

  const fetchRef = useRef(false);

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const res = await api.get<{ data: T[] }>(endpoint);
      setState({ data: res.data.data ?? [], isLoading: false, error: null });
    } catch (err: any) {
      const message = err.response?.data?.error ?? err.message ?? "Failed to load data";
      setState({ data: [], isLoading: false, error: message });
    }
  }, [endpoint]);

  useEffect(() => {
    if (!fetchOnMount || fetchRef.current) return;
    fetchRef.current = true;
    fetch();
  }, [fetch, fetchOnMount]);

  return { ...state, refetch: fetch };
}

// ─── useApiDocument ───────────────────────────────────────────────────────────

/**
 * Fetch a single resource from a REST endpoint.
 *
 * @example
 * const { data: invoice } = useApiDocument<Invoice>(`/api/invoices/${invoiceId}`);
 */
export function useApiDocument<T>(
  endpoint: string | null
): DocState<T> & { refetch: () => void } {
  const [state, setState] = useState<DocState<T>>({
    data:      null,
    isLoading: !!endpoint,
    error:     null,
  });

  const fetch = useCallback(async () => {
    if (!endpoint) return;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const res = await api.get<{ data: T }>(endpoint);
      setState({ data: res.data.data ?? null, isLoading: false, error: null });
    } catch (err: any) {
      const message = err.response?.data?.error ?? err.message ?? "Failed to load";
      setState({ data: null, isLoading: false, error: message });
    }
  }, [endpoint]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}

// ─── useApiMutations ──────────────────────────────────────────────────────────

/**
 * CRUD helpers for a REST collection endpoint.
 *
 * @example
 * const { add, update, remove } = useApiMutations("/api/projects");
 * await add({ title: "New Project" });
 */
export function useApiMutations(baseEndpoint: string) {
  const [state, setState] = useState<MutationState>({ isLoading: false, error: null });

  const run = async (fn: () => Promise<unknown>): Promise<unknown> => {
    setState({ isLoading: true, error: null });
    try {
      const result = await fn();
      setState({ isLoading: false, error: null });
      return result;
    } catch (err: any) {
      const message = err.response?.data?.error ?? err.message ?? "Request failed";
      setState({ isLoading: false, error: message });
      return null;
    }
  };

  return {
    ...state,
    add:    (data: Record<string, unknown>) =>
      run(() => api.post(baseEndpoint, data)),
    update: (id: string, data: Record<string, unknown>) =>
      run(() => api.put(`${baseEndpoint}/${id}`, data)),
    patch:  (id: string, data: Record<string, unknown>) =>
      run(() => api.patch(`${baseEndpoint}/${id}`, data)),
    remove: (id: string) =>
      run(() => api.delete(`${baseEndpoint}/${id}`)),
  };
}

// ─── Legacy compatibility aliases ─────────────────────────────────────────────
// Old code that imported useFirestoreCollection / useFirestoreDocument
// can now import the same names from this file.

export const useFirestoreCollection = useApiCollection;
export const useFirestoreDocument   = useApiDocument;
export const useFirestoreMutations  = useApiMutations;
