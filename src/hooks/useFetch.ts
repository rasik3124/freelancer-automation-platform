import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";
import type { AxiosRequestConfig } from "axios";

// ─── useFetch — generic GET ───────────────────────────────────────────────────

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseFetchOptions { manual?: boolean; deps?: unknown[]; }

/**
 * useFetch<T>(url, opts)
 *
 * Fires GET on mount (unless manual: true). Call refetch() to re-trigger.
 *
 * @example
 * const { data, isLoading, error, refetch } = useFetch<Invoice[]>("/api/invoices");
 */
export function useFetch<T>(url: string, opts?: UseFetchOptions & AxiosRequestConfig) {
  const { manual = false, deps = [], ...axiosConfig } = opts ?? {};
  const [state, setState] = useState<FetchState<T>>({ data: null, isLoading: !manual, error: null });
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const res = await api.get<{ data: T }>(url, { ...axiosConfig, signal: ctrl.signal });
      setState({ data: res.data.data ?? res.data as T, isLoading: false, error: null });
    } catch (e: unknown) {
      if ((e as Error)?.name === "CanceledError") return;
      const msg = (e as { response?: { data?: { error?: string }; message?: string }; message?: string })
        ?.response?.data?.error ?? (e as Error)?.message ?? "Request failed";
      setState(s => ({ ...s, isLoading: false, error: msg }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, JSON.stringify(deps)]);

  useEffect(() => { if (!manual) fetch(); return () => abortRef.current?.abort(); }, [fetch, manual]);

  return { ...state, refetch: fetch };
}

// ─── useMutation — POST / PUT / PATCH / DELETE ────────────────────────────────

interface MutationState<T> { data: T | null; isLoading: boolean; error: string | null; }

type MutationMethod = "post" | "put" | "patch" | "delete";

/**
 * useMutation<TRes, TReq>(method, url)
 *
 * Returns { mutate, data, isLoading, error }.
 *
 * @example
 * const { mutate, isLoading } = useMutation<Invoice>("post", "/api/meetings/schedule");
 * await mutate({ ... });
 */
export function useMutation<TRes = unknown, TReq = unknown>(method: MutationMethod, url: string) {
  const [state, setState] = useState<MutationState<TRes>>({ data: null, isLoading: false, error: null });

  const mutate = useCallback(async (body?: TReq): Promise<TRes | null> => {
    setState({ data: null, isLoading: true, error: null });
    try {
      const res = method === "delete"
        ? await api.delete<{ data: TRes }>(url)
        : await api[method]<{ data: TRes }>(url, body);
      const result = res.data.data ?? res.data as TRes;
      setState({ data: result, isLoading: false, error: null });
      return result;
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } }; message?: string })
        ?.response?.data?.error ?? (e as Error)?.message ?? "Request failed";
      setState(s => ({ ...s, isLoading: false, error: msg }));
      return null;
    }
  }, [method, url]);

  return { ...state, mutate };
}
